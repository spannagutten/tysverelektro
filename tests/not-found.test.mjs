import test from 'node:test';
import assert from 'node:assert/strict';
import {notFoundResponse} from '../src/worker.mjs';
test('Egen feilside beholder HTTP 404 og bruker lokal mal også for HEAD',async()=>{
 const env={ASSETS:{fetch:async request=>{assert.equal(new URL(request.url).pathname,'/404');return new Response('<h1>Siden finnes ikke</h1>',{headers:{'Content-Type':'text/html'}});}}};
 for(const method of ['GET','HEAD']){
  const response=await notFoundResponse(new Request('https://te.erikerland.no/mangler',{method}),env);
  assert.equal(response.status,404);
  assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
  assert.equal(await response.text(),method==='HEAD'?'':'<h1>Siden finnes ikke</h1>');
 }
});
