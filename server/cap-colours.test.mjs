import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {cataloguePolicyPatch,CAP_COLOURS_POLICY_ID} from './catalogue-policy.mjs';
import {catalogueRecord,priceOrder} from './domain.mjs';
const cap={id:'MERCH-12',baseId:'cap',status:'Active',approved:true,title:'Whimsy & Rage',singular:'Cap',section:'apparel',icon:'cap',image:'cap',price:126,stock:5,variants:['Owner size'],colours:['Dusty pink'],imageSrc:'assets/merch/product-12/photo-1.webp',galleryImages:['assets/merch/product-12/photo-2.webp'],desc:'Owner copy',referenceMarkupPercent:10};
const patched=()=>({...cap,...cataloguePolicyPatch(cap,'now',CAP_COLOURS_POLICY_ID)});
test('Cap colour update retains one product and preserves owner price, stock, sizes and cover',()=>{
 const next=patched();assert.deepEqual(next.colours,['Pink','Black']);assert.equal(next.galleryImages.length,3);
 for(const field of ['id','price','stock','variants','imageSrc','title','desc','referenceMarkupPercent'])assert.deepEqual(next[field],cap[field]);
 assert.deepEqual(next.colourImages.Pink,[cap.imageSrc,...cap.galleryImages]);assert.equal(next.colourImages.Black.length,2);
 assert.equal(cataloguePolicyPatch({...cap,id:'OTHER'},'now',CAP_COLOURS_POLICY_ID),null);
});
test('Admin saves persist colour photos and server orders retain the selected colour image and price',()=>{
 const saved=catalogueRecord('products',patched(),cap.id);assert.deepEqual(saved.colourImages,patched().colourImages);
 for(const colour of ['Pink','Black']){const order=priceOrder([{product:cap.id,variant:'Owner size',colour,quantity:1,image:'https://example.com/forged.webp',price:1}],[saved]);assert.equal(order.total,126);assert.equal(order.items[0].colour,colour);assert.equal(order.items[0].image,saved.colourImages[colour][0]);}
 assert.throws(()=>priceOrder([{product:cap.id,variant:'Owner size',colour:'Blue',quantity:1}],[saved]));
 assert.throws(()=>catalogueRecord('products',{...patched(),colourImages:{Black:['javascript:alert(1)']}},cap.id));
 assert.throws(()=>catalogueRecord('products',{...patched(),colourImages:{Black:'invalid'}},cap.id));
 const edited=catalogueRecord('products',{...patched(),colours:['Black'],galleryImages:[]},cap.id);assert.deepEqual(edited.colourImages,{Black:[]});
});
test('Buyer can switch Pink to Black and back, navigate matching photos and keep Black in cart',async()=>{
 class Element{
  constructor(){this.children=[];this.attributes={};this.classList={toggle:()=>{}};this.value='';}
  setAttribute(k,v){this.attributes[k]=v;}append(...items){this.children.push(...items);}replaceChildren(){this.children=[];}
  querySelectorAll(){return this.children;}addEventListener(){}
 }
 const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);},events={},cart=[];
 const product=patched(),context=vm.createContext({URLSearchParams,location:{search:'?product=MERCH-12',reload(){throw new Error('Unexpected reload');}},document:{querySelector:node,querySelectorAll:s=>s==='#colour-buttons button'?node('#colour-buttons').children:[],createElement:()=>new Element()},window:{addEventListener:(name,fn)=>events[name]=fn},DS:{ready:Promise.resolve(),fail:e=>{throw e;},addCart:item=>{cart.push(item);return true;}},PRODUCTS:[product],Backend:{features:{payments:false}},priceMarkup:()=>'',productCard:()=>'',safe:s=>s,toast:()=>{},setInterval:()=>{}});
 vm.runInContext(await fs.readFile(new URL('../pricing.js',import.meta.url),'utf8'),context);
 vm.runInContext(await fs.readFile(new URL('../catalogue.js',import.meta.url),'utf8')+'\nglobalThis.productPhotos=productPhotos;globalThis.productImage=productImage;',context);
 // product.js reads the authoritative public catalogue, not the blank studio templates.
 vm.runInContext('PRODUCTS.splice(0,PRODUCTS.length,...globalThis.PRODUCTS);',context);
 await vm.runInContext(await fs.readFile(new URL('../product.js',import.meta.url),'utf8'),context);
 const buttons=node('#colour-buttons').children;assert.deepEqual(buttons.map(b=>b.textContent),['Pink','Black']);
 assert.equal(node('#product-main-photo').src,cap.imageSrc);
 buttons[1].onclick();assert.equal(node('#product-main-photo').src,product.colourImages.Black[0]);assert.equal(buttons[1].attributes['aria-pressed'],'true');
 node('#gallery-next').onclick();assert.equal(node('#product-main-photo').src,product.colourImages.Black[1]);
 node('#product-add-cart').onclick();assert.equal(cart[0].colour,'Black');assert.equal(cart[0].image,product.colourImages.Black[0]);assert.equal(cart[0].product,cap.id);
 buttons[0].onclick();assert.equal(node('#product-main-photo').src,cap.imageSrc);
 buttons[1].onclick();events['ds-cloud-change']();assert.equal(node('#product-main-photo').src,product.colourImages.Black[0]);
});
