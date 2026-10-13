import type { VentureDefinition } from "./ventures";
import type { Reward, Quest } from "./config";
export const portraitIds = ['classic', 'personal', 'tied-hair'] as const;
export type PortraitId = (typeof portraitIds)[number];
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
  | { metric: "oath"; schedule?: "daily" | "weekdays" }
  | { metric: "outcome" };
export type WeeklyTarget = { metric: "sessions"; value: number };
export type CampaignGoal = {
  id: GoalId;
  active: boolean;
  target: GoalTarget;
  weeklyTarget?: WeeklyTarget;
};
export type CampaignRevision = {
  id: string;
  effectiveDate: string;
  weeklyEffectiveFrom: string;
  goals: CampaignGoal[];
};
export type Campaign = { revisions: CampaignRevision[] };
export type DayPeriod = { kind: "day"; start: string };
// Activity identity and daily rewards are distinct; weekly bonuses have separate receipts.
export type RewardGrant = {
  id: string;
  activityId: string;
  goalId: BehaviourGoalId | null;
  period: DayPeriod;
};
export type WeeklyCommission = {
  id: string;
  goalId: BehaviourGoalId;
  period: { kind: "week"; start: string; end: string; weekStartsOn: number };
  target: WeeklyTarget;
  activityIds: string[];
  bonus?: {id:string;activityId:string;reward:Reward};
};
export type WeeklyCampaign = {
  weekStartsOn: number;
  trackingSince: string;
  commissions: WeeklyCommission[];
};
export type Entry = {
  id: string;
  activityId: string;
  date: string;
  questId: string;
  goalId: BehaviourGoalId | null;
  period: { kind: "day"; start: string };
  rewardGrant: RewardGrant | null;
  reward: Reward; // Daily receipt only; weekly milestone bonuses are stored on their commission.
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
// Outcome storage is separate from reward-bearing activity records. Measurements and settings never produce progression rewards.
export const bodyBuilds = ["large", "sturdy", "lean"] as const;
export type BodyBuild = (typeof bodyBuilds)[number];
export type WeightAppearance = { enabled: boolean; startingBuild: BodyBuild; targetBuild: BodyBuild };
export type WeightSettings = {
  displayUnit: "kg" | "lb";
  baseline: { date: string; grams: number } | null;
  targetGrams: number | null;
  appearance?: WeightAppearance;
  acknowledgedGoal?: string;
};
export type WeighIn = {
  id: string;
  date: string;
  grams: number;
  createdAt: string;
  updatedAt: string;
};
export type State = {
  version: 4;
  ventures: VentureAssignment[];
  name: string;
  // Cosmetic selection only; absent on existing saves means the original set.
  portrait?: PortraitId;
  created: string;
  campaign: Campaign;
  weekly: WeeklyCampaign;
  entries: Entry[];
  // Non-completion notes are not activities or reward receipts. Absent means unlogged.
  deedNotes?: { date: string; questId: string; name: string; status: "not-completed" | "not-planned" }[];
  oaths: Record<string, OathRecord>;
  weight: { settings: WeightSettings; measurements: WeighIn[] };
  migratedFrom?: 1 | 2;
};

// Full authored content and reward snapshots keep old receipts readable after library edits.
export type VentureAssignment = VentureDefinition & {
  assignmentId: string;
  date: string;
  reward: Reward;
  rewardGrant: RewardGrant | null;
  status: "assigned" | "set-aside" | "completed";
  replaced: boolean;
  replacementOf?: string;
  completedAt?: string;
};
