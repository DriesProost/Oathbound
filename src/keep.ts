import type { Attribute } from './config';
import type { State } from './model';
import { totals } from './domain';
import { remember } from './worldRecords';
import type { WorldMilestone } from './worldModel';
export const keepThresholds = [1, 4, 7, 10, 14] as const;
export const keepStageNames = ['Quiet', 'Modest', 'Established', 'Impressive', 'Distinguished'];
export type KeepArea = { id: string; attribute: Attribute; title: string; growthTitle: string; descriptions: readonly string[]; artwork?: readonly string[] };
export const keepAreas: readonly KeepArea[] = [
  { id:'yard',attribute:'Strength',title:'Training Yard',growthTitle:'THE YARD TAKES SHAPE',descriptions:[
    'An open patch of ground beside the wall.', 'A level practice space and a repaired wooden rack.', 'Covered racks, sound footing and room for several companions.', 'A sheltered practice hall opens onto the yard.', 'A well-appointed school of arms, built around patient practice.'] },
  { id:'scout-post',attribute:'Endurance',title:'Scout Post',growthTitle:'THE ROADS HAVE A HOME',descriptions:[
    'A gate opening onto roads still to be learned.', 'A dry map table and a bench for returning travellers.', 'A scout post with a small stable and carefully marked routes.', 'A road house with fresh maps, shelter and supplies.', 'A distinguished station linking the Keep to the neighbouring towns.'] },
  { id:'library',attribute:'Wisdom',title:'Library',growthTitle:'THE LIBRARY GROWS',descriptions:[
    'A quiet alcove waiting for its first shelves.', 'New shelves line the western wall.', 'A reading table stands among dry, well-kept manuscripts.', 'A scriptorium gives readers and copyists room to work.', 'A distinguished library, with a place for questions as well as books.'] },
  { id:'garden',attribute:'Vitality',title:'Garden',growthTitle:'THE GARDEN TAKES ROOT',descriptions:[
    'A sheltered plot beside the kitchen.', 'A few useful beds and a clean bench in the infirmary.', 'Herbs, vegetables and a kitchen ready for thoughtful meals.', 'A productive garden supplies a calm, well-kept infirmary.', 'A flourishing physic garden and generous kitchen serve the household.'] },
  { id:'hall',attribute:'Presence',title:'Great Hall',growthTitle:'THE HALL OPENS ITS DOORS',descriptions:[
    'A long room with room for future guests.', 'A repaired table and a pair of steady candlesticks.', 'A welcoming hall with chairs enough for company.', 'Carved oak, warm lamps and a well-tended guest chamber.', 'A distinguished hall, remembered for the welcome given inside it.'] },
  { id:'gatehouse',attribute:'Resolve',title:'Gatehouse',growthTitle:'THE WATCH HAS A PLACE',descriptions:[
    'A stone arch marking the edge of the Keep.', 'A sheltered desk and a clear place for the watch ledger.', 'An established gatehouse with organised stores and a sound wall.', 'A watchtower gives the household a steady view of the roads.', 'A distinguished gate and watch, built to endure the changing seasons.'] },
];
export function stageForLevel(level: number) { return Math.max(0, keepThresholds.findLastIndex(min => level >= min)); }
export function keepStage(state: State, attribute: Attribute) {
  return Math.max(stageForLevel(totals(state).stats[attribute].level), 0,
    ...state.world.milestones.filter(m => m.kind === 'keep' && m.attribute === attribute).map(m => m.stage ?? 0));
}
export function reconcileKeep(state: State, date: string, provenance: WorldMilestone['provenance']): State {
  let next=state;
  for(const area of keepAreas) for(let stage=1;stage<=keepStage(state,area.attribute);stage++) next=remember(next,{
    id:`${area.id}:${stage}`,kind:'keep',date,provenance,title:area.growthTitle,text:area.descriptions[stage],
    attribute:area.attribute,stage,location:area.title,
  });
  return next;
}
