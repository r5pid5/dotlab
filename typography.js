import {materialText} from './material-text.js';
export const typeDefaults={tracking:0,lineHeight:118,italic:false,outerColor:'#ffffff',outerWidth:3,depth:6,depthAngle:90,shadowColor:'#49334c',highlight:80,glow:18,paddingX:24,paddingY:12,radius:40,labelBorder:0,decoration:'none',labelColor:'#fffddd'};
export const typeStyles=[['plain','기본'],['jelly','젤리 · 유리 광택'],['chrome','크롬 · 메탈'],['sticker','스티커 · 이중 외곽선'],['neon','네온 · 빛 번짐'],['offset','입체 자막'],['retro','레트로 · 긴 그림자'],['label','사각 라벨'],['pill','둥근 캡슐'],['bubble','말풍선'],['search','검색창'],['ticket','티켓 라벨'],['ribbon','리본 배너'],['outline','라인 글자']];
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
export const effectSetup=style=>({fxOutline:['jelly','chrome','sticker','offset','retro','outline'].includes(style),fxOuter:['jelly','chrome','sticker','offset','retro','outline'].includes(style),fxDepth:['jelly','chrome','sticker','offset','retro'].includes(style),fxGlow:style==='neon',fxGloss:['jelly','chrome'].includes(style),fxLabel:['label','pill','bubble','search','ticket','ribbon'].includes(style),surface:style==='chrome'?'chrome':'jelly',labelShape:['pill','bubble','search','ticket','ribbon'].includes(style)?style:'label',fillEnabled:style!=='outline'});
export const effectKeys=[...Object.keys(typeDefaults).filter(k=>!['tracking','lineHeight','italic'].includes(k)),...Object.keys(effectSetup('plain')),'color','strokeColor','thickness','textStyle','shadow','outline'];
export function styledText(ctx,line,y,layer,u){
 const l={...typeDefaults,...effectSetup(layer.textStyle),...layer},size=l.size*u,t=l.thickness*u,outer=l.outerWidth*u,depth=l.depth*u,ang=l.depthAngle*Math.PI/180,dx=Math.cos(ang),dy=Math.sin(ang),tw=ctx.measureText(line).width;
 ctx.save();ctx.lineJoin='round';ctx.miterLimit=2;const stroke=(color,width,x=0,yy=y)=>{if(width<=0)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.strokeText(line,x,yy)};
 const fill=(color,x=0,yy=y)=>{ctx.fillStyle=color;ctx.fillText(line,x,yy)};
 const borders=()=>{if(l.fxOuter)stroke(l.outerColor,(t+outer)*2);if(l.fxOutline)stroke(l.strokeColor,t*2)};
 const solidDepth=()=>{ctx.save();ctx.shadowColor='transparent';for(let d=Math.ceil(depth);d>0;d--){stroke(l.shadowColor,(t+outer)*2,dx*d,y+dy*d);fill(l.shadowColor,dx*d,y+dy*d)}ctx.restore()};
 if(l.fxLabel){
  const px=l.paddingX*u,py=l.paddingY*u,h=size*.92+py*2,w=tw+px*2+(l.labelShape==='search'?size*.7:0),left=-w/2,top=y-h/2,rad=l.labelShape==='label'?Math.min(h/2,l.radius*u*.15):Math.min(h/2,l.radius*u),back=l.labelColor;
  ctx.save();if(l.shadow){ctx.shadowColor=l.shadowColor;ctx.shadowBlur=l.glow*u;ctx.shadowOffsetX=dx*depth;ctx.shadowOffsetY=dy*depth}ctx.fillStyle=back;ctx.strokeStyle=l.outerColor;ctx.lineWidth=l.labelBorder*u;ctx.beginPath();
  if(l.labelShape==='ribbon'){const notch=h*.22;ctx.moveTo(left,top);ctx.lineTo(left+w,top);ctx.lineTo(left+w-notch,y);ctx.lineTo(left+w,top+h);ctx.lineTo(left,top+h);ctx.lineTo(left+notch,y);ctx.closePath()}else ctx.roundRect(left,top,w,h,rad);
  ctx.fill();if(l.labelBorder)ctx.stroke();ctx.shadowColor='transparent';
  if(l.labelShape==='bubble'){ctx.beginPath();ctx.moveTo(w*.15,top+h-1);ctx.quadraticCurveTo(w*.24,top+h+size*.28,w*.35,top+h+size*.24);ctx.lineTo(w*.28,top+h-1);ctx.closePath();ctx.fill()}
  if(l.labelShape==='ticket'){ctx.save();ctx.strokeStyle=l.outerColor;ctx.lineWidth=u;ctx.setLineDash([3*u,4*u]);ctx.strokeRect(left+6*u,top+6*u,w-12*u,h-12*u);ctx.restore()}
  if(l.labelShape==='search'){const cx=left+size*.35;ctx.strokeStyle=l.color;ctx.lineWidth=2*u;ctx.beginPath();ctx.arc(cx,y-size*.04,size*.12,0,Math.PI*2);ctx.moveTo(cx+size*.09,y+size*.05);ctx.lineTo(cx+size*.19,y+size*.15);ctx.stroke()}
  ctx.restore();
 }
 if(l.fxGlow){ctx.save();ctx.shadowColor=l.color;for(const blur of [l.glow,l.glow*.55,l.glow*.2]){ctx.shadowBlur=blur*u;stroke(l.color,t*.65);fill(l.color)}ctx.restore();}
 if(l.fxDepth)solidDepth();borders();
 if(l.fillEnabled){if(l.fxGloss){if(!materialText(ctx,line,y,l,u))fill(l.color);}else fill(l.color);}
 if(l.fxGlow){ctx.save();stroke(mix(l.color,'#ffffff',l.highlight/100),Math.max(.4*u,t*.18));ctx.restore();}
 if(l.decoration!=='none'){
  ctx.save();ctx.shadowColor='transparent';ctx.font=`${size*.32}px Pretendard,"Noto Color Emoji",serif`;ctx.letterSpacing='0px';ctx.fillStyle=l.outerColor;const pair=l.decoration==='wings'?['ʚ','ɞ']:l.decoration==='hearts'?['♡','♡']:['✦','✧'];ctx.fillText(pair[0],-tw/2-size*.35,y-size*.16);ctx.fillText(pair[1],tw/2+size*.35,y-size*.16);ctx.restore();
 }ctx.restore();
}
