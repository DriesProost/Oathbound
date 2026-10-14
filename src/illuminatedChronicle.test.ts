import {describe,it,expect} from 'vitest';
import {createKnight,completeQuest,confirmOath,totals} from './domain';
import {reconcileChronicle,weeklyPage} from './illuminatedChronicle';
import {save,load} from './storage';
const time=(d:string)=>new Date(d+'T19:00:00');
describe('Illuminated weekly pages',()=>{
 it('records only actual completed weeks with exact facts and neutral quiet copy',()=>{
  let s=createKnight('R','2026-10-05');s=completeQuest(s,'patrol','2026-10-06',time('2026-10-06'));s=confirmOath(s,'2026-10-07','kept',time('2026-10-07'));
  expect(reconcileChronicle(s,'2026-10-11')).toBe(s);const next=reconcileChronicle(s,'2026-10-12');expect(next.world.pages).toHaveLength(1);
  const page=next.world.pages[0];expect(page.narrative).toContain('quiet record');expect(page.narrative).toContain('1 journey');expect(page.narrative).toContain('1 Oath');
  expect(page.highlights.find(h=>h.label==='Renown earned')?.value).toBe('70');expect(page.highlights.find(h=>h.label==='Training sessions')?.value).toBe('0');expect(totals(next)).toEqual(totals(s));
 });
 it('does not invent pages for unvisited empty weeks or ignored Ventures',()=>{const s=createKnight('R','2026-01-01');expect(reconcileChronicle(s,'2026-10-14')).toBe(s);});
 it('patches corrected facts in place, preserves unrelated pages, and persists the correction',()=>{
  let s=confirmOath(createKnight('R','2026-10-05'),'2026-10-06','kept',time('2026-10-06'));
  s=completeQuest(s,'patrol','2026-10-13',time('2026-10-13'));s=reconcileChronicle(s,'2026-10-19');
  const [page, unrelated]=s.world.pages;
  const corrected=confirmOath(s,'2026-10-06','broken',time('2026-10-19'));
  expect(corrected.world.pages[0]).toMatchObject({id:page.id,start:page.start,end:page.end});
  expect(corrected.world.pages[0].highlights.find(h=>h.label==='Oaths kept')?.value).toBe('0');
  expect(corrected.world.pages[0].highlights.find(h=>h.label==='Renown earned')?.value).toBe('0');
  expect(corrected.world.pages[0].narrative).not.toContain('Oath was');expect(corrected.world.pages[1]).toBe(unrelated);
  const restored=confirmOath(corrected,'2026-10-06','kept',time('2026-10-19'));
  expect(restored.world.pages[0]).toEqual(page);
  const data=new Map<string,string>(),store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
  save(corrected,store);expect(load(store,'2026-10-19')?.world.pages).toEqual(corrected.world.pages);
 });
 it('keeps snapshots stable on ordinary reconciliation and config changes',()=>{
  let s=confirmOath(createKnight('R','2026-10-05'),'2026-10-06','kept',time('2026-10-06'));s=reconcileChronicle(s,'2026-10-12');
  const changed={...s,weekly:{...s.weekly,weekStartsOn:0}};
  expect(reconcileChronicle(changed,'2026-10-14').world.pages.find(p=>p.id===s.world.pages[0].id)).toBe(s.world.pages[0]);
 });
 it('corrects later cumulative level crossings and historical deed additions only where facts change',()=>{
  let s=createKnight('R','2026-10-05');
  for(const d of ['2026-10-05','2026-10-06','2026-10-07','2026-10-13'])s=confirmOath(s,d,'kept',time(d));
  s=reconcileChronicle(s,'2026-10-19');
  expect(s.world.pages[1].highlights.find(h=>h.label==='Attribute level-ups')?.value).toContain('Resolve');
  const corrected=confirmOath(s,'2026-10-06','broken',time('2026-10-19'));
  expect(corrected.world.pages[1].highlights.find(h=>h.label==='Attribute level-ups')?.value).toBe('None recorded');
  const added=completeQuest(corrected,'patrol','2026-10-07',time('2026-10-19'));
  expect(added.world.pages[0].highlights.find(h=>h.label==='Journey kilometres')?.value).toBe('3');
 });
 it('includes weekly bonuses, reached ranks, levels and landmarks without duplicating receipts',()=>{
  let s=createKnight('R','2026-10-05');for(const day of ['2026-10-05','2026-10-06','2026-10-07'])s=completeQuest(s,'training',day,time(day));
  s=completeQuest(s,'patrol','2026-10-07',time('2026-10-07'));s={...s,entries:s.entries.map(e=>e.goalId==='walking'?{...e,distance:9}:e)};
  const page=weeklyPage(s,'2026-10-05');expect(page.highlights.find(h=>h.label==='Renown earned')?.value).toBe(String(totals(s).renown));expect(page.narrative).toContain('Old Mill');
 });
});
