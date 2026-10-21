import { runtimeAi } from './aiConfig';
import type { Enemy } from './combatContent';
import type { Attribute } from '../config';
export type AiSettings = {
 enabled: boolean; story: boolean; ventures: boolean; dialogue: boolean;
 endpoint: string; model: string; preferredMinutes: number; outdoors: boolean; equipment: string[];
};
export type Arc = { id: string; template: string; title: string; premise: string; stage: number; started: string; completed?: string; mystery?: string };
export type StoryChoice = { id: string; label: string; outcome: string };
export type StoryBeat = {
 id: string; date: string; arcId: string; stage: number; progress: number;
 type: 'scene' | 'letter' | 'rumour' | 'quiet' | 'confrontation' | 'ending';
 title: string; prose: string; speakerId?: string; locationId: string;
 canonFactsAdded: string[]; hooksAdded: string[]; hooksResolved: string[];
 choices: StoryChoice[]; chosen?: string;
 combatSetup?: string; provenance: { source: 'authored' | 'ai'; model?: string; generatedAt: string };
};
export type CreativeEntry = { id: string; kind: 'dialogue' | 'bard' | 'chronicle'; date: string; sourceId: string; sourceHash: string; text: string; source: 'ai' | 'authored' };
export type StoryState = {
 arcs: Arc[]; currentArcId: string; plannedArc: {title:string;premise:string;mystery:string}|null; hooks: string[];
 npcs: { id: string; name: string; role: string }[];
 relationships: { npcId: string; note: string }[];
 places: { id: string; name: string; description: string }[];
 choices: { beatId: string; choiceId: string; outcome: string; date: string }[];
 mysteries: string[]; completedMysteries: string[]; worldFacts: string[];
 beats: StoryBeat[]; futureSeeds: string[]; mood: string; season: string; weather: string;
 lastGenerated: string | null; creative: CreativeEntry[];
};
export type Fighter = { health: number; maxHealth: number; stamina: number; maxStamina: number; guard: number; momentum: number };
export type Battle = {
 id: string; beatId: string; enemyId: string; opponent: Enemy; date: string; round: number;
 player: Fighter; enemy: Fighter; levels: Record<Attribute, number>; allies: string[]; distance: number;
 used: string[]; status: 'active' | 'victory' | 'defeat' | 'withdrawn' | 'resolved';
 log: string[]; lastAction: string;
};
export type LivingCampaign = { version: 1; settings: AiSettings; story: StoryState; battle: Battle | null; battles: Battle[] };
export function createLiving(): LivingCampaign {
 return { version: 1, settings: { enabled: false, story: true, ventures: false, dialogue: false, endpoint: '', model: runtimeAi.model, preferredMinutes: 20, outdoors: true, equipment: [] },
 story: { arcs: [], currentArcId: '', plannedArc: null, hooks: [], npcs: [], relationships: [], places: [], choices: [], mysteries: [], completedMysteries: [], worldFacts: [], beats: [], futureSeeds: ['The Miller’s Winter Ledger'], mood: 'Quiet expectation', season: 'The turning year', weather: 'Cloud over the road', lastGenerated: null, creative: [] }, battle: null, battles: [] };
}
