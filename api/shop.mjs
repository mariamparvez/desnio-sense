import fs from 'node:fs/promises';
import path from 'node:path';
import {renderCollection,renderProduct,sitemap} from '../server/seo.mjs';
export async function GET(request){
 try{const {db}=await import('../server/firebase.mjs'),url=new URL(request.url),view=url.searchParams.get('view');let data=[];
  if(view==='product'){const id=url.searchParams.get('product')||'';if(/^[a-zA-Z0-9_-]{1,150}$/.test(id)){const d=await db.doc('products/'+id).get();if(d.exists)data=[{...d.data(),id:d.id}];}}
  else{let cursor;do{let query=db.collection('products').where('status','==','Active').where('approved','==',true).orderBy('__name__').limit(200);if(cursor)query=query.startAfter(cursor);const page=await query.get();data.push(...page.docs.map(d=>({...d.data(),id:d.id})));cursor=page.size===200?page.docs.at(-1):null;}while(cursor);}
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(view==='sitemap')return new Response(sitemap(data),{headers:{...headers,'Content-Type':'application/xml; charset=utf-8'}});
  const template=await fs.readFile(path.join(process.cwd(),view==='product'?'product.html':'products.html'),'utf8'),rendered=view==='product'?renderProduct(template,data[0]):{html:renderCollection(template,data,url.searchParams),status:200};
  return new Response(rendered.html,{status:rendered.status,headers:{...headers,'Content-Type':'text/html; charset=utf-8',...(rendered.status===404?{'X-Robots-Tag':'noindex'}:{})}});
 }catch{return new Response('The catalogue is temporarily unavailable. Please try again shortly.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex','Retry-After':'60'}});}
}
