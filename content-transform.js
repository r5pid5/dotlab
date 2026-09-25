import {cameraScreen} from './art-effects.js';
export function contentTransform(s,w,h,asset){
 if(!s.mockup.enabled||!asset)return{scale:1,angle:0,x:0,y:0,toContent:(x,y)=>[x,y],apply:()=>{}};
 const f=Math.min(w/asset.width,h/asset.height)*s.mockup.scale/100,aw=asset.width*f,ah=asset.height*f;
 const sx=-aw/2+cameraScreen.x*aw,sy=-ah/2+cameraScreen.y*ah,sw=cameraScreen.width*aw,sh=cameraScreen.height*ah;
 const scale=Math.max(sw/w,sh/h),angle=s.mockup.rotation*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
 const dx=sx+(sw-w*scale)/2,dy=sy+(sh-h*scale)/2,x=w/2+dx*cos-dy*sin,y=h/2+dx*sin+dy*cos;
 return{scale,angle,x,y,toContent:(px,py)=>[((px-x)*cos+(py-y)*sin)/scale,(-(px-x)*sin+(py-y)*cos)/scale],apply:ctx=>{ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale)}};
}
