import type {State} from '../model';
import type {AutomaticJob,AutomaticState} from './model';
import {addDays,dayKey,validDay,weekStart} from '../calendar';
import {todaysVenture} from '../ventureDomain';
import {retinue} from '../retinue';
import {canContinue,continueStory,progressCount} from './director';
import {askBard,speakWith,illuminatePage,chroniclePacket,creativeCurrent} from './creative';
import {sourceHash} from './context';
import {generateFirstNotice} from './ventureGeneration';
import type {NarrativeProvider} from './provider';
export function ensureAutomatic(state:State,date:string):State {
 if(state.living.automatic)return state;
 // A notice already present in an older save may already have been read. Keep it.
 const automatic:AutomaticState={version:1,jobs:[],seenVentures:state.ventures.filter(v=>v.date===date).map(v=>v.assignmentId)};
 return {...state,living:{...state.living,automatic,settings:state.living.settings.enabled?{...state.living.settings,story:true,ventures:true,dialogue:true}:state.living.settings}};
}
export function markVentureSeen(state:State,id:string,date:string):State {
 const next=ensureAutomatic(state,date),a=next.living.automatic!;
 if(a.seenVentures.includes(id))return next;
 return {...next,living:{...next.living,automatic:{...a,seenVentures:[...a.seenVentures.slice(-63),id]}}};
}
export type AutomaticPlan=Omit<AutomaticJob,'status'|'startedAt'> & {recover?:boolean};
const storyStamp=(state:State)=>sourceHash({...state.living.story,creative:[]});
const settingsStamp=(state:State)=>sourceHash(state.living.settings);
function jobStamp(state:State,kind:AutomaticJob['kind'],target:string):string {
 const data=kind==='story'?storyStamp(state):kind==='venture'?todaysVenture(state,target.split(':')[1]):kind==='chronicle'?state.world.pages.find(p=>p.id===target):target;
 return sourceHash({settings:settingsStamp(state),data});
}
export function nextAutomaticJob(state:State,now:Date,recoverPending=false):AutomaticPlan|undefined {
 const date=dayKey(now),a=state.living.automatic;
 if(!a||!validDay(date)||date<state.created)return;
 const pending=a.jobs.find(j=>j.status==='pending');
 if(pending){if(recoverPending||now.getTime()-Date.parse(pending.startedAt)>30000)return {...pending,recover:true};return;}
 const plan=(kind:AutomaticJob['kind'],target:string,id=`auto:${date}:${kind}`):AutomaticPlan|undefined=>a.jobs.some(j=>j.id===id)?undefined:{id,date,kind,target,stamp:jobStamp(state,kind,target)};
 const v=todaysVenture(state,date),cfg=state.living.settings;
 if(cfg.enabled&&cfg.ventures&&v?.status==='assigned'&&!v.replacementOf&&!v.replaced&&!v.generation&&!a.seenVentures.includes(v.assignmentId)){
  const p=plan('venture',v.assignmentId);if(p)return p;
 }
 if(!a.preparedStory&&canContinue(state,date)){const p=plan('story',state.living.story.currentArcId||'arc:1');if(p)return p;}
 const present=retinue.filter(m=>state.world.milestones.some(r=>r.kind==='retinue'&&r.id===m.id));
 if(present.length){
  const member=present.find(m=>m.id===state.living.story.beats.at(-1)?.speakerId)||present.find(m=>m.attribute===v?.attribute)||present[Math.floor(Date.parse(date)/86400000)%present.length];
  if(!state.living.story.creative.some(e=>e.kind==='dialogue'&&e.date===date)) {const p=plan('dialogue',member.id);if(p)return p;}
 }
 const page=[...state.world.pages].filter(p=>p.end<date&&p.kind!=='chapter').sort((a,b)=>b.end.localeCompare(a.end))[0];
 if(page&&!creativeCurrent(state,'chronicle',page.id,chroniclePacket(page))){const p=plan('chronicle',page.id,`auto:${date}:chronicle:${sourceHash(chroniclePacket(page))}`);if(p)return p;}
 // A song at an arc ending or a new weekly manuscript; no daily song treadmill.
 const ending=state.living.story.arcs.find(a=>a.completed===date),week=weekStart(date),newWeek=state.world.pages.some(p=>p.kind==='week'&&p.end>=addDays(date,-3)&&p.end<date);
 if(present.some(m=>m.id==='bard')&&(ending||newWeek)&&!state.living.story.creative.some(e=>e.kind==='bard'&&(ending?e.date===date:e.date>=week))){const p=plan('bard','bard');if(p)return p;}
}
export function reserveAutomaticJob(state:State,plan:AutomaticPlan,now:Date):State {
 const a=state.living.automatic;if(!a||a.jobs.some(j=>j.id===plan.id))return state;
 const job:AutomaticJob={id:plan.id,date:plan.date,kind:plan.kind,target:plan.target,stamp:plan.stamp,status:'pending',startedAt:now.toISOString()};
 return {...state,living:{...state.living,automatic:{...a,jobs:[...a.jobs.filter(j=>j.date>=addDays(plan.date,-7)).slice(-126),job]}}};
}
export async function runAutomaticJob(state:State,job:AutomaticPlan,provider?:NarrativeProvider,signal?:AbortSignal):Promise<State> {
 const p=job.recover?undefined:provider;
 if(job.kind==='story')return continueStory(state,job.date,p,signal);
 if(job.kind==='venture')return generateFirstNotice(state,job.date,p,signal);
 if(job.kind==='dialogue')return speakWith(state,job.target,job.date,p,signal);
 if(job.kind==='chronicle')return illuminatePage(state,job.target,job.date,p,signal);
 return askBard(state,job.date,p,signal);
}
export function finishAutomaticJob(latest:State,base:State,result:State,job:AutomaticPlan,date:string):State {
 const a=latest.living.automatic;if(!a?.jobs.some(j=>j.id===job.id&&j.status==='pending'))return latest;
 let next=latest;
 const sameDay=job.date===date,sameSettings=settingsStamp(latest)===settingsStamp(base);
 if(sameDay&&sameSettings){
  if(job.kind==='venture'){
   const old=todaysVenture(base,job.date),current=todaysVenture(latest,job.date),generated=todaysVenture(result,job.date);
   if(old&&current&&generated&&!a.seenVentures.includes(current.assignmentId)&&JSON.stringify(current)===JSON.stringify(old))next={...latest,ventures:latest.ventures.map(v=>v.assignmentId===current.assignmentId?generated:v)};
  }else if(job.kind==='story'){
   if(storyStamp(latest)===storyStamp(base)&&canContinue(latest,date)){
    const story=result.living.story,beat=story.beats.at(-1),arc=story.arcs.find(a=>a.id===beat?.arcId);
    if(beat&&arc&&!base.living.story.beats.some(b=>b.id===beat.id)){
     const preparedStory={baseHash:storyStamp(latest),preparedAt:job.date,beat,arc,npcs:story.npcs.filter(n=>!base.living.story.npcs.some(b=>b.id===n.id)),places:story.places.filter(p=>!base.living.story.places.some(b=>b.id===p.id)),plannedArc:story.plannedArc,...(beat.stage===6?{seed:story.futureSeeds.at(-1)}:{}),mood:story.mood,season:story.season,weather:story.weather};
     next={...latest,living:{...latest.living,automatic:{...a,preparedStory}}};
    }
   }
  }else{
   const entries=result.living.story.creative.filter(e=>!base.living.story.creative.some(b=>b.id===e.id&&b.sourceHash===e.sourceHash));
   const valid=entries.filter(e=>job.kind!=='chronicle'||JSON.stringify(latest.world.pages.find(p=>p.id===job.target))===JSON.stringify(base.world.pages.find(p=>p.id===job.target)));
   next={...latest,living:{...latest.living,story:{...latest.living.story,creative:[...latest.living.story.creative.filter(e=>!valid.some(n=>n.id===e.id)),...valid]}}};
  }
 }
 return {...next,living:{...next.living,automatic:{...next.living.automatic!,jobs:a.jobs.map(j=>j.id===job.id?{...j,status:'done'}:j)}}};
}

