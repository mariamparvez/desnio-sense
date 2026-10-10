'use strict';
(()=>{
 const dialog=document.querySelector('#image-dialog'),stage=document.querySelector('#zoom-stage'),image=document.querySelector('#zoomed-image'),photo=document.querySelector('#product-main-photo');
 if(!dialog||!stage||!image||!photo)return;
 let zoom=1,fitWidth=0,fitHeight=0,loaded=false;const pointers=new Map();
 const out=document.querySelector('#zoom-level');
 function render(){image.style.width=fitWidth*zoom+'px';image.style.height=fitHeight*zoom+'px';out.value=Math.round(zoom*100)+'%';out.textContent=out.value;stage.classList.toggle('is-zoomed',zoom>1);document.querySelector('#zoom-out').disabled=zoom<=1;document.querySelector('#zoom-in').disabled=zoom>=4;}
 function change(value){const old=zoom;zoom=Math.max(1,Math.min(4,value));const x=(stage.scrollLeft+stage.clientWidth/2)/old,y=(stage.scrollTop+stage.clientHeight/2)/old;render();stage.scrollLeft=x*zoom-stage.clientWidth/2;stage.scrollTop=y*zoom-stage.clientHeight/2;}
 function fit(){if(!image.naturalWidth)return;const ratio=Math.min(1,stage.clientWidth/image.naturalWidth,stage.clientHeight/image.naturalHeight);fitWidth=image.naturalWidth*ratio;fitHeight=image.naturalHeight*ratio;zoom=1;render();stage.scrollTo(0,0);}
 function open(){loaded=false;image.src=photo.currentSrc||photo.src;image.alt=photo.alt;zoom=1;dialog.showModal();if(image.complete&&image.naturalWidth){loaded=true;fit();}else{out.textContent='Loading…';}}
 image.addEventListener('load',()=>{loaded=true;if(dialog.open)fit();});image.addEventListener('error',()=>{out.textContent='Image could not load';});
 document.querySelector('#gallery-zoom').addEventListener('click',open);
 photo.addEventListener('click',open);photo.tabIndex=0;photo.setAttribute('role','button');photo.setAttribute('aria-label','Zoom product photo');photo.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
 document.querySelector('#zoom-in').onclick=()=>{if(loaded)change(zoom+.5);};document.querySelector('#zoom-out').onclick=()=>{if(loaded)change(zoom-.5);};document.querySelector('#zoom-reset').onclick=fit;
 stage.addEventListener('wheel',e=>{if(e.ctrlKey&&loaded){e.preventDefault();change(zoom+(e.deltaY<0?.15:-.15));}},{passive:false});
 stage.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);});
 stage.addEventListener('pointermove',e=>{const prior=pointers.get(e.pointerId);if(!prior)return;const before=[...pointers.values()];pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const after=[...pointers.values()];if(before.length===2&&loaded){const distance=a=>Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),old=distance(before);if(old>0)change(zoom*distance(after)/old);}else if(before.length===1&&zoom>1){stage.scrollLeft-=e.clientX-prior.x;stage.scrollTop-=e.clientY-prior.y;}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,e=>pointers.delete(e.pointerId));
 dialog.addEventListener('close',()=>{pointers.clear();zoom=1;});new ResizeObserver(()=>{if(dialog.open&&loaded)fit();}).observe(stage);
})();
