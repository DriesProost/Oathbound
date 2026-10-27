import {withDistance} from '../testFixtures/journey';
import type {State} from '../model';
import {describe,it,expect} from 'vitest';
import {createKnight as newKnight,totals,completeQuest} from '../domain';
import {continueStory} from './director';
import {startBattle,takeTurn,enemyIntent,techniqueDiscovered,techniqueUsable,combatStats,resolveWithoutCombat} from './combat';
import {techniques,enemies} from './combatContent';
import {save,load,storageKeys,validate} from '../storage';
const createKnight=(...args:Parameters<typeof newKnight>)=>withDistance(newKnight(...args),50);
const date='2026-10-21';
async function ready(){let s=createKnight('R',date);for(let i=0;i<=4;i++){const d=`2026-10-${21+i}`;s=completeQuest(s,'patrol',d,new Date(d+'T20:00:00'));s=completeQuest(s,'training',d,new Date(d+'T20:00:00'));s=await continueStory(s,d);const b=s.living.story.beats.at(-1)!;if(b.choices.length){const {chooseStory}=await import('./director');s=chooseStory(s,b.id,'public',d);}}return s;}
describe('Deterministic tactical combat',()=>{
 it('ships twelve Techniques and seven grounded enemy archetypes',()=>{expect(techniques).toHaveLength(12);expect(enemies).toHaveLength(7);expect(new Set(techniques.map(t=>t.id)).size).toBe(12);});
 it('snapshots actual attributes, telegraphs patterns and gives identical outcomes for identical actions',async()=>{
  const s=await ready(),b=startBattle(s,s.living.story.beats.at(-1)!.id,'2026-10-25');expect(enemyIntent(b.living.battle!)).toBe('heavy');
  const first=takeTurn(b,'guard');expect(first).toEqual(takeTurn(structuredClone(b),'guard'));expect(first.living.battle!.player.stamina).toBeGreaterThanOrEqual(b.living.battle!.player.stamina);expect(first.living.battle!.player.health).toBeLessThanOrEqual(b.living.battle!.player.health);expect(first.living.battle!.log.join(' ')).toContain('Guard');expect(enemyIntent(first.living.battle!)).toBe('recover');expect(validate(first)).toBe(first);
 });
 it('checks discovery, real attribute requirements, costs, enemy type and once-per-fight abilities',async()=>{
  const s=await ready(),next=startBattle(s,s.living.story.beats.at(-1)!.id,'2026-10-25'),b=next.living.battle!,half=techniques.find(t=>t.id==='half-sword')!;
  expect(techniqueDiscovered(b,half)).toBe(false);expect(takeTurn(next,'half-sword')).toBe(next);
  const trained={...b,allies:['arms','physician','scout'],levels:{...b.levels,Strength:5,Vitality:3,Endurance:3},player:{...b.player,momentum:3}};
  expect(techniqueUsable(trained,half)).toBe(true);expect(techniqueUsable({...trained,player:{...trained.player,stamina:0}},half)).toBe(false);
  const heal=techniques.find(t=>t.id==='second-wind')!;expect(techniqueUsable({...trained,used:['second-wind']},heal)).toBe(false);
  const dodge=takeTurn({...next,living:{...next.living,battle:{...trained,player:{...trained.player,health:50}}}},'scouts-step');expect(dodge.living.battle!.player.health).toBe(50);expect(dodge.living.battle!.player.momentum).toBeGreaterThan(0);
 });
 it('scales linearly with a bounded level cap, not exponential multipliers',()=>{
  const levels={Strength:1,Endurance:1,Wisdom:1,Vitality:1,Presence:1,Resolve:1};const a=combatStats(levels),b=combatStats({...levels,Vitality:5}),c=combatStats({...levels,Vitality:1000,Endurance:1000});expect(b.health-a.health).toBe(16);expect(c.health).toBe(140);expect(c.stamina).toBe(20);
 });
 it('defeat and withdrawal never remove any real-world progress or world/story history',async()=>{
  const s=await ready(),started=startBattle(s,s.living.story.beats.at(-1)!.id,'2026-10-25');let defeated:State={...started,living:{...started.living,battle:{...started.living.battle!,player:{...started.living.battle!.player,health:1}}}};
  defeated=takeTurn(defeated,'recover');expect(defeated.living.battle!.status).toBe('defeat');expect(totals(defeated)).toEqual(totals(s));expect(defeated.world).toEqual(s.world);expect(defeated.living.story).toEqual(s.living.story);expect(defeated.living.battles).toHaveLength(1);expect(takeTurn(defeated,'strike')).toBe(defeated);
 });
 it('resolves an appropriate meeting through deterministic thresholds without rewards or mandatory fighting',async()=>{
  const s=await ready(),id=s.living.story.beats.at(-1)!.id;
  expect(resolveWithoutCombat(s,id,0,'2026-10-25')).toBe(s);
  const capable={...s,oaths:{...s.oaths,'2026-10-21':{status:'kept' as const,reward:{renown:0,xp:{Presence:250}}}}};
  const next=resolveWithoutCombat(capable,id,0,'2026-10-25');expect(next.living.battle!.status).toBe('resolved');expect(totals(next)).toEqual(totals(capable));expect(startBattle(next,id,'2026-10-25')).toBe(next);
 });
 it('saves and reloads an in-progress fight and resumes the same intent without replaying a turn',async()=>{
  const s=await ready(),started=takeTurn(startBattle(s,s.living.story.beats.at(-1)!.id,'2026-10-25'),'guard');
  const m=new Map<string,string>(),store={getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);}};save(started,store);expect(m.get(storageKeys.current)).toBeTruthy();const loaded=load(store,'2026-10-25')!;expect(loaded).toEqual(started);expect(takeTurn(loaded,'strike')).toEqual(takeTurn(started,'strike'));
 });
});

describe('Persisted encounters and optional practice',()=>{
 it('keeps the snapshotted enemy independent of later content edits',async()=>{
  const s=await ready(),started=startBattle(s,s.living.story.beats.at(-1)!.id,'2026-10-25'),enemy=enemies.find(e=>e.id==='road-brigand')!,previous=enemy.power;
  try{const expected=takeTurn(started,'guard');enemy.power=previous+5;expect(takeTurn(started,'guard')).toEqual(expected);expect(validate(started)).toBe(started);}finally{enemy.power=previous;}
 });
 it('lets a withdrawn practice bout restart fully restored without erasing its attempt',async()=>{
  let s=await ready();const beat=s.living.story.beats.at(-1)!;s={...s,living:{...s.living,story:{...s.living.story,beats:s.living.story.beats.map(b=>b.id===beat.id?{...b,combatSetup:'veteran'}:b)}}};
  const first=takeTurn(startBattle(s,beat.id,'2026-10-25'),'withdraw'),next=startBattle(first,beat.id,'2026-10-26');expect(next.living.battle!.player.health).toBe(next.living.battle!.player.maxHealth);expect(next.living.battle!.id).not.toBe(first.living.battle!.id);expect(next.living.battles).toHaveLength(1);expect(validate(next)).toBe(next);expect(totals(next)).toEqual(totals(s));
 });
});
