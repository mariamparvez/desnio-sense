import {createHash,randomUUID} from 'node:crypto';
import {auth,db,stamp} from './firebase.mjs';
import {assert,id,AppError} from './domain.mjs';
import {paymentSettings,providerId,signatureMatches,paymentState,razorpayClient} from './razorpay.mjs';

const clean=value=>JSON.parse(JSON.stringify(value,(k,v)=>v?.toDate?v.toDate().toISOString():v));
function enabled(){const settings=paymentSettings(process.env,'test');assert(settings.enabled,'Razorpay test checkout is not configured.',503);return settings;}
function head(a){assert(a.adminHead&&a.email_verified,'Only Admin Head can run test payments.',403);}
async function owned(a,value){head(a);const ref=db.doc('paymentSessions/'+id(value)),s=(await ref.get()).data();assert(s&&s.customerId===a.uid&&s.mode==='test','Test checkout not found.',404);return{ref,s};}
const checkout=(settings,s,order)=>({keyId:settings.keyId,mode:'test',order:clean(order),amount:s.amount,currency:'INR',providerOrderId:s.providerOrderId,payment:order.payment});

export async function startTestPayment(a,order){
 head(a);const settings=enabled();assert(order.paymentMode==='test'&&order.customerId===a.uid&&order.status==='Placed','This request cannot enter test checkout.',409);
 const ref=db.doc('paymentSessions/'+order.id),lock=randomUUID();
 const existing=await db.runTransaction(async t=>{
  const s=(await t.get(ref)).data();
  if(s?.providerOrderId){assert(s.keyId===settings.keyId,'The test keys changed. Start a new test checkout.',409);return s;}
  assert(!s,'This payment attempt is still being checked. Start a new test checkout rather than creating a duplicate.',409);
  t.create(ref,{orderId:order.id,customerId:a.uid,mode:'test',keyId:settings.keyId,amount:Math.round(order.total*100),currency:'INR',state:'Creating',lock,createdAt:stamp(),updatedAt:stamp()});return null;
 });
 if(existing)return checkout(settings,existing,order);
 try{
  const remote=await razorpayClient(settings).createOrder({amount:Math.round(order.total*100),currency:'INR',receipt:order.id,partial_payment:false,notes:{desnio_order_id:order.id,mode:'test'}});
  providerId(remote.id,'order');assert(remote.amount===Math.round(order.total*100)&&remote.currency==='INR'&&remote.receipt===order.id,'The payment service returned an unexpected order.',503);
  await db.runTransaction(async t=>{const s=(await t.get(ref)).data(),o=(await t.get(db.doc('orders/'+order.id))).data();assert(s?.lock===lock&&o?.paymentMode==='test'&&o?.status==='Placed','Test checkout changed.',409);t.update(ref,{providerOrderId:remote.id,state:'Ready',updatedAt:stamp()});t.update(db.doc('orders/'+order.id),{razorpayOrderId:remote.id,updatedAt:stamp()});});
  return checkout(settings,{providerOrderId:remote.id,amount:remote.amount},order);
 }catch(error){await ref.update({state:'Needs review',updatedAt:stamp()}).catch(()=>{});throw error;}
}

async function reconcile(session,paymentId,event){
 const settings=enabled(),provider=razorpayClient(settings);
 assert(session.mode==='test'&&session.keyId===settings.keyId,'Test keys changed. This checkout requires review.',409);
 const remote=await provider.order(session.providerOrderId);
 let payment;
 if(paymentId)payment=await provider.payment(providerId(paymentId,'pay'));
 else{const list=await provider.payments(session.providerOrderId);payment=(list.items||[]).find(p=>p.status==='captured')||(list.items||[]).find(p=>p.status==='authorized');}
 if(!payment){const order=(await db.doc('orders/'+session.orderId).get()).data();return{payment:order?.payment||'Test pending',order:clean(order)};}
 providerId(payment.id,'pay');
 const state=paymentState(session,remote,payment),orderRef=db.doc('orders/'+session.orderId),sessionRef=db.doc('paymentSessions/'+session.orderId);
 const result=await db.runTransaction(async t=>{
  const order=(await t.get(orderRef)).data(),current=(await t.get(sessionRef)).data(),seen=event?(await t.get(event.ref)).exists:false;
  assert(order&&order.paymentMode==='test'&&current?.providerOrderId===session.providerOrderId,'Checkout record does not match.',409);
  if(seen)return{order:clean(order),duplicate:true};
  if(order.payment==='Test paid'){assert(order.razorpayPaymentId===payment.id||state!=='Test paid','A different captured payment requires review.',409);if(event)t.create(event.ref,event.record);return{order:clean(order),payment:order.payment};}
  const changes={payment:state,razorpayPaymentId:payment.id,updatedAt:stamp(),...(state==='Test paid'?{testCapturedAt:stamp()}:{})};
  t.update(orderRef,changes);t.update(sessionRef,{state,paymentId:payment.id,updatedAt:stamp()});
  if(event)t.create(event.ref,event.record);
  return{order:clean({...order,...changes}),payment:state};
 });return result;
}
export async function verifyTestPayment(a,data){
 const {s}=await owned(a,data.id),settings=enabled();
 assert(data.razorpay_order_id===s.providerOrderId,'Payment order does not match this checkout.',409);
 const paymentId=providerId(data.razorpay_payment_id,'pay');
 assert(signatureMatches(s.providerOrderId+'|'+paymentId,data.razorpay_signature,settings.secret),'Payment verification failed.',400);
 return reconcile(s,paymentId);
}
export async function testPaymentStatus(a,data){const {s}=await owned(a,data.id);assert(s.providerOrderId,'Test checkout is not ready.',409);return reconcile(s);}

export async function paymentWebhook(body,digest,eventId){
 if(!['payment.captured','order.paid','payment.failed'].includes(body.event))return{ignored:true};
 const payment=body.payload?.payment?.entity,orderId=payment?.order_id||body.payload?.order?.entity?.id;
 providerId(orderId,'order');
 const events=db.doc('paymentEvents/'+digest);
 if((await events.get()).exists)return{duplicate:true};
 const sessions=await db.collection('paymentSessions').where('providerOrderId','==',orderId).limit(1).get();
 if(sessions.empty)return{ignored:true};
 const session=sessions.docs[0].data(),owner=await auth.getUser(session.customerId).catch(()=>null);
 assert(owner&&!owner.disabled,'Test checkout owner is unavailable.',409);
 const result=await reconcile(session,payment?.id,{ref:events,record:{mode:'test',orderId:session.orderId,providerOrderId:orderId,event:body.event,eventId:typeof eventId==='string'?eventId.slice(0,128):'',digest,at:stamp()}});
 return{received:true,...(result.duplicate?{duplicate:true}:{})};
}

