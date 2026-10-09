import { ensureWeeklyPeriod, recordWeeklyActivity } from "./weekly";
import {
  campaignRules,
  attributes,
  progression,
  quests,
  oathDefinition,
  type Attribute,
  type Reward,
  type Quest,
} from "./config";
export { attributes, quests, progression, oathDefinition } from "./config";
export type { Attribute, Reward, Quest } from "./config";
import { createCampaign, configuredQuests, goalActive, optionalOathDay } from "./campaign";
import { dayKey, previousDay, validDay } from "./calendar";
import type { State, CampaignGoal } from "./model";
export { dayKey, previousDay, validDay } from "./calendar";
export type { State, Entry, OathRecord } from "./model";
export function createKnight(
  name: string,
  date = dayKey(),
  goals?: CampaignGoal[],
): State {
  return ensureWeeklyPeriod(
    {
      version: 3,
      name: name.trim() || "The Traveller",
      created: date,
      campaign: createCampaign(date, goals),
      weekly: {
        weekStartsOn: campaignRules.weekStartsOn,
        trackingSince: date,
        commissions: [],
      },
      entries: [],
      oaths: {},
      weight: {
        settings: { displayUnit: "kg", baseline: null, targetGrams: null },
        measurements: [],
      },
    },
    date,
  );
}
export function canConfirm(
  date: string,
  timing: Quest["timing"],
  now = new Date(),
) {
  if (!validDay(date) || date > dayKey(now)) return false;
  if (date < dayKey(now)) return true;
  if (timing === "retrospective") return false;
  return (
    timing === "immediate" ||
    now.getHours() >= progression.eveningConfirmationHour
  );
}
export function questDate(quest: Quest, now = new Date()) {
  return quest.timing === "retrospective"
    ? previousDay(dayKey(now))
    : dayKey(now);
}
export function completeQuest(
  state: State,
  id: string,
  date = dayKey(),
  now = new Date(),
): State {
  const quest = configuredQuests(state, date).find((q) => q.id === id);
  if (
    !quest ||
    date < state.created ||
    !canConfirm(date, quest.timing, now) ||
    state.entries.some(
      (e) => e.date === date && (e.goalId === quest.goalId || e.questId === id),
    )
  )
    return state;
  const next: State = {
    ...state,
    entries: [
      ...state.entries,
      {
        id: `deed:${date}:${quest.goalId}`,
        activityId: `activity:${date}:${quest.goalId}`,
        date,
        questId: id,
        goalId: quest.goalId,
        period: { kind: "day", start: date },
        deed: {
          name: quest.name,
          description: quest.description,
          timing: quest.timing,
          target: structuredClone(quest.target),
        },
        rewardGrant: {
          id: `award:${date}:${quest.goalId}`,
          activityId: `activity:${date}:${quest.goalId}`,
          goalId: quest.goalId,
          period: { kind: "day", start: date },
        },
        reward: structuredClone(quest.reward),
        distance: quest.distance || 0,
      },
    ],
  };
  return recordWeeklyActivity(next, `activity:${date}:${quest.goalId}`);
}
export function takeOath(
  state: State,
  date = dayKey(),
  now = new Date(),
): State {
  if (
    !validDay(date) ||
    date < state.created ||
    date > dayKey(now) ||
    state.oaths[date] ||
    !goalActive(state, "temperance", date)
  )
    return state;
  return {
    ...state,
    oaths: { ...state.oaths, [date]: { status: "taken", reward: null } },
  };
}
export function confirmOath(
  state: State,
  date: string,
  status: "kept" | "broken",
  now = new Date(),
): State {
  if (
    date < state.created ||
    !canConfirm(date, "end-of-day", now) ||
    state.oaths[date]?.status === status ||
    (!state.oaths[date] && (!goalActive(state, "temperance", date) || optionalOathDay(state, date)))
  )
    return state;
  // Replacing this one record reverses only this oath's reward. Other dates and actions remain untouched.
  return {
    ...state,
    oaths: {
      ...state.oaths,
      [date]: {
        status,
        reward:
          status === "kept" ? structuredClone(oathDefinition.reward) : null,
      },
    },
  };
}
export function attributeProgress(xp: number) {
  let level = 1,
    remaining = Math.max(0, xp),
    required = progression.attributeBaseXP;
  while (remaining >= required) {
    remaining -= required;
    level++;
    required =
      progression.attributeBaseXP +
      (level - 1) * progression.attributeIncrementXP;
  }
  return {
    level,
    xp: remaining,
    required,
    progress: remaining / required,
    lifetimeXP: xp,
  };
}
export function totals(state: State) {
  const rewards = [
    ...state.entries.filter((e) => e.rewardGrant !== null).map((e) => e.reward),
    ...Object.values(state.oaths)
      .filter((o) => o.status === "kept")
      .map((o) => o.reward!),
  ];
  const xp = Object.fromEntries(
    attributes.map((a) => [a, rewards.reduce((n, r) => n + (r.xp[a] || 0), 0)]),
  ) as Record<Attribute, number>;
  return {
    renown: rewards.reduce((n, r) => n + r.renown, 0),
    distance: state.entries.reduce((n, e) => n + e.distance, 0),
    xp,
    stats: Object.fromEntries(
      attributes.map((a) => [a, attributeProgress(xp[a])]),
    ) as Record<Attribute, ReturnType<typeof attributeProgress>>,
  };
}
export const ranks = progression.ranks;
export function rankProgress(renown: number) {
  const index = Math.max(
    0,
    ranks.findLastIndex((r) => renown >= r.threshold),
  );
  const rank = ranks[index],
    next = ranks[index + 1];
  return {
    rank,
    next,
    progress: next
      ? (renown - rank.threshold) / (next.threshold - rank.threshold)
      : 1,
  };
}
export function oathStats(state: State, today = dayKey()) {
  const dates = Object.keys(state.oaths)
    .filter((d) => d <= today && state.oaths[d].status !== "taken")
    .sort();
  let longest = 0,
    run = 0,
    last = "";
  for (const d of dates) {
    run =
      state.oaths[d].status === "kept"
        ? last === previousDay(d)
          ? run + 1
          : 1
        : 0;
    longest = Math.max(longest, run);
    last = d;
  }
  let current = 0,
    cursor =
      !state.oaths[today] || state.oaths[today].status === "taken"
        ? previousDay(today)
        : today;
  while (state.oaths[cursor]?.status === "kept") {
    current++;
    cursor = previousDay(cursor);
  }
  let start = today;
  for (let i = 1; i < 30; i++) start = previousDay(start);
  const recent = dates.filter((d) => d >= start),
    sober = dates.filter((d) => state.oaths[d].status === "kept").length;
  return {
    current,
    longest,
    sober,
    logged: recent.length,
    percentage: recent.length
      ? Math.round(
          (recent.filter((d) => state.oaths[d].status === "kept").length /
            recent.length) *
            100,
        )
      : null,
  };
}
