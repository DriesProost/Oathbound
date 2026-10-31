import type {State} from './model';
import {addDays,dayKey,validDay} from './calendar';
import {configuredQuests,goalActive,optionalOathDay} from './campaign';
import {quests} from './config';
export type TaskOutcome='done'|'failed'|'not-planned'|'unlogged'|'pending'|'flexible'|'inactive';
export type TaskCell={date:string;status:TaskOutcome;questId:string|null};
export type TaskResultRow={id:string;name:string;cells:TaskCell[];done:number;failed:number;notPlanned:number;unlogged:number;pending:number;flexible:number};
/** Actual receipts win over notes. Silence is unknown, never an inferred failure.
 * Today's open opportunities and flexible training days are not missed days. */
export function taskResults(state:State,now=new Date(),days=7,end=dayKey(now)) {
 if(!validDay(end)||end>dayKey(now)||!Number.isInteger(days)||days<1||days>14)throw Error('Invalid results window');
 const today=dayKey(now),dates=Array.from({length:days},(_,i)=>addDays(end,i-days+1)),rows=new Map<string,TaskResultRow>();
 const ensure=(id:string,name:string)=>{let r=rows.get(id);if(!r){r={id,name,cells:dates.map(date=>({date,status:'inactive',questId:null})),done:0,failed:0,notPlanned:0,unlogged:0,pending:0,flexible:0};rows.set(id,r);}r.name=name;return r;};
 for(const [index,date] of dates.entries()){
  if(date<state.created)continue;
  for(const q of configuredQuests(state,date))ensure(q.goalId,q.name).cells[index]={date,questId:q.id,status:date===today?'pending':q.goalId==='strength'?'flexible':'unlogged'};
  if(goalActive(state,'temperance',date)&&!optionalOathDay(state,date))ensure('temperance','Oath of Temperance').cells[index]={date,questId:null,status:date===today?'pending':'unlogged'};
  for(const note of (state.deedNotes??[]).filter(n=>n.date===date)){
   const id=quests.find(q=>q.id===note.questId)?.goalId??note.questId;
   ensure(id,note.name).cells[index]={date,questId:note.questId,status:note.status==='not-planned'?'not-planned':'failed'};
  }
  for(const e of state.entries.filter(e=>e.date===date))ensure(e.goalId??e.questId,e.deed.name).cells[index]={date,questId:e.questId,status:'done'};
  const oath=state.oaths[date];if(oath?.status==='kept'||oath?.status==='broken')ensure('temperance','Oath of Temperance').cells[index]={date,questId:null,status:oath.status==='kept'?'done':'failed'};
 }
 for(const r of rows.values())for(const c of r.cells){if(c.status==='not-planned')r.notPlanned++;else if(c.status!=='inactive')r[c.status]++;}
 return {dates,rows:[...rows.values()]};
}
/** Bounded, aggregated context. No name, weight, lyrics, full save or task notes. */
export function ventureResultsContext(state:State,date:string) {
 if(!validDay(date))throw Error('Invalid date');
 const report=taskResults(state,new Date(date+'T12:00:00'),14,addDays(date,-1)),start=report.dates[0];
 const rows=report.rows.map(r=>({goal:r.id,completed:r.done,explicitlyFailed:r.failed,notPlanned:r.notPlanned,unlogged:r.unlogged,flexibleDays:r.flexible}));
 const finished=state.ventures.filter(v=>v.date>=start&&v.date<date&&v.rewardGrant);
 return {windowDays:14,endsBefore:date,tasks:rows,focusGoals:rows.filter(r=>r.explicitlyFailed>0).sort((a,b)=>b.explicitlyFailed-a.explicitlyFailed).slice(0,3).map(r=>r.goal),
 completedVentures:finished.slice(-8).map(v=>({title:v.title,attribute:v.attribute,tier:v.tier})),
 guidance:'Explicit failures can suggest a smaller practical starting point. Unlogged is unknown, not failure. Flexible training days are not missed workouts. Optional Ventures have no failure or skip penalty. Preserve novelty; do not punish, shame, or prescribe more exertion.'};
}
