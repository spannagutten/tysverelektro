import test from 'node:test';
import assert from 'node:assert/strict';
import {withLocalGuides} from '../src/local-guides.mjs';
import {groupContent,pageFor,guideCards} from '../src/render.mjs';
import {searchIndex} from '../src/search.mjs';
test('Ny IP-guide vises i oversikt, søk og riktig sidemal',()=>{
 const c=groupContent(withLocalGuides([]));
 assert.equal(pageFor('/guider/ip-grad',c).template,'/guider/ip-grad');
 assert(guideCards(c.guides).includes('/images/guider/ip-grad.svg'));
 assert(searchIndex(c).some(d=>d.url==='/guider/ip-grad'));
});
test('En publisert Sanity-guide med samme adresse erstatter den lokale guiden',()=>{
 const doc={_id:'cms-ip',_type:'guide',title:'Redigert i Sanity',slug:{current:'ip-grad'}};
 const c=groupContent(withLocalGuides([doc]));const matches=c.guides.filter(g=>g.slug.current==='ip-grad');assert.equal(matches.length,1);assert.equal(matches[0].title,doc.title);
});

test('Alle sju nye guider har sidemal, illustrasjon og søkeoppføring',async()=>{
 const fs=await import('node:fs/promises');
 const c=groupContent(withLocalGuides([]));
 const slugs=['sikringen-gar','oppussing','gjore-selv','skjoteledninger','dimmer-led','komfyrvakt','utebelysning'];
 for(const slug of slugs){
  assert.equal(pageFor('/guider/'+slug,c).template,'/guider/'+slug);
  const html=await fs.readFile(new URL('../public/guider/'+slug+'/index.html',import.meta.url),'utf8');
  assert(html.includes('<h1>'));assert(html.includes('/images/guider/'+slug+'.svg'));
  assert(searchIndex(c).some(d=>d.url==='/guider/'+slug));
 }
});
test('Prioriterte guider sorteres likt før oversikt og karusell',()=>{
 const existing=['ip-grad','watt-lumen-lux','elbillader','elkontroll','sikringsskap'].map(slug=>({_id:slug,_type:'guide',title:slug,slug:{current:slug}}));
 const c=groupContent(withLocalGuides(existing));
 assert.deepEqual(c.guides.slice(0,5).map(g=>g.slug.current),['sikringen-gar','elbillader','elkontroll','sikringsskap','oppussing']);
 assert.equal(c.guides.at(-1).slug.current,'ip-grad');
 const overview=guideCards(c.guides),carousel=guideCards(c.guides,true);
 for(const html of [overview,carousel])assert(html.indexOf('/guider/sikringen-gar')<html.indexOf('/guider/elbillader'));
});
