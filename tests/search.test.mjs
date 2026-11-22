import test from 'node:test';
import assert from 'node:assert/strict';
import {searchItems} from '../public/search-core.mjs';
import {searchIndex,searchPage} from '../src/search.mjs';
import {groupContent,navigation} from '../src/render.mjs';
const docs=[{_id:'s',_type:'service',title:'Elbillader',slug:{current:'elbillader'},intro:'Vi monterer ladere.'},{_id:'g',_type:'guide',title:'Elbillader hjemme',slug:{current:'elbillader-hjemme'},body:[{children:[{text:'Sikker lading hjemme.'}]}]},{_id:'a',_type:'employee',name:'Øystein Trovåg',slug:{current:'oystein.trovag'},role:'Installatør'},{_id:'drafts.secret',_type:'guide',title:'Hemmelig utkast',slug:{current:'hemmelig'}},{_id:'backup',_type:'guide',title:'Elbillader gammel',slug:{current:'gammel'},cmsMigrationTarget:'g'}];
const content=groupContent(docs),index=searchIndex(content);
test('Elbil og lader finner både tjeneste og guide med ulike merker og adresser',()=>{
 for(const q of ['Elbil','lader']){const results=searchItems(index,q);assert.equal(results.length,2);assert.deepEqual(results.map(r=>r.label),['Tjeneste','Guide']);assert.deepEqual(results.map(r=>r.url),['/tjenester/elbillader','/guider/elbillader-hjemme']);}
});
test('Norske bokstaver, flere søkeord og innhold støttes',()=>{
 assert.equal(searchItems(index,'Oystein Trovag')[0].title,'Øystein Trovåg');
 assert.equal(searchItems(index,'sikker lading')[0].label,'Guide');
 assert.equal(searchItems(index,'elbil umulig').length,0);
});
test('Bare publisert innhold blir søkbart',()=>{assert(!index.some(d=>d.title.includes('Hemmelig')||d.url.includes('gammel')));});
test('Ingen treff viser kontaktlenke og søketekst escapes',()=>{
 const html=searchPage(content,'<script>alert(1)</script>');assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));assert(html.includes('Fant du ikke'));assert(html.includes('href="/kontakt"'));
});
test('Søkeikon følger Kontakt i navigasjonen',()=>{
 const html=navigation(content);assert.match(html,/Kontakt<\/a><details class="site-search"/);
});
test('Søket er en utvidbar del av headeren uten dialog eller modal',async()=>{
 const {searchLink}=await import('../src/search-ui.mjs');
 assert(searchLink.startsWith('<details'));
 assert(searchLink.includes('class="site-search-panel"'));
 assert(searchLink.includes('action="/sok"'));
 assert(!searchLink.includes('<dialog'));
});
