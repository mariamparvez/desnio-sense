import {randomUUID} from 'node:crypto';
import {auth,appCheck,db,stamp,credential} from './firebase.mjs';
import {AppError,assert,text,email,phone,id,profile,delivery,priceOrder,orderKey,canCancel,catalogueRecord,modelRequest} from './domain.mjs';
import {validateRequest,privileges,responseSecurity} from './security.mjs';
import {paymentSettings} from './razorpay.mjs';
import {startTestPayment,verifyTestPayment,testPaymentStatus} from './payments.mjs';
const OWNER='designwithmariam@gmail.com';
const features={payments:false,artworkStorage:false,phoneLogin:false,facebookLogin:false,orderRequests:true};
const actions=new Set(['profile','create-order','cancel-order','people','catalogue','ticket','update-ticket','update-order','newsletter','application','model-request','create-payment','verify-payment','payment-status']);
let healthUntil=0;
const clean=record=>JSON.parse(JSON.stringify(record,(key,value)=>value?.toDate?value.toDate().toISOString():value));
function audit(actor,action,target){return db.collection('audit').add({actor:actor.uid,action,target,at:stamp()});}
async function actor(req){
 const bearer=String(req.headers.authorization||'').match(/^Bearer (.+)$/);assert(bearer,'Sign in to continue.',401);
 let token,current;try{token=await auth.verifyIdToken(bearer[1],true);current=await auth.getUser(token.uid);}catch{throw new AppError('Your session expired. Sign in again.',401);}
 assert(!current.disabled,'This account is disabled.',403);
 const user=(await db.doc('users/'+token.uid).get()).data();assert(user?.status!=='Inactive','This account is inactive.',403);
 const directory=current.customClaims?.admin?(await db.doc('admins/'+token.uid).get()).data():null;
 return {...token,email:current.email,email_verified:current.emailVerified&&token.email_verified===true,...privileges(current,token,directory,user)};
}
function staff(a,head=false){assert(a.admin&&(!head||a.adminHead),'You do not have permission for this action.',403);}
async function rate(a,action,max=30){const ref=db.doc('rateLimits/'+a.uid+'-'+action),now=Date.now();await db.runTransaction(async t=>{const data=(await t.get(ref)).data(),start=data?.start||now,count=now-start<60000?(data?.count||0):0;assert(count<max,'Too many requests. Please wait a minute.',429);t.set(ref,{start:now-start<60000?start:now,count:count+1});});}
async function dailyContentLimit(a,action){
 if(!['ticket','application','model-request','newsletter'].includes(action))return;
 assert(a.email_verified,'Verify your email address from My account before submitting this request.',403);
 const day=new Date().toISOString().slice(0,10),ref=db.doc('rateLimits/'+a.uid+'-content-'+day);
 await db.runTransaction(async t=>{const count=(await t.get(ref)).data()?.count||0;assert(count<20,'You have reached today’s submission limit. Contact us on WhatsApp.',429);t.set(ref,{count:count+1});});
}
async function saveProfile(a,data){const p=profile(data),ref=db.doc('users/'+a.uid);await db.runTransaction(async t=>{const previous=(await t.get(ref)).data();t.set(ref,{uid:a.uid,id:a.uid,...p,email:a.email||'',status:previous?.status||'Active',createdAt:previous?.createdAt||stamp(),updatedAt:stamp()});});await auth.updateUser(a.uid,{displayName:p.name});return{profile:{id:a.uid,uid:a.uid,...p,email:a.email,status:'Active'}};}
async function createOrder(a,data,test=false){
 assert(a.email&&a.email_verified,'Verify your email address before saving an order request.',403);
 const key=orderKey(a.uid,data.key),ref=db.doc('orders/'+key),address=delivery(data.delivery);assert(/^\d{6}$/.test(address.pincode),'Enter a six-digit pincode.');
 assert(!data.coupon,'Discount codes are unavailable until live checkout is configured.');
 assert(Array.isArray(data.items)&&data.items.length>0&&data.items.length<=25,'Choose between 1 and 25 items.');
 const productIds=[...new Set(data.items.map(i=>id(i.product)))];
 const day=new Date().toISOString().slice(0,10),quota=db.doc('orderLimits/'+a.uid+'-'+day);
 const order=await db.runTransaction(async t=>{
  const existing=await t.get(ref);if(existing.exists){assert(test?existing.data().paymentMode==='test':!existing.data().paymentMode,'Use a new checkout reference for this payment mode.',409);return existing.data();}
  const requests=(await t.get(quota)).data()?.count||0;assert(requests<5,'You have reached today’s order-request limit. Contact support.',429);
  const products=await t.getAll(...productIds.map(pid=>db.doc('products/'+pid)));
  const priced=priceOrder(data.items,products.filter(d=>d.exists).map(d=>d.data()));
  for(const item of priced.items)if(item.phoneModel&&!item.phoneModel.requested){const model=await t.get(db.doc('phoneModels/'+id(item.phoneModel.id)));assert(model.exists&&model.data().status==='Active','Choose an available phone model.');assert(model.data().name===item.phoneModel.name&&model.data().brand===item.phoneModel.brand&&model.data().platform===item.phoneModel.platform,'The phone model changed. Select it again.');}
  const record={id:key,customerId:a.uid,...address,email:a.email,date:day,...priced,status:'Placed',payment:test?'Test pending':'Pending',kind:test?'Payment test':'Order request',...(test?{paymentMode:'test'}:{}),custom:false,createdAt:stamp(),updatedAt:stamp()};
  t.create(ref,record);t.set(quota,{count:requests+1});
  for(const item of priced.items)if(item.phoneModel?.requested){const requestId='PHONE-'+randomUUID();t.create(db.doc('phoneModelRequests/'+requestId),{...item.phoneModel,id:requestId,customerId:a.uid,orderId:key,status:'Pending',createdAt:stamp()});}
  return record;
 });return{order:clean((await ref.get()).data()||order)};
}
async function cancelOrder(a,data){const ref=db.doc('orders/'+id(data.id));await db.runTransaction(async t=>{const order=(await t.get(ref)).data();assert(order&&(order.customerId===a.uid||a.admin),'Order not found.',404);if(order.status==='Cancelled')return;assert(canCancel(order),'This order requires a support cancellation request.',409);t.update(ref,{status:'Cancelled',cancellationReason:text(data.reason,100),cancellationMessage:text(data.message||'',2000,false),payment:order.payment==='Paid'?'Refund pending':order.payment,updatedAt:stamp()});});return{cancelled:true};}
async function people(a,data){
 const type=data.type;assert(['customers','admins'].includes(type),'Invalid account type.');staff(a,type==='admins');
 const uid=data.id?id(data.id):null,remove=data.operation==='delete',name=remove?'':text(data.name,100),mail=remove?'':email(data.email),status=remove?'Inactive':text(data.status,20);
 assert(['Active','Inactive'].includes(status),'Invalid account status.');
 const target=uid?await auth.getUser(uid):null;
 const previousProfile=uid?(await db.doc('users/'+uid).get()).data():null;
 const previousDirectory=uid?(await db.doc('admins/'+uid).get()).data():null;
 if(type==='customers'&&target?.customClaims?.admin)throw new AppError('Manage administrator accounts in the Admins page.',403);
 if(type==='admins'){assert(data.role==='Admin'||data.role==='Admin Head'||remove,'Choose an admin role.');assert(uid!==a.uid||(!remove&&status==='Active'&&data.role==='Admin Head'),'You cannot remove or demote your current Admin Head account.');assert(uid!=='mvx95s5prSN2SR2PPhoI49pv7HA2'||(!remove&&mail===OWNER&&status==='Active'&&data.role==='Admin Head'),'The owner Admin Head must remain active with its original email.');}
 // Serialise account changes so simultaneous requests cannot remove the final head.
 const lock=db.doc('system/adminLock'),lockId=randomUUID();
 await db.runTransaction(async t=>{const previous=(await t.get(lock)).data();assert(!previous?.until||previous.until<Date.now(),'Another account change is in progress. Try again shortly.',409);t.set(lock,{until:Date.now()+60000,lockId});});
 let created=false,user=target;
 try{
  if(type==='admins'&&target?.customClaims?.adminHead&&(remove||status==='Inactive'||data.role!=='Admin Head')){const heads=await db.collection('admins').where('role','==','Admin Head').get();assert(heads.docs.filter(d=>d.data().status==='Active').length>1,'Keep at least one active Admin Head.');}
  if(remove){
   await auth.updateUser(uid,{disabled:true});await auth.revokeRefreshTokens(uid);
   await db.doc((type==='admins'?'admins':'users')+'/'+uid).set({status:'Inactive',deleted:true,updatedAt:stamp()},{merge:true});
   if(type==='admins')await db.doc('users/'+uid).set({status:'Inactive',updatedAt:stamp()},{merge:true});
   if(type==='admins')await auth.setCustomUserClaims(uid,{...target.customClaims,admin:false,adminHead:false});
   // Historical orders remain; disabling instead of reassigning identity prevents orphaned access.
  }else{
   if(!user){user=await auth.createUser({email:mail,displayName:name,disabled:status==='Inactive'});created=true;}
   else await auth.updateUser(uid,{email:mail,displayName:name,disabled:status==='Inactive',...(mail!==target.email?{emailVerified:false}:{})});
   const record={id:user.uid,uid:user.uid,name,email:mail,status,deleted:false,updatedAt:stamp()};
   if(type==='admins'){record.role=data.role;await auth.setCustomUserClaims(user.uid,{...user.customClaims,admin:status==='Active',adminHead:status==='Active'&&data.role==='Admin Head'});await db.doc('admins/'+user.uid).set(record,{merge:true});await db.doc('users/'+user.uid).set({uid:user.uid,id:user.uid,name,email:mail,status,phone:previousProfile?.phone||'',createdAt:previousProfile?.createdAt||stamp(),updatedAt:stamp()},{merge:true});}
   else{record.phone=phone(data.phone);await db.doc('users/'+user.uid).set({...record,...(created?{createdAt:stamp()}:{})},{merge:true});}
   if(!created&&(user.uid!==a.uid||mail!==target.email))await auth.revokeRefreshTokens(user.uid);
  }
  await audit(a,type+':'+(remove?'disable':created?'create':'update'),user.uid);return{saved:true,id:user.uid,signIn:'Google or set password using reset password'};
 }catch(error){if(created&&user){await auth.deleteUser(user.uid).catch(()=>{});await db.doc('admins/'+user.uid).delete().catch(()=>{});await db.doc('users/'+user.uid).delete().catch(()=>{});}else if(target){await auth.updateUser(target.uid,{email:target.email,displayName:target.displayName||'',disabled:target.disabled,emailVerified:target.emailVerified}).catch(()=>{});await auth.setCustomUserClaims(target.uid,target.customClaims||{}).catch(()=>{});for(const [collection,previous]of [['users',previousProfile],['admins',previousDirectory]])await(previous?db.doc(collection+'/'+target.uid).set(previous):db.doc(collection+'/'+target.uid).delete()).catch(()=>{});}throw error;}
 finally{await db.runTransaction(async t=>{const current=(await t.get(lock)).data();if(current?.lockId===lockId)t.delete(lock);});}
}
async function dispatch(a,action,data){
 if(action==='create-payment'){staff(a,true);assert(paymentSettings().enabled,'Test payments are not configured. Customer payments remain disabled.',503);return startTestPayment(a,(await createOrder(a,data,true)).order);}
 if(action==='verify-payment')return verifyTestPayment(a,data);
 if(action==='payment-status')return testPaymentStatus(a,data);
 if(action==='profile')return saveProfile(a,data);
 if(action==='create-order')return createOrder(a,data);
 if(action==='cancel-order')return cancelOrder(a,data);
 if(action==='people')return people(a,data);
 if(action==='catalogue'){
  staff(a);assert(['products','phoneModels','jobs'].includes(data.collection),'Unsupported collection.');const recordId=id(data.id),ref=db.doc(data.collection+'/'+recordId);
  if(data.operation==='delete')await ref.delete();else {let record=data.record;if(data.collection==='products'&&!record.productCode){const prior=await ref.get();record={...record,productCode:prior.data()?.productCode||recordId};}await ref.set({...catalogueRecord(data.collection,record,recordId),updatedAt:stamp()},{merge:true});}
  if(data.requestId){const request=db.doc('phoneModelRequests/'+id(data.requestId));await request.update({status:'Added to catalogue',modelId:recordId,updatedAt:stamp()});}
  await audit(a,data.collection+':'+data.operation,recordId);return{saved:true};
 }
 if(action==='ticket'){
  const ticketId='DS-TK-'+randomUUID(),ticket={id:ticketId,customerId:a.uid,name:text(data.name,100),email:a.email||'',phone:phone(data.phone),category:text(data.category,100),order:text(data.order||'',100,false),message:text(data.message,5000),status:'Open',notes:'',date:new Date().toISOString().slice(0,10),createdAt:stamp()};await db.doc('tickets/'+ticketId).create(ticket);return{ticket:clean(ticket)};
 }
 if(action==='update-ticket'){
  staff(a);assert(['Open','In progress','Resolved'].includes(data.status),'Invalid ticket status.');await db.doc('tickets/'+id(data.id)).update({status:data.status,notes:text(data.notes||'',5000,false),updatedAt:stamp()});await audit(a,'ticket:update',data.id);return{saved:true};
 }
 if(action==='update-order'){
  staff(a);assert(['Placed','Processing','Shipped','Delivered','Cancelled'].includes(data.status),'Invalid fulfilment status.');
  const ref=db.doc('orders/'+id(data.id));await db.runTransaction(async t=>{const order=(await t.get(ref)).data();assert(order,'Order not found.',404);assert(!data.payment||data.payment===order.payment,'Payment state is controlled by verified payment processing.');assert(!['Processing','Shipped','Delivered'].includes(data.status)||order.payment==='Paid','Unpaid order requests cannot enter production or shipment.',409);const transitions={Placed:['Placed','Processing','Cancelled'],Processing:['Processing','Shipped','Cancelled'],Shipped:['Shipped','Delivered'],Delivered:['Delivered'],Cancelled:['Cancelled']};assert(transitions[order.status]?.includes(data.status),'This order status cannot move to the selected stage.',409);t.update(ref,{status:data.status,updatedAt:stamp(),tracking:text(data.tracking||'',200,false)});});await audit(a,'order:update',data.id);return{saved:true};
 }
 if(action==='newsletter'){await db.doc('subscribers/'+a.uid).set({customerId:a.uid,email:a.email,consent:true,updatedAt:stamp()});return{saved:true};}
 if(action==='application'){const job=await db.doc('jobs/'+id(data.jobId)).get();assert(job.exists&&job.data().status==='Published','This role is unavailable.');const recordId='APPLY-'+randomUUID();await db.doc('applications/'+recordId).create({id:recordId,customerId:a.uid,jobId:data.jobId,name:text(data.name,100),email:a.email,phone:phone(data.phone),portfolio:text(data.portfolio||'',500,false),message:text(data.message,5000),status:'New',createdAt:stamp()});return{saved:true,id:recordId};}
 if(action==='model-request'){const recordId='PHONE-'+randomUUID(),product=data.productId?(await db.doc('products/'+id(data.productId)).get()).data():null,record=modelRequest(data,product);await db.doc('phoneModelRequests/'+recordId).create({...record,id:recordId,customerId:a.uid,customerEmail:a.email,customerName:text(a.name||a.email,150),createdAt:stamp()});await audit(a,'phone-model:request',recordId);return{saved:true,id:recordId,payment:record.payment};}
 throw new AppError('Unknown action.',404);
}
export default async function handler(req,res){
 responseSecurity(res);
 try{
  const action=new URL(req.url,'https://desnio-sense.vercel.app').searchParams.get('action');
  if(req.method==='GET'&&action==='health'){if(Date.now()>healthUntil){await credential().getAccessToken();await db.doc('system/health').get();healthUntil=Date.now()+60000;}res.status(200).json({backend:'ready',project:'desniosense',features:{...features,testPayments:paymentSettings().enabled,paymentMode:paymentSettings().mode}});return;}
  const body=validateRequest(req);
  assert(actions.has(action),'Unknown action.',404);
  if(process.env.VERCEL){
   const token=String(req.headers['x-firebase-appcheck']||'');
   assert(token.length>0&&token.length<=10000,'Browser verification failed. Reload the page and try again.',403);
   try{const verified=await appCheck.verifyToken(token);assert(verified.appId==='1:548709280275:web:a300dd238423e7d1332de6','Invalid browser verification.',403);}catch{throw new AppError('Browser verification failed. Reload the page and try again.',403);}
  }
  const user=await actor(req);await rate(user,action,['ticket','application','model-request'].includes(action)?5:30);await dailyContentLimit(user,action);const result=await dispatch(user,action,body);res.status(200).json(result);
 }catch(error){const status=error instanceof AppError?error.status:error.code?.startsWith('auth/')?400:503;const message=error instanceof AppError?error.message:error.code?.startsWith('auth/')?'The account could not be changed. Check its email and current status.':'The backend could not complete this request. Please retry or contact support.';res.status(status).json({error:message});}
}
