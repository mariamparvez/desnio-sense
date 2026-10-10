import {createHmac,timingSafeEqual} from 'node:crypto';
import {AppError,assert} from './domain.mjs';

export function paymentSettings(env=process.env){
 const keyId=env.RAZORPAY_KEY_ID||'';
 // Vercel cannot rename the owner's Sensitive variable named after the Key ID.
 // Only this exact, validated test-key name is accepted as a server-side alias.
 const secret=env.RAZORPAY_KEY_SECRET||(/^rzp_test_[a-zA-Z0-9]+$/.test(keyId)?env[keyId]:'')||'',webhookSecret=env.RAZORPAY_WEBHOOK_SECRET||'';
 const enabled=env.RAZORPAY_MODE==='test'&&/^rzp_test_[a-zA-Z0-9]+$/.test(keyId)&&secret.length>=16&&webhookSecret.length>=32;
 return{enabled,mode:enabled?'test':'disabled',keyId,secret,webhookSecret};
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
 assert(settings.enabled,'Razorpay test checkout is not configured. Live payments remain disabled.',503);
 const request=async(path,{method='GET',body}={})=>{
  let response;
  try{response=await transport('https://api.razorpay.com/v1/'+path,{method,headers:{Authorization:'Basic '+Buffer.from(settings.keyId+':'+settings.secret).toString('base64'),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});}catch{throw new AppError('The payment service could not be reached. Check this attempt before retrying.',503);}
  const result=await response.json().catch(()=>null);
  assert(response.status!==401,'Razorpay rejected the configured test credentials. Update the matching Test Key ID and Key Secret in Vercel.',503);
  assert(response.ok&&result,'The payment service could not complete this request. Please retry later.',503);
  return result;
 };
 return{
  createOrder:body=>request('orders',{method:'POST',body}),
  order:value=>request('orders/'+providerId(value,'order')),
  payment:value=>request('payments/'+providerId(value,'pay')),
  payments:value=>request('orders/'+providerId(value,'order')+'/payments')
 };
}
