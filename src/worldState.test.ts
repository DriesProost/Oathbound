import {describe,it,expect} from 'vitest';
import {createKnight,completeQuest,totals} from './domain';
import {restorations,reconcileRestoration} from './worldState';
import {synchronizeWorld} from './worldProgression';
import {detectFeedback,priority} from './feedback/events';
import {save,load} from './storage';
const date='2026-10-14';
function road(km:number){const s=completeQuest(createKnight('R',date),'patrol',date,new Date(date+'T19:00:00'));return {...s,entries:s.entries.map(e=>({...e,distance:km}))};}
describe('The Grey Host and coordinated world progression',()=>{
 it('restores five authored places only through accumulated progress',()=>{
  expect(restorations).toHaveLength(5);expect(reconcileRestoration(createKnight('R',date),date,'earned').world.milestones).toEqual([]);
  const s=synchronizeWorld(road(30),date);expect(s.world.milestones.filter(m=>m.kind==='restoration')).toHaveLength(4);
 });
 it('never regresses, deducts rewards or turns a broken Oath into an enemy',()=>{
  const before=road(30),after=synchronizeWorld(before,date);expect(totals(after)).toEqual(totals(before));
  const inactive={...after,oaths:{[date]:{status:'broken' as const,reward:null}}};const next=synchronizeWorld(inactive,'2027-01-01');
  expect(next.world.milestones.filter(m=>m.kind==='restoration')).toEqual(after.world.milestones.filter(m=>m.kind==='restoration'));expect(totals(next)).toEqual(totals(inactive));
 });
 it('coordinates one action in rank/chapter/world/Keep/level/Relic/Title/Venture order',()=>{
  expect(['rank','chapter','restoration','keep','level','relic','title','venture','deed'].map(k=>priority[k as keyof typeof priority])).toEqual([...['rank','chapter','restoration','keep','level','relic','title','venture','deed'].map(k=>priority[k as keyof typeof priority])].sort((a,b)=>a-b));
  const before=road(30),after=synchronizeWorld(before,date),events=detectFeedback(before,after,'deed');expect(events.some(e=>e.kind==='restoration')).toBe(true);expect(events[0].kind).toBe('chapter');expect(detectFeedback(after,structuredClone(after),'deed')).toEqual([]);
 });
 it('round-trips all integrated records without replaying discoveries',()=>{
  const s=synchronizeWorld(road(30),date,'discovered'),data=new Map<string,string>(),store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};save(s,store);const loaded=load(store,date)!;
  expect(loaded).toEqual(s);expect(synchronizeWorld(loaded,date,'discovered')).toBe(loaded);expect(detectFeedback(s,loaded,'deed')).toEqual([]);
 });
});
