import { afterEach, describe, expect, it, vi } from "vitest";
import { startMobileViewport } from "./mobile";
afterEach(() => vi.unstubAllGlobals());
describe("virtual-keyboard ergonomics", () => {
  it("does nothing when visual viewport support is absent", () => {
    vi.stubGlobal("window", {});
    expect(() => startMobileViewport()).not.toThrow();
  });
  it("brings an obscured field into the visible viewport without altering its value", () => {
    const events: Record<string, () => void> = {};
    const scrollBy = vi.fn();
    const field = {
      value: "87.45",
      getBoundingClientRect: () => ({ top: 650, bottom: 700 }),
    };
    class Input {}
    Object.setPrototypeOf(field, Input.prototype);
    vi.stubGlobal("HTMLInputElement", Input);
    vi.stubGlobal("HTMLTextAreaElement", class {});
    vi.stubGlobal("HTMLSelectElement", class {});
    vi.stubGlobal("window", {
      innerHeight: 844,
      visualViewport: {
        height: 300,
        offsetTop: 0,
        addEventListener: (name: string, fn: () => void) => (events[name] = fn),
      },
      scrollBy,
    });
    const doc = {
      activeElement: field as unknown,
      documentElement: { dataset: {} as Record<string, string> },
      addEventListener: (name: string, fn: () => void) => (events[name] = fn),
    };
    vi.stubGlobal("document", doc);
    vi.stubGlobal("requestAnimationFrame", (fn: () => void) => {
      fn();
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    startMobileViewport();
    events.resize();
    expect(doc.documentElement.dataset.keyboard).toBe("open");
    expect(scrollBy).toHaveBeenCalledWith({ top: 424, behavior: "instant" });
    expect(field.value).toBe("87.45");
    doc.activeElement = null;
    events.focusout();
    expect(doc.documentElement.dataset.keyboard).toBe("closed");
  });
});
