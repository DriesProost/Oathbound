import type { State } from './model';
import type { EncounterRecord, WorldMilestone } from './worldModel';
import { totals } from './domain';
import { dayKey, validDay } from './calendar';
import { chapters } from './chapters';
import { meets } from './worldConditions';
import { remember } from './worldRecords';
export type Encounter = {id:string;routeId:string;chapterId:string;range:{start:number;end:number};title:string;text:string;choices:EncounterRecord['choices']};
export const encounters:readonly Encounter[]=[
 {id:'bridge',routeId:'oakhaven',chapterId:'oakhaven',range:{start:2,end:4},title:'The Washed-Out Footbridge',text:'A narrow bridge has lost a plank. A road keeper points to two sound ways onward, neither quite as direct as the old crossing.',choices:[
  {id:'ford',label:'Ask about the marked ford',text:'The keeper explains the shallower crossing and marks it on your map. You follow the safe posted path.',memory:'The marked ford is remembered on the household map.'},
  {id:'detour',label:'Take the upper detour',text:'The upper path passes a small orchard. Its extra bend gives you a good view of the mill stream.',memory:'The orchard detour is remembered on the household map.'}]},
 {id:'cart',routeId:'oakhaven',chapterId:'oakhaven',range:{start:5,end:7},title:'A Carter at the Bend',text:'A carter has already unloaded a damaged axle. She can repair it, but would welcome either a steady pair of hands or word sent ahead.',choices:[
  {id:'hold',label:'Stay for the small repair',text:'You hold the spare part while she fits it. She tells you which inn keeps a dry place for tools.',memory:'The carter remembers company while the axle was mended.'},
  {id:'message',label:'Carry word to the next stop',text:'You carry a practical message so her customer will know why the cart is late.',memory:'The carter’s delayed delivery was explained at the next stop.'}]},
 {id:'shelter',routeId:'oakhaven',chapterId:'oakhaven',range:{start:10,end:12},title:'The Monastery Court',text:'A small monastery offers a covered court to passing travellers. Beyond it, a gardener and a copyist are making quite different uses of the afternoon.',choices:[
  {id:'garden',label:'Sit beside the herb beds',text:'The gardener names the plants used in the kitchen and recommends a bench away from the draught.',memory:'The monastery’s sheltered herb garden is remembered.'},
  {id:'script',label:'Look into the scriptorium',text:'The copyist shows how one sheet is ruled before a single word is written.',memory:'The ruled manuscript page is remembered from the monastery.'}]},
 {id:'scholar-road',routeId:'oakhaven',chapterId:'oakhaven',range:{start:12.5,end:14},title:'The Traveller with a Diagram',text:'A traveller shelters his papers under a cloak. He introduces himself as Brother Aldren and admits that the diagram is more waterproof than the notes explaining it.',choices:[
  {id:'diagram',label:'Ask what the diagram explains',text:'Aldren describes a waterwheel and how a small change in its gearing changes the work it can do.',memory:'We spoke about waterwheels beside the alder trees. I still have that diagram.',characterId:'scholar'},
  {id:'road',label:'Ask which road he is taking',text:'He is looking for a dry library where people ask questions. You mention the Keep, without promising more than a welcome.',memory:'You told me there was room for questions at the Keep. A useful sort of invitation.',characterId:'scholar'}]},
 {id:'merchant',routeId:'oakhaven',chapterId:'oakhaven',range:{start:15,end:17},title:'A Merchant’s Reckoning',text:'A merchant is sorting small tally sticks beside a pack mule. There is time for one useful question before she sets out.',choices:[
  {id:'markets',label:'Ask about the village markets',text:'She describes how neighbouring villages hold markets on different days so a trader can make a circuit.',memory:'The neighbouring market circuit is known in the Keep.'},
  {id:'grain',label:'Ask where the grain goes',text:'She traces the road from fields to mill to granary. A repaired crossing matters to more people than those who live beside it.',memory:'The grain road from mill to granary is known in the Keep.'}]},
 {id:'shrine',routeId:'oakhaven',chapterId:'oakhaven',range:{start:18,end:20},title:'Names in the Stone',text:'A wayside shelter carries names cut into its old lintel. The place is quiet, with room to look without disturbing anything.',choices:[
  {id:'names',label:'Read the surviving names',text:'Some letters are worn away. You remember those still visible without inventing the missing ones.',memory:'The shelter’s surviving names were remembered.'},
  {id:'masonry',label:'Notice how the lintel is supported',text:'The stones beneath it have been repaired in different seasons. The shelter is a record of practical care.',memory:'The shelter’s layered repairs were noticed.'}]},
 {id:'rain',routeId:'oakhaven',chapterId:'oakhaven',range:{start:22,end:23},title:'Rain Beyond the Inn',text:'A steady shower darkens the road. Two sheltered places are close at hand, and nobody is asking you to hurry.',choices:[
  {id:'porch',label:'Wait on the covered porch',text:'From the porch, you watch the water find the repaired ditch. The rain eases in its own time.',memory:'The covered porch and repaired roadside ditch are remembered.'},
  {id:'company',label:'Share the roadside shelter',text:'Another traveller makes room. The conversation concerns dry socks and the best bread at the inn.',memory:'A practical conversation passed the rainy interval.'}]},
 {id:'shepherd',routeId:'oakhaven',chapterId:'oakhaven',range:{start:24,end:25},title:'Rumours at the Sheep Gate',text:'A shepherd closes the lower gate and asks where you are bound. He knows the village and the hills beyond it.',choices:[
  {id:'beacon',label:'Ask about the unlit beacon',text:'He says the old beacon has been quiet for years. People call the unused reaches the Grey Host, though there is no army to count.',memory:'The hills’ Grey Host is understood as silent, unused places, not an approaching army.'},
  {id:'village',label:'Ask about the village repairs',text:'The granary is dry again, he says, and Mara has found help with the northern approach.',memory:'The shepherd’s account of Oakhaven’s repairs is remembered.'}]},
 {id:'messenger',routeId:'oakhaven',chapterId:'oakhaven',range:{start:26,end:27},title:'The Messenger’s Pause',text:'A messenger rests beside the road after the infirmary dressed a scraped knee. His packet is safe; he is deciding how to continue comfortably.',choices:[
  {id:'directions',label:'Compare the gentler routes',text:'Together you find a level approach into the village. There is no glory in making the knee worse.',memory:'The gentler village approach is marked for travellers.'},
  {id:'wait',label:'Keep company until the cart arrives',text:'The expected cart offers him a seat. Before it comes, you hear about Mistress Elin’s calm work at the infirmary.',memory:'Mistress Elin’s practical care was mentioned by a grateful messenger.'}]},
 {id:'beacon-keeper',routeId:'oakhaven',chapterId:'oakhaven',range:{start:28,end:29.5},title:'The Beacon Keeper’s Ledger',text:'An old keeper is checking a hillside watch ledger. The nearest beacon has a use again; beyond it, other posts still wait in the mist.',choices:[
  {id:'names',label:'Ask who once kept the watch',text:'The keeper reads names rather than titles. A place is easier to remember when someone belonged there.',memory:'Names from the old watch ledger have been carried toward the Keep.'},
  {id:'signals',label:'Ask how the fires answered',text:'He explains how each post needed a clear view of the next. One restored fire makes another place easier to find.',memory:'The answering chain of watchfires is understood.'}]},
];
export function reconcileEncounters(state:State,date:string,provenance:WorldMilestone['provenance']):State {
 const distance=totals(state).distance;
 const newlyAvailable=encounters.filter(e=>!state.world.encounters.some(r=>r.id===e.id)&&distance>=e.range.start&&chapters.some(c=>c.id===e.chapterId&&c.route.id===e.routeId&&c.encounters.includes(e.id)&&meets(state,c.openingCondition,date)&&(!c.previous||state.world.milestones.some(m=>m.kind==='chapter'&&m.id===c.previous))));
 if(!newlyAvailable.length)return state;
 // A large real-world patrol may pass an entire interval. Its story remains available rather than being lost.
 return {...state,world:{...state.world,encounters:[...state.world.encounters,...newlyAvailable.map(e=>({id:e.id,date,title:e.title,text:e.text,chapterId:e.chapterId,routeId:e.routeId,km:e.range.start,range:structuredClone(e.range),provenance,choices:structuredClone(e.choices)}))]}};
}
export function chooseEncounter(state:State,id:string,choiceId:string,date=dayKey()):State {
 const record=state.world.encounters.find(e=>e.id===id),choice=record?.choices.find(c=>c.id===choiceId);
 if(!record||record.choiceId||!choice||!validDay(date)||date<record.date)return state;
 const next={...state,world:{...state.world,encounters:state.world.encounters.map(e=>e.id===id?{...e,choiceId,resolvedDate:date}:e)}};
 return remember(next,{id,kind:'encounter',date,provenance:'earned',title:record.title,text:`${choice.text} ${choice.memory}`,location:'Journey'});
}
