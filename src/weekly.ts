import { campaignRules } from "./config";
import { campaignGoals, goalActive } from "./campaign";
import { dayKey, weekStart, addDays, validDay } from "./calendar";
import type {
  BehaviourGoalId,
  State,
  WeeklyCommission,
  WeeklyTarget,
} from "./model";
// Only strength is exposed today; commissions and activity links are goal-independent.
const weeklyGoals: BehaviourGoalId[] = ["strength"];
export function weeklyTarget(
  state: State,
  goalId: BehaviourGoalId,
  start: string,
): WeeklyTarget {
  const revision = state.campaign.revisions.findLast(
    (r) => r.weeklyEffectiveFrom <= start,
  );
  return structuredClone(
    revision?.goals.find((g) => g.id === goalId)?.weeklyTarget || {
      metric: "sessions",
      value: campaignRules.trainingSessions.defaultValue,
    },
  );
}
export function currentCommission(
  state: State,
  date = dayKey(),
  goalId: BehaviourGoalId = "strength",
) {
  return state.weekly.commissions.find(
    (c) =>
      c.goalId === goalId && c.period.start <= date && c.period.end >= date,
  );
}
export function ensureWeeklyPeriod(state: State, date = dayKey()): State {
  if (
    !validDay(date) ||
    date < state.created ||
    date < state.weekly.trackingSince
  )
    return state;
  let next = state;
  for (const goalId of weeklyGoals) {
    if (currentCommission(next, date, goalId)) continue;
    const start = weekStart(date, state.weekly.weekStartsOn),
      end = addDays(start, 6);
    const existing = state.entries.filter(
      (e) =>
        e.goalId === goalId &&
        e.date >= start &&
        e.date <= end &&
        e.date >= state.weekly.trackingSince,
    );
    if (!goalActive(state, goalId, date) && !existing.length) continue;
    const commission: WeeklyCommission = {
      id: `week:${start}:${goalId}`,
      goalId,
      period: {
        kind: "week",
        start,
        end,
        weekStartsOn: state.weekly.weekStartsOn,
      },
      target: weeklyTarget(state, goalId, start),
      activityIds: existing.map((e) => e.activityId),
    };
    next = {
      ...next,
      weekly: {
        ...next.weekly,
        commissions: [...next.weekly.commissions, commission],
      },
    };
  }
  return next;
}
export function recordWeeklyActivity(state: State, activityId: string): State {
  const entry = state.entries.find((e) => e.activityId === activityId);
  if (
    !entry ||
    !entry.goalId ||
    !weeklyGoals.includes(entry.goalId) ||
    entry.date < state.weekly.trackingSince
  )
    return state;
  const next = ensureWeeklyPeriod(state, entry.date);
  const commission = currentCommission(next, entry.date, entry.goalId);
  if (
    !commission ||
    commission.activityIds.includes(activityId) ||
    commission.activityIds.some(
      (id) =>
        next.entries.find((e) => e.activityId === id)?.date === entry.date,
    )
  )
    return next;
  return {
    ...next,
    weekly: {
      ...next.weekly,
      commissions: next.weekly.commissions.map((c) =>
        c.id === commission.id
          ? { ...c, activityIds: [...c.activityIds, activityId] }
          : c,
      ),
    },
  };
}
export function trainingStatus(state: State, date = dayKey()) {
  const commission = currentCommission(state, date);
  if (!commission) return null;
  const count = commission.activityIds.length,
    target = commission.target.value;
  const requested = campaignGoals(state.campaign, date).find(
    (g) => g.id === "strength",
  )?.weeklyTarget;
  return {
    commission,
    count,
    target,
    remaining: Math.max(0, target - count),
    active: goalActive(state, "strength", date),
    pendingTarget:
      requested && requested.value !== target ? requested.value : null,
  };
}
