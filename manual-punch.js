const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:Math.max(1,Math.round(w)),height:Math.max(1,Math.round(h))});
export function punchPanels(s,w,h){
 const p=s.punch,u=Math.max(w,h)/1000,m=p.margin*u,g=p.gap*u,iw=w-2*m,ih=h-2*m;
 const vertical=p.layout!=='horizontal',th=p.layout==='collage'?(ih-g)*.68:ih,k=p.split/100;
 const first=vertical?{x:m,y:m,w:(iw-g)*k,h:th}:{x:m,y:m,w:iw,h:(th-g)*k};
 const second=vertical?{x:m+first.w+g,y:m,w:iw-first.w-g,h:th}:{x:m,y:m+first.h+g,w:iw,h:th-first.h-g};
 return{photo:p.invert?second:first,board:p.invert?first:second,bottom:p.layout==='collage'?{x:m,y:m+th+g,w:iw,h:ih-th-g}:null};
}
export function drawPunchShape(x,shape,size,rotation=0,outline=false){
 x.save();x.rotate(rotation*Math.PI/180);x.lineJoin='round';const r=size/2;
 if(['●','■','▲','★','✹'].includes(shape)){
  x.beginPath();if(shape==='●')x.arc(0,0,r,0,Math.PI*2);else if(shape==='■')x.rect(-r,-r,size,size);else{
   const n=shape==='▲'?3:shape==='★'?10:32;for(let i=0;i<n;i++){const radius=shape==='▲'||i%2===0?r:r*(shape==='★'?.43:.72),a=-Math.PI/2+i*Math.PI*2/n;i?x.lineTo(Math.cos(a)*radius,Math.sin(a)*radius):x.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);}x.closePath();
  }outline?x.stroke():x.fill();
 }else{x.font=`700 ${size}px Pretendard,"Noto Color Emoji","Segoe UI Emoji",sans-serif`;x.textAlign='center';x.textBaseline='middle';outline?x.strokeText(shape,0,0):x.fillText(shape,0,0);}
 x.restore();
}
function photoCanvas(source,box){const c=canvas(box.w,box.h),x=c.getContext('2d'),k=Math.max(c.width/source.width,c.height/source.height);x.drawImage(source,(c.width-source.width*k)/2,(c.height-source.height*k)/2,source.width*k,source.height*k);return c;}
function boardCanvas(s,w,h){const c=canvas(w,h),x=c.getContext('2d');let fill=s.punch.color;if(s.punch.gradient){fill=x.createLinearGradient(0,0,0,h);fill.addColorStop(0,s.punch.color);fill.addColorStop(1,s.punch.second);}x.fillStyle=fill;x.fillRect(0,0,w,h);return c;}
export function manualPunch(source,s,w,h){
 const out=canvas(w,h),x=out.getContext('2d'),p=s.punch,u=Math.max(w,h)/1000,{photo,board,bottom}=punchPanels(s,w,h);
 x.fillStyle=p.paper;x.fillRect(0,0,w,h);const photoImage=photoCanvas(source,photo),material=boardCanvas(s,photoImage.width,photoImage.height);
 x.drawImage(photoImage,photo.x,photo.y,photo.w,photo.h);x.drawImage(boardCanvas(s,board.w,board.h),board.x,board.y,board.w,board.h);
 for(const item of p.items||[]){
  const sw=photoImage.width,sh=photoImage.height,size=Math.ceil(item.size*u*3+4),half=size/2,c=canvas(size,size),cx=c.getContext('2d');
  cx.translate(half,half);cx.fillStyle='#fff';drawPunchShape(cx,item.shape,item.size*u,item.rotation);cx.setTransform(1,0,0,1,0,0);
  // The cut position and the destination position are stored independently.
  const piece=canvas(size,size),px=piece.getContext('2d');px.drawImage(photoImage,half-item.sourceX*sw,half-item.sourceY*sh);px.globalCompositeOperation='destination-in';px.drawImage(c,0,0);
  cx.globalCompositeOperation='source-in';cx.drawImage(material,half-item.sourceX*sw,half-item.sourceY*sh);
  x.save();x.beginPath();x.rect(photo.x,photo.y,photo.w,photo.h);x.clip();x.drawImage(c,photo.x+item.sourceX*photo.w-half,photo.y+item.sourceY*photo.h-half);x.restore();
  x.save();x.beginPath();x.rect(board.x,board.y,board.w,board.h);x.clip();x.drawImage(piece,board.x+item.x*board.w-half,board.y+item.y*board.h-half);x.restore();
 }
 if(bottom)x.drawImage(photoCanvas(source,bottom),bottom.x,bottom.y,bottom.w,bottom.h);return out;
}
export function punchHit(s,w,h,x,y){const boxes=punchPanels(s,w,h),u=Math.max(w,h)/1000;for(const area of ['board','photo']){const b=boxes[area];if(x<b.x||y<b.y||x>b.x+b.w||y>b.y+b.h)continue;for(const item of [...s.punch.items].reverse()){const cx=b.x+(area==='photo'?item.sourceX:item.x)*b.w,cy=b.y+(area==='photo'?item.sourceY:item.y)*b.h;if(Math.hypot(x-cx,y-cy)<=item.size*u*.65)return{item,area};}}return null;}
export function alignPieces(s,w,h){const b=punchPanels(s,w,h).board,n=s.punch.items.length;if(!n)return;const columns=Math.max(1,Math.min(n,Number(s.punch.columns)||3)),rows=Math.ceil(n/columns);s.punch.items.forEach((p,i)=>{p.x=(i%columns+.5)/columns;p.y=(Math.floor(i/columns)+.5)/rows;});}
