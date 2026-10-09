// Defer package loading so a startup failure returns a controlled response.
export default async function handler(req,res){
 try{const module=await import('../server/store-handler.mjs');await module.default(req,res);}
 catch(error){const match=error.message?.match(/Cannot find (?:package|module) ['"]([^'"]+)['"]/),hint=match?.[1]?.split(/[\\/]/).at(-1);res.setHeader('Cache-Control','no-store');res.status(503).json({error:'Backend initialization failed. Please retry shortly.',code:error.code||'INITIALIZATION_ERROR',...(hint?{module:hint}:{})});}
}
