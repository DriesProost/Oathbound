import type { State } from './model';
import type { WorldMilestone } from './worldModel';
import { meets, type WorldCondition } from './worldConditions';
import { known, remember } from './worldRecords';
import { keepAreas } from './keep';
const developed=(stage:number):WorldCondition=>({any:keepAreas.map(a=>({keep:{attribute:a.attribute,stage}}))});
export const restorations:readonly {id:string;place:string;title:string;quiet:string;restored:string;condition:WorldCondition}[]=[
 {id:'eastern-beacon',place:'Eastern Beacon',title:'THE EASTERN BEACON BURNS AGAIN',quiet:'An unlit post waits among the eastern hills.',restored:'For the first time in years, fire answers fire across the hills.',condition:{any:[{distance:6},{all:[{rank:1},developed(1)]}]}},
 {id:'mill-road',place:'Mill Crossing',title:'THE MILL ROAD OPENS',quiet:'The crossing lies quiet beyond the alders.',restored:'The mill crossing is marked and tended. Carts have a reliable way through.',condition:{any:[{distance:9},{relics:3}]}},
 {id:'inn-watch',place:'Wayfarer’s Watch',title:'A WATCH RETURNS TO THE ROAD',quiet:'A wayside watch shelter stands empty in the mist.',restored:'A sheltered watch post again welcomes people travelling between the inn and the Keep.',condition:{any:[{distance:21},{all:[{rank:2},developed(2)]}]}},
 {id:'village-gate',place:'Oakhaven Gate',title:'THE VILLAGE OPENS ITS GATE',quiet:'The village approach waits beyond the quiet reaches.',restored:'The granary is dry, the approach is tended, and the village gate opens to its neighbours.',condition:{any:[{chapter:'oakhaven'},{all:[{rank:3},{relics:4}]}]}},
 {id:'far-watch',place:'Northern Watchfire',title:'THE FAR WATCH ANSWERS',quiet:'Beyond the known road, one farther fire remains dark.',restored:'A farther watchfire answers the eastern beacon. The frontier has become a little more familiar.',condition:{any:[{all:[{chapter:'oakhaven'},developed(3)]},{all:[{rank:3},{relics:6}]}]}},
];
export function reconcileRestoration(state:State,date:string,provenance:WorldMilestone['provenance']):State {
 let next=state;for(const place of restorations)if(meets(next,place.condition,date))next=remember(next,{id:place.id,kind:'restoration',date,provenance,title:place.title,text:place.restored,location:place.place});return next;
}
export const restored=(state:State,id:string)=>known(state,'restoration',id);
