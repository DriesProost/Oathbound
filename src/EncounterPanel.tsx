import type {State} from './model';
import {chooseEncounter} from './encounters';
import {formatDay} from './presentation';
export default function EncounterPanel({state,date,update,current,mode}:{state:State;date:string;update:(state:State)=>boolean;current?:()=>State|null;mode?:'pending'|'resolved'}) {
 const pending=state.world.encounters.filter(e=>!e.choiceId&&mode!=='resolved'),resolved=state.world.encounters.filter(e=>e.choiceId&&mode!=='pending');
 return <section className="panel encounters-panel" aria-label="Journey encounters"><span className="eyebrow">BETWEEN THE LANDMARKS</span><h2>Along the road</h2>
 {!pending.length&&<p className="muted">A quiet stretch of road. Earlier meetings remain in your journal.</p>}
 {pending.length>0&&<p>{pending.length===1?'A roadside story is':'Roadside stories are'} available when you wish to read.</p>}
 {pending.map(e=><details className="road-encounter" key={e.id}><summary>{e.title}</summary><p>{e.text}</p><div className="encounter-choices">{e.choices.map(c=><button className="secondary" key={c.id} onClick={()=>update(chooseEncounter(current?.()??state,e.id,c.id,date))}>{c.label}</button>)}</div><small>A moment in the fictional Journey. Neither choice changes your rewards.</small></details>)}
 {resolved.length>0&&<details><summary>Roadside journal</summary>{resolved.map(e=>{const choice=e.choices.find(c=>c.id===e.choiceId)!;return <article key={e.id}><h3>{e.title}</h3><p>{choice.text}</p><p className="muted">{choice.memory}</p><small>Recorded {formatDay(e.resolvedDate!,true)}</small></article>;})}</details>}
 </section>;
}
