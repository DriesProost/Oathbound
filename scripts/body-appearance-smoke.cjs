// Optional interaction-level check against npm run dev; uses an isolated browser profile.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-10-09T19:00:00')});
  await page.goto(process.env.OATHBOUND_URL||'http://127.0.0.1:5173');
  const fixture=await page.evaluate(async()=>{
   const d=await import('/src/domain.ts'),c=await import('/src/campaign.ts');
   return d.createKnight('Rowan','2026-09-28',c.defaultGoals(false).map(g=>({...g,active:g.id==='weight'})));
  });
  await page.evaluate(s=>localStorage.setItem('oathbound.knight.v3',JSON.stringify(s)),fixture);await page.reload();
  const nav=()=>page.getByRole('navigation',{name:'Main navigation'});
  const go=async(name)=>nav().getByRole('button',{name,exact:true}).click();
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('oathbound.knight.v3')));
  await go('Chronicle');await page.getByRole('button',{name:'Starting weight & target',exact:true}).click();
  await page.getByLabel('Starting weight (kg, optional)',{exact:true}).fill('100');
  await page.getByLabel('Starting date',{exact:true}).fill('2026-09-28');
  await page.getByLabel('Target weight (kg, optional)',{exact:true}).fill('80');
  await page.getByLabel('Let my knight’s build follow this weight plan').check();
  await page.getByRole('button',{name:'Save weight settings',exact:true}).click();
  await go('Knight');await page.locator('.profile-art [data-body-build="large"][data-grooming="untidy"]').waitFor();
  await go('Chronicle');
  const add=async(date,value)=>{
   await page.getByLabel('Measurement date',{exact:true}).fill(date);
   await page.getByLabel('Weight (kg)',{exact:true}).fill(value);
   await page.getByRole('button',{name:/^Record weight$|^Save measurement$/}).click();
  };
  for(const date of ['2026-09-29','2026-09-30','2026-10-01'])await add(date,'90');
  await go('Knight');await page.locator('.profile-art [data-body-build="sturdy"]').waitFor();
  await go('Chronicle');for(const date of ['2026-10-07','2026-10-08','2026-10-09'])await add(date,'80');
  await go('Knight');await page.locator('.profile-art [data-body-build="lean"]').waitFor();
  const saved=await read();assert.equal(saved.weight.measurements.length,6);
  assert.deepEqual(saved.entries,fixture.entries);assert.deepEqual(saved.weekly,fixture.weekly);assert.deepEqual(saved.oaths,fixture.oaths);
  assert.equal(await page.getByText('DEED RECORDED',{exact:true}).count(),0);
  await page.reload();await go('Knight');await page.locator('.profile-art [data-body-build="lean"]').waitFor();
  await go('Chronicle');await page.getByRole('button',{name:'Starting weight & target',exact:true}).click();
  await page.getByLabel('Let my knight’s build follow this weight plan').uncheck();await page.getByRole('button',{name:'Save weight settings',exact:true}).click();
  assert.equal((await read()).weight.measurements.length,6);
  await page.setViewportSize({width:320,height:740});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: explicit opt-in from Chronicle, larger→sturdy→lean through real entry controls, no extra activity/reward/weekly/Oath records, reload preservation, opt-out preserves measurements, narrow layout.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
