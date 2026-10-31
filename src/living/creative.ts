import type {State} from '../model';
import type {ChroniclePage} from '../worldModel';
import {validDay} from '../calendar';
import {sourceHash} from './context';
import {generateSafely,type NarrativeProvider} from './provider';
import {exact} from './validation';
import type {CreativeEntry} from './model';
export function chroniclePacket(page:ChroniclePage){return {id:page.id,start:page.start,end:page.end,facts:page.highlights.map((h,i)=>({id:`fact:${i}`,label:h.label,value:h.value})),events:page.events.map(e=>({id:`${e.kind}:${e.id}`,title:e.title,text:e.text}))};}
const openings=['The manuscript keeps a careful account.','By the hearth, these records were set in order.','A quiet hand has gathered the surviving record.'] as const;
const endings=['What was done remains recorded.','The page leaves room for another chapter.','The earlier work remains part of the campaign.'] as const;
export function creativeCurrent(state:State,kind:CreativeEntry['kind'],sourceId:string,packet:unknown){return state.living.story.creative.find(e=>e.kind===kind&&e.sourceId===sourceId&&e.sourceHash===sourceHash(packet));}
function rememberCreative(state:State,entry:CreativeEntry):State {
 return {...state,living:{...state.living,story:{...state.living.story,creative:[...state.living.story.creative.filter(e=>e.id!==entry.id),entry]}}};
}
export async function illuminatePage(state:State,pageId:string,date:string,provider?:NarrativeProvider,signal?:AbortSignal):Promise<State>{
 const page=state.world.pages.find(p=>p.id===pageId);if(!page||!validDay(date)||date<page.end)return state;
 const packet=chroniclePacket(page);if(creativeCurrent(state,'chronicle',page.id,packet))return state;
 const ids=packet.facts.map(f=>f.id);
 type Arrangement={opening:number;factOrder:string[];ending:number};
 const validate=(v:unknown):v is Arrangement=>exact(v,['opening','factOrder','ending'])&&Number.isInteger(v.opening)&&v.opening>=0&&v.opening<openings.length&&Number.isInteger(v.ending)&&v.ending>=0&&v.ending<endings.length&&Array.isArray(v.factOrder)&&v.factOrder.length===ids.length&&new Set(v.factOrder).size===ids.length&&v.factOrder.every((id:unknown)=>ids.includes(id as string));
 const result=await generateSafely(state.living.settings.enabled&&state.living.settings.story?provider:undefined,{task:'chronicle',context:{factualSource:packet},schema:{opening:'index 0–2',factOrder:ids,ending:'index 0–2'},instruction:`Arrange these immutable facts as a manuscript account. Return each fact ID exactly once; no invented prose, numbers or claims. Select an opening and ending from these supplied phrases: ${JSON.stringify({openings,endings})}. Oathbound inserts the authoritative values.`},validate,{opening:0,factOrder:ids,ending:0},signal);
 const prose=[openings[result.content.opening],...result.content.factOrder.map(id=>{const f=packet.facts.find(f=>f.id===id)!;return `${f.label}: ${f.value}.`;}),endings[result.content.ending]].join(' ');
 return rememberCreative(state,{id:`chronicle:${page.id}`,kind:'chronicle',sourceId:page.id,sourceHash:sourceHash(packet),date,text:prose,source:result.source});
}
