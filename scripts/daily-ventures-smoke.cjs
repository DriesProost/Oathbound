// Isolated browser fixtures; never touches a player's browser profile.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const development = process.env.DEV_URL || 'http://127.0.0.1:5173';
const production = process.env.PWA_URL || 'http://127.0.0.1:4173/Oathbound/';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Europe/Brussels' });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install({ time: new Date('2026-10-13T12:00:00+02:00') });
    await page.goto(development);
    const fixture = await page.evaluate(async () => {
      const d = await import('/src/domain.ts'), v = await import('/src/ventureDomain.ts'), library = await import('/src/ventures.ts');
      let s = d.createKnight('Rowan', '2026-10-13');
      s.oaths['2026-10-13'] = { status: 'kept', reward: { renown: 995, xp: { Wisdom: 99 } } };
      return v.ensureDailyVenture(s, '2026-10-13', [library.ventures[4]]);
    });
    const seed = async s => {
      await page.evaluate(s => {
        localStorage.setItem('oathbound.knight.v7', JSON.stringify(s));
        localStorage.setItem('oathbound.feedback.v1', JSON.stringify({ sound: 'disabled', haptics: false, volume: .35, offered: true }));
      }, s);
      await page.reload();
    };
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('oathbound.knight.v7')));
    const go = async name => {
      const nav = await page.getByRole('navigation', { name: 'Main navigation' }).isVisible() ? 'Main navigation' : 'Desktop navigation';
      await page.getByRole('navigation', { name: nav }).getByRole('button', { name: name === 'Quest Board' && nav === 'Main navigation' ? 'Quests' : name, exact: true }).click();
    };
    await seed(fixture);
    await page.getByRole('button', { name: 'Open Venture', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.match(await dialog.textContent(), /Medieval guilds were more than associations/);
    assert.equal(await dialog.getByRole('textbox').count(), 0);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}px`);
      const bounds = await dialog.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, `Dialog fits ${width}px`);
    }
    await dialog.getByRole('button', { name: 'Mark as read & complete Venture' }).click();
    await page.getByRole('heading', { name: 'RISE, MAN-AT-ARMS' }).waitFor();
    const feedback = page.getByRole('region', { name: 'Action feedback' });
    assert.match(await feedback.textContent(), /The Scholar at the Gate/);
    const completed = await read();
    assert.equal(completed.ventures[0].status, 'completed');
    assert.equal(completed.ventures[0].reward.renown, 30);
    assert.ok(completed.ventures[0].rewardGrant);
    await go('Knight'); assert.equal(await page.locator('.reward-feedback').count(), 0);
    assert.equal(await page.getByRole('button', { name: /A fresh commission awaits/ }).count(), 0);
    await page.reload(); assert.equal(await page.locator('.reward-feedback').count(), 0);
    { const reloaded=await read(); for (const field of ['entries','oaths','ventures','weekly','weight','campaign','world']) assert.deepEqual(reloaded[field],completed[field]); }
    await go('Chronicle');
    assert.match(await page.getByRole('region', { name: 'Completed Ventures' }).textContent(), /Wisdom · Brief/);
    // New multi-attribute notices display both names and share one tier reward.
    const dualFixture = await page.evaluate(async fixture => {
      const v = await import('/src/ventureDomain.ts'), library = await import('/src/ventures.ts');
      const s = { ...fixture, ventures: [], oaths: { '2026-10-13': { status: 'kept', reward: { renown: 995, xp: { Strength: 99, Endurance: 99 } } } } };
      return v.ensureDailyVenture(s, '2026-10-13', [library.ventures.find(v => v.id === 'tower-steps')]);
    }, fixture);
    await page.setViewportSize({ width: 320, height: 844 });
    await seed(dualFixture);
    await page.getByRole('button', { name: 'Open Venture', exact: true }).click();
    await dialog.waitFor();
    assert.match(await dialog.textContent(), /Strength \+ Endurance/);
    assert.match(await dialog.textContent(), /40 Strength XP/);
    assert.match(await dialog.textContent(), /40 Endurance XP/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await dialog.getByRole('button', { name: 'Complete Venture', exact: true }).click();
    await page.getByRole('heading', { name: 'RISE, MAN-AT-ARMS' }).waitFor();
    const dualCompleted = await read();
    assert.deepEqual(dualCompleted.ventures[0].reward, { renown: 45, xp: { Strength: 40, Endurance: 40 } });
    await go('Chronicle');
    assert.match(await page.getByRole('region', { name: 'Completed Ventures' }).textContent(), /Strength \+ Endurance/);
    await page.setViewportSize({ width: 390, height: 844 });
    const newLessonFixture = await page.evaluate(async fixture => {
      const v = await import('/src/ventureDomain.ts'), library = await import('/src/ventures.ts');
      return v.ensureDailyVenture({ ...fixture, ventures: [] }, '2026-10-13', [library.ventures.find(v => v.id === 'cartographer-flat-world')]);
    }, fixture);
    // A replaced notice is never rewardable, and rerolling stays unavailable after refresh.
    await seed(fixture); await go('Quest Board');
    await page.getByRole('button', { name: 'Choose another Venture' }).click();
    const replaced = await read(); assert.equal(replaced.ventures.length, 2);
    assert.equal(replaced.ventures[0].status, 'set-aside');
    assert.notEqual(replaced.ventures[0].attribute, replaced.ventures[1].attribute);
    assert.equal(await page.getByRole('button', { name: 'Choose another Venture' }).count(), 0);
    assert.ok(await page.evaluate(async s => {
      const v = await import('/src/ventureDomain.ts'); return v.completeDailyVenture(s, s.ventures[0].assignmentId) === s;
    }, replaced));
    await page.reload(); await go('Quest Board');
    assert.equal(await page.getByRole('button', { name: 'Choose another Venture' }).count(), 0);
    await go('Chronicle'); assert.equal(await page.locator('.venture-ledger').count(), 0);
    // Local midnight creates one new notice; ignored opportunities add no penalty or ceremony.
    await page.clock.setSystemTime(new Date('2026-10-14T00:01:00+02:00'));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('oathbound.knight.v7')).ventures.length === 3);
    const rollover = await read(); assert.deepEqual(rollover.oaths, replaced.oaths);
    assert.equal(rollover.ventures[2].date, '2026-10-14');
    assert.equal(await page.locator('.reward-feedback').count(), 0);
    // Production worker must precache the bundled authored text, not depend on the dev server.
    const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Europe/Brussels' });
    const offline = await offlineContext.newPage(); offline.on('pageerror', e => errors.push(e.message));
    await offline.clock.install({ time: new Date('2026-10-13T12:00:00+02:00') });
    await offline.goto(production);
    await offline.evaluate(s => {
      localStorage.setItem('oathbound.knight.v7', JSON.stringify(s));
      localStorage.setItem('oathbound.feedback.v1', JSON.stringify({ sound: 'disabled', haptics: false, volume: .35, offered: true }));
    }, newLessonFixture);
    await offline.waitForFunction(() => !!navigator.serviceWorker.controller);
    await offlineContext.setOffline(true);
    await offline.reload();
    await offline.getByRole('button', { name: 'Open Venture', exact: true }).click();
    const offlineDialog = offline.getByRole('dialog');
    assert.match(await offlineDialog.textContent(), /A globe represents the Earth on a curved surface/);
    await offlineDialog.getByRole('button', { name: 'Mark as read & complete Venture' }).click();
    await offline.getByRole('heading', { name: 'RISE, MAN-AT-ARMS' }).waitFor();
    await offline.reload(); assert.equal(await offline.locator('.reward-feedback').count(), 0);
    const receipt = await offline.evaluate(() => JSON.parse(localStorage.getItem('oathbound.knight.v7')).ventures[0]);
    assert.equal(receipt.status, 'completed'); assert.ok(receipt.rewardGrant);
    await offline.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Chronicle', exact: true }).click();
    assert.match(await offline.getByRole('region', { name: 'Completed Ventures' }).textContent(), /The Cartographer/);
    assert.deepEqual(errors, []);
    console.log('PASS: Daily Ventures teaser/detail, lesson completion, multi-attribute rewards, coordinated rank/level feedback, no replay, one replacement, rollover, completed-only Chronicle, 320–1440px layouts and real production offline PWA completion.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
