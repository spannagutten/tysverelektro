import {searchLink} from './search-ui.mjs';
import {staticSearch} from './static-search.mjs';
import {recordSearch,readStatistics,pruneStatistics} from './search-analytics.mjs';
import {searchIndex, searchPage} from './search.mjs';

const contentFor = () => ({searchEntries: staticSearch});
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
    const content = contentFor();
    if(canonical === '/sok/data') return new Response(request.method==='HEAD'?null:JSON.stringify(staticSearch),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff'}});
    if(canonical === '/sok') {
      const template = await env.ASSETS.fetch(new Request(`${url.origin}/guider`));
      const html = searchPage(content,(url.searchParams.get('q')||'').trim().slice(0,100));
      const response = new HTMLRewriter().on('main',{element(element){element.setInnerContent(html,{html:true});}}).on('title',{element(element){element.setInnerContent('Søk | Tysvær Elektro');}}).on('header nav',{element(e){e.append(searchLink,{html:true});}}).on('head',{element(e){e.append('<link rel="stylesheet" href="/cms.css"><link rel="stylesheet" href="/search.css">',{html:true});}}).on('body',{element(e){e.append('<script type="module" src="/search.js"></script>',{html:true});}}).transform(template);
      return withHeaders(request.method==='HEAD'?new Response(null,{headers:response.headers}):response,{'Cache-Control':'no-store','X-Robots-Tag':'noindex'});
    }
    const response = await env.ASSETS.fetch(request);
    if(response.status===404) return notFoundResponse(request,env);
    const decorated = response.headers.get('content-type')?.includes('text/html')
      ? new HTMLRewriter()
        .on('header nav',{element(e){e.append(searchLink,{html:true});}})
        .on('head',{element(e){e.append('<link rel="stylesheet" href="/cms.css"><link rel="stylesheet" href="/search.css">',{html:true});}})
        .on('body',{element(e){e.append('<script type="module" src="/search.js"></script>',{html:true});}})
        .transform(response)
      : response;
    return withHeaders(decorated,{'Cache-Control':'no-cache'});
  }
};
