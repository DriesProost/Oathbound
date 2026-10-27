const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const errors=[];
 try {
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Europe/Brussels'}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.audioContexts=0;const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(...args){super(...args);window.audioContexts++;}};});
  await p.clock.install({time:new Date('2026-10-14T19:00:00+02:00')});await p.goto('http://127.0.0.1:5173');
  const fixture=await p.evaluate(async()=>{
   const d=await import('/src/domain.ts'),v=await import('/src/ventureDomain.ts'),library=await import('/src/ventures.ts');
   let s=d.createKnight('Rowan','2026-10-05');for(const date of ['2026-10-05','2026-10-06','2026-10-07'])s=d.completeQuest(s,'training',date,new Date(date+'T19:00:00'));
   s=d.completeQuest(s,'patrol','2026-10-09',new Date('2026-10-09T19:00:00'));s.entries=s.entries.map(e=>e.goalId==='walking'?{...e,distance:29.9}:e);
   const renown=2990-d.totals(s).renown;s.oaths['2026-10-13']={status:'kept',reward:{renown,xp:{Strength:970,Endurance:800,Resolve:800,Wisdom:800,Vitality:800,Presence:800}}};
   s.weight={settings:{displayUnit:'lb',baseline:{date:'2026-10-05',grams:90000},targetGrams:85000},measurements:[{id:'old-weight',date:'2026-10-13',grams:88000,createdAt:'2026-10-13T17:00:00.000Z',updatedAt:'2026-10-13T17:00:00.000Z'}]};
   s=v.ensureDailyVenture(s,'2026-10-14',[library.ventures[4]]);const {world,...old}=s;return {...old,version:4};
  });
  const raw=JSON.stringify(fixture);await p.evaluate(raw=>{localStorage.clear();localStorage.setItem('oathbound.knight.v4',raw);localStorage.setItem('oathbound.feedback.v1',JSON.stringify({sound:'disabled',volume:.35,haptics:false,offered:true}));},raw);await p.reload();
  const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('oathbound.knight.v7')));
  await p.waitForFunction(()=>JSON.parse(localStorage.getItem('oathbound.knight.v7'))?.world.milestones.length>0);
  let s=await read();assert.equal(s.version,7);assert.deepEqual(s.weight,fixture.weight);assert.deepEqual(s.entries,fixture.entries);assert.deepEqual(s.ventures,fixture.ventures);
  assert.equal(await p.evaluate(()=>localStorage.getItem('oathbound.knight.v4.world.backup')),raw);assert.equal(await p.locator('.reward-feedback').count(),0);
  assert.equal(await p.locator('.keep-area').count(),6);assert.equal(s.world.milestones.filter(m=>m.kind==='retinue').length,2);
  const go=async name=>{const nav=await p.getByRole('navigation',{name:'Main navigation'}).isVisible()?'Main navigation':'Desktop navigation';await p.getByRole('navigation',{name:nav}).getByRole('button',{name:name==='Quest Board'&&nav==='Main navigation'?'Quests':name,exact:true}).click();};
  await p.locator('.room-door>summary').filter({hasText:'Enter Great Hall'}).click();await p.getByText('Tomas’s Songbook',{exact:true}).click();
  await p.getByRole('region',{name:'Songbook'}).getByLabel('Title',{exact:true}).fill('A place by the fire');
  await p.getByRole('region',{name:'Songbook'}).getByLabel('Lyrics or notes').fill('A quiet road\nA letter home');
  await p.getByRole('region',{name:'Songbook'}).getByLabel('Chords',{exact:true}).fill('Am G F');
  await p.getByRole('button',{name:'Save song',exact:true}).click();assert.equal((await read()).world.songs.length,1);assert.equal(await p.evaluate(()=>window.audioContexts),0);
  await go('Journey');await p.locator('.road-meetings>summary').click();await p.locator('summary').filter({hasText:'The Traveller with a Diagram'}).click();await p.getByRole('button',{name:'Ask which road he is taking',exact:true}).click();
  assert.equal((await read()).world.encounters.find(e=>e.id==='scholar-road').choiceId,'road');
  await go('Keep');await p.locator('.room-door>summary').filter({hasText:'Enter Great Hall'}).click();await p.getByText('Tomas’s Songbook',{exact:true}).click();assert.match((await p.locator('.retinue-grid').allTextContents()).join(' '),/Tomas Reed/);
  await go('Quest Board');await p.getByRole('button',{name:'Complete Training Yard',exact:true}).click();
  await p.getByRole('heading',{name:'RISE, KNIGHT ERRANT'}).waitFor();assert.equal(await p.locator('.reward-feedback').count(),1);
  s=await read();assert.equal(s.world.milestones.filter(m=>m.kind==='keep'&&m.attribute==='Strength'&&m.stage===2).length,1);assert.ok(s.world.milestones.some(m=>m.kind==='relic'&&m.id==='practice-blade'));
  assert.ok((await read()).world.milestones.some(m=>m.kind==='title'&&m.id==='warden-scholar'));await go('Knight');assert.equal(await p.locator('.reward-feedback').count(),0);await p.getByText('Your name in the campaign',{exact:true}).click();await p.getByLabel('Displayed Title',{exact:true}).selectOption('warden-scholar');
  assert.equal((await read()).world.preferredTitle,'warden-scholar');await p.reload();assert.equal(await p.locator('.reward-feedback').count(),0);
  await go('Quest Board');await p.getByRole('button',{name:'Complete Patrol the Realm',exact:true}).click();await p.getByRole('heading',{name:'THE LAMPS OF OAKHAVEN'}).waitFor();
  s=await read();assert.equal(s.world.milestones.filter(m=>m.kind==='chapter').length,1);assert.ok(s.world.pages.some(p=>p.kind==='chapter'));assert.ok(s.world.milestones.some(m=>m.kind==='restoration'&&m.id==='village-gate'));
  for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:844});for(const tab of ['Keep','Quest Board','Journey','Knight','Chronicle']){await go(tab);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${tab} has no overflow at ${width}px`);}}
  await p.setViewportSize({width:844,height:390});await go('Keep');await p.locator('.room-door>summary').filter({hasText:'Enter Great Hall'}).click();await p.getByText('Tomas’s Songbook',{exact:true}).click();await p.getByRole('region',{name:'Songbook'}).getByLabel('Lyrics or notes').focus();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.setViewportSize({width:390,height:844});await p.clock.setSystemTime(new Date('2026-10-19T19:00:00+02:00'));await p.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await p.waitForFunction(()=>JSON.parse(localStorage.getItem('oathbound.knight.v7')).world.pages.some(p=>p.kind==='week'&&p.start==='2026-10-12'));
  await go('Chronicle');assert.match(await p.getByRole('region',{name:'Illuminated Chronicle'}).textContent(),/The Lamps|THE LAMPS/);
  const beforeOffline=await read();
  const offlineContext=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Europe/Brussels'}),offline=await offlineContext.newPage();offline.on('pageerror',e=>errors.push(e.message));
  await offline.clock.install({time:new Date('2026-10-19T19:00:00+02:00')});await offline.goto(process.env.PWA_URL||'http://127.0.0.1:4173/Oathbound/');
  await offline.evaluate(s=>{localStorage.setItem('oathbound.knight.v7',JSON.stringify(s));localStorage.setItem('oathbound.feedback.v1',JSON.stringify({sound:'disabled',volume:.35,haptics:false,offered:true}));},beforeOffline);
  await offline.waitForFunction(()=>!!navigator.serviceWorker.controller);await offlineContext.setOffline(true);await offline.reload();
  assert.equal(await offline.locator('.keep-area').count(),6);assert.equal(await offline.locator('.reward-feedback').count(),0);
  await offline.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Journey',exact:true}).click();await offline.locator('.journey-world>summary').click();assert.match(await offline.getByRole('region',{name:'World restoration'}).textContent(),/Once restored/);
  await offline.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Knight',exact:true}).click();assert.equal(await offline.getByLabel('Displayed Title',{exact:true}).inputValue(),'warden-scholar');
  const reopened=await offline.evaluate(()=>JSON.parse(localStorage.getItem('oathbound.knight.v7')));assert.deepEqual(reopened.world,beforeOffline.world);assert.deepEqual(reopened.weight,fixture.weight);
  assert.deepEqual(errors,[]);console.log('PASS: v4 migration/backup, six Keep areas, step-gated Retinue, Songbook editing/no audio autoplay, remembered choices, rank/Keep/Relic/Chapter feedback, preferred Titles, weekly snapshots, 320–1440px and landscape layouts, production /Oathbound/ offline startup and no ceremony replay.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
