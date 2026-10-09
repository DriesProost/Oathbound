import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import type { Plugin } from "vite";
// Build-only, exact-URL shell precache. No runtime/API/campaign caching.
export function shellWorker(assets: string[], version: string) {
  return `const CACHE = 'oathbound-shell-${version}';
const ASSETS = ${JSON.stringify(assets)};
const URLS = ASSETS.map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(URLS)).catch(async error => {
    await caches.delete(CACHE); throw error;
  }));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = (await caches.keys()).filter(name => name.startsWith('oathbound-shell-'));
    // Retain the preceding shell for tabs still running it. Never delete other applications' caches.
    const older = names.filter(name => name !== CACHE);
    await Promise.all(older.slice(0, -1).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'APPLY_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const shell = await (await caches.open(CACHE)).match(new URL('index.html', self.registration.scope).href);
      if (shell) return shell;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch(request, {cache:'no-store', signal:controller.signal});
        if (response.ok) return response;
      } catch {} finally { clearTimeout(timer); }
      return (await (await caches.open(CACHE)).match(new URL('index.html', self.registration.scope).href)) || Response.error();
    })());
  } else if (URLS.includes(request.url)) {
    event.respondWith((async () => {
      const cached = await (await caches.open(CACHE)).match(request);
      return cached || fetch(request);
    })());
  } else if (new URL(request.url).pathname.startsWith(new URL('assets/',self.registration.scope).pathname)) {
    // Old hashed chunks are only read from retained precaches, never added dynamically.
    event.respondWith((async () => (await caches.match(request)) || fetch(request))());
  }
});`;
}
export function pwaShell(): Plugin {
  let publicDir = "";
  return {
    configResolved(config) {
      publicDir = config.publicDir || resolve(config.root, "public");
    },
    name: "oathbound-pwa-shell",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(
        (name) => name === "index.html" || name.startsWith("assets/"),
      );
      const publicFiles = [
        "manifest.webmanifest",
        "icons/shield.svg",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-512.png",
        "icons/apple-180.png",
      ];
      const fingerprint = createHash("sha256");
      for (const file of files.sort()) {
        const item = bundle[file];
        fingerprint.update(item.type === "chunk" ? item.code : item.source);
      }
      for (const file of publicFiles)
        fingerprint.update(readFileSync(resolve(publicDir, file)));
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: shellWorker(
          [...files, ...publicFiles],
          fingerprint.digest("hex").slice(0, 16),
        ),
      });
    },
  };
}
