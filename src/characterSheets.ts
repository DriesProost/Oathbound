import { characterBounds } from './characterBounds';
import { characterClips } from './characterClips';
import type { BodyBuild } from './model';
const sheets = import.meta.glob('./assets/knight/sheets/*.webp', {eager:true, query:'?url', import:'default'});
export const characterRankKeys = ['squire','man-at-arms','knight-errant','knight','knight-banneret'] as const;
// Every sheet has three build columns and two Presence/grooming rows.
// URL imports receive Vite fingerprints and the existing offline precache.
export function characterSheet(rank: number, beard: number, body: BodyBuild = 'lean', portrait: 'classic' | 'personal' = 'classic') {
  const largeOnly = portrait === 'classic' && rank === 0 && body === 'large';
  const key = portrait === 'personal' ? `personal-${characterRankKeys[rank]}-${beard}` : largeOnly ? 'squire-large' : `${characterRankKeys[rank]}-${beard}`;
  const src = sheets[`./assets/knight/sheets/${key}.webp`] as string | undefined;
  const bounds = characterBounds[key];
  if (!src || bounds?.length !== 6) throw Error('Missing character illustration or viewport metadata. Check the bundled artwork set.');
  if (portrait === 'personal' && characterClips[key]?.length !== 6) throw Error('Missing personal portrait silhouette metadata.');
  return {src, width:900, height:1350, bounds, largeOnly, clips: characterClips[key]};
}
