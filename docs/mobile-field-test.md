# Mobile field-test readiness

This pass improves presentation and installation only. Progression, campaign save v3, localStorage keys, rewards, Oaths, weekly commissions and outcome semantics are unchanged. Stage 2D remains deferred.

## Phone ergonomics

Switching between the five areas starts at the top of the new page. Tapping the current navigation item returns to its heading too. This is immediate, including with reduced motion; logging a deed does not reset scrolling. Journey postcard illustrations load as they approach the viewport, retaining their fixed dimensions to avoid shifting the ledger. The existing offline shell still includes all illustrations.

The five-area bottom navigation remains on portrait phones and now also replaces the sidebar on short landscape phone screens. Interactive targets are at least 44 px; common deed/Oath actions are 48 px. Text/decimal/date fields use 16 px type to avoid iOS input zoom, with decimal keyboards for kg/km/hours and numeric keyboards for integer targets. Safe-area expressions protect navigation, content and feedback controls. Short viewports render ceremonies inline, and best-effort visual-viewport handling scrolls obscured focused fields without modifying values. Chart/map labels are larger on phones.

## Install and offline use

Build with `npm ci` and `npm run build`, then publish `dist` to a static **HTTPS** host. Serve `sw.js`, `index.html` and `manifest.webmanifest` with revalidation/no-cache headers; hashed files under `assets` can be immutable. Opening files directly or an ordinary insecure LAN URL will not provide service-worker offline startup. Development (`npm run dev`) deliberately registers no worker, so Vite changes cannot be trapped in a production cache.

From Keep, choose **Add to home screen**. Chromium can show its native installation prompt when available. On iPhone, open in Safari and choose Share → Add to Home Screen; Android browsers also offer Install app / Add to home screen in their menu. Launch the icon and check your Chronicle before logging there. Some platforms, especially iOS, may keep installed-app storage separate from the browser; no automatic transfer is claimed. For a new field-test campaign, start it in the installed app.

Visit online once until Keep reports that the shell is ready offline. Subsequent offline startup reads only the complete precached build: HTML, hashed JS/CSS, manifest and owned icons. External fonts may fall back to the existing serif/system fonts offline. No campaign data is cached, copied or changed by the service worker. Browser storage must remain available; clearing site data/uninstall behavior is controlled by the browser.

## Updates

Each build fingerprints the compiled shell and public icon/manifest bytes. Installation must cache the complete shell successfully; a failed partial cache is removed. New workers wait and the app shows **Update & reload**. Finish an unsaved form first, then choose it. There is no automatic refresh during logging. Other open tabs receive a reload offer after activation, and the preceding shell is retained for their old hashed chunks. Only Oathbound shell caches are cleaned; unrelated caches and localStorage are untouched. Online opening/focusing checks for an update, throttled to once a minute. No page action depends on worker installation succeeding.

## Owned icon artwork

`public/icons/shield.svg` uses the shield and cross paths/colors from the project's `src/KnightArt.tsx`. The 192/512 PNG, maskable PNG and 180 px Apple icon are canvas renders of that owned vector; there are no third-party image assets. The maskable foreground fits within the central safe zone.

## Verified checks and remaining device review

Automated checks cover 320, 360, 390, 430, 768 and 1440 px, plus short landscape phones, all five screens, accessible/touch controls, weight-entry keyboards/type size, enlarged feedback text, campaign controls, Chromium manifest/installability diagnostics in a normal profile, offline cold reload, exact save/history preservation, shell-only caches and explicit version update followed by offline reopening. Unit tests cover partial-cache failure/cleanup, isolation from campaign requests, explicit activation and keyboard scrolling/value preservation. Existing feedback and campaign/weekly/kg tests remain required.

Run the optional browser test against a running Vite development server after building:

```sh
PLAYWRIGHT_MODULE=/opt/codex/runtimes/cua/lib/node_modules/playwright CHROMIUM_PATH=/usr/bin/chromium node scripts/mobile-pwa-smoke.cjs
```

It serves the production build on an isolated local test port and uses a separate browser profile for installability diagnostics. It does not claim to install an iOS/Android app or transfer storage across platforms.

For the 3–7 day test on a real phone, check notch/home-indicator spacing in standalone mode, native decimal/date keyboards, enlarged system text, one-handed logging, sound/mute, retained history after closing/reopening, airplane-mode startup, and the update button after a fresh deployment. None of these activities grants extra rewards.
