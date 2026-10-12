import {describe,expect,it} from 'vitest';
import {createKnight,completeQuest,totals} from './domain';
import {ensureWeeklyPeriod} from './weekly';
import {configureCampaign,campaignGoals} from './campaign';
import {validate,save,load} from './storage';
const now=new Date('2026-10-12T19:00:00');
const train=(s:ReturnType<typeof createKnight>,d:string)=>completeQuest(s,'training',d,now);
describe('once-only weekly completion bonus',()=>{
 it('grants only at the target, keeps daily receipts unchanged and survives reload',()=>{
  let s=createKnight('Rowan','2026-10-05');s=train(s,'2026-10-05');s=train(s,'2026-10-06');expect(totals(s).renown).toBe(70);
  s=train(s,'2026-10-07');const c=s.weekly.commissions[0];expect(c.bonus?.reward).toEqual({renown:20,xp:{Strength:10}});expect(totals(s).renown).toBe(125);expect(s.entries.at(-1)?.reward).toEqual({renown:35,xp:{Strength:20}});
  expect(train(s,'2026-10-07')).toBe(s);s=train(s,'2026-10-08');expect(totals(s).renown).toBe(160);expect(s.weekly.commissions[0].bonus).toEqual(c.bonus);
  const values=new Map<string,string>(),store={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};save(s,store);expect(totals(load(store,'2026-10-12')!)).toEqual(totals(s));
 });
 it('does not manufacture bonuses for already completed legacy periods',()=>{
  let s=createKnight('Rowan','2026-10-05');for(const d of ['2026-10-05','2026-10-06','2026-10-07'])s=train(s,d);
  delete s.weekly.commissions[0].bonus;expect(validate(s)).toBe(s);expect(totals(ensureWeeklyPeriod(s,'2026-10-12')).renown).toBe(105);
  s=train(s,'2026-10-08');expect(s.weekly.commissions[0].bonus).toBeUndefined();expect(totals(s).renown).toBe(140);
 });
 it('preserves the active target and award through edits and disable/re-enable',()=>{
  let s=createKnight('Rowan','2026-10-05');s=train(s,'2026-10-05');s=train(s,'2026-10-06');
  const goals=campaignGoals(s.campaign,'2026-10-07').map(g=>g.id==='strength'?{...g,weeklyTarget:{metric:'sessions' as const,value:1}}:g);
  s=configureCampaign(s,goals,'2026-10-07');s=train(s,'2026-10-07');expect(s.weekly.commissions[0].target.value).toBe(3);const reward=totals(s);
  s=configureCampaign(s,goals.map(g=>g.id==='strength'?{...g,active:false}:g),'2026-10-08');s=configureCampaign(s,goals,'2026-10-08');expect(totals(s)).toEqual(reward);
  const bad=structuredClone(s);bad.weekly.commissions[0].bonus!.activityId=bad.entries[0].activityId;expect(()=>validate(bad)).toThrow();
 });
});
