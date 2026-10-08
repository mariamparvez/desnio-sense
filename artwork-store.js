'use strict';
// Original upload bytes live in IndexedDB, separately from fast display previews.
const ArtworkStore=(()=>{
 let connection;
 function db(){return connection??(connection=new Promise((resolve,reject)=>{const r=indexedDB.open('desnio-original-artwork',1);r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Artwork storage is blocked. Close other previews and try again.'))}))}
 async function put(file,width,height){const database=await db(),record={id:crypto.randomUUID(),blob:file,name:file.name,type:file.type,width,height,created:new Date().toISOString()};await new Promise((res,rej)=>{const tx=database.transaction('files','readwrite');tx.objectStore('files').put(record);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error)});return record}
 async function get(id){if(!id)return null;const database=await db();return new Promise((res,rej)=>{const r=database.transaction('files').objectStore('files').get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
 return{put,get};
})();
