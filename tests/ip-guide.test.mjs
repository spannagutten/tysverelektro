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
 const c=groupContent(withLocalGuides([doc]));assert.equal(c.guides.length,1);assert.equal(c.guides[0].title,doc.title);
});
