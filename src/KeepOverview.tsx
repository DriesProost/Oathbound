import {RoomVignette} from './living/Atmosphere';
import RetinuePanel from './RetinuePanel';
import RelicCabinet from './RelicCabinet';
import type { State } from './model';
import { keepAreas, keepStage, keepStageNames } from './keep';
import { retinue } from './retinue';
import { known } from './worldRecords';
export default function KeepOverview({ state, date, update }: { state: State; date: string; update: (state:State)=>boolean }) {
  return <section className="panel keep-overview" aria-label="Keep areas"><span className="eyebrow">OAK, STONE AND THE WORK OF YEARS</span><h2>Your stronghold</h2><p className="muted">The household takes shape through earned development. Rooms hold the people and objects of your campaign.</p>
    <div className="keep-areas">{keepAreas.map(area=>{
      const stage=keepStage(state,area.attribute), members=retinue.filter(m=>m.location===area.title&&known(state,'retinue',m.id));
      return <article className="keep-area" key={area.id}><RoomVignette state={state} area={area} stage={stage}/><div><small>{area.attribute} · {keepStageNames[stage]}</small><h3>{area.title}</h3><p>{area.descriptions[stage]}</p>{members.map(m=><span className="room-resident" key={m.id}>{m.name} · {m.title}</span>)}</div><details className="room-door"><summary>Enter {area.title}</summary><RetinuePanel state={state} date={date} update={update} room={area.title}/><RelicCabinet state={state} room={area.title}/></details></article>;
    })}</div>
  </section>;
}
