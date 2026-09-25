const cache=new WeakMap();
export function paperOutline(image,layer){
 const key=[layer.size,layer.paperBorder,layer.borderColor,layer.paperRoughness||0].join(':'),previous=cache.get(image);if(previous?.key===key)return previous;
 const width=Math.min(1600,image.width),height=Math.max(1,Math.round(width*image.height/image.width)),radius=Math.min(200,Math.max(1,layer.paperBorder/layer.size*width)),roughness=(layer.paperRoughness||0)/100,pad=Math.ceil(radius*(1+roughness*.3)+2);
 const source=Object.assign(document.createElement('canvas'),{width,height}),sx=source.getContext('2d');sx.drawImage(image,0,0,width,height);sx.globalCompositeOperation='source-in';sx.fillStyle=layer.borderColor||'#ffffff';sx.fillRect(0,0,width,height);
 const canvas=Object.assign(document.createElement('canvas'),{width:width+pad*2,height:height+pad*2}),ctx=canvas.getContext('2d');
 // Unite the entire outline first, so the drop shadow is drawn exactly once.
 for(let i=0;i<72;i++){const a=i*Math.PI/36,r=radius*(1+roughness*(Math.sin(i*1.73)+Math.sin(i*.37))*.15);ctx.drawImage(source,pad+Math.cos(a)*r,pad+Math.sin(a)*r)}ctx.drawImage(source,pad,pad);
 const result={key,canvas,pad,width,height};cache.set(image,result);return result;
}
