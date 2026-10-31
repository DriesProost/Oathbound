import {describe,it,expect} from 'vitest';
import {createKnight,completeQuest,recordDeedStatus,confirmOath,totals} from './domain';
import {configureCampaign,campaignGoals} from './campaign';
import {taskResults,ventureResultsContext} from './taskResults';
import {ensureDailyVenture,completeDailyVenture} from './ventureDomain';
import {save,load} from './storage';
const now=new Date('2026-10-31T19:00:00'),date='2026-10-31';
const row=(s:ReturnType<typeof createKnight>,id:string)=>taskResults(s,now).rows.find(r=>r.id===id)!;
describe('Clear task outcomes',()=>{
 it('distinguishes done, explicit failure, not planned, unlogged and open today',()=>{
  let s=createKnight('R','2026-10-25');s=completeQuest(s,'chore','2026-10-25',now);s=recordDeedStatus(s,'chore','2026-10-26','not-completed',now);s=recordDeedStatus(s,'chore','2026-10-27','not-planned',now);
  expect(row(s,'chore')).toMatchObject({done:1,failed:1,notPlanned:1,unlogged:3,pending:1});
  expect(row(s,'chore').cells.map(c=>c.status)).toEqual(['done','failed','not-planned','unlogged','unlogged','unlogged','pending']);
 });
 it('never labels silence as failure or an open day as missed',()=>{
  const s=createKnight('R','2026-10-25'),r=row(s,'nutrition');expect(r.failed).toBe(0);expect(r.unlogged).toBe(6);expect(r.pending).toBe(1);
  expect(row(createKnight('R',date),'nutrition')).toMatchObject({failed:0,unlogged:0,pending:1});
 });
 it('treats unrecorded training days as flexible while preserving explicit missed sessions',()=>{
  const s=recordDeedStatus(createKnight('R','2026-10-25'),'training','2026-10-26','not-completed',now),r=row(s,'strength');expect(r).toMatchObject({failed:1,flexible:5,unlogged:0,pending:1});
 });
 it('honours historical configuration and preserves results after disabling a goal',()=>{
  let s=createKnight('R','2026-10-25');s=completeQuest(s,'chore','2026-10-25',now);s=configureCampaign(s,campaignGoals(s.campaign).map(g=>g.id==='chore'?{...g,active:false}:g),'2026-10-27');
  expect(row(s,'chore').cells.map(c=>c.status)).toEqual(['done','unlogged','inactive','inactive','inactive','inactive','inactive']);
 });
 it('never includes pre-creation, future or optional-weekend Oath failures',()=>{
  let s=createKnight('R','2026-10-29');s=configureCampaign(s,campaignGoals(s.campaign).map(g=>g.id==='temperance'?{...g,target:{metric:'oath' as const,schedule:'weekdays' as const}}:g),'2026-10-29');
  const r=row(s,'temperance');expect(r.cells.slice(0,4).every(c=>c.status==='inactive')).toBe(true);expect(r.cells.at(-1)!.status).toBe('inactive');expect(r.failed).toBe(0);
 });
 it('includes kept and broken Oaths as actual recorded outcomes',()=>{
  let s=createKnight('R','2026-10-25');s=confirmOath(s,'2026-10-26','kept',now);s=confirmOath(s,'2026-10-27','broken',now);expect(row(s,'temperance')).toMatchObject({done:1,failed:1});
 });
 it('allows historical completion to replace a failure with exactly one ordinary reward',()=>{
  const s=recordDeedStatus(createKnight('R','2026-10-25'),'chore','2026-10-26','not-completed',now),done=completeQuest(s,'chore','2026-10-26',now);
  expect(row(done,'chore')).toMatchObject({done:1,failed:0});expect(totals(done).renown-totals(s).renown).toBe(20);expect(completeQuest(done,'chore','2026-10-26',now)).toBe(done);
 });
 it('does not count optional Venture opportunities as failed tasks',()=>{
  const s=ensureDailyVenture(createKnight('R','2026-10-25'),'2026-10-25');expect(taskResults(s,now).rows.every(r=>!r.id.includes('venture'))).toBe(true);expect(taskResults(s,now).rows.every(r=>!r.failed)).toBe(true);
 });
 it('is read-only, bounded and survives persistence without changing rewards or notes',()=>{
  const s=recordDeedStatus(createKnight('R','2026-10-25'),'study','2026-10-27','not-completed',now),before=structuredClone(s);taskResults(s,now,14);expect(s).toEqual(before);expect(()=>taskResults(s,now,100)).toThrow();
  const data=new Map<string,string>(),store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};save(s,store);expect(taskResults(load(store,date)!,now)).toEqual(taskResults(s,now));
 });
});
describe('Daily Venture results context',()=>{
 it('summarises fourteen completed local dates, and never includes today or future data',()=>{
  let s=createKnight('Private name','2026-10-01');s=recordDeedStatus(s,'study','2026-10-20','not-completed',now);s=completeQuest(s,'study','2026-10-21',now);s=recordDeedStatus(s,'study',date,'not-completed',now);
  const c=ventureResultsContext(s,date),study=c.tasks.find(r=>r.goal==='study')!;expect(c.windowDays).toBe(14);expect(study.completed).toBe(1);expect(study.explicitlyFailed).toBe(1);expect(study.unlogged).toBe(12);expect(c.focusGoals).toContain('study');expect(JSON.stringify(c)).not.toContain('Private name');
 });
 it('does not interpret flexible workouts or ignored Ventures as missed targets',()=>{
  const s=ensureDailyVenture(createKnight('R','2026-10-01'),'2026-10-25'),c=ventureResultsContext(s,date);expect(c.tasks.find(r=>r.goal==='strength')).toMatchObject({unlogged:0,explicitlyFailed:0,flexibleDays:14});expect(c.completedVentures).toEqual([]);expect(c.focusGoals).toEqual([]);
 });
 it('includes only completed Venture history and no private save, body data or lyric content',()=>{
  let s=ensureDailyVenture(createKnight('Do not send','2026-10-01'),'2026-10-25');s=completeDailyVenture(s,s.ventures[0].assignmentId,new Date('2026-10-25T19:00:00'));s.world.songs=[{id:'private',title:'Secret',notes:'Private lyrics',chords:'Am',created:date,updated:date}];
  const c=ventureResultsContext(s,date);expect(c.completedVentures).toHaveLength(1);for(const secret of ['Do not send','Private lyrics','weight','measurements','deedNotes'])expect(JSON.stringify(c)).not.toContain(secret);
 });
});
