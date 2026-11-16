import test from 'node:test';
import assert from 'node:assert/strict';
import {safeLink, portableText, groupContent, pageFor, mainContent, navigation, imageUrl, employeeCards} from '../src/render.mjs';
const employee = {_id:'employee-erik-erland',_type:'employee',name:'Erik Erland',role:'Elektrikerlærling',slug:{current:'erik.erland'},phone:'941 03 848',email:'erik@tysverelektro.no'};
const guide = {_id:'guide-test',_type:'guide',title:'Lys og varme',intro:'Kort tekst',slug:{current:'lys-og-varme'},body:[{_type:'block',style:'normal',children:[{text:'Dette er teksten.',marks:[]}]}]};
const page = {...guide,_id:'page-test',_type:'page',title:'Ny side',slug:{current:'ny-side'}};
test('Avviser script- og protokollrelative lenker',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,x','//evil.example','/\\evil.example','https://ok.example\nx']) assert.equal(safeLink(url),'#',url);
  assert.equal(safeLink('/guider/test#lys'),'/guider/test#lys');
});
test('Rik tekst escapes og beholder avsnitt, lister og trygge lenker',()=>{
  const html=portableText([{_type:'block',style:'normal',markDefs:[{_key:'a',_type:'link',href:'javascript:alert(1)'}],children:[{text:'<script>x</script>',marks:['a','strong']}]},{_type:'block',listItem:'bullet',children:[{text:'Punkt'}]}]);
  assert(!html.includes('<script>')); assert(html.includes('&lt;script&gt;')); assert(html.includes('href="#"')); assert(html.includes('<ul><li>Punkt</li></ul>'));
});
test('Utkast, versjoner og sikkerhetskopier holdes utenfor offentlig innhold',()=>{
  const content=groupContent([guide,{...guide,_id:'drafts.guide-test'},{...guide,_id:'versions.release.guide-test'},{...guide,_id:'guide.old',cmsMigrationTarget:'guide-test'}]);
  assert.equal(content.guides.length,1);
});
test('Ansattprofil med punktum i nettadressen blir funnet',()=>{
  const content=groupContent([employee]);assert.equal(pageFor('/om-oss/erik.erland',content).doc.name,'Erik Erland');
  assert(pageFor('/om-oss/finnes-ikke',content).notFound);
});
test('Nye sider får innhold og navigasjonslenke uten nye HTML-filer',()=>{
  const content=groupContent([page]);const selected=pageFor('/sider/ny-side',content);
  assert(mainContent(selected,content).includes('Dette er teksten.')); assert(navigation(content).includes('/sider/ny-side'));
});
test('En endret stilling brukes i både ansattkort og profil',()=>{
  const p={...employee,role:'Ny stilling'};const content=groupContent([p]);assert(employeeCards(content.employees).includes('Ny stilling'));assert(mainContent(pageFor('/om-oss/erik.erland',content),content).includes('Ny stilling'));assert(employeeCards(content.employees).includes('tel:+4794103848'));
});
test('Et avpublisert dokument gir ikke statisk gammel side',()=>{
  assert(pageFor('/guider/lys-og-varme',groupContent([])).notFound);
});
test('Bilder begrenses til prosjektets bildefiler',()=>{
  assert(imageUrl({url:'javascript:x'}).startsWith('/images/'));
  assert(imageUrl({asset:{_ref:'image-abcdef-800x600-jpg'}}).startsWith('https://cdn.sanity.io/images/89cnbpsm/production/abcdef-800x600.jpg'));
});
test('Søknader og spørsmål henter riktig kontaktperson',()=>{
  const job={...guide,_type:'job',slug:{current:'elektriker'},applicationEmail:'oystein@tysverelektro.no',contact:{name:'Øystein Trovåg',phone:'934 97 622',email:'oystein@tysverelektro.no'}};
  const content=groupContent([job]);const html=mainContent(pageFor('/ledige-stillinger/elektriker',content),content);assert(!html.includes('post@'));assert(html.includes('mailto:oystein@tysverelektro.no'));assert(html.includes('tel:+4793497622'));
});
