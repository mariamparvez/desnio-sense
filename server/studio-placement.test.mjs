import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
test('Mug back upload area and new artwork sit on the body after the handle switches sides',async()=>{
 const source=await fs.readFile(new URL('../studio.js',import.meta.url),'utf8');
 const zone=source.slice(source.indexOf('function zone(){'),source.indexOf('async function drawProduct('));
 const addLayer=source.slice(source.indexOf('function addLayer('),source.indexOf('function removeSelected('));
 for(const side of ['front','back']){
  const placed=[],b={x:40,y:148,w:540,h:445},context=vm.createContext({state:{side,scenes:{}},currentProduct:()=>({baseId:'mug'}),bounds:()=>b,layers:()=>placed,crypto:{randomUUID:()=>side},commit(){},bounded(){},updateUI(){},render(){},toast(){},selected:null});
  const z=vm.runInContext(zone+';zone()',context);
  // The inspected templates have the body at 0–70% (front) and 30–100% (back).
  const body={left:b.x+b.w*(side==='back'?.30:0),right:b.x+b.w*(side==='back'?1:.70)};
  assert(z.x>body.left);assert(z.x+z.w<body.right);assert(z.y>b.y);assert(z.y+z.h<b.y+b.h);
  vm.runInContext(addLayer+';addLayer({type:"image",w:100,h:90})',context);
  assert.equal(placed.length,1);assert.equal(placed[0].x+50,z.x+z.w/2);assert.equal(placed[0].y+45,z.y+z.h/2);
 }
});
