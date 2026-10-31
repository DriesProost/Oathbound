// Legacy snapshot utilities only; these systems are not part of the active app.
import type { State } from './model';
import { meets, type WorldCondition } from './worldConditions';
import { remember } from './worldRecords';
import type { WorldMilestone } from './worldModel';
export type Relic = { id:string;title:string;description:string;origin:string;category:string;location:string;condition:WorldCondition };
export const relics: readonly Relic[] = [
 {id:'road-boots',title:'The Road-Worn Boots',description:'Worn leather, carefully repaired. The road has left a hundred kilometres in its seams.',origin:'100 km of recorded Journey distance',category:'Road',location:'Scout Post',condition:{distance:100}},
 {id:'oath-clasp',title:'The Silver Oath-Clasp',description:'A plain clasp, carrying the memory of thirty confirmed commitments kept.',origin:'30 confirmed kept Oaths',category:'Oath',location:'Gatehouse',condition:{keptOaths:30}},
 {id:'scholars-folio',title:'The Scholar’s Folio',description:'Twenty-five lessons and undertakings have found their place among these leaves.',origin:'25 completed Ventures involving Wisdom',category:'Learning',location:'Library',condition:{ventures:25,attribute:'Wisdom'}},
 {id:'practice-blade',title:'The Practice Blade',description:'A blunt, well-balanced blade. Its polish comes from patient handling.',origin:'30 recorded strength sessions or Strength level 7',category:'Practice',location:'Training Yard',condition:{any:[{training:30},{level:{attribute:'Strength',min:7}}]}},
 {id:'knights-seal',title:'The Knight’s Seal',description:'An unadorned seal for a name that has become known through deeds.',origin:'Knight rank reached',category:'Service',location:'Great Hall',condition:{rank:3}},
 {id:'mara-key',title:'The Brass Storehouse Key',description:'A faded green ribbon remains tied to the key. A message reached its proper hands.',origin:'The Oakhaven road reached its final landmark',category:'Chapter',location:'Scout Post',condition:{chapter:'oakhaven'}},
 {id:'ventures-compass',title:'The Compass of Undertakings',description:'The small case bears marks from twenty-five deliberately chosen experiences.',origin:'25 completed Daily Ventures',category:'Ventures',location:'Scout Post',condition:{ventures:25}},
 {id:'herbalists-mortar',title:'The Herbalist’s Mortar',description:'A stone mortar rests beside clean cloth and a bowl ready for the next meal.',origin:'Vitality level 7',category:'Care',location:'Garden',condition:{level:{attribute:'Vitality',min:7}}},
 {id:'hall-candle',title:'The Hall Candle',description:'A brass holder from a room where people have learned to make one another welcome.',origin:'Presence level 7',category:'Welcome',location:'Great Hall',condition:{level:{attribute:'Presence',min:7}}},
 {id:'captains-ledger',title:'The Captain’s Ledger',description:'Useful beginnings and considered commitments fill the margins of this watch book.',origin:'Resolve level 7 and 30 days with recorded deeds, Ventures or kept Oaths',category:'Stewardship',location:'Gatehouse',condition:{all:[{level:{attribute:'Resolve',min:7}},{activeDays:30}]}},
 {id:'campaign-binding',title:'The Stitched Campaign Book',description:'Ninety recorded days have become a book worth binding. They need not have been consecutive.',origin:'90 distinct days with recorded deeds, Ventures or kept Oaths',category:'Chronicle',location:'Library',condition:{activeDays:90}},
 {id:'shared-bowl',title:'The Bowl at the Common Table',description:'Care for yourself and attention to others have found a place at the same table.',origin:'Vitality and Presence level 5, with 12 completed Ventures',category:'Household',location:'Great Hall',condition:{all:[{level:{attribute:'Vitality',min:5}},{level:{attribute:'Presence',min:5}},{ventures:12}]}},
];
export function reconcileRelics(state:State,date:string,provenance:WorldMilestone['provenance']):State {
 let next=state;for(const relic of relics)if(meets(next,relic.condition,date))next=remember(next,{id:relic.id,kind:'relic',date,provenance,title:relic.title,text:relic.description,origin:relic.origin,category:relic.category,location:relic.location});return next;
}
