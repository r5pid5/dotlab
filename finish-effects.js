const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
export function paletteFor(source,count,theme){
 const themes={ice:['#30354f','#56618b','#94a7d0','#e0eeff'],mono:['#191919','#fbf6e7'],gameboy:['#123c31','#376b43','#91ad58','#dce6a0'],candy:['#654e83','#b690c8','#efb5ce','#fff4d8']};
 if(themes[theme]){const stops=themes[theme].map(rgb);return Array.from({length:count},(_,i)=>{const p=i/(count-1)*(stops.length-1),j=Math.floor(p),t=p-j;return stops[j].map((c,k)=>Math.round(c+(stops[Math.min(j+1,stops.length-1)][k]-c)*t))})}
 const d=source.getContext('2d').getImageData(0,0,source.width,source.height).data,pts=[];for(let i=0;i<d.length;i+=Math.max(4,Math.floor(d.length/48000/4)*4))if(d[i+3]>20)pts.push([d[i],d[i+1],d[i+2]]);if(!pts.length)return [[0,0,0],[255,255,255]];
 const boxes=[pts];while(boxes.length<count){boxes.sort((a,b)=>b.length-a.length);const box=boxes.shift();if(box.length<2){boxes.push(box);break;}const ranges=[0,1,2].map(k=>Math.max(...box.map(p=>p[k]))-Math.min(...box.map(p=>p[k]))),axis=ranges.indexOf(Math.max(...ranges));box.sort((a,b)=>a[axis]-b[axis]);boxes.push(box.slice(0,box.length>>1),box.slice(box.length>>1))}return boxes.map(b=>[0,1,2].map(k=>Math.round(b.reduce((n,p)=>n+p[k],0)/b.length)));
}
export function finishEffect(source,fx){
 const w=source.width,h=source.height,u=Math.max(w,h)/1000,out=canvas(w,h),x=out.getContext('2d');
 if(fx.type==='pastel'){x.filter='saturate(65%) contrast(78%) brightness(117%)';x.drawImage(source,0,0);x.filter=`blur(${(3+fx.bloom/8)*u}px)`;x.globalCompositeOperation='screen';x.globalAlpha=fx.bloom/150;x.drawImage(source,0,0);x.filter='none';x.globalAlpha=.22;const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#f4bdf9');g.addColorStop(.55,'#c8d8fa');g.addColorStop(1,'#f5ffd2');x.fillStyle=g;x.fillRect(0,0,w,h);x.globalAlpha=1;x.globalCompositeOperation='source-over';const d=x.getImageData(0,0,w,h);let seed=7;for(let i=0;i<d.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=(seed/4294967296-.5)*fx.noise*.65;for(let k=0;k<3;k++)d.data[i+k]+=n;}x.putImageData(d,0,0);
 }else{
 const cell=Math.max(1,(fx.dotSize??3)*u),sw=Math.max(1,Math.round(w/cell)),sh=Math.max(1,Math.round(h/cell)),small=canvas(sw,sh),sx=small.getContext('2d',{willReadFrequently:true});sx.drawImage(source,0,0,sw,sh);const d=sx.getImageData(0,0,sw,sh),p=paletteFor(small,Number(fx.colors)||4,fx.palette||'ice'),work=Float32Array.from(d.data),bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
 for(let y=0;y<sh;y++)for(let xx=0;xx<sw;xx++){const i=(y*sw+xx)*4;const offset=fx.dither==='ordered'?(bayer[y%4*4+xx%4]/16-.5)*70:0,old=[work[i]+offset,work[i+1]+offset,work[i+2]+offset];let best=p[0],dist=Infinity;for(const col of p){const dd=col.reduce((n,c,k)=>n+(c-old[k])**2,0);if(dd<dist){dist=dd;best=col}}for(let k=0;k<3;k++){d.data[i+k]=best[k];if(fx.dither==='floyd'){const e=work[i+k]-best[k];for(const [dx,dy,v]of [[1,0,7],[-1,1,3],[0,1,5],[1,1,1]])if(xx+dx>=0&&xx+dx<sw&&y+dy<sh)work[((y+dy)*sw+xx+dx)*4+k]+=e*v/16}}}sx.putImageData(d,0,0);x.imageSmoothingEnabled=false;x.drawImage(small,0,0,w,h);
 }
 const mixed=canvas(w,h),mx=mixed.getContext('2d');mx.drawImage(source,0,0);mx.globalAlpha=fx.strength/100;mx.drawImage(out,0,0);return mixed;
}
export function styledText(ctx,line,y,l,u){
 const thick=(l.thickness??7)*u,size=l.size*u;
 ctx.lineJoin='round';ctx.miterLimit=2;
 if(['label','pill','bubble'].includes(l.textStyle)){const tw=ctx.measureText(line).width,pad=size*.25;ctx.save();ctx.fillStyle=l.strokeColor||'#fffbd8';ctx.beginPath();ctx.roundRect(-tw/2-pad,y-size*.58,tw+pad*2,size*1.16,l.textStyle==='label'?2*u:size*.55);ctx.fill();if(l.textStyle==='bubble'){ctx.beginPath();ctx.moveTo(tw*.2,y+size*.53);ctx.lineTo(tw*.4,y+size*.8);ctx.lineTo(tw*.4,y+size*.53);ctx.fill()}ctx.restore();ctx.fillStyle=l.color;ctx.fillText(line,0,y);return}
 if(l.textStyle==='offset'){ctx.save();ctx.fillStyle=l.strokeColor||'#282731';ctx.fillText(line,thick*.75,y+thick);ctx.restore();ctx.strokeStyle=l.strokeColor||'#282731';ctx.lineWidth=thick*.4;ctx.strokeText(line,0,y);ctx.fillStyle=l.color;ctx.fillText(line,0,y);return}
 if(l.textStyle==='outline'){ctx.lineWidth=thick*.4;ctx.strokeStyle=l.color;ctx.strokeText(line,0,y);return}
 if(l.textStyle==='jelly'){
  ctx.shadowColor=l.color;ctx.shadowBlur=7*u;ctx.shadowOffsetY=5*u;ctx.strokeStyle=l.color;ctx.lineWidth=thick*2.8;ctx.strokeText(line,0,y+2*u);ctx.shadowBlur=ctx.shadowOffsetY=0;ctx.strokeStyle='#fff9f5';ctx.lineWidth=thick*1.85;ctx.strokeText(line,0,y);ctx.strokeStyle=l.color;ctx.lineWidth=thick*1.1;ctx.strokeText(line,0,y);
  const g=ctx.createLinearGradient(0,y-size*.5,0,y+size*.5);g.addColorStop(0,'#fff9ff');g.addColorStop(.32,l.color);g.addColorStop(.48,'#fff0f8');g.addColorStop(.58,l.color);g.addColorStop(1,'#9b315b');ctx.fillStyle=g;ctx.fillText(line,0,y);
 }else if(l.textStyle==='chrome'){
  ctx.strokeStyle='#ffffff';ctx.lineWidth=thick;ctx.strokeText(line,0,y);const g=ctx.createLinearGradient(0,y-size*.5,0,y+size*.5);for(const [p,c] of [[0,'#182232'],[.25,'#d9ecff'],[.48,'#ffffff'],[.5,'#33415b'],[.74,'#a1bdd6'],[1,'#eefaff']])g.addColorStop(p,c);ctx.fillStyle=g;ctx.fillText(line,0,y);
 }else if(l.textStyle==='sticker'){ctx.strokeStyle=l.strokeColor||'#ffffff';ctx.lineWidth=thick*2;ctx.strokeText(line,0,y);ctx.fillStyle=l.color;ctx.fillText(line,0,y);
 }else if(l.textStyle==='neon'){ctx.shadowColor=l.color;ctx.shadowBlur=18*u;ctx.fillStyle=l.color;ctx.fillText(line,0,y);ctx.shadowBlur=6*u;ctx.strokeStyle='#ffffff';ctx.lineWidth=1*u;ctx.strokeText(line,0,y);
 }else if(l.outline)ctx.strokeText(line,0,y);else ctx.fillText(line,0,y);
}
export function decoratedFrame(ctx,s,w,h,assets){
 const f=s.frame,u=Math.max(w,h)/1000,b=f.width*u;
 if(['filigree','lace'].includes(f.type)){const img=assets.get('frame-'+f.type);if(!img)return false;const c=canvas(w,h),x=c.getContext('2d');x.drawImage(img,0,0,w,h);x.globalCompositeOperation='source-in';x.fillStyle=f.color;x.fillRect(0,0,w,h);ctx.save();const inset=Math.max(0,(f.width-24)*u);ctx.drawImage(c,inset,inset,w-inset*2,h-inset*2);ctx.restore();return true}
 if(['double','checker','film','ribbon'].includes(f.type)){ctx.save();ctx.strokeStyle=f.color;ctx.fillStyle=f.color;if(f.type==='double'){ctx.lineWidth=2*u;ctx.strokeRect(b/2,b/2,w-b,h-b);ctx.lineWidth=5*u;ctx.strokeRect(b,b,w-2*b,h-2*b)}else if(f.type==='ribbon'){ctx.lineWidth=2*u;ctx.strokeRect(b,b,w-b*2,h-b*2);ctx.font=`${b*2}px Georgia`;ctx.textAlign='center';ctx.textBaseline='middle';for(const [x,y]of [[b,b],[w-b,b],[b,h-b],[w-b,h-b]])ctx.fillText('୨୧',x,y)}else{ctx.fillRect(0,0,w,b);ctx.fillRect(0,h-b,w,b);ctx.fillRect(0,0,b,h);ctx.fillRect(w-b,0,b,h);ctx.fillStyle='#151515';const gap=Math.max(6,b*.4);for(let p=gap;p<w-gap;p+=gap*2){ctx.fillRect(p,b*.28,gap,b*.44);ctx.fillRect(p,h-b*.72,gap,b*.44)}if(f.type==='checker')for(let p=gap;p<h-gap;p+=gap*2){ctx.fillRect(b*.28,p,b*.44,gap);ctx.fillRect(w-b*.72,p,b*.44,gap)}}ctx.restore();return true}return false;
}
