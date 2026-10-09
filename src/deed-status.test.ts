import {describe, it, expect} from 'vitest';
import {createKnight, recordDeedStatus, completeQuest, totals, confirmOath} from './domain';
import {save, load, validate} from './storage';
const now = new Date('2026-10-09T19:00:00');
describe('optional deed notes', () => {
  it('keeps rest days and missed intentions separate without changing any progression', () => {
    const s = confirmOath(createKnight('Ada','2026-10-05'), '2026-10-08','kept',now);
    const next = recordDeedStatus(s,'training','2026-10-09','not-planned',now);
    expect(next.deedNotes?.[0].status).toBe('not-planned');
    expect(totals(next)).toEqual(totals(s));
    expect(next.entries).toEqual(s.entries);
    expect(next.weekly).toEqual(s.weekly);
    expect(next.oaths).toEqual(s.oaths);
    expect(next.weight).toEqual(s.weight);
    const missed = recordDeedStatus(next,'training','2026-10-09','not-completed',now);
    expect(missed.deedNotes).toHaveLength(1);
    expect(missed.deedNotes?.[0].status).toBe('not-completed');
    expect(recordDeedStatus(missed,'training','2026-10-09','unlogged',now).deedNotes).toEqual([]);
  });
  it('allows later completion once, replaces the note, and protects legitimate rewards', () => {
    const s = recordDeedStatus(createKnight('Ada','2026-10-05'),'training','2026-10-09','not-planned',now);
    const done = completeQuest(s,'training','2026-10-09',now);
    expect(done.deedNotes).toEqual([]);
    expect(done.entries).toHaveLength(1);
    expect(totals(done).renown).toBe(35);
    expect(recordDeedStatus(done,'training','2026-10-09','not-completed',now)).toBe(done);
    expect(completeQuest(done,'training','2026-10-09',now)).toBe(done);
  });
  it('validates timing and dates and rejects corrupt notes', () => {
    const s = createKnight('Ada','2026-10-05');
    expect(recordDeedStatus(s,'training','2026-10-10','not-completed',now)).toBe(s);
    expect(recordDeedStatus(s,'training','2026-10-04','not-planned',now)).toBe(s);
    expect(recordDeedStatus(s,'oath','2026-10-09','not-planned',now)).toBe(s);
    const note = recordDeedStatus(s,'training','2026-10-09','not-planned',now);
    expect(() => validate({...note, deedNotes:[...note.deedNotes!,...note.deedNotes!]})).toThrow();
    expect(() => validate({...note, deedNotes:[{...note.deedNotes![0],status:'failed'}]})).toThrow();
  });
  it('loads old saves unchanged and persists new notes independently', () => {
    const s = createKnight('Ada','2026-10-05');
    expect(validate(JSON.parse(JSON.stringify(s)))).toEqual(s);
    const values = new Map<string,string>();
    const store = {getItem:(k:string)=>values.get(k) ?? null,setItem:(k:string,v:string)=>{values.set(k,v);}};
    const next = recordDeedStatus(s,'training','2026-10-09','not-planned',now);
    save(next,store);
    expect(load(store,'2026-10-09')?.deedNotes).toEqual(next.deedNotes);
    expect(totals(load(store,'2026-10-09')!)).toEqual(totals(s));
  });
});
