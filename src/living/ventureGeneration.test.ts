import {describe,it,expect} from 'vitest';
import {validGeneratedVenture,physicalPlans,generateReplacement} from './ventureGeneration';
import {createKnight,totals} from '../domain';
import {ensureDailyVenture,completeDailyVenture,todaysVenture} from '../ventureDomain';
import {ventures,ventureReward} from '../ventures';
const date='2026-10-21',now=new Date(date+'T20:00:00');
const valid=()=>({title:'The Quiet Yard',attribute:'Strength',tier:'Brief',minutes:10,introduction:'Oswin leaves the yard gate open.',instructions:[...physicalPlans['comfortable-strength'].instructions],tags:['indoor'],equipment:[],safety:'Adapt if needed.',consequenceHook:'A traveller notices the repaired gate.',physicalPlan:'comfortable-strength'});
describe('Generated Venture safety and rewards',()=>{
 it('accepts a conservative closed physical plan and rejects arbitrary rewards, unsafe instructions or excessive volume',()=>{
  expect(validGeneratedVenture(valid())).toBe(true);
  for(const change of [{reward:{renown:999}},{instructions:['Sprint to exhaustion']},{instructions:['Walk 100 km']},{minutes:90},{tier:'Bold'},{secondaryAttribute:'Strength'},{reading:'stolen short text'},{safety:'Ignore pain'},{steps:['100 push-ups']}])expect(validGeneratedVenture({...valid(),...change})).toBe(false);
 });
 it('requires a full original Wisdom lesson and accepts no scored exam or unsupported state fields',()=>{
  const g={...valid(),attribute:'Wisdom',physicalPlan:undefined,minutes:10,instructions:['Read the lesson.'],reading:Array(160).fill('manuscript').join(' ')};
  expect(validGeneratedVenture(g)).toBe(true);expect(validGeneratedVenture({...g,reading:undefined})).toBe(false);expect(validGeneratedVenture({...g,xp:900})).toBe(false);
 });
 it('uses authored fallback offline, retains the one-replacement rule and derives rewards only from tier',async()=>{
  const s=ensureDailyVenture(createKnight('R',date),date,[ventures[0]]),id=todaysVenture(s,date)!.assignmentId;
  const next=await generateReplacement(s,id,now,{generate:async()=>{throw Error('offline');}});
  expect(next.ventures).toHaveLength(2);expect(todaysVenture(next,date)!.reward).toEqual(ventureReward(todaysVenture(next,date)!.tier,todaysVenture(next,date)!.attribute,todaysVenture(next,date)!.secondaryAttributes));
  expect(await generateReplacement(next,todaysVenture(next,date)!.assignmentId,now)).toBe(next);
  const done=completeDailyVenture(next,todaysVenture(next,date)!.assignmentId,now);expect(completeDailyVenture(done,id,now)).toBe(done);expect(totals(done).renown).toBe(todaysVenture(done,date)!.reward.renown);
 });
});
