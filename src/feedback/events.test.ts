import { describe, expect, it } from "vitest";
import {
  createKnight,
  completeQuest,
  confirmOath,
  takeOath,
  totals,
} from "../domain";
import { configureCampaign, defaultGoals } from "../campaign";
import { detectFeedback, presentationTimeline } from "./events";
import { eventText, leadCue } from "./Feedback";
const now = new Date("2026-10-09T19:00:00");
const create = () => createKnight("Ada", "2026-10-01");
const train = (s: ReturnType<typeof create>, date: string) =>
  completeQuest(s, "training", date, now);
describe("user-action feedback", () => {
  it("one completion yields one exact receipt and repeating it yields nothing", () => {
    const s = create(),
      next = train(s, "2026-10-09");
    expect(detectFeedback(s, next, "deed")).toEqual([
      { kind: "deed", name: "Training Yard", id: next.entries[0].id },
      { kind: "reward", reward: { renown: 35, xp: { Strength: 20 } } },
    ]);
    expect(detectFeedback(next, train(next, "2026-10-09"), "deed")).toEqual([]);
    expect(detectFeedback(next, structuredClone(next), "deed")).toEqual([]);
  });
  it("detects a level crossing from derived XP, not the button", () => {
    let s = create();
    for (const d of ["01", "02", "03", "04"]) s = train(s, `2026-10-${d}`);
    const events = detectFeedback(s, train(s, "2026-10-05"), "deed");
    expect(events[0]).toEqual({
      kind: "level",
      attribute: "Strength",
      from: 1,
      to: 2,
    });
    expect(leadCue(events)).toBe("steel");
  });
  it("detects only a newly fulfilled snapshotted commission, without a bonus", () => {
    let s = create();
    s = train(s, "2026-10-05");
    s = train(s, "2026-10-06");
    const next = train(s, "2026-10-07"),
      events = detectFeedback(s, next, "deed");
    expect(events.find((e) => e.kind === "commission")).toMatchObject({
      count: 3,
      target: 3,
    });
    expect(totals(next).renown - totals(s).renown).toBe(35);
    expect(
      detectFeedback(next, train(next, "2026-10-08"), "deed").some(
        (e) => e.kind === "commission",
      ),
    ).toBe(false);
  });
  it("keeps every consequence in deterministic priority order", () => {
    let s = create();
    s = train(s, "2026-10-05");
    s = train(s, "2026-10-06");
    // Historical receipts seed a near-threshold campaign without altering configuration.
    s.entries[0].reward = { renown: 950, xp: { Strength: 75 } };
    s.entries[0].distance = 8;
    const next = train(s, "2026-10-07");
    next.entries.at(-1)!.distance = 25;
    const events = detectFeedback(s, next, "deed");
    expect(events.map((e) => e.kind)).toEqual([
      "rank",
      "landmark",
      "landmark",
      "landmark",
      "commission",
      "level",
      "deed",
      "reward",
    ]);
    expect(events[0]).toEqual({
      kind: "rank",
      from: "Squire",
      to: "Man-at-Arms",
    });
    expect(leadCue(events)).toBe("rankUp");
    const timeline = presentationTimeline(events);
    expect(timeline.map((item) => item.at)).toEqual([
      0, 1100, 1200, 1300, 1400, 1500, 1600, 1700,
    ]);
    expect(timeline.at(-1)!.event.kind).toBe("reward");
    expect(events.map(eventText).join(" ")).toContain(
      "+35 Renown · +20 Strength XP",
    );
    expect(events.filter((e) => e.kind === "landmark")).toHaveLength(3);
  });
  it("records a solemn kept Oath and leaves broken Oaths non-punitive", () => {
    let s = confirmOath(create(), "2026-10-08", "kept", now);
    s = takeOath(s, "2026-10-09", now);
    const next = confirmOath(s, "2026-10-09", "kept", now);
    expect(detectFeedback(s, next, "oath")).toEqual([
      { kind: "oath", date: "2026-10-09", streak: 2 },
      { kind: "reward", reward: { renown: 40, xp: { Resolve: 25 } } },
    ]);
    expect(
      detectFeedback(s, confirmOath(s, "2026-10-09", "broken", now), "oath"),
    ).toEqual([]);
  });
  it("corrections show exact signed adjustments without milestone celebrations", () => {
    const s = confirmOath(create(), "2026-10-09", "kept", now),
      broken = confirmOath(s, "2026-10-09", "broken", now);
    expect(detectFeedback(s, broken, "correction")).toEqual([
      { kind: "correction", reward: { renown: -40, xp: { Resolve: -25 } } },
    ]);
    const events = detectFeedback(
      broken,
      confirmOath(broken, "2026-10-09", "kept", now),
      "correction",
    );
    expect(events).toEqual([
      { kind: "correction", reward: { renown: 40, xp: { Resolve: 25 } } },
    ]);
    expect(leadCue(events)).toBeNull();
    expect(
      detectFeedback(
        broken,
        confirmOath(broken, "2026-10-09", "kept", now),
        "oath",
      ),
    ).toEqual([]);
  });
  it("weight, settings, load and navigation cannot manufacture gameplay events", () => {
    const s = create(),
      next = structuredClone(s);
    next.weight.measurements.push({
      id: "w1",
      date: "2026-10-09",
      grams: 87450,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(detectFeedback(s, next, "deed")).toEqual([]);
    expect(detectFeedback(s, train(s, "2026-10-09"), "quiet")).toEqual([]);
    expect(
      detectFeedback(
        s,
        configureCampaign(s, defaultGoals(false), "2026-10-09"),
        "deed",
      ),
    ).toEqual([]);
  });
});
