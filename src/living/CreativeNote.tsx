import {useRef,useState} from 'react';
import type {State} from '../model';
import {askBard,speakWith,illuminatePage,chroniclePacket,creativeCurrent} from './creative';
import {JsonNarrativeProvider} from './provider';
import {dayKey} from '../calendar';
export default function CreativeNote({state,date,kind,sourceId,update}:{state:State;date:string;kind:'dialogue'|'bard'|'chronicle';sourceId:string;update:(s:State)=>boolean}){
 const [busy,setBusy]=useState(false),lock=useRef(false),latest=useRef(state);latest.current=state;
 const page=state.world.pages.find(p=>p.id===sourceId),entry=kind==='chronicle'?page&&creativeCurrent(state,kind,sourceId,chroniclePacket(page)):state.living.story.creative.find(e=>e.kind===kind&&e.sourceId===sourceId&&e.date===date);
 if(entry)return <aside className="creative-note"><p>{entry.text}</p><small>{entry.source==='ai'?'With the optional AI storyteller':'From the local manuscript'} · {kind==='chronicle'?'Values copied from the factual record':kind==='bard'?'A separate song idea; your Songbook is unchanged':'Fictional household dialogue'}</small></aside>;
 return <><button className="text-button" disabled={busy} onClick={async()=>{if(lock.current)return;lock.current=true;setBusy(true);const original=latest.current,provider=new JsonNarrativeProvider(original.living.settings);try{const next=await(kind==='bard'?askBard(original,date,provider):kind==='dialogue'?speakWith(original,sourceId,date,provider):illuminatePage(original,sourceId,date,provider));if(latest.current===original&&dayKey()===date&&next!==original)update(next);}finally{lock.current=false;setBusy(false);}}}>{busy?'Preparing a line…':kind==='bard'?'Ask Tomas for a song idea':kind==='dialogue'?'Share a word':'Set the facts in manuscript prose'}</button></>;
}
