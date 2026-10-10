import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),files=await fs.readdir(root),failures=[];
const codeFiles=files.filter(f=>/\.m?js$/.test(f));
for(const dir of ['api','server','scripts'])for(const name of await fs.readdir(path.join(root,dir)))if(/\.m?js$/.test(name))codeFiles.push(dir+'/'+name);
for(const name of codeFiles){const result=spawnSync(process.execPath,['--check',path.join(root,name)],{encoding:'utf8'});if(result.status!==0)failures.push(name+': '+result.stderr)}
for(const name of files.filter(f=>f.endsWith('.html'))){const html=await fs.readFile(path.join(root,name),'utf8');for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)){const link=match[1];if(/^(?:https?:|mailto:|tel:|sms:|data:)/.test(link))continue;const target=decodeURIComponent(link.split(/[?#]/)[0]);if(!target)continue;const resolved=path.resolve(root,target);if(!resolved.startsWith(root+path.sep)){failures.push(name+': reference outside the site');continue}try{await fs.access(resolved)}catch{failures.push(name+': missing '+target)}}}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}else console.log('JavaScript syntax and all local page references passed.');


