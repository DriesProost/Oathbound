import {describe,it,expect} from 'vitest';
import {createKnight,completeQuest,totals} from './domain';
import {encounters,reconcileEncounters,chooseEncounter} from './encounters';
import {currentRemark,retinue} from './retinue';
import {save,load} from './storage';
const date='2026-10-14';
function road(km:number){const s=completeQuest(createKnight('R',date),'patrol',date,new Date(date+'T19:00:00'));return {...s,entries:s.entries.map(e=>({...e,distance:km}))};}
describe('Journey Encounters',()=>{
 it('authors ten events and triggers only after their first route position',()=>{
  expect(encounters).toHaveLength(10);expect(reconcileEncounters(road(1.99),date,'earned').world.encounters).toEqual([]);
  const next=reconcileEncounters(road(2),date,'earned');expect(next.world.encounters.map(e=>e.id)).toEqual(['bridge']);expect(reconcileEncounters(next,date,'earned')).toBe(next);
 });
 it('does not lose encounters when a real patrol crosses the whole interval',()=>{const s=reconcileEncounters(road(30),date,'earned');expect(s.world.encounters).toHaveLength(10);expect(s.world.encounters.every(e=>e.km>=e.range.start&&e.km<=e.range.end)).toBe(true);});
 it('persists flavour choices and their snapshots with no reward or repeat',()=>{
  const s=reconcileEncounters(road(3),date,'earned'),next=chooseEncounter(s,'bridge','detour',date);expect(next.world.encounters[0].choiceId).toBe('detour');expect(totals(next)).toEqual(totals(s));expect(chooseEncounter(next,'bridge','ford',date)).toBe(next);
  const data=new Map<string,string>(),store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};save(next,store);expect(load(store,date)?.world.encounters).toEqual(next.world.encounters);
 });
 it('rejects unavailable choices and recognizes a remembered scholar later',()=>{
  let s=reconcileEncounters(road(14),date,'earned');expect(chooseEncounter(s,'bridge','invalid',date)).toBe(s);expect(chooseEncounter(s,'absent','x',date)).toBe(s);
  s=chooseEncounter(s,'scholar-road','road',date);expect(currentRemark(s,retinue.find(m=>m.id==='scholar')!,date)).toContain('room for questions');
 });
});
