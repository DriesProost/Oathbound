import {describe,expect,it} from 'vitest';
import {stepsToKm,kmToSteps} from './walking';
import {createKnight,completeQuest,totals} from './domain';
describe('step-based patrols',()=>{
 it('uses an explicit reversible route estimate',()=>{expect(stepsToKm(4000)).toBe(3);expect(kmToSteps(9)).toBe(12000);});
 it('snapshots the target, advances the route once and keeps normal rewards',()=>{
  const date='2026-10-10',now=new Date(date+'T19:00:00');const before=createKnight('Rowan',date);
  const after=completeQuest(before,'patrol',date,now);
  expect(after.entries[0].deed.target).toEqual({metric:'steps',value:4000});
  expect(totals(after).distance).toBe(3);expect(totals(after).renown-totals(before).renown).toBe(30);
  expect(completeQuest(after,'patrol',date,now)).toBe(after);
 });
});
