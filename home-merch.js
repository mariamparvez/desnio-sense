'use strict';
(async()=>{
 await DS.ready;
 const grid=document.querySelector('#home-product-grid'),section=document.querySelector('#latest-products');
 if(!grid||!section)return;
 const toggle=document.querySelector('#home-slider-toggle'),motion=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=motion.matches,hover=false,focused=false,visible=false,direction=1,last=0,manualUntil=0,travel=0,signature='';
 function updateToggle(){toggle.textContent=paused?'Play slider':'Pause slider';toggle.setAttribute('aria-label',paused?'Play automatic product scrolling':'Pause automatic product scrolling');}
 function render(){section.hidden=!PRODUCTS.length;const html=PRODUCTS.map(productCard).join('');if(html===signature)return;signature=html;grid.innerHTML=html;grid.scrollLeft=0;travel=0;direction=1;}
 toggle.onclick=()=>{paused=!paused;updateToggle();};updateToggle();
 for(const [id,step]of [['home-slider-prev',-1],['home-slider-next',1]])document.querySelector('#'+id).onclick=()=>{manualUntil=performance.now()+5000;const card=grid.querySelector('.product-card');grid.scrollBy({left:step*((card?.getBoundingClientRect().width||240)+24),behavior:motion.matches?'instant':'smooth'});};
 grid.addEventListener('mouseenter',()=>hover=true);grid.addEventListener('mouseleave',()=>hover=false);
 grid.addEventListener('focusin',()=>focused=true);grid.addEventListener('focusout',()=>focused=grid.contains(document.activeElement));
 for(const event of ['pointerdown','wheel','keydown'])grid.addEventListener(event,()=>manualUntil=performance.now()+5000,{passive:true});
 new IntersectionObserver(entries=>visible=entries[0].isIntersecting,{threshold:.1}).observe(grid);
 motion.addEventListener('change',()=>{paused=motion.matches;updateToggle();});
 function animate(now){const elapsed=Math.min(50,now-last);last=now;const max=grid.scrollWidth-grid.clientWidth;if(visible&&!paused&&!hover&&!focused&&!document.hidden&&now>manualUntil&&max>1){travel=Math.max(0,Math.min(max,travel+direction*elapsed*.022));grid.scrollLeft=travel;if(grid.scrollLeft>=max-1)direction=-1;else if(grid.scrollLeft<=0)direction=1;}else travel=grid.scrollLeft;requestAnimationFrame(animate);}
 render();requestAnimationFrame(animate);window.addEventListener('ds-cloud-change',render);
})().catch(error=>DS.fail(error));
