// Optional device-emulation and production-worker checks; no OS installation is simulated as a real phone install.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  let version = 1;
  const dist = path.resolve(__dirname, "../dist");
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    let name = pathname === "/" ? "index.html" : pathname.slice(1);
    if (name.includes("..")) {
      res.writeHead(400);
      res.end();
      return;
    }
    const filename = path.join(dist, name);
    if (!fs.existsSync(filename)) {
      res.writeHead(404);
      res.end();
      return;
    }
    let body = fs.readFileSync(filename);
    if (version === 2 && name === "sw.js")
      body = Buffer.from(
        body
          .toString()
          .replace(
            /oathbound-shell-([a-f0-9]+)/g,
            "oathbound-shell-$1-review2",
          ),
      );
    res.setHeader(
      "Content-Type",
      name.endsWith(".js")
        ? "text/javascript"
        : name.endsWith(".css")
          ? "text/css"
          : name.endsWith(".webmanifest")
            ? "application/manifest+json"
            : name.endsWith(".svg")
              ? "image/svg+xml"
              : name.endsWith(".png")
                ? "image/png"
                : "text/html",
    );
    res.setHeader("Cache-Control", "no-cache");
    res.end(body);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const dev = await browser.newPage();
  await dev.goto(process.env.OATHBOUND_URL || "http://127.0.0.1:5173");
  const fixture = await dev.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      c = await import("/src/campaign.ts"),
      w = await import("/src/weight.ts");
    const now = new Date("2026-10-09T19:00:00");
    let s = d.createKnight(
      "Rowan",
      "2026-10-01",
      c.defaultGoals().map((g) => ({ ...g, active: true })),
    );
    s = d.completeQuest(s, "training", "2026-10-05", now);
    s = d.completeQuest(s, "training", "2026-10-06", now);
    s.entries[0].reward = { renown: 950, xp: { Strength: 75 } };
    for (const [date, grams] of [
      ["2026-10-03", 90000],
      ["2026-10-05", 89000],
      ["2026-10-07", 87450],
    ])
      s = w.addWeighIn(s, date, grams, { now });
    return s;
  });
  await dev.close();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    timezoneId: "Europe/Brussels",
  });
  await context.addInitScript((fixture) => {
    if (!localStorage.getItem("oathbound.knight.v3"))
      localStorage.setItem("oathbound.knight.v3", JSON.stringify(fixture));
    localStorage.setItem(
      "oathbound.feedback.v1",
      JSON.stringify({
        sound: "disabled",
        volume: 0.35,
        haptics: false,
        offered: true,
      }),
    );
  }, fixture);
  const p = await context.newPage();
  globalThis.reviewPage = p;
  p.setDefaultTimeout(12000);
  p.on("pageerror", (e) => errors.push(e.message));
  await p.clock.install({ time: new Date("2026-10-09T19:00:00+02:00") });
  await p.goto(url);
  await p.waitForFunction(() => navigator.serviceWorker.controller);
  const read = () =>
    p.evaluate(() => JSON.parse(localStorage.getItem("oathbound.knight.v3")));
  const noOverflow = async () =>
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  const nav = () =>
    p.getByRole("navigation", {
      name:
        p.viewportSize().width <= 760 ||
        (p.viewportSize().height <= 500 && p.viewportSize().width <= 1000)
          ? "Main navigation"
          : "Desktop navigation",
    });
  const go = async (name) => {
    await nav()
      .getByRole("button", {
        name:
          name === "Quest Board" &&
          (p.viewportSize().width <= 760 ||
            (p.viewportSize().height <= 500 && p.viewportSize().width <= 1000))
            ? "Quests"
            : name,
        exact: true,
      })
      .click();
  };
  const target = async (locator) => {
    const box = await locator.boundingBox();
    assert.ok(
      box.height >= 44 && box.width >= 44,
      `small touch target ${JSON.stringify(box)}`,
    );
  };
  for (const [width, height] of [
    [320, 740],
    [360, 800],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1440, 900],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    for (const name of [
      "Keep",
      "Quest Board",
      "Journey",
      "Knight",
      "Chronicle",
    ]) {
      await go(name);
      await noOverflow();
    }
    if (width <= 760 || (height <= 500 && width <= 1000)) {
      for (const button of await nav().getByRole("button").all())
        await target(button);
      const box = await nav().boundingBox();
      assert.ok(box.y + box.height <= height + 1);
    }
    await go("Quest Board");
    if (width <= 1000)
      await target(p.getByRole("button", { name: "Complete Training Yard" }));
    if (width <= 1000)
      await target(
        p.getByRole("button", { name: "I remained steadfast", exact: true }),
      );
    if (width <= 1000)
      await target(p.getByRole("button", { name: "Sound effects settings" }));
    await p.getByRole("button", { name: "Sound effects settings" }).click();
    await noOverflow();
    await p.getByRole("button", { name: "Sound effects settings" }).click();
    await go("Chronicle");
    const field = p.getByLabel("Weight (kg)", { exact: true });
    assert.equal(await field.getAttribute("inputmode"), "decimal");
    assert.ok(
      parseFloat(await field.evaluate((e) => getComputedStyle(e).fontSize)) >=
        16 || width > 1000,
    );
    await field.focus();
    await field.fill("87.4");
    await noOverflow();
    await p
      .getByRole("heading", { name: "Every day is part of the story." })
      .click();
    const edit = p.getByRole("button", {
      name: "Edit weight on October 7, 2026",
      exact: true,
    });
    await edit.scrollIntoViewIfNeeded();
    if (width <= 1000) await target(edit);
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await go("Quest Board");
  await p.getByRole("button", { name: "Complete Training Yard" }).click();
  const feedback = p.getByRole("region", { name: "Action feedback" });
  await feedback.getByRole("heading", { name: "RISE, MAN-AT-ARMS" }).waitFor();
  await target(p.getByRole("button", { name: "Dismiss action feedback" }));
  await noOverflow();
  // Increased browser text size keeps all exact consequences and a reachable dismissal.
  await p.addStyleTag({
    content:
      ".feedback-result,.feedback-record h2,.mobile-nav button{font-size:22px!important}",
  });
  await noOverflow();
  assert.equal(await feedback.locator(".feedback-result").count(), 5);
  await p.getByRole("button", { name: "Dismiss action feedback" }).click();
  // A short landscape receipt is inline, leaving the remaining page usable.
  await p.setViewportSize({ width: 740, height: 360 });
  await p.getByRole("button", { name: "Complete Patrol the Realm" }).click();
  assert.equal(
    await feedback.evaluate((e) => getComputedStyle(e).position),
    "relative",
  );
  await noOverflow();
  await p.getByRole("button", { name: "Dismiss action feedback" }).click();
  await p.setViewportSize({ width: 390, height: 844 });
  await go("Knight");
  await p
    .getByRole("button", { name: "Configure campaign", exact: true })
    .click();
  await p.getByRole("button", { name: "Set my targets" }).click();
  assert.equal(
    await p.getByLabel("Training sessions per week").getAttribute("inputmode"),
    "numeric",
  );
  await noOverflow();
  await p.getByRole("button", { name: "Back", exact: true }).click();
  await p.getByRole("button", { name: "Cancel", exact: true }).click();
  // Manifest and actual Chromium installability diagnostics against the production build.
  const cdp = await context.newCDPSession(p);
  const manifest = await cdp.send("Page.getAppManifest");
  assert.deepEqual(manifest.errors, []);
  const data = JSON.parse(manifest.data);
  assert.equal(data.display, "standalone");
  assert.equal(data.short_name, "Oathbound");
  assert.equal(data.icons.length, 3);
  // Normal persistent profile: incognito intentionally cannot install apps.
  const profile = fs.mkdtempSync(
    path.join(require("node:os").tmpdir(), "oathbound-install-"),
  );
  const installedContext = await chromium.launchPersistentContext(profile, {
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: ["--no-sandbox"],
  });
  const installPage = await installedContext.newPage();
  await installPage.goto(url);
  await installPage.waitForFunction(() => navigator.serviceWorker.controller);
  const installSession = await installedContext.newCDPSession(installPage);
  const installability = await installSession.send(
    "Page.getInstallabilityErrors",
  );
  assert.deepEqual(installability.installabilityErrors, []);
  await installedContext.close();
  fs.rmSync(profile, { recursive: true, force: true });
  const saved = await read();
  const keys = await p.evaluate(() => Object.keys(localStorage));
  // Reloading an installed/standalone-style window uses the same origin store and keeps exact history.
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.reload();
  assert.deepEqual(await read(), saved);
  assert.deepEqual(await p.evaluate(() => Object.keys(localStorage)), keys);
  await context.setOffline(true);
  await p.reload();
  await p
    .getByRole("heading", { name: "Welcome to your keep, Rowan." })
    .waitFor();
  assert.deepEqual(await read(), saved);
  await go("Chronicle");
  assert.equal(await p.locator(".weight-point").count(), 3);
  await noOverflow();
  const cacheUrls = await p.evaluate(async () => {
    const names = (await caches.keys()).filter((n) =>
      n.startsWith("oathbound-shell-"),
    );
    return (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map((r) => r.url),
        ),
      )
    ).flat();
  });
  assert.ok(
    cacheUrls.every((u) =>
      /\/(assets\/|icons\/|index.html|manifest.webmanifest)/.test(u),
    ),
  );
  await context.setOffline(false);
  const otherTab = await context.newPage();
  await otherTab.goto(url);
  await otherTab.waitForFunction(() => navigator.serviceWorker.controller);
  version = 2;
  await p.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration.update();
  });
  await p.getByRole("region", { name: "App update available" }).waitFor();
  assert.deepEqual(await read(), saved);
  await p.getByRole("button", { name: "Update & reload" }).click();
  await p.waitForFunction(
    async () => !(await navigator.serviceWorker.getRegistration()).waiting,
  );
  await p
    .getByRole("heading", { name: "Welcome to your keep, Rowan." })
    .waitFor();
  assert.deepEqual(await read(), saved);
  await otherTab
    .getByRole("region", { name: "App update available" })
    .waitFor();
  assert.deepEqual(
    await otherTab.evaluate(() =>
      JSON.parse(localStorage.getItem("oathbound.knight.v3")),
    ),
    saved,
  );
  await otherTab.getByRole("button", { name: "Update & reload" }).click();
  await otherTab
    .getByRole("heading", { name: "Welcome to your keep, Rowan." })
    .waitFor();
  assert.equal(
    await otherTab
      .getByRole("region", { name: "App update available" })
      .count(),
    0,
  );
  await context.setOffline(true);
  await p.reload();
  assert.deepEqual(await read(), saved);
  assert.equal(
    await p.getByRole("region", { name: "App update available" }).count(),
    0,
  );
  await p.screenshot({ path: "/tmp/oathbound-mobile-pwa.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 320/360/390/430/768/1440 and landscape; touch targets; input keyboards/font size; enlarged feedback text; landscape continuation; campaign settings; Chromium manifest/installability; reload and exact save preservation; offline cold startup/history; shell-only cache; explicit version update and offline re-open; no runtime errors.",
  );
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
})().catch(async (e) => {
  console.error(e);
  if (globalThis.reviewPage) {
    console.log(
      (await globalThis.reviewPage.locator("body").innerText()).slice(-2500),
    );
    await globalThis.reviewPage.screenshot({
      path: "/tmp/oathbound-mobile-pwa-error.png",
      fullPage: true,
    });
  }
  process.exit(1);
});
