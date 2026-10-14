import type { State } from './model';
import type { ChroniclePage } from './worldModel';
import { totals } from './domain';
import { progression } from './config';
import { addDays, weekStart } from './calendar';
import { landmarks } from './journey';
import { chronicleCopy } from './chronicleContent';
export function through(state:State,end:string):State {
 return {...state,entries:state.entries.filter(e=>e.date<=end),ventures:state.ventures.filter(v=>v.date<=end),
  oaths:Object.fromEntries(Object.entries(state.oaths).filter(([date])=>date<=end)),
  weekly:{...state.weekly,commissions:state.weekly.commissions.map(c=>{
   const date=state.entries.find(e=>e.activityId===c.bonus?.activityId)?.date;
   return date&&date<=end?c:{...c,bonus:undefined};
  })}};
}
export function snapshotPage(state:State,page:ChroniclePage):State {
 if(state.world.pages.some(p=>p.id===page.id))return state;
 return {...state,world:{...state.world,pages:[...state.world.pages,structuredClone(page)]}};
}
export function weeklyPage(state:State,start:string):ChroniclePage {
 const end=addDays(start,6),before=totals(through(state,addDays(start,-1))),after=totals(through(state,end));
 const entries=state.entries.filter(e=>e.date>=start&&e.date<=end),ventures=state.ventures.filter(v=>v.rewardGrant&&v.date>=start&&v.date<=end);
 const kept=Object.entries(state.oaths).filter(([date,o])=>date>=start&&date<=end&&o.status==='kept').length;
 const training=entries.filter(e=>e.goalId==='strength').length,patrols=entries.filter(e=>e.goalId==='walking').length;
 const distance=entries.reduce((n,e)=>n+e.distance,0),renown=after.renown-before.renown;
 const events=state.world.milestones.filter(m=>m.date>=start&&m.date<=end);
 const levels=Object.entries(after.stats).filter(([a,v])=>v.level>before.stats[a as keyof typeof before.stats].level).map(([a,v])=>`${a} ${before.stats[a as keyof typeof before.stats].level} → ${v.level}`);
 const ranks=progression.ranks.filter(r=>r.threshold>before.renown&&r.threshold<=after.renown).map(r=>r.name);
 const reached=landmarks.filter(l=>l.km>before.distance&&l.km<=after.distance).map(l=>l.name);
 const sentences=[entries.length+ventures.length+kept<=3?chronicleCopy.quiet:chronicleCopy.active];
 if(patrols)sentences.push(`${patrols} ${patrols===1?'journey was':'journeys were'} recorded beyond the walls${distance?`, carrying ${Number(distance.toFixed(3))} km of road beneath your boots`:''}.`);
 if(training)sentences.push(`${training} ${training===1?'visit was':'visits were'} made to the Training Yard.`);
 if(ventures.length)sentences.push(`${ventures.length} ${ventures.length===1?'Venture was':'Ventures were'} undertaken.`);
 if(kept)sentences.push(`${kept} ${kept===1?'Oath was':'Oaths were'} confirmed kept.`);
 if(reached.length)sentences.push(`The road reached ${reached.join(' and ')}.`);
 if(events.length)sentences.push(`The household remembers ${events.map(e=>e.title).join('; ')}.`);
 const startLabel=new Date(start+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
 const highlights=[{label:'Renown earned',value:String(renown)},{label:'Ventures completed',value:String(ventures.length)},
  {label:'Journey kilometres',value:String(Number(distance.toFixed(3)))},{label:'Training sessions',value:String(training)},
  {label:'Oaths kept',value:String(kept)},{label:'Attribute level-ups',value:levels.join(' · ')||'None recorded'},
  {label:'Ranks reached',value:ranks.join(' · ')||'None recorded'},{label:'Landmarks reached',value:reached.join(' · ')||'None recorded'},
  ...(['relic','keep','retinue','restoration','title'] as const).map(kind=>({label:{relic:'Relics earned',keep:'Keep upgrades',retinue:'Retinue arrivals',restoration:'Restorations',title:'Titles earned'}[kind],value:events.filter(e=>e.kind===kind).map(e=>e.title).join(' · ')||'None recorded'}))];
 const bard=state.world.milestones.some(m=>m.kind==='retinue'&&m.id==='bard'&&m.date<=end);
 const stanzaKind=(['chapter','restoration','keep','retinue'] as const).find(kind=>events.some(e=>e.kind===kind));
 const occasional=Math.floor(Date.parse(start)/604800000)%4===0;
 return {id:`week:${start}`,kind:'week',start,end,title:`The week of ${startLabel}`,narrative:sentences.join(' '),highlights,events:structuredClone(events),
  reconstructed:end<state.world.trackingSince,...(bard&&stanzaKind&&occasional?{stanza:chronicleCopy.stanzas[stanzaKind]}:{})};
}
export function reconcileChronicle(state:State,date:string):State {
 const currentWeek=weekStart(date,state.weekly.weekStartsOn);
 const dates=[...state.entries.map(e=>e.date),...state.ventures.filter(v=>v.rewardGrant).map(v=>v.date),
  ...Object.entries(state.oaths).filter(([,o])=>o.status==='kept').map(([d])=>d),...state.world.milestones.map(m=>m.date)];
 const weeks=[...new Set(dates.filter(d=>d<=date).map(d=>weekStart(d,state.weekly.weekStartsOn)))].filter(start=>start<currentWeek).sort();
 let next=state;for(const start of weeks)if(!next.world.pages.some(p=>p.id===`week:${start}`))next=snapshotPage(next,weeklyPage(next,start));return next;
}
