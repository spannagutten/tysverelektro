import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
test('Administrasjonsdomenet åpner panelet uten offentlig innhold',async()=>{
 const response=await worker.fetch(new Request('https://adm.te.erikerland.no/'),{},{});
 assert.equal(response.status,302);
 assert.equal(response.headers.get('location'),'https://adm.te.erikerland.no/admin');
 assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
});
test('Direktelenker i editoren får SPA-reserve',async()=>{
 const paths=[];
 const env={ASSETS:{fetch:async request=>{const path=new URL(request.url).pathname;paths.push(path);return path==='/admin'?new Response('Studio'):new Response('missing',{status:404});}}};
 const response=await worker.fetch(new Request('https://adm.te.erikerland.no/admin/structure/employee'),env,{});
 assert.equal(response.status,200);
 assert.deepEqual(paths,['/admin/structure/employee','/admin']);
 assert.equal(response.headers.get('cache-control'),'no-store');
});