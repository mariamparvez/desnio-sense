import {publishedProduct} from '../server/domain.mjs';
export async function GET(request){
 try{const url=new URL(request.url),id=url.searchParams.get('id')||'',index=Number(url.searchParams.get('photo')||0);if(!/^[a-zA-Z0-9_-]{1,150}$/.test(id)||!Number.isInteger(index)||index<0||index>6)return new Response('Not found',{status:404});
  const {db}=await import('../server/firebase.mjs'),snapshot=await db.doc('products/'+id).get(),p=snapshot.data();if(!publishedProduct(p))return new Response('Not found',{status:404});const src=index?p.galleryImages?.[index-1]:p.imageSrc,match=typeof src==='string'&&src.length<100000&&src.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);if(!match)return new Response('Not found',{status:404});
  return new Response(Buffer.from(match[2],'base64'),{headers:{'Content-Type':'image/'+match[1],'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});
 }catch{return new Response('Image unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}
