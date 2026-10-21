import RetinuePanel from './RetinuePanel';
import RelicCabinet from './RelicCabinet';
import type { State } from './model';
import { keepAreas, keepStage, keepStageNames, type KeepArea } from './keep';
import { retinue } from './retinue';
import { known } from './worldRecords';
function RoomImage({ area, stage }: { area: KeepArea; stage: number }) {
  if(area.artwork?.[stage])return <img className="keep-room-image" src={area.artwork[stage]} alt={`${area.title}, ${keepStageNames[stage]}`} />;
  return <svg className={`keep-room-image room-stage-${stage}`} viewBox="0 0 240 100" role="img" aria-label={`${keepStageNames[stage]} ${area.title}`}>
    <path d="M12 86H228M26 86V52L50 32L74 52V86M38 86V68Q50 48 62 68V86" fill="none" stroke="currentColor" strokeWidth="2" />
    {Array.from({length:stage},(_,i)=><g key={i} transform={`translate(${85+i*34},0)`}><path d={`M0 86V${56-i*8}L14 ${45-i*8}L28 ${56-i*8}V86Z`} fill="currentColor" opacity=".12"/><path d={`M0 86V${56-i*8}L14 ${45-i*8}L28 ${56-i*8}V86M11 65H17M11 75H17`} fill="none" stroke="currentColor" strokeWidth="2"/></g>)}
    <text x="190" y="25" fill="currentColor" fontSize="13" fontFamily="serif">{area.attribute.slice(0,1)}</text>
  </svg>;
}
export default function KeepOverview({ state, date, update }: { state: State; date: string; update: (state:State)=>boolean }) {
  return <section className="panel keep-overview" aria-label="Keep areas"><span className="eyebrow">OAK, STONE AND THE WORK OF YEARS</span><h2>Your stronghold</h2><p className="muted">The household takes shape through earned development. Rooms hold the people and objects of your campaign.</p>
    <div className="keep-areas">{keepAreas.map(area=>{
      const stage=keepStage(state,area.attribute), members=retinue.filter(m=>m.location===area.title&&known(state,'retinue',m.id));
      return <article className="keep-area" key={area.id}><RoomImage area={area} stage={stage}/><div><small>{area.attribute} · {keepStageNames[stage]}</small><h3>{area.title}</h3><p>{area.descriptions[stage]}</p>{members.map(m=><span className="room-resident" key={m.id}>{m.name} · {m.title}</span>)}</div><details className="room-door"><summary>Enter {area.title}</summary><RetinuePanel state={state} date={date} update={update} room={area.title}/><RelicCabinet state={state} room={area.title}/></details></article>;
    })}</div>
  </section>;
}
