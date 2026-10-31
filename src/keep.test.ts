import {describe,it,expect} from 'vitest';
import {createKnight,totals} from './domain';
import {stageForLevel,keepStage,keepAreas,reconcileKeep} from './keep';
import {detectFeedback} from './feedback/events';
const date='2026-10-14';
describe('Evolving Keep',()=>{
 it('has six centrally staged areas at exact level boundaries',()=>{
  expect(keepAreas).toHaveLength(6);expect([1,3,4,6,7,9,10,13,14,30].map(stageForLevel)).toEqual([0,0,1,1,2,2,3,3,4,4]);
 });
 it('derives and permanently records growth without spending rewards',()=>{
  const s=createKnight('R',date),grown={...s,oaths:{[date]:{status:'kept' as const,reward:{renown:0,xp:{Wisdom:400}}}}};
  const next=reconcileKeep(grown,date,'earned');expect(keepStage(next,'Wisdom')).toBe(1);expect(totals(next)).toEqual(totals(grown));
  const corrected={...next,oaths:{}};expect(keepStage(corrected,'Wisdom')).toBe(1);expect(reconcileKeep(corrected,'2027-01-01','earned')).toBe(corrected);
 });
 it('keeps archived room thresholds out of new feedback',()=>{
  const s=createKnight('R',date),grown={...s,oaths:{[date]:{status:'kept' as const,reward:{renown:0,xp:{Wisdom:400}}}}};
  const next=reconcileKeep(grown,date,'earned');expect(detectFeedback(grown,next,'deed').map(e=>e.kind)).toEqual([]);
  expect(detectFeedback(next,structuredClone(next),'deed')).toEqual([]);
 });
});
