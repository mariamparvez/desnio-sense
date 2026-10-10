import fs from 'node:fs/promises';
import {credential,db} from './firebase.mjs';
import {publishedProduct} from './domain.mjs';
let cached,until=0,pending;
const decode=v=>'stringValue'in v?v.stringValue:'booleanValue'in v?v.booleanValue:'integerValue'in v?Number(v.integerValue):'doubleValue'in v?v.doubleValue:'timestampValue'in v?v.timestampValue:'nullValue'in v?null:'arrayValue'in v?(v.arrayValue.values||[]).map(decode):'mapValue'in v?Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,decode(x)])):null;
async function readDoc(id){const token=await credential().getAccessToken(),r=await fetch('https://firestore.googleapis.com/v1/projects/desniosense/databases/(default)/documents/publicCatalogue/'+id,{headers:{Authorization:'Bearer '+token.access_token},signal:AbortSignal.timeout(5000)});if(!r.ok)throw new Error('Public catalogue read unavailable: '+r.status);const d=await r.json();return Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,decode(v)]));}
export async function publicCatalogue(){if(cached&&Date.now()<until)return cached;if(!pending)pending=(async()=>{try{const manifest=await readDoc('current');if(manifest.bootstrap)return await refreshPublicCatalogue();const pages=await Promise.all(manifest.pages.map(readDoc));cached={products:pages.flatMap(p=>p.products||[]).filter(publishedProduct),phoneModels:pages.flatMap(p=>p.phoneModels||[]).concat(manifest.phoneModels||[]),jobs:pages.flatMap(p=>p.jobs||[]).concat(manifest.jobs||[]),stale:false};}catch{cached=cached?{...cached,stale:true}:{...JSON.parse(await fs.readFile(new URL('./catalogue-snapshot.json',import.meta.url),'utf8')),stale:true};}until=Date.now()+60000;return cached;})().finally(()=>pending=null);return pending;}
export async function refreshPublicCatalogue(){
 const data=await db.runTransaction(async t=>{
  const [products,models,jobs,prior]=await Promise.all([t.get(db.collection('products').where('status','==','Active').where('approved','==',true)),t.get(db.collection('phoneModels').where('status','==','Active')),t.get(db.collection('jobs').where('status','==','Published')),t.get(db.doc('publicCatalogue/current'))]);
  const data={products:products.docs.map(d=>({...d.data(),id:d.id})).filter(publishedProduct),phoneModels:models.docs.map(d=>({...d.data(),id:d.id})),jobs:jobs.docs.map(d=>({...d.data(),id:d.id})),stale:false},chunks=[{products:[],phoneModels:[],jobs:[]}];
  for(const key of ['products','phoneModels','jobs'])for(const record of data[key]){let last=chunks.at(-1);if(Buffer.byteLength(JSON.stringify({...last,[key]:[...last[key],record]}))>500000&&Object.values(last).some(a=>a.length)){last={products:[],phoneModels:[],jobs:[]};chunks.push(last);}last[key].push(record);}
  const pages=chunks.map((_,i)=>'page-'+i);chunks.forEach((chunk,i)=>t.set(db.doc('publicCatalogue/'+pages[i]),chunk));for(const old of prior.data()?.pages||[])if(!pages.includes(old))t.delete(db.doc('publicCatalogue/'+old));t.set(db.doc('publicCatalogue/current'),{pages,updatedAt:new Date().toISOString()});return data;
 });cached=data;until=Date.now()+60000;return data;
}

