import {describe,it,expect} from 'vitest';
import {createKnight,completeQuest,totals} from './domain';
import {activeChapter,reconcileChapters} from './chapters';
import {synchronizeWorld} from './worldProgression';
import {detectFeedback} from './feedback/events';
const date='2026-10-14';
function travelled(km:number){const s=completeQuest(createKnight('R',date),'patrol',date,new Date(date+'T19:00:00'));return {...s,entries:s.entries.map(e=>({...e,distance:km}))};}
describe('Campaign Chapters',()=>{
 it('opens Chapter I without deadlines and follows the existing road',()=>{const s=createKnight('R',date);expect(activeChapter(s,date)?.id).toBe('oakhaven');expect(reconcileChapters(travelled(29.9),date,'earned').world.pages).toEqual([]);});
 it('closes once, snapshots a chapter page and song, and adds no rewards',()=>{
  const before=travelled(30),next=synchronizeWorld(before,date);expect(next.world.milestones.filter(m=>m.kind==='chapter')).toHaveLength(1);expect(next.world.pages.filter(p=>p.kind==='chapter')).toHaveLength(1);
  expect(next.world.milestones.some(m=>m.kind==='song'&&m.id==='oakhaven-lamps')).toBe(true);expect(next.world.milestones.some(m=>m.id==='mara-key')).toBe(true);expect(totals(next)).toEqual(totals(before));
  expect(reconcileChapters(next,'2027-01-01','earned')).toBe(next);expect(activeChapter(next,date)).toBeUndefined();
 });
 it('coordinates closing feedback ahead of Keep, arrivals and Relics without reload replay',()=>{
  const before=travelled(30),after=synchronizeWorld(before,date),events=detectFeedback(before,after,'deed');expect(events[0].kind).toBe('chapter');expect(detectFeedback(after,structuredClone(after),'deed')).toEqual([]);
 });
 it('records old route completion as discovered today rather than fabricating a date',()=>{
  const before=travelled(100),after=reconcileChapters(before,'2026-10-20','discovered');expect(after.world.milestones.find(m=>m.kind==='chapter')).toMatchObject({date:'2026-10-20',provenance:'discovered'});
 });
});
