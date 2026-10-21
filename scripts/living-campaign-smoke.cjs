const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});const errors=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Europe/Brussels',reducedMotion:'reduce'}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:new Date('2026-10-21T19:00:00+02:00')});await p.goto('http://127.0.0.1:5173');
 const fixture=await p.evaluate(async()=>{
  const d=await import('/src/domain.ts'),w=await import('/src/worldProgression.ts');
  let s=d.createKnight('Rowan','2026-10-01');s=d.completeQuest(s,'training','2026-10-20',new Date('2026-10-20T20:00:00'));
  s.oaths['2026-10-20']={status:'kept',reward:{renown:3500,xp:{Strength:300,Endurance:300,Wisdom:300,Vitality:300,Presence:300,Resolve:300}}};s=w.synchronizeWorld(s,'2026-10-20','discovered');
  const {living,...old}=s;return {...old,version:5};
 });
 const raw=JSON.stringify(fixture);await p.evaluate(raw=>{localStorage.clear();localStorage.setItem('oathbound.knight.v5',raw);localStorage.setItem('oathbound.feedback.v1',JSON.stringify({sound:'disabled',volume:.35,haptics:false,offered:true}));},raw);await p.reload();
 const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('oathbound.knight.v6')));
 await p.waitForFunction(()=>JSON.parse(localStorage.getItem('oathbound.knight.v6'))?.living);
 let s=await read();assert.equal(s.version,6);assert.deepEqual(s.entries,fixture.entries);assert.deepEqual(s.weight,fixture.weight);assert.equal(await p.evaluate(()=>localStorage.getItem('oathbound.knight.v5.living.backup')),raw);
 await p.screenshot({path:'work/living-keep.png'});assert.equal(await p.locator('.keep-area').count(),6);assert.equal(await p.locator('.room-vignette').count(),6);assert.equal(await p.locator('.reward-feedback').count(),0);
 const go=async name=>{const nav=await p.getByRole('navigation',{name:'Main navigation'}).isVisible()?'Main navigation':'Desktop navigation';await p.getByRole('navigation',{name:nav}).getByRole('button',{name:name==='Quest Board'&&nav==='Main navigation'?'Quests':name,exact:true}).click();};
 await p.locator('.room-door>summary').filter({hasText:'Enter Great Hall'}).click();await p.locator('.room-door[open] .world-panel>summary').first().click();await p.getByText('Tomas’s Songbook',{exact:true}).click();
 await p.getByRole('region',{name:'Songbook'}).getByLabel('Title',{exact:true}).fill('A lamp at the door');await p.getByRole('button',{name:'Save song',exact:true}).click();assert.equal((await read()).world.songs.length,1);
 await p.getByRole('button',{name:'Ask Tomas for a song idea',exact:true}).click();await p.getByText('A separate song idea; your Songbook is unchanged',{exact:false}).waitFor();assert.equal((await read()).world.songs.length,1);
 await go('Journey');await p.getByRole('button',{name:'Begin the northern road',exact:true}).click();await p.locator('.story-beat').waitFor();s=await read();assert.equal(s.living.story.beats.length,1);await p.reload();await go('Journey');assert.equal((await read()).living.story.beats.length,1);assert.equal(await p.getByRole('button',{name:'Read the next page',exact:true}).isDisabled(),true);
 // A legitimate sequence of prior recorded actions reaches the confrontation.
 const confront=await p.evaluate(async()=>{
  const d=await import('/src/domain.ts'),director=await import('/src/living/director.ts');let s=JSON.parse(localStorage.getItem('oathbound.knight.v6'));s.living.story=(d.createKnight('R','2026-10-01')).living.story;
  for(let i=0;i<=4;i++){const date=`2026-10-${15+i}`;s=d.completeQuest(s,'training',date,new Date(date+'T20:00:00'));s=d.completeQuest(s,'patrol',date,new Date(date+'T20:00:00'));s=await director.continueStory(s,date);const b=s.living.story.beats.at(-1);if(b.choices.length)s=director.chooseStory(s,b.id,'public',date);}
  localStorage.setItem('oathbound.knight.v6',JSON.stringify(s));return s;
 });await p.reload();await go('Journey');await p.getByRole('button',{name:'Enter the confrontation',exact:true}).click();await p.getByRole('region',{name:'Tactical confrontation'}).waitFor();
 assert.match(await p.locator('.enemy-intent').textContent(),/Heavy swing/);await p.getByRole('button',{name:/^Set the Shield/}).click();await p.screenshot({path:'work/living-combat.png'});let inFight=await read();assert.equal(inFight.living.battle.round,1);await p.reload();await go('Journey');assert.equal((await read()).living.battle.round,1);
 assert.equal(await p.locator('.combat-knight').evaluate(e=>getComputedStyle(e).animationName),'none');
 for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:844});for(const tab of ['Keep','Quest Board','Journey','Chronicle','Knight']){await go(tab);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${tab} overflows ${width}`);}}
 await go('Journey');await p.getByRole('button',{name:'Withdraw and find another way',exact:true}).click();let finished=await read();assert.equal(finished.living.battle.status,'withdrawn');assert.deepEqual(finished.entries,inFight.entries);assert.deepEqual(finished.oaths,inFight.oaths);assert.deepEqual(finished.ventures,inFight.ventures);
 await go('Quest Board');await p.getByRole('button',{name:'Complete Training Yard',exact:true}).click();await go('Quest Board');await p.getByRole('button',{name:'Complete Patrol the Realm',exact:true}).click();
 // Explicitly opted-in mocked provider: generated scene cached after accepted JSON.
 await p.route('https://narrative.example/chat/completions',route=>{return route.fulfill({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization'},contentType:'application/json',body:JSON.stringify({choices:[{message:{content:JSON.stringify({title:'The watchman’s ledger',prose:'A neighbour brings the missing ledger to the tower.',canonFactsAdded:['The neighbour keeps a copy of the ledger.'],hooksAdded:[],hooksResolved:[],choices:[]})}}]})});});
 await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('oathbound.knight.v6'));s.living.settings.enabled=true;s.living.settings.endpoint='https://narrative.example/chat/completions';localStorage.setItem('oathbound.knight.v6',JSON.stringify(s));});await p.reload();await go('Journey');await p.getByRole('button',{name:'Read the next page',exact:true}).click();await p.waitForFunction(()=>JSON.parse(localStorage.getItem('oathbound.knight.v6')).living.story.beats.at(-1).stage===5);await p.getByRole('heading',{name:'The watchman’s ledger',exact:true}).waitFor();assert.equal((await read()).living.story.beats.at(-1).provenance.source,'ai');
 const offlineState=await read(),offlineContext=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Europe/Brussels'}),offline=await offlineContext.newPage();offline.on('pageerror',e=>errors.push(e.message));await offline.clock.install({time:new Date('2026-10-21T19:00:00+02:00')});
 await offline.goto(process.env.PWA_URL||'http://127.0.0.1:4173/Oathbound/');await offline.evaluate(s=>{s.living.settings.enabled=false;localStorage.setItem('oathbound.knight.v6',JSON.stringify(s));},offlineState);await offline.waitForFunction(()=>!!navigator.serviceWorker.controller);await offlineContext.setOffline(true);await offline.reload();
 assert.equal(await offline.locator('.room-vignette').count(),6);await offline.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Journey',exact:true}).click();await offline.getByRole('heading',{name:'The watchman’s ledger',exact:true}).waitFor();assert.equal(await offline.locator('.reward-feedback').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: v5 exact backup and migration, integrated rooms and Bard songs, cached story, deterministic combat and reload, 320–1440px layouts, reduced motion, opted-in structured AI, production offline PWA with cached AI story and no ceremony replay.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
