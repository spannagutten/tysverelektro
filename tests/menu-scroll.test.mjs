import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
const script=await fs.readFile(new URL('../public/menu-scroll.js',import.meta.url),'utf8');
function setup(){
 const listeners={},navListeners={},classes=new Set(),rootClasses=new Set(),calls=[];
 const style={position:'',top:'',left:'',right:'',width:''};
 const nav={classList:{contains:c=>classes.has(c),remove:c=>classes.delete(c)},addEventListener:(name,fn)=>navListeners[name]=fn};
 const button={addEventListener:(name,fn)=>listeners[name]=fn,setAttribute:(name,value)=>button[name]=value,textContent:'☰'};
 const mobile={matches:true,addEventListener:(name,fn)=>mobile.change=fn};
 const root={style:{scrollBehavior:'smooth'},classList:{add:c=>rootClasses.add(c),remove:c=>rootClasses.delete(c)}};
 const window={scrollX:0,scrollY:640,matchMedia:()=>mobile,scrollTo:args=>calls.push(args),addEventListener:()=>{}};
 let observer;
 vm.runInNewContext(script,{document:{querySelector:s=>s==='header > nav'?nav:button,body:{style},documentElement:root},window,MutationObserver:class{constructor(fn){observer=fn}observe(){}}});
 return {listeners,navListeners,classes,rootClasses,style,calls,mobile,button,observe:()=>observer()};
}
test('Mobilmenyen fryser bakgrunnen og gjenoppretter nøyaktig rulleposisjon',()=>{
 const s=setup();s.classes.add('open');s.listeners.click();assert.equal(s.style.position,'fixed');assert.equal(s.style.top,'-640px');assert(s.rootClasses.has('mobile-menu-open'));
 s.classes.delete('open');s.observe();assert.equal(s.style.position,'');assert.equal(s.calls[0].top,640);assert.equal(s.calls[0].behavior,'instant');assert.equal(s.rootClasses.size,0);
});
test('Lenkeklikk frigjør siden før ankernavigasjon, og PC-bredde frigjør menyen',()=>{
 const s=setup();s.classes.add('open');s.listeners.click();s.navListeners.click({target:{closest:()=>({})}});assert.equal(s.style.position,'');assert.equal(s.calls.length,1);
 s.listeners.click();s.mobile.matches=false;s.mobile.change();assert.equal(s.style.position,'');assert.equal(s.button['aria-expanded'],'false');assert(!s.classes.has('open'));
});