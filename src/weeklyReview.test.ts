import {describe,expect,it} from 'vitest';
import {weeklyReview} from './weeklyReview';
import {createKnight,completeQuest,recordDeedStatus,totals,confirmOath} from './domain';
import {configureCampaign,campaignGoals} from './campaign';
const now=new Date('2026-10-12T19:00:00');
describe('weekly outcome review',()=>{
 it('separates completed, explicitly failed, rest and unlogged without modifying history',()=>{
  let s=createKnight('Rowan','2026-10-05');s=completeQuest(s,'training','2026-10-06',now);
  s=recordDeedStatus(s,'training','2026-10-07','not-completed',now);s=recordDeedStatus(s,'training','2026-10-08','not-planned',now);
  const before=structuredClone(s),progress=totals(s);const review=weeklyReview(s,'2026-10-05',now);
  expect(review.rows.find(r=>r.id==='strength')).toMatchObject({done:1,failed:1,rest:1,unlogged:0,flexible:4});
  expect(s).toEqual(before);expect(totals(s)).toEqual(progress);expect(review.rows.some(r=>r.id==='weight')).toBe(false);
 });
 it('later completion replaces a failed note and earns the normal reward once',()=>{
  const s=recordDeedStatus(createKnight('Rowan','2026-10-05'),'training','2026-10-06','not-completed',now);
  const next=completeQuest(s,'training','2026-10-06',now);const review=weeklyReview(next,'2026-10-05',now);
  expect(review.rows.find(r=>r.id==='strength')).toMatchObject({done:1,failed:0});expect(totals(next).renown).toBe(35);
  expect(completeQuest(next,'training','2026-10-06',now)).toBe(next);
 });
 it('preserves receipts when a goal is disabled and excludes dates before creation or future confirmation',()=>{
  let s=createKnight('Rowan','2026-10-12');s=completeQuest(s,'training','2026-10-12',now);
  s=configureCampaign(s,campaignGoals(s.campaign,'2026-10-12').map(g=>({...g,active:false})),'2026-10-12');
  expect(weeklyReview(s,'2026-10-12',now).rows).toHaveLength(1);
  expect(weeklyReview(s,'2026-10-12',now).rows[0]).toMatchObject({done:1,failed:0,unlogged:0});
  expect(weeklyReview(createKnight('Rowan','2026-10-12'),'2026-10-12',new Date('2026-10-12T10:00:00')).rows.some(r=>r.id==='nutrition')).toBe(false);
 });
 it('limits weeks across a year boundary and counts only confirmed Oath outcomes',()=>{
  const t=new Date('2026-01-05T19:00:00');let s=createKnight('Rowan','2025-12-28');
  s=completeQuest(s,'training','2025-12-28',t);s=completeQuest(s,'training','2026-01-01',t);
  s=confirmOath(s,'2026-01-01','kept',t);s=confirmOath(s,'2026-01-02','broken',t);
  const review=weeklyReview(s,'2025-12-29',t);expect(review.end).toBe('2026-01-04');expect(review.rows.find(r=>r.id==='strength')?.done).toBe(1);
  expect(review.kept).toBe(1);expect(review.broken).toBe(1);
 });
});
