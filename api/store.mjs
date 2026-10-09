// Defer package loading so a startup failure returns a controlled response.
export default async function handler(req,res){
 try{const module=await import('../server/store-handler.mjs');await module.default(req,res);}
 catch{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.status(503).json({error:'The backend is unavailable. Please retry shortly.'});}
}
