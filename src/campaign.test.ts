import { describe, expect, it } from "vitest";
import {
  defaultGoals,
  validGoals,
  configureCampaign,
  configuredQuests,
  availableQuests,
  goalActive,
} from "./campaign";
import {
  createKnight,
  completeQuest,
  confirmOath,
  takeOath,
  totals,
  oathStats,
  progression,
  quests,
} from "./domain";
import type { CampaignGoal, GoalId } from "./model";
const evening = new Date("2026-10-09T19:00:00");
const goals = (...ids: GoalId[]): CampaignGoal[] =>
  defaultGoals(false).map((g) => ({ ...g, active: ids.includes(g.id) }));
describe("personal campaign configuration", () => {
  it("requires the complete typed goal set and validates goal-specific target metrics", () => {
    const gs = goals("walking");
    expect(validGoals(gs)).toBe(true);
    expect(validGoals(gs.slice(1))).toBe(false);
    expect(validGoals([...gs.slice(1), gs[1]])).toBe(false);
    for (const target of [
      { metric: "km", value: 0 },
      { metric: "km", value: Infinity },
      { metric: "steps", value: 12.5 },
      { metric: "check", criterion: " " },
      { metric: "minutes", value: 20 },
    ]) {
      expect(
        validGoals(gs.map((g) => (g.id === "walking" ? { ...g, target } : g))),
      ).toBe(false);
    }
  });
  it("posts only selected behaviour deeds; outcomes never grant progress", () => {
    let s = createKnight("Ada", "2026-10-09", goals("walking", "weight"));
    expect(configuredQuests(s, "2026-10-09").map((q) => q.id)).toEqual([
      "patrol",
    ]);
    expect(completeQuest(s, "training", "2026-10-09", evening)).toBe(s);
    expect(takeOath(s, "2026-10-09", evening)).toBe(s);
    expect(confirmOath(s, "2026-10-09", "kept", evening)).toBe(s);
    const before = totals(s),
      stats = oathStats(s);
    s = {
      ...s,
      weight: {
        settings: {
          displayUnit: "kg",
          baseline: { date: "2026-10-09", grams: 80000 },
          targetGrams: 70000,
        },
        measurements: [
          {
            id: "weight-1",
            date: "2026-10-09",
            grams: 70000,
            createdAt: evening.toISOString(),
            updatedAt: evening.toISOString(),
          },
        ],
      },
    };
    expect(totals(s)).toEqual(before);
    expect(oathStats(s)).toEqual(stats);
    expect(progression.rewardBudget.enabled).toBe(false);
  });
  it("does not enforce the deferred global reward budget", () => {
    const template = quests.find((q) => q.id === "training")!;
    const original = template.reward;
    try {
      template.reward = { renown: 200, xp: { Strength: 20 } };
      const s = completeQuest(
        createKnight("Ada", "2026-10-09", goals("strength")),
        "training",
        "2026-10-09",
        evening,
      );
      expect(progression.rewardBudget.enabled).toBe(false);
      expect(totals(s).renown).toBe(200);
    } finally {
      template.reward = original;
    }
  });
  it("snapshots the actual target, keeps rewards fixed and uses goal-level daily slots", () => {
    const gs = goals("walking");
    gs.find((g) => g.id === "walking")!.target = { metric: "km", value: 5 };
    let s = completeQuest(
      createKnight("Ada", "2026-10-08", gs),
      "patrol",
      "2026-10-09",
      evening,
    );
    const entry = structuredClone(s.entries[0]);
    expect(entry.distance).toBe(5);
    expect(entry.deed.target).toEqual({ metric: "km", value: 5 });
    gs.find((g) => g.id === "walking")!.target = {
      metric: "steps",
      value: 8000,
    };
    s = configureCampaign(s, gs, "2026-10-09");
    expect(s.entries[0]).toEqual(entry);
    expect(completeQuest(s, "patrol", "2026-10-09", evening)).toBe(s);
    expect(configuredQuests(s, "2026-10-09")[0].description).toContain(
      "8,000 steps",
    );
    const next = completeQuest(
      s,
      "patrol",
      "2026-10-10",
      new Date("2026-10-10T19:00:00"),
    );
    expect(next.entries[1].distance).toBe(0);
    expect(next.entries[1].reward).toEqual(entry.reward);
    const alias = {
      ...quests.find((q) => q.id === "patrol")!,
      id: "future-walking-template",
    };
    quests.push(alias);
    try {
      expect(completeQuest(s, alias.id, "2026-10-09", evening)).toBe(s);
    } finally {
      quests.pop();
    }
  });
  it("preserves historical criteria and rewards when a goal is paused or changed", () => {
    let s = completeQuest(
      createKnight("Ada", "2026-10-08", goals("strength")),
      "training",
      "2026-10-08",
      evening,
    );
    const entries = s.entries,
      earned = totals(s);
    s = configureCampaign(s, goals(), "2026-10-09");
    expect(s.entries).toBe(entries);
    expect(totals(s)).toEqual(earned);
    expect(configuredQuests(s, "2026-10-09")).toEqual([]);
    expect(goalActive(s, "strength", "2026-10-08")).toBe(true);
    expect(completeQuest(s, "training", "2026-10-09", evening)).toBe(s);
    expect(() =>
      configureCampaign(s, goals("walking"), "2026-10-07"),
    ).toThrow();
    expect(configureCampaign(s, goals(), "2026-10-09")).toBe(s);
  });
  it("confirms sleep against the prior night configuration, even after pausing it", () => {
    const gs = goals("recovery");
    gs.find((g) => g.id === "recovery")!.target = { metric: "hours", value: 7 };
    let s = createKnight("Ada", "2026-10-08", gs);
    s = configureCampaign(s, goals(), "2026-10-09");
    expect(availableQuests(s, evening)[0].description).toContain("7 hours");
    s = completeQuest(s, "rest", "2026-10-08", evening);
    expect(s.entries[0].deed.target).toEqual({ metric: "hours", value: 7 });
    expect(completeQuest(s, "rest", "2026-10-09", evening)).toBe(s);
    const fresh = createKnight("Ada", "2026-10-09", goals("recovery"));
    expect(completeQuest(fresh, "rest", "2026-10-08", evening)).toBe(fresh);
  });
  it("retains correction rights for recorded oaths after the goal is disabled", () => {
    let s = createKnight("Ada", "2026-10-08", goals("temperance", "strength"));
    s = completeQuest(s, "training", "2026-10-09", evening);
    s = confirmOath(s, "2026-10-09", "kept", evening);
    const training = s.entries[0];
    s = configureCampaign(s, goals(), "2026-10-09");
    expect(takeOath(s, "2026-10-10", new Date("2026-10-10T19:00:00"))).toBe(s);
    s = confirmOath(s, "2026-10-09", "broken", evening);
    expect(totals(s).renown).toBe(35);
    expect(s.entries[0]).toBe(training);
    s = confirmOath(s, "2026-10-09", "kept", evening);
    expect(totals(s).renown).toBe(75);
    expect(confirmOath(s, "2026-10-09", "kept", evening)).toBe(s);
  });
});
