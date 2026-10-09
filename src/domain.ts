import {
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
export type Entry = {
  date: string;
  questId: string;
  reward: Reward;
  distance: number;
};
export type OathRecord = {
  status: "taken" | "kept" | "broken";
  reward: Reward | null;
};
export type State = {
  version: 2;
  name: string;
  created: string;
  entries: Entry[];
  oaths: Record<string, OathRecord>;
  migratedFrom?: 1;
};
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function previousDay(day: string) {
  const d = new Date(day + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}
export function createKnight(name: string, date = dayKey()): State {
  return {
    version: 2,
    name: name.trim() || "The Traveller",
    created: date,
    entries: [],
    oaths: {},
  };
}
export function validDay(day: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    dayKey(new Date(day + "T12:00:00")) === day
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
  const quest = quests.find((q) => q.id === id);
  if (
    !quest ||
    date < state.created ||
    !canConfirm(date, quest.timing, now) ||
    state.entries.some((e) => e.date === date && e.questId === id)
  )
    return state;
  return {
    ...state,
    entries: [
      ...state.entries,
      {
        date,
        questId: id,
        reward: structuredClone(quest.reward),
        distance: quest.distance || 0,
      },
    ],
  };
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
    state.oaths[date]
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
    state.oaths[date]?.status === status
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
    ...state.entries.map((e) => e.reward),
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
