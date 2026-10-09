import { describe, expect, it, vi } from "vitest";
import { runInNewContext } from "node:vm";
import { shellWorker } from "../build/pwa";
function runtime(fail = false) {
  const handlers: Record<string, (event: any) => void> = {};
  const stores = new Map<string, Map<string, string>>();
  const fetch = vi.fn(async () => new Response("network"));
  const skipWaiting = vi.fn(),
    claim = vi.fn();
  const caches = {
    open: async (name: string) => {
      const data = stores.get(name) || new Map<string, string>();
      stores.set(name, data);
      return {
        addAll: async (urls: string[]) => {
          for (const url of urls) data.set(url, "cached shell");
          if (fail) throw Error("partial install");
        },
        match: async (request: string | { url: string }) => {
          const value = data.get(
            typeof request === "string" ? request : request.url,
          );
          return value ? new Response(value) : undefined;
        },
      };
    },
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (request: { url: string }) => {
      for (const cache of stores.values()) {
        if (cache.has(request.url)) return new Response(cache.get(request.url));
      }
    },
  };
  runInNewContext(
    shellWorker(["index.html", "assets/app.js", "manifest.webmanifest"], "new"),
    {
      self: {
        registration: { scope: "https://example.test/app/" },
        location: { origin: "https://example.test" },
        addEventListener: (name: string, fn: any) => (handlers[name] = fn),
        skipWaiting,
        clients: { claim },
      },
      URL,
      Response,
      AbortController,
      caches,
      fetch,
      setTimeout,
      clearTimeout,
    },
  );
  async function lifecycle(name: string) {
    let task: Promise<unknown> | undefined;
    handlers[name]({ waitUntil: (p: Promise<unknown>) => (task = p) });
    await task;
  }
  async function request(url: string, mode = "cors", method = "GET") {
    let response: Promise<Response> | undefined;
    handlers.fetch({
      request: { url, mode, method },
      respondWith: (p: Promise<Response>) => (response = p),
    });
    return response ? (await response).text() : null;
  }
  return { stores, handlers, fetch, skipWaiting, claim, lifecycle, request };
}
describe("application-shell service worker", () => {
  it("atomically precaches only listed app assets and supports offline navigation", async () => {
    const r = runtime();
    await r.lifecycle("install");
    expect([...r.stores.get("oathbound-shell-new")!.keys()]).toEqual([
      "https://example.test/app/index.html",
      "https://example.test/app/assets/app.js",
      "https://example.test/app/manifest.webmanifest",
    ]);
    r.fetch.mockRejectedValue(Error("offline"));
    expect(await r.request("https://example.test/app/", "navigate")).toBe(
      "cached shell",
    );
    expect(await r.request("https://example.test/app/assets/app.js")).toBe(
      "cached shell",
    );
    expect(r.skipWaiting).not.toHaveBeenCalled();
  });
  it("does not handle campaign/API writes, foreign requests, or non-shell resources", async () => {
    const r = runtime();
    await r.lifecycle("install");
    expect(
      await r.request("https://example.test/campaign", "cors", "POST"),
    ).toBeNull();
    expect(await r.request("https://example.test/campaign")).toBeNull();
    expect(await r.request("https://other.test/assets/app.js")).toBeNull();
    expect(r.fetch).not.toHaveBeenCalled();
  });
  it("retains the preceding shell and other caches; activation requires explicit update", async () => {
    const r = runtime();
    r.stores.set("unrelated-data", new Map());
    r.stores.set("oathbound-shell-oldest", new Map());
    r.stores.set("oathbound-shell-previous", new Map());
    await r.lifecycle("install");
    await r.lifecycle("activate");
    expect([...r.stores.keys()]).toEqual([
      "unrelated-data",
      "oathbound-shell-previous",
      "oathbound-shell-new",
    ]);
    expect(r.claim).toHaveBeenCalledOnce();
    expect(r.skipWaiting).not.toHaveBeenCalled();
    r.handlers.message({ data: { type: "unknown" } });
    expect(r.skipWaiting).not.toHaveBeenCalled();
    r.handlers.message({ data: { type: "APPLY_UPDATE" } });
    expect(r.skipWaiting).toHaveBeenCalledOnce();
  });
  it("removes a failed partial precache without deleting the working shell", async () => {
    const r = runtime(true);
    r.stores.set("oathbound-shell-previous", new Map());
    await expect(r.lifecycle("install")).rejects.toThrow("partial install");
    expect(r.stores.has("oathbound-shell-new")).toBe(false);
    expect(r.stores.has("oathbound-shell-previous")).toBe(true);
  });
});
