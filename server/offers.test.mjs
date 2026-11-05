import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {offerRecord,couponRecord,applyCoupon,pricing} from './offers.mjs';import {priceOrder,catalogueRecord} from './domain.mjs';import {renderCollection,renderProduct} from './seo.mjs';
const start='2026-10-01T00:00:00Z',end='2026-10-20T00:00:00Z',now=Date.parse('2026-10-10T00:00:00Z');
const p={id:'offer-test',title:'Rose Print',status:'Active',approved:true,baseId:'tshirt',singular:'T-shirt',section:'apparel',icon:'shirt',image:'tshirt',imageSrc:'assets/monogram.png',price:999,variants:['M'],colours:['Black'],audience:'Women',desc:'A rose graphic T-shirt.',offer:{type:'percent',value:50,startsAt:start,endsAt:end}};
const item={product:p.id,quantity:2,variant:'M',colour:'Black',price:1,discount:99999};
test('Scheduled offers start and end automatically, including boundary times',()=>{assert.equal(pricing.product(p,now).price,499.5);assert.equal(pricing.product(p,Date.parse(start)-1).price,999);assert.equal(pricing.product(p,Date.parse(end)).price,999);assert.equal(pricing.product({...p,offer:{...p.offer,enabled:false}},now).price,999);});
test('Percentage and rupee offers round in paise and never become negative',()=>{assert.equal(pricing.product({...p,price:1},now).price,.5);assert.equal(pricing.product({...p,offer:{...p.offer,type:'amount',value:100}},now).price,899);assert.equal(pricing.product({...p,offer:{...p.offer,type:'amount',value:5000}},now).price,.01);});
test('Invalid discounts and schedules are rejected on catalogue save',()=>{for(const offer of [{type:'percent',value:100,endsAt:end},{type:'amount',value:999,endsAt:end},{type:'percent',value:50,startsAt:end,endsAt:start},{type:'percent',value:50},{type:'script',value:20,endsAt:end}])assert.throws(()=>offerRecord(offer,999));assert.equal(offerRecord(null,999),null);assert.equal(catalogueRecord('products',p,p.id).offer.value,50);});
test('Authoritative order pricing ignores forged browser prices and offers',()=>{const future={...p,offer:{...p.offer,startsAt:'2020-01-01T00:00:00Z',endsAt:'2099-01-01T00:00:00Z'}};assert.equal(priceOrder([item],[future]).total,999);});
const coupon={code:'WELCOME50',status:'Active',type:'percent',value:50,startsAt:start,endsAt:end,productIds:['offer-test'],minSpend:100,maxDiscount:100};
const priced={items:[{product:p.id,price:499.5,quantity:2},{product:'other',price:400,quantity:1}],subtotal:1399,discount:0,shipping:0,total:1399};
test('Coupons affect eligible products after offers with minimum spend and maximum cap',()=>{const q=applyCoupon(coupon,priced,now);assert.equal(q.discount,100);assert.equal(q.total,1299);assert.equal(applyCoupon({...coupon,type:'amount',value:50,maxDiscount:0},priced,now).discount,50);assert.equal(applyCoupon({...coupon,maxDiscount:0},priced,now).discount,499.5);});
test('Expired, future, inactive, wrong-product and below-minimum coupons reject',()=>{for(const c of [{...coupon,endsAt:start},{...coupon,startsAt:end},{...coupon,status:'Inactive'},{...coupon,productIds:['missing']},{...coupon,minSpend:2000}])assert.throws(()=>applyCoupon(c,priced,now));});
test('Coupon record validation rejects tampering and normalizes the code',()=>{assert.equal(couponRecord({...coupon,code:'welcome50'}).code,'WELCOME50');for(const c of [{...coupon,code:'<script>'},{...coupon,value:100},{...coupon,productIds:['../bad']},{...coupon,endsAt:''}])assert.throws(()=>couponRecord(c));});
test('Coupons never make a negative or zero payment',()=>{const q=applyCoupon({...coupon,type:'amount',value:999999,minSpend:0,maxDiscount:0,productIds:[]},priced,now);assert.equal(q.total,.01);});
test('Server-rendered cards and detail show crossed-out and current prices',async()=>{const future={...p,offer:{...p.offer,startsAt:'2020-01-01T00:00:00Z',endsAt:'2099-01-01T00:00:00Z'}};const [collection,detail]=await Promise.all(['products.html','product.html'].map(f=>fs.readFile(new URL('../'+f,import.meta.url),'utf8')));const listing=renderCollection(collection,[future],new URLSearchParams());assert.match(listing,/<del class="original-price">₹999.00<\/del>/);assert.match(listing,/current-price">₹499.50/);const product=renderProduct(detail,future);assert.match(product.html,/id="product-price"[^>]*><del/);});



test('Reference prices add ten percent for display without increasing the payable price',()=>{
 for(const [price,reference]of [[140,154],[230,253],[150,165],[126,138.6],[850,935],[840,924],[740,814]]){
  const value=pricing.product({...p,price,offer:null,referenceMarkupPercent:10},now);
  assert.equal(value.originalPrice,reference);assert.equal(value.price,price);assert.equal(value.referenceOnly,true);assert.equal(value.onOffer,true);
 }
});
test('Server order totals and coupons use selling prices, never the crossed-out reference',()=>{
 const phone={...p,baseId:'case',price:140,offer:null,referenceMarkupPercent:10};
 const cup={...p,id:'CUP',baseId:'mug',price:230,offer:null,referenceMarkupPercent:10,variants:['Standard']};
 const order=priceOrder([{product:phone.id,quantity:1,variant:'Apple iPhone',colour:'Black',price:154,phoneModel:{platform:'iPhone',brand:'Apple',name:'iPhone 16',requested:true}},{product:cup.id,quantity:1,variant:'Standard',colour:'Black',price:253}],[phone,cup]);
 assert.equal(order.total,370);assert.deepEqual(order.items.map(i=>i.price),[140,230]);
 assert.equal(applyCoupon({...coupon,productIds:[],minSpend:0,maxDiscount:0,value:10},order,now).total,333);
});
test('Reference display renders safely with no percentage-discount claim or scheduled offer',async()=>{
 const record={...p,price:140,offer:null,referenceMarkupPercent:10};
 const collection=await fs.readFile(new URL('../products.html',import.meta.url),'utf8'),detail=await fs.readFile(new URL('../product.html',import.meta.url),'utf8');
 for(const html of [renderCollection(collection,[record],new URLSearchParams()),renderProduct(detail,record).html]){
  assert.match(html,/<del class="original-price">₹154.00<\/del>/);assert.match(html,/current-price">₹140.00/);assert(html.includes('Special price'));assert(!html.includes('10% OFF'));
 }
 const changed=pricing.product({...record,price:175},now);assert.equal(changed.originalPrice,192.5);assert.equal(changed.price,175);
});

test('Browser price markup matches server reference prices and handles products with no offer',async()=>{
 const {runInNewContext}=await import('node:vm'),source=await fs.readFile(new URL('../data.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('function priceMarkup('),source.indexOf('function productCard('));
 const markup=runInNewContext('('+body+')',{DesnioPricing:pricing,money:n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(n),safe:v=>String(v)});
 const html=markup({...p,price:230,offer:null,referenceMarkupPercent:10});
 assert.match(html,/<del class="original-price">₹253.00<\/del>/);assert.match(html,/current-price">₹230.00/);assert(html.includes('Special price'));assert(!html.includes('10% OFF'));
});
