import {describe,it,expect,vi} from 'vitest';
import {createKnight,completeQuest,totals,confirmOath} from './domain';
import {ensureDailyVenture,completeDailyVenture} from './ventureDomain';
import {ventures} from './ventures';
import {synchronizeWorld} from './worldProgression';
import {chooseEncounter} from './encounters';
import {writeSong} from './songbook';
import {preferTitle} from './titles';
import {validate,load,save,storageKeys} from './storage';
import {detectFeedback} from './feedback/events';
const date='2026-10-14', time=new Date(date+'T19:00:00');
const memory=()=>{const data=new Map<string,string>();return {getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};};
function rich(){let s=createKnight('Rowan','2026-10-05');for(const d of ['2026-10-05','2026-10-06','2026-10-07'])s=completeQuest(s,'training',d,new Date(d+'T19:00:00'));
 s=completeQuest(s,'patrol','2026-10-07',new Date('2026-10-07T19:00:00'));s={...s,entries:s.entries.map(e=>e.goalId==='walking'?{...e,distance:100}:e)};
 s=ensureDailyVenture(s,date,[ventures[4]]);s=completeDailyVenture(s,s.ventures[0].assignmentId,time);
 return {...s,portrait:'tied-hair' as const,deedNotes:[{date,questId:'rest',name:'An earlier note',status:'not-planned' as const}],
 oaths:{...s.oaths,[date]:{status:'kept' as const,reward:{renown:7500,xp:{Strength:1000,Endurance:1000,Resolve:1000,Wisdom:1000,Vitality:1000,Presence:1000}}}},
 weight:{settings:{displayUnit:'lb' as const,baseline:{date:'2026-10-05',grams:90000},targetGrams:85000,appearance:{enabled:true,startingBuild:'large' as const,targetBuild:'lean' as const},acknowledgedGoal:'2026-10-05:90000:85000'},measurements:[{id:'original-weight',date:'2026-10-13',grams:88000,createdAt:time.toISOString(),updatedAt:time.toISOString()}]}};
}
describe('Eight-system integration',()=>{
 it('preserves all populated v4 values, rewards and source bytes through migration and world discovery',()=>{
  const {world:_world,living:_living,...source}=rich(),old={...source,version:4},raw=JSON.stringify(old,null,2),store=memory();store.setItem(storageKeys.v4,raw);
  const migrated=load(store,date)!,developed=synchronizeWorld(migrated,date,'discovered');
  expect(store.getItem(storageKeys.worldBackup)).toBe(raw);expect(store.getItem(storageKeys.v4)).toBe(raw);
  for(const key of ['name','created','portrait','entries','oaths','ventures','weight','campaign','deedNotes'] as const)expect(developed[key]).toEqual(old[key]);
  expect(developed.weekly.commissions.slice(0,old.weekly.commissions.length)).toEqual(old.weekly.commissions);expect(totals(developed)).toEqual(totals(rich()));
  expect(migrated.world.milestones).toEqual([]);expect(developed.world.milestones.every(m=>m.date===date&&m.provenance==='discovered')).toBe(true);
  expect(detectFeedback(migrated,developed,'quiet')).toEqual([]);save(developed,store);expect(load(store,date)).toEqual(developed);
 });
 it('all eight systems work offline without creating a network-dependent reward system',()=>{
  const fetch=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('offline'));try{
   let s=synchronizeWorld(rich(),date);s=chooseEncounter(s,'scholar-road','diagram',date);s=writeSong(s,{title:'The quiet road',notes:'A line by the fire',chords:'Am G'},date);s=preferTitle(s,'warden-scholar');s=synchronizeWorld(s,'2026-10-19');
   expect(s.world.milestones.some(m=>m.kind==='restoration')).toBe(true);expect(s.world.pages.some(p=>p.kind==='chapter')).toBe(true);expect(s.world.pages.some(p=>p.kind==='week')).toBe(true);expect(s.world.preferredTitle).toBe('warden-scholar');expect(totals(s)).toEqual(totals(rich()));expect(fetch).not.toHaveBeenCalled();expect(validate(s)).toBe(s);
  }finally{fetch.mockRestore();}
 });
 it('never loses earned world objects through an Oath correction or years of missing activity',()=>{
  const s=synchronizeWorld(rich(),date),corrected=confirmOath(s,date,'broken',new Date('2026-10-20T19:00:00')),later=synchronizeWorld(corrected,'2029-01-01');
  expect(later.world.milestones).toEqual(s.world.milestones);expect(totals(later)).toEqual(totals(corrected));expect(later.world.encounters).toEqual(s.world.encounters);
 });
 it('rejects malformed snapshots and broken encounter/page links without modifying the current save',()=>{
  let s=synchronizeWorld(rich(),date);s=chooseEncounter(s,'bridge','ford',date);const store=memory();save(s,store);const original=store.getItem(storageKeys.current);
  for(const corrupt of [
   (v:typeof s)=>{v.world.encounters[0].choiceId='not-a-choice';},
   (v:typeof s)=>{v.world.encounters[0].resolvedDate='2026-01-01';},
   (v:typeof s)=>{v.world.pages[0].end='bad';},
   (v:typeof s)=>{v.world.pages[0].events[0].id='invented';},
   (v:typeof s)=>{v.world.milestones=v.world.milestones.filter(m=>m.kind!=='encounter');},
   (v:typeof s)=>{v.world.preferredTitle='unearned';},
  ]){const bad=structuredClone(s);corrupt(bad);expect(()=>save(bad,store)).toThrow();expect(store.getItem(storageKeys.current)).toBe(original);}
 });
});
