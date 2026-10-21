import { attributes } from './config';
import { addDays, dayKey, validDay } from './calendar';
import type { State, VentureAssignment } from './model';
import { ventures, ventureReward, ventureTiers, ventureAttributes, type VentureDefinition, type VentureTier } from './ventures';

function hash(text: string) {
  let value = 2166136261;
  for (const character of text) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return (value >>> 0) / 4294967296;
}
/** Pure selection, called only when persisting an assignment, never during rendering. */
export function selectVenture(history: readonly VentureAssignment[], date: string, seed: string,
  library: readonly VentureDefinition[] = ventures, avoidAttribute?: VentureDefinition['attribute'] | readonly VentureDefinition['attribute'][]) {
  const past = history.filter(v => v.date <= date).sort((a, b) => a.date.localeCompare(b.date) || Number(!!a.replacementOf) - Number(!!b.replacementOf));
  const recent = past.slice(-14);
  const last = past.at(-1);
  const lastAttributes = avoidAttribute ? typeof avoidAttribute === 'string' ? [avoidAttribute] : avoidAttribute
    : last ? ventureAttributes(last) : [];
  const lastAttribute = lastAttributes[0];
  // Both the offered and set-aside Bold notices count, so replacement cannot bypass the guard.
  const boldCount = past.filter(v => v.date >= addDays(date, -6) && v.tier === 'Bold').length;
  let pool = library.filter(v => !past.some(p => p.date === date && p.id === v.id) &&
    (v.tier !== 'Bold' || boldCount < 2));
  if (!pool.length) return undefined;
  const disjoint = pool.filter(v => ventureAttributes(v).every(a => !lastAttributes.includes(a)));
  const otherAttributes = pool.filter(v => v.attribute !== lastAttribute);
  if (disjoint.length) pool = disjoint;
  else if (otherAttributes.length) pool = otherAttributes;
  const fresh = pool.filter(v => !recent.some(p => p.id === v.id));
  if (fresh.length) pool = fresh;
  const tiers = (Object.keys(ventureTiers) as VentureTier[]).filter(t => pool.some(v => v.tier === t));
  const totalWeight = tiers.reduce((sum, t) => sum + ventureTiers[t].weight, 0);
  let roll = hash(`${seed}:${date}:${past.length}:tier`) * totalWeight;
  const tier = tiers.find(t => (roll -= ventureTiers[t].weight) < 0) ?? tiers.at(-1)!;
  pool = pool.filter(v => v.tier === tier);
  const counts = Object.fromEntries(attributes.map(a => [a, recent.filter(v => ventureAttributes(v).includes(a)).length]));
  const lowest = Math.min(...pool.map(v => counts[v.attribute]));
  pool = pool.filter(v => counts[v.attribute] === lowest);
  // In an exhausted library, use the least recently used suitable notice.
  if (!fresh.length) {
    const lastUse = (id: string) => past.findLastIndex(v => v.id === id);
    const oldest = Math.min(...pool.map(v => lastUse(v.id)));
    pool = pool.filter(v => lastUse(v.id) === oldest);
  }
  return pool[Math.floor(hash(`${seed}:${date}:${past.length}:notice`) * pool.length)];
}
function snapshot(definition: VentureDefinition, date: string, replacementOf?: string): VentureAssignment {
  return {
    ...structuredClone(definition), date,
    assignmentId: `venture:${date}:${replacementOf ? 'replacement' : 'first'}`,
    reward: ventureReward(definition.tier, definition.attribute, definition.secondaryAttributes), rewardGrant: null,
    status: 'assigned', replaced: false,
    ...(replacementOf ? { replacementOf } : {}),
  };
}
export function todaysVenture(state: State, date = dayKey()) {
  return state.ventures.find(v => v.date === date && v.status !== 'set-aside');
}
export function ensureDailyVenture(state: State, date = dayKey(), library: readonly VentureDefinition[] = ventures): State {
  if (!validDay(date) || date < state.created || state.ventures.some(v => v.date === date)) return state;
  const definition = selectVenture(state.ventures, date, `${state.created}:${state.name}`, library);
  return definition ? { ...state, ventures: [...state.ventures, snapshot(definition, date)] } : state;
}
export function replaceDailyVenture(state: State, id: string, now = new Date(), library: readonly VentureDefinition[] = ventures): State {
  const date = dayKey(now), current = todaysVenture(state, date);
  if (!current || current.assignmentId !== id || current.status !== 'assigned' || current.replacementOf || current.replaced) return state;
  const definition = selectVenture(state.ventures, date, `${state.created}:${state.name}`, library, ventureAttributes(current));
  if (!definition) return state;
  return { ...state, ventures: [
    ...state.ventures.map(v => v.assignmentId === id ? { ...v, replaced: true, status: 'set-aside' as const } : v),
    snapshot(definition, date, id),
  ] };
}
export function completeDailyVenture(state: State, id: string, now = new Date()): State {
  const current = todaysVenture(state, dayKey(now));
  if (!current || current.assignmentId !== id || current.status !== 'assigned') return state;
  const activityId = `activity:${id}`;
  return { ...state, ventures: state.ventures.map(v => v.assignmentId !== id ? v : {
    ...v, status: 'completed', completedAt: now.toISOString(),
    rewardGrant: { id: `award:${id}`, activityId, goalId: null, period: { kind: 'day', start: v.date } },
  }) };
}
export function completedVentures(state: State) {
  return state.ventures.filter(v => v.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));
}

/** Prepare the first notice without spending its replacement. The scheduler also
 * checks its seen/attempt journal before requesting or accepting new content. */
export function prepareDailyNotice(state:State,id:string,definition:VentureDefinition,date:string):State {
 const current=todaysVenture(state,date);
 if(!current||current.assignmentId!==id||current.status!=='assigned'||current.replacementOf||current.replaced||definition.attribute!==current.attribute||definition.tier!==current.tier)return state;
 return {...state,ventures:state.ventures.map(v=>v.assignmentId===id?snapshot(definition,date):v)};
}
