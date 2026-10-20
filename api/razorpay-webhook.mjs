import {createHash} from 'node:crypto';
import {AppError,assert} from '../server/domain.mjs';
import {paymentSettings,signatureMatches} from '../server/razorpay.mjs';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body,status=200)=>Response.json(body,{status,headers});
// Native Vercel Request preserves the exact bytes for webhook signature checks.
export async function POST(request){
 try{
  const candidates=[paymentSettings(process.env,'live'),paymentSettings(process.env,'test')].filter(s=>s.configured);assert(candidates.length,'Payment webhook is not configured.',503);
  assert(/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''),'Send JSON.',415);
  const reader=request.body?.getReader(),chunks=[];let bytes=0;
  assert(reader,'Webhook body is required.');
  try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;assert(bytes<=262144,'Webhook payload is too large.',413);chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
  const raw=Buffer.concat(chunks),settings=candidates.find(s=>signatureMatches(raw,request.headers.get('x-razorpay-signature'),s.webhookSecret));assert(settings,'Webhook verification failed.',400);
  let body;try{body=JSON.parse(raw.toString('utf8'));}catch{throw new AppError('Invalid webhook JSON.',400);}
  assert(body&&typeof body==='object'&&!Array.isArray(body),'Invalid webhook.',400);
  const digest=createHash('sha256').update(raw).digest('hex'),eventId=request.headers.get('x-razorpay-event-id');
  if(settings.mode==='live'){const {livePaymentWebhook}=await import('../server/live-payments.mjs');return reply(await livePaymentWebhook(body,digest,eventId));}
  const {paymentWebhook}=await import('../server/payments.mjs');return reply(await paymentWebhook(body,digest,eventId));
 }catch(error){return reply({error:error instanceof AppError?error.message:'Payment notification could not be processed. Please retry.'},error instanceof AppError?error.status:503);}
}
export function GET(){return reply({error:'Use POST.'},405);}

