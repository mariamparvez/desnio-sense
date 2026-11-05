import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),output=path.join(root,'dist');
if(path.dirname(output)!==root||path.basename(output)!=='dist')throw new Error('Invalid static output directory.');
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(output,{recursive:true});
for(const entry of await fs.readdir(root,{withFileTypes:true})){
 // Catalogue routes are rendered by api/shop; root HTML files remain its templates.
 if(entry.isFile()&&!['products.html','product.html'].includes(entry.name)&&(/\.(html|css|js)$/.test(entry.name)||entry.name==='backend.mjs'||entry.name==='robots.txt'||/^[a-f0-9]{32}\.txt$/.test(entry.name)))await fs.copyFile(path.join(root,entry.name),path.join(output,entry.name));
 if(entry.isDirectory()&&entry.name==='assets')await fs.cp(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});
}
console.log('Built Desnio Sense static frontend in dist/.');


