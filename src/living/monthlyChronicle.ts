import type {State} from '../model';
import {weeklyPage,snapshotPage} from '../illuminatedChronicle';
export function reconcileMonths(state:State,date:string):State {
 const dates=[...state.entries.map(e=>e.date),...state.ventures.filter(v=>v.rewardGrant).map(v=>v.date),...Object.entries(state.oaths).filter(([,o])=>o.status==='kept').map(([d])=>d),...state.world.milestones.map(m=>m.date)];
 const months=[...new Set(dates.filter(d=>d<date.slice(0,7)+'-01').map(d=>d.slice(0,7)+'-01'))].sort();
 let next=state;
 for(const start of months){
  if(next.world.pages.some(p=>p.id===`month:${start}`))continue;
  const [y,m]=start.split('-').map(Number),end=new Date(Date.UTC(y,m,0)).toISOString().slice(0,10),page=weeklyPage(next,start,end);
  next=snapshotPage(next,{...page,id:`month:${start}`,kind:'month',title:`The month of ${new Date(start+'T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}`,narrative:page.narrative.replace('for this week','for this month')});
 }
 return next;
}
