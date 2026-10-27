import {describe,it,expect,vi} from 'vitest';
import {createKnight,completeQuest,totals} from './domain';
import {landmarks,routePosition,residentStop,storyRouteKm} from './journey';
import {withDistance} from './testFixtures/journey';
import {continueStory,canContinue,chooseStory,nextStoryRoute} from './living/director';
import {nextAutomaticJob,reserveAutomaticJob,runAutomaticJob,finishAutomaticJob,readPreparedStory} from './living/automatic';
import {startBattle,takeTurn} from './living/combat';
import {reconcileRetinue,retinue} from './retinue';
import {validate,save,load} from './storage';
import {detectFeedback} from './feedback/events';
const date='2026-10-27',time=(d=date)=>new Date(d+'T19:00:00');
describe('One step-driven Journey',()=>{
 it('extends the original route with twelve unique, ordered, authored destinations',()=>{
  expect(landmarks.slice(0,4).map(l=>[l.id,l.km])).toEqual([['keep',0],['mill',9],['inn',21],['oakhaven',30]]);
  expect(landmarks).toHaveLength(16);expect(new Set(landmarks.map(l=>l.id)).size).toBe(16);
  landmarks.forEach((l,i)=>{if(i)expect(l.km).toBeGreaterThan(landmarks[i-1].km);expect(l.story.join(' ').length).toBeGreaterThan(100);expect(l.teaser).toBeTruthy();});
  expect(landmarks.at(-1)!.km).toBe(750);
 });
 it('continues beyond Oakhaven and keeps every milestone boundary honest',()=>{
  for(const [i,l] of landmarks.entries()){
   const at=routePosition(l.km);expect(at.current.id).toBe(l.id);expect(at.next?.id).toBe(landmarks[i+1]?.id);
   if(i)expect(routePosition(l.km-.001).next?.id).toBe(l.id);
   expect(at.stops).toContain(l);expect(at.stops.length).toBeLessThanOrEqual(4);
  }
  expect(routePosition(32).next!.id).toBe('watchtower');expect(routePosition(1000).remaining).toBe(0);
 });
 it('never starts a quest from age, Renown, attribute levels or ordinary chores',async()=>{
  let s=createKnight('R','2026-01-01');s.oaths[date]={status:'kept',reward:{renown:10000,xp:{Strength:5000,Wisdom:5000}}};
  s=completeQuest(s,'chore',date,time());s=completeQuest(s,'training',date,time());s.living.settings.enabled=true;const provider={generate:vi.fn()};
  expect(canContinue(s,date)).toBe(false);expect(await continueStory(s,date,provider)).toBe(s);expect(provider.generate).not.toHaveBeenCalled();expect(nextAutomaticJob(s,time())?.kind).not.toBe('story');
  expect(canContinue(withDistance(s,29.999),date)).toBe(false);expect(canContinue(withDistance(s,30),date)).toBe(true);
 });
 it('requires the next step threshold even after many ordinary deeds',async()=>{
  let s=await continueStory(withDistance(createKnight('R',date),30),date);
  s=completeQuest(s,'chore','2026-10-28',time('2026-10-28'));s=completeQuest(s,'training','2026-10-28',time('2026-10-28'));
  expect(canContinue(s,'2026-10-28')).toBe(false);expect(nextStoryRoute(s).remaining).toBe(4);
  expect(canContinue(withDistance(s,34),'2026-10-28')).toBe(true);
 });
 it('keeps choices and confrontation in order after one large patrol, with one page per day',async()=>{
  let s=withDistance(createKnight('R','2026-10-01'),100),before=totals(s);
  for(let stage=0;stage<7;stage++){
   const d=`2026-10-${21+stage}`;s=await continueStory(s,d);const beat=s.living.story.beats.at(-1)!;
   expect(beat.stage).toBe(stage);expect(await continueStory(s,d)).toBe(s);
   if(beat.choices.length){expect(canContinue(s,'2026-11-01')).toBe(false);s=chooseStory(s,beat.id,'quiet',d);}
   if(beat.combatSetup){expect(stage).toBe(4);expect(canContinue(s,'2026-11-01')).toBe(false);s=takeTurn(startBattle(s,beat.id,d),'withdraw');}
  }
  expect(s.living.story.beats).toHaveLength(7);expect(s.living.story.choices).toHaveLength(1);expect(s.living.battles).toHaveLength(1);expect(totals(s)).toEqual(before);expect(validate(s)).toBe(s);
 });
 it('does not reveal combat until its own route threshold and page are reached',async()=>{
  let s=withDistance(createKnight('R','2026-10-01'),41);
  for(let i=0;i<4;i++){const d=`2026-10-${21+i}`;s=await continueStory(s,d);const b=s.living.story.beats.at(-1)!;if(b.choices.length)s=chooseStory(s,b.id,'public',d);}
  expect(s.living.story.beats.some(b=>b.combatSetup)).toBe(false);expect(canContinue(s,date)).toBe(false);
  s=await continueStory(withDistance(s,45),date);expect(s.living.story.beats.at(-1)!.combatSetup).toBe('road-brigand');
 });
 it('preserves an already prepared page across upgrade, correction, inactivity and offline reload',async()=>{
  const base=withDistance(createKnight('R',date),30),job=nextAutomaticJob(base,time())!,pending=reserveAutomaticJob(base,job,time());
  const queued=finishAutomaticJob(pending,pending,await runAutomaticJob(pending,job),job,date);delete queued.living.automatic!.preparedStory!.arc.route;const corrected=withDistance(queued,0);
  const data=new Map<string,string>(),store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
  save(corrected,store);const restored=load(store,'2026-11-15')!;expect(restored.living).toEqual(corrected.living);expect(restored.entries).toEqual(corrected.entries);expect(restored.weekly.commissions.slice(0,corrected.weekly.commissions.length)).toEqual(corrected.weekly.commissions);expect(nextAutomaticJob(restored,time('2026-11-15'))).toBeUndefined();
  const network=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('offline'));
  try{const read=readPreparedStory(restored,'2026-11-15');expect(read.living.story.beats).toHaveLength(1);expect(read.living.story.beats[0].date).toBe('2026-11-15');expect(read.living.story.arcs[0].route).toBeUndefined();expect(network).not.toHaveBeenCalled();expect(totals(read)).toEqual(totals(restored));}finally{network.mockRestore();}
 });
 it('keeps residents earned under earlier rules and introduces new ones only from route milestones',()=>{
  const base=createKnight('R',date),far=withDistance(base,120),arrived=reconcileRetinue(far,date,'earned');
  expect(arrived.world.milestones.filter(m=>m.kind==='retinue')).toHaveLength(7);
  const corrected=withDistance(arrived,0);expect(reconcileRetinue(corrected,'2029-01-01','earned').world.milestones).toEqual(arrived.world.milestones);
  for(const member of retinue){const stop=residentStop(member.id)!;expect(reconcileRetinue(withDistance(base,stop.km-.001),date,'earned').world.milestones.some(m=>m.kind==='retinue'&&m.id===member.id)).toBe(false);}
 });
 it('coordinates new arrivals without adding a reward or replaying feedback',()=>{
  const before=withDistance(createKnight('R','2026-10-26'),44),after=completeQuest(before,'patrol',date,time());
  expect(detectFeedback(before,after,'deed').filter(e=>e.kind==='landmark').map(e=>e.name)).toEqual(['Northwatch Tower']);
  expect(detectFeedback(after,structuredClone(after),'quiet')).toEqual([]);expect(totals(after).renown-totals(before).renown).toBe(30);expect(totals(after).xp.Endurance-totals(before).xp.Endurance).toBe(15);
 });
 it('assigns successive quests farther along the road',()=>{
  for(let i=0;i<10;i++){expect(storyRouteKm(i,6)).toBeGreaterThan(storyRouteKm(i,0));expect(storyRouteKm(i+1,0)).toBeGreaterThan(storyRouteKm(i,6));}
 });
 it('continues through all six connected authored quests before the open road, preserving every ending',async()=>{
  let s=createKnight('R','2026-09-01');
  for(let i=0;i<43;i++){
   const d=new Date(Date.UTC(2026,8,i+1)).toISOString().slice(0,10);
   s=withDistance(s,storyRouteKm(Math.floor(i/7),i%7));s=await continueStory(s,d);
   const b=s.living.story.beats.at(-1)!;expect(b.stage).toBe(i%7);
   if(b.choices.length)s=chooseStory(s,b.id,'quiet',d);
   if(b.combatSetup)s=takeTurn(startBattle(s,b.id,d),'withdraw');
  }
  expect(s.living.story.arcs.map(a=>a.template)).toEqual(['empty-watchtower','winter-ledger','noon-bell','highpass-survey','wandering-packet','answering-lanterns','open-road']);
  expect(s.living.story.arcs.filter(a=>a.completed)).toHaveLength(6);expect(s.living.story.choices).toHaveLength(6);expect(s.living.story.beats).toHaveLength(43);expect(validate(s)).toBe(s);
 });

 it('snapshots new pickup facts while leaving legacy arcs valid without fabricated route metadata',async()=>{
  const s=await continueStory(withDistance(createKnight('R',date),30),date),place=landmarks.find(p=>p.id==='oakhaven')!,name=place.name;
  const data=new Map<string,string>(),store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
  try{place.name='A later authored name';save(s,store);expect(load(store,date)!.living.story.arcs[0].route).toEqual({pickupId:'oakhaven',pickupName:'Oakhaven',startKm:30});}finally{place.name=name;}
  const legacy=structuredClone(s);delete legacy.living.story.arcs[0].route;expect(validate(legacy)).toBe(legacy);
  const invalid=structuredClone(s);invalid.living.story.arcs[0].route!.startKm=-1;expect(()=>validate(invalid)).toThrow();
 });

});
