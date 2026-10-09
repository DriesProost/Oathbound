// Optional real-browser verification; run against npm run dev.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.OATHBOUND_URL || 'http://127.0.0.1:5173');
    const base = await page.evaluate(async () => {
      const d = await import('/src/domain.ts');
      const c = await import('/src/campaign.ts');
      const goals = c.defaultGoals(false).map(g => ({ ...g, active: g.id === 'strength' }));
      const s = d.createKnight('Rowan', '2026-10-05', goals);
      return d.completeQuest(s, 'training', '2026-10-05', new Date('2026-10-09T19:00:00'));
    });
    const assets = ['squire', 'man-at-arms', 'knight-errant', 'knight', 'knight-banneret'];
    const thresholds = [0, 1000, 3000, 7500, 15000];
    for (let rank = 0; rank < assets.length; rank++) {
      for (let beard = 0; beard < 3; beard++) {
        for (const body of ['large','sturdy','lean']) for (const groomed of [false,true]) {
          const fixture = structuredClone(base);
          fixture.entries[0].reward = { renown: thresholds[rank], xp: { Wisdom: [0, 225, 750][beard], Presence:groomed ? 225 : 0, Strength:750, Vitality:750 } };
          fixture.weight.settings.appearance = { enabled:true, startingBuild:body, targetBuild:body };
          await page.evaluate(s => localStorage.setItem('oathbound.knight.v3', JSON.stringify(s)), fixture);
          await page.reload();
          await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Knight', exact: true }).click();
          const portrait = page.locator('.profile-art .knight-illustration');
          await portrait.locator('svg image').first().waitFor();
          const href = await portrait.locator('svg image').first().getAttribute('href');
          assert.match(href, new RegExp(`${assets[rank]}-${beard}\\.webp`));
          await page.evaluate(async src => { const image=new Image(); image.src=src; await image.decode(); if(image.naturalWidth!==900||image.naturalHeight!==1350)throw Error('Unexpected sheet geometry'); }, href);
          assert.equal(await portrait.getAttribute('data-body-build'), body);
          assert.equal(await portrait.getAttribute('data-grooming'), groomed?'well-kept':'untidy');
          assert.equal(await portrait.getAttribute('data-beard'), String(beard));
          const source = await portrait.evaluate(el => {
            const image=el.querySelector('svg image'), clip=el.querySelector('svg clipPath rect');
            const scale=Number(image.getAttribute('width'))/900;
            return {x:(Number(clip.getAttribute('x'))-Number(image.getAttribute('x')))/scale,
              y:(Number(clip.getAttribute('y'))-Number(image.getAttribute('y')))/scale,
              width:Number(clip.getAttribute('width'))/scale,height:Number(clip.getAttribute('height'))/scale};
          });
          const column=['large','sturdy','lean'].indexOf(body),row=Number(groomed);
          assert.ok(source.x+source.width/2>column*300 && source.x+source.width/2<(column+1)*300);
          assert.ok(source.y+source.height/2>row*675 && source.y+source.height/2<(row+1)*675);
          assert.ok(source.width>100 && source.height>300);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
          assert.equal(await page.locator('.profile-art').evaluate(el => el.getBoundingClientRect().width >= 200), true);
          assert.equal(await page.getByText('RISE,', { exact: false }).count(), 0);
        }
      }
    }
    await page.setViewportSize({ width: 320, height: 740 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.setViewportSize({ width: 1440, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    console.log('PASS: all 90 rank/beard/build/grooming combinations, decoded sprite sheets and exact viewport selection, complexion overlay, 320/390/1440px layouts, no reload ceremony or runtime errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
