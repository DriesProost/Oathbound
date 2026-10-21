import {readPreparedStory} from './automatic';
import {Landscape} from './Atmosphere';
import CombatScene from './CombatScene';
import type {State} from '../model';
import {chooseStory,storyWaitingMessage,canContinue} from './director';
import {arcTemplates} from './arcs';
export default function JourneyStory({state,date,update,current}:{current?:()=>State|null;state:State;date:string;update:(s:State)=>boolean}){
 const story=state.living.story,arc=story.arcs.find(a=>a.id===story.currentArcId),beat=story.beats.at(-1);
 return <section className="living-story" aria-label="Living campaign"><span className="eyebrow">YOUR CAMPAIGN · FICTIONAL JOURNEY</span><h2>{arc?.title??arcTemplates[0].title}</h2>
 <Landscape label={story.places.find(p=>p.id===beat?.locationId)?.name} location={beat?.locationId??"forest"} weather={story.weather} dusk={story.beats.length%2===1}/><p className="story-premise">{arc?.premise??arcTemplates[0].premise}</p>
 {beat&&<article className="story-beat" key={beat.id}><h3>{beat.title}</h3><p>{beat.prose}</p><small>{beat.provenance.source==='ai'?'AI narration · saved in your campaign':'From the campaign manuscript'}</small>
 {beat.choices.length>0&&!beat.chosen&&<div className="encounter-choices">{beat.choices.map(c=><button className="secondary" key={c.id} onClick={()=>update(chooseStory(current?.()??state,beat.id,c.id,date))}>{c.label}</button>)}</div>}
 {beat.chosen&&<blockquote>{beat.choices.find(c=>c.id===beat.chosen)?.outcome}</blockquote>}
 </article>}
 {beat?.combatSetup&&<CombatScene state={state} date={date} beatId={beat.id} update={update} current={current}/>}
 <button className="secondary" disabled={!state.living.automatic?.preparedStory||!canContinue(state,date)} onClick={()=>update(readPreparedStory(current?.()??state,date))}>{!beat?'Begin the northern road':'Read the next page'}</button>
 <p className="story-cadence" role="status">{state.living.automatic?.preparedStory&&canContinue(state,date)?'A new page is ready. It will wait for you; skipping days never skips the story.':storyWaitingMessage(state,date)}</p>

 </section>;
}
export function StoryHistory({state}:{state:State}){
 const s=state.living.story;if(!s.beats.length)return null;
 return <section className="panel illuminated-chronicle" aria-label="Campaign fiction"><span className="eyebrow">THE STORY BESIDE THE FACTS</span><h2>Letters from the road</h2><p className="muted">Fictional events inspired by the campaign. Your real-world records remain separate.</p>
 {[...s.arcs].reverse().map(a=><details className="illuminated-page" key={a.id}><summary>{a.title}{a.completed?' · Concluded':''}</summary>{s.beats.filter(b=>b.arcId===a.id).map(b=><article key={b.id}><small>{b.date} · {b.provenance.source==='ai'?'AI narration':'Campaign manuscript'}</small><h3>{b.title}</h3><p>{b.prose}</p>{b.chosen&&<blockquote>{b.choices.find(c=>c.id===b.chosen)?.outcome}</blockquote>}</article>)}</details>)}
 </section>;
}
