import {describe,it,expect} from 'vitest';
import {createKnight,completeQuest,confirmOath} from '../domain';
import {ensureWeeklyPeriod} from '../weekly';
import {load,save,storageKeys,migrate} from '../storage';
const date='2026-10-21';
const memory=()=>{const m=new Map<string,string>();return {getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);}};};
describe('Living Campaign migration',()=>{
 it('backs up exact v5 bytes and preserves every existing campaign field without inventing story history',()=>{
  let s=createKnight('Rowan','2026-10-01');s=completeQuest(s,'training','2026-10-02',new Date('2026-10-02T20:00:00'));s=confirmOath(s,'2026-10-02','kept',new Date('2026-10-02T20:00:00'));
  s=ensureWeeklyPeriod(s,date);const {living:_living,...base}=s,old={...base,version:5},raw=JSON.stringify(old,null,2),store=memory();store.setItem(storageKeys.v5,raw);
  const next=load(store,date)!;const {living,version,...rest}=next;const {version:_version,...original}=old;
  expect(rest).toEqual(original);expect(version).toBe(7);expect(living.story.beats).toEqual([]);expect(living.settings.enabled).toBe(false);expect(store.getItem(storageKeys.livingBackup)).toBe(raw);expect(store.getItem(storageKeys.v5)).toBe(raw);
  save(next,store);expect(load(store,date)).toEqual(next);expect(migrate(next,date)).toBe(next);
 });
 it('never commits a migration when backup fails, and never masks corrupt v6 with v5',()=>{
  const {living:_living,...s}=createKnight('R',date),store=memory();store.setItem(storageKeys.v5,JSON.stringify({...s,version:5}));
  expect(()=>load({getItem:store.getItem,setItem:()=>{throw Error('quota');}},date)).toThrow('quota');expect(store.getItem(storageKeys.current)).toBeNull();
  store.setItem(storageKeys.current,'{bad');expect(()=>load(store,date)).toThrow();
 });
});
