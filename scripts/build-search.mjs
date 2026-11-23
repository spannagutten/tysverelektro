import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
const plain=html=>html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi,(all,key)=>key[0]==='#'?String.fromCodePoint(parseInt(key.slice(key[1]==='x'?2:1),key[1]==='x'?16:10)):entities[key]??all).replace(/\s+/g,' ').trim();
const entries=[];
async function visit(dir){
 for(const item of await fs.readdir(dir,{withFileTypes:true})){
  if(item.isDirectory()&&item.name!=='admin')await visit(path.join(dir,item.name));
  else if(item.isFile()&&item.name==='index.html'){
   const file=path.join(dir,item.name),url='/'+path.relative(path.join(root,'public'),dir).split(path.sep).filter(Boolean).join('/');
   if(url==='/404'||url==='/tjenester/vanlige-sporsmal'||url==='/sok')continue;
   const html=await fs.readFile(file,'utf8'),main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||'';
   const title=plain(main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||html.match(/<title>(.*?)<\/title>/i)?.[1]||url);
   const type=/^\/guider\//.test(url)?'guide':/^\/tjenester\//.test(url)?'service':/^\/om-oss\//.test(url)?'employee':/^\/ledige-stillinger\//.test(url)?'job':'page';
   entries.push({title,url,type,label:({guide:'Guide',service:'Tjeneste',employee:'Ansatt',job:'Ledig stilling',page:'Side'})[type],summary:plain(main.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]||'').slice(0,260),text:plain(main)});
  }
 }
}
await visit(path.join(root,'public'));
await fs.writeFile(path.join(root,'src/static-search.mjs'),'// Generated from public HTML by scripts/build-search.mjs.\nexport const staticSearch = '+JSON.stringify(entries,null,2)+';\n');
console.log(`Søkeindeks bygget fra ${entries.length} lokale sider.`);
