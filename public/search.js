import {searchItems} from './search-core.mjs';
const search=document.querySelector('.site-search');
if(search){
 const panel=search.querySelector('.site-search-panel'),toggle=search.querySelector('summary');
 const input=panel.querySelector('input'),status=panel.querySelector('.search-status'),list=panel.querySelector('.search-suggestions');
 let indexPromise, timer;
 const element=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 const addContact=()=>{list.append(element('p','Vi kan hjelpe likevel. Fortell oss hva du trenger, så finner vi en løsning sammen.'));const a=element('a','Kontakt oss','search-all');a.href='/kontakt';list.append(a);};
 search.addEventListener('toggle',()=>{if(search.open)input.focus();});
 document.addEventListener('click',event=>{if(!search.contains(event.target))search.open=false;});
 search.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();search.open=false;toggle.focus();}});
 search.addEventListener('focusout',()=>requestAnimationFrame(()=>{if(!search.contains(document.activeElement))search.open=false;}));
 document.querySelector('.menu-button')?.addEventListener('click',()=>{if(!search.closest('nav')?.classList.contains('open'))search.open=false;});
 async function suggest(){
  const q=input.value.trim();list.replaceChildren();
  if(q.length<2){status.textContent='Skriv minst to tegn for å få forslag.';return;}
  status.textContent='Søker …';
  try{
   indexPromise ||= fetch('/sok/data',{headers:{Accept:'application/json'}}).then(r=>{if(!r.ok)throw Error('unavailable');return r.json();}).catch(error=>{indexPromise=null;throw error;});
   const index=await indexPromise;
   if(input.value.trim()!==q)return;
   const results=searchItems(index,q);list.replaceChildren();status.textContent=results.length?`${results.length} treff. Viser opptil seks forslag.`:'Ingen treff.';
   results.slice(0,6).forEach(item=>{const a=document.createElement('a');a.className='search-suggestion';a.href=item.url;a.append(element('span',item.label,'search-kind search-kind-'+item.type),element('strong',item.title));list.append(a);});
   if(!results.length)addContact();
   else{const all=element('a',`Se alle ${results.length} treff →`,'search-all');all.href='/sok?q='+encodeURIComponent(q);list.append(all);}
  }catch{if(input.value.trim()!==q)return;status.textContent='Søket er midlertidig utilgjengelig. Prøv igjen.';}
 }
 input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(suggest,150);});
 input.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){const first=list.querySelector('a');if(first){event.preventDefault();first.focus();}}});
 list.addEventListener('keydown',event=>{const links=[...list.querySelectorAll('a')],i=links.indexOf(document.activeElement);if(event.key==='ArrowDown'){event.preventDefault();links[Math.min(i+1,links.length-1)]?.focus();}if(event.key==='ArrowUp'){event.preventDefault();if(i<=0)input.focus();else links[i-1].focus();}});
}
