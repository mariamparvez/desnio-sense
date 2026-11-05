import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {catalogueRecord,priceOrder,publishedProduct,modelRequest} from './domain.mjs';
import {renderCollection,renderProduct,sitemap,collectionInfo,collectionLinks,replaceHead} from './seo.mjs';
const template=await fs.readFile(new URL('../products.html',import.meta.url),'utf8'),detail=await fs.readFile(new URL('../product.html',import.meta.url),'utf8');
const p={id:'seo-test',status:'Active',approved:true,title:'Approved product',name:'Approved product',singular:'T-shirt',baseId:'tshirt',icon:'shirt',image:'tshirt',imageSrc:'assets/approved-ds-logo.png',section:'apparel',price:699,variants:['M'],colours:['White'],desc:'An original illustrated print.',audience:'Women'};
test('Phone-case requests keep actual product details and cannot claim payment or arbitrary prices',()=>{const product={...p,baseId:'case',productCode:'phone_case_17_10102026'},input={platform:'Android',brand:'Samsung',name:'Galaxy A55',productId:product.id,price:.01,payment:'Paid',quantity:2};const request=modelRequest(input,product);assert.equal(request.price,699);assert.equal(request.payment,'Not paid');assert.equal(request.productName,product.title);assert.equal(request.productCode,product.productCode);assert.throws(()=>modelRequest(input,{...product,approved:false}));assert.throws(()=>modelRequest(input,p));assert.throws(()=>modelRequest({...input,quantity:1.5},product));});
test('Display names are independent from internal SKU and descriptions stay off collection cards',()=>{const named={...p,title:'Lunar Drama',productCode:'womens_tshirt_2_10102026'};assert.equal(catalogueRecord('products',named,p.id).productCode,named.productCode);const collection=renderCollection(template,[named],new URLSearchParams());assert(collection.includes('Lunar Drama'));assert(!collection.includes(named.desc));assert(!collection.includes(named.productCode));const result=renderProduct(detail,named);assert(result.html.includes(named.desc));const data=JSON.parse(result.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(data['@graph'][0].sku,named.productCode);assert.equal(data['@graph'][0].name,named.title);assert(result.html.includes('Women’s Graphic T-shirt'));});
test('Photos can become private drafts without invented names, prices or variants',()=>{const draft=catalogueRecord('products',{...p,title:'',price:null,status:'Draft',approved:false,variants:[],colours:[]},'draft-one');assert.equal(draft.price,null);assert.equal(draft.title,'');assert(!publishedProduct(draft));for(const record of [{...p,approved:false},{...p,price:null},{...p,imageSrc:''},{...p,colours:[]}])assert.throws(()=>catalogueRecord('products',record,p.id));});
test('Approved priced products can be visible while real options are pending without allowing an order',()=>{const visible=catalogueRecord('products',{...p,baseId:'mug',singular:'Coffee cup',price:1,variants:[]},p.id);assert(publishedProduct(visible));assert.equal(visible.price,1);assert.throws(()=>priceOrder([{product:p.id,quantity:1,variant:'M',colour:'White'}],[visible]));assert.equal(renderProduct(detail,visible).status,200);});
test('Unapproved products and unavailable colours cannot be ordered',()=>{const item={product:p.id,quantity:1,variant:'M',colour:'White'};assert.equal(priceOrder([item],[p]).total,699);assert.throws(()=>priceOrder([item],[{...p,approved:false}]));assert.throws(()=>priceOrder([{...item,colour:'Teal'}],[p]));});
test('Collection HTML contains approved merchandise only and works without JavaScript',()=>{const html=renderCollection(template,[p,{...p,id:'sample',approved:false,title:'Invisible sample'}],new URLSearchParams('section=apparel&audience=Women'));assert.match(html,/<h2><a[^>]*>Approved product/);assert(!html.includes('Invisible sample'));assert.match(html,/Women’s T-shirts/);assert.match(html,/rel="canonical"/);assert(!html.includes('content="noindex'));const empty=renderCollection(template,[],new URLSearchParams());assert.match(empty,/coming soon/);assert(!empty.includes('Form & Flow T-shirt'));});
test('Product HTML and structured data escape content and do not invent offers or reviews',()=>{const hostile={...p,title:'Print $& </script><script>alert(1)</script>',desc:'Description <img src=x onerror=alert(1)>'};const result=renderProduct(detail,hostile);assert.equal(result.status,200);assert(!result.html.includes('<script>alert(1)</script>'));const data=JSON.parse(result.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(data['@graph'][0].name,hostile.title);assert(!('offers' in data['@graph'][0]));assert(!('aggregateRating' in data['@graph'][0]));});
test('Unavailable products return 404 and noindex without a fallback product',()=>{for(const product of [null,{...p,approved:false},{...p,status:'Draft'}]){const result=renderProduct(detail,product);assert.equal(result.status,404);assert.match(result.html,/content="noindex,follow"/);assert(!result.html.includes('id="product-title"'));}});
test('Sitemap escapes collection queries and excludes drafts, accounts and samples',()=>{const xml=sitemap([p,{...p,id:'draft',status:'Draft'}]);assert(xml.includes('audience=Women'));assert(xml.includes('&amp;audience'));assert(!xml.includes('product=draft'));for(const route of ['admin-login','login.html','account.html','payment.html'])assert(!xml.includes(route));});

test('Category navigation is crawlable HTML with working section and audience URLs before JavaScript',()=>{
 const men={...p,id:'men',audience:'Men',icon:'tshirt'},html=renderCollection(template,[p,men],new URLSearchParams('section=apparel'));
 assert.match(html,/<a data-section="accessories" href="products.html\?section=accessories">/);
 const rail=html.match(/id="category-rail"[^>]*>([\s\S]*?)<\/div>/)[1];
 assert(rail.includes('href="https://www.desniosense.com/products.html?section=apparel&amp;type=tshirt&amp;audience=Women"'));
 assert(rail.includes('audience=Men'));assert(rail.includes('assets/icons/shirt.png'));assert(!rail.includes('assets/icons/tshirt.png'));assert(!rail.includes(p.desc));
 for(const link of collectionLinks([p,men],'apparel'))assert.equal(collectionInfo(new URL(link.url).searchParams).url,link.url);
});

test('Equivalent category filters share a canonical and empty arbitrary collections are noindex',()=>{
 const a=collectionInfo(new URLSearchParams('audience=Women')),b=collectionInfo(new URLSearchParams('section=apparel&type=tshirt&audience=Women'));
 assert.equal(a.url,b.url);assert.equal(a.type,'tshirt');assert.equal(a.section,'apparel');
 const phone=collectionInfo(new URLSearchParams('collection=The+Arabic+Collection'));
 assert.equal(phone.name,'Phone Cases');assert.equal(phone.section,'accessories');assert.equal(phone.type,'case');
 for(const query of ['collection=unknown','type=hoodie','q=print'])assert.match(renderCollection(template,[p],new URLSearchParams(query)),/content="noindex,follow"/);
 const html=renderCollection(template,[p],new URLSearchParams('section=apparel'));
 assert(!html.includes('team-set prices'));assert(!html.includes('new collection is coming soon'));
});

test('Image sitemap includes only published category destinations, current images and real modification times',()=>{
 const record={...p,imageSrc:'data:image/png;base64,AAAA',galleryImages:['assets/back.webp'],updatedAt:'2026-01-02T03:04:05.000Z'};
 const xml=sitemap([record,{...p,id:'draft',status:'Draft'},{...p,id:'invalid-date',updatedAt:'invented'}]);
 assert(xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
 assert(xml.includes('<lastmod>2026-01-02T03:04:05.000Z</lastmod>'));
 assert.equal((xml.match(/<lastmod>/g)||[]).length,1);
 assert(xml.includes('/api/product-image?id=seo-test&amp;photo=0'));
 assert(xml.includes('<image:loc>https://www.desniosense.com/assets/back.webp</image:loc>'));
 assert(!xml.includes('product=draft'));assert(!xml.includes('type=hoodie'));assert(!xml.includes('data:image'));
 const locations=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);assert.equal(new Set(locations).size,locations.length);
});

test('Home brand identity is consistent and metadata replacement preserves ownership verification',async()=>{
 const home=await fs.readFile(new URL('../index.html',import.meta.url),'utf8'),graph=JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
 const website=graph.find(n=>n['@type']==='WebSite'),organization=graph.find(n=>n['@type']==='Organization');
 assert.equal(website.name,'Desnio Sense');assert.equal(organization.name,website.name);assert(website.alternateName.includes('DesnioSense'));assert.equal(website.publisher['@id'],organization['@id']);
 assert(!('aggregateRating' in organization));
 const verified=replaceHead(home.replace('</head>','<meta name="google-site-verification" content="public-token"></head>'),{title:'Brand',description:'Original designs',url:website.url});
 assert(verified.includes('content="public-token"'));assert.equal((verified.match(/<title>/g)||[]).length,1);
 for(const page of ['login.html','admin-login.html','account.html','payment.html','order-confirmation.html','checkout.html','cart.html']){
  const source=await fs.readFile(new URL('../'+page,import.meta.url),'utf8');assert.match(source,/<meta name="robots" content="noindex/);
 }
});


