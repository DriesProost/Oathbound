import {ensureWeeklyPeriod} from '../weekly';
import {describe,it,expect,vi} from 'vitest';
import {createKnight,totals,confirmOath} from '../domain';
import {continueStory} from './director';
import {synchronizeWorld} from '../worldProgression';
import {save,load,validate,storageKeys} from '../storage';
import {runtimeAi} from './aiConfig';
import {narrativeContext} from './context';
import {detectFeedback} from '../feedback/events';
const date='2026-10-21';
describe('Living Campaign final integration',()=>{
 it('stays fully local when disabled, including reload, inactivity and factual corrections',async()=>{
  const network=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('offline'));
  try{
   const base=createKnight('R','2026-10-01');const developed=synchronizeWorld(confirmOath(base,'2026-10-02','kept',new Date('2026-10-02T20:00:00')),date);
   const next=await continueStory(ensureWeeklyPeriod(developed,date),date);const m=new Map<string,string>(),store={getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);}};
   save(next,store);const reloaded=load(store,date)!;expect(reloaded).toEqual(next);expect(await continueStory(reloaded,date)).toBe(reloaded);expect(detectFeedback(next,reloaded,'quiet')).toEqual([]);
   const corrected=confirmOath(reloaded,'2026-10-02','broken',new Date(date+'T20:00:00'));expect(corrected.living.story).toEqual(next.living.story);expect(corrected.world.milestones).toEqual(next.world.milestones);
   expect(totals(synchronizeWorld(corrected,'2029-10-21','discovered'))).toEqual(totals(corrected));expect(network).not.toHaveBeenCalled();
  }finally{network.mockRestore();}
 });
 it('uses Luna exclusively in production settings and rejects silently corrupted story saves',async()=>{
  const s=await continueStory(createKnight('R',date),date);expect(s.living.settings.model).toBe('gpt-6-luna');expect(runtimeAi.reasoning).toBe('low');
  for(const bad of [
   {...s,living:{...s.living,settings:{...s.living.settings,model:'gpt-6-sol'}}},
   {...s,living:{...s.living,story:{...s.living.story,beats:[...s.living.story.beats,...s.living.story.beats]}}},
   {...s,living:{...s.living,battle:{id:'arbitrary'}}}
  ])expect(()=>validate(bad)).toThrow();
  const raw=JSON.stringify(s);expect(raw).not.toContain('sessionKey');expect(storageKeys.current).toBe('oathbound.knight.v6');
 });
 it('writes factual completed-month summaries without inventing empty months and corrects them in place',()=>{
  const base=confirmOath(createKnight('R','2026-09-01'),'2026-09-03','kept',new Date('2026-09-03T20:00:00'));
  const s=synchronizeWorld(base,date),month=s.world.pages.find(p=>p.kind==='month')!;
  expect(month).toMatchObject({id:'month:2026-09-01',start:'2026-09-01',end:'2026-09-30'});
  const corrected=confirmOath(s,'2026-09-03','broken',new Date(date+'T20:00:00'));expect(corrected.world.pages.find(p=>p.id===month.id)!.highlights.find(h=>h.label==='Oaths kept')!.value).toBe('0');
  expect(synchronizeWorld(createKnight('R','2026-01-01'),date).world.pages).toEqual([]);
 });
 it('includes only completed generated Venture hooks and deterministic combat outcomes in AI context',()=>{
  const s=createKnight('R',date),context=narrativeContext(s);expect(context.recentConfrontations).toEqual([]);expect(context).not.toHaveProperty('weight');expect(context).not.toHaveProperty('name');expect(context).not.toHaveProperty('save');
 });
});
