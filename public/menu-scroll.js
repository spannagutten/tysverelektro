// Lock background gestures without fixing/repositioning the body on iOS.
const nav=document.querySelector('header > nav');
const button=document.querySelector('.menu-button');
if(nav&&button){
 const mobile=window.matchMedia('(max-width: 700px)');
 let locked=false,lastY=0;
 function unlock(){locked=false;document.documentElement.classList.remove('mobile-menu-open');}
 function sync(){
  locked=mobile.matches&&nav.classList.contains('open');
  document.documentElement.classList.toggle('mobile-menu-open',locked);
 }
 button.addEventListener('click',sync);
 new MutationObserver(sync).observe(nav,{attributes:true,attributeFilter:['class']});
 nav.addEventListener('click',event=>{if(event.target.closest('a'))unlock();},{capture:true});
 mobile.addEventListener('change',()=>{if(!mobile.matches){nav.classList.remove('open');button.setAttribute('aria-expanded','false');button.textContent='☰';}sync();});
 document.addEventListener('touchstart',event=>{if(event.touches.length===1)lastY=event.touches[0].clientY;},{passive:true});
 document.addEventListener('touchmove',event=>{
  if(!locked||event.touches.length!==1)return;
  const y=event.touches[0].clientY,delta=lastY-y;lastY=y;
  let element=event.target instanceof Element?event.target:null;
  if(element&&nav.contains(element)){
   // Let a nested results list or the menu consume the gesture before its edge.
   while(element&&nav.contains(element)){
    const overflow=getComputedStyle(element).overflowY;
    if((overflow==='auto'||overflow==='scroll')&&element.scrollHeight>element.clientHeight+1){
     if((delta>0&&element.scrollTop+element.clientHeight<element.scrollHeight-1)||(delta<0&&element.scrollTop>0))return;
    }
    if(element===nav)break;
    element=element.parentElement;
   }
  }
  if(delta!==0&&event.cancelable)event.preventDefault();
 },{passive:false});
 window.addEventListener('pagehide',unlock);
 sync();
}
