const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
export function lineArt(source,fx){
 const w=source.width,h=source.height,u=Math.max(w,h)/1000,pre=canvas(w,h),x=pre.getContext('2d');x.filter=`blur(${Math.max(.6,(fx.size??10)*.15*u)}px)`;x.drawImage(source,0,0);
 const d=x.getImageData(0,0,w,h).data,gray=new Float32Array(w*h),mag=new Float32Array(w*h),dir=new Uint8Array(w*h);
 for(let i=0;i<gray.length;i++)gray[i]=d[i*4]*.2126+d[i*4+1]*.7152+d[i*4+2]*.0722;
 for(let y=1;y<h-1;y++)for(let xx=1;xx<w-1;xx++){
  const p=y*w+xx,gx=-gray[p-w-1]-2*gray[p-1]-gray[p+w-1]+gray[p-w+1]+2*gray[p+1]+gray[p+w+1],gy=-gray[p-w-1]-2*gray[p-w]-gray[p-w+1]+gray[p+w-1]+2*gray[p+w]+gray[p+w+1];
  mag[p]=Math.hypot(gx,gy);dir[p]=Math.round((Math.atan2(gy,gx)+Math.PI)*4/Math.PI)%4;
 }
 const high=Math.max(12,115-(fx.density??95)*.52),low=high*.48,edges=new Uint8Array(w*h),queue=new Int32Array(w*h);let n=0;
 const delta=[1,w+1,w,w-1];for(let y=1;y<h-1;y++)for(let xx=1;xx<w-1;xx++){const p=y*w+xx,k=delta[dir[p]],v=mag[p];if(v>=low&&v>=mag[p-k]&&v>=mag[p+k]){edges[p]=v>=high?2:1;if(edges[p]===2)queue[n++]=p;}}
 for(let i=0;i<n;i++){const p=queue[i];for(const off of [-w-1,-w,-w+1,-1,1,w-1,w,w+1]){const j=p+off;if(j>0&&j<edges.length&&edges[j]===1){edges[j]=2;queue[n++]=j;}}}
 const mask=canvas(w,h),mx=mask.getContext('2d'),md=mx.createImageData(w,h);for(let p=0;p<edges.length;p++){md.data[p*4]=md.data[p*4+1]=md.data[p*4+2]=255;md.data[p*4+3]=edges[p]===2?255:0;}mx.putImageData(md,0,0);
 const ink=canvas(w,h),ix=ink.getContext('2d'),radius=Math.max(0,((fx.lineWidth??1.3)*u-1)/2);ix.drawImage(mask,0,0);
 if(radius>.15)for(let i=0;i<12;i++)ix.drawImage(mask,Math.cos(i*Math.PI/6)*radius,Math.sin(i*Math.PI/6)*radius);
 ix.globalCompositeOperation='source-in';ix.fillStyle=fx.color;ix.fillRect(0,0,w,h);
 const out=canvas(w,h),ox=out.getContext('2d');if(fx.lineOverlay)ox.drawImage(source,0,0);else{ox.fillStyle=fx.paper;ox.fillRect(0,0,w,h);}ox.drawImage(ink,0,0);
 const final=canvas(w,h),f=final.getContext('2d');f.drawImage(source,0,0);f.globalAlpha=fx.strength/100;f.drawImage(out,0,0);return final;
}
