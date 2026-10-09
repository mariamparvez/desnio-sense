// Local development uses an explicitly supplied private owner credential.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.ttf':'font/ttf','.md':'text/plain; charset=utf-8','.json':'application/json'};
http.createServer(async(req,res)=>{
 try{
  if(req.url.startsWith('/api/store')){
   if(!process.env.DESNIO_LOCAL_ACCESS_TOKEN){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Use the deployed store for backend actions, or start the authenticated local development server.'}));return;}
   let body='';for await(const chunk of req){body+=chunk;if(body.length>750000){res.writeHead(413);res.end('Request too large');return;}}
   req.body=body?JSON.parse(body):{};res.status=n=>{res.statusCode=n;return res};res.json=value=>res.end(JSON.stringify(value));res.setHeader('Content-Type','application/json');const {default:handler}=await import('./api/store.mjs');await handler(req,res);return;
  }
  const url=new URL(req.url,'http://localhost');
  const target=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!target.startsWith(root)||!mime[path.extname(target)]||/[/\\](server|api|node_modules|\.git)[/\\]/.test(target)){res.writeHead(403);res.end('Forbidden');return}
  const file=await fs.readFile(target);
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(file);
 }catch{res.writeHead(404);res.end('Not found')}
}).listen(4173,'127.0.0.1',()=>console.log('Desnio Sense frontend: http://127.0.0.1:4173/index.html'));
