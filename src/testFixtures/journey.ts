import {createKnight,completeQuest} from '../domain';
import type {State} from '../model';
/** An explicit historical patrol receipt for route-dependent domain fixtures. */
export function withDistance(state:State,km:number):State {
 const receipt=completeQuest(createKnight('Fixture',state.created),'patrol',state.created,new Date(state.created+'T20:00:00')).entries[0];
 const existing=state.entries.find(e=>e.goalId==='walking');
 return {...state,entries:existing?state.entries.map(e=>e.goalId==='walking'?{...e,distance:e.id===existing.id?km:0}:e):[...state.entries,{...receipt,distance:km}]};
}
