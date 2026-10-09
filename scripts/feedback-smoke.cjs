// Optional browser integration checks against the Vite development server.
// Playwright/Chromium are supplied by the development environment, not runtime dependencies.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  async function open({
    reduced = false,
    mode = "normal",
    sound = "unset",
    unsupported = false,
  } = {}) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      timezoneId: "Europe/Brussels",
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    await ctx.addInitScript(
      ({ unsupported }) => {
        window.__audio = [];
        window.__haptics = [];
        window.__contexts = 0;
        const param = () => ({
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        });
        const source = (type) => ({
          frequency: param(),
          connect() {},
          disconnect() {},
          start() {
            window.__audio.push(type);
          },
          stop() {},
          onended: null,
        });
        window.AudioContext = unsupported
          ? undefined
          : class {
              constructor() {
                window.__contexts++;
                this.state = "running";
                this.currentTime = 0;
                this.sampleRate = 8000;
                this.destination = {};
              }
              resume() {
                return Promise.resolve();
              }
              createOscillator() {
                return source("tone");
              }
              createBufferSource() {
                return source("texture");
              }
              createBuffer(n, length) {
                return {
                  getChannelData() {
                    return new Float32Array(length);
                  },
                };
              }
              createBiquadFilter() {
                return {
                  frequency: { value: 0 },
                  connect() {},
                  disconnect() {},
                };
              }
              createGain() {
                return { gain: param(), connect() {}, disconnect() {} };
              }
            };
        Object.defineProperty(navigator, "vibrate", {
          configurable: true,
          value: (pattern) => {
            if (unsupported) throw Error("unsupported");
            window.__haptics.push(pattern);
            return true;
          },
        });
      },
      { unsupported },
    );
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    p.on("pageerror", (e) => errors.push(e.message));
    await p.clock.install({ time: new Date("2026-10-09T19:00:00+02:00") });
    await p.goto(process.env.OATHBOUND_URL || "http://127.0.0.1:5173");
    await p.evaluate(
      async ({ mode, sound }) => {
        const d = await import("/src/domain.ts");
        const c = await import("/src/campaign.ts");
        const goals = c.defaultGoals().map((g) => ({ ...g, active: true }));
        let s = d.createKnight("Rowan", "2026-10-01", goals);
        const now = new Date("2026-10-09T19:00:00");
        if (mode === "multi") {
          s = d.completeQuest(s, "training", "2026-10-05", now);
          s = d.completeQuest(s, "training", "2026-10-06", now);
          s.entries[0].reward = { renown: 950, xp: { Strength: 75 } };
        }
        if (mode === "landmark") {
          s = d.completeQuest(s, "patrol", "2026-10-08", now);
          s.entries[0].distance = 8;
        }
        localStorage.setItem("oathbound.knight.v3", JSON.stringify(s));
        if (sound !== "unset")
          localStorage.setItem(
            "oathbound.feedback.v1",
            JSON.stringify({
              sound,
              volume: 0.35,
              haptics: true,
              offered: true,
            }),
          );
      },
      { mode, sound },
    );
    await p.reload();
    assert.equal(await p.evaluate(() => window.__contexts), 0);
    assert.equal(
      await p.getByRole("region", { name: "Action feedback" }).count(),
      0,
    );
    globalThis.reviewPage = p;
    return {
      ctx,
      p,
      nav: p.getByRole("navigation", { name: "Main navigation" }),
      read: () =>
        p.evaluate(() =>
          JSON.parse(localStorage.getItem("oathbound.knight.v3")),
        ),
    };
  }
  const a = await open();
  globalThis.reviewPage = a.p;
  await a.nav.getByRole("button", { name: "Quests", exact: true }).click();
  await a.p.getByRole("button", { name: "Complete Training Yard" }).click();
  const surface = a.p.getByRole("region", { name: "Action feedback" });
  await surface
    .getByText("+35 Renown · +20 Strength XP", { exact: true })
    .waitFor();
  assert.equal(await a.p.evaluate(() => window.__contexts), 0);
  await a.p.getByRole("region", { name: "Optional sound effects" }).waitFor();
  await a.p.getByRole("button", { name: "No thanks", exact: true }).click();
  assert.equal(
    await a.p.evaluate(
      () => JSON.parse(localStorage.getItem("oathbound.feedback.v1")).sound,
    ),
    "disabled",
  );
  await a.p.clock.runFor(1200);
  assert.equal(
    (await a.p.locator(".top-renown").innerText()).replace(/\s+/g, " "),
    "35 Renown",
  );
  const id = await surface.getAttribute("data-feedback-id");
  await a.nav.getByRole("button", { name: "Knight", exact: true }).click();
  await a.nav.getByRole("button", { name: "Quests", exact: true }).click();
  assert.equal(await surface.getAttribute("data-feedback-id"), id);
  assert.equal(await a.p.locator(".deed-just-recorded").count(), 0);
  await a.p.reload();
  await a.nav.getByRole("button", { name: "Quests", exact: true }).click();
  assert.equal(await surface.count(), 0);
  assert.equal(
    await a.p.getByRole("region", { name: "Optional sound effects" }).count(),
    0,
  );
  await a.p.getByRole("button", { name: "Complete Patrol the Realm" }).click();
  assert.equal(
    await a.p.getByRole("region", { name: "Optional sound effects" }).count(),
    0,
  );
  await a.p.getByRole("button", { name: "Sound effects settings" }).click();
  await a.p
    .getByRole("button", { name: "Enable sound effects & preview" })
    .click();
  assert.equal(
    await a.p.evaluate(
      () => JSON.parse(localStorage.getItem("oathbound.feedback.v1")).sound,
    ),
    "enabled",
  );
  assert.ok((await a.p.evaluate(() => window.__audio.length)) > 0);
  await a.p.getByRole("button", { name: "Mute sound effects" }).click();
  const mutedCount = await a.p.evaluate(() => window.__audio.length);
  await a.p.getByRole("button", { name: "Sound effects settings" }).click();
  await a.p.getByRole("button", { name: "Complete Attend Thy Person" }).click();
  await a.p.clock.runFor(1500);
  assert.equal(await a.p.evaluate(() => window.__audio.length), mutedCount);
  // Rapid distinct deeds remain recorded; repeating a stale completion cannot produce a second reward.
  const rapid = await open({ sound: "disabled" });
  await rapid.nav.getByRole("button", { name: "Quests", exact: true }).click();
  await rapid.p.evaluate(() => {
    const training = document.querySelector(
      'button[aria-label="Complete Training Yard"]',
    );
    const care = document.querySelector(
      'button[aria-label="Complete Attend Thy Person"]',
    );
    training.click();
    training.click();
    care.click();
  });
  assert.equal((await rapid.read()).entries.length, 2);
  assert.equal(
    (await rapid.read()).entries.filter((e) => e.questId === "training").length,
    1,
  );
  await rapid.p.clock.runFor(1700);
  assert.equal(
    (await rapid.p.locator(".top-renown").innerText()).replace(/\s+/g, " "),
    "50 Renown",
  );
  // Enabled preference survives reload, but no device starts until a new gesture.
  await a.p.getByRole("button", { name: "Sound effects settings" }).click();
  await a.p
    .getByRole("button", { name: "Enable sound effects & preview" })
    .click();
  await a.p.reload();
  assert.equal(await a.p.evaluate(() => window.__contexts), 0);
  assert.equal(
    await a.p.evaluate(
      () => JSON.parse(localStorage.getItem("oathbound.feedback.v1")).sound,
    ),
    "enabled",
  );
  // An unanswered offer is not repeatedly shown on reload, even while choice remains unset.
  const offer = await open();
  await offer.nav.getByRole("button", { name: "Quests", exact: true }).click();
  await offer.p.getByRole("button", { name: "Complete Training Yard" }).click();
  await offer.p.reload();
  await offer.nav.getByRole("button", { name: "Quests", exact: true }).click();
  await offer.p
    .getByRole("button", { name: "Complete Patrol the Realm" })
    .click();
  assert.equal(
    await offer.p
      .getByRole("region", { name: "Optional sound effects" })
      .count(),
    0,
  );
  // A single training action crosses rank, weekly commission and attribute level thresholds.
  const m = await open({ mode: "multi", sound: "enabled" });
  await m.nav.getByRole("button", { name: "Quests", exact: true }).click();
  await m.p.evaluate(() => (window.__audio = []));
  await m.p.getByRole("button", { name: "Complete Training Yard" }).click();
  const mf = m.p.getByRole("region", { name: "Action feedback" });
  await mf.getByRole("heading", { name: "RISE, MAN-AT-ARMS" }).waitFor();
  const result = await mf.locator(".feedback-result").allTextContents();
  assert.deepEqual(result, [
    "Squire → Man-at-Arms",
    "Commission fulfilled · Training Yard · 3 / 3 sessions. No additional reward.",
    "Strength II · level 1 → 2",
    "Training Yard",
    "+35 Renown · +20 Strength XP",
  ]);
  assert.equal(await mf.count(), 1);
  assert.equal((await m.read()).entries.length, 3);
  await mf.locator(".feedback-result").first().waitFor();
  const receiptBounds = await mf.boundingBox();
  assert.ok(
    receiptBounds.y >= 0 && receiptBounds.y + receiptBounds.height <= 844 - 80,
  );
  const pre = (await m.p.locator(".top-renown").innerText()).replace(
    /\s+/g,
    " ",
  );
  assert.ok(pre.includes("985"));
  await m.p.clock.runFor(2600);
  assert.equal(
    (await m.p.locator(".top-renown").innerText()).replace(/\s+/g, " "),
    "1020 Renown",
  );
  await m.p.screenshot({
    path: "/tmp/oathbound-feedback-mobile.png",
    fullPage: true,
  });
  for (const width of [320, 390, 1440]) {
    await m.p.setViewportSize({ width, height: 900 });
    assert.equal(
      await m.p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await m.p.getByRole("button", { name: "Sound effects settings" }).click();
    assert.equal(
      await m.p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await m.p.getByRole("button", { name: "Sound effects settings" }).click();
  }
  await m.p.screenshot({
    path: "/tmp/oathbound-feedback-desktop.png",
    fullPage: true,
  });
  // A new patrol crossing a route landmark gets an inscription; navigation never repeats arrival.
  const j = await open({ mode: "landmark", sound: "disabled" });
  await j.nav.getByRole("button", { name: "Quests", exact: true }).click();
  await j.p.getByRole("button", { name: "Complete Patrol the Realm" }).click();
  await j.p
    .getByRole("region", { name: "Action feedback" })
    .locator(".feedback-result")
    .filter({ hasText: "Reached Old Mill" })
    .waitFor();
  await j.nav.getByRole("button", { name: "Journey", exact: true }).click();
  assert.equal(await j.p.locator(".journey-just-reached").count(), 0);
  assert.equal(await j.p.evaluate(() => window.__contexts), 0);
  // Reduced motion is immediate and still supplies every textual result; device failure is harmless.
  const r = await open({
    mode: "multi",
    sound: "enabled",
    reduced: true,
    unsupported: true,
  });
  await r.nav.getByRole("button", { name: "Quests", exact: true }).click();
  await r.p.getByRole("button", { name: "Complete Training Yard" }).click();
  assert.equal(
    (await r.p.locator(".top-renown").innerText()).replace(/\s+/g, " "),
    "1020 Renown",
  );
  assert.equal(
    await r.p
      .getByRole("region", { name: "Action feedback" })
      .locator(".feedback-result")
      .count(),
    5,
  );
  assert.equal(
    await r.p
      .getByRole("region", { name: "Action feedback" })
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  // Oaths are solemn; broken/corrected records carry no punitive or achievement audio.
  const o = await open({ sound: "enabled" });
  await o.nav.getByRole("button", { name: "Quests", exact: true }).click();
  await o.p.getByRole("button", { name: "Swear today’s Oath" }).click();
  await o.p
    .getByRole("button", { name: "I remained steadfast", exact: true })
    .click();
  await o.p
    .getByRole("region", { name: "Action feedback" })
    .getByRole("heading", { name: "OATH KEPT" })
    .waitFor();
  await o.p
    .getByRole("region", { name: "Action feedback" })
    .locator(".feedback-result")
    .filter({ hasText: "1 day steadfast" })
    .waitFor();
  await o.p.clock.runFor(1700);
  await o.p
    .getByRole("button", { name: "Correct this record", exact: true })
    .click();
  await o.p
    .getByRole("button", { name: "The oath was broken", exact: true })
    .click();
  await o.p.evaluate(() => (window.__audio = []));
  await o.p
    .getByRole("button", { name: "Confirm correction", exact: true })
    .click();
  await o.p
    .getByRole("region", { name: "Action feedback" })
    .getByText("−40 Renown · −25 Resolve XP", { exact: true })
    .waitFor();
  assert.equal(await o.p.evaluate(() => window.__audio.length), 0);
  const broken = await open({ sound: "enabled" });
  await broken.nav.getByRole("button", { name: "Quests", exact: true }).click();
  await broken.p.getByRole("button", { name: "Swear today’s Oath" }).click();
  await broken.p.evaluate(() => (window.__audio = []));
  await broken.p
    .getByRole("button", { name: "The oath was broken", exact: true })
    .click();
  assert.equal(
    await broken.p.getByRole("region", { name: "Action feedback" }).count(),
    0,
  );
  assert.equal(await broken.p.evaluate(() => window.__audio.length), 0);
  assert.equal((await broken.read()).oaths["2026-10-09"].status, "broken");
  // Weight operations are independent and quiet: only one quill texture, no gameplay event.
  const w = await open({ sound: "enabled" });
  await w.nav.getByRole("button", { name: "Chronicle", exact: true }).click();
  await w.p.evaluate(() => (window.__audio = []));
  const original = await w.read();
  const ledger = w.p.getByRole("region", {
    name: "Weight Chronicle",
    exact: true,
  });
  await ledger.getByLabel("Weight (kg)", { exact: true }).fill("87.45");
  await ledger
    .getByRole("button", { name: "Record weight", exact: true })
    .click();
  assert.equal(
    await w.p.getByRole("region", { name: "Action feedback" }).count(),
    0,
  );
  assert.deepEqual(await w.p.evaluate(() => window.__audio), ["texture"]);
  const measured = await w.read();
  delete original.weight;
  delete measured.weight;
  assert.deepEqual(measured, original);
  // Storage failure cannot produce a reward receipt or sound offer.
  const f = await open();
  await f.nav.getByRole("button", { name: "Quests", exact: true }).click();
  await f.p.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw Error("quota");
    };
  });
  await f.p.getByRole("button", { name: "Complete Training Yard" }).click();
  await f.p
    .getByRole("alert")
    .getByText(/could not be saved/)
    .waitFor();
  assert.equal(
    await f.p.getByRole("region", { name: "Action feedback" }).count(),
    0,
  );
  assert.equal(
    await f.p.getByRole("region", { name: "Optional sound effects" }).count(),
    0,
  );
  assert.equal((await f.read()).entries.length, 0);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: exact single-action batches; simultaneous rank/commission/level receipts; landmark arrival; no reload/navigation replay; once-only tri-state offer/decline; explicit preview/mute; count-up sequencing; reduced motion; unsupported devices; quiet independent weight; failed-save isolation; 320/390/1440px layouts; no runtime errors.",
  );
  await browser.close();
})().catch(async (e) => {
  console.error(e);
  if (globalThis.reviewPage)
    await globalThis.reviewPage.screenshot({
      path: "/tmp/oathbound-feedback-error.png",
      fullPage: true,
    });
  process.exit(1);
});
