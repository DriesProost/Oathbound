import {describe,it,expect,vi} from 'vitest';
import {createKnight,completeQuest,totals} from '../domain';
import {continueStory,chooseStory,canContinue,validScene} from './director';
import {validate} from '../storage';
const date='2026-10-21';
const scene=()=>({title:'A neighbour at the gate',prose:'The traveller carries a letter for the miller.',canonFactsAdded:['The miller has a cousin in the village.'],hooksAdded:[],hooksResolved:[],choices:[]});
describe('Narrative continuity',()=>{
 it('persists seeded arcs, canon and one beat per local date without touching real-life truth',async()=>{
  const s=createKnight('R',date),provider={generate:vi.fn().mockResolvedValue(scene())},next=await continueStory(s,date,provider);
  expect(provider.generate).not.toHaveBeenCalled();expect(next.living.story.beats).toHaveLength(1);expect(next.living.story.beats[0].provenance.source).toBe('authored');
  expect(await continueStory(next,date,provider)).toBe(next);expect(await continueStory(next,'2026-10-22',provider)).toBe(next);expect(totals(next)).toEqual(totals(s));expect(validate(next)).toBe(next);
 });
 it('uses compact continuous context and stores accepted AI canon once',async()=>{
  const s=createKnight('R',date);s.living.settings.enabled=true;const provider={generate:vi.fn().mockResolvedValue(scene())};
  const next=await continueStory(s,date,provider);expect(next.living.story.worldFacts).toContain(scene().canonFactsAdded[0]);expect(next.living.story.beats[0].provenance.source).toBe('ai');
  const copy=JSON.parse(JSON.stringify(next));expect(await continueStory(copy,date,provider)).toBe(copy);expect(provider.generate).toHaveBeenCalledTimes(1);
  expect(provider.generate.mock.calls[0][0].context.retinue).toEqual([]);
 });
 it('rejects unsupported progression/combat fields and invented real-life claims',()=>{
  expect(validScene(scene())).toBe(true);
  for(const value of [{...scene(),renown:99},{...scene(),combatSetup:{health:900}},{...scene(),prose:'You walked 100 kilometres and earned XP.'},{...scene(),newNpc:{id:'scholar',name:'Other',role:'Changed'}}])expect(validScene(value)).toBe(false);
 });
 it('advances a complete finite arc, records a meaningful choice, and seeds another without a deadline',async()=>{
  let s=createKnight('R',date);
  for(let i=0;i<7;i++){
   const d=`2026-10-${21+i}`;s=completeQuest(s,'training',d,new Date(d+'T20:00:00'));s=completeQuest(s,'patrol',d,new Date(d+'T20:00:00'));
   s=await continueStory(s,d);
   const beat=s.living.story.beats.at(-1)!;
   if(beat.choices.length){s=chooseStory(s,beat.id,'public',d);expect(chooseStory(s,beat.id,'quiet',d)).toBe(s);}
   // Story/combat integration records a resolved confrontation; engine verifies it later.
   if(beat.combatSetup)s={...s,living:{...s.living,battles:[{id:'test',beatId:beat.id,status:'withdrawn'} as any]}};
  }
  expect(s.living.story.arcs[0].completed).toBe('2026-10-27');expect(s.living.story.choices).toHaveLength(1);expect(s.living.story.completedMysteries).toHaveLength(1);
  s=completeQuest(s,'training','2026-10-28',new Date('2026-10-28T20:00:00'));s=completeQuest(s,'patrol','2026-10-28',new Date('2026-10-28T20:00:00'));
  expect(canContinue(s,'2026-10-28')).toBe(true);s=await continueStory(s,'2026-10-28');expect(s.living.story.arcs).toHaveLength(2);expect(s.living.story.currentArcId).toBe('arc:2');
 });
});
