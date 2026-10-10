import {createHash} from 'node:crypto';
export class AppError extends Error { constructor(message,status=400){super(message);this.status=status;} }
export function assert(condition,message,status=400){if(!condition)throw new AppError(message,status);}
export function text(value,max=200,required=true){assert(typeof value==='string','Enter valid text.');const result=value.trim();assert(result.length<=max&&(!required||result.length>0),'A required field is empty or too long.');return result;}
export function email(value){const result=text(value,254).toLowerCase();assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result),'Enter a valid email address.');return result;}
export function phone(value){const result=text(value||'',24,false);assert(!result||/^\+?[\d\s()-]{7,24}$/.test(result),'Enter a valid phone number.');return result;}
export function id(value){const result=text(value,150);assert(/^[a-zA-Z0-9_-]+$/.test(result),'Invalid record reference.');return result;}
export function number(value,min,max){assert(typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max,'Enter a valid number.');return value;}
export function image(value){if(!value)return '';assert(typeof value==='string'&&value.length<100000,'Use an image smaller than 100 KB or an HTTPS image URL.');assert(!/["'<>]/.test(value)&&!value.includes('../')&&/^(assets\/[\w./-]+|https:\/\/[^\s]+|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/.test(value),'Invalid image URL or image format.');return value;}
export function profile(input){return {name:text(input.name,100),phone:phone(input.phone)};}
export function delivery(input){return {...profile(input),address:text(input.address,500),city:text(input.city,100),pincode:text(input.pincode,6),...(input.state?{state:text(input.state,100)}:{})};}
export function publishedProduct(p){return !!p&&p.status==='Active'&&p.approved===true&&typeof p.title==='string'&&p.title.trim().length>0&&Number.isFinite(p.price)&&p.price>0;}
export function modelRequest(input,product){assert(['Android','iPhone'].includes(input.platform),'Choose a phone platform.');const result={platform:input.platform,brand:input.platform==='iPhone'?'Apple':text(input.brand,100),name:text(input.name,150),status:'Pending',payment:'Not paid'};if(input.productId){assert(publishedProduct(product)&&(product.baseId||product.id)==='case','This phone case is unavailable.',409);Object.assign(result,{productId:product.id,productName:product.title,productCode:product.productCode||product.id,productImage:image(product.imageSrc),price:product.price,quantity:number(input.quantity||1,1,20)});assert(Number.isInteger(result.quantity),'Quantity must be a whole number.');}return result;}
export function priceOrder(cart,products){
 assert(Array.isArray(cart)&&cart.length>0&&cart.length<=25,'Choose between 1 and 25 items.');
 const requested=new Map(),items=cart.map(item=>{
  assert(item.custom!==true,'Custom-order submission is paused until permanent original artwork storage is enabled.',409);
  const p=products.find(p=>p.id===item.product);assert(publishedProduct(p),'A selected product is unavailable.',409);
  const quantity=number(item.quantity,1,20);assert(Number.isInteger(quantity),'Quantity must be a whole number.');
  requested.set(p.id,(requested.get(p.id)||0)+quantity);
  if((p.baseId||p.id)!=='case')assert(Array.isArray(p.variants)&&p.variants.includes(item.variant),'Choose an available size or option.');
  assert(Array.isArray(p.colours)&&p.colours.includes(item.colour),'Choose an available product colour.');
  let phoneModel=null;
  if((p.baseId||p.id)==='case'){assert(item.phoneModel&&['Android','iPhone'].includes(item.phoneModel.platform),'Select your exact phone model.');phoneModel={platform:item.phoneModel.platform,brand:text(item.phoneModel.brand,100),name:text(item.phoneModel.name,150),requested:!!item.phoneModel.requested};if(item.phoneModel.id)phoneModel.id=id(item.phoneModel.id);}
  const price=number(p.price,1,1000000);assert(Math.abs(price*100-Math.round(price*100))<0.00001,'Catalogue price has invalid precision.');
  return {product:p.id,name:p.title,quantity,price,variant:text(item.variant,180),colour:text(item.colour||'Ivory',50),custom:false,phoneModel,image:image(p.imageSrc||('assets/products/'+p.image+'.jpg'))};
 });
 for(const [product,quantity] of requested){const p=products.find(p=>p.id===product);if(Number.isFinite(p.stock))assert(p.stock>=quantity,'The requested quantity is out of stock.',409);}
 const subtotal=items.reduce((total,i)=>total+i.quantity*Math.round(i.price*100),0)/100;return{items,subtotal,discount:0,shipping:0,total:subtotal};
}
export function orderKey(uid,key){assert(typeof key==='string'&&/^[a-f0-9-]{36}$/i.test(key),'Invalid checkout reference.');return 'DS-'+createHash('sha256').update(uid+':'+key).digest('hex').slice(0,24).toUpperCase();}
export function canCancel(order){return ['Placed','Processing'].includes(order.status)&&!(order.custom&&order.status==='Processing');}
export function catalogueRecord(collection,input,recordId){
 const common={id:recordId,status:text(input.status,30)};
 if(collection==='products'){
  assert(['Active','Inactive','Draft','Deleted'].includes(common.status),'Invalid product status.');assert(['apparel','accessories','lifestyle','stationery'].includes(input.section),'Choose a store section.');
  const base=id(input.baseId||recordId);assert(['tshirt','jersey','cap','hoodie','sweatshirt','case','tote','bottle','mug','plate','journal','notepad','sticker'].includes(base),'Choose a supported product canvas.');
  const active=common.status==='Active',approved=input.approved===true;
  const variants=input.variants||[],colours=input.colours||[];
  assert(Array.isArray(variants)&&variants.length<=30,'Enter valid product options.');
  assert(Array.isArray(colours)&&colours.length<=30&&(!active||colours.length>0),'Add product colours before publishing.');
  const audience=text(input.audience||'Unisex',30);assert(['Women','Men','Unisex','Couples','Kids'].includes(audience),'Choose a product audience.');
  assert(!active||approved,'Approve this merchandise before publishing.');
  const title=text(input.title||'',200,active),price=input.price==null||input.price===''?null:number(input.price,1,1000000);
  assert(!active||price!==null,'Set the product price before publishing.');
  const result={...common,approved,title,name:title,productCode:id(input.productCode||recordId),singular:text(input.singular,100),baseId:base,section:input.section,icon:id(input.icon),image:id(input.image),price,variants:variants.map(v=>text(v,100)),colours:colours.map(v=>text(v,50)),audience,material:text(input.material||'',300,false),desc:text(input.desc||'',2000,active),designer:text(input.designer||'',150,false),collectionName:text(input.collectionName||'',150,false),care:text(input.care||'',2000,false),imageSrc:image(input.imageSrc),galleryImages:(input.galleryImages||[]).slice(0,6).map(image),fresh:!!input.fresh};
  assert(!active||result.imageSrc,'Upload the actual merchandise image before publishing.');
  if(price!==null)assert(Math.abs(price*100-Math.round(price*100))<0.00001,'Use at most two decimal places for price.');
  if(input.stock!=null){result.stock=number(input.stock,0,1000000);assert(Number.isInteger(result.stock),'Stock must be a whole number.');}return result;
 }
 if(collection==='phoneModels'){assert(['Android','iPhone'].includes(input.platform)&&['Active','Inactive'].includes(common.status),'Invalid phone type or status.');return{...common,platform:input.platform,brand:input.platform==='iPhone'?'Apple':text(input.brand,100),name:text(input.name,150),...Object.fromEntries(['frontPhoto','backPhoto','frontTemplate','backTemplate'].map(k=>[k,image(input[k])])),templateVerified:!!input.templateVerified};}
 if(collection==='jobs'){assert(['Draft','Published'].includes(common.status),'Invalid role visibility.');return{...common,title:text(input.title,200),department:text(input.department,100),location:text(input.location,100),type:text(input.type,50),email:email(input.email),description:text(input.description,10000),image:image(input.image)};}
 throw new AppError('Unsupported collection.');
}

export function corporateEnquiry(input){
 assert(input.consent===true,'Please agree to being contacted about your enquiry.');
 const quantity=Number(input.quantity);assert(Number.isInteger(quantity)&&quantity>=1&&quantity<=100000,'Enter a whole quantity between 1 and 100,000.');
 const interest=text(input.interest,100);assert(['Apparel','Tote bags','Phone cases','Drinkware','Mixed products'].includes(interest),'Choose a supported product type.');
 const contact=phone(input.phone);assert(contact&&contact.replace(/\D/g,'').length>=7,'Enter your phone number.');
 const deadline=text(input.deadline||'',10,false);assert(!deadline||(/^\d{4}-\d{2}-\d{2}$/.test(deadline)&&Number.isFinite(Date.parse(deadline))&&new Date(deadline).toISOString().slice(0,10)===deadline),'Enter a valid delivery date.');
 return{name:text(input.name,100),company:text(input.company,150),email:email(input.email),phone:contact,interest,quantity,city:text(input.city,100),deadline,message:text(input.message,3000),consent:true};
}

