const cache=new WeakMap();
export function tintedCamera(asset,color){
 if(color==='#c0c0c0')return asset;
 let colors=cache.get(asset);if(!colors){colors=new Map();cache.set(asset,colors);}if(colors.has(color))return colors.get(color);
 const c=Object.assign(document.createElement('canvas'),{width:asset.width,height:asset.height}),x=c.getContext('2d');x.drawImage(asset,0,0);
 const image=x.getImageData(0,0,c.width,c.height),d=image.data,target=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 // Preserve the neutral LCD bezel, metallic controls and lens switches.
 const neutral=(xx,yy)=>{const px=xx/c.width*1536,py=yy/c.height*1024;return(px>116&&px<1100&&py>170&&py<883)||(py<110)||((px-1272)**2+(py-606)**2<139**2)||[[1195,397,49],[1362,423,48],[1195,813,49],[1364,811,48]].some(([a,b,r])=>(px-a)**2+(py-b)**2<r*r);};
 for(let yy=0;yy<c.height;yy++)for(let xx=0;xx<c.width;xx++){
  const i=(yy*c.width+xx)*4;if(!d[i+3]||neutral(xx,yy))continue;
  const l=(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/255,spec=Math.max(0,(l-.75)/.25);
  for(let k=0;k<3;k++){const base=target[k]*Math.pow(l,.8)*1.15;d[i+k]=Math.min(255,base+(255-base)*spec*.75);}
 }
 x.putImageData(image,0,0);colors.set(color,c);if(colors.size>12)colors.delete(colors.keys().next().value);return c;
}