/** Reading is explicit. A prepared page waits indefinitely and never consumes a
 * story stage, choice or confrontation merely because a calendar day passed. */
export function readPreparedStory(state:State,date:string):State {
 const a=state.living.automatic,p=a?.preparedStory;
 if(!a||!p||!canContinue(state,date)||p.baseHash!==storyStamp(state))return state;
 const s=state.living.story,newArc=!s.arcs.some(a=>a.id===p.arc.id),ending=p.beat.stage===6;
 const arc={...p.arc,started:newArc?date:p.arc.started,...(ending?{completed:date}:{})},beat={...p.beat,date,progress:progressCount(state)};
 const {preparedStory:_prepared,...automatic}=a;
 const mystery=arc.mystery;
 return {...state,living:{...state.living,automatic,story:{...s,currentArcId:arc.id,
  arcs:newArc?[...s.arcs,arc]:s.arcs.map(a=>a.id===arc.id?arc:a),beats:[...s.beats,beat],lastGenerated:p.preparedAt,
  npcs:[...s.npcs,...p.npcs],places:[...s.places,...p.places],plannedArc:p.plannedArc,
  hooks:[...new Set([...s.hooks.filter(h=>!beat.hooksResolved.includes(h)),...beat.hooksAdded])],worldFacts:[...new Set([...s.worldFacts,...beat.canonFactsAdded])],
  mysteries:ending?s.mysteries.filter(m=>m!==mystery):newArc&&mystery?[...s.mysteries,mystery]:s.mysteries,
  completedMysteries:ending&&mystery?[...new Set([...s.completedMysteries,mystery])]:s.completedMysteries,
  futureSeeds:p.seed?[...s.futureSeeds,p.seed]:s.futureSeeds,mood:p.mood,season:p.season,weather:p.weather}}};
}
