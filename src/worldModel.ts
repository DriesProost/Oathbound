import type { Attribute } from './config';
export const worldKinds = ['retinue', 'keep', 'relic', 'chapter', 'title', 'restoration', 'song'] as const;
export type WorldKind = typeof worldKinds[number];
export type WorldMilestone = {
  id: string; kind: WorldKind; date: string; provenance: 'earned' | 'discovered';
  title: string; text: string; attribute?: Attribute; stage?: number;
  location?: string; origin?: string; category?: string;
};
export type SongEntry = { id: string; title: string; notes: string; chords: string; created: string; updated: string };
export type EncounterRecord = {
  id: string; date: string; title: string; text: string; chapterId: string; km: number;
  provenance: 'earned' | 'discovered';
  choices: { id: string; label: string; text: string; memory: string; characterId?: string }[];
  choiceId?: string; resolvedDate?: string;
};
export type ChroniclePage = {
  id: string; kind: 'week' | 'chapter' | 'month'; start: string; end: string;
  title: string; narrative: string; highlights: { label: string; value: string }[];
  events: WorldMilestone[]; stanza?: string; reconstructed: boolean;
};
export type WorldState = {
  trackingSince: string; milestones: WorldMilestone[]; songs: SongEntry[];
  pages: ChroniclePage[]; encounters: EncounterRecord[]; preferredTitle: string | null;
};
export function createWorld(date: string): WorldState {
  return { trackingSince: date, milestones: [], songs: [], pages: [], encounters: [], preferredTitle: null };
}
