import type { State } from './model';
import { preferTitle } from './titles';
import { formatDay } from './presentation';
export default function TitlePanel({state,update}:{state:State;update:(state:State)=>boolean}) {
 const earned=state.world.milestones.filter(m=>m.kind==='title');
 return <section className="panel title-panel" aria-label="Earned Titles"><span className="eyebrow">A NAME TRAVELS BEFORE YOU</span><h2>Orders and Titles</h2>
 {!earned.length?<p className="muted">Names grow from the development already recorded in your campaign. There is no class to choose.</p>:<>
 <label htmlFor="preferred-campaign-title">Displayed Title</label><select id="preferred-campaign-title" value={state.world.preferredTitle??''} onChange={e=>update(preferTitle(state,e.target.value||null))}><option value="">Use my rank</option>{earned.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select>
 {earned.map(m=><article key={m.id}><h3>{m.title}</h3><p>{m.text}</p><small>{m.origin} · {m.provenance==='discovered'?'Recognised on':'Earned'} {formatDay(m.date,true)}</small></article>)}
 </>}
 </section>;
}
