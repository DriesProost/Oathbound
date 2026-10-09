import { describe, it, expect } from "vitest";
import { load, save, migrate, storageKeys } from "./storage";
import { createKnight, totals, confirmOath } from "./domain";
function memory() {
  const values = new Map<string, string>();
  return {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
  };
}
const legacy = () => ({
  version: 1,
  name: "Ada",
  created: "2026-10-01",
  entries: [
    {
      date: "2026-10-01",
      questId: "training",
      renown: 35,
      attribute: "Strength",
      points: 20,
      distance: 0,
    },
    {
      date: "2026-10-01",
      questId: "oath",
      renown: 40,
      attribute: "Resolve",
      points: 25,
      distance: 0,
    },
    {
      date: "2026-10-02",
      questId: "oath",
      renown: 40,
      attribute: "Resolve",
      points: 25,
      distance: 0,
    },
  ],
  oaths: { "2026-10-01": true, "2026-10-02": false },
});
describe("local save migration", () => {
  it("backs up exact legacy data, retains legitimate rewards and removes only incorrect oath rewards", () => {
    const store = memory(),
      original = JSON.stringify(legacy());
    store.setItem(storageKeys.legacy, original);
    const s = load(store)!;
    expect(store.getItem(storageKeys.backup)).toBe(original);
    expect(store.getItem(storageKeys.legacy)).toBe(original);
    expect(s.name).toBe("Ada");
    expect(s.created).toBe("2026-10-01");
    expect(totals(s).renown).toBe(75);
    expect(totals(s).xp).toMatchObject({ Strength: 20, Resolve: 25 });
    expect(load(store)).toEqual(s); // migration is idempotent
    const corrected = confirmOath(
      s,
      "2026-10-02",
      "kept",
      new Date("2026-10-09T19:00:00"),
    );
    save(corrected, store);
    expect(totals(load(store)!).renown).toBe(115);
  });
  it("preserves legacy reward amounts rather than using new configuration", () => {
    const old = legacy();
    old.entries[0].renown = 77;
    old.entries[0].points = 65;
    expect(totals(migrate(old)).renown).toBe(117);
    expect(totals(migrate(old)).xp.Strength).toBe(65);
  });
  it("leaves malformed saves untouched and never falls back over a corrupt current save", () => {
    const store = memory();
    store.setItem(storageKeys.legacy, JSON.stringify(legacy()));
    store.setItem(storageKeys.current, "{bad");
    expect(() => load(store)).toThrow();
    expect(store.getItem(storageKeys.current)).toBe("{bad");
    expect(store.getItem(storageKeys.backup)).toBeNull();
    const invalid = legacy();
    invalid.entries[0].points = -1;
    expect(() => migrate(invalid)).toThrow();
  });
  it("does not write migrated state if preserving the backup fails", () => {
    const store = memory();
    store.setItem(storageKeys.legacy, JSON.stringify(legacy()));
    expect(() =>
      load({
        getItem: store.getItem,
        setItem: () => {
          throw Error("Storage full");
        },
      }),
    ).toThrow("Storage full");
    expect(store.getItem(storageKeys.current)).toBeNull();
  });
  it("round trips a new save and returns null for an empty browser", () => {
    const store = memory();
    expect(load(store)).toBeNull();
    const s = createKnight("Ada");
    save(s, store);
    expect(load(store)).toEqual(s);
  });
});

describe("migration preservation", () => {
  it("retains historical walking distance and preserves an existing backup", () => {
    const original = legacy();
    original.entries.push({
      date: "2026-10-03",
      questId: "patrol",
      renown: 30,
      attribute: "Endurance",
      points: 15,
      distance: 3,
    });
    const store = memory();
    store.setItem(storageKeys.legacy, JSON.stringify(original));
    store.setItem(storageKeys.backup, "previous backup");
    expect(totals(load(store)!).distance).toBe(3);
    expect(store.getItem(storageKeys.backup)).toBe("previous backup");
  });
  it("rejects ambiguous duplicate rewards without writing over source data", () => {
    const original = legacy();
    original.entries.push(original.entries[0]);
    const store = memory();
    const raw = JSON.stringify(original);
    store.setItem(storageKeys.legacy, raw);
    expect(() => load(store)).toThrow();
    expect(store.getItem(storageKeys.legacy)).toBe(raw);
    expect(store.getItem(storageKeys.current)).toBeNull();
    expect(store.getItem(storageKeys.backup)).toBeNull();
  });
});
