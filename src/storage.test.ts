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

describe("v3 campaign saves", () => {
  const v2 = () => ({
    version: 2,
    name: "Ada",
    created: "2026-10-01",
    entries: [
      {
        date: "2026-10-02",
        questId: "patrol",
        reward: { renown: 77, xp: { Endurance: 31 } },
        distance: 4.7,
      },
      {
        date: "2026-10-03",
        questId: "retired-deed",
        reward: { renown: 12, xp: { Wisdom: 9 } },
        distance: 0,
      },
    ],
    oaths: {
      "2026-10-02": {
        status: "kept",
        reward: { renown: 60, xp: { Resolve: 41 } },
      },
      "2026-10-03": { status: "broken", reward: null },
      "2026-10-04": { status: "taken", reward: null },
    },
  });
  it("preserves exact v2 sources, backup and historical rewards without inventing targets", () => {
    const store = memory(),
      old = v2(),
      raw = JSON.stringify(old);
    store.setItem(storageKeys.previous, raw);
    const s = load(store)!;
    expect(s.version).toBe(3);
    expect(s.migratedFrom).toBe(2);
    expect(store.getItem(storageKeys.previous)).toBe(raw);
    expect(store.getItem(storageKeys.previousBackup)).toBe(raw);
    expect(s.oaths).toEqual(old.oaths);
    old.entries.forEach((e, i) => {
      expect(s.entries[i]).toMatchObject(e);
      expect(s.entries[i].deed.target).toBeNull();
    });
    expect(totals(s).renown).toBe(149);
    expect(totals(s).distance).toBe(4.7);
    expect(s.entries[1].goalId).toBeNull();
    expect(s.campaign.revisions[0].goals.filter((g) => g.active)).toHaveLength(
      7,
    );
    expect(s.weight.measurements).toEqual([]);
    expect(s.weight.settings.baseline).toBeNull();
    expect(load(store)).toEqual(s);
    expect(migrate(old)).toEqual(s);
  });
  it("does not overwrite existing v2 backups or fall back from invalid v2 to v1", () => {
    const store = memory();
    store.setItem(storageKeys.previous, JSON.stringify(v2()));
    store.setItem(storageKeys.previousBackup, "earlier backup");
    load(store);
    expect(store.getItem(storageKeys.previousBackup)).toBe("earlier backup");
    const bad = memory();
    bad.setItem(storageKeys.previous, "{bad");
    bad.setItem(storageKeys.legacy, JSON.stringify(legacy()));
    expect(() => load(bad)).toThrow();
    expect(bad.getItem(storageKeys.current)).toBeNull();
    expect(bad.getItem(storageKeys.backup)).toBeNull();
  });
  it("does not commit v3 when the v2 backup write fails", () => {
    const store = memory();
    const raw = JSON.stringify(v2());
    store.setItem(storageKeys.previous, raw);
    expect(() =>
      load({
        getItem: store.getItem,
        setItem: () => {
          throw Error("quota");
        },
      }),
    ).toThrow("quota");
    expect(store.getItem(storageKeys.current)).toBeNull();
    expect(store.getItem(storageKeys.previous)).toBe(raw);
  });
  it("rejects duplicate activity identities and malformed campaigns without modifying saved history", () => {
    const s = migrate(v2());
    s.entries[1].activityId = s.entries[0].activityId;
    const store = memory();
    expect(() => save(s, store)).toThrow();
    expect(store.getItem(storageKeys.current)).toBeNull();
    const invalid = migrate(v2());
    invalid.campaign.revisions[0].goals[3].target = { metric: "km", value: -1 };
    expect(() => save(invalid, store)).toThrow();
    const noWeight = migrate(v2());
    noWeight.weight.measurements.push({
      id: "x",
      date: "2026-10-04",
      grams: 0,
      createdAt: "2026-10-04T09:00:00Z",
      updatedAt: "2026-10-04T09:00:00Z",
    });
    expect(() => save(noWeight, store)).toThrow();
  });
});
