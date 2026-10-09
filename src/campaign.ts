import { quests, campaignRules, type Quest } from "./config";
import {
  dayKey,
  validDay,
  previousDay,
  weekStart,
  nextWeekStart,
  addDays,
} from "./calendar";
import {
  goalIds,
  type CampaignGoal,
  type GoalId,
  type GoalTarget,
  type BehaviourTarget,
  type Campaign,
  type State,
} from "./model";
export type {
  CampaignGoal,
  GoalId,
  GoalTarget,
  BehaviourTarget,
} from "./model";
export const targetRules = {
  km: { min: 0.1, max: 100, step: 0.1, defaultValue: 3 },
  steps: { min: 100, max: 100000, step: 1, defaultValue: 6000 },
  minutes: { min: 1, max: 720, step: 1, defaultValue: 20 },
  pages: { min: 1, max: 1000, step: 1, defaultValue: 10 },
  hours: { min: 1, max: 24, step: 0.5, defaultValue: 8 },
};
export const goalDefinitions: Record<
  GoalId,
  { name: string; description: string; defaultTarget: GoalTarget }
> = {
  weight: {
    name: "Weight management",
    description: "An outcome record, separate from earned progress",
    defaultTarget: { metric: "outcome" },
  },
  temperance: {
    name: "Alcohol / temperance",
    description: "Remain alcohol-free or choose an alcohol-free weekday plan",
    defaultTarget: { metric: "oath" },
  },
  strength: {
    name: "Strength training",
    description: "Train in the yard, on the days that serve you",
    defaultTarget: { metric: "check", criterion: "Complete a workout" },
  },
  walking: {
    name: "Walking / cardio",
    description: "Build endurance, one real-world patrol at a time",
    defaultTarget: { metric: "km", value: targetRules.km.defaultValue },
  },
  nutrition: {
    name: "Nutrition",
    description: "Care for your provisions with a personal criterion",
    defaultTarget: {
      metric: "check",
      criterion: "Meet your personal nutrition target",
    },
  },
  care: {
    name: "Personal care",
    description: "Grooming, skincare and thoughtful presentation",
    defaultTarget: {
      metric: "check",
      criterion: "Take time for grooming or skincare",
    },
  },
  study: {
    name: "Reading / study",
    description: "Set aside time to sharpen your mind",
    defaultTarget: {
      metric: "minutes",
      value: targetRules.minutes.defaultValue,
    },
  },
  recovery: {
    name: "Sleep / recovery",
    description: "Confirm the previous night, without a daily quota",
    defaultTarget: {
      metric: "check",
      criterion: "Meet your personal sleep goal",
    },
  },
};
const allowedMetrics: Record<GoalId, GoalTarget["metric"][]> = {
  weight: ["outcome"],
  temperance: ["oath"],
  strength: ["check"],
  walking: ["km", "steps"],
  nutrition: ["check"],
  care: ["check"],
  study: ["minutes", "pages"],
  recovery: ["check", "hours"],
};
export function defaultGoals(active = true): CampaignGoal[] {
  return goalIds.map((id) => ({
    id,
    active: active && id !== "weight",
    target: structuredClone(goalDefinitions[id].defaultTarget),
    ...(id === "strength"
      ? {
          weeklyTarget: {
            metric: "sessions" as const,
            value: campaignRules.trainingSessions.defaultValue,
          },
        }
      : {}),
  }));
}
export function validTarget(target: unknown): target is GoalTarget {
  if (!target || typeof target !== "object" || !("metric" in target))
    return false;
  if (target.metric === "outcome") return Object.keys(target).length === 1;
  if (target.metric === "oath") return (
    Object.keys(target).every((key) => key === "metric" || key === "schedule") &&
    (!("schedule" in target) || target.schedule === "daily" || target.schedule === "weekdays")
  );
  if (target.metric === "check")
    return (
      "criterion" in target &&
      typeof target.criterion === "string" &&
      target.criterion.trim().length >= 3 &&
      target.criterion.length <= 160
    );
  if (
    typeof target.metric !== "string" ||
    !(target.metric in targetRules) ||
    !("value" in target) ||
    typeof target.value !== "number" ||
    !Number.isFinite(target.value)
  )
    return false;
  const rule = targetRules[target.metric as keyof typeof targetRules];
  return (
    target.value >= rule.min &&
    target.value <= rule.max &&
    (!["steps", "minutes", "pages"].includes(target.metric) ||
      Number.isInteger(target.value))
  );
}
export function validWeeklyTarget(
  target: unknown,
): target is import("./model").WeeklyTarget {
  return (
    !!target &&
    typeof target === "object" &&
    "metric" in target &&
    target.metric === "sessions" &&
    "value" in target &&
    typeof target.value === "number" &&
    Number.isInteger(target.value) &&
    target.value >= campaignRules.trainingSessions.min &&
    target.value <= campaignRules.trainingSessions.max
  );
}
export function validGoals(goals: unknown): goals is CampaignGoal[] {
  return (
    Array.isArray(goals) &&
    goals.length === goalIds.length &&
    new Set(goals.map((g) => g?.id)).size === goalIds.length &&
    goals.every(
      (g) =>
        g &&
        goalIds.includes(g.id) &&
        typeof g.active === "boolean" &&
        validTarget(g.target) &&
        allowedMetrics[g.id as GoalId].includes(g.target.metric) &&
        (g.weeklyTarget === undefined ||
          (g.id === "strength" && validWeeklyTarget(g.weeklyTarget))),
    )
  );
}
export function createCampaign(date: string, goals = defaultGoals()): Campaign {
  if (!validDay(date) || !validGoals(goals))
    throw Error("Invalid campaign configuration.");
  return {
    revisions: [
      {
        id: "campaign-1",
        effectiveDate: date,
        weeklyEffectiveFrom: weekStart(date),
        goals: structuredClone(
          goals.map((g) =>
            g.id === "strength" && !g.weeklyTarget
              ? {
                  ...g,
                  weeklyTarget: {
                    metric: "sessions",
                    value: campaignRules.trainingSessions.defaultValue,
                  },
                }
              : g,
          ),
        ),
      },
    ],
  };
}
export function campaignGoals(
  campaign: Campaign,
  date = dayKey(),
): CampaignGoal[] {
  return (
    campaign.revisions.findLast((r) => r.effectiveDate <= date)?.goals || []
  );
}
export function goalActive(state: State, id: GoalId, date = dayKey()) {
  return campaignGoals(state.campaign, date).some(
    (g) => g.id === id && g.active,
  );
}
export function configureCampaign(
  state: State,
  goals: CampaignGoal[],
  date = dayKey(),
): State {
  const last = state.campaign.revisions.at(-1)!;
  if (!validDay(date) || date < last.effectiveDate || !validGoals(goals))
    throw Error("Invalid campaign configuration.");
  const normalized = goals.map((g) => ({
    ...g,
    target:
      g.target.metric === "check"
        ? { ...g.target, criterion: g.target.criterion.trim() }
        : g.target,
    ...(g.id === "strength"
      ? {
          weeklyTarget: g.weeklyTarget ||
            last.goals.find((p) => p.id === "strength")?.weeklyTarget || {
              metric: "sessions" as const,
              value: campaignRules.trainingSessions.defaultValue,
            },
        }
      : {}),
  }));
  if (JSON.stringify(normalized) === JSON.stringify(last.goals)) return state;
  return {
    ...state,
    campaign: {
      revisions: [
        ...state.campaign.revisions,
        {
          id: `campaign-${state.campaign.revisions.length + 1}`,
          effectiveDate: date,
          weeklyEffectiveFrom: nextWeekStart(date, state.weekly.weekStartsOn),
          goals: structuredClone(normalized),
        },
      ],
    },
  };
}
export function targetDescription(target: GoalTarget): string {
  switch (target.metric) {
    case "km":
      return `Walk ${target.value} km`;
    case "steps":
      return `Reach ${target.value.toLocaleString()} steps`;
    case "minutes":
      return `Read or study for ${target.value} minutes`;
    case "pages":
      return `Read ${target.value} pages`;
    case "hours":
      return `Confirm last night’s sleep reached ${target.value} hours`;
    case "check":
      return target.criterion;
    case "oath":
      return target.schedule === "weekdays"
        ? "Keep weekdays alcohol-free · weekends optional"
        : "Swear your Oath, then confirm it this evening";
    case "outcome":
      return "Outcome tracking · no Renown or attribute XP";
  }
}
export function configuredQuests(
  state: State,
  date = dayKey(),
): (Quest & { target: BehaviourTarget })[] {
  const goals = campaignGoals(state.campaign, date);
  return quests.flatMap((template) => {
    const goal = goals.find((g) => g.id === template.goalId && g.active);
    if (
      !goal ||
      goal.target.metric === "oath" ||
      goal.target.metric === "outcome"
    )
      return [];
    return [
      {
        ...template,
        target: structuredClone(goal.target),
        description: targetDescription(goal.target),
        distance: goal.target.metric === "km" ? goal.target.value : 0,
      },
    ];
  });
}
export function availableQuests(state: State, now = new Date()): Quest[] {
  const today = dayKey(now);
  const current = configuredQuests(state, today);
  const prior = configuredQuests(state, previousDay(today)).filter(
    (q) => q.timing === "retrospective",
  );
  return [
    ...current.map((q) =>
      q.timing === "retrospective" ? prior.find((p) => p.id === q.id) || q : q,
    ),
    ...prior.filter((q) => !current.some((c) => c.id === q.id)),
  ];
}

// Missing schedule preserves the original abstinence campaign; no save rewrite is needed.
export function weekdayTemperance(state: State, date = dayKey()) {
  const goal = campaignGoals(state.campaign, date).find((g) => g.id === "temperance");
  return !!goal?.active && goal.target.metric === "oath" && goal.target.schedule === "weekdays";
}
export function optionalOathDay(state: State, date = dayKey()) {
  const weekday = new Date(date + "T12:00:00").getDay();
  return weekdayTemperance(state, date) && (weekday === 0 || weekday === 6);
}
export function weekdayOathSummary(state: State, today = dayKey()) {
  const start = weekStart(today, 1);
  const dates = Array.from({ length: 5 }, (_, i) => addDays(start, i))
    .filter((date) => date >= state.created && date <= today && weekdayTemperance(state, date));
  const kept = dates.filter((date) => state.oaths[date]?.status === "kept").length;
  const recorded = dates.filter((date) => ["kept", "broken"].includes(state.oaths[date]?.status)).length;
  return { kept, recorded, eligible: dates.length, unlogged: dates.length - recorded };
}
