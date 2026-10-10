// Run against npm run dev after a root production build; every fixture uses an isolated profile.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  let server;
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(10000);
    await page.clock.install({ time: new Date('2026-10-09T19:00:00') });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.OATHBOUND_URL || 'http://127.0.0.1:5173');
    const fixture = await page.evaluate(async () => {
      const d = await import('/src/domain.ts'), c = await import('/src/campaign.ts');
      const s = d.createKnight('Rowan', '2026-10-01', c.defaultGoals(false).map(g => ({ ...g, active: g.id === 'walking' })));
      return d.completeQuest(s, 'patrol', '2026-10-08', new Date('2026-10-09T19:00:00'));
    });
    const seed = async (distance, renown = 0) => {
      const s = structuredClone(fixture);
      s.entries[0].distance = distance; s.entries[0].reward.renown = renown;
      await page.evaluate(s => {
        localStorage.setItem('oathbound.knight.v3', JSON.stringify(s));
        localStorage.setItem('oathbound.feedback.v1', JSON.stringify({ sound: 'disabled', volume: .35, haptics: false }));
      }, s);
      await page.reload();
      return JSON.parse(JSON.stringify(s));
    };
    const go = name => page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name, exact: true }).click();
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('oathbound.knight.v3')));
    const keys = ['keep', 'mill', 'inn', 'oakhaven'];
    const thresholds = [0, 9, 21, 30];
    for (const distance of [0, 8.999, 9, 20.999, 21, 29.999, 30]) {
      const s = await seed(distance);
      await go('Journey');
      assert.equal(await page.locator('.journey-postcard').count(), 4);
      const latest = thresholds.findLastIndex(km => distance >= km);
      for (let index = 0; index < keys.length; index++) {
        const card = page.locator(`[data-landmark="${keys[index]}"]`), img = card.locator('img');
        assert.equal(await img.count(), 1);
        await img.scrollIntoViewIfNeeded();
        assert.equal(await img.getAttribute('loading'), 'lazy');
        await img.evaluate(async el => {
          if (!el.complete) await new Promise((resolve, reject) => { el.onload = resolve; el.onerror = reject; });
          if (!el.naturalWidth || el.naturalWidth / el.naturalHeight !== 16 / 9) throw Error('Missing or incorrectly sized landmark scene');
        });
        if (index <= latest) {
          assert.equal(await card.evaluate(el => el.tagName), 'DETAILS');
          assert.equal(await card.locator('.postcard-body > p').count(), 3);
          assert.equal(await card.evaluate(el => el.open), index === latest);
          assert.equal(await img.evaluate(el => getComputedStyle(el).filter), 'none');
          assert.equal(await card.locator('.postcard-teaser p').count(), 1);
        } else {
          assert.equal(await card.evaluate(el => el.tagName), 'ARTICLE');
          assert.equal(await card.locator('.postcard-body').count(), 0);
          assert.match(await img.evaluate(el => getComputedStyle(el).filter), /blur/);
          assert.equal(await img.getAttribute('aria-hidden'), 'true');
        }
      }
      assert.deepEqual(await read(), s);
      assert.equal(await page.getByRole('region', { name: 'Action feedback' }).count(), 0);
    }
    // A real confirmation can promote rank and reach a location together, retaining every reward result.
    await seed(8, 2990); await go('Quests');
    await page.getByRole('button', { name: 'Complete Patrol the Realm', exact: true }).click();
    const feedback = page.getByRole('region', { name: 'Action feedback' });
    await feedback.getByRole('heading', { name: 'RISE, KNIGHT ERRANT' }).waitFor();
    assert.equal(await feedback.locator('[data-arrival="mill"] img').count(), 1);
    assert.equal(await feedback.locator('.feedback-result').filter({ hasText: 'Reached Old Mill' }).count(), 1);
    assert.equal(await feedback.locator('.feedback-result').filter({ hasText: '+30 Renown' }).count(), 1);
    assert.match(await feedback.textContent(), /15 Endurance XP/);
    await feedback.getByRole('button', { name: 'Read Old Mill’s chapter' }).click();
    await page.locator('[data-landmark="mill"][open]').waitFor();
    await page.waitForFunction(() => document.activeElement === document.querySelector('[data-landmark="mill"] summary'));
    assert.equal(await feedback.count(), 0);
    assert.equal(await page.locator('.journey-just-reached').count(), 0);
    assert.equal(await page.locator('[data-landmark="keep"]').evaluate(el => el.open), false);
    await page.locator('[data-landmark="keep"] summary').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-landmark="keep"]').evaluate(el => el.open), true);
    const earned = await read(); assert.equal(earned.name, 'Rowan'); assert.equal(earned.entries.length, 2);
    await go('Keep'); await page.getByRole('heading', { name: 'Welcome to your keep, Sir Rowan.' }).waitFor();
    await go('Knight'); await page.getByRole('heading', { name: 'Sir Rowan', exact: true }).waitFor();
    await page.reload(); await go('Journey');
    assert.deepEqual(await read(), earned);
    assert.equal(await feedback.count(), 0);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.journey-story').screenshot({ path: '/tmp/oathbound-journey-mobile.png' });
    await page.locator('[data-landmark="inn"]').scrollIntoViewIfNeeded();
    await page.locator('[data-landmark="inn"]').screenshot({ path: '/tmp/oathbound-unrevealed-mobile.png' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('.journey-story').screenshot({ path: '/tmp/oathbound-journey-desktop.png' });
    assert.deepEqual(errors, []);
    // All four scenes and chapters survive an offline cold reload of the production shell.
    const dist = path.resolve(__dirname, '../dist');
    server = http.createServer((req, res) => {
      const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
      const file = path.join(dist, name);
      if (name.includes('..') || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
      const type = { '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }[path.extname(name)] || 'text/html';
      res.setHeader('Content-Type', type); res.end(fs.readFileSync(file));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const offline = await context.newPage(); const offlineErrors = [];
    offline.on('pageerror', e => offlineErrors.push(e.message));
    await offline.goto(`http://127.0.0.1:${server.address().port}`);
    const completed = structuredClone(earned); completed.entries[0].distance = 30;
    await offline.evaluate(s => localStorage.setItem('oathbound.knight.v3', JSON.stringify(s)), completed);
    await offline.reload(); await offline.waitForFunction(() => navigator.serviceWorker.controller);
    await context.setOffline(true); await offline.reload();
    await offline.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Journey', exact: true }).click();
    for (const key of keys) {
      await offline.locator(`[data-landmark="${key}"] img`).scrollIntoViewIfNeeded();
      await offline.locator(`[data-landmark="${key}"] img`).evaluate(el => el.decode());
      assert.equal(await offline.locator(`[data-landmark="${key}"] .postcard-body > p`).count(), 3);
    }
    assert.deepEqual(await offline.evaluate(() => JSON.parse(localStorage.getItem('oathbound.knight.v3'))), completed);
    assert.deepEqual(offlineErrors, []);
    assert.equal(await offline.getByRole('region', { name: 'Action feedback' }).count(), 0);
    console.log('PASS: all landmark boundaries; actual 16:9 art; dimmed locked previews without story spoilers; full three-paragraph chapters; keyboard rereading; exact combined rank/landmark/reward receipt; read-chapter navigation; Sir display with raw name preserved; no replay or save changes; 320/390/1440px; reduced-motion offline art and history.');
  } finally {
    await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
