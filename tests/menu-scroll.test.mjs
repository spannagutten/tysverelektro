import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import {navigation,groupContent} from '../src/render.mjs';
const script=await fs.readFile(new URL('../public/menu-scroll.js',import.meta.url),'utf8');
function setup(){
 const listeners={},docListeners={},navListeners={},classes=new Set(),rootClasses=new Set();
 class Element{constructor(parent=null){this.parentElement=parent;this.scrollTop=0;this.clientHeight=300;this.scrollHeight=700;this.overflowY='auto'}closest(){return null}}
 const nav=new Element();nav.contains=e=>e===nav||e.parentElement===nav;nav.classList={contains:c=>classes.has(c),remove:c=>classes.delete(c)};nav.addEventListener=(n,fn)=>navListeners[n]=fn;
 const button={addEventListener:(n,fn)=>listeners[n]=fn,setAttribute:(n,v)=>button[n]=v};
 const mobile={matches:true,addEventListener:(n,fn)=>mobile.change=fn};
 const style={position:'',top:''};let observer;
 vm.runInNewContext(script,{Element,getComputedStyle:e=>({overflowY:e.overflowY}),document:{querySelector:s=>s==='header > nav'?nav:button,body:{style},documentElement:{classList:{remove:c=>rootClasses.delete(c),toggle:(c,on)=>on?rootClasses.add(c):rootClasses.delete(c)}},addEventListener:(n,fn)=>docListeners[n]=fn},window:{matchMedia:()=>mobile,addEventListener:()=>{}},MutationObserver:class{constructor(fn){observer=fn}observe(){}}});
 return {listeners,docListeners,navListeners,classes,rootClasses,style,nav,button,mobile,observe:()=>observer()};
}
test('Mobilmenyen låses uten fixed body eller flytting av sideposisjon',()=>{
 const s=setup();s.classes.add('open');s.listeners.click();assert(s.rootClasses.has('mobile-menu-open'));assert.equal(s.style.position,'');assert.equal(s.style.top,'');
 s.classes.delete('open');s.observe();assert.equal(s.rootClasses.size,0);
});
test('Berøring kan rulle menyen, men ikke flytte siden utenfor eller forbi menyens kant',()=>{
 const s=setup();s.classes.add('open');s.listeners.click();let prevented=0;
 const move=(target,y)=>{s.docListeners.touchstart({touches:[{clientY:100}]});s.docListeners.touchmove({target,touches:[{clientY:y}],cancelable:true,preventDefault:()=>prevented++});};
 move(s.nav,50);assert.equal(prevented,0);
 s.nav.scrollTop=400;move(s.nav,50);assert.equal(prevented,1);
 move({},50);assert.equal(prevented,2);
 s.mobile.matches=false;s.mobile.change();assert.equal(s.rootClasses.size,0);assert.equal(s.button['aria-expanded'],'false');
});
test('Alle tjenester har egen lenke og en underliste som starter lukket',()=>{
 const html=navigation(groupContent([{_id:'service',_type:'service',title:'Elbillader',slug:{current:'elbillader'}}]));
 assert(html.includes('<details class="services-group"><summary'));
 assert(html.includes('href="/tjenester">Alle tjenester</a><span class="services-group-arrow"'));
 assert(html.includes('class="services-resource-links"'));
 assert(!html.includes('<details class="services-group" open'));
});