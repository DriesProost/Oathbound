import {addDays,dayKey,validDay} from './calendar';
import {configuredQuests} from './campaign';
import {canConfirm} from './domain';
import {quests} from './config';
import type {State} from './model';
export type ReviewRow={id:string;name:string;done:number;failed:number;rest:number;flexible:number;unlogged:number};
// Derived from actual receipts, explicit notes and the configuration effective on each date.
// This view writes nothing and never classifies missing data as failure.
export function weeklyReview(state:State,start:string,now=new Date()) {
 if(!validDay(start))throw Error('Invalid review period');
 const today=dayKey(now),end=addDays(start,6),rows=new Map<string,ReviewRow>();
 const row=(id:string,name:string)=>{if(!rows.has(id))rows.set(id,{id,name,done:0,failed:0,rest:0,flexible:0,unlogged:0});return rows.get(id)!;};
 let kept=0,broken=0;
 for(let date=start;date<=end && date<=today;date=addDays(date,1)) {
  if(date<state.created)continue;
  const accounted=new Set<string>();
  for(const entry of state.entries.filter(e=>e.date===date)) {
   const id=entry.goalId||entry.questId;row(id,entry.deed.name).done++;accounted.add(id);
  }
  for(const note of (state.deedNotes||[]).filter(n=>n.date===date)) {
   const id=quests.find(q=>q.id===note.questId)?.goalId||note.questId;
   if(accounted.has(id))continue;
   const r=row(id,note.name);if(note.status==='not-planned')r.rest++;else r.failed++;
   accounted.add(id);
  }
  for(const quest of configuredQuests(state,date)) {
   if(!accounted.has(quest.goalId) && canConfirm(date,quest.timing,now))row(quest.goalId,quest.name)[quest.goalId==='strength'?'flexible':'unlogged']++;
  }
  if(state.oaths[date]?.status==='kept')kept++;
  if(state.oaths[date]?.status==='broken')broken++;
 }
 return {start,end,rows:[...rows.values()],kept,broken};
}
