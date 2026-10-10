'use strict';
const SECTIONS={all:{name:'All products',description:'Everyday essentials, with a little more you.'},apparel:{name:'Apparel',description:'Wear your personality. Make your own statement.'},accessories:{name:'Accessories',description:''},lifestyle:{name:'Drinkware & lifestyle',description:'Little rituals, made a little more personal.'},stationery:{name:'Stationery',description:'For your ideas, plans and everyday inspiration.'}};
const PRODUCTS=[
 {id:'tshirt',name:'T-shirts',singular:'T-shirt',section:'apparel',icon:'shirt',image:'tshirt',desc:'A wearable canvas for your creativity.',style:'graphic',fresh:true},
 {id:'jersey',name:'Jerseys',singular:'Jersey',section:'apparel',icon:'jersey',image:'jersey',desc:'Your team. Your name. Your colours.',style:'graphic'},
 {id:'cap',name:'Caps',singular:'Cap',section:'apparel',icon:'cap',image:'cap',desc:'The finishing touch, with personality.',style:'graphic'},
 {id:'hoodie',name:'Hoodies',singular:'Hoodie',section:'apparel',icon:'hoodie',image:'hoodie',desc:'Everyday comfort with an original print.',style:'graphic',fresh:true},
 {id:'sweatshirt',name:'Sweatshirts',singular:'Sweatshirt',section:'apparel',icon:'sweatshirt',image:'sweatshirt',desc:'A clean canvas for your next favourite.',style:'blank'},
 {id:'case',name:'Phone cases',singular:'Phone case',section:'accessories',icon:'case',image:'case',desc:'Keep your favourite design close.',style:'graphic'},
 {id:'tote',name:'Tote bags',singular:'Tote bag',section:'accessories',icon:'tote',image:'tote',desc:'Carry your ideas everywhere.',style:'graphic'},
 {id:'bottle',name:'Bottles',singular:'Bottle',section:'lifestyle',icon:'bottle',image:'bottle',desc:'Make every refill your own.',style:'graphic',fresh:true},
 {id:'mug',name:'Coffee cups',singular:'Coffee cup',section:'lifestyle',icon:'mug',image:'mug',desc:'Your morning ritual, reimagined.',style:'graphic'},
 {id:'plate',name:'Plates',singular:'Plate',section:'lifestyle',icon:'plate',image:'plate',desc:'Bring original design to the table.',style:'graphic'},
 {id:'journal',name:'Journals',singular:'Journal',section:'stationery',icon:'journal',image:'journal',desc:'A cover as individual as your thoughts.',style:'graphic',fresh:true},
 {id:'notepad',name:'Notepads',singular:'Notepad',section:'stationery',icon:'notepad',image:'notepad',desc:'A little inspiration for every idea.',style:'graphic'},
 {id:'sticker',name:'Stickers',singular:'Sticker',section:'stationery',icon:'sticker',image:'sticker',desc:'Small designs. Endless possibilities.',style:'graphic'}
];
const productImage=p=>p.imageSrc||((p.baseId||p.id)==='sweatshirt'?'assets/blanks/sweatshirt-front.png':'assets/products/'+p.image+'.jpg');
const iconPath=p=>'assets/icons/'+p.icon+(p.icon==='sweatshirt'?'.svg':'.png');


