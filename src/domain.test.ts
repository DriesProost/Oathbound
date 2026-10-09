import { describe, it, expect } from "vitest";
import {
  createKnight,
  completeQuest,
  confirmOath,
  takeOath,
  totals,
  oathStats,
  rankProgress,
  attributeProgress,
  canConfirm,
  questDate,
  quests,
  progression,
} from "./domain";
const evening = (day = "2026-10-09") => new Date(day + "T19:00:00");
describe("campaign progression", () => {
  it("awards actions once per day and keeps XP separate from levels", () => {
    let s = createKnight("Ada", "2026-10-01");
    for (let i = 1; i <= 5; i++)
      s = completeQuest(s, "training", `2026-10-0${i}`, evening());
    expect(totals(s).stats.Strength).toMatchObject({
      level: 2,
      xp: 0,
      required: 125,
      lifetimeXP: 100,
    });
    expect(completeQuest(s, "training", "2026-10-05", evening())).toBe(s);
    expect(totals(s).renown).toBe(175);
    expect(attributeProgress(225)).toMatchObject({
      level: 3,
      xp: 0,
      required: 150,
    });
  });
  it("uses prestigious rank thresholds and handles maximum rank", () => {
    expect(rankProgress(999).rank.name).toBe("Squire");
    expect(rankProgress(1000).rank.name).toBe("Man-at-Arms");
    expect(rankProgress(3000).rank.name).toBe("Knight Errant");
    expect(rankProgress(7500).rank.name).toBe("Knight");
    expect(rankProgress(15000).next).toBeUndefined();
  });
  it("takes an oath without rewards and confirms only in the evening", () => {
    const s = takeOath(
      createKnight("Ada", "2026-10-09"),
      "2026-10-09",
      evening(),
    );
    expect(totals(s).renown).toBe(0);
    expect(oathStats(s, "2026-10-09").logged).toBe(0);
    expect(
      confirmOath(s, "2026-10-09", "kept", new Date("2026-10-09T17:59:59")),
    ).toBe(s);
    expect(
      totals(
        confirmOath(s, "2026-10-09", "kept", new Date("2026-10-09T18:00:00")),
      ).renown,
    ).toBe(40);
  });
  it("reverses precisely one incorrect oath and re-awards exactly once", () => {
    let s = createKnight("Ada", "2026-10-01");
    s = completeQuest(s, "training", "2026-10-01", evening());
    s = confirmOath(s, "2026-10-01", "kept", evening());
    s = confirmOath(s, "2026-10-02", "kept", evening());
    // Historical snapshot differs from today's configuration: reverse what was actually awarded.
    s.oaths["2026-10-02"].reward = { renown: 60, xp: { Resolve: 45 } };
    const earlier = s.oaths["2026-10-01"];
    s = confirmOath(s, "2026-10-02", "broken", evening());
    expect(totals(s).renown).toBe(75);
    expect(totals(s).xp).toMatchObject({ Strength: 20, Resolve: 25 });
    expect(s.oaths["2026-10-01"]).toBe(earlier);
    expect(confirmOath(s, "2026-10-02", "broken", evening())).toBe(s);
    s = confirmOath(s, "2026-10-02", "kept", evening());
    expect(totals(s).renown).toBe(115);
    expect(totals(s).xp.Resolve).toBe(50);
    expect(confirmOath(s, "2026-10-02", "kept", evening())).toBe(s);
  });
  it("preserves legitimate historical streaks after a later broken oath", () => {
    let s = createKnight("Ada", "2026-10-01");
    for (const date of ["2026-10-01", "2026-10-02", "2026-10-03"])
      s = confirmOath(s, date, "kept", evening());
    s = confirmOath(s, "2026-10-04", "broken", evening());
    expect(oathStats(s, "2026-10-04")).toEqual({
      current: 0,
      longest: 3,
      sober: 3,
      logged: 4,
      percentage: 75,
    });
  });
  it("excludes taken and unlogged days and stops streaks at gaps", () => {
    let s = createKnight("Ada", "2026-10-01");
    s = confirmOath(s, "2026-10-01", "kept", evening());
    s = confirmOath(s, "2026-10-03", "kept", evening());
    s = takeOath(s, "2026-10-04", evening());
    expect(oathStats(s, "2026-10-04")).toEqual({
      current: 1,
      longest: 1,
      sober: 2,
      logged: 2,
      percentage: 100,
    });
    expect(oathStats(s, "2026-10-05").current).toBe(0);
  });
  it("enforces action timing in domain rules, not just buttons", () => {
    const now = new Date("2026-10-09T09:00:00"),
      s = createKnight("Ada", "2026-10-01");
    expect(completeQuest(s, "provisions", "2026-10-09", now)).toBe(s);
    expect(completeQuest(s, "rest", "2026-10-09", now)).toBe(s);
    expect(completeQuest(s, "training", "2026-10-10", now)).toBe(s);
    expect(completeQuest(s, "rest", "2026-10-08", now).entries).toHaveLength(1);
    expect(questDate(quests.find((q) => q.id === "rest")!, now)).toBe(
      "2026-10-08",
    );
    expect(canConfirm("2026-10-08", "end-of-day", now)).toBe(true);
    expect(canConfirm("2026-02-30", "immediate", now)).toBe(false);
    expect(progression.eveningConfirmationHour).toBe(18);
  });
  it("snapshots rewards so future tuning does not change past earnings", () => {
    const s = completeQuest(
      createKnight("Ada", "2026-10-01"),
      "training",
      "2026-10-01",
      evening(),
    );
    expect(s.entries[0].reward).not.toBe(quests[0].reward);
    expect(completeQuest(s, "unknown", "2026-10-01", evening())).toBe(s);
  });
});

describe("configuration boundaries", () => {
  it("supports multiple attribute XP rewards for an action", () => {
    const original = quests[0].reward;
    try {
      quests[0].reward = { renown: 35, xp: { Strength: 20, Endurance: 5 } };
      const s = completeQuest(
        createKnight("Ada", "2026-10-01"),
        "training",
        "2026-10-01",
        evening(),
      );
      expect(totals(s).xp).toMatchObject({ Strength: 20, Endurance: 5 });
      expect(s.entries[0].reward).not.toBe(quests[0].reward);
    } finally {
      quests[0].reward = original;
    }
  });
  it("uses the configurable evening hour for all end-of-day actions", () => {
    const original = progression.eveningConfirmationHour;
    try {
      progression.eveningConfirmationHour = 19;
      const now = new Date("2026-10-09T18:30:00"),
        s = createKnight("Ada", "2026-10-01");
      expect(canConfirm("2026-10-09", "end-of-day", now)).toBe(false);
      expect(confirmOath(s, "2026-10-09", "kept", now)).toBe(s);
      expect(completeQuest(s, "provisions", "2026-10-09", now)).toBe(s);
    } finally {
      progression.eveningConfirmationHour = original;
    }
  });
});
