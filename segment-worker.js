import * as ort from './assets/ort.wasm.min.mjs';
ort.env.wasm.wasmPaths=new URL('./assets/',import.meta.url).href;ort.env.wasm.numThreads=1;
let session,sessionQuality;
const canvas=(w,h)=>new OffscreenCanvas(Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
async function modelData(quality,requestId){
 if(quality==='fast')return new URL('./assets/u2netp.onnx',import.meta.url).href;
 if(quality==='balanced'){
  const parts=[];for(let i=0;i<3;i++){const r=await fetch(new URL(`./assets/silueta-part-${i}.bin`,import.meta.url));if(!r.ok)throw Error('모델 파일을 읽지 못했어요.');parts.push(new Uint8Array(await r.arrayBuffer()));}const data=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const p of parts){data.set(p,offset);offset+=p.length;}return data;
 }
 const response=await fetch(new URL('./assets/segmentation-models.json',import.meta.url));if(!response.ok)throw Error('모델 정보를 불러오지 못했어요.');
 const model=(await response.json())[quality==='anime'?'anime':'photo'],bytes=new Uint8Array(model.bytes);let offset=0;
 for(const part of model.parts){
  const r=await fetch(new URL('./assets/'+part.file,import.meta.url));if(!r.ok)throw Error('누끼 모델 파일이 빠졌어요. assets 폴더를 확인해주세요.');const chunk=new Uint8Array(await r.arrayBuffer());
  if(chunk.length!==part.bytes)throw Error('모델 파일이 완전히 받아지지 않았어요.');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',chunk)),v=>v.toString(16).padStart(2,'0')).join('');if(hash!==part.sha256)throw Error('모델 파일이 손상됐어요. 다시 불러와주세요.');
  bytes.set(chunk,offset);offset+=chunk.length;self.postMessage({status:'loading',requestId,progress:Math.round(offset/bytes.length*100)});
 }return bytes;
}
self.onmessage=async({data:{image,requestId,quality='precise',angles=false}})=>{
 try{
  if(!['precise','anime','balanced','fast'].includes(quality))quality='precise';
  self.postMessage({status:'loading',requestId});
  if(!session||sessionQuality!==quality){if(session){await session.release();session=null;}const model=await modelData(quality,requestId);session=await ort.InferenceSession.create(model,{executionProviders:['wasm'],graphOptimizationLevel:quality==='precise'?'disabled':'all',enableCpuMemArena:false,enableMemPattern:false});sessionQuality=quality;}
  const N=quality==='precise'?512:quality==='anime'?1024:320,scale=Math.min(1,1600/Math.max(image.width,image.height)),width=Math.round(image.width*scale),height=Math.round(image.height*scale),mask=new Uint8ClampedArray(width*height),rotations=quality==='anime'&&angles?[0,-45,45,180]:[0];
  const work=canvas(N,N),ctx=work.getContext('2d',{willReadFrequently:true}),mapped=canvas(width,height),mx=mapped.getContext('2d',{willReadFrequently:true});
  for(let step=0;step<rotations.length;step++){
   self.postMessage({status:'running',requestId,step:step+1,total:rotations.length});const angle=rotations[step]*Math.PI/180;
   ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,N,N);let k=1;
   if(quality==='anime'){
    k=Math.min(N/(Math.abs(Math.cos(angle))*image.width+Math.abs(Math.sin(angle))*image.height),N/(Math.abs(Math.sin(angle))*image.width+Math.abs(Math.cos(angle))*image.height));
    ctx.save();ctx.translate(N/2,N/2);ctx.rotate(angle);ctx.scale(k,k);ctx.drawImage(image,-image.width/2,-image.height/2);ctx.restore();
   }else ctx.drawImage(image,0,0,N,N);
   const rgba=ctx.getImageData(0,0,N,N).data,pixels=new Float32Array(3*N*N),mean=[.485,.456,.406],std=[.229,.224,.225];let peak=255;
   if(quality==='fast'||quality==='balanced'){peak=1;for(let i=0;i<rgba.length;i+=4)peak=Math.max(peak,rgba[i],rgba[i+1],rgba[i+2]);}
   for(let i=0;i<N*N;i++)for(let c=0;c<3;c++){const v=rgba[i*4+c]/peak;pixels[c*N*N+i]=quality==='anime'?v:(v-mean[c])/std[c];}
   const input=new ort.Tensor('float32',pixels,[1,3,N,N]),results=await session.run({[session.inputNames[0]]:input}),raw=results[session.outputNames[0]].data;
   let min=0,max=1;if(quality==='fast'||quality==='balanced'){min=Infinity;max=-Infinity;for(const v of raw){min=Math.min(min,v);max=Math.max(max,v);}}
   const rgbaMask=ctx.createImageData(N,N);for(let i=0;i<N*N;i++){const v=quality==='precise'?1/(1+Math.exp(-raw[i])):(raw[i]-min)/Math.max(.00001,max-min);rgbaMask.data[i*4]=rgbaMask.data[i*4+1]=rgbaMask.data[i*4+2]=255;rgbaMask.data[i*4+3]=Math.max(0,Math.min(1,v))*255;}ctx.putImageData(rgbaMask,0,0);
   mx.setTransform(1,0,0,1,0,0);mx.clearRect(0,0,width,height);mx.save();
   if(quality==='anime'){mx.translate(width/2,height/2);mx.scale(width/image.width,height/image.height);mx.rotate(-angle);mx.scale(1/k,1/k);mx.drawImage(work,-N/2,-N/2);}else mx.drawImage(work,0,0,width,height);mx.restore();
   const d=mx.getImageData(0,0,width,height).data;for(let i=0;i<mask.length;i++)mask[i]=Math.max(mask[i],d[i*4+3]);for(const tensor of Object.values(results))tensor.dispose();input.dispose();
  }
  self.postMessage({status:'done',mask,width,height,requestId},[mask.buffer]);
 }catch(error){self.postMessage({status:'error',message:String(error.message||error),requestId});}finally{image?.close();}
};
