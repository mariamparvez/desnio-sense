import test from 'node:test';
import assert from 'node:assert/strict';
import {corporateEnquiry} from './domain.mjs';
const input={name:'Asha',company:'Example team',email:'asha@example.com',phone:'+91 99999 12345',interest:'Apparel',quantity:100,city:'Chennai',deadline:'2026-12-01',message:'Team event T-shirts',consent:true};
test('bulk enquiries retain contact and order requirements but reject privileged client fields',()=>{const result=corporateEnquiry({...input,payment:'Paid',status:'Resolved',customerId:'someone-else',admin:true});assert.equal(result.quantity,100);assert.equal(result.company,'Example team');for(const key of ['payment','status','customerId','admin'])assert.equal(result[key],undefined);});
test('bulk enquiries require valid consent, contact details, product type and quantity',()=>{for(const changed of [{consent:false},{email:'invalid'},{phone:''},{quantity:0},{quantity:1.2},{quantity:100001},{interest:'invalid'},{name:''},{message:'x'.repeat(3001)},{deadline:'2026-02-30'}])assert.throws(()=>corporateEnquiry({...input,...changed}));});

