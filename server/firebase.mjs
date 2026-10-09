import {initializeApp,getApps} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {Firestore,FieldValue} from '@google-cloud/firestore';
import {OAuth2Client} from 'google-auth-library';
import {getVercelOidcToken} from '@vercel/oidc';
const projectId='desniosense';
const account='desnio-store-api@desniosense.iam.gserviceaccount.com';
const audience='//iam.googleapis.com/projects/548709280275/locations/global/workloadIdentityPools/desnio-vercel/providers/vercel';
let cached,inFlight;
async function jsonRequest(url,options){const r=await fetch(url,options);const body=await r.json();if(!r.ok)throw new Error('Backend identity could not be authorized.');return body;}
export function credential(){return{async getAccessToken(){
 if(cached&&cached.until>Date.now()+120000)return{access_token:cached.token,expires_in:Math.floor((cached.until-Date.now())/1000)};
 if(!inFlight)inFlight=(async()=>{
  // Local test credentials are explicitly supplied by the private test runner, never deployed.
  if(!process.env.VERCEL&&process.env.DESNIO_LOCAL_ACCESS_TOKEN){cached={token:process.env.DESNIO_LOCAL_ACCESS_TOKEN,until:Date.now()+1800000};return;}
  const subject=await getVercelOidcToken();
  const sts=await jsonRequest('https://sts.googleapis.com/v1/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:token-exchange',audience,requested_token_type:'urn:ietf:params:oauth:token-type:access_token',subject_token_type:'urn:ietf:params:oauth:token-type:jwt',subject_token:subject,scope:'https://www.googleapis.com/auth/cloud-platform'})});
  const impersonated=await jsonRequest('https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/'+account+':generateAccessToken',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+sts.access_token},body:JSON.stringify({scope:['https://www.googleapis.com/auth/cloud-platform'],lifetime:'3600s'})});
  cached={token:impersonated.accessToken,until:Date.parse(impersonated.expireTime)};
 })().finally(()=>{inFlight=null;});
 await inFlight;return{access_token:cached.token,expires_in:Math.floor((cached.until-Date.now())/1000)};
}};}
const identity=credential(),app=getApps()[0]||initializeApp({projectId,credential:identity});
const googleClient=new OAuth2Client();
googleClient.refreshHandler=async()=>{const token=await identity.getAccessToken();return{access_token:token.access_token,expiry_date:Date.now()+token.expires_in*1000};};
export const auth=getAuth(app),db=new Firestore({projectId,authClient:googleClient}),stamp=()=>FieldValue.serverTimestamp();
