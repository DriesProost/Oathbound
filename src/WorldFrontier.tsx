import type { State } from './model';
import { restorations, restored } from './worldState';
import { formatDay } from './presentation';
export default function WorldFrontier({state}:{state:State}) {
 return <section className="world-frontier" aria-label="World restoration"><span className="eyebrow">BEYOND THE KNOWN ROAD</span><h2>The quiet reaches</h2>
 <p>The Grey Host is the name given to roads fallen out of use and places no longer tended. As the campaign grows, fires answer, gates open and the map becomes more familiar. Once restored, a place remains restored.</p>
 <svg viewBox="0 0 600 120" className="frontier-map" role="img" aria-label="Five frontier places, with lit markers for permanently restored areas">
 <defs><radialGradient id="frontier-mist"><stop stopColor="#717581" stopOpacity=".75"/><stop offset="1" stopColor="#9799a0" stopOpacity=".1"/></radialGradient></defs>
 <path d="M45 76Q150 10 270 70T555 52" fill="none" stroke="#96866b" strokeWidth="3" strokeDasharray="4 6"/>
 {restorations.map((r,i)=>{const lit=restored(state,r.id),x=55+i*120,y=i%2?42:76;return <g key={r.id}><circle cx={x} cy={y} r={38} fill={lit?'#c6d1aa':'url(#frontier-mist)'}/><path d={`M${x-9} ${y+11}V${y-10}H${x+9}V${y+11}Z`} fill={lit?'#586544':'#626571'}/><circle cx={x} cy={y-15} r={5} fill={lit?'#d8ab50':'#5d626e'}/><text x={x} y={112} textAnchor="middle" fontSize="11" fill="#544b39">{i+1}</text></g>;})}
 </svg>
 <div className="frontier-places">{restorations.map((r,i)=>{const record=state.world.milestones.find(m=>m.kind==='restoration'&&m.id===r.id);return <article className={record?'restored-place':'quiet-place'} key={r.id}><h3>{i+1}. {r.place}</h3><small>{record?'Restored':'Unreclaimed'}</small><p>{record?.text??r.quiet}</p>{record&&<small>{record.provenance==='discovered'?'Recognised on':'Restored'} {formatDay(record.date,true)}</small>}</article>;})}</div>
 </section>;
}
