import { attributes } from './config';
import { validDay } from './calendar';
import { ventureAttributes, ventureTiers } from './ventures';
import type { VentureAssignment } from './model';
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const strings = (v: unknown) => Array.isArray(v) && v.every(text);
const timestamp = (v: unknown) => text(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
/** Validate snapshots, never look up today's library: retired/edited content stays valid. */
export function validVentureHistory(value: unknown, created: string): value is VentureAssignment[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  for (const v of value) {
    if (!v || typeof v !== 'object' || !text(v.id) || !text(v.title) ||
      !attributes.includes(v.attribute) ||
      (v.secondaryAttributes !== undefined && (!Array.isArray(v.secondaryAttributes) ||
        v.secondaryAttributes.some((a: unknown) => !attributes.includes(a as any)) ||
        new Set([v.attribute, ...v.secondaryAttributes]).size !== 1 + v.secondaryAttributes.length)) ||
      !Object.hasOwn(ventureTiers, v.tier) ||
      !validDay(v.date) || v.date < created || !text(v.duration) || !text(v.introduction) ||
      !strings(v.instructions) || !strings(v.tags) ||
      (v.steps !== undefined && !strings(v.steps)) ||
      ['reading', 'reflection', 'safety'].some(k => v[k] !== undefined && !text(v[k])) ||
      !['assigned', 'set-aside', 'completed'].includes(v.status) || typeof v.replaced !== 'boolean' ||
      v.assignmentId !== `venture:${v.date}:${v.replacementOf ? 'replacement' : 'first'}` || ids.has(v.assignmentId) ||
      !v.reward || !Number.isFinite(v.reward.renown) || v.reward.renown <= 0 ||
      !v.reward.xp || typeof v.reward.xp !== 'object' || Array.isArray(v.reward.xp) ||
      Object.keys(v.reward.xp).length !== ventureAttributes(v).length ||
      ventureAttributes(v).some(a => !Number.isFinite(v.reward.xp[a]) || v.reward.xp[a] <= 0)) return false;
    ids.add(v.assignmentId);
    if (v.status === 'completed') {
      const r = v.rewardGrant;
      if (!timestamp(v.completedAt) || !r || r.id !== `award:${v.assignmentId}` ||
        r.activityId !== `activity:${v.assignmentId}` || r.goalId !== null ||
        r.period?.kind !== 'day' || r.period.start !== v.date || v.replaced) return false;
    } else if (v.rewardGrant !== null || v.completedAt !== undefined) return false;
    if ((v.status === 'set-aside') !== v.replaced) return false;
  }
  for (const date of new Set(value.map(v => v.date))) {
    const day = value.filter(v => v.date === date), first = day.find(v => !v.replacementOf);
    if (!first || day.length > 2) return false;
    const replacement = day.find(v => v.replacementOf);
    if (first.replaced !== !!replacement) return false;
    if (replacement && (replacement.replacementOf !== first.assignmentId || replacement.replaced ||
      replacement.id === first.id || replacement.status === 'set-aside')) return false;
  }
  return true;
}
