const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:Math.round(w),height:Math.round(h)});
function cover(ctx,img,box){const [x,y,w,h]=box,k=Math.max(w/img.width,h/img.height);ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(img,x+(w-img.width*k)/2,y+(h-img.height*k)/2,img.width*k,img.height*k);ctx.restore();}
export function punchComposite(source,s,patternCanvas,time=0){
 const {width:w,height:h}=source,p=s.punch,u=Math.max(w,h)/1000,g=p.gap*u,m=p.margin*u,out=canvas(w,h),x=out.getContext('2d');
 x.fillStyle=p.paper;x.fillRect(0,0,w,h);
 const iw=w-2*m,ih=h-2*m,topH=p.layout==='collage'?(ih-g)*.68:ih;
 const vertical=p.layout!=='horizontal',ratio=p.split/100;
 const a=vertical?[m,m,(iw-g)*ratio,topH]:[m,m,iw,(topH-g)*ratio];
 const b=vertical?[m+a[2]+g,m,iw-a[2]-g,topH]:[m,m+a[3]+g,iw,topH-a[3]-g];
 for(const [i,box]of [a,b].entries()){
  const [bx,by,bw,bh]=box,photo=canvas(bw,bh),px=photo.getContext('2d');cover(px,source,[0,0,bw,bh]);
  const pat=patternCanvas({...s,pattern:{...s.pattern,enabled:true,multicolor:false,color:p.color,opacity:100,offsetX:s.pattern.offsetX||0,offsetY:s.pattern.offsetY||0}},photo.width,photo.height,time);
  // Identical seeded shapes form a positive/negative pair in the two panels.
  const ink=canvas(bw,bh),ix=ink.getContext('2d');ix.fillStyle=p.color;ix.fillRect(0,0,bw,bh);
  ix.globalCompositeOperation=((i===1)!==p.invert)?'destination-out':'destination-in';ix.drawImage(pat,0,0);
  px.drawImage(ink,0,0);x.drawImage(photo,bx,by,bw,bh);
 }
 if(p.layout==='collage')cover(x,source,[m,m+topH+g,iw,ih-topH-g]);
 return out;
}
