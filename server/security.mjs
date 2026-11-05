import {AppError,assert} from './domain.mjs';

const origins=new Set(['https://desnio-sense.vercel.app','https://desniosense.com','https://www.desniosense.com']);
export function validateRequest(req,{production=!!process.env.VERCEL}={}){
 assert(req.method==='POST','Use POST for this action.',405);
 const origin=req.headers.origin;
 const local=origin&&/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
 assert(!origin||origins.has(origin)||(!production&&local),'This origin is not allowed.',403);
 assert(!['cross-site'].includes(req.headers['sec-fetch-site']),'Cross-site requests are not allowed.',403);
 assert(/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''),'Send a JSON request.',415);
 const declared=Number(req.headers['content-length']||0);
 assert(Number.isFinite(declared)&&declared>=0&&declared<=700000,'This request is too large.',413);
 assert(String(req.headers.authorization||'').length<=10000,'Invalid authentication header.',400);
 let body;
 try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{throw new AppError('Invalid JSON request.',400);}
 assert(body&&typeof body==='object'&&!Array.isArray(body),'Invalid request.');
 assert(Buffer.byteLength(JSON.stringify(body))<=700000,'This request is too large.',413);
 return body;
}

export function privileges(current,token,directory,user){
 const verified=current.emailVerified&&token.email_verified===true;
 const active=directory?.status==='Active'&&!directory.deleted&&user?.status!=='Inactive';
 const admin=verified&&active&&token.admin===true&&current.customClaims?.admin===true&&token.firebase?.sign_in_provider==='password';
 return{admin:!!admin,adminHead:!!(admin&&token.adminHead===true&&current.customClaims?.adminHead===true&&directory.role==='Admin Head'&&token.superAdmin===true&&current.customClaims?.superAdmin===true&&directory.superAdmin===true)};
}

export function responseSecurity(res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Robots-Tag','noindex, nofollow');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Content-Type','application/json; charset=utf-8');
}


