import {describe,it,expect} from 'vitest';
import {createKnight} from './domain';
import {withDistance} from './testFixtures/journey';
import {journeyGuide,currentJourneyBeat} from './journeyGuide';
import {continueStory,chooseStory} from './living/director';
import {startBattle,takeTurn} from './living/combat';
import {nextAutomaticJob,reserveAutomaticJob,runAutomaticJob,finishAutomaticJob,readPreparedStory} from './living/automatic';
const date='2026-10-31';
async function confrontation(){let s=withDistance(createKnight('R','2026-10-01'),120);for(let i=0;i<5;i++){const d=`2026-10-${25+i}`;s=await continueStory(s,d);const b=s.living.story.beats.at(-1)!;if(b.choices.length)s=chooseStory(s,b.id,'public',d);}return s;}
describe('One clear next Journey action',()=>{
 it('points a new knight towards the next actual route place',()=>{const s=createKnight('R',date);expect(journeyGuide(s,date)).toMatchObject({kind:'walk',action:'Take a patrol'});expect(journeyGuide(s,date).title).toContain('Old Mill');});
 it('puts an unread ready page ahead of more walking',async()=>{let s=withDistance(createKnight('R',date),30);const now=new Date(date+'T19:00:00'),job=nextAutomaticJob(s,now)!;s=reserveAutomaticJob(s,job,now);s=finishAutomaticJob(s,s,await runAutomaticJob(s,job),job,date);expect(journeyGuide(s,date).kind).toBe('read');expect(s.living.story.beats).toEqual([]);});
 it('directs the player to an unanswered choice, including an older imported page',async()=>{const s=await confrontation(),choice=s.living.story.beats.find(b=>b.choices.length)!;delete choice.chosen;expect(journeyGuide(s,date).kind).toBe('reply');expect(currentJourneyBeat(s)!.id).toBe(choice.id);});
 it('directs pending and active combat to the same current quest',async()=>{const s=await confrontation();expect(journeyGuide(s,date).kind).toBe('combat');const active=startBattle(s,s.living.story.beats.at(-1)!.id,date);expect(journeyGuide(active,date).title).toContain('Resume');expect(currentJourneyBeat(active)!.id).toBe(active.living.battle!.beatId);});
 it('does not send a resolved confrontation back into combat',async()=>{let s=await confrontation();s=takeTurn(startBattle(s,s.living.story.beats.at(-1)!.id,date),'withdraw');expect(journeyGuide(s,date).kind).not.toBe('combat');});
 it('describes the daily reading limit without advancing or dropping the saved page',async()=>{let s=withDistance(createKnight('R',date),120);s=await continueStory(s,date);const before=structuredClone(s);expect(journeyGuide(s,date).kind).toBe('wait');expect(s).toEqual(before);});
 it('uses the next story milestone rather than the farther destination when it is closer',async()=>{const s=await continueStory(withDistance(createKnight('R','2026-10-01'),30),'2026-10-30');expect(journeyGuide(s,date).title).toContain('next story event');});
});
