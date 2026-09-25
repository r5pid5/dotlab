const make=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function mix(source,layer,strength){const out=make(source.width,source.height),x=out.getContext('2d');x.drawImage(source,0,0);x.globalAlpha=clamp(strength/100);x.drawImage(layer,0,0);return out;}
function organic(source,fx){
 const {width:w,height:h}=source,out=make(w,h),x=out.getContext('2d');x.drawImage(source,0,0);
 const color=make(w,h),c=color.getContext('2d');c.translate(w/2+(fx.offsetX||0)*w/100,h/2+(fx.offsetY||0)*h/100);c.rotate((fx.angle||0)*Math.PI/180);c.scale(w,h);c.translate(-.5,-.5);
 const amount=clamp((fx.coverage??32)/100,.02,.72),a=amount/32*100,flow=Number(fx.flow)||0;
 c.fillStyle=fx.color;
 if(flow===1){
  // A continuous S-shaped ribbon, with two large photographic openings.
  const t=amount*.52;c.beginPath();c.moveTo(-.3,.12);c.bezierCurveTo(.15,-.08,1.25,.27,.62,.53);c.bezierCurveTo(.04,.76,.11,.92,1.3,1.02);
  c.lineTo(1.3,1.02+t);c.bezierCurveTo(-.18,1.02+t,-.2,.71,.59,.53-t);c.bezierCurveTo(1.04,.28,.02,.08+t,-.3,.12+t);c.closePath();c.fill();
 }else{
  // Edge lobes keep the center of the photograph open; no random holes over faces.
  c.beginPath();c.moveTo(-1,-1);c.lineTo(.07*a,-1);c.lineTo(.07*a,0);
  c.bezierCurveTo(.47*a,.07,.39*a,.18,.10*a,.23);c.bezierCurveTo(-.11,.3,-.07,.43,.18*a,.46);
  c.bezierCurveTo(.45*a,.51,.34*a,.59,.13*a,.62);c.bezierCurveTo(-.08,.69,.02,.87,.18*a,1.1);
  c.lineTo(-1,2);c.closePath();c.fill();
  c.beginPath();c.moveTo(2,-1);c.lineTo(1-.13*a,-1);c.lineTo(1-.13*a,0);
  c.bezierCurveTo(1.10,.19,1-.04*a,.23,1-.19*a,.31);c.bezierCurveTo(1-.52*a,.44,1-.23*a,.53,1-.06*a,.54);
  c.bezierCurveTo(1.10,.55,1.04,.66,1-.18*a,.74);c.bezierCurveTo(1-.46*a,.86,1-.27*a,.98,1-.04*a,1.1);
  c.lineTo(2,2);c.closePath();c.fill();
 }
 x.drawImage(color,0,0);return mix(source,out,fx.strength);
}
export function qualityArt(source,fx){
 if(fx.type==='liquid')return organic(source,fx);
 const {width:w,height:h}=source,u=Math.max(w,h)/1000,out=make(w,h),x=out.getContext('2d',{willReadFrequently:true});x.drawImage(source,0,0);
 const src=x.getImageData(0,0,w,h),dst=x.createImageData(w,h),data=src.data,rand=random(71913),chrome=fx.type==='grunge';
 const soft=make(w,h),sx=soft.getContext('2d');sx.filter=`blur(${Math.max(1,2*u)}px)`;sx.drawImage(source,0,0);const local=sx.getImageData(0,0,w,h).data;
 const hist=new Uint32Array(256);let count=0;for(let i=0;i<data.length;i+=4)if(data[i+3]>100){hist[Math.round(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)]++;count++;}
 let low=0,high=255,sum=0;for(let j=0;j<256;j++){sum+=hist[j];if(sum<count*.015)low=j;if(sum<count*.985)high=j;}
 const span=Math.max(80,high-low),ink=rgb(fx.color||'#111a21'),paper=rgb(fx.paper||'#e9fbff');
 const lights=make(w,h),lx=lights.getContext('2d'),bright=lx.createImageData(w,h),shift=Math.round((fx.aberration||0)*u);
 for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){
  const i=(y*w+xx)*4,r=data[i],g=data[i+1],b=data[i+2],lum=r*.2126+g*.7152+b*.0722;
  const ll=local[i]*.2126+local[i+1]*.7152+local[i+2]*.0722;
  let v=clamp((lum-low)/span),detail=(lum-ll)/255;
  const noise=(rand()+rand()+rand()-1.5)*(fx.noise??25)*.42;
  if(chrome){
   // Silver print: deep graphite shadows, a steep silver shoulder, fine etched detail.
   const contrast=(fx.density??132)/100;
   v=clamp((v-.5)*(1.1+contrast*.55)+.5+detail*1.7);v=v*v*(3-2*v);
   const hatch=(Math.sin(xx*1.9+Math.sin(y*.031))*.5+Math.sin((xx+y)*2.4)*.5)*3.5*u;
   for(let k=0;k<3;k++)dst.data[i+k]=clamp(ink[k]+(paper[k]-ink[k])*v+noise+hatch,0,255);
  }else{
   const sat=1.34,rr=data[(y*w+Math.min(w-1,xx+shift))*4],bb=data[(y*w+Math.max(0,xx-shift))*4+2];
   const channels=[rr,g,bb];for(let k=0;k<3;k++){
    let c=lum+(channels[k]-lum)*sat;c=(c-125)*1.13+125;
    // Warm highlights and lilac shadows, preserving midtone detail.
    c+=k===0?12*Math.sin(v*Math.PI):k===1?-4:k===2?13*(1-v)-5*v:0;
    dst.data[i+k]=clamp(c+noise,0,255);
   }
  }
  dst.data[i+3]=data[i+3];
  const t=clamp((v-.72)/.28),highlight=t*t*(3-2*t);
  bright.data[i]=chrome?210:255;bright.data[i+1]=chrome?245:199;bright.data[i+2]=chrome?255:223;
  bright.data[i+3]=highlight*data[i+3];
 }
 x.putImageData(dst,0,0);lx.putImageData(bright,0,0);
 x.save();x.globalCompositeOperation='screen';x.globalAlpha=(fx.bloom??40)/100*.9;
 x.filter=`blur(${Math.max(1,fx.size)*u}px)`;x.drawImage(lights,0,0);
 x.globalAlpha*=.45;x.filter=`blur(${Math.max(1,fx.size*2.6)*u}px)`;x.drawImage(lights,0,0);x.restore();
 if(chrome){
  x.save();x.lineWidth=.45*u;for(let i=0;i<(fx.scratches??24)*2;i++){
   const xx=rand()*w,yy=rand()*h,len=(.015+rand()*.16)*h;
   x.strokeStyle=i%3?'#eefcff':'#071019';x.globalAlpha=.045+rand()*.09;
   x.beginPath();x.moveTo(xx,yy);x.lineTo(xx+(rand()-.5)*2*u,yy+len);x.stroke();
  }x.restore();
 }
 x.globalCompositeOperation='destination-in';x.drawImage(source,0,0);return mix(source,out,fx.strength);
}
