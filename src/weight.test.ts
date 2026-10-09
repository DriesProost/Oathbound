import { describe, it, expect } from "vitest";
import {
  kgToGrams,
  gramsToKgInput,
  addWeighIn,
  editWeighIn,
  deleteWeighIn,
  setWeightSettings,
  useWeighInAsBaseline,
  WeightDateConflict,
  weightSummary,
  orderedMeasurements,
  weightTrend,
  validWeightData,
} from "./weight";
import {
  createKnight,
  completeQuest,
  confirmOath,
  totals,
  rankProgress,
  oathStats,
} from "./domain";
import { defaultGoals, configureCampaign } from "./campaign";
import { load, save, validate, storageKeys } from "./storage";
import type { State, WeighIn } from "./model";
const now = new Date("2026-10-09T19:00:00Z");
const initial = () =>
  createKnight(
    "Ada",
    "2026-10-01",
    defaultGoals().map((g) => ({ ...g, active: true })),
  );
const add = (s: State, date: string, grams: number, id = date) =>
  addWeighIn(s, date, grams, { now, id });
const sample = (date: string, grams: number): WeighIn => ({
  id: date,
  date,
  grams,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
});
function settings(s: State, baseline: number | null, target: number | null) {
  return setWeightSettings(s, {
    displayUnit: "kg",
    baseline:
      baseline === null ? null : { date: "2026-10-01", grams: baseline },
    targetGrams: target,
  });
}
describe("canonical kg boundaries", () => {
  it("converts exact decimal inputs to safe integer grams without floating-point drift", () => {
    expect(kgToGrams("90")).toBe(90000);
    expect(kgToGrams("87.45")).toBe(87450);
    expect(kgToGrams("87,45")).toBe(87450);
    expect(kgToGrams("0.001")).toBe(1);
    expect(kgToGrams("90.009")).toBe(90009);
  });
  it("round-trips decimals at gram precision, including values beyond ordinary UI limits", () => {
    for (const grams of [1, 100, 90000, 87450, 90123, Number.MAX_SAFE_INTEGER])
      expect(kgToGrams(gramsToKgInput(grams))).toBe(grams);
    expect(gramsToKgInput(87450)).toBe("87.45");
  });
  it("rejects zero, negative, non-finite, unsafe, exponential and overprecise inputs", () => {
    for (const value of [
      "0",
      "-90",
      "Infinity",
      "NaN",
      "1e2",
      "87.4567",
      "9007199254741",
      "",
    ])
      expect(() => kgToGrams(value)).toThrow();
    expect(() => add(initial(), "2026-02-30", 90000)).toThrow();
    expect(() => add(initial(), "2026-10-10", 90000)).toThrow();
    expect(() => add(initial(), "2026-10-01", 90.5)).toThrow();
  });
});
describe("explicit baseline and target", () => {
  it("records the first measurement without creating a baseline, target, reward or streak", () => {
    const s = add(initial(), "2026-10-01", 90000, "first");
    expect(s.weight.settings).toEqual({
      displayUnit: "kg",
      baseline: null,
      targetGrams: null,
    });
    expect(weightSummary(s.weight)).toMatchObject({
      changeGrams: null,
      distanceGrams: null,
      progress: null,
    });
    expect(totals(s)).toEqual(totals(initial()));
  });
  it("sets the first measurement as baseline only through an explicit operation", () => {
    const s = add(initial(), "2026-10-01", 90000, "first"),
      next = useWeighInAsBaseline(s, "first");
    expect(next.weight.settings.baseline).toEqual({
      date: "2026-10-01",
      grams: 90000,
    });
    expect(next.weight.measurements).toBe(s.weight.measurements);
  });
  it("allows either setting to remain optional and changing baseline never rewrites history", () => {
    const s = add(initial(), "2026-10-03", 87450);
    const targetOnly = settings(s, null, 85000);
    expect(weightSummary(targetOnly.weight)).toMatchObject({
      changeGrams: null,
      distanceGrams: 2450,
      progress: null,
    });
    const baselineOnly = settings(s, 90000, null);
    expect(weightSummary(baselineOnly.weight).changeGrams).toBe(-2550);
    expect(weightSummary(baselineOnly.weight).progress).toBeNull();
    const changed = settings(baselineOnly, 88000, 85000);
    expect(changed.weight.measurements).toBe(s.weight.measurements);
    expect(weightSummary(changed.weight).changeGrams).toBe(-550);
  });
  it("calculates loss goals and factual distance from target", () => {
    const s = settings(add(initial(), "2026-10-03", 87600), 90000, 84000);
    expect(weightSummary(s.weight)).toMatchObject({
      changeGrams: -2400,
      distanceGrams: 3600,
      rawProgress: 0.4,
      progress: 0.4,
    });
  });
  it("calculates gain goals with the same direction-aware rules", () => {
    const s = settings(add(initial(), "2026-10-03", 72400), 70000, 76000);
    expect(weightSummary(s.weight)).toMatchObject({
      changeGrams: 2400,
      distanceGrams: 3600,
      rawProgress: 0.4,
      progress: 0.4,
    });
  });
  it("handles an equal baseline/target without division by zero", () => {
    const s = settings(add(initial(), "2026-10-03", 91000), 90000, 90000);
    expect(weightSummary(s.weight)).toMatchObject({
      changeGrams: 1000,
      distanceGrams: 1000,
      rawProgress: null,
      progress: null,
    });
  });
  it("retains actual changes beyond target and clamps only the display span", () => {
    const loss = settings(add(initial(), "2026-10-03", 82000), 90000, 85000);
    expect(weightSummary(loss.weight)).toMatchObject({
      distanceGrams: 3000,
      rawProgress: 1.6,
      progress: 1,
    });
    const gain = settings(add(initial(), "2026-10-03", 78000), 70000, 75000);
    expect(weightSummary(gain.weight)).toMatchObject({
      rawProgress: 1.6,
      progress: 1,
    });
    const away = settings(add(initial(), "2026-10-03", 92000), 90000, 85000);
    expect(weightSummary(away.weight)).toMatchObject({
      changeGrams: 2000,
      distanceGrams: 7000,
      progress: 0,
    });
  });
  it("does not calculate a change from a measurement before the starting date", () => {
    let s = settings(add(initial(), "2026-09-25", 92000), 90000, 85000);
    expect(weightSummary(s.weight).changeGrams).toBeNull();
    expect(weightSummary(s.weight).distanceGrams).toBe(7000);
  });
});
describe("dated measurement identity", () => {
  it("requires explicit replacement and retains the original ID and creation timestamp", () => {
    const s = add(initial(), "2026-10-01", 90000, "first");
    expect(() => add(s, "2026-10-01", 87450, "second")).toThrow(
      WeightDateConflict,
    );
    const next = addWeighIn(s, "2026-10-01", 87450, {
      now: new Date("2026-10-10T19:00:00Z"),
      replaceId: "first",
    });
    expect(next.weight.measurements).toHaveLength(1);
    expect(next.weight.measurements[0]).toMatchObject({
      id: "first",
      grams: 87450,
      createdAt: now.toISOString(),
      updatedAt: "2026-10-10T19:00:00.000Z",
    });
    expect(s.weight.measurements[0].grams).toBe(90000);
    expect(() =>
      addWeighIn(s, "2026-10-01", 87450, { now, replaceId: "not-the-entry" }),
    ).toThrow();
  });
  it("edits value and date in place, rejects occupied dates and is idempotent for unchanged input", () => {
    let s = add(initial(), "2026-10-01", 90000, "first");
    s = add(s, "2026-10-03", 89000, "second");
    const original = s.weight.measurements[0];
    const next = editWeighIn(
      s,
      "first",
      "2026-10-02",
      89500,
      new Date("2026-10-10T19:00:00Z"),
    );
    expect(next.weight.measurements[0]).toMatchObject({
      id: original.id,
      createdAt: original.createdAt,
      date: "2026-10-02",
      grams: 89500,
    });
    expect(next.weight.measurements).toHaveLength(2);
    expect(() => editWeighIn(s, "first", "2026-10-03", 80000, now)).toThrow(
      WeightDateConflict,
    );
    expect(editWeighIn(s, "first", "2026-10-01", 90000, now)).toBe(s);
  });
  it("deletes only the chosen measurement, preserving an independently chosen baseline", () => {
    const s = useWeighInAsBaseline(
        add(initial(), "2026-10-01", 90000, "first"),
        "first",
      ),
      next = deleteWeighIn(s, "first");
    expect(next.weight.measurements).toEqual([]);
    expect(next.weight.settings).toBe(s.weight.settings);
    expect(next.weight.settings.baseline?.grams).toBe(90000);
    expect(deleteWeighIn(next, "first")).toBe(next);
  });
  it("sorts actual measurements regardless of entry order without mutating the source", () => {
    let s = add(initial(), "2026-10-08", 88000);
    s = add(s, "2026-10-01", 90000);
    s = add(s, "2026-10-05", 89000);
    expect(s.weight.measurements.map((m) => m.date)).toEqual([
      "2026-10-01",
      "2026-10-05",
      "2026-10-08",
    ]);
    const shuffled = s.weight.measurements.toReversed();
    expect(orderedMeasurements(shuffled)).toEqual(s.weight.measurements);
    expect(shuffled[0].date).toBe("2026-10-08");
  });
});
describe("seven-calendar-day trend", () => {
  it("uses only actual sparse observations and needs three in the relevant window", () => {
    const rows = [
      sample("2026-10-01", 90000),
      sample("2026-10-03", 88000),
      sample("2026-10-07", 86000),
      sample("2026-10-08", 85000),
      sample("2026-10-20", 84000),
    ];
    expect(weightTrend(rows)).toEqual([
      { date: "2026-10-07", meanGrams: 88000, count: 3 },
      { date: "2026-10-08", meanGrams: 86333.33333333333, count: 3 },
    ]);
    expect(rows).toHaveLength(5);
    expect(
      weightTrend(rows).every((p) => rows.some((m) => m.date === p.date)),
    ).toBe(true);
    expect(weightTrend(rows.slice(0, 2))).toEqual([]);
  });
  it("uses inclusive trailing days across month/year and leap-day boundaries", () => {
    expect(
      weightTrend([
        sample("2026-12-28", 90000),
        sample("2026-12-30", 89000),
        sample("2027-01-03", 88000),
      ]).at(-1),
    ).toEqual({ date: "2027-01-03", meanGrams: 89000, count: 3 });
    expect(
      weightTrend([
        sample("2024-02-27", 90000),
        sample("2024-02-29", 89000),
        sample("2024-03-04", 88000),
      ]),
    ).toEqual([{ date: "2024-03-04", meanGrams: 89000, count: 3 }]);
  });
});
describe("outcome isolation and persistence", () => {
  it("never changes rewards, XP, rank, commissions, Oaths or distance through any weight operation", () => {
    let s = completeQuest(initial(), "training", "2026-10-09", now);
    s = completeQuest(s, "patrol", "2026-10-09", now);
    s = confirmOath(s, "2026-10-09", "kept", now);
    const before = s,
      earned = totals(s),
      rank = rankProgress(earned.renown),
      oath = oathStats(s, "2026-10-09");
    s = add(s, "2026-10-01", 90000, "first");
    s = useWeighInAsBaseline(s, "first");
    s = settings(s, 90000, 85000);
    s = add(s, "2026-10-03", 85000);
    s = editWeighIn(s, "first", "2026-10-02", 88000, now);
    s = deleteWeighIn(s, "first");
    expect(totals(s)).toEqual(earned);
    expect(rankProgress(totals(s).renown)).toEqual(rank);
    expect(oathStats(s, "2026-10-09")).toEqual(oath);
    for (const key of ["entries", "campaign", "weekly", "oaths"] as const)
      expect(s[key]).toBe(before[key]);
    expect(validate(s)).toBe(s);
  });
  it("preserves all settings and records when disabled and re-enabled", () => {
    let s = settings(add(initial(), "2026-10-03", 87450), 90000, 85000);
    const weight = s.weight;
    s = configureCampaign(
      s,
      s.campaign.revisions
        .at(-1)!
        .goals.map((g) => (g.id === "weight" ? { ...g, active: false } : g)),
      "2026-10-09",
    );
    expect(s.weight).toBe(weight);
    s = configureCampaign(
      s,
      s.campaign.revisions
        .at(-1)!
        .goals.map((g) => (g.id === "weight" ? { ...g, active: true } : g)),
      "2026-10-09",
    );
    expect(s.weight).toBe(weight);
  });
  it("round-trips records without schema churn or invented measurements", () => {
    const values = new Map<string, string>(),
      store = {
        getItem: (k: string) => values.get(k) ?? null,
        setItem: (k: string, v: string) => {
          values.set(k, v);
        },
      };
    const s = settings(add(initial(), "2026-10-03", 87450), 90000, 85000);
    save(s, store);
    const next = load(store, "2026-10-09")!;
    expect(next.version).toBe(3);
    expect(next.weight).toEqual(s.weight);
    expect(next.entries).toEqual(s.entries);
    expect(next.weight.measurements).toHaveLength(1);
    expect(values.get(storageKeys.current)).toBeDefined();
  });
  it("preserves pre-existing valid weight data when an older 2A save is upgraded", () => {
    const source: any = structuredClone(
      settings(add(initial(), "2026-10-03", 87450), 90000, 85000),
    );
    delete source.weekly;
    source.entries.forEach((e: any) => delete e.rewardGrant);
    source.campaign.revisions.forEach((r: any) => {
      delete r.weeklyEffectiveFrom;
      r.goals.forEach((g: any) => delete g.weeklyTarget);
    });
    const raw = JSON.stringify(source),
      values = new Map([[storageKeys.current, raw]]),
      store = {
        getItem: (k: string) => values.get(k) ?? null,
        setItem: (k: string, v: string) => {
          values.set(k, v);
        },
      };
    const migrated = load(store, "2026-10-09")!;
    expect(migrated.weight).toEqual(source.weight);
    expect(values.get(storageKeys.weeklyBackup)).toBe(raw);
    expect(migrated.weight.measurements).toHaveLength(1);
  });
  it("validates IDs, dates, grams and timestamps at persistence boundaries", () => {
    const s = add(initial(), "2026-10-01", 90000, "first");
    expect(validWeightData(s.weight)).toBe(true);
    for (const patch of [
      { grams: 0 },
      { grams: Infinity },
      { grams: 12.5 },
      { grams: Number.MAX_SAFE_INTEGER + 1 },
      { date: "2026-02-30" },
      { id: "" },
      { createdAt: "bad" },
      { updatedAt: "bad" },
    ])
      expect(
        validWeightData({
          ...s.weight,
          measurements: [{ ...s.weight.measurements[0], ...patch }],
        }),
      ).toBe(false);
    expect(
      validWeightData({
        ...s.weight,
        measurements: [s.weight.measurements[0], s.weight.measurements[0]],
      }),
    ).toBe(false);
    expect(() => add(s, "2026-10-02", 89000, "first")).toThrow();
  });
});
