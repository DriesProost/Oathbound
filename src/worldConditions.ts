import { totals, rankProgress } from './domain';
import type { State } from './model';
import { progression, type Attribute } from './config';
export type WorldCondition =
  | { all: WorldCondition[] } | { any: WorldCondition[] }
  | { level: { attribute: Attribute; min: number } } | { rank: number }
  | { distance: number } | { ventures: number; attribute?: Attribute }
  | { keptOaths: number } | { training: number } | { ageDays: number }
  | { activeDays: number } | { keep: { attribute: Attribute; stage: number } }
  | { chapter: string } | { relics: number };
export function recordedDays(state: State) {
  return new Set([...state.entries.map(e => e.date), ...state.ventures.filter(v => v.rewardGrant).map(v => v.date),
    ...Object.keys(state.oaths).filter(d => state.oaths[d].status === 'kept')]);
}
export function meets(state: State, condition: WorldCondition, date: string): boolean {
  if ('all' in condition) return condition.all.every(c => meets(state, c, date));
  if ('any' in condition) return condition.any.some(c => meets(state, c, date));
  if ('ageDays' in condition) return Math.round((Date.parse(date) - Date.parse(state.created)) / 86400000) + 1 >= condition.ageDays;
  if ('activeDays' in condition) return recordedDays(state).size >= condition.activeDays;
  if ('ventures' in condition) return state.ventures.filter(v => v.rewardGrant && (!condition.attribute ||
    v.attribute === condition.attribute || v.secondaryAttributes?.includes(condition.attribute))).length >= condition.ventures;
  if ('training' in condition) return state.entries.filter(e => e.goalId === 'strength').length >= condition.training;
  if ('keptOaths' in condition) return Object.values(state.oaths).filter(o => o.status === 'kept').length >= condition.keptOaths;
  if ('chapter' in condition) return state.world.milestones.some(m => m.kind === 'chapter' && m.id === condition.chapter);
  if ('relics' in condition) return state.world.milestones.filter(m => m.kind === 'relic').length >= condition.relics;
  if ('keep' in condition) return state.world.milestones.some(m => m.kind === 'keep' && m.attribute === condition.keep.attribute && (m.stage ?? 0) >= condition.keep.stage);
  const total = totals(state);
  if ('distance' in condition) return total.distance >= condition.distance;
  if ('level' in condition) return total.stats[condition.level.attribute].level >= condition.level.min;
  return rankProgress(total.renown).rank.threshold >= (progression.ranks[condition.rank]?.threshold ?? Infinity);
}
