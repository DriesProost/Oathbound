import {Landscape} from './Atmosphere';
import CombatScene from './CombatScene';
import {useRef,useState} from 'react';
import type {State} from '../model';
import {canContinue,continueStory,chooseStory} from './director';
import {JsonNarrativeProvider} from './provider';
import {dayKey} from '../calendar';
import {arcTemplates} from './arcs';
export default function JourneyStory({state,date,update}:{state:State;date:string;update:(s:State)=>boolean}){
 const [busy,setBusy]=useState(false),lock=useRef(false),latest=useRef(state);latest.current=state;
 const story=state.living.story,arc=story.arcs.find(a=>a.id===story.currentArcId),beat=story.beats.at(-1);
 return <section className="living-story" aria-label="Living campaign"><span className="eyebrow">YOUR CAMPAIGN · FICTIONAL JOURNEY</span><h2>{arc?.title??arcTemplates[0].title}</h2>
 <Landscape label={story.places.find(p=>p.id===beat?.locationId)?.name} location={beat?.locationId??"forest"} weather={story.weather} dusk={story.beats.length%2===1}/><p className="story-premise">{arc?.premise??arcTemplates[0].premise}</p>
 {beat&&<article className="story-beat" key={beat.id}><h3>{beat.title}</h3><p>{beat.prose}</p><small>{beat.provenance.source==='ai'?'AI narration · saved in your campaign':'From the campaign manuscript'}</small>
 {beat.choices.length>0&&!beat.chosen&&<div className="encounter-choices">{beat.choices.map(c=><button className="secondary" key={c.id} onClick={()=>update(chooseStory(state,beat.id,c.id,date))}>{c.label}</button>)}</div>}
 {beat.chosen&&<blockquote>{beat.choices.find(c=>c.id===beat.chosen)?.outcome}</blockquote>}
 </article>}
 {beat?.combatSetup&&<CombatScene state={state} date={date} beatId={beat.id} update={update}/>}
 <button className="secondary" disabled={busy||!canContinue(state,date)} onClick={async()=>{
  if(lock.current)return;lock.current=true;setBusy(true);const original=latest.current;
  try{const next=await continueStory(original,date,new JsonNarrativeProvider(original.living.settings));if(latest.current===original&&dayKey()===date)update(next);}finally{lock.current=false;setBusy(false);}
 }}>{busy?'A page is being prepared…':!beat?'Begin the northern road':'Read the next page'}</button>
 {!canContinue(state,date)&&<p className="muted">{story.beats.some(b=>b.choices.length&&!b.chosen)?'Your reply is waiting above.':beat?.combatSetup&&!state.living.battles.some(b=>b.beatId===beat.id)?'The meeting on the road is waiting below.':'The road is quiet. The next page grows from a little more real-life activity, on another day. Nothing expires.'}</p>}
 {story.hooks.length>0&&<details><summary>Questions along the road</summary><ul>{story.hooks.map(h=><li key={h}>{h}</li>)}</ul></details>}
 </section>;
}
export function StoryHistory({state}:{state:State}){
 const s=state.living.story;if(!s.beats.length)return null;
 return <section className="panel illuminated-chronicle" aria-label="Campaign fiction"><span className="eyebrow">THE STORY BESIDE THE FACTS</span><h2>Letters from the road</h2><p className="muted">Fictional events inspired by the campaign. Your real-world records remain separate.</p>
 {[...s.arcs].reverse().map(a=><details className="illuminated-page" key={a.id}><summary>{a.title}{a.completed?' · Concluded':''}</summary>{s.beats.filter(b=>b.arcId===a.id).map(b=><article key={b.id}><small>{b.date} · {b.provenance.source==='ai'?'AI narration':'Campaign manuscript'}</small><h3>{b.title}</h3><p>{b.prose}</p>{b.chosen&&<blockquote>{b.choices.find(c=>c.id===b.chosen)?.outcome}</blockquote>}</article>)}</details>)}
 </section>;
}
