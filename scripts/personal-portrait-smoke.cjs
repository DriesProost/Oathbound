// Run with npm run dev and a production build using --base=/Oathbound/.
// Isolated browser profiles only; no real player saves are read or edited.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const http=require('node:http'), fs=require('node:fs'), path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});let server;
 try {
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Europe/Brussels'});
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-10-10T12:00:00+02:00')});
  await page.goto(process.env.OATHBOUND_URL||'http://127.0.0.1:5173');
  const fixture=await page.evaluate(async()=>{
   const d=await import('/src/domain.ts');return JSON.parse(JSON.stringify(d.completeQuest(d.createKnight('Rowan','2026-10-10'),'training','2026-10-10',new Date('2026-10-10T12:00:00+02:00'))));
  });
  await page.evaluate(s=>localStorage.setItem('oathbound.knight.v3',JSON.stringify(s)),fixture);await page.reload();
  const go=async name=>page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name,exact:true}).click();
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('oathbound.knight.v3')));
  await go('Knight');await page.getByLabel('Character portrait').selectOption('personal');
  await page.locator('.profile-art [data-portrait="personal"]').waitFor();
  const saved=await read();assert.deepEqual(saved,{...fixture,portrait:'personal'});
  assert.equal(await page.locator('.reward-feedback').count(),0);
  await go('Keep');await page.locator('.hero-art [data-portrait="personal"]').waitFor();
  await page.reload();await go('Knight');assert.equal(await page.getByLabel('Character portrait').inputValue(),'personal');
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/oathbound-personal-phone.png',fullPage:true});
  await page.getByLabel('Character portrait').selectOption('classic');assert.deepEqual(await read(),{...fixture,portrait:'classic'});
  await page.locator('.profile-art [data-portrait="classic"]').waitFor();
  // Inspect all 90 new combinations in the real SVG renderer, with decoded art.
  const gallery=await context.newPage();gallery.on('pageerror',e=>errors.push(e.message));await gallery.goto(process.env.OATHBOUND_URL||'http://127.0.0.1:5173');
  for(const [rank,renown] of [['squire',0],['man-at-arms',1000],['knight-errant',3000],['knight',7500],['knight-banneret',15000]]){
   await gallery.evaluate(async({rank,renown})=>{
    const R=await import('/node_modules/.vite/deps/react.js'), D=await import('/node_modules/.vite/deps/react-dom_client.js');const React=R.default||R;
    const {default:KnightArt}=await import('/src/KnightArt.tsx');
    const host=document.createElement('div');host.id='portrait-gallery';document.body.replaceChildren(host);document.body.style.cssText='margin:0;background:#f6f3e9;padding:15px';
    const cards=[];for(const wisdom of [0,225,750])for(const build of ['large','sturdy','lean'])for(const groomed of [false,true]){
     cards.push(React.createElement('div',{key:`${wisdom}-${build}-${groomed}`,style:{background:'#263e31',border:'2px solid #8f7b53',padding:'8px',color:'#e4d5b0'}},React.createElement('small',{},`${build} · ${groomed?'well-kept':'untidy'} · beard ${[0,225,750].indexOf(wisdom)}`),React.createElement(KnightArt,{portrait:'personal',renown,xp:{Wisdom:wisdom,Presence:groomed?225:0},weight:{settings:{displayUnit:'kg',baseline:null,targetGrams:null,appearance:{enabled:true,startingBuild:build,targetBuild:build}},measurements:[]}})));
    }
    (D.createRoot||D.default.createRoot)(host).render(React.createElement('div',{},React.createElement('h2',{},rank),React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(6, 1fr)',gap:'10px'}},...cards)));
   },{rank,renown});
   await gallery.waitForFunction(()=>document.querySelectorAll('#portrait-gallery svg image').length===18);
   assert.equal(await gallery.locator('[data-portrait="personal"]').count(),18);
   assert.equal(await gallery.locator('clipPath > path').count(),18);
   await gallery.evaluate(async()=>Promise.all([...new Set(Array.from(document.querySelectorAll('#portrait-gallery svg image'),el=>el.getAttribute('href')))].map(async src=>{const i=new Image();i.src=src;await i.decode();})));
   await gallery.setViewportSize({width:1140,height:940});await gallery.locator('#portrait-gallery').screenshot({path:`/tmp/personal-${rank}-gallery.png`});
  }
  // Production Pages prefix, precache, offline selection and reload.
  const root=path.resolve('dist');server=http.createServer((req,res)=>{
   const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/Oathbound/')){res.writeHead(404);res.end();return;}
   const name=url.pathname.slice('/Oathbound/'.length)||'index.html';const file=path.resolve(root,name);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
   const mime=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.webp')?'image/webp':name.endsWith('.webmanifest')?'application/manifest+json':name.endsWith('.png')?'image/png':name.endsWith('.svg')?'image/svg+xml':'text/html';res.setHeader('Content-Type',mime);res.end(fs.readFileSync(file));
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/Oathbound/`;
  const production=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Brussels'});
  const phone=await production.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.clock.install({time:new Date('2026-10-10T12:00:00+02:00')});await phone.goto(url);
  await phone.waitForFunction(()=>navigator.serviceWorker.controller);
  await phone.evaluate(s=>localStorage.setItem('oathbound.knight.v3',JSON.stringify({...s,portrait:'personal'})),fixture);await phone.reload();
  await phone.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Knight',exact:true}).click();await phone.locator('.profile-art [data-portrait="personal"]').waitFor();
  const art=fs.readdirSync(path.join(root,'assets')).filter(name=>name.startsWith('personal-')&&name.endsWith('.webp'));assert.equal(art.length,15);
  await production.setOffline(true);await phone.reload();await phone.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Knight',exact:true}).click();
  assert.equal(await phone.getByLabel('Character portrait').inputValue(),'personal');
  assert.deepEqual(await phone.evaluate(()=>JSON.parse(localStorage.getItem('oathbound.knight.v3'))),{...fixture,portrait:'personal'});
  const sizes=await phone.evaluate(async urls=>Promise.all(urls.map(async url=>{const i=new Image();i.src=url;await i.decode();return [i.naturalWidth,i.naturalHeight]})),art.map(name=>`${url}assets/${name}`));
  assert.equal(sizes.every(([w,h])=>w===900&&h===1350),true);
  await phone.getByLabel('Character portrait').selectOption('classic');await phone.getByLabel('Character portrait').selectOption('personal');
  assert.deepEqual(errors,[]);
  console.log('PASS: optional portrait selection in Knight/Keep, exact save and reload preservation, no rewards/ceremony, 320/390/1440px layouts, all 90 new rendered variants, 15 offline portraits and switching under /Oathbound/.');
 } finally {await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
