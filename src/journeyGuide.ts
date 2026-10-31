import type {State} from './model';
import {totals} from './domain';
import {routePosition} from './journey';
import {nextStoryRoute,canContinue} from './living/director';
import {routeSteps} from './walking';
/** Show the actual waiting action, including an older unanswered legacy page. */
export function currentJourneyBeat(state:State) {
 const s=state.living.story;
 return (state.living.battle?.status==='active'?s.beats.find(b=>b.id===state.living.battle!.beatId):undefined)??s.beats.find(b=>b.choices.length&&!b.chosen)??s.beats.at(-1);
}
export function journeyGuide(state:State,date:string) {
 const beat=currentJourneyBeat(state),story=state.living.story,road=routePosition(totals(state).distance),target=nextStoryRoute(state);
 if(state.living.battle?.status==='active')return {target:'quest',kind:'combat',title:'Resume your confrontation',detail:'Your saved turn is waiting. Choose your next move in the current quest.',action:'Go to confrontation'};
 if(beat?.choices.length&&!beat.chosen)return {target:'quest',kind:'reply',title:'Choose your response',detail:`“${beat.title}” is waiting for your decision.`,action:'Go to your choice'};
 if(beat?.combatSetup&&!state.living.battles.some(b=>b.beatId===beat.id&&b.status!=='active'&&(b.status!=='withdrawn'||b.opponent.alternatives.length>0)))return {target:'quest',kind:'combat',title:'A meeting awaits your response',detail:'Continue the current quest. You can choose how to approach this encounter.',action:'Go to the encounter'};
 if(state.living.automatic?.preparedStory&&canContinue(state,date))return {target:'quest',kind:'read',title:'Your next story page is ready',detail:'Open the current quest to read it. Unread pages never expire.',action:'Go to your next page'};
 if(story.beats.at(-1)?.date===date&&target.remaining===0)return {target:'journal',kind:'wait',title:'Today’s page is read',detail:'You are caught up for today. The next unlocked page can be read on another day; earlier pages are in your journal.',action:'Open your journal'};
 const nextKm=Math.min(road.next?.km??Infinity,target.remaining>0?target.km:Infinity),remaining=Math.max(0,nextKm-totals(state).distance);
 if(Number.isFinite(nextKm)&&remaining>0){const place=road.next?.km===nextKm?road.next.name:'the next story event';return {target:'board',kind:'walk',title:`${routeSteps(remaining)} steps to ${place}`,detail:'Record a patrol on the Quest Board to move along this same road.',action:'Take a patrol'};}

 return {target:'quest',kind:'wait',title:'Your next page is being prepared',detail:'Keep your place here. The current quest and earlier journal remain available.',action:'Open the current quest'};
}
