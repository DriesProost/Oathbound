import type {State} from '../model';
import type {ChroniclePage} from '../worldModel';
import {retinue,currentRemark} from '../retinue';
import {validDay} from '../calendar';
import {narrativeContext,sourceHash} from './context';
import {generateSafely,type NarrativeProvider} from './provider';
import {safeProse} from './ventureGeneration';
import {exact,object} from './validation';
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
export function dialoguePacket(state:State,memberId:string,date:string){const m=retinue.find(r=>r.id===memberId);return m?{character:{id:m.id,name:m.name,role:m.role,personality:m.personality,biography:m.biography},date,context:narrativeContext(state)}:null;}
export async function speakWith(state:State,memberId:string,date:string,provider?:NarrativeProvider,signal?:AbortSignal):Promise<State>{
 const member=retinue.find(r=>r.id===memberId);if(!member||!validDay(date)||date<state.created||!state.world.milestones.some(m=>m.kind==='retinue'&&m.id===member.id))return state;
 const id=`dialogue:${date}:${member.id}`;
 // One accepted line per character per day; other actions do not turn it into a slot machine.
 if(state.living.story.creative.some(e=>e.id===id))return state;
 const packet=dialoguePacket(state,memberId,date)!;
 const valid=(v:unknown):v is {text:string}=>exact(v,['text'])&&safeProse(v.text,900)&&!/[0-9]|\b(?:xp|renown|workout|oath|kilometre|kilometer|rank|weight)\b/i.test(v.text);
 const result=await generateSafely(state.living.settings.enabled&&state.living.settings.dialogue?provider:undefined,{task:'dialogue',context:packet,schema:{text:'one short in-character remark'},instruction:'Speak as this specific person about the fictional household or current fictional story. Dry, grounded, no motivational coaching, no claims about real-world accomplishments. Respect past choices and personality.'},valid,{text:currentRemark(state,member,date)},signal);
 return rememberCreative(state,{id,kind:'dialogue',sourceId:member.id,sourceHash:sourceHash(packet),date,text:result.content.text,source:result.source});
}
export async function askBard(state:State,date:string,provider?:NarrativeProvider,signal?:AbortSignal):Promise<State>{
 if(!validDay(date)||date<state.created||!state.world.milestones.some(m=>m.kind==='retinue'&&m.id==='bard'))return state;
 const id=`bard:${date}`;if(state.living.story.creative.some(e=>e.id===id))return state;
 const packet={character:retinue.find(m=>m.id==='bard')!.personality,story:state.living.story.beats.slice(-3).map(b=>({title:b.title,fiction:b.prose})),choices:state.living.story.choices.slice(-2),arc:state.living.story.arcs.at(-1)?.title??'A hearth and an open road'};
 const valid=(v:unknown):v is {verse:string;chords:string}=>exact(v,['verse','chords'])&&safeProse(v.verse,2000)&&typeof v.chords==='string'&&v.chords.length<=200&&/^[A-Ga-gm#b0-9\/| susdimaug+()\n-]*$/.test(v.chords)&&!object(v.verse);
 const fallback={verse:'A lamp is set beside the door,\nA chair waits near the fire.\nThe road will have its say once more;\nTonight, no grander choir.',chords:'Am | G | F | E'};
 const result=await generateSafely(state.living.settings.enabled&&state.living.settings.dialogue?provider:undefined,{task:'bard',context:packet,schema:{verse:'original short verse, four to twelve lines',chords:'optional simple chord sequence as string'},instruction:'Tomas Reed offers an original modest song idea about the fictional road. Dry wit and human details. Include a simple chord idea if helpful. Never quote existing lyrics. The player’s private Songbook is not supplied and must not be overwritten.'},valid,fallback,signal);
 return rememberCreative(state,{id,kind:'bard',sourceId:'bard',sourceHash:sourceHash(packet),date,text:result.content.verse+(result.content.chords?'\n\nChord idea: '+result.content.chords:''),source:result.source});
}
