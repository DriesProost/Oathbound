import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaults,
  readPreferences,
  writePreferences,
  FeedbackAudio,
  haptic,
  preferenceKey,
} from "./audio";
function memory() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}
afterEach(() => vi.unstubAllGlobals());
describe("optional feedback devices", () => {
  it("starts unset, preserving declined/enabled choices and the once-only offer marker", () => {
    const store = memory();
    vi.stubGlobal("localStorage", store);
    expect(readPreferences()).toEqual(defaults);
    for (const sound of ["unset", "enabled", "disabled"] as const) {
      const preferences = { sound, volume: 0.2, haptics: true, offered: true };
      expect(writePreferences(preferences)).toBe(true);
      expect(readPreferences()).toEqual(preferences);
    }
  });
  it("handles corrupt or unavailable preference storage without touching campaign data", () => {
    const store = memory();
    vi.stubGlobal("localStorage", store);
    store.setItem("oathbound.knight.v3", "original campaign");
    store.setItem(preferenceKey, '{"sound":"enabled","volume":8}');
    expect(readPreferences()).toMatchObject({
      sound: "enabled",
      volume: 1,
      haptics: false,
    });
    store.setItem(preferenceKey, "invalid");
    expect(readPreferences()).toEqual(defaults);
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error();
      },
      setItem: () => {
        throw Error();
      },
    });
    expect(readPreferences()).toEqual(defaults);
    expect(writePreferences({ ...defaults, sound: "disabled" })).toBe(false);
    expect(store.getItem("oathbound.knight.v3")).toBe("original campaign");
  });
  it("never creates audio or plays before a gesture; disabled audio stays silent", async () => {
    const make = vi.fn();
    vi.stubGlobal("AudioContext", make);
    const audio = new FeedbackAudio();
    audio.play("seal", { ...defaults, sound: "enabled" });
    audio.play("seal", { ...defaults, sound: "disabled" });
    expect(make).not.toHaveBeenCalled();
    expect(await audio.unlock()).toBe(false);
  });
  it("unsupported or denied audio and vibration are harmless", async () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("navigator", {});
    const audio = new FeedbackAudio();
    expect(await audio.unlock()).toBe(false);
    expect(() =>
      audio.play("rankUp", { ...defaults, sound: "enabled" }),
    ).not.toThrow();
    expect(() => haptic(true, true)).not.toThrow();
    vi.stubGlobal("navigator", {
      vibrate: () => {
        throw Error("unsupported");
      },
    });
    expect(() => haptic(true)).not.toThrow();
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "suspended";
        resume() {
          return Promise.reject(Error("blocked"));
        }
      },
    );
    expect(await new FeedbackAudio().unlock()).toBe(false);
  });
  it("haptics are independently opt-in and brief", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    haptic(false);
    expect(vibrate).not.toHaveBeenCalled();
    haptic(true);
    expect(vibrate).toHaveBeenLastCalledWith(12);
    haptic(true, true);
    expect(vibrate).toHaveBeenLastCalledWith([20, 30, 20]);
  });
  it("uses two Renown accents, cancels scheduled sources, and ignores device errors", async () => {
    const starts = vi.fn(),
      stops = vi.fn(),
      make = vi.fn();
    const source = () => ({
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: starts,
      stop: stops,
      onended: null,
    });
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        currentTime = 0;
        createOscillator() {
          make();
          return source();
        }
        createGain() {
          return {
            connect: vi.fn(),
            disconnect: vi.fn(),
            gain: {
              setValueAtTime: vi.fn(),
              linearRampToValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
          };
        }
      },
    );
    const audio = new FeedbackAudio();
    expect(await audio.unlock()).toBe(true);
    audio.play("renown", { ...defaults, sound: "disabled" });
    expect(make).not.toHaveBeenCalled();
    audio.play("renown", { ...defaults, sound: "enabled" });
    expect(make).toHaveBeenCalledTimes(2);
    const token = audio.token;
    audio.stop();
    expect(audio.token).toBe(token + 1);
    expect(stops).toHaveBeenCalledTimes(4);
    expect(() =>
      audio.play("paper", { ...defaults, sound: "enabled" }),
    ).not.toThrow();
  });
});
