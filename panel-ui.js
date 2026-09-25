import {effectImage,canvasOf} from './renderer.js';
import {effectSettings} from './effect-presets.js';
const thumbCache=new Map(),openPanels=new Map();
export function organizePanel(controls,tool,state,assets){
 const folds=new Set(['효과 레이어','레이어 혼합','선택 영역 확인','얼굴 블러','선택한 이미지 합치기','사진 보정','프레임','디카 프레임','내 기호 조합','움직이는 사진','단어 찾기','하이 프레임','달력 한 장','여러 장을, 한 권으로','디지털카메라 목업','카메라']);
 for(const section of [...controls.querySelectorAll(':scope > .section')]){
  const label=section.querySelector('.section-label'),title=label?.childNodes[0]?.textContent?.trim();if(!title||!folds.has(title))continue;
  const id=tool+':'+title,details=document.createElement('details'),summary=document.createElement('summary');details.className='section panel-fold';summary.textContent=title;details.append(summary);
  label.remove();while(section.firstChild)details.append(section.firstChild);details.open=(title==='디카 프레임'&&state.mockup.enabled)||(openPanels.get(id)??(title==='프레임'&&tool==='layout'));
  details.addEventListener('toggle',()=>openPanels.set(id,details.open));section.replaceWith(details);
 }
 if(tool==='effects'){
  if((state.effectLayers.find(l=>l.id===state.effectSelection)?.fx||state.effects[state.target]).type!=='none'){
   const setting=[...controls.querySelectorAll('.section')].find(n=>n.querySelector('.section-label')?.textContent==='선택한 효과 조절');
   if(setting)controls.children[0]?.after(setting);
  }
  const stack=[...controls.querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent==='효과 레이어');if(stack)controls.append(stack);
  for(const node of controls.querySelectorAll('.effect-preview')){
   const type=node.parentElement.dataset.effect,key=(state.photo||'empty')+':'+type;
   if(!thumbCache.has(key)){
    const c=canvasOf(130,94),x=c.getContext('2d'),img=assets.get(state.photo);
    if(img){const k=Math.max(c.width/img.width,c.height/img.height);x.drawImage(img,(c.width-img.width*k)/2,(c.height-img.height*k)/2,img.width*k,img.height*k);}
    else {const g=x.createLinearGradient(0,0,130,94);g.addColorStop(0,'#dcd2c1');g.addColorStop(.5,'#627c82');g.addColorStop(1,'#202a37');x.fillStyle=g;x.fillRect(0,0,130,94);x.fillStyle='#edf3e6';x.beginPath();x.arc(78,41,24,0,Math.PI*2);x.fill();x.fillStyle='#b56954';x.fillRect(24,60,80,35);}
    const fx={size:8,strength:80,density:100,color:'#253821',paper:'#f0f3dc',colored:true,bloom:45,noise:25,...effectSettings[type],type};
    thumbCache.set(key,effectImage(c,fx).toDataURL());if(thumbCache.size>100)thumbCache.delete(thumbCache.keys().next().value);
   }
   node.className='effect-preview actual-preview';node.style.backgroundImage=`url("${thumbCache.get(key)}")`;
  }
 }
 if(tool==='text'){
  const section=[...controls.querySelectorAll('.section')].find(n=>n.querySelector('textarea'));if(!section)return;
  const node=key=>{const input=section.querySelector(`[data-path$=".${key}"]`);return input?.closest('.slider-row,.field-label,.color-row,.toggle-row');};
  const title=section.querySelector('.section-label'),basic=document.createElement('div');
  for(const key of ['text','font','size','color','tracking','lineHeight','bold','italic','opacity']){const item=node(key);if(item)basic.append(item);}title.after(basic);
  for(const [name,keys]of [
   ['외곽선 · 입체',['fillEnabled','fxOutline','fxOuter','fxDepth','thickness','strokeColor','outerWidth','outerColor','depth','depthAngle','shadowColor']],
   ['광택 · 빛번짐',['fxGloss','surface','highlight','fxGlow','glow']],
   ['라벨 · 장식',['fxLabel','labelShape','labelColor','paddingX','paddingY','radius','labelBorder','decoration']]
  ]){const d=document.createElement('details'),summary=document.createElement('summary');d.className='type-fold';summary.textContent=name;d.append(summary);for(const key of keys){const item=node(key);if(item)d.append(item);}const id='text:'+name;d.open=openPanels.get(id)||false;d.addEventListener('toggle',()=>openPanels.set(id,d.open));section.append(d);}
  const order=section.querySelector('.layer-actions');if(order)section.append(order);
 }
}
