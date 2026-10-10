import fs from 'node:fs/promises';
import path from 'node:path';
import {renderCollection,renderProduct,sitemap} from '../server/seo.mjs';
export async function GET(request){
 try{const {publicCatalogue}=await import('../server/public-catalogue.mjs'),url=new URL(request.url),view=url.searchParams.get('view'),catalogue=await publicCatalogue();let data=catalogue.products;
  if(view==='product')data=data.filter(p=>p.id===url.searchParams.get('product'));
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(view==='sitemap')return new Response(sitemap(data),{headers:{...headers,'Content-Type':'application/xml; charset=utf-8'}});
  const template=await fs.readFile(path.join(process.cwd(),view==='product'?'product.html':'products.html'),'utf8'),rendered=view==='product'?renderProduct(template,data[0]):{html:renderCollection(template,data,url.searchParams),status:200};
  return new Response(rendered.html,{status:rendered.status,headers:{...headers,'Content-Type':'text/html; charset=utf-8',...(rendered.status===404?{'X-Robots-Tag':'noindex'}:{})}});
 }catch{return new Response('The catalogue is temporarily unavailable. Please try again shortly.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex','Retry-After':'60'}});}
}

