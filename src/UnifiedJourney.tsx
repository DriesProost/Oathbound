import {journeyGuide} from './journeyGuide';
import {roadText} from './retiredHousehold';
import type {State} from './model';
import {totals} from './domain';
import {routePosition,landmarks} from './journey';
import {routeSteps} from './walking';
import {Landscape} from './living/Atmosphere';
import JourneyMap from './JourneyMap';
import JourneyStories from './JourneyStories';
import JourneyStory,{StoryHistory} from './living/JourneyStory';
import EncounterPanel from './EncounterPanel';
import ChapterPanel from './ChapterPanel';
import WorldFrontier from './WorldFrontier';
import './unified-journey.css';
export default function UnifiedJourney({state,date,update,current,onPatrol,walking}:{state:State;date:string;update:(s:State)=>boolean;current:()=>State|null;onPatrol:()=>void;walking:boolean}) {
 const distance=totals(state).distance,road=routePosition(distance),guide=journeyGuide(state,date);
 function jump(id:string){const target=document.getElementById(id);if(target instanceof HTMLDetailsElement)target.open=true;target?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});target?.focus({preventScroll:true});}
 const art=('art' in road.current?road.current.art:road.current.id) as string;
 return <section className="journey panel unified-journey" aria-label="Your journey">
 <header className="journey-heading"><span className="eyebrow">YOUR JOURNEY</span><h2>{road.current.name}</h2><p>{road.next?`${routeSteps(road.remaining)} steps to ${road.next.name}`:'Lantern Hill reached · the whole road is yours to revisit'}</p>
 <progress aria-label="Progress to next place" max={1} value={road.progress}/><small>{routeSteps(distance)} total route steps</small></header>
 <nav className="journey-section-links" aria-label="Journey sections"><button onClick={()=>jump('journey-current')}>Current quest</button><button onClick={()=>jump('journey-map')}>Route map</button><button onClick={()=>jump('journey-journal')}>Journal & rereading</button></nav>
 <section className="journey-next-action" aria-label="Next Journey action"><span className="eyebrow">WHAT TO DO NEXT</span><h3>{guide.title}</h3><p>{guide.detail}</p><button className="primary" onClick={()=>guide.target==='board'?onPatrol():jump(guide.target==='journal'?'journey-journal':'journey-current')}>{guide.kind==='walk'&&!walking?'Configure walking goal':guide.action}</button></section>
 <div id="journey-map" tabIndex={-1}><JourneyMap distance={distance}/></div>
 <section className="current-place" id="journey-current" tabIndex={-1} aria-label="Here on the road">
 <Landscape location={art==='oakhaven'?'village':art} label={road.current.name}/>
 <p className="place-note">{roadText(road.current.story[0].split(/(?<=[.!?])\s+/).slice(0,2).join(' '))}</p>
 <JourneyStory state={state} date={date} update={update} current={current}/>
 {state.world.encounters.some(e=>!e.choiceId)&&<details className="road-meetings"><summary>Roadside meetings · {state.world.encounters.filter(e=>!e.choiceId).length} to explore</summary><EncounterPanel state={state} date={date} update={update} current={current} mode="pending"/></details>}
 </section>
 <section className="next-on-road" aria-label="Next on the road"><span className="eyebrow">{road.next?'NEXT ON THE ROAD':'THIS STRETCH IS COMPLETE'}</span><h3>{road.next?.name??'A road of answering lights'}</h3><p>{road.current.id==='oakhaven'?'A lamp burns in the supposedly empty northern tower. Its keeper has a story for you.':roadText(road.current.teaser)}</p>
<p className="muted">Patrol steps reveal places, encounters and story quests. Read at most one new story page per day. Nothing expires.</p></section>
 <details className="journey-journal" id="journey-journal" tabIndex={-1}><summary>Journey journal · reread visits, quests and choices</summary><StoryHistory state={state}/><JourneyStories distance={distance}/><EncounterPanel state={state} date={date} update={update} current={current} mode="resolved"/><details><summary>The Road to Oakhaven · chapter record</summary><ChapterPanel state={state} date={date}/></details></details>
 <details className="route-itinerary"><summary>All destinations · {landmarks.length} places</summary><ol className="route-landmarks">{landmarks.map(s=><li key={s.id} className={distance>=s.km?'reached':''} aria-current={s.id===road.current.id?'step':undefined}><strong>{s.name}</strong><span>{routeSteps(s.km)} steps · {distance>=s.km?'Reached':s.id===road.next?.id?'Next':'Ahead'}</span></li>)}</ol></details>
 <details className="journey-world"><summary>Restoration along the road</summary><WorldFrontier state={state}/></details>
 <p className="journey-method">Route steps estimate 0.75 metres per step. Record patrols on the Quest Board; there is no automatic tracking. Earlier distance is preserved.</p>
 </section>;
}
