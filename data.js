'use strict';
// Local cart cache and formatting; shared records are loaded from Firebase.
const Store={get(k,f){try{return JSON.parse(localStorage.getItem('ds-'+k))??f}catch{return f}},set(k,v){try{localStorage.setItem('ds-'+k,JSON.stringify(v));return true}catch{return false}}};
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n||0);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,5).toUpperCase();
const COLLECTION_PHOTOS={apparel:'assets/v4-apparel.jpg',accessories:'assets/v3-accessories.jpg',lifestyle:'assets/v3-drinkware.jpg',stationery:'assets/v3-stationery.jpg'};
const DETAILS={tshirt:['Form & Flow T-shirt',599,['XS','S','M','L','XL','XXL']],jersey:['Velocity Jersey',899,['XS','S','M','L','XL','XXL']],cap:['Contour Cap',449,['Adjustable']],hoodie:['Orbit Hoodie',1299,['S','M','L','XL','XXL']],sweatshirt:['Infinity Sweatshirt',1099,['S','M','L','XL','XXL']],case:['Tidal Phone Case',399,['iPhone 15','iPhone 16','Samsung S24','Other model']],tote:['Form & Flow Tote',499,['Standard']],bottle:['Celestial Bottle',699,['500 ml','750 ml']],mug:['Muse Coffee Cup',349,['Standard']],plate:['Solstice Plate',599,['Standard']],journal:['Celestial Journal',499,['A5']],notepad:['Ideas in Motion Notepad',249,['A5']],sticker:['Creative Elements Stickers',99,['Sticker set']]};
PRODUCTS.forEach(p=>Object.assign(p,{title:DETAILS[p.id][0],price:DETAILS[p.id][1],variants:DETAILS[p.id][2],collection:SECTIONS[p.section].name,care:p.section==='apparel'?'Follow the final care label. Use a gentle wash and mild detergent; avoid direct heat on printed artwork.':'Follow the final product care instructions. Handle the printed surface gently and avoid abrasive cleaners.'}));
const CATALOGUE_BASE=PRODUCTS.map(p=>({...p,baseId:p.id,status:'Draft'}));
// Blank studio canvases are separate from approved merchandise. Never show seeded samples.
PRODUCTS.splice(0,PRODUCTS.length);

let readyResolve,readyReject;
const DS={
 ready:new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject}),
 _ready(){clearTimeout(this.timeout);readyResolve();},_reject(error){clearTimeout(this.timeout);readyReject(error);this.fail(error);},
 fail(error){let banner=document.querySelector('#backend-error');if(!banner){banner=document.createElement('div');banner.id='backend-error';banner.className='result-panel error-panel';banner.setAttribute('role','alert');document.querySelector('main')?.prepend(banner);}banner.textContent=error.message||'The store could not connect. Check your connection and reload.';},
 managedProducts:()=>[],session:()=>null,orders:()=>[],tickets:()=>[],
 getCart(){return Store.get('cart',[])},
 addCart(item){const p=PRODUCTS.find(p=>p.id===item.product);if(!p||Number.isFinite(p.stock)&&p.stock<(item.quantity||1)){toast('This item or quantity is unavailable.');return false;}const cart=this.getCart(),key=[item.product,item.variant,item.colour,item.custom?'custom':'collection'].join('|'),existing=cart.find(i=>i.key===key&&!item.custom);if(existing)existing.quantity=Math.min(20,existing.quantity+(item.quantity||1));else cart.push({...item,key,id:uid('CART'),quantity:item.quantity||1});if(cart.length>25){toast('Your cart can contain up to 25 products.');return false;}if(!Store.set('cart',cart)){toast('Browser storage is full. Download your design before clearing it.');return false;}Store.set('checkout-key',null);refreshBag();window.dispatchEvent(new Event('ds-cart-change'));return true},
 updateCart(id,delta){Store.set('cart',this.getCart().map(i=>i.id===id?{...i,quantity:Math.max(1,Math.min(20,i.quantity+delta))}:i));Store.set('checkout-key',null);refreshBag();window.dispatchEvent(new Event('ds-cart-change'))},
 removeCart(id){Store.set('cart',this.getCart().filter(i=>i.id!==id));Store.set('checkout-key',null);refreshBag();window.dispatchEvent(new Event('ds-cart-change'))},
 cartTotal(){const subtotal=this.getCart().reduce((s,i)=>s+i.price*i.quantity,0);return{subtotal,discount:0,shipping:0,total:subtotal}},
 whatsapp(t){return 'https://wa.me/918870100469?text='+encodeURIComponent(['Hi Desnio Sense,','Ticket: '+t.id,'Topic: '+t.category,'Name: '+t.name,'Email: '+t.email,t.phone?'Phone: '+t.phone:'',t.order?'Order: '+t.order:'','Question: '+t.message].filter(Boolean).join('\n'));},
 badge(status){return '<span class="status-badge status-'+safe(String(status).toLowerCase().replace(/ /g,'-'))+'">'+safe(status)+'</span>';}
};
DS.ready.catch(()=>{});
DS.timeout=setTimeout(()=>DS._reject(new Error('The store could not connect to Firebase. Check your internet connection and reload.')),25000);
function productCard(p){return'<article class="product-card"><a class="product-photo" href="product.html?product='+p.id+'" aria-label="View '+safe(p.title)+'"><img src="'+productImage(p)+'" alt="'+safe(p.title)+'" loading="lazy">'+(p.fresh?'<span class="product-badge">NEW ARRIVAL</span>':'')+'</a><div class="product-info"><div><h2><a href="product.html?product='+p.id+'">'+safe(p.title)+'</a></h2><p>'+safe(p.desc)+'</p><p class="listing-price">'+money(p.price)+'</p></div><button class="quick-add" data-quick-add="'+p.id+'" aria-label="Add '+safe(p.title)+' to cart">＋</button></div></article>'}
