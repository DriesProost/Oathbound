import type { State } from './model';
import type { WorldMilestone } from './worldModel';
import { totals } from './domain';
import { meets, type WorldCondition } from './worldConditions';
import { known, remember } from './worldRecords';
import { snapshotPage } from './illuminatedChronicle';
export type Chapter = {id:string;title:string;subtitle:string;opening:string;route:{id:string;start:number;end:number};
 openingCondition:WorldCondition;closingCondition:WorldCondition;hooks:{km:number;title:string;text:string}[];
 encounters:string[];closingTitle:string;closing:string;song?:{id:string;title:string};previous?:string};
export const chapters:readonly Chapter[]=[{
 id:'oakhaven',title:'Chapter I: The Road to Oakhaven',subtitle:'A key, a letter, and the places between',
 opening:'The road beyond the Keep once joined people who depended on one another. A faded green ribbon and a small brass key invite you to learn what remains. There is no deadline at the gate. Take the road a portion at a time; the work already done remains behind you. Farther out, abandoned posts stand quiet in the mist. The local folk call those silent reaches the Grey Host.',
 route:{id:'oakhaven',start:0,end:30},openingCondition:{rank:0},closingCondition:{distance:30},
 hooks:[{km:0,title:'The Keep',text:'A small brass key is placed in your care.'},{km:9,title:'The Old Mill',text:'A father has kept the tools dry and the wheel turning.'},{km:21,title:'The Wayfarer’s Inn',text:'A sealed letter waits for the next pair of useful hands.'},{km:30,title:'Oakhaven',text:'The message reaches Mara beside the repaired granary.'}],
 encounters:['bridge','cart','shelter','scholar-road','merchant','shrine','rain','shepherd','messenger','beacon-keeper'],
 closingTitle:'THE LAMPS OF OAKHAVEN',
 closing:'The key, the measuring cord and the letters have reached their proper hands. Mara sends word home, and the miller’s place in the story is no longer a question left unanswered. The road has brought people back into one another’s reach. Beyond the village, some watchfires remain dark. Tonight, here, lamps answer lamps. Chapter I closes; the journey and the earlier work remain yours.',
 song:{id:'oakhaven-lamps',title:'Lamps Along the Road'},
}];
export function activeChapter(state:State,date:string) {return chapters.find(c=>!known(state,'chapter',c.id)&&(!c.previous||known(state,'chapter',c.previous))&&meets(state,c.openingCondition,date));}
export function reconcileChapters(state:State,date:string,provenance:WorldMilestone['provenance']):State {
 let next=state;
 for(const chapter of chapters) {
  if(known(next,'chapter',chapter.id)||!meets(next,chapter.openingCondition,date)||(chapter.previous&&!known(next,'chapter',chapter.previous))||!meets(next,chapter.closingCondition,date))continue;
  next=remember(next,{id:chapter.id,kind:'chapter',date,provenance,title:chapter.closingTitle,text:chapter.closing,location:'Journey'});
  if(chapter.song)next=remember(next,{id:chapter.song.id,kind:'song',date,provenance,title:chapter.song.title,text:'An air named for the chapter, preserved in the Songbook. Its music will come in its own time.',location:'Great Hall'});
  const previous=chapter.previous?next.world.milestones.find(m=>m.kind==='chapter'&&m.id===chapter.previous)?.date:undefined;
  const start=previous??(next.world.trackingSince>date?date:next.world.trackingSince), event=next.world.milestones.find(m=>m.kind==='chapter'&&m.id===chapter.id)!;
  next=snapshotPage(next,{id:`chapter:${chapter.id}`,kind:'chapter',start,end:date,title:chapter.title,narrative:`${chapter.opening}\n\n${chapter.closing}`,
   highlights:[{label:'Recorded Journey distance',value:`${Number(totals(next).distance.toFixed(3))} km`},{label:'Chapter conclusion',value:chapter.closingTitle}],events:[structuredClone(event)],reconstructed:provenance==='discovered'});
 }
 return next;
}
