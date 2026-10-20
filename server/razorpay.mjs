import {createHmac,timingSafeEqual} from 'node:crypto';
import {AppError,assert} from './domain.mjs';

export function paymentSettings(env=process.env,requestedMode=env.RAZORPAY_MODE){
 const live=requestedMode==='live',keyId=(live?env.RAZORPAY_LIVE_KEY_ID:env.RAZORPAY_KEY_ID)||'';
 // Vercel cannot rename the owner's Sensitive variable named after the Key ID.
 // Only this exact, validated test-key name is accepted as a server-side alias.
 const secret=(live?env.RAZORPAY_LIVE_KEY_SECRET:env.RAZORPAY_KEY_SECRET||(/^rzp_test_[a-zA-Z0-9]+$/.test(keyId)?env[keyId]:''))||'',webhookSecret=(live?env.RAZORPAY_LIVE_WEBHOOK_SECRET:env.RAZORPAY_WEBHOOK_SECRET)||'';
 const configured=['test','live'].includes(requestedMode)&&new RegExp('^rzp_'+requestedMode+'_[a-zA-Z0-9]+$').test(keyId)&&secret.length>=16&&webhookSecret.length>=32,enabled=configured&&(!live||env.RAZORPAY_LIVE_ENABLED==='true');
 return{enabled,configured,mode:configured?requestedMode:'disabled',keyId,secret,webhookSecret};
}
export function signatureMatches(message,signature,secret){
 if(typeof signature!=='string'||!/^[a-f0-9]{64}$/i.test(signature)||!secret)return false;
 const expected=createHmac('sha256',secret).update(message).digest();
 return timingSafeEqual(expected,Buffer.from(signature,'hex'));
}
export function providerId(value,type){assert(typeof value==='string'&&new RegExp('^'+type+'_[a-zA-Z0-9]{1,80}$').test(value),'Invalid payment reference.');return value;}
export function paymentState(session,order,payment){
 assert(order.id===session.providerOrderId&&order.amount===session.amount&&order.currency==='INR'&&order.partial_payment!==true,'Payment order does not match the stored checkout.',409);
 assert(payment.order_id===session.providerOrderId&&payment.amount===session.amount&&payment.currency==='INR','Payment amount or order does not match.',409);
 if(payment.status==='captured'){
  assert(payment.captured===true&&order.status==='paid'&&order.amount_paid===session.amount&&order.amount_due===0,'Payment capture is not confirmed.',409);
  return'Test paid';
 }
 if(payment.status==='authorized')return'Test authorized';
 if(payment.status==='failed')return'Test failed';
 return'Test pending';
}
export function razorpayClient(settings=paymentSettings(),transport=fetch){
 assert(settings.enabled,'Payment checkout is not configured.',503);
 const request=async(path,{method='GET',body}={})=>{
  let response;
  try{response=await transport('https://api.razorpay.com/v1/'+path,{method,headers:{Authorization:'Basic '+Buffer.from(settings.keyId+':'+settings.secret).toString('base64'),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});}catch{throw new AppError('The payment service could not be reached. Check this attempt before retrying.',503);}
  const result=await response.json().catch(()=>null);
  assert(response.status!==401,'Razorpay rejected the configured credentials. Contact Desnio Sense.',503);
  assert(response.ok&&result,'The payment service could not complete this request. Please retry later.',503);
  return result;
 };
 return{
  check:()=>request('orders?count=1'),
  createOrder:body=>request('orders',{method:'POST',body}),
  order:value=>request('orders/'+providerId(value,'order')),
  payment:value=>request('payments/'+providerId(value,'pay')),
  payments:value=>request('orders/'+providerId(value,'order')+'/payments'),
  capture:(value,amount)=>request('payments/'+providerId(value,'pay')+'/capture',{method:'POST',body:{amount,currency:'INR'}})
 };
}

