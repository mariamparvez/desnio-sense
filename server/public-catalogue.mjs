import fs from 'node:fs/promises';
import {credential,db} from './firebase.mjs';
import {publishedProduct,assert} from './domain.mjs';
import {CATALOGUE_POLICY_ID,CATALOGUE_POLICY_IDS,cataloguePolicyPatch} from './catalogue-policy.mjs';
let cached,until=0,pending,policyPending,policyChecked=false,policyRetryAfter=0;
async function ensureCataloguePolicy(){
 if(process.env.VERCEL_ENV!=='production'||policyChecked||Date.now()<policyRetryAfter)return;
 if(!policyPending)policyPending=(async()=>{for(const policy of CATALOGUE_POLICY_IDS)await refreshPublicCatalogue({policy});policyChecked=true;})().catch(()=>{policyRetryAfter=Date.now()+60000}).finally(()=>{policyPending=null});
 await policyPending;
}
const decode=v=>'stringValue'in v?v.stringValue:'booleanValue'in v?v.booleanValue:'integerValue'in v?Number(v.integerValue):'doubleValue'in v?v.doubleValue:'timestampValue'in v?v.timestampValue:'nullValue'in v?null:'arrayValue'in v?(v.arrayValue.values||[]).map(decode):'mapValue'in v?Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,decode(x)])):null;
async function readDoc(id){const token=await credential().getAccessToken(),r=await fetch('https://firestore.googleapis.com/v1/projects/desniosense/databases/(default)/documents/publicCatalogue/'+id,{headers:{Authorization:'Bearer '+token.access_token},signal:AbortSignal.timeout(5000)});if(!r.ok)throw new Error('Public catalogue read unavailable: '+r.status);const d=await r.json();return Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,decode(v)]));}
export async function publicCatalogue(revision=0){await ensureCataloguePolicy();if(cached&&Date.now()<until&&revision<=Number(cached.revision||0))return cached;if(!pending)pending=(async()=>{try{const manifest=await readDoc('current');if(manifest.bootstrap)return await refreshPublicCatalogue();const pages=await Promise.all(manifest.pages.map(readDoc)),next={products:pages.flatMap(p=>p.products||[]).filter(publishedProduct),phoneModels:pages.flatMap(p=>p.phoneModels||[]).concat(manifest.phoneModels||[]),jobs:pages.flatMap(p=>p.jobs||[]).concat(manifest.jobs||[]),revision:manifest.revision||0,updatedAt:manifest.updatedAt,stale:false};if(!cached||Number(next.revision)>=Number(cached.revision||0))cached=next;}catch{cached=cached?{...cached,stale:true}:{...JSON.parse(await fs.readFile(new URL('./catalogue-snapshot.json',import.meta.url),'utf8')),stale:true};}until=Date.now()+60000;return cached;})().finally(()=>pending=null);return pending;}
// Persist the source record and public projection together, preserving image order.
export async function refreshPublicCatalogue(change){
 const data=await db.runTransaction(async t=>{
  const manifestRef=db.doc('publicCatalogue/current'),prior=await t.get(manifestRef),manifest=prior.data()||{};let data;
  const policyRef=CATALOGUE_POLICY_IDS.includes(change?.policy)?db.doc('system/'+change.policy):null;
  if(policyRef&&(await t.get(policyRef)).exists)return null;
  if(change&&prior.exists&&!manifest.bootstrap){const pages=await Promise.all((manifest.pages||[]).map(p=>t.get(db.doc('publicCatalogue/'+p))));data={products:pages.flatMap(p=>p.data()?.products||[]),phoneModels:pages.flatMap(p=>p.data()?.phoneModels||[]).concat(manifest.phoneModels||[]),jobs:pages.flatMap(p=>p.data()?.jobs||[]).concat(manifest.jobs||[])};}
  else{const [products,models,jobs]=await Promise.all([t.get(db.collection('products').where('status','==','Active').where('approved','==',true)),t.get(db.collection('phoneModels').where('status','==','Active')),t.get(db.collection('jobs').where('status','==','Published'))]);data={products:products.docs.map(d=>({...d.data(),id:d.id})).filter(publishedProduct),phoneModels:models.docs.map(d=>({...d.data(),id:d.id})),jobs:jobs.docs.map(d=>({...d.data(),id:d.id}))};}
  if(policyRef){
   const source=await t.get(db.collection('products')),updatedAt=new Date().toISOString(),updates=[];
   data.products=source.docs.map(doc=>{const product={...doc.data(),id:doc.id},patch=cataloguePolicyPatch(product,updatedAt,change.policy);if(patch)updates.push({id:doc.id,patch});return {...product,...patch}});
   for(const update of updates)t.update(db.doc('products/'+update.id),update.patch);
   t.set(policyRef,{id:change.policy,appliedAt:updatedAt,updatedProducts:updates.map(p=>p.id)});
   t.set(db.doc('audit/'+change.policy),{actor:'owner-approved-release',action:change.policy===CATALOGUE_POLICY_ID?'products:category-prices-and-apparel-sizes':change.policy.includes('reference-prices')?'products:reference-prices-and-cups':change.policy.includes('cap-black')?'products:cap-colours':change.policy.includes('tshirt-price')?'products:tshirt-price':'products:tote-price',target:change.policy,at:updatedAt});
  }
  if(change&&!policyRef){const key=change.collection,index=data[key].findIndex(p=>p.id===change.id),visible=change.record&&(key==='products'?publishedProduct(change.record):change.record.status===(key==='jobs'?'Published':'Active')),ref=db.doc(key+'/'+change.id);if(change.hasStockBaseline){const sourceSnapshot=await t.get(ref),source=sourceSnapshot.data();assert(!sourceSnapshot.exists||(source?.stock??null)===change.stockBaseline,'Stock changed while you were editing. Reopen this product to keep the latest inventory.',409);}if(visible){if(index<0)data[key].push(change.record);else data[key][index]=change.record;}else data[key]=data[key].filter(p=>p.id!==change.id);if(change.record)t.set(ref,change.record,{merge:true});else t.delete(ref);if(change.requestId)t.update(db.doc('phoneModelRequests/'+change.requestId),{status:'Added to catalogue',modelId:change.id,updatedAt:new Date().toISOString()});if(change.audit)t.set(db.doc('audit/'+change.audit.id),change.audit);}
  data.products=data.products.filter(publishedProduct);data.revision=Number(manifest.revision||0)+1;data.updatedAt=new Date().toISOString();data.stale=false;const chunks=[{products:[],phoneModels:[],jobs:[]}];
  for(const key of ['products','phoneModels','jobs'])for(const record of data[key]){let last=chunks.at(-1);if(Buffer.byteLength(JSON.stringify({...last,[key]:[...last[key],record]}))>500000&&Object.values(last).some(a=>a.length)){last={products:[],phoneModels:[],jobs:[]};chunks.push(last);}last[key].push(record);}
  const pages=chunks.map((_,i)=>'v'+data.revision+'-page-'+i);chunks.forEach((chunk,i)=>t.set(db.doc('publicCatalogue/'+pages[i]),chunk));for(const old of manifest.previousPages||[])if(!pages.includes(old))t.delete(db.doc('publicCatalogue/'+old));t.set(manifestRef,{pages,previousPages:manifest.pages||[],revision:data.revision,updatedAt:data.updatedAt});return data;
 });if(!data)return null;if(!cached||data.revision>=Number(cached.revision||0))cached=data;until=Date.now()+60000;return data;
}


