import type { Reward, Quest } from "./config";
export const goalIds = [
  "weight",
  "temperance",
  "strength",
  "walking",
  "nutrition",
  "care",
  "study",
  "recovery",
] as const;
export type GoalId = (typeof goalIds)[number];
export type BehaviourGoalId = Exclude<GoalId, "weight" | "temperance">;
export type CheckTarget = { metric: "check"; criterion: string };
export type NumericTarget = {
  metric: "km" | "steps" | "minutes" | "pages" | "hours";
  value: number;
};
export type BehaviourTarget = CheckTarget | NumericTarget;
export type GoalTarget =
  | BehaviourTarget
  | { metric: "oath" }
  | { metric: "outcome" };
export type CampaignGoal = { id: GoalId; active: boolean; target: GoalTarget };
export type CampaignRevision = {
  id: string;
  effectiveDate: string;
  goals: CampaignGoal[];
};
export type Campaign = { revisions: CampaignRevision[] };
export type Entry = {
  id: string;
  activityId: string;
  date: string;
  questId: string;
  goalId: BehaviourGoalId | null;
  period: { kind: "day"; start: string };
  reward: Reward;
  distance: number;
  deed: {
    name: string;
    description: string;
    timing: Quest["timing"] | null;
    target: BehaviourTarget | null;
  };
};
export type OathRecord = {
  status: "taken" | "kept" | "broken";
  reward: Reward | null;
};
// Outcome storage is separate from reward-bearing activity records. Tracker UI comes in 2C.
export type WeightSettings = {
  displayUnit: "kg" | "lb";
  baseline: { date: string; grams: number } | null;
  targetGrams: number | null;
};
export type WeighIn = {
  id: string;
  date: string;
  grams: number;
  createdAt: string;
  updatedAt: string;
};
export type State = {
  version: 3;
  name: string;
  created: string;
  campaign: Campaign;
  entries: Entry[];
  oaths: Record<string, OathRecord>;
  weight: { settings: WeightSettings; measurements: WeighIn[] };
  migratedFrom?: 1 | 2;
};
