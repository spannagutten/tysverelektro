import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
import {staticSearch} from '../src/static-search.mjs';
import {searchItems} from '../public/search-core.mjs';
test('Offentlige sider bruker lokale filer uten CMS-kall',async()=>{
 const request=new Request('https://te.erikerland.no/ledige-stillinger/elkontrollor');
 const response=await worker.fetch(request,{ASSETS:{fetch:async r=>{assert.equal(r.url,request.url);return new Response('Lokal annonse');}}},{});
 assert.equal(await response.text(),'Lokal annonse');
 assert.equal(response.headers.get('x-cms-status'),null);
});
test('Søkeindeksen kommer fra HTML og skiller guide fra tjeneste',async()=>{
 const response=await worker.fetch(new Request('https://te.erikerland.no/sok/data'),{},{});
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),staticSearch);
 const results=searchItems(staticSearch,'elbillader');
 assert(results.some(x=>x.type==='guide'));assert(results.some(x=>x.type==='service'));
 assert(staticSearch.some(x=>x.url==='/ledige-stillinger/elkontrollor'&&x.text.includes('kun for bolig')));
});
