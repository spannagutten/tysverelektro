import {recordSearch,readStatistics,pruneStatistics} from './search-analytics.mjs';
import {searchIndex, searchPage} from './search.mjs';
import {groupContent, pageFor, createRewriter} from './render.mjs';
const query = '*[_type in ["home","employee","guide","service","job","page","siteSettings"] && !defined(cmsMigrationTarget)] | order(order asc, _id asc) {...,"image":image{...,"url":asset->url},"contact":contact->{name,phone,email},"body":body[]{...,"url":asset->url},"bio":bio[]{...,"url":asset->url}}';
async function boundedJson(response) {
  if (Number(response.headers.get('content-length')) > 2000000) throw new Error('CMS response too large');
  const reader = response.body.getReader(); const chunks = []; let length = 0;
  try { while (true) { const {done,value} = await reader.read(); if (done) break; length += value.byteLength; if (length > 2000000) { await reader.cancel(); throw new Error('CMS response too large'); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset += chunk.byteLength;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function contentFor(env, ctx, requestUrl) {
  const project = env.SANITY_PROJECT_ID || '89cnbpsm'; const dataset = env.SANITY_DATASET || 'production';
  if (!/^[a-z0-9]+$/.test(project) || !/^[a-z0-9_-]+$/.test(dataset)) throw new Error('Invalid CMS configuration');
  const key = new Request(`${requestUrl.origin}/__cms-cache/${project}/${dataset}/v1`);
  const cache = caches.default; const hit = await cache.match(key);
  if(hit) return groupContent(await boundedJson(hit));
  const url = new URL(`https://${project}.apicdn.sanity.io/v2026-11-03/data/query/${dataset}`);
  url.searchParams.set('perspective','published'); url.searchParams.set('query',query);
  const response = await fetch(url, {signal: AbortSignal.timeout(6000), headers:{Accept:'application/json'}});
  if(!response.ok) throw new Error(`CMS returned ${response.status}`);
  const json = await boundedJson(response);
  if(json.error || !Array.isArray(json.result) || !json.result.some(d=>d._type==='home')) throw new Error('CMS content unavailable');
  // No token is used. Only published documents can be read by this public endpoint.
  ctx.waitUntil(cache.put(key,new Response(JSON.stringify(json.result),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=60'}})));
  return groupContent(json.result);
}
function withHeaders(response, extra={}) {
  const headers = new Headers(response.headers);
  for(const [key,value] of Object.entries(extra)) headers.set(key,value);
  headers.set('X-Content-Type-Options','nosniff');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export async function notFoundResponse(request, env) {
  const url = new URL('/404', request.url);
  const asset = await env.ASSETS.fetch(new Request(url));
  const headers = new Headers(asset.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(request.method === 'HEAD' ? null : asset.body, {status:404, headers});
}
export default {
  async scheduled(event,env,ctx){ctx.waitUntil(pruneStatistics(env));},
  async fetch(request,env,ctx) {
    const requestPath=new URL(request.url).pathname;
    if(requestPath==='/api/search-stats')return readStatistics(request,env);
    if(requestPath==='/api/search-event')return recordSearch(request,env,async()=>searchIndex(await contentFor(env,ctx,new URL(request.url))));
    if(!['GET','HEAD'].includes(request.method)) return new Response('Metoden er ikke tillatt.',{status:405,headers:{Allow:'GET, HEAD'}});
    const url = new URL(request.url);
    // The dedicated admin hostname only serves the editor.
    if(url.hostname === 'adm.te.erikerland.no' && url.pathname !== '/admin' && !url.pathname.startsWith('/admin/')) {
      return new Response(null,{status:302,headers:{Location:`${url.origin}/admin${url.search}`,'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
    }
    if(url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      let response = await env.ASSETS.fetch(request);
      if(response.status===404 && !/\.[a-z0-9]+$/i.test(url.pathname)) response = await env.ASSETS.fetch(new Request(`${url.origin}/admin`));
      return withHeaders(response,{'Cache-Control':url.pathname.includes('/static/')?'public, max-age=3600':'no-store','X-Robots-Tag':'noindex, nofollow'});
    }
    if(/\.(css|js|mjs|json|svg|png|jpe?g|webp|gif|ico|woff2?|ttf|map)$/i.test(url.pathname) || url.pathname.startsWith('/images/')) return env.ASSETS.fetch(request);
    if(/^\/tjenester\/vanlige-sporsmal(?:\/(?:index\.html)?)?$/.test(url.pathname)) return Response.redirect(`${url.origin}/vanlige-sporsmal${url.search}`,301);
    const canonical = url.pathname.replace(/\/index\.html$/, '').replace(/\/+$/,'') || '/';
    if(canonical !== url.pathname) return Response.redirect(`${url.origin}${canonical}${url.search}`,301);
    let content;
    try {content = await contentFor(env,ctx,url);}
    catch(error) {console.error('CMS read failed',error instanceof Error?error.message:'unknown error');if(canonical==='/sok'||canonical==='/sok/data') return new Response('Søket er midlertidig utilgjengelig. Prøv igjen eller kontakt post@tysverelektro.no.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});const fallback = await env.ASSETS.fetch(request);if(fallback.status===404) return notFoundResponse(request,env);return withHeaders(fallback,{'X-CMS-Status':'fallback','Cache-Control':'no-cache'});}
    if(canonical === '/sok/data') return new Response(request.method==='HEAD'?null:JSON.stringify(searchIndex(content)),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff'}});
    const searchQuery=(url.searchParams.get('q')||'').trim().slice(0,100);
    const page = canonical === '/sok' ? {path:canonical,type:'search',template:'/guider',searchHtml:searchPage(content,searchQuery)} : pageFor(canonical,content);
    if(page.notFound) return notFoundResponse(request, env);
    const template = await env.ASSETS.fetch(new Request(`${url.origin}${page.template}`));
    if(template.status===404) return notFoundResponse(request,env);
    if(!template.ok || !template.headers.get('content-type')?.includes('text/html')) return template;
    const response = createRewriter(page,content).transform(template);
    const result = withHeaders(response,{'Cache-Control':'no-store','X-CMS-Status':'published'});
    return request.method==='HEAD' ? new Response(null,{status:result.status,headers:result.headers}) : result;
  }
};
