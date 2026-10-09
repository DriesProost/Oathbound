import { attributes, totals, rankProgress, oathStats } from "../domain";
import type { State } from "../model";
import type { Reward, Attribute } from "../config";
import { landmarks } from "../journey";
export type FeedbackIntent = "quiet" | "deed" | "oath" | "correction";
export type FeedbackEvent =
  | { kind: "rank"; from: string; to: string }
  | { kind: "landmark"; name: string; inscription: string }
  | { kind: "commission"; id: string; count: number; target: number }
  | { kind: "level"; attribute: Attribute; from: number; to: number }
  | { kind: "oath"; date: string; streak: number }
  | { kind: "deed"; name: string; id: string }
  | { kind: "reward"; reward: Reward }
  | { kind: "correction"; reward: Reward };
// Equal tiers have a fixed order: landmarks by route, commissions by ID, attributes by configuration.
export const priority: Record<FeedbackEvent["kind"], number> = {
  rank: 0,
  landmark: 1,
  commission: 2,
  level: 3,
  oath: 4,
  deed: 5,
  reward: 6,
  correction: 7,
};
// Text is available immediately. These offsets sequence emphasis and the count-up in one surface.
export function presentationTimeline(events: FeedbackEvent[]) {
  const lead = events[0]?.kind;
  const firstFollowUp =
    lead === "rank"
      ? 1100
      : lead === "landmark" || lead === "commission"
        ? 500
        : lead === "level"
          ? 400
          : lead === "oath"
            ? 350
            : lead === "deed"
              ? 200
              : 0;
  return events.map((event, index) => ({
    event,
    at: index === 0 ? 0 : firstFollowUp + (index - 1) * 100,
  }));
}
export type FeedbackBatch = {
  id: number;
  events: FeedbackEvent[];
  before: ReturnType<typeof totals>;
  after: ReturnType<typeof totals>;
};
export function detectFeedback(
  before: State,
  after: State,
  intent: FeedbackIntent,
): FeedbackEvent[] {
  if (before === after || intent === "quiet") return [];
  const old = totals(before),
    next = totals(after);
  const reward: Reward = {
    renown: next.renown - old.renown,
    xp: Object.fromEntries(
      attributes
        .filter((a) => next.xp[a] !== old.xp[a])
        .map((a) => [a, next.xp[a] - old.xp[a]]),
    ),
  };
  if (intent === "correction")
    return reward.renown || Object.keys(reward.xp).length
      ? [{ kind: "correction", reward }]
      : [];
  const events: FeedbackEvent[] = [];
  if (intent === "deed") {
    const added = after.entries.filter(
      (e) => e.rewardGrant && !before.entries.some((b) => b.id === e.id),
    );
    events.push(
      ...added.map((e) => ({
        kind: "deed" as const,
        name: e.deed.name,
        id: e.id,
      })),
    );
  }
  if (intent === "oath") {
    for (const date of Object.keys(after.oaths).sort()) {
      const previous = before.oaths[date]?.status;
      if (
        after.oaths[date].status === "kept" &&
        previous !== "kept" &&
        previous !== "broken"
      )
        events.push({
          kind: "oath",
          date,
          streak: oathStats(after, date).current,
        });
    }
  }
  // A newly recorded reward-bearing action is required, not merely a changed derived total.
  if (!events.length) return [];
  if (reward.renown > 0 || Object.values(reward.xp).some((v) => v! > 0))
    events.push({ kind: "reward", reward });
  for (const attribute of attributes) {
    if (next.stats[attribute].level > old.stats[attribute].level)
      events.push({
        kind: "level",
        attribute,
        from: old.stats[attribute].level,
        to: next.stats[attribute].level,
      });
  }
  for (const c of [...after.weekly.commissions].sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    const previous = before.weekly.commissions.find((b) => b.id === c.id);
    if (
      previous &&
      previous.activityIds.length < previous.target.value &&
      c.activityIds.length >= c.target.value &&
      c.activityIds.some((id) => !previous.activityIds.includes(id))
    )
      events.push({
        kind: "commission",
        id: c.id,
        count: c.activityIds.length,
        target: c.target.value,
      });
  }
  for (const stop of landmarks)
    if (old.distance < stop.km && next.distance >= stop.km)
      events.push({
        kind: "landmark",
        name: stop.name,
        inscription: stop.inscription,
      });
  const oldRank = rankProgress(old.renown).rank,
    newRank = rankProgress(next.renown).rank;
  if (newRank.threshold > oldRank.threshold)
    events.push({ kind: "rank", from: oldRank.name, to: newRank.name });
  return events.sort((a, b) => priority[a.kind] - priority[b.kind]);
}
