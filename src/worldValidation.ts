import { attributes } from './config';
import { validDay } from './calendar';
import { worldKinds, type WorldState } from './worldModel';
const obj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
const text = (v: any, max = 16000) => typeof v === 'string' && v.length > 0 && v.length <= max;
const optionalText = (v: any) => v === undefined || text(v);
const unique = (values: string[]) => new Set(values).size === values.length;
export function validMilestone(m: any): boolean {
  return obj(m) && text(m.id, 160) && worldKinds.includes(m.kind) && validDay(m.date) &&
    ['earned', 'discovered'].includes(m.provenance) && text(m.title, 200) && text(m.text) &&
    (m.attribute === undefined || attributes.includes(m.attribute)) &&
    (m.stage === undefined || (Number.isInteger(m.stage) && m.stage >= 1 && m.stage <= 4)) &&
    optionalText(m.location) && optionalText(m.origin) && optionalText(m.category);
}
export function validPage(p: any): boolean {
 return obj(p) && text(p.id,160) && ['week','month','chapter'].includes(p.kind) && validDay(p.start) && validDay(p.end) && p.end>=p.start &&
   text(p.title,200) && text(p.narrative) && typeof p.reconstructed==='boolean' && optionalText(p.stanza) &&
   Array.isArray(p.highlights) && p.highlights.every((h:any)=>obj(h)&&text(h.label,200)&&text(h.value,2000)) &&
   Array.isArray(p.events) && p.events.every((m:any)=>validMilestone(m)&&m.date>=p.start&&m.date<=p.end);
}
export function validWorld(v: unknown, created: string): v is WorldState {
  const w = v as any;
  if (!obj(w) || !validDay(w.trackingSince) || w.trackingSince < created ||
    !Array.isArray(w.milestones) || !w.milestones.every((m: any) => validMilestone(m) && m.date >= created) ||
    !unique(w.milestones.map((m: any) => `${m.kind}:${m.id}`)) ||
    !Array.isArray(w.songs) || !w.songs.every((s: any) => obj(s) && text(s.id, 160) && text(s.title, 120) &&
      typeof s.notes === 'string' && s.notes.length <= 12000 && typeof s.chords === 'string' && s.chords.length <= 4000 &&
      validDay(s.created) && validDay(s.updated) && s.created >= created && s.updated >= s.created) ||
    !unique(w.songs.map((s: any) => s.id)) || !Array.isArray(w.pages) || !Array.isArray(w.encounters) ||
    (w.preferredTitle !== null && (!text(w.preferredTitle, 160) || !w.milestones.some((m: any) => m.kind === 'title' && m.id === w.preferredTitle)))) return false;
  // Later phases fill these collections; unknown or partial records are not accepted.
  return w.pages.every(validPage) && unique(w.pages.map((p:any)=>p.id)) && w.encounters.length === 0;
}
