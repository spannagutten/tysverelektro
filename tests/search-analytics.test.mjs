import test from 'node:test';
import assert from 'node:assert/strict';
import {statisticsTerm,statisticsDay,cutoffDay,authorizedStatistics,recordSearch,readStatistics} from '../src/search-analytics.mjs';
test('Bare faste fagord lagres; personopplysninger og ukjent fritekst blir en felles telling',()=>{
 assert.equal(statisticsTerm(' ELBIL '),'elbil');assert.equal(statisticsTerm('feilsøking'),'feilsøking');
 for(const q of ['Ola Nordmann','ola@example.no','93497622','elbil Ola Nordmann','__proto__','constructor'])assert.equal(statisticsTerm(q),'Andre søk');
});
test('Daglige tellinger bruker norsk dato og avgrenset periode',()=>{assert.equal(statisticsDay(new Date('2026-11-17T23:30:00Z')),'2026-11-18');assert.equal(cutoffDay(7,new Date('2026-11-17T12:00:00Z')),'2026-11-11');});
test('Statistikk krever ekte administrator i riktig Sanity-prosjekt',async()=>{
 const request=new Request('https://adm.te.erikerland.no/api/search-stats',{headers:{Authorization:'Bearer fake-token-for-test'}});
 const verify=project=>authorizedStatistics(request,async()=>new Response(JSON.stringify(project)));
 assert.equal(await verify({id:'89cnbpsm',members:[{isCurrentUser:true,isRobot:false,roles:[{name:'administrator'}]}]}),true);
 for(const member of [{isCurrentUser:false,isRobot:false,roles:[{name:'administrator'}]},{isCurrentUser:true,isRobot:false,roles:[{name:'viewer'}]},{isCurrentUser:true,isRobot:true,roles:[{name:'administrator'}]}])assert.equal(await verify({id:'89cnbpsm',members:[member]}),false);
 assert.equal(await verify({id:'another-project',members:[]}),false);
 assert.equal(await authorizedStatistics(new Request(request.url),()=>{throw Error('Must not call')}),false);
 const r=await readStatistics(new Request(request.url),{});assert.equal(r.status,403);
});
test('Et innsendt søk teller kun fagord og korrekt antall nulltreff',async()=>{
 const stored=[];const env={SEARCH_STATS:{prepare:sql=>({bind:(...args)=>({run:async()=>stored.push({sql,args})})})},SEARCH_EVENT_LIMIT:{limit:async()=>({success:true})}};
 const request=q=>new Request('https://te.erikerland.no/api/search-event',{method:'POST',headers:{Origin:'https://te.erikerland.no','Content-Type':'application/json'},body:JSON.stringify({q})});
 const index=[{title:'Elbillader',summary:'',text:''}];
 assert.equal((await recordSearch(request('elbil'),env,async()=>index)).status,204);
 assert.equal((await recordSearch(request('Ola Nordmann'),env,async()=>index)).status,204);
 assert.deepEqual(stored.map(s=>s.args.slice(1)),[['elbil',0],['Andre søk',1]]);
 assert(!JSON.stringify(stored).includes('Ola'));
 const bad=request('elbil');bad.headers.set('Origin','https://other.example');assert.equal((await recordSearch(bad,env,async()=>index)).status,403);
 const dnt=request('elbil');dnt.headers.set('DNT','1');assert.equal((await recordSearch(dnt,env,async()=>index)).status,204);assert.equal(stored.length,2);
});