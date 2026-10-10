(async()=>{
 await DS.ready;
 const grid=document.querySelector('#home-product-grid'),section=document.querySelector('#latest-products');
 function render(){section.hidden=!PRODUCTS.length;grid.innerHTML=PRODUCTS.map(productCard).join('');}
 render();window.addEventListener('ds-cloud-change',render);
})().catch(error=>DS.fail(error));
