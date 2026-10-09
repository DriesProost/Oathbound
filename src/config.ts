import type { BehaviourGoalId, BehaviourTarget } from "./model";
export const attributes = [
  "Strength",
  "Endurance",
  "Resolve",
  "Vitality",
  "Presence",
  "Wisdom",
] as const;
export type Attribute = (typeof attributes)[number];
export type Reward = { renown: number; xp: Partial<Record<Attribute, number>> };
export type Quest = {
  id: string;
  name: string;
  description: string;
  goalId: BehaviourGoalId;
  target?: BehaviourTarget;
  category: "duties" | "training";
  difficulty: "light" | "moderate" | "substantial";
  timing: "immediate" | "end-of-day" | "retrospective";
  reward: Reward;
  distance?: number;
};
export const progression = {
  attributeBaseXP: 100,
  attributeIncrementXP: 25,
  eveningConfirmationHour: 18,
  rewardBudget: { enabled: false, ordinaryRenown: 160, oathRenown: 40 },
  ranks: [
    { name: "Squire", threshold: 0 },
    { name: "Man-at-Arms", threshold: 1000 },
    { name: "Knight Errant", threshold: 3000 },
    { name: "Knight", threshold: 7500 },
    { name: "Knight Banneret", threshold: 15000 },
  ],
};
export const oathDefinition = {
  name: "The Oath of Temperance",
  reward: { renown: 40, xp: { Resolve: 25 } } satisfies Reward,
};
export const quests: Quest[] = [
  {
    id: "training",
    goalId: "strength",
    name: "Training Yard",
    description: "Complete a workout",
    category: "training",
    difficulty: "substantial",
    timing: "immediate",
    reward: { renown: 35, xp: { Strength: 20 } },
  },
  {
    id: "patrol",
    goalId: "walking",
    name: "Patrol the Realm",
    description: "Walk 3 km",
    category: "training",
    difficulty: "moderate",
    timing: "immediate",
    reward: { renown: 30, xp: { Endurance: 15 } },
    distance: 3,
  },
  {
    id: "provisions",
    goalId: "nutrition",
    name: "Mind Your Provisions",
    description: "Confirm you met your nutrition target",
    category: "duties",
    difficulty: "moderate",
    timing: "end-of-day",
    reward: { renown: 25, xp: { Vitality: 15 } },
  },
  {
    id: "presence",
    goalId: "care",
    name: "Attend Thy Person",
    description: "Take time for grooming or skincare",
    category: "duties",
    difficulty: "light",
    timing: "immediate",
    reward: { renown: 15, xp: { Presence: 8 } },
  },
  {
    id: "study",
    goalId: "study",
    name: "Scholar’s Hour",
    description: "Read or study for 20 minutes",
    category: "training",
    difficulty: "moderate",
    timing: "immediate",
    reward: { renown: 25, xp: { Wisdom: 15 } },
  },
  {
    id: "rest",
    goalId: "recovery",
    name: "Rest for the Road",
    description: "Confirm last night’s sleep met your goal",
    category: "duties",
    difficulty: "moderate",
    timing: "retrospective",
    reward: { renown: 25, xp: { Vitality: 15 } },
  },
];
