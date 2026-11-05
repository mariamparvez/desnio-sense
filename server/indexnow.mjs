import {ORIGIN} from './seo.mjs';
// IndexNow ownership keys are public verification data, not authentication secrets.
export const INDEXNOW_KEY='d6000cef599a10daf917e7fd882d5b25';
export const INDEXNOW_KEY_URL=ORIGIN+'/'+INDEXNOW_KEY+'.txt';
export async function submitIndexNow(urls,{enabled=process.env.VERCEL_ENV==='production',fetchImpl=fetch}={}){
 if(!enabled)return {status:'disabled'};
 const urlList=[...new Set(urls)];
 if(!urlList.length||urlList.length>10000||urlList.some(value=>{try{const u=new URL(value);return u.origin!==ORIGIN||u.username||u.password||u.hash||value.length>2048}catch{return true}}))throw new Error('Invalid IndexNow URL batch.');
 try{
  const response=await fetchImpl('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify({host:new URL(ORIGIN).hostname,key:INDEXNOW_KEY,keyLocation:INDEXNOW_KEY_URL,urlList}),signal:AbortSignal.timeout(3000)});
  return {status:[200,202].includes(response.status)?'submitted':'retry-needed',httpStatus:response.status};
 }catch{return {status:'retry-needed'};}
}
export function catalogueChangeUrls(id){return [ORIGIN+'/',ORIGIN+'/products.html',ORIGIN+'/product.html?product='+encodeURIComponent(id)];}
