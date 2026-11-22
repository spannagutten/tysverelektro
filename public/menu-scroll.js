// Keep mobile navigation scrolling separate from the page (including iOS overscroll).
const nav=document.querySelector('header > nav');
const button=document.querySelector('.menu-button');
if(nav&&button){
 const mobile=window.matchMedia('(max-width: 700px)');
 let saved=null;
 function unlock(){
  if(!saved)return;
  const previous=saved;saved=null;
  for(const [name,value] of Object.entries(previous.styles))document.body.style[name]=value;
  document.documentElement.classList.remove('mobile-menu-open');
  const behavior=document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior='auto';
  window.scrollTo({top:previous.y,left:previous.x,behavior:'instant'});
  document.documentElement.style.scrollBehavior=behavior;
 }
 function sync(){
  const open=mobile.matches&&nav.classList.contains('open');
  if(!open){unlock();return;}
  if(saved)return;
  const styles={};for(const name of ['position','top','left','right','width'])styles[name]=document.body.style[name];
  saved={x:window.scrollX,y:window.scrollY,styles};
  document.body.style.position='fixed';document.body.style.top=`-${saved.y}px`;
  document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%';
  document.documentElement.classList.add('mobile-menu-open');
 }
 button.addEventListener('click',sync);
 new MutationObserver(sync).observe(nav,{attributes:true,attributeFilter:['class']});
 // Restore the page before the original link handler and native anchor navigation run.
 nav.addEventListener('click',event=>{if(event.target.closest('a'))unlock();},{capture:true});
 mobile.addEventListener('change',()=>{if(!mobile.matches){nav.classList.remove('open');button.setAttribute('aria-expanded','false');button.textContent='☰';}sync();});
 window.addEventListener('pagehide',unlock);
 sync();
}
