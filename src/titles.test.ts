import {describe,it,expect} from 'vitest';
import {createKnight,totals} from './domain';
import {titles,reconcileTitles,preferTitle,displayedTitle} from './titles';
import {save,load} from './storage';
const date='2026-10-14';
function developed(){const s=createKnight('R',date);return {...s,oaths:{[date]:{status:'kept' as const,reward:{renown:3100,xp:{Wisdom:800,Resolve:800}}}}};}
describe('Emergent Orders and Titles',()=>{
 it('authors ten titles derived from real combinations rather than selecting a class',()=>{
  expect(titles).toHaveLength(10);expect(reconcileTitles(createKnight('R',date),date,'earned').world.milestones).toEqual([]);
  const next=reconcileTitles(developed(),date,'earned');expect(next.world.milestones.map(m=>m.id)).toEqual(['warden-scholar']);expect(totals(next)).toEqual(totals(developed()));
 });
 it('preserves earned titles and the preferred display after a correction and reload',()=>{
  let s=reconcileTitles(developed(),date,'earned');s=preferTitle(s,'warden-scholar');s={...s,oaths:{}};
  expect(reconcileTitles(s,'2027-01-01','earned')).toBe(s);expect(displayedTitle(s)).toBe('Warden-Scholar');
  const data=new Map<string,string>(),store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};save(s,store);expect(load(store,date)?.world.preferredTitle).toBe('warden-scholar');
 });
 it('does not allow an unearned title or grant rewards for choosing one',()=>{
  const s=reconcileTitles(developed(),date,'earned');expect(preferTitle(s,'long-road')).toBe(s);expect(totals(preferTitle(s,'warden-scholar'))).toEqual(totals(s));expect(preferTitle(preferTitle(s,'warden-scholar'),null).world.preferredTitle).toBeNull();
 });
});
