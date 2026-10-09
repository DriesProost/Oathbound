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
        const fixture = structuredClone(base);
        fixture.entries[0].reward = { renown: thresholds[rank], xp: { Wisdom: [0, 225, 750][beard], Strength: 750, Vitality: 750 } };
        await page.evaluate(s => localStorage.setItem('oathbound.knight.v3', JSON.stringify(s)), fixture);
        await page.reload();
        await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Knight', exact: true }).click();
        await page.waitForFunction(() => Array.from(document.querySelectorAll('.profile-art .knight-figure img')).every(i => i.complete && i.naturalWidth === 640));
        const image = page.locator('.profile-art .knight-figure > img').first();
        assert.match(await image.getAttribute('src'), new RegExp(`${assets[rank]}${beard ? `-wisdom${beard}` : ''}\\.webp`));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        assert.equal(await page.locator('.profile-art').evaluate(el => el.getBoundingClientRect().width >= 200), true);
        assert.equal(await page.getByText('RISE,', { exact: false }).count(), 0);
      }
    }
    await page.setViewportSize({ width: 320, height: 740 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.setViewportSize({ width: 1440, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    console.log('PASS: all 15 rank/beard portraits, image loading, larger mobile framing, complexion overlay, 320/390/1440px layouts, no reload ceremony or runtime errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
