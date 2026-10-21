import { Shield } from 'lucide-react';
import type { State } from './model';
import { formatDay } from './presentation';
export default function RelicCabinet({state,room}:{state:State;room?:string}) {
 const earned=state.world.milestones.filter(m=>m.kind==='relic'&&(!room||m.location===room));
 if(room&&!earned.length)return null;
 return <details className="panel world-panel"><summary>Objects remembered <span>Relics of the campaign</span></summary><p>Nothing here was found by chance. These objects remember what happened.</p>
  {!earned.length?<p className="muted">A cabinet waits for things worth remembering.</p>:<div className="relic-cabinet">{earned.map(relic=><article className="relic" key={relic.id}><Shield aria-hidden="true"/><h3>{relic.title}</h3><p>{relic.text}</p><p className="relic-origin">{relic.origin}</p><small>{relic.provenance==='discovered'?'Recognised on':'Earned'} {formatDay(relic.date,true)} · {relic.location}</small></article>)}</div>}
 </details>;
}
