import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateRequest,privileges} from './security.mjs';
const request=(headers={},body={name:'Customer'})=>({method:'POST',headers:{'content-type':'application/json',...headers},body});
test('Origin checks use a fixed allowlist rather than an attacker supplied Host',()=>{
 assert.throws(()=>validateRequest(request({host:'evil.example',origin:'https://evil.example'}),{production:true}),e=>e.status===403);
 assert.throws(()=>validateRequest(request({origin:'null'}),{production:true}),e=>e.status===403);
 assert.throws(()=>validateRequest(request({origin:'http://localhost:4173'}),{production:true}),e=>e.status===403);
 assert.deepEqual(validateRequest(request({origin:'https://desnio-sense.vercel.app'}),{production:true}),{name:'Customer'});
 assert.deepEqual(validateRequest(request({origin:'http://localhost:4173'}),{production:false}),{name:'Customer'});
});
test('Cross-site forms, oversized requests and malformed JSON are rejected',()=>{
 for(const [req,status]of [[request({'sec-fetch-site':'cross-site'}),403],[request({'content-type':'text/plain'}),415],[request({'content-length':'700001'}),413],[request({},'{'),400],[request({},[]),400],[request({authorization:'x'.repeat(10001)}),400]])assert.throws(()=>validateRequest(req),e=>e.status===status);
});
test('Admin access requires verified claims and an active directory record',()=>{
 const current={emailVerified:true,customClaims:{admin:true,adminHead:true}},token={email_verified:true,admin:true,adminHead:true},directory={status:'Active',role:'Admin Head'};
 assert.deepEqual(privileges(current,token,directory,{status:'Active'}),{admin:true,adminHead:true});
 for(const d of [null,{...directory,status:'Inactive'},{...directory,deleted:true}])assert.equal(privileges(current,token,d,{status:'Active'}).admin,false);
 assert.equal(privileges(current,{...token,admin:false},directory,{}).admin,false);
 assert.equal(privileges({...current,emailVerified:false},token,directory,{}).admin,false);
 assert.equal(privileges(current,token,{...directory,role:'Admin'},{}).adminHead,false);
});
test('Browser policy blocks inline scripts, framing and arbitrary connections',async()=>{
 const config=JSON.parse(await fs.readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 const headers=Object.fromEntries(config.headers[0].headers.map(h=>[h.key,h.value]));
 const policy=headers['Content-Security-Policy'];
 assert.match(policy,/frame-ancestors 'none'/);assert.match(policy,/object-src 'none'/);assert.match(policy,/base-uri 'none'/);assert.match(policy,/script-src-attr 'none'/);
 const scripts=policy.split(';').find(p=>p.trim().startsWith('script-src '));
 assert(!scripts.includes('unsafe-inline')&&!scripts.includes('unsafe-eval'));
 assert.equal(headers['X-Frame-Options'],'DENY');
});
