import {initialState,canvasOf,render,dimensions} from './renderer.js';
import {textLayer} from './type-templates.js';
import {paperTexture,tornStrip,receipt} from './collage-paper.js';

const imageLayer=(a,asset,props={})=>({id:a.uid(),kind:'image',asset,x:.5,y:.5,size:1000,rotation:0,opacity:100,visible:true,shadow:false,paperBorder:0,borderColor:'#fffdf1',brightness:100,saturation:100,blur:0,mask:'none',...props});
const fit=(img,w,h)=>Math.min(w,h*img.width/img.height);
const cutoutKey=s=>[s.photo,s.mask,s.maskInvert,s.maskSoft,s.maskExpand,s.maskMatte,s.maskThreshold].join(':');

export async function refreshCollageSubject(a){
 const layer=a.state.layers.find(l=>l.collageRole==='subject'),key=cutoutKey(a.state);
 if(!layer||!a.state.mask||layer.cutoutSignature===key)return;
 const s=a.state,base={...initialState(),photo:s.photo,mask:s.mask,maskInvert:s.maskInvert,maskSoft:s.maskSoft,maskExpand:s.maskExpand,maskMatte:s.maskMatte,maskThreshold:s.maskThreshold};
 const [w,h]=dimensions(base,a.assets,1600),c=canvasOf(w,h),{subject}=render(base,a.assets,c);if(!subject)return;
 const data=subject.getContext('2d').getImageData(0,0,w,h).data;let left=w,top=h,right=0,bottom=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>40){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 if(right<=left||bottom<=top)return;
 const out=canvasOf(right-left+1,bottom-top+1);out.getContext('2d').drawImage(subject,left,top,out.width,out.height,0,0,out.width,out.height);const asset=await a.loadImage(out.toDataURL());
 if(!a.state.layers.includes(layer)||cutoutKey(a.state)!==key)return;
 layer.asset=asset;layer.cutoutSignature=key;a.refresh();
}

