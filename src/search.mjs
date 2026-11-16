import {escapeHtml,documentUrl} from './render.mjs';
import {searchItems} from '../public/search-core.mjs';
const labels={service:'Tjeneste',guide:'Guide',employee:'Ansatt',job:'Ledig stilling',page:'Side'};
const textOf=blocks=>(Array.isArray(blocks)?blocks:[]).flatMap(b=>(b.children||[]).map(s=>s.text||'')).join(' ');
export function searchIndex(content){
 const entries=content.docs.filter(d=>labels[d._type]&&documentUrl(d)!=='#').map(d=>({title:d.title||d.name,label:labels[d._type],type:d._type,url:documentUrl(d),summary:String(d.intro||d.role||'').slice(0,260),text:textOf(d.body||d.bio)}));
 entries.push({title:'Kontakt oss',label:'Kontakt',type:'contact',url:'/kontakt',summary:'Ta kontakt med Tysvær Elektro.',text:'telefon epost adresse henvendelse kontakt skjema'}, {title:'Om Tysvær Elektro',label:'Om oss',type:'about',url:'/om-oss',summary:content.settings.aboutIntro||'Din lokale elektriker på Haugalandet.',text:[content.settings.serviceArea,content.settings.address,'ansatte Skjoldastraumen'].filter(Boolean).join(' ')});
 return entries;
}
import {searchForm} from './search-ui.mjs';
export function searchPage(content,query){
 const results=searchItems(searchIndex(content),query);
 const heading=query?`${results.length} treff for «${escapeHtml(query)}»`:'Finn det du leter etter';
 const cards=results.map(item=>`<li><a class="search-result" href="${escapeHtml(item.url)}"><span class="search-kind search-kind-${item.type}">${item.label}</span><h2>${escapeHtml(item.title)}</h2>${item.summary?`<p>${escapeHtml(item.summary)}</p>`:''}<span class="search-destination">${item.type==='guide'?'Les guiden':item.type==='service'?'Se hva vi tilbyr':'Les mer'} →</span></a></li>`).join('');
 return `<section class="section search-page"><h1>Søk</h1>${searchForm(query)}<h2 class="search-results-heading">${heading}</h2>${query?(results.length?`<ul class="search-results">${cards}</ul>`:'<div class="search-empty"><h3>Fant du ikke det du lette etter?</h3><p>Vi kan hjelpe likevel. Fortell oss hva du trenger, så finner vi en løsning sammen.</p><a class="button" href="/kontakt">Kontakt oss</a></div>'):'<p>Søk i tjenester, guider, ansatte og ledige stillinger.</p>'}</section>`;
}
