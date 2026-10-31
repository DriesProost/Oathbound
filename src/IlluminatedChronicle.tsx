import {retiredHouseholdKinds} from './retiredHousehold';
import {chroniclePacket,creativeCurrent} from './living/creative';
import type { State } from './model';
import { formatDay } from './presentation';
import { chronicleCopy } from './chronicleContent';
export default function IlluminatedChronicle({state,date,update}:{state:State;date?:string;update?:(s:State)=>boolean}) {
 const pages=[...state.world.pages].sort((a,b)=>b.end.localeCompare(a.end));
 return <section className="panel illuminated-chronicle" aria-label="Illuminated Chronicle"><span className="eyebrow">THE MANUSCRIPT OF YOUR CAMPAIGN</span><h2>The Illuminated Chronicle</h2>
 {!pages.length?<p>{chronicleCopy.empty}</p>:pages.map(page=><details className="illuminated-page" key={page.id}><summary>{page.title}<small>{formatDay(page.start)} — {formatDay(page.end,true)}</small></summary><p className="illuminated-prose">{creativeCurrent(state,'chronicle',page.id,chroniclePacket(page))?.text ?? page.narrative}</p>
 {page.reconstructed&&<p className="muted">Written from the earlier records that survive in your Chronicle.</p>}
 <dl className="chronicle-highlights">{page.highlights.filter(h=>!['Keep upgrades','Retinue arrivals','Relics earned'].includes(h.label)).map(h=><div key={h.label}><dt>{h.label}</dt><dd>{h.value}</dd></div>)}</dl>
 {page.events.length>0&&<ul>{page.events.filter(e=>!retiredHouseholdKinds.has(e.kind)).map(e=><li key={`${e.kind}:${e.id}`}><strong>{e.title}</strong> · {e.text}</li>)}</ul>}

 </details>)}
 </section>;
}
