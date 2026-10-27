import {readPreparedStory} from './automatic';
import CombatScene from './CombatScene';
import type {State} from '../model';
import {chooseStory,storyWaitingMessage,canContinue,nextStoryRoute} from './director';
import {arcTemplates} from './arcs';
import {routeSteps} from '../walking';
function Prose({text}:{text:string}) {
 const split=text.length>650?(text.lastIndexOf('. ',650)>100?text.lastIndexOf('. ',650)+1:text.lastIndexOf(' ',650)):0;
 return <>{split>0?<><p>{text.slice(0,split)}</p><details className="story-more"><summary>Read the full scene</summary><p>{text.slice(split).trim()}</p></details></>:<p>{text}</p>}</>;
}
export default function JourneyStory({state,date,update,current}:{current?:()=>State|null;state:State;date:string;update:(s:State)=>boolean}) {
 const story=state.living.story,arc=story.arcs.find(a=>a.id===story.currentArcId),beat=story.beats.at(-1),target=nextStoryRoute(state);
 const previous=story.beats.filter(b=>b.arcId===arc?.id).at(-2),ready=!!state.living.automatic?.preparedStory&&canContinue(state,date);
 return <section className="living-story" aria-label="Current journey quest">
 <span className="eyebrow">{beat?(arc?.route?`STORY QUEST · PICKED UP AT ${arc.route.pickupName.toUpperCase()}`:'YOUR ONGOING STORY'):'ALONG THIS ROAD'}</span>
 <h3>{arc?.title??(target.remaining===0?arcTemplates[0].title:'Your next story quest')}</h3>
 {beat?<>{arc?.mystery&&!arc.completed&&<p className="quest-objective"><strong>Your task:</strong> {arc.mystery}</p>}<p className="quest-progress">Page {beat.stage+1} of 7{arc?.completed?' · Complete':''}</p>
 {previous&&<details className="story-recap"><summary>Previously: {previous.title}</summary><Prose text={previous.prose}/>{previous.chosen&&<p>Your choice: {previous.choices.find(c=>c.id===previous.chosen)?.outcome}</p>}</details>}
 <article className="story-beat" key={beat.id}><h4>{beat.title}</h4><Prose text={beat.prose}/>
 {beat.choices.length>0&&!beat.chosen&&<div className="encounter-choices">{beat.choices.map(c=><button className="secondary" key={c.id} onClick={()=>update(chooseStory(current?.()??state,beat.id,c.id,date))}>{c.label}</button>)}</div>}
 {beat.chosen&&<p className="chosen-response"><strong>Your choice:</strong> {beat.choices.find(c=>c.id===beat.chosen)?.outcome}</p>}
 </article>{beat.combatSetup&&<CombatScene state={state} date={date} beatId={beat.id} update={update} current={current}/>}</>:null}
 {(beat||ready)&&<button className="secondary" disabled={!ready} onClick={()=>update(readPreparedStory(current?.()??state,date))}>{!beat?'Begin the northern road':arc?.completed?'Pick up the next story quest':'Read the next page'}</button>}
 <p className="story-cadence" role="status">{ready?'Your next page is ready. Read it when you like; it never expires.':storyWaitingMessage(state,date)}</p>
 {!ready&&target.remaining>0&&<small>Next event at {routeSteps(target.km)} total route steps.</small>}
 </section>;
}
export function StoryHistory({state}:{state:State}) {
 const s=state.living.story;if(!s.beats.length)return null;
 return <section className="journey-story" aria-label="Journey quest journal"><h3>Story quests</h3>
 {[...s.arcs].reverse().map(a=><details className="illuminated-page" key={a.id}><summary>{a.title} · {a.completed?'Complete':'In progress'}</summary>{s.beats.filter(b=>b.arcId===a.id).map(b=><article key={b.id}><small>Page {b.stage+1} · {b.date}</small><h4>{b.title}</h4><p>{b.prose}</p>{b.chosen&&<blockquote>{b.choices.find(c=>c.id===b.chosen)?.outcome}</blockquote>}{state.living.battles.filter(f=>f.beatId===b.id).map(f=><details key={f.id}><summary>Confrontation: {f.opponent.name} · {f.status}</summary><ol>{f.log.map((l,i)=><li key={i}>{l}</li>)}</ol></details>)}</article>)}</details>)}
 </section>;
}
