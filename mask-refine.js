// Separable rolling max/min keeps boundary adjustment linear in pixel count.
export function expandAlpha(data,w,h,radius){
 const radiusPx=Math.min(60,Math.max(0,Math.round(Math.abs(radius))));if(!radiusPx)return;
 const grow=radius>0,source=new Uint8ClampedArray(w*h),temp=new Uint8ClampedArray(w*h),queue=new Int32Array(Math.max(w,h));
 for(let i=0;i<source.length;i++)source[i]=data[i*4+3];
 const pass=(input,output,length,lines,stride,lineStep)=>{
  for(let line=0;line<lines;line++){let head=0,tail=0,right=-1;const base=line*lineStep;
   for(let pos=0;pos<length;pos++){
    const limit=Math.min(length-1,pos+radiusPx);while(right<limit){right++;const value=input[base+right*stride];while(tail>head&&(grow?input[base+queue[tail-1]*stride]<=value:input[base+queue[tail-1]*stride]>=value))tail--;queue[tail++]=right;}
    while(head<tail&&queue[head]<pos-radiusPx)head++;output[base+pos*stride]=input[base+queue[head]*stride];
   }
  }
 };
 pass(source,temp,w,h,1,w);pass(temp,source,h,w,w,1);for(let i=0;i<source.length;i++)data[i*4+3]=source[i];
}
export function matteAlpha(alpha,threshold,softness,preserve){
 if(alpha<=0)return 0;if(alpha>=1)return 1;
 if(!preserve){const soft=Math.max(.005,softness/100);return Math.max(0,Math.min(1,(alpha-threshold/100+soft)/(soft*2)));}
 // A log-odds bias changes removal strength while retaining the fractional edge.
 const p=Math.max(.00001,Math.min(.99999,alpha)),bias=(threshold-50)/7,sharpness=Math.max(.35,1+(6-softness)/24);
 return 1/(1+Math.exp(-(Math.log(p/(1-p))-bias)*sharpness));
}
