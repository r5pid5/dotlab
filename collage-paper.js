const make=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
const random=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
export function paperTexture(style){
 const c=make(1000,1000),x=c.getContext('2d'),rnd=random(38491),cream=style==='cream';
 const pixels=x.createImageData(1000,1000),base=cream?[242,231,205]:[113,157,129];
 for(let y=0;y<1000;y++)for(let px=0;px<1000;px++){
  const i=(y*1000+px)*4,v=(rnd()-.5)*(cream?15:24)+Math.sin(px*.035+y*.013)*1.2;
  for(let k=0;k<3;k++)pixels.data[i+k]=base[k]+v;pixels.data[i+3]=255;
 }x.putImageData(pixels,0,0);
 if(!cream){
  // Uneven printed ink, broad worn patches, and interrupted paper folds.
  x.globalCompositeOperation='soft-light';
  for(let i=0;i<85;i++){const cx=rnd()*1000,cy=rnd()*1000,r=20+rnd()*210,g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,i%3?'#ffffeb52':'#0a423866');g.addColorStop(1,'#ffffff00');x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2);}
  x.globalCompositeOperation='source-over';
  for(let i=0;i<4200;i++){const px=rnd()*1000,py=rnd()*1000,len=1+Math.pow(rnd(),6)*65;x.strokeStyle=i%3?'#f7f3d825':'#254e3222';x.lineWidth=.4+rnd()*1.2;x.beginPath();x.moveTo(px,py);x.lineTo(px+len,py+len*.14*(rnd()-.5));x.stroke();}
  for(const [y,slope]of [[220,.015],[566,-.01],[797,.005]]){x.save();x.translate(0,y);x.rotate(slope);const g=x.createLinearGradient(0,-9,0,9);g.addColorStop(0,'#153e2000');g.addColorStop(.42,'#16392516');g.addColorStop(.55,'#ffffed38');g.addColorStop(1,'#ffffff00');x.fillStyle=g;x.fillRect(0,-9,1000,18);x.restore();}
 }
 for(let i=0;i<2300;i++){x.fillStyle=i%2?'#fffcec19':'#74664a16';const px=rnd()*1000,py=rnd()*1000;x.fillRect(px,py,.5+rnd(),1+rnd()*3);}
 return c;
}
export function tornStrip(width,height,color='#fffdf0',seed=21){
 const c=make(width+12,height+12),x=c.getContext('2d'),rnd=random(seed);x.fillStyle=color;x.beginPath();
 for(let px=0;px<=width;px+=6){const y=3+rnd()*4;px?x.lineTo(px+6,y):x.moveTo(px+6,y);}
 x.lineTo(width+7,height+5);for(let px=width;px>=0;px-=6)x.lineTo(px+6,height+4+rnd()*4);x.closePath();x.fill();
 x.globalCompositeOperation='source-atop';for(let i=0;i<width*height/80;i++){x.fillStyle=i%3?'#847a5420':'#ffffff60';x.fillRect(rnd()*c.width,rnd()*c.height,1,1);}return c;
}
export function receipt(){
 const c=tornStrip(205,320,'#f6f3e8',399),x=c.getContext('2d');x.fillStyle='#43473c';x.textAlign='center';x.font='700 19px monospace';x.fillText('test',108,40);x.font='12px monospace';x.fillText('test',108,62);
 x.strokeStyle='#74776b';x.lineWidth=.7;x.setLineDash([2,3]);for(const y of [77,249,288]){x.beginPath();x.moveTo(25,y);x.lineTo(189,y);x.stroke();}x.setLineDash([]);x.font='10px monospace';x.textAlign='left';
 for(let i=0;i<6;i++){x.fillText('test',27,104+i*22);x.textAlign='right';x.fillText('test',187,104+i*22);x.textAlign='left';}
 const rnd=random(242);x.fillStyle='#43473c';for(let i=28;i<188;i+=3)x.fillRect(i,264,1+rnd(),16);return c;
}
