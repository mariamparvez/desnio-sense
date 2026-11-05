import test from 'node:test';
import assert from 'node:assert/strict';
import {cataloguePolicyPatch,APPAREL_SIZES,APPAREL_TYPES,CATEGORY_PRICES,TOTE_PRICE_POLICY_ID} from './catalogue-policy.mjs';
import {catalogueRecord} from './domain.mjs';
const product={id:'P',baseId:'tshirt',status:'Active',approved:true,title:'Owner design',singular:'T-shirt',section:'apparel',icon:'shirt',image:'tshirt',imageSrc:'assets/front.webp',galleryImages:['assets/back.webp'],desc:'Owner copy',price:840,colours:['White'],stock:8,variants:['M'],offer:null};
test('Every garment receives XS through 3XL, while caps keep their own options',()=>{
 for(const baseId of APPAREL_TYPES)assert.deepEqual(cataloguePolicyPatch({...product,baseId},'now').variants,[...APPAREL_SIZES]);
 assert(!Object.hasOwn(cataloguePolicyPatch({...product,baseId:'cap'},'now'),'variants'));
 for(const [baseId,price]of Object.entries(CATEGORY_PRICES))assert.equal(cataloguePolicyPatch({...product,baseId,price:1},'now',baseId==='tote'?TOTE_PRICE_POLICY_ID:undefined).price,price);
});
test('The one-time patch changes only authorised prices and sizes',()=>{
 const patch=cataloguePolicyPatch(product,'now');assert.deepEqual(Object.keys(patch).sort(),['updatedAt','variants']);
 const saved={...product,...patch};for(const field of ['title','price','stock','imageSrc','galleryImages','desc','offer'])assert.deepEqual(saved[field],product[field]);
 assert.equal(cataloguePolicyPatch({...product,variants:[...APPAREL_SIZES]},'now'),null);
});
test('Future saves retain full garment sizing and permit later admin price edits',()=>{
 const apparel=catalogueRecord('products',product,product.id);assert.deepEqual(apparel.variants,[...APPAREL_SIZES]);
 assert.equal(catalogueRecord('products',{...product,baseId:'case',price:175},product.id).price,175);
 assert.equal(catalogueRecord('products',{...product,baseId:'case',price:null},product.id).price,140);
});

test('The tote-only update cannot reset another category price or garment sizes',()=>{
 assert.deepEqual(cataloguePolicyPatch({...product,baseId:'tote',price:1},'now',TOTE_PRICE_POLICY_ID),{price:150,updatedAt:'now'});
 assert.equal(cataloguePolicyPatch({...product,baseId:'case',price:175},'now',TOTE_PRICE_POLICY_ID),null);
 assert.equal(cataloguePolicyPatch({...product,price:920,variants:['M']},'now',TOTE_PRICE_POLICY_ID),null);
 assert.equal(catalogueRecord('products',{...product,baseId:'tote',price:null},product.id).price,150);
 assert.equal(catalogueRecord('products',{...product,baseId:'tote',price:180},product.id).price,180);
});
