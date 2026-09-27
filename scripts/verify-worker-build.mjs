import {readdir,readFile,unlink} from 'node:fs/promises';
import {join} from 'node:path';
// The Cloudflare Vite plugin emits local runtime secrets for preview. They are
// not deployment assets; remove them from production output before packaging.
async function files(dir){const rows=await readdir(dir,{withFileTypes:true});const result=[];for(const row of rows){const path=join(dir,row.name);if(row.isDirectory())result.push(...await files(path));else result.push(path);}return result;}
const output=await files('dist');
for(const path of output)if(/(?:^|\/)\.dev\.vars(?:\.|$)/.test(path))await unlink(path);
for(const path of await files('dist')){
 const text=await readFile(path,'utf8');
 if(/(?:sb_secret_|sk_live_|sk_test_|whsec_)[A-Za-z0-9_]{12,}/.test(text))throw new Error('A credential-like value was found in build output. Deployment stopped.');
}
console.log('Worker output checked; local preview secrets excluded.');