export async function cutoutCollage(a,style='paper'){
 if(!a.state.photo){a.toast('콜라주에 쓸 사진을 먼저 불러와주세요.');return;}
 if(!a.state.mask){a.toast('콜라주에 쓸 피사체를 찾고 있어요…');await a.segment();}if(!a.state.mask)return;
 const sourceId=a.state.photo;
 // Extract in the original photo coordinates, independent of the current template.
 const minimal={...initialState(),photo:sourceId,mask:a.state.mask,maskInvert:a.state.maskInvert,maskSoft:a.state.maskSoft,maskExpand:a.state.maskExpand,maskMatte:a.state.maskMatte,maskThreshold:a.state.maskThreshold};
 const [w,h]=dimensions(minimal,a.assets,1600),c=canvasOf(w,h),{subject}=render(minimal,a.assets,c);
 if(!subject)throw Error('피사체가 준비되지 않았습니다.');
 const d=subject.getContext('2d').getImageData(0,0,w,h).data;let x0=w,y0=h,x1=0,y1=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>40){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<=x0||y1<=y0)throw Error('선택 영역이 비어 있어요. 누끼 도구에서 피사체를 선택해주세요.');
 const trimmed=canvasOf(x1-x0+1,y1-y0+1);trimmed.getContext('2d').drawImage(subject,x0,y0,trimmed.width,trimmed.height,0,0,trimmed.width,trimmed.height);
 const asset=await a.loadImage(trimmed.toDataURL()),paper=style==='paper';
 const next={...initialState(),photo:sourceId,mask:a.state.mask,segmentationQuality:a.state.segmentationQuality,segmentationAngles:a.state.segmentationAngles,maskThreshold:a.state.maskThreshold,maskSoft:a.state.maskSoft,maskExpand:a.state.maskExpand,maskMatte:a.state.maskMatte,maskInvert:a.state.maskInvert,ratio:'1:1',name:paper?'그린 스크랩 콜라주':'크림 오브젝트 콜라주',blank:true,collageStyle:paper?'paper':'cream'};
 next.frame.color=paper?'#719d81':'#f2e7cd';
 const bg=await a.loadImage(paperTexture(next.collageStyle).toDataURL());
 const layers=[imageLayer(a,bg,{collageRole:'background'})];
 // Reuse different user-added photos once each; template paper and old heroes are excluded.
 const seen=new Set([sourceId]),extras=a.state.layers.filter(l=>{if(l.kind!=='image'||l.collageRole&&l.collageRole!=='extra'||seen.has(l.asset))return false;seen.add(l.asset);return true;}).slice(0,3);
 const hero=imageLayer(a,asset,{collageRole:'subject',cutoutSignature:cutoutKey(a.state),x:paper?.29:.68,y:paper?.52:.48,size:fit(trimmed,paper?540:730,paper?830:920),rotation:paper?-8:-9,paperBorder:paper?9:7,borderColor:paper?'#fffdf1':'#354a2d',paperRoughness:paper?40:60,shadow:false,saturation:96});
 if(paper){
  const slip=await a.loadImage(receipt().toDataURL());layers.push(imageLayer(a,slip,{collageRole:'paper',x:.82,y:.15,size:190,rotation:8,shadow:true}));
  if(extras.length){hero.x=.21;hero.y=.33;hero.size=fit(trimmed,410,570);hero.rotation=-10;}
  layers.push(hero);
  const places=[[.77,.75,470,530,10],[.15,.86,340,340,-12],[.15,.08,265,290,13]];
  extras.forEach((l,i)=>{const img=a.assets.get(l.asset);if(!img)return;const [x,y,mw,mh,rotation]=places[i];layers.push({...l,id:a.uid(),collageRole:'extra',x,y,size:fit(img,mw,mh),rotation,paperBorder:8,borderColor:'#fffdf1',paperRoughness:40,shadow:false});});
  for(const [x,y,width,angle,seed]of [[.745,.335,390,5,89],[.77,.47,378,-4,188]]){
   const strip=await a.loadImage(tornStrip(width,126,'#fffdf1',seed).toDataURL());layers.push(imageLayer(a,strip,{collageRole:'paper',x,y,size:width,rotation:angle}));
   layers.push(textLayer('Pretendard','plain',{x,y:y-.005,size:135,color:'#243fb8',bold:true,tracking:-4,rotation:angle}));
  }
  layers.push(textLayer('Pretendard','plain',{x:.75,y:.88,size:24,color:'#fffdf0',bold:false,tracking:3}));
  layers.push(textLayer('Pretendard','plain',{x:.78,y:.925,size:18,color:'#fffdf0',bold:false,tracking:2}));
 }else{
  layers.push(hero);
  if(extras.length){hero.size=fit(trimmed,640,810);hero.x=.68;hero.y=.42;extras.forEach((l,i)=>{const img=a.assets.get(l.asset);if(img)layers.push({...l,id:a.uid(),collageRole:'extra',x:extras.length===1?.72:.36+i*.26,y:.86,size:fit(img,extras.length===1?430:270,320),rotation:8-i*6,paperBorder:7,borderColor:'#354a2d',paperRoughness:60,shadow:false});});}
  layers.push(textLayer('Courier New','plain',{x:.18,y:.53,size:30,color:'#303e28',bold:true,tracking:1.7,rotation:-5}));
  layers.push(textLayer('Courier New','plain',{x:.17,y:.575,size:26,color:'#303e28',bold:false,tracking:1.5,rotation:-5}));
  layers.push(textLayer('Courier New','pill',{x:.19,y:.65,size:30,color:'#fff8e7',labelColor:'#434a32',bold:true,paddingX:22,paddingY:10,radius:40,rotation:-8,shadow:false}));
  layers.push(textLayer('Courier New','plain',{x:.15,y:.77,size:24,color:'#303e28',bold:true,tracking:1.7,rotation:-5}));
  layers.push(textLayer('Courier New','plain',{x:.17,y:.81,size:24,color:'#303e28',bold:true,tracking:1.7,rotation:-5}));
 }
 next.layers=layers;a.mutate(()=>Object.assign(a.state,next));a.selectLayer(null);a.switchTool('layout');
 a.toast(`피사체 ${extras.length?extras.length+1+'장':'한 장'}으로 ${paper?'그린 스크랩':'크림 오브젝트'} 콜라주를 만들었어요. 사진과 글자는 각각 움직일 수 있어요.`);
}
