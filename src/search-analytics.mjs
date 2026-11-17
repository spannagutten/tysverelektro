import {normalize,searchItems} from '../public/search-core.mjs';
const known={elbil:'elbil',elbillader:'elbillader',elbilladere:'elbillader',lader:'lader',ladere:'lader','elbillader hjemme':'elbillader hjemme',elkontroll:'elkontroll',sikringsskap:'sikringsskap',downlight:'downlights',downlights:'downlights',belysning:'belysning',lys:'lys',varme:'varme',smarthus:'smarthus',feilsoking:'feilsøking',kelvin:'kelvin',fargetemperatur:'fargetemperatur',watt:'watt',lumen:'lumen',lux:'lux',nybygg:'nybygg',industri:'industri',naering:'næring',landbruk:'landbruk',pabygg:'påbygg',jobb:'jobb',elektriker:'elektriker'};
export const statisticsTerm=query=>{const key=normalize(query).trim().replace(/\s+/g,' ');return Object.hasOwn(known,key)?known[key]:'Andre søk';};
export const statisticsDay=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Oslo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const cutoffDay=(days,date=new Date())=>statisticsDay(new Date(date.getTime()-(days-1)*86400000));
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff'}});
export async function recordSearch(request,env,getIndex){
 if(request.method!=='POST')return response({error:'Method not allowed'},405);
 const url=new URL(request.url);
 if(request.headers.get('origin')!==url.origin)return response({error:'Forbidden'},403);
 if(!env.SEARCH_STATS||!env.SEARCH_EVENT_LIMIT)return response({error:'Statistics unavailable'},503);
 if(request.headers.get('dnt')==='1'||request.headers.get('sec-gpc')==='1')return new Response(null,{status:204});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return response({error:'JSON required'},415);
 // IP is only a transient rate-limit key; it is never written to the statistics database.
 const limited=await env.SEARCH_EVENT_LIMIT.limit({key:request.headers.get('cf-connecting-ip')||'local'});
 if(!limited.success)return response({error:'Too many requests'},429);
 try{
  const reader=request.body?.getReader();if(!reader)return response({error:'Invalid request'},400);
  let bytes=0,chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1024){await reader.cancel();return response({error:'Too large'},413);}chunks.push(value);}}finally{reader.releaseLock();}
  const joined=new Uint8Array(bytes);let offset=0;for(const c of chunks){joined.set(c,offset);offset+=c.byteLength;}
  let data;try{data=JSON.parse(new TextDecoder().decode(joined));}catch{return response({error:'Invalid JSON'},400);}
  if(typeof data.q!=='string'||!data.q.trim()||data.q.length>100)return response({error:'Invalid search'},400);
  const index=await getIndex();const missing=searchItems(index,data.q).length===0?1:0;
  await env.SEARCH_STATS.prepare('INSERT INTO search_daily(day,term,searches,no_results) VALUES(?,?,1,?) ON CONFLICT(day,term) DO UPDATE SET searches=searches+1,no_results=no_results+excluded.no_results').bind(statisticsDay(),statisticsTerm(data.q),missing).run();
  return new Response(null,{status:204});
 }catch{return response({error:'Statistics unavailable'},503);}
}
export async function authorizedStatistics(request,fetcher=fetch){
 const token=request.headers.get('authorization');
 if(!/^Bearer [^\s]{10,4096}$/.test(token||''))return false;
 try{
  const r=await fetcher('https://api.sanity.io/v2026-11-03/projects/89cnbpsm?includeMembers=true',{headers:{Authorization:token},signal:AbortSignal.timeout(6000)});
  if(!r.ok)return false;
  const project=await r.json();
  return project.id==='89cnbpsm'&&project.members?.some(m=>m.isCurrentUser===true&&m.isRobot===false&&m.roles?.some(role=>role.name==='administrator'))===true;
 }catch{return false;}
}
export async function readStatistics(request,env){
 if(request.method!=='GET')return response({error:'Method not allowed'},405);
 if(!await authorizedStatistics(request))return response({error:'Logg inn som administrator i Sanity.'},403);
 if(!env.SEARCH_STATS)return response({error:'Statistikken er ikke aktivert ennå.'},503);
 const requested=Number(new URL(request.url).searchParams.get('days'));
 const days=[7,30,90].includes(requested)?requested:30,from=cutoffDay(days);
 try{
  const rows=await env.SEARCH_STATS.prepare('SELECT term,SUM(searches) AS searches,SUM(no_results) AS no_results FROM search_daily WHERE day>=? GROUP BY term ORDER BY searches DESC,term ASC').bind(from).all();
  return response({days,from,rows:rows.results||[],retentionDays:90});
 }catch{return response({error:'Statistikken er midlertidig utilgjengelig.'},503);}
}
export async function pruneStatistics(env){if(env.SEARCH_STATS)await env.SEARCH_STATS.prepare('DELETE FROM search_daily WHERE day < ?').bind(cutoffDay(90)).run();}
