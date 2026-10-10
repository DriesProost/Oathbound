// Isolated browser fixtures: journal layout, preferences and prospective step conversion.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Europe/Brussels'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.audioLog={created:0,started:0,stopped:0};const Native=window.AudioContext;
   window.AudioContext=class extends Native {constructor(...args){super(...args);window.audioLog.created++;}createBufferSource(){const source=super.createBufferSource();const start=source.start.bind(source),stop=source.stop.bind(source);source.start=(...args)=>{window.audioLog.started++;return start(...args);};source.stop=(...args)=>{window.audioLog.stopped++;return stop(...args);};return source;}};
  });
  await page.goto('http://127.0.0.1:5173');
  const fixture=await page.evaluate(async()=>{
   const d=await import('/src/domain.ts'),c=await import('/src/campaign.ts');const goals=c.defaultGoals().map(g=>g.id==='walking'?{...g,target:{metric:'km',value:3}}:g);
   return {...d.completeQuest(d.createKnight('Rowan','2026-10-09',goals),'patrol','2026-10-09',new Date('2026-10-09T19:00:00')),portrait:'tied-hair'};
  });
  await page.evaluate(s=>{localStorage.setItem('oathbound.knight.v3',JSON.stringify(s));localStorage.setItem('oathbound.feedback.v1',JSON.stringify({sound:'disabled',volume:.35,haptics:false,offered:true}));},fixture);await page.reload();
  const go=name=>page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name,exact:true}).click();
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('oathbound.knight.v3')));
  for(const width of [320,390,768,1440]) {await page.setViewportSize({width,height:844});for(const name of ['Keep','Quests','Journey','Knight','Chronicle']){const nav=await page.getByRole('navigation',{name:'Main navigation'}).isVisible()?'Main navigation':'Desktop navigation';await page.getByRole('navigation',{name:nav}).getByRole('button',{name:name==='Quests'&&nav==='Desktop navigation'?'Quest Board':name,exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} at ${width}px`);}}
  await page.setViewportSize({width:390,height:844});await go('Keep');assert.equal(await page.locator('.journal-attributes').evaluate(el=>el.open),false);await page.locator('.journal-attributes summary').click();assert.equal(await page.locator('.journal-attributes .attribute').count(),6);
  assert.equal(await page.evaluate(()=>window.audioLog.created),0);
  const settings=page.getByRole('button',{name:'Sound effects settings'});await settings.click();await page.getByRole('button',{name:'Play ambience',exact:true}).click();await page.getByRole('button',{name:'Mute ambience',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.audioLog.started),1);
  await settings.click();assert.equal(await page.getByRole('button',{name:'Pause background music'}).isVisible(),true);assert.equal(await page.evaluate(()=>window.audioLog.stopped),0);await settings.click();await page.getByLabel('Ambience volume').fill('0.4');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('oathbound.ambience.v1')).volume),.4);
  await page.reload();assert.equal(await page.evaluate(()=>window.audioLog.created),0);await settings.click();await page.getByRole('button',{name:'Resume ambience',exact:true}).click();await page.getByRole('button',{name:'Mute ambience',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('oathbound.ambience.v1')).enabled),false);await settings.click();
  await go('Journey');await page.getByRole('button',{name:'Use steps for patrols'}).click();const next=await read();assert.deepEqual(next.entries,fixture.entries);assert.deepEqual(next.weight,fixture.weight);assert.deepEqual(next.weekly,fixture.weekly);assert.equal(next.campaign.revisions.at(-1).goals.find(g=>g.id==='walking').target.value,4000);
  await page.emulateMedia({reducedMotion:'reduce'});await go('Keep');assert.equal(await page.locator('.journal-turn').evaluate(el=>getComputedStyle(el).display),'none');await page.screenshot({path:'/tmp/oathbound-journal-keep.png'});await go('Quests');assert.match(await page.locator('main').textContent(),/4,000 steps/);await page.screenshot({path:'/tmp/oathbound-journal-board.png'});
  assert.deepEqual(errors,[]);console.log('PASS: 320/390/768/1440 journal screens, expandable attributes, explicit ambience gesture, independent volume/preferences, closing controls preserves playback, reload never autoplays, prospective step conversion preserves history, reduced motion.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
