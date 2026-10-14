import {describe,it,expect} from 'vitest';
import {createKnight,completeQuest,totals} from './domain';
import {relics,reconcileRelics} from './relics';
import {save,load} from './storage';
const date='2026-10-14';
describe('Relics of the Campaign',()=>{
 it('authors twelve meaningful conditions without random rewards',()=>{expect(relics).toHaveLength(12);expect(new Set(relics.map(r=>r.id)).size).toBe(12);expect(reconcileRelics(createKnight('R',date),date,'earned').world.milestones).toEqual([]);});
 it('unlocks once, snapshots its origin, and never revokes a Relic',()=>{
  const s={...createKnight('R',date),oaths:{[date]:{status:'kept' as const,reward:{renown:7500,xp:{}}}}};
  const next=reconcileRelics(s,date,'earned');expect(next.world.milestones.some(m=>m.id==='knights-seal')).toBe(true);expect(totals(next)).toEqual(totals(s));
  expect(reconcileRelics(next,date,'earned')).toBe(next);const corrected={...next,oaths:{}};expect(reconcileRelics(corrected,'2027-01-01','earned')).toBe(corrected);
 });
 it('uses an honest discovery date for old achievements and preserves it on reload',()=>{
  const s=createKnight('R','2026-10-01'),next=reconcileRelics({...s,oaths:{'2026-10-01':{status:'kept',reward:{renown:7500,xp:{}}}}},date,'discovered');
  expect(next.world.milestones[0]).toMatchObject({date,provenance:'discovered'});const values=new Map<string,string>();const store={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};save(next,store);expect(load(store,date)?.world).toEqual(next.world);
 });
 it('uses actual Journey distance, never app visits or elapsed days alone',()=>{
  let s=completeQuest(createKnight('R',date),'patrol',date,new Date(date+'T19:00:00'));s={...s,entries:s.entries.map(e=>({...e,distance:100}))};
  expect(reconcileRelics(s,date,'earned').world.milestones.some(m=>m.id==='road-boots')).toBe(true);
  expect(reconcileRelics(createKnight('R','2020-01-01'),date,'discovered').world.milestones).toEqual([]);
 });
});
