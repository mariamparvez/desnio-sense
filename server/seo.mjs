import {pricing} from './offers.mjs';
import {publishedProduct} from './domain.mjs';
export const ORIGIN='https://www.desniosense.com';
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const productUrl=p=>ORIGIN+'/product.html?product='+encodeURIComponent(p.id);
export const sections={all:'All products',apparel:'Apparel',accessories:'Accessories',lifestyle:'Drinkware & lifestyle',stationery:'Stationery'};
export const typeNames={tshirt:'T-shirts',jersey:'Jerseys',cap:'Caps',hoodie:'Hoodies',sweatshirt:'Sweatshirts',case:'Phone Cases',tote:'Tote bags',bottle:'Bottles',mug:'Coffee cups',plate:'Plates',journal:'Journals',notepad:'Notepads',sticker:'Stickers'};
export const publicPages=['/','/products.html','/customise.html','/about.html','/contact.html','/corporate-orders.html','/careers.html','/faq.html','/returns.html','/terms.html','/copyright.html'];
const json=v=>JSON.stringify(v).replace(/[<>&]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
export function photoUrl(p,n=0){const src=n?(p.galleryImages||[])[n-1]:p.imageSrc;if(src?.startsWith('data:'))return ORIGIN+'/api/product-image?id='+encodeURIComponent(p.id)+'&photo='+n;if(src?.startsWith('https://'))return src;return ORIGIN+'/'+(src||'assets/monogram.png');}
export function head({title,description,url,image=ORIGIN+'/assets/v10-hero-branded.jpg',noindex=false,schema=[]}){
 return '<title>'+esc(title)+'</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+esc(url)+'"><meta name="robots" content="'+(noindex?'noindex,follow':'index,follow,max-image-preview:large')+'"><meta property="og:locale" content="en_IN"><meta property="og:type" content="website"><meta property="og:site_name" content="Desnio Sense"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+esc(url)+'"><meta property="og:image" content="'+esc(image)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(description)+'"><meta name="twitter:image" content="'+esc(image)+'">'+(schema.length?'<script type="application/ld+json">'+json({'@context':'https://schema.org','@graph':schema})+'</script>':'');
}
export function replaceHead(html,metadata){return html.replace(/<title>[\s\S]*?<\/title>|<meta\s+(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>|<link\s+rel="canonical"[^>]*>|<script type="application\/ld\+json">[\s\S]*?<\/script>/gi,'').replace('</head>',()=>head(metadata)+'</head>');}
const crumbs=(name,url)=>({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name,item:url}]});
export function collectionInfo(params){
 let section=sections[params.get('section')]?params.get('section'):'all',type=typeNames[params.get('type')]?params.get('type'):'';
 const audience=['Women','Men','Unisex','Couples','Kids'].includes(params.get('audience'))?params.get('audience'):'',collection=(params.get('collection')||'').slice(0,150);
 // Match the storefront's existing audience and Arabic collection filters.
 if(['Women','Men','Couples'].includes(audience))type='tshirt';else if(collection==='The Arabic Collection')type='case';
 if(section==='all'&&type)section=['tshirt','jersey','cap','hoodie','sweatshirt'].includes(type)?'apparel':['case','tote'].includes(type)?'accessories':['bottle','mug','plate'].includes(type)?'lifestyle':'stationery';
 const name=(type==='case'||collection==='The Arabic Collection'?'Phone Cases':collection)||(audience==='Women'?'Women’s T-shirts':audience==='Couples'?'Couple T-shirts':audience==='Men'?'Men’s T-shirts':audience?audience+' Apparel':typeNames[type]||sections[section]);
 const q=new URLSearchParams();if(section!=='all')q.set('section',section);if(type)q.set('type',type);if(audience)q.set('audience',audience);if(collection)q.set('collection',collection);
 return{section,audience,type,collection,name,url:ORIGIN+'/products.html'+(q.size?'?'+q:'')};
}
const cash=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(n);
export function collectionLinks(products,section='all'){
 const items=products.filter(p=>publishedProduct(p)&&(section==='all'||p.section===section)),base=new URLSearchParams(section==='all'?'':'section='+section),link=(name,params,product)=>({name,url:ORIGIN+'/products.html'+(params.size?'?'+params:''),product});
 const links=[link('All',base)];
 for(const [type,name]of Object.entries(typeNames)){
  const matching=items.filter(p=>p.baseId===type);if(!matching.length)continue;
  if(section==='apparel'&&type==='tshirt'){
   for(const audience of ['Women','Men','Couples','Unisex','Kids']){const p=matching.find(p=>p.audience===audience);if(!p)continue;const params=new URLSearchParams(base);params.set('type',type);params.set('audience',audience);links.push(link(audience==='Couples'?'Couple T-shirts':audience==='Women'?'Women’s T-shirts':audience==='Men'?'Men’s T-shirts':audience+' T-shirts',params,p));}
  }else{const params=new URLSearchParams(base);if(section==='all')params.set('section',matching[0].section);params.set('type',type);links.push(link(name,params,matching[0]));}
 }
 return links;
}
function collectionDescription(info,count){
 if(!count)return 'Explore '+info.name.toLowerCase()+' at Desnio Sense. Browse our available collections or contact the team for product enquiries.';
 if(info.collection==='The Arabic Collection')return 'Discover The Arabic Collection of phone cases from Desnio Sense. Explore Arabic calligraphy designs, product photos and available phone models.';
 const copy={all:'Explore original graphic T-shirts, sweatshirts, phone cases, tote bags and coffee cups from Desnio Sense in India. Discover your next everyday favourite.',apparel:'Shop Desnio Sense apparel in India: original graphic T-shirts, sweatshirts and caps. Explore designs for men, women and couples.',accessories:'Explore Desnio Sense phone cases and tote bags. Discover original designs and The Arabic Collection of calligraphy phone cases.',lifestyle:'Discover Desnio Sense coffee cups and drinkware in India. Explore original designs for your daily coffee ritual or a personal gift.',stationery:'Explore journals, notepads and stationery from Desnio Sense. Contact the team for available designs and personalisation enquiries.'};
 return info.type||info.audience?'Explore '+info.name.toLowerCase()+' from Desnio Sense in India. Browse original designs, detailed product photos and current prices.':copy[info.section];
}
export function priceHtml(p){const v=pricing.product(p);return(v.onOffer?(v.referenceOnly?'<span class="sr-only">Reference price </span>':'')+'<del class="original-price">'+esc(cash(v.originalPrice))+'</del> ':'')+'<span class="current-price">'+esc(cash(v.price))+'</span>'+(v.onOffer?' <span class="offer-label">'+esc(v.referenceOnly?'Special price':p.offer.type==='percent'?p.offer.value+'% OFF':cash(p.offer.value)+' OFF')+'</span>':'');}
export function renderCollection(template,products,params){const info=collectionInfo(params),q=(params.get('q')||'').trim().toLowerCase(),items=products.filter(p=>publishedProduct(p)&&(info.section==='all'||p.section===info.section)&&(!info.type||p.baseId===info.type)&&(!info.collection||p.collectionName===info.collection)&&(!info.audience||p.audience===info.audience)&&(!info.audience||!['Women','Men','Couples'].includes(info.audience)||p.baseId==='tshirt')&&(!q||(p.title+' '+p.desc+' '+p.collectionName).toLowerCase().includes(q)));
 const cards=items.map(p=>'<article class="product-card"><a class="product-photo" href="'+esc(productUrl(p))+'"><img src="'+esc(photoUrl(p))+'" alt="'+esc(p.title)+'" loading="lazy" width="640" height="800">'+(p.fresh?'<span class="product-badge">NEW ARRIVAL</span>':'')+'</a><div class="product-info"><div><h2><a href="'+esc(productUrl(p))+'">'+esc(p.title)+'</a></h2><p class="listing-price">'+priceHtml(p)+'</p></div></div></article>').join('')||'<section class="empty-results"><h2>Our new collection is coming soon.</h2><p>We’re preparing original products for you. Only approved merchandise will appear here.</p><a href="contact.html" class="btn outline">Stay in touch →</a></section>';
 const rail=collectionLinks(products,info.section).map(link=>{const p=link.product,icon=p&&/^[a-z-]+$/.test(p.icon||'')?'assets/icons/'+(p.icon==='tshirt'?'shirt':p.icon)+(p.icon==='sweatshirt'?'.svg':'.png'):'';return '<a class="circle-category'+(link.url===info.url?' active':'')+'" href="'+esc(link.url)+'"'+(link.url===info.url?' aria-current="page"':'')+'><span class="circle-picture'+(!p?' all-grid-circle all-grid':'')+'">'+(icon?'<img src="'+icon+'" alt="" width="64" height="64">':!p?'⊞':'')+'</span><span>'+esc(link.name)+'</span></a>';}).join('');
 let html=template.replace('<div class="product-grid" id="product-grid"></div>','<div class="product-grid" id="product-grid">'+cards+'</div>').replace('<div class="category-rail" id="category-rail" aria-label="Filter by product type"></div>','<div class="category-rail" id="category-rail" aria-label="Filter by product type">'+rail+'</div>').replace(/(<h1 id="section-heading">)[\s\S]*?(<\/h1>)/,(_,open,close)=>open+esc(info.name)+close).replace('<p id="product-count" role="status"></p>','<p id="product-count" role="status">'+items.length+' products</p>');
 
 if(info.type==='case'||info.collection==='The Arabic Collection')html=html.replace('<p id="collection-name" hidden></p>','<p id="collection-name"><strong>The Arabic Collection</strong></p>');
 return replaceHead(html,{title:info.name+' | Desnio Sense India',description:collectionDescription(info,items.length),url:info.url,noindex:!!q||(!items.length&&(info.section!=='all'||!!info.audience||!!info.type||!!info.collection)),schema:[crumbs(info.name,info.url),{'@type':'CollectionPage','@id':info.url+'#webpage',name:info.name,url:info.url,isPartOf:{'@id':ORIGIN+'/#website'},inLanguage:'en-IN',mainEntity:{'@type':'ItemList',itemListElement:items.map((p,i)=>({'@type':'ListItem',position:i+1,url:productUrl(p),name:p.title}))}}]});
}
export function renderProduct(template,p){
 if(!publishedProduct(p))return{status:404,html:replaceHead(template.replace(/<main[\s\S]*?<\/main>/,'<main id="main"><section class="empty-results"><h1>This product is unavailable.</h1><p>Explore our collection as approved products arrive.</p><a class="btn" href="products.html">View collection →</a></section></main>'),{title:'Product unavailable | Desnio Sense',description:'This product is not available in the approved Desnio Sense catalogue.',url:ORIGIN+'/products.html',noindex:true})};
 let html=template;for(const [id,value]of [['product-title',p.title],['product-subtitle',p.desc],['product-description',p.desc],['product-care',p.care||'Contact us for confirmed care instructions.'],['product-breadcrumb-name',p.title],['product-price',new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(p.price)]])html=html.replace(new RegExp('(<[^>]+id="'+id+'"[^>]*>)[\\s\\S]*?(</[^>]+>)'),(_,open,close)=>open+esc(value)+close);
 html=html.replace(/(<[^>]+id="product-price"[^>]*>)[\s\S]*?(<\/[^>]+>)/,(_,open,close)=>open+priceHtml(p)+close);
 html=html.replace(/(<img id="product-main-photo"[^>]*?)src="[^"]*"/,(_,open)=>open+'src="'+esc(photoUrl(p))+'"').replace(/(<img id="product-main-photo"[^>]*?)alt="[^"]*"/,(_,open)=>open+'alt="'+esc(p.title)+'"');
 const product={'@type':'Product','@id':productUrl(p)+'#product',name:p.title,description:p.desc,url:productUrl(p),image:[photoUrl(p),...(p.galleryImages||[]).map((_,i)=>photoUrl(p,i+1))],brand:{'@type':'Brand',name:'Desnio Sense'},category:sections[p.section],sku:p.productCode||p.id,...(p.material?{material:p.material}:{}),...(p.colours?.length?{color:p.colours.join(', ')}:{})};
 // No invented reviews, stock claims or purchasable offers while live checkout is disabled.
 return{status:200,html:replaceHead(html,{title:p.title+' | '+(p.baseId==='tshirt'?(p.audience==='Couples'?'Couple T-shirts':p.audience==='Women'?'Women’s Graphic T-shirt':p.audience==='Men'?'Men’s Graphic T-shirt':'Graphic T-shirt'):p.singular||sections[p.section])+' | Desnio Sense India',description:p.desc.slice(0,170),url:productUrl(p),image:photoUrl(p),schema:[product,crumbs(p.title,productUrl(p))]})};
}
export function sitemap(products){
 const items=products.filter(publishedProduct),entries=new Map(publicPages.map(p=>[ORIGIN+p,{}]));
 for(const section of Object.keys(sections)){
  if(section!=='all'&&!items.some(p=>p.section===section))continue;
  for(const link of collectionLinks(items,section))entries.set(link.url,{});
 }
 if(items.some(p=>p.collectionName==='The Arabic Collection'))entries.set(collectionInfo(new URLSearchParams({section:'accessories',collection:'The Arabic Collection'})).url,{});
 for(const p of items)entries.set(productUrl(p),{product:p});
 return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+[...entries].map(([url,{product:p}])=>{
  const date=p&&typeof p.updatedAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(p.updatedAt)?Date.parse(p.updatedAt):NaN,lastmod=Number.isFinite(date)&&date<=Date.now()?'<lastmod>'+new Date(date).toISOString()+'</lastmod>':'';
  const photos=p?[...new Set([photoUrl(p),...(p.galleryImages||[]).map((_,i)=>photoUrl(p,i+1))])]:[];
  return '<url><loc>'+esc(url)+'</loc>'+lastmod+photos.map(src=>'<image:image><image:loc>'+esc(src)+'</image:loc></image:image>').join('')+'</url>';
 }).join('')+'</urlset>';
}



