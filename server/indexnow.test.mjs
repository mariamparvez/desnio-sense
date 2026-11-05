import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {INDEXNOW_KEY,INDEXNOW_KEY_URL,submitIndexNow,catalogueChangeUrls} from './indexnow.mjs';
test('IndexNow file and submissions use the same public ownership key',async()=>{
 assert.equal((await fs.readFile(new URL('../'+INDEXNOW_KEY+'.txt',import.meta.url),'utf8')).trim(),INDEXNOW_KEY);
 let sent;const result=await submitIndexNow(catalogueChangeUrls('MERCH-1'),{enabled:true,fetchImpl:async(url,options)=>{sent={url,...options};return {status:200}}});
 assert.equal(result.status,'submitted');assert.equal(sent.url,'https://api.indexnow.org/indexnow');const data=JSON.parse(sent.body);assert.equal(data.keyLocation,INDEXNOW_KEY_URL);assert.equal(data.host,'www.desniosense.com');assert.equal(data.urlList.length,3);
});
test('IndexNow refuses external URLs and network failures cannot undo a catalogue save',async()=>{
 await assert.rejects(()=>submitIndexNow(['https://attacker.example/'],{enabled:true}));
 assert.equal((await submitIndexNow(catalogueChangeUrls('MERCH-1'),{enabled:true,fetchImpl:async()=>{throw new Error('timeout')}})).status,'retry-needed');
 assert.equal((await submitIndexNow(catalogueChangeUrls('MERCH-1'),{enabled:false,fetchImpl:()=>{throw new Error('must not call')}})).status,'disabled');
});
