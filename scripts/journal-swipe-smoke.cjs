const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173');await page.evaluate(async()=>{const d=await import('/src/domain.ts');localStorage.setItem('oathbound.knight.v3',JSON.stringify({...d.createKnight('Rowan','2026-10-10'),portrait:'tied-hair'}));});await page.reload();
  const before=await page.evaluate(()=>localStorage.getItem('oathbound.knight.v3'));
  const active=()=>page.getByRole('navigation',{name:'Main navigation'}).locator('[aria-current="page"]').textContent();
  const cdp=await page.context().newCDPSession(page);
  async function nativeSwipe(dx,dy=0) {
   const box=await page.locator('.page-heading p').boundingBox(),x=dx<0?280:90,y=box.y+box.height/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/5,y:y+dy*i/5}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await nativeSwipe(-180);await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Quests',exact:true}).and(page.locator('[aria-current="page"]')).waitFor();assert.equal(await page.locator('main').getAttribute('data-turn-direction'),'forward');
  await nativeSwipe(180);await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Keep',exact:true}).and(page.locator('[aria-current="page"]')).waitFor();assert.equal(await page.locator('main').getAttribute('data-turn-direction'),'backward');
  await nativeSwipe(180);assert.equal(await active(),'Keep');
  await nativeSwipe(-25,120);assert.equal(await active(),'Keep');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Knight',exact:true}).click();
  await page.getByLabel('Character portrait').evaluate(el=>{
   const touch=(x)=>new Touch({identifier:1,target:el,clientX:x,clientY:250});
   el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[touch(280)]}));el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,changedTouches:[touch(90)]}));
  });assert.equal(await active(),'Knight');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Chronicle',exact:true}).click();await nativeSwipe(-180);assert.equal(await active(),'Chronicle');
  assert.equal(await page.evaluate(()=>localStorage.getItem('oathbound.knight.v3')),before);
  await page.emulateMedia({reducedMotion:'reduce'});await nativeSwipe(180);assert.equal(await active(),'Knight');assert.equal(await page.locator('.journal-turn').evaluate(el=>getComputedStyle(el).display),'none');
  for(const width of [320,390,430]) {await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.setViewportSize({width:390,height:844});await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Keep',exact:true}).click();await page.screenshot({path:'/tmp/oathbound-parchment-keep.png'});
  assert.deepEqual(errors,[]);console.log('PASS: native horizontal touch turns in both directions; vertical gestures, controls and end boundaries preserved; exact save unchanged; reduced-motion swipe functional; 320/390/430px.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
