import type {State} from '../model';
import {chroniclePacket,creativeCurrent} from './creative';
export default function CreativeNote({state,date,kind,sourceId}:{state:State;date:string;kind:'dialogue'|'bard'|'chronicle';sourceId:string;update?:(s:State)=>boolean}){
 const page=state.world.pages.find(p=>p.id===sourceId),entry=kind==='chronicle'?page&&creativeCurrent(state,kind,sourceId,chroniclePacket(page)):state.living.story.creative.filter(e=>e.kind===kind&&e.sourceId===sourceId&&(kind==='bard'||e.date===date)).at(-1);
 return entry?<aside className="creative-note"><p>{entry.text}</p><small>{entry.source==='ai'?'Campaign storyteller':'From the local manuscript'} · {kind==='bard'?'A separate song idea; your Songbook is unchanged':kind==='chronicle'?'From the factual record':'By the hearth'}</small></aside>:null;
}
