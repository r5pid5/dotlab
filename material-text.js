// A bevel derived from the actual glyph alpha, not horizontal stripes painted across a word.
const cache=new Map(),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
function environment(t){const stops=[[0,[10,16,28]],[.2,[78,98,126]],[.38,[229,242,255]],[.44,[255,255,255]],[.48,[19,27,41]],[.6,[64,77,95]],[.8,[221,235,247]],[1,[255,255,255]]];t=clamp(t);for(let i=1;i<stops.length;i++)if(t<=stops[i][0]){const a=stops[i-1],b=stops[i],k=(t-a[0])/(b[0]-a[0]);return a[1].map((v,c)=>v+(b[1][c]-v)*k);}return stops.at(-1)[1];}
export function materialText(ctx,text,y,l,u){
 const key=[text,ctx.font,ctx.letterSpacing,l.surface,l.color,l.highlight,u].join('|');let result=cache.get(key);
 if(!result){
  const m=ctx.measureText(text),pad=4,left=Math.ceil(m.actualBoundingBoxLeft)+pad,right=Math.ceil(m.actualBoundingBoxRight)+pad,top=Math.ceil(m.actualBoundingBoxAscent)+pad,bottom=Math.ceil(m.actualBoundingBoxDescent)+pad;
  const w=Math.max(1,left+right),h=Math.max(1,top+bottom);if(w*h>12e6)return false;
  const c=Object.assign(document.createElement('canvas'),{width:w,height:h}),x=c.getContext('2d');x.font=ctx.font;x.letterSpacing=ctx.letterSpacing;x.textAlign=ctx.textAlign;x.textBaseline=ctx.textBaseline;x.fillStyle='#fff';x.fillText(text,left,top);
  const image=x.getImageData(0,0,w,h),d=image.data,dist=new Float32Array(w*h),height=new Float32Array(w*h);
  for(let i=0;i<dist.length;i++)dist[i]=d[i*4+3]>127?1e4:0;
  for(let yy=1;yy<h;yy++)for(let xx=1;xx<w;xx++){const i=yy*w+xx;if(dist[i])dist[i]=Math.min(dist[i],dist[i-1]+1,dist[i-w]+1,dist[i-w-1]+1.414,xx+1<w?dist[i-w+1]+1.414:1e4);}
  for(let yy=h-2;yy>=0;yy--)for(let xx=w-2;xx>=0;xx--){const i=yy*w+xx;if(dist[i])dist[i]=Math.min(dist[i],dist[i+1]+1,dist[i+w]+1,dist[i+w+1]+1.414,xx>0?dist[i+w-1]+1.414:1e4);}
  const size=l.size*u,bevel=Math.max(1.8,size*(l.surface==='jelly'?.105:.07)),color=rgb(l.color),gloss=clamp(l.highlight/100);
  for(let i=0;i<dist.length;i++){const t=clamp(dist[i]/bevel);height[i]=Math.sqrt(Math.max(0,1-(1-t)**2))*bevel;}
  // Smooth the height field before differentiating it; discrete glyph pixels must not
  // become sawtooth reflections along curved strokes.
  const temp=new Float32Array(w*h),weights=[1,4,6,4,1];
  for(let pass=0;pass<2;pass++){
   for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){let sum=0;for(let k=-2;k<=2;k++)sum+=height[yy*w+clamp(xx+k,0,w-1)]*weights[k+2];temp[yy*w+xx]=sum/16;}
   for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){let sum=0;for(let k=-2;k<=2;k++)sum+=temp[clamp(yy+k,0,h-1)*w+xx]*weights[k+2];height[yy*w+xx]=sum/16;}
  }
  for(let yy=1;yy<h-1;yy++)for(let xx=1;xx<w-1;xx++){
   const i=yy*w+xx;if(!d[i*4+3])continue;
   let nx=-(height[i+1]-height[i-1])*.75,ny=-(height[i+w]-height[i-w])*.75,nz=1;const n=Math.hypot(nx,ny,nz);nx/=n;ny/=n;nz/=n;
   const diffuse=clamp(-nx*.45-ny*.65+nz*.6),spec=Math.pow(clamp(-nx*.39-ny*.53+nz*.75),20)*gloss;
   let col;
   if(l.surface==='chrome'){
    const reflection=clamp(.67+ny*.48+(yy/h-.5)*.25);col=environment(reflection);
    const rim=clamp(1-dist[i]/1.8);col=col.map((v,k)=>clamp(v*(.72+diffuse*.34)+spec*170+rim*(diffuse>.55?70:-75)+(color[k]-200)*.04,0,255));
   }else{
    const center=clamp(dist[i]/bevel),backlight=clamp(nx*.45+ny*.60+nz*.45),edge=clamp(1-dist[i]/2);
    const sheen=Math.pow(clamp(-nx*.15-ny*.84+nz*.51),12)*gloss*.55;
    col=color.map(v=>{const base=v*(.52+diffuse*.44)+center*25+backlight*18;return clamp(base+(255-base)*clamp(spec*.95+sheen)+edge*22,0,255);});
   }
   for(let k=0;k<3;k++)d[i*4+k]=col[k];
  }
  x.putImageData(image,0,0);result={canvas:c,left,top};cache.set(key,result);if(cache.size>64)cache.delete(cache.keys().next().value);
 }
 ctx.drawImage(result.canvas,-result.left,y-result.top);return true;
}
