import {describe,it,expect} from 'vitest';
import {createKnight,completeQuest,totals} from './domain';
import {configuredQuests,configureCampaign,campaignGoals} from './campaign';
import {load,save,storageKeys,validate} from './storage';
const date='2026-10-21',now=new Date(date+'T20:00:00');
const memory=()=>{const m=new Map<string,string>();return {getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);}};};
describe('A chore a day',()=>{
 it('is an ordinary nonspecific daily deed with its own once-per-day reward slot',()=>{
  const s=createKnight('R',date),q=configuredQuests(s,date).find(q=>q.id==='chore')!;expect(q.name).toBe('A chore a day');expect(q.description).toContain('of your choice');
  const done=completeQuest(s,'chore',date,now);expect(totals(done).renown).toBe(20);expect(totals(done).xp.Resolve).toBe(10);expect(completeQuest(done,'chore',date,now)).toBe(done);
  const training=completeQuest(done,'training',date,now);expect(totals(training).renown).toBe(55);expect(training.entries.map(e=>e.goalId)).toEqual(['chore','strength']);expect(validate(training)).toBe(training);
 });
 it('has no missed-day penalty and can be disabled normally',()=>{
  const s=createKnight('R',date),later=completeQuest(s,'chore','2026-10-23',new Date('2026-10-23T20:00:00'));expect(totals(later).renown).toBe(20);
  const off=configureCampaign(s,campaignGoals(s.campaign,date).map(g=>g.id==='chore'?{...g,active:false}:g),date);expect(completeQuest(off,'chore',date,now)).toBe(off);
 });
 it('migrates v6 with an exact backup and a new current-date goal revision, preserving all old data',()=>{
  const s=completeQuest(createKnight('R','2026-10-01'),'training','2026-10-02',new Date('2026-10-02T20:00:00'));
  const old={...s,version:6,campaign:{revisions:s.campaign.revisions.map(r=>({...r,goals:r.goals.filter(g=>g.id!=='chore')}))}};
  const store=memory(),raw=JSON.stringify(old,null,2);store.setItem(storageKeys.v6,raw);const next=load(store,date)!;
  expect(next.version).toBe(7);expect(store.getItem(storageKeys.choreBackup)).toBe(raw);expect(store.getItem(storageKeys.v6)).toBe(raw);expect(next.campaign.revisions.slice(0,old.campaign.revisions.length)).toEqual(old.campaign.revisions);expect(next.campaign.revisions.at(-1)!.effectiveDate).toBe(date);expect(next.entries).toEqual(old.entries);expect(next.world).toEqual(old.world);expect(next.living).toEqual(old.living);expect(next.weight).toEqual(old.weight);expect(next.oaths).toEqual(old.oaths);expect(next.ventures).toEqual(old.ventures);expect(totals(next)).toEqual(totals(s));expect(configuredQuests(next,'2026-10-02').some(q=>q.id==='chore')).toBe(false);expect(configuredQuests(next,date).some(q=>q.id==='chore')).toBe(true);save(next,store);expect(load(store,date)).toEqual(next);
 });
 it('never commits when backup fails or falls back from a corrupt v7 save',()=>{
  const s=createKnight('R',date),store=memory();store.setItem(storageKeys.v6,JSON.stringify({...s,version:6}));expect(()=>load({getItem:store.getItem,setItem:()=>{throw Error('quota');}},date)).toThrow('quota');expect(store.getItem(storageKeys.current)).toBeNull();store.setItem(storageKeys.current,'{bad');expect(()=>load(store,date)).toThrow();
 });
});
