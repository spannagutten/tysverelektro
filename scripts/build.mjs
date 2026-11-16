import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = path.join(root,'studio');
const candidates = [path.join(root,'node_modules/@sanity/cli/bin/run.js'),path.join(studio,'node_modules/@sanity/cli/bin/run.js')];
let cli;
for(const candidate of candidates){try{await fs.access(candidate);cli=candidate;break;}catch{}}
if(!cli) throw new Error('Installer avhengighetene først: pnpm install');
const output = path.join(root,'.build/admin');
// Build in a separate source copy so the running local editor keeps its own runtime files.
const buildSource = path.join(root,'.build/studio-source');
await fs.mkdir(buildSource,{recursive:true});
await fs.cp(studio,buildSource,{recursive:true,filter:source=>{
  const relative = path.relative(studio,source);
  const parts = relative.split(path.sep);
  return !parts.some(part=>['node_modules','.sanity','dist','.git','import-assets'].includes(part) || part.startsWith('.env'))
    && !['prepared-content.json','import-data.json','pnpm-lock.yaml'].includes(path.basename(source));
}});
const result = spawnSync(process.execPath,[cli,'build',output,'--yes'],{cwd:buildSource,stdio:'inherit',env:{...process.env,SANITY_STUDIO_BASEPATH:'/admin',NODE_ENV:'production'}});
if(result.error) throw result.error;
if(result.status) process.exit(result.status);
// Copy only the built Studio. Never deploy the local import data or import images.
await fs.mkdir(path.join(root,'public/admin'),{recursive:true});
await fs.cp(output,path.join(root,'public/admin'),{recursive:true,filter:source=>!source.includes('import-assets')&&!source.endsWith('import-data.json')});
console.log('Sanity Studio bygget til public/admin. Ingen innloggingstoken er brukt eller bygget inn.');
