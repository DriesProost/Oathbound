// Legacy snapshot utilities only; these systems are not part of the active app.
import { keepAreas, keepStage } from './keep';
import { progression } from './config';
import type { State } from './model';
import { dayKey, validDay } from './calendar';
import { rankProgress, totals } from './domain';
export const soundtrack = [
  { id: 'squire-strings', title: 'A Quiet Hearth', rank: 0, arrangement: 'Sparse solo plucked strings', location: 'Keep', asset: null },
  { id: 'arms-road', title: 'Footsteps Beyond the Gate', rank: 1, arrangement: 'Plucked strings with subtle percussion', location: 'Road', asset: null },
  { id: 'errant-air', title: 'An Air for the Open Road', rank: 2, arrangement: 'Strings with fiddle and flute', location: 'Journey', asset: null },
  { id: 'knights-table', title: 'The Table of Companions', rank: 3, arrangement: 'A fuller chamber-folk arrangement', location: 'Great Hall', keepStage: 2, asset: null },
  { id: 'banneret-return', title: 'Banners at Evening', rank: 4, arrangement: 'Ceremonial, restrained chamber-folk', location: 'Great Hall', asset: null },
  { id: 'bards-tale', title: 'The Bard’s Tale', rank: 0, arrangement: 'The existing Keep recording', location: 'Keep', asset: 'existing-ambience', retinue: 'bard' },
  { id: 'oakhaven-lamps', title: 'Lamps Along the Road', rank: 0, arrangement: 'A chapter closing air', location: 'Oakhaven', chapter: 'oakhaven', asset: null },
] as const;
// Selection metadata only. No automatic playback or replacement of the user's existing ambience.
export function availableThemes(state: State, context?: { location?: string; chapter?: string }) {
  const threshold = rankProgress(totals(state).renown).rank.threshold;
  const rank = progression.ranks.findIndex(r => r.threshold === threshold);
  return soundtrack.filter(t => t.rank <= rank &&
    (!('retinue' in t) || state.world.milestones.some(m => m.kind === 'retinue' && m.id === t.retinue)) &&
    (!('chapter' in t) || state.world.milestones.some(m => m.kind === 'chapter' && m.id === t.chapter)) &&
    (!('keepStage' in t) || keepAreas.some(a => keepStage(state, a.attribute) >= t.keepStage)) &&
    (!context?.location || t.location === context.location || t.location === 'Keep') &&
    (!context?.chapter || !('chapter' in t) || t.chapter === context.chapter));
}
export function writeSong(state: State, values: { title: string; notes: string; chords: string }, date = dayKey(), id?: string): State {
  if (!validDay(date) || date < state.created || !values.title.trim() || values.title.length > 120 || values.notes.length > 12000 || values.chords.length > 4000) return state;
  if (!state.world.milestones.some(m => m.kind === 'retinue' && m.id === 'bard')) return state;
  const previous = id ? state.world.songs.find(s => s.id === id) : undefined;
  if ((id && !previous) || (previous && date < previous.created)) return state;
  const record = { ...values, title: values.title.trim(), id: previous?.id ?? `song:${date}:${state.world.songs.length}`, created: previous?.created ?? date, updated: date };
  if (previous && record.title === previous.title && record.notes === previous.notes && record.chords === previous.chords) return state;
  return { ...state, world: { ...state.world, songs: previous ? state.world.songs.map(s => s.id === id ? record : s) : [...state.world.songs, record] } };
}
