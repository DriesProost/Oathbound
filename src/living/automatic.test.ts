import {withDistance} from '../testFixtures/journey';
import {describe,it,expect,vi} from 'vitest';
import {createKnight as newKnight,completeQuest,totals} from '../domain';
import {ensureDailyVenture,todaysVenture,completeDailyVenture} from '../ventureDomain';
import {ensureAutomatic,nextAutomaticJob,reserveAutomaticJob,runAutomaticJob,finishAutomaticJob,readPreparedStory,markVentureSeen} from './automatic';
import {canContinue} from './director';
import {validate,load,save} from '../storage';
import type {State} from '../model';
const createKnight=(...args:Parameters<typeof newKnight>)=>withDistance(newKnight(...args),30);
const date='2026-10-21',time=(d=date)=>new Date(d+'T20:00:00');
async function prepare(s:State,d=date,provider?:any){const job=nextAutomaticJob(s,time(d))!;expect(job).toBeDefined();const base=reserveAutomaticJob(s,job,time(d));return finishAutomaticJob(base,base,await runAutomaticJob(base,job,provider),job,d);}
describe('Automatic content, explicit story reading',()=>{
 it('prepares and caches a page without advancing the story or touching rewards',async()=>{
  const s=createKnight('R',date),provider={generate:vi.fn()};const next=await prepare(s,date,provider);
  expect(next.living.story.beats).toEqual([]);expect(next.living.automatic!.preparedStory?.beat.stage).toBe(0);expect(totals(next)).toEqual(totals(s));expect(provider.generate).not.toHaveBeenCalled();expect(nextAutomaticJob(next,time())).toBeUndefined();expect(validate(next)).toBe(next);
  const m=new Map<string,string>(),store={getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);}};save(next,store);expect(load(store,date)).toEqual(next);
 });
 it('keeps an unread page across skipped days and dates its actual reading honestly',async()=>{
  const queued=await prepare(createKnight('R',date));expect(nextAutomaticJob(queued,time('2026-11-03'))).toBeUndefined();
  const read=readPreparedStory(queued,'2026-11-03');expect(read.living.story.beats).toHaveLength(1);expect(read.living.story.beats[0].date).toBe('2026-11-03');expect(read.living.story.beats[0].provenance.generatedAt).toBe(date);expect(read.living.story.arcs[0].started).toBe('2026-11-03');expect(readPreparedStory(read,'2026-11-03')).toBe(read);expect(validate(read)).toBe(read);
 });
 it('retains one read page per local day and requires route steps rather than ordinary deeds for subsequent pages',async()=>{
  let s=readPreparedStory(await prepare(createKnight('R',date)),date);
  s=completeQuest(s,'training',date,time());s=completeQuest(s,'chore',date,time());expect(canContinue(s,date)).toBe(false);expect(nextAutomaticJob(s,time())?.kind).not.toBe('story');
  expect(canContinue(s,'2026-10-22')).toBe(false);s=withDistance(s,34);s=await prepare(s,'2026-10-22');expect(s.living.story.beats).toHaveLength(1);expect(s.living.automatic!.preparedStory?.beat.stage).toBe(1);
  const read=readPreparedStory(s,'2026-10-27');expect(read.living.story.beats.map(b=>b.stage)).toEqual([0,1]);expect(read.living.story.beats[1].date).toBe('2026-10-27');
 });
 it('recovers an interrupted request with authored content rather than making another paid request',async()=>{
  const s=createKnight('R',date),job=nextAutomaticJob(s,time())!,pending=reserveAutomaticJob(s,job,time());
  expect(nextAutomaticJob(pending,time())).toBeUndefined();const recovered=nextAutomaticJob(pending,time(),true)!;expect(recovered.recover).toBe(true);
  const provider={generate:vi.fn()},done=finishAutomaticJob(pending,pending,await runAutomaticJob(pending,recovered,provider),recovered,date);expect(provider.generate).not.toHaveBeenCalled();expect(done.living.automatic!.preparedStory!.beat.provenance.source).toBe('authored');expect(done.living.automatic!.jobs[0].status).toBe('done');
 });
 it('merges late content without losing a deed, song, configuration or an already opened Venture',async()=>{
  const s=createKnight('R',date),job=nextAutomaticJob(s,time())!,base=reserveAutomaticJob(s,job,time()),result=await runAutomaticJob(base,job);
  const changed=completeQuest(base,'chore',date,time()),merged=finishAutomaticJob(changed,base,result,job,date);expect(merged.entries).toEqual(changed.entries);expect(totals(merged)).toEqual(totals(changed));expect(merged.living.automatic!.preparedStory).toBeDefined();
  const disabled={...changed,living:{...changed.living,settings:{...changed.living.settings,story:false}}};expect(finishAutomaticJob(disabled,base,result,job,date).living.automatic!.preparedStory).toBeUndefined();
 });
 it('preserves already assigned notices from older saves and never prepares the same daily job twice',()=>{
  const s=ensureDailyVenture(createKnight('R',date),date);delete s.living.automatic;s.living.settings.enabled=true;
  const next=ensureAutomatic(s,date);expect(next.living.automatic!.seenVentures).toContain(todaysVenture(next,date)!.assignmentId);expect(nextAutomaticJob(next,time())?.kind).toBe('story');
 });
 it('does not overwrite a completed or opened notice when a background result arrives',()=>{
  let s=ensureDailyVenture(createKnight('R',date),date);s.living.settings.enabled=true;
  const job=nextAutomaticJob(s,time())!,base=reserveAutomaticJob(s,job,time()),result={...base,ventures:base.ventures.map(v=>({...v,title:'Generated notice'}))};
  const opened=markVentureSeen(base,todaysVenture(base,date)!.assignmentId,date),merged=finishAutomaticJob(opened,base,result,job,date);expect(todaysVenture(merged,date)!.title).toBe(todaysVenture(base,date)!.title);
  const completed=completeDailyVenture(base,todaysVenture(base,date)!.assignmentId,time());expect(finishAutomaticJob(completed,base,result,job,date).ventures).toEqual(completed.ventures);
 });
 it('does not fabricate old story pages when a request completes after the date changes',async()=>{
  const s=createKnight('R',date),job=nextAutomaticJob(s,time())!,base=reserveAutomaticJob(s,job,time());const next=finishAutomaticJob(base,base,await runAutomaticJob(base,job),job,'2026-10-22');expect(next.living.story.beats).toEqual([]);expect(next.living.automatic!.preparedStory).toBeUndefined();expect(next.living.automatic!.jobs[0].status).toBe('done');
 });
});
