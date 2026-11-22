import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
import {pageFor,groupContent,navigation} from '../src/render.mjs';
import {searchIndex} from '../src/search.mjs';
test('FAQ er på rotnivå og lenkes riktig fra meny og søk',()=>{
 const content=groupContent([]);
 assert.equal(pageFor('/vanlige-sporsmal',content).template,'/vanlige-sporsmal');
 assert(navigation(content).includes('href="/vanlige-sporsmal"'));
 assert(searchIndex(content).some(p=>p.url==='/vanlige-sporsmal'));
});
test('Gamle FAQ-lenker videresendes uten å være avhengig av CMS',async()=>{
 for(const path of ['/tjenester/vanlige-sporsmal','/tjenester/vanlige-sporsmal/','/tjenester/vanlige-sporsmal/index.html']){
  const r=await worker.fetch(new Request('https://te.erikerland.no'+path+'?fra=gammel'),{},{});
  assert.equal(r.status,301);assert.equal(r.headers.get('location'),'https://te.erikerland.no/vanlige-sporsmal?fra=gammel');
 }
});
