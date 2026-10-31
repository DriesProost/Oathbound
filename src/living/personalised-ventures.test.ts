import {describe,it,expect,vi} from 'vitest';
import {createKnight,recordDeedStatus,totals} from '../domain';
import {ensureDailyVenture,todaysVenture,completeDailyVenture} from '../ventureDomain';
import {ventures,ventureReward} from '../ventures';
import {physicalPlans,validGeneratedVenture,generateFirstNotice} from './ventureGeneration';
import {validate} from '../storage';
const date='2026-10-31',now=new Date(date+'T19:00:00');
describe('Results-informed AI Daily Ventures',()=>{
 it('accepts reviewed physical plans in every tier with exact central rewards',async()=>{
  for(const [id,p] of Object.entries(physicalPlans)){
   const generated={title:'A deliberate practice',attribute:p.attribute,tier:p.tier,minutes:p.minutes,introduction:'A useful possibility along the road.',instructions:[...p.instructions],tags:['indoor'],equipment:[],safety:'Adapt if needed.',consequenceHook:'A new route is noticed.',physicalPlan:id};
   expect(validGeneratedVenture(generated),id).toBe(true);
   let s=ensureDailyVenture(createKnight('R','2026-10-01'),date,[ventures.find(v=>v.attribute===p.attribute&&v.tier===p.tier)??{...ventures[0],attribute:p.attribute,tier:p.tier}]);s.living.settings.enabled=true;s.living.settings.preferredMinutes=60;
   const next=await generateFirstNotice(s,date,{generate:async()=>generated}),v=todaysVenture(next,date)!;expect(v.generation?.source,id).toBe('ai');expect(v.reward).toEqual(ventureReward(p.tier,p.attribute));expect(validate(next)).toBe(next);
  }
 });
 it('sends compact aggregate results, not the full story, weight or personal notes',async()=>{
  let s=recordDeedStatus(createKnight('PRIVATE NAME','2026-10-01'),'study','2026-10-28','not-completed',now);s=ensureDailyVenture(s,date,[ventures.find(v=>v.id==='wardrobe-muster')!]);s.living.settings.enabled=true;
  const provider={generate:vi.fn().mockResolvedValue({title:'A careful preparation',attribute:'Presence',tier:'Brief',minutes:10,introduction:'A place for deliberate care.',instructions:['Prepare one outfit for tomorrow.'],tags:['indoor'],equipment:[],safety:'Choose what suits you.',consequenceHook:'An invitation can be answered.'})};
  const next=await generateFirstNotice(s,date,provider),request=provider.generate.mock.calls[0][0];expect(request.context.recentResults.focusGoals).toContain('study');expect(request.context.recentResults.tasks.find((r:any)=>r.goal==='study').explicitlyFailed).toBe(1);
  for(const key of ['canon','retinue','weight','deedNotes','save'])expect(request.context).not.toHaveProperty(key);expect(JSON.stringify(request)).not.toContain('PRIVATE NAME');expect(request.instruction).toMatch(/Unlogged is unknown/);expect(todaysVenture(next,date)!.generation?.source).toBe('ai');expect(totals(next)).toEqual(totals(s));
  const done=completeDailyVenture(next,todaysVenture(next,date)!.assignmentId,now);expect(completeDailyVenture(done,todaysVenture(done,date)!.assignmentId,now)).toBe(done);
 });
 it('rejects altered volumes, fabricated rewards and a plan from another tier',()=>{
  const p=physicalPlans['steady-strength'],g={title:'Controlled practice',attribute:p.attribute,tier:p.tier,minutes:p.minutes,introduction:'A simple practice.',instructions:[...p.instructions],tags:['indoor'],equipment:[],safety:'Adapt if needed.',consequenceHook:'A gate is repaired.',physicalPlan:'steady-strength'};
  expect(validGeneratedVenture(g)).toBe(true);for(const change of [{tier:'Bold'},{minutes:60},{instructions:['Perform 500 repetitions.']},{reward:{renown:900}}])expect(validGeneratedVenture({...g,...change})).toBe(false);
 });
 it('does not call a paid model when duration constraints leave no reviewed physical plan',async()=>{
  const p=physicalPlans['long-road'];let s=ensureDailyVenture(createKnight('R',date),date,[{...ventures[0],attribute:p.attribute,tier:p.tier}]);s.living.settings.enabled=true;s.living.settings.preferredMinutes=10;
  const provider={generate:vi.fn()};expect(await generateFirstNotice(s,date,provider)).toBe(s);expect(provider.generate).not.toHaveBeenCalled();
 });
});
