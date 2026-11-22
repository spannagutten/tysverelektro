import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {groupContent,mainContent} from '../src/render.mjs';
test('Guidene er uten generelle salgsbokser; jordfeilguiden har avtalt kontaktlenke ved behov',async()=>{
 const root=new URL('../public/guider/',import.meta.url);
 let count=0;
 for(const entry of await fs.readdir(root,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const html=await fs.readFile(new URL(entry.name+'/index.html',root),'utf8');
  const main=html.match(/<main>([\s\S]*?)<\/main>/)[1];
  assert(!/guide-enquiry|mailto:post@|send oss|spør oss|hos oss/i.test(main),entry.name);
  if(entry.name==='sikringen-gar') assert(main.includes('href="/kontakt"'));
  else assert(!main.includes('href="/kontakt"'),entry.name);
  count++;
 }
 assert.equal(count,14);
});
test('Sanity-guiden får ingen automatisk salgsboks eller gammel tjenestereklame',()=>{
 const doc={_id:'guide',_type:'guide',slug:{current:'elbillader'},title:'Elbillader',body:[{_type:'block',children:[{text:'Les om montering av elbillader hos oss.'}]},{_type:'block',children:[{text:'Følg produsentens anvisninger.'}]}]};
 const c=groupContent([doc]);
 assert.equal(c.guides[0].body.length,1);
 const html=mainContent({type:'guide',doc:c.guides[0]},c);
 assert(!html.includes('guide-enquiry'));assert(html.includes('Følg produsentens anvisninger.'));
 assert.equal(doc.body.length,2);
});
