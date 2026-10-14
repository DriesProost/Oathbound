import { defaultGoals } from './campaign';
import { describe, it, expect } from 'vitest';
import { createKnight, totals } from './domain';
import { synchronizeWorld } from './worldProgression';
import { reconcileRetinue, retinue, currentRemark, retinueVentureIntro } from './retinue';
import { writeSong, availableThemes } from './songbook';
import { meets } from './worldConditions';
import { load, migrate, save, storageKeys } from './storage';
import { detectFeedback } from './feedback/events';
const date = '2026-10-14';
function progressed() { const s = createKnight('Rowan', date); return { ...s, oaths: { [date]: { status: 'kept' as const, reward: { renown: 3100, xp: { Strength: 250, Endurance: 250, Wisdom: 250, Vitality: 250, Presence: 250, Resolve: 250 } } } } }; }
function store() { const data = new Map<string,string>(); return { getItem: (k:string) => data.get(k) ?? null, setItem: (k:string,v:string) => { data.set(k,v); } }; }
describe('Retinue and world foundation', () => {
  it('keeps a new household quiet, then unlocks deterministically without requiring enabled goals', () => {
    const initial = createKnight('Rowan', date, defaultGoals(false)); expect(synchronizeWorld(initial,date)).toBe(initial);
    const s = progressed(), next = synchronizeWorld(s,date);
    expect(next.world.milestones.filter(m=>m.kind==='retinue')).toHaveLength(7);
    expect(synchronizeWorld(s,date)).toEqual(next); expect(synchronizeWorld(next,date)).toBe(next);
    expect(totals(next)).toEqual(totals(s));
  });
  it('does not welcome the entire household at Knight Errant or one shared age threshold', () => {
    const s = createKnight('R', '2026-01-01', defaultGoals(false));
    const ranked = { ...s, oaths: { '2026-01-01': { status: 'kept' as const, reward: { renown: 3100, xp: {} } } } };
    expect(reconcileRetinue(ranked, '2026-01-01', 'earned').world.milestones.filter(m => m.kind === 'retinue').map(m => m.id)).toEqual(['bard']);
    expect(retinue.filter(m => m.attribute).every(m => !meets(ranked, m.arrival, '2026-02-01'))).toBe(true);
  });
  it('paces six distinct fallback arrivals with any activity even when their own goals are disabled', () => {
    let s = createKnight('R', '2026-01-01', defaultGoals(false));
    for (let i = 1; i <= 40; i++) {
      const d = new Date(Date.UTC(2026, 0, i)).toISOString().slice(0, 10);
      s = { ...s, oaths: { ...s.oaths, [d]: { status: 'kept', reward: { renown: 0, xp: {} } } } };
    }
    // These receipts supply recorded active days without growing any attribute.
    const checkpoints = ['2026-01-14','2026-01-21','2026-01-28','2026-02-04','2026-02-11','2026-02-18'];
    expect(checkpoints.map(d => retinue.filter(m => m.attribute && meets(s, m.arrival, d)).length)).toEqual([1,2,3,4,5,6]);
    for (const member of retinue.filter(m => m.attribute)) {
      const direct = { ...createKnight('R', date, defaultGoals(false)), oaths: { [date]: { status: 'kept' as const, reward: { renown: 0, xp: { [member.attribute!]: 250 } } } } };
      expect(meets(direct, member.arrival, date)).toBe(true);
    }
  });
  it('rejects edits predating a song creation even within the campaign lifetime', () => {
    const s = synchronizeWorld({ ...progressed(), created: '2026-10-01' }, date);
    const written = writeSong(s, { title: 'Air', notes: '', chords: '' }, date);
    const rejected = writeSong(written, { title: 'Changed', notes: '', chords: '' }, '2026-10-13', written.world.songs[0].id);
    expect(rejected).toBe(written);
    expect(rejected.world.songs[0]).toMatchObject({ created: date, updated: date, title: 'Air' });
  });
  it('never sends arrived members away after a correction or inactive period', () => {
    const next=synchronizeWorld(progressed(),date), corrected={...next,oaths:{}};
    expect(synchronizeWorld(corrected,'2027-01-01').world.milestones).toEqual(next.world.milestones);
  });
  it('provides deterministic remarks and optional Venture flavour without changing mechanics', () => {
    const s=synchronizeWorld(progressed(),date), scholar=retinue.find(m=>m.id==='scholar')!;
    expect(currentRemark(s,scholar,date)).toBe(currentRemark(s,scholar,date));
    expect(retinueVentureIntro(s,'Wisdom','2026-10-15')).toContain('Aldren');
    expect(retinueVentureIntro(createKnight('Rowan',date),'Wisdom',date)).toBeUndefined();
  });
  it('stores and edits authored songs while metadata never fabricates audio or progression', () => {
    const s=synchronizeWorld(progressed(),date), next=writeSong(s,{title:'An air',notes:'Four lines\nBy the fire',chords:'Am G'},date);
    expect(next.world.songs).toHaveLength(1); expect(totals(next)).toEqual(totals(s));
    const edited=writeSong(next,{title:'An air',notes:'A fifth line',chords:'Am'},date,next.world.songs[0].id);
    expect(edited.world.songs[0].created).toBe(date);
    expect(availableThemes(s).filter(t=>t.asset)).toHaveLength(1);
    expect(writeSong(createKnight('R',date),{title:'x',notes:'',chords:''},date).world.songs).toEqual([]);
  });
  it('migrates exact v4 values and bytes with no invented world history; backup failure prevents commit', () => {
    const {world:_world,...base}=progressed(), old={...base,version:4}, memory=store(), raw=JSON.stringify(old);
    memory.setItem(storageKeys.v4,raw); const next=load(memory,date)!;
    expect(next.world.milestones).toEqual([]); expect(next.world.songs).toEqual([]);
    const {world:_next,version:_version,...fields}=next; const {version:_oldVersion,...oldFields}=old;
    expect(fields).toEqual(oldFields); expect(memory.getItem(storageKeys.worldBackup)).toBe(raw); expect(memory.getItem(storageKeys.v4)).toBe(raw);
    expect(load(memory,date)).toEqual(next); expect(migrate(old,date)).toEqual(next);
    const blocked=store();blocked.setItem(storageKeys.v4,raw);
    expect(()=>load({getItem:blocked.getItem,setItem:()=>{throw Error('quota');}},date)).toThrow('quota');
    expect(blocked.getItem(storageKeys.current)).toBeNull();
  });
  it('validates permanent identities, song limits and corrupt newer saves without fallback', () => {
    const memory=store(), s=synchronizeWorld(progressed(),date); save(s,memory); expect(load(memory,date)).toEqual(s);
    expect(()=>save({...s,world:{...s.world,milestones:[...s.world.milestones,s.world.milestones[0]]}},memory)).toThrow();
    memory.setItem(storageKeys.current,'{bad'); expect(()=>load(memory,date)).toThrow();
  });
  it('coordinates arrivals in one feedback surface and never replays them on reload or quiet discovery', () => {
    const before=progressed(), after=synchronizeWorld(before,date);
    expect(detectFeedback(before,after,'deed').filter(e=>e.kind==='retinue')).toHaveLength(7);
    expect(detectFeedback(after,structuredClone(after),'deed')).toEqual([]);
    expect(detectFeedback(before,after,'quiet')).toEqual([]);
    expect(detectFeedback(before,synchronizeWorld(before,date,'discovered'),'deed')).toEqual([]);
  });
});
