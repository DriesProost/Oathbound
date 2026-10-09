import { describe, expect, it } from "vitest";
import { weekStart, nextWeekStart } from "./calendar";
import { campaignRules } from "./config";
import {
  defaultGoals,
  configureCampaign,
  campaignGoals,
  validGoals,
} from "./campaign";
import { createKnight, completeQuest, totals } from "./domain";
import {
  currentCommission,
  ensureWeeklyPeriod,
  recordWeeklyActivity,
  trainingStatus,
} from "./weekly";
import { load, save, storageKeys, validate } from "./storage";
import type { State } from "./model";
const evening = (date: string) => new Date(date + "T19:00:00");
const goals = (target = 3, active = true) =>
  defaultGoals(false).map((g) =>
    g.id === "strength"
      ? {
          ...g,
          active,
          weeklyTarget: { metric: "sessions" as const, value: target },
        }
      : g,
  );
function train(s: State, date: string) {
  return completeQuest(s, "training", date, evening(date));
}
function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
function old2A() {
  const s: any = structuredClone(
    train(
      train(createKnight("Ada", "2026-09-28", goals()), "2026-09-28"),
      "2026-10-05",
    ),
  );
  delete s.weekly;
  s.entries.forEach((e: any) => {
    delete e.rewardGrant;
  });
  s.campaign.revisions.forEach((r: any) => {
    delete r.weeklyEffectiveFrom;
    r.goals.forEach((g: any) => {
      delete g.weeklyTarget;
    });
  });
  return s;
}
describe("local calendar weeks", () => {
  it("uses Monday through Sunday with a strict next-Monday boundary", () => {
    expect(weekStart("2026-10-05")).toBe("2026-10-05");
    expect(weekStart("2026-10-11")).toBe("2026-10-05");
    expect(weekStart("2026-10-12")).toBe("2026-10-12");
    expect(nextWeekStart("2026-10-05")).toBe("2026-10-12");
    expect(nextWeekStart("2026-10-11")).toBe("2026-10-12");
  });
  it("handles month, year, leap-day and daylight-saving calendar boundaries", () => {
    expect(weekStart("2027-01-01")).toBe("2026-12-28");
    expect(weekStart("2027-01-03")).toBe("2026-12-28");
    expect(nextWeekStart("2026-12-31")).toBe("2027-01-04");
    expect(weekStart("2026-11-01")).toBe("2026-10-26");
    expect(weekStart("2024-02-29")).toBe("2024-02-26");
    expect(nextWeekStart("2026-03-29")).toBe("2026-03-30");
    expect(nextWeekStart("2026-10-25")).toBe("2026-10-26");
    expect(() => weekStart("2026-02-30")).toThrow();
  });
  it("keeps the week rule central and existing period snapshots stable", () => {
    let s = createKnight("Ada", "2026-10-05", goals());
    const snapshot = s.weekly.commissions[0];
    const previous = campaignRules.weekStartsOn;
    try {
      campaignRules.weekStartsOn = 0;
      expect(weekStart("2026-10-09")).toBe("2026-10-04");
      s = ensureWeeklyPeriod(s, "2026-10-09");
      expect(currentCommission(s, "2026-10-09")).toBe(snapshot);
      expect(snapshot.period.weekStartsOn).toBe(1);
      s = ensureWeeklyPeriod(s, "2026-10-12");
      expect(currentCommission(s, "2026-10-12")?.period.start).toBe(
        "2026-10-12",
      );
      expect(currentCommission(s, "2026-10-12")?.period.weekStartsOn).toBe(1);
      const newCampaign = createKnight("New knight", "2026-10-09", goals());
      expect(newCampaign.weekly.weekStartsOn).toBe(0);
      expect(newCampaign.weekly.commissions[0].period.start).toBe("2026-10-04");
      expect(validate(s)).toBe(s);
    } finally {
      campaignRules.weekStartsOn = previous;
    }
  });
});
describe("weekly training commissions", () => {
  it("validates 1–7 integer sessions and exposes only the strength setting", () => {
    expect(validGoals(goals(1))).toBe(true);
    expect(validGoals(goals(7))).toBe(true);
    for (const value of [0, 8, 1.5, NaN])
      expect(validGoals(goals(value))).toBe(false);
    const gs = goals();
    gs.find((g) => g.id === "walking")!.weeklyTarget = {
      metric: "sessions",
      value: 3,
    };
    expect(validGoals(gs)).toBe(false);
  });
  it("advances the commission once per training day with only the daily award", () => {
    let s = createKnight("Ada", "2026-10-05", goals());
    s = train(s, "2026-10-05");
    s = train(s, "2026-10-07");
    expect(trainingStatus(s, "2026-10-09")).toMatchObject({
      count: 2,
      target: 3,
      remaining: 1,
    });
    expect(totals(s).renown).toBe(70);
    expect(totals(s).xp.Strength).toBe(40);
    expect(train(s, "2026-10-07")).toBe(s);
    expect(recordWeeklyActivity(s, s.entries[0].activityId)).toBe(s);
    s = train(s, "2026-10-09");
    expect(trainingStatus(s, "2026-10-09")?.remaining).toBe(0);
    expect(totals(s).renown).toBe(105);
    expect(totals(s).xp.Strength).toBe(60);
    expect(s.weekly.commissions[0]).not.toHaveProperty("reward");
    expect(s.entries[0].rewardGrant).toMatchObject({
      activityId: s.entries[0].activityId,
      period: { kind: "day", start: "2026-10-05" },
    });
    s = train(s, "2026-10-11");
    expect(trainingStatus(s, "2026-10-11")?.count).toBe(4);
    expect(totals(s).renown).toBe(140);
    expect(validate(s)).toBe(s);
  });
  it("keeps activity progress independent of whether a daily award was granted", () => {
    let s = train(createKnight("Ada", "2026-10-05", goals()), "2026-10-05");
    s = {
      ...s,
      entries: s.entries.map((e) => ({
        ...e,
        rewardGrant: null,
        reward: { renown: 0, xp: {} },
      })),
    };
    expect(trainingStatus(s, "2026-10-05")?.count).toBe(1);
    expect(totals(s).renown).toBe(0);
    expect(validate(s)).toBe(s);
  });
  it("schedules target edits next Monday and never rewrites an active or completed commission", () => {
    let s = train(createKnight("Ada", "2026-10-05", goals()), "2026-10-05");
    const snapshot = s.weekly.commissions[0],
      entry = s.entries[0];
    s = configureCampaign(s, goals(5), "2026-10-09");
    expect(trainingStatus(s, "2026-10-09")).toMatchObject({
      count: 1,
      target: 3,
      pendingTarget: 5,
    });
    expect(s.campaign.revisions.at(-1)!.weeklyEffectiveFrom).toBe("2026-10-12");
    s = train(s, "2026-10-11");
    expect(trainingStatus(s, "2026-10-11")?.target).toBe(3);
    const past = s.weekly.commissions[0];
    s = ensureWeeklyPeriod(s, "2026-10-12");
    expect(trainingStatus(s, "2026-10-12")).toMatchObject({
      count: 0,
      target: 5,
      pendingTarget: null,
    });
    s = configureCampaign(s, goals(2), "2026-10-12");
    expect(trainingStatus(s, "2026-10-12")?.target).toBe(5);
    expect(s.campaign.revisions.at(-1)!.weeklyEffectiveFrom).toBe("2026-10-19");
    expect(s.weekly.commissions[0]).toBe(past);
    expect(s.entries[0]).toBe(entry);
    expect(snapshot.target.value).toBe(3);
    expect(validate(s)).toBe(s);
  });
  it("freezes the target even if no commission was opened before a midweek edit", () => {
    let s = createKnight("Ada", "2026-10-01", goals());
    s = configureCampaign(s, goals(6), "2026-10-09");
    s = ensureWeeklyPeriod(s, "2026-10-09");
    expect(trainingStatus(s, "2026-10-09")?.target).toBe(3);
    s = ensureWeeklyPeriod(s, "2026-10-12");
    expect(trainingStatus(s, "2026-10-12")?.target).toBe(6);
  });
  it("preserves paused periods, opens no new disabled weeks, and re-enables prospectively", () => {
    let s = train(createKnight("Ada", "2026-10-05", goals()), "2026-10-05");
    const original = s.weekly.commissions[0],
      earned = totals(s);
    s = configureCampaign(s, goals(5, false), "2026-10-09");
    expect(trainingStatus(s, "2026-10-09")?.active).toBe(false);
    expect(train(s, "2026-10-10")).toBe(s);
    s = ensureWeeklyPeriod(s, "2026-10-12");
    expect(currentCommission(s, "2026-10-12")).toBeUndefined();
    expect(s.weekly.commissions[0]).toBe(original);
    expect(totals(s)).toEqual(earned);
    s = configureCampaign(s, goals(5, true), "2026-10-20");
    s = ensureWeeklyPeriod(s, "2026-10-20");
    expect(trainingStatus(s, "2026-10-20")).toMatchObject({
      target: 5,
      count: 0,
    });
    expect(currentCommission(s, "2026-10-12")).toBeUndefined();
    expect(train(s, "2026-10-19")).toBe(s);
    s = train(s, "2026-10-20");
    expect(trainingStatus(s, "2026-10-20")?.count).toBe(1);
    expect(s.weekly.commissions[0]).toBe(original);
    expect(validate(s)).toBe(s);
  });
});
describe("Stage 2A save upgrade and weekly persistence", () => {
  it("backs up exact 2A data, preserves every reward and counts only real current-week training", () => {
    const store = memory(),
      old = old2A(),
      raw = JSON.stringify(old);
    store.setItem(storageKeys.current, raw);
    const s = load(store, "2026-10-09")!;
    expect(store.getItem(storageKeys.weeklyBackup)).toBe(raw);
    expect(s.oaths).toEqual(old.oaths);
    expect(totals(s).renown).toBe(70);
    old.entries.forEach((e: any, i: number) =>
      expect(s.entries[i]).toMatchObject(e),
    );
    expect(s.weekly.commissions).toHaveLength(1);
    expect(trainingStatus(s, "2026-10-09")).toMatchObject({
      target: 3,
      count: 1,
    });
    expect(currentCommission(s, "2026-09-28")).toBeUndefined();
    expect(load(store, "2026-10-09")).toEqual(s);
    expect(s.weight).toEqual(old.weight);
    expect(
      campaignGoals(s.campaign, "2026-10-09")
        .filter((g) => g.active)
        .map((g) => g.id),
    ).toEqual(["strength"]);
    save(s, store);
    expect(load(store, "2026-10-09")).toEqual(s);
    expect(store.getItem(storageKeys.weeklyBackup)).toBe(raw);
  });
  it("preserves source data if backup creation fails and rejects corrupt newer data", () => {
    const store = memory(),
      raw = JSON.stringify(old2A());
    store.setItem(storageKeys.current, raw);
    expect(() =>
      load(
        {
          getItem: store.getItem,
          setItem: () => {
            throw Error("quota");
          },
        },
        "2026-10-09",
      ),
    ).toThrow("quota");
    expect(store.getItem(storageKeys.current)).toBe(raw);
    const bad = old2A();
    bad.weekly = { trackingSince: "2026-10-05", commissions: "broken" };
    store.setItem(storageKeys.current, JSON.stringify(bad));
    expect(() => load(store, "2026-10-09")).toThrow();
    expect(store.getItem(storageKeys.weeklyBackup)).toBeNull();
  });
  it("rejects duplicated or unmatched weekly activity links and reward receipts", () => {
    const s = train(createKnight("Ada", "2026-10-05", goals()), "2026-10-05");
    let bad = structuredClone(s);
    bad.weekly.commissions[0].activityIds.push(bad.entries[0].activityId);
    expect(() => validate(bad)).toThrow();
    bad = structuredClone(s);
    bad.weekly.commissions[0].activityIds = [];
    expect(() => validate(bad)).toThrow();
    bad = structuredClone(s);
    bad.entries[0].rewardGrant!.activityId = "another-activity";
    expect(() => validate(bad)).toThrow();
    bad = structuredClone(s);
    bad.entries[0].rewardGrant = null;
    expect(() => validate(bad)).toThrow();
  });
  it("creates the next week on reload, preserving the preceding partial result without a reward", () => {
    const store = memory();
    const s = train(createKnight("Ada", "2026-10-05", goals()), "2026-10-05");
    save(s, store);
    const next = load(store, "2026-10-12")!;
    expect(next.weekly.commissions[0]).toEqual(s.weekly.commissions[0]);
    expect(trainingStatus(next, "2026-10-12")).toMatchObject({
      count: 0,
      target: 3,
    });
    expect(totals(next)).toEqual(totals(s));
    expect(load(store, "2026-10-12")).toEqual(next);
  });
});
