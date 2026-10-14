import type { Attribute } from './config';
import type { State } from './model';
import type { WorldMilestone } from './worldModel';
import { meets, type WorldCondition } from './worldConditions';
import { known, remember } from './worldRecords';
export const titleThresholds={level:6,rank:1};
export type EarnedTitle={id:string;title:string;description:string;attributes:Attribute[];condition:WorldCondition;order?:string};
const pair=(a:Attribute,b:Attribute,...extra:WorldCondition[]):WorldCondition=>({all:[{rank:titleThresholds.rank},{level:{attribute:a,min:titleThresholds.level}},{level:{attribute:b,min:titleThresholds.level}},...extra]});
export const titles:readonly EarnedTitle[]=[
 {id:'marches',title:'Knight of the Marches',description:'Strength and endurance have found a common road.',attributes:['Strength','Endurance'],order:'The Marches',condition:pair('Strength','Endurance',{rank:2})},
 {id:'warden-scholar',title:'Warden-Scholar',description:'Considered thought and reliable beginnings share your watch.',attributes:['Wisdom','Resolve'],order:'The Scriptorium Watch',condition:pair('Wisdom','Resolve')},
 {id:'herald-keep',title:'Herald of the Keep',description:'Clear communication and steady purpose have given the household a voice.',attributes:['Presence','Resolve'],order:'The Hall',condition:pair('Presence','Resolve')},
 {id:'physic-garden',title:'Keeper of the Physic Garden',description:'Learning and practical care grow in the same beds.',attributes:['Vitality','Wisdom'],order:'The Garden',condition:pair('Vitality','Wisdom')},
 {id:'long-road',title:'Warden of the Long Road',description:'A hundred kilometres and a steady watch have made the road familiar.',attributes:['Endurance','Resolve'],order:'The Road Wardens',condition:pair('Endurance','Resolve',{distance:100})},
 {id:'hearthwarden',title:'Hearthwarden',description:'Useful strength is tempered by care for the person behind it.',attributes:['Strength','Vitality'],order:'The Hearth',condition:pair('Strength','Vitality')},
 {id:'road-envoy',title:'Envoy of the Open Road',description:'The Oakhaven journey and your way with people have left a name beyond the gate.',attributes:['Presence','Endurance'],order:'The Road',condition:pair('Presence','Endurance',{chapter:'oakhaven'})},
 {id:'arms-archives',title:'Keeper of Arms and Archives',description:'Practice and understanding have earned places beside one another.',attributes:['Strength','Wisdom'],order:'The Yard and Library',condition:pair('Strength','Wisdom')},
 {id:'common-table',title:'Steward of the Common Table',description:'Practical care and a thoughtful welcome have made a household.',attributes:['Presence','Vitality'],order:'The Hall',condition:pair('Presence','Vitality')},
 {id:'undertakings',title:'Chronicler of Undertakings',description:'Twenty-five chosen Ventures join wisdom to the discipline of beginning.',attributes:['Wisdom','Resolve'],order:'The Chronicle',condition:pair('Wisdom','Resolve',{ventures:25})},
];
export function reconcileTitles(state:State,date:string,provenance:WorldMilestone['provenance']):State {
 let next=state;for(const title of titles)if(meets(next,title.condition,date))next=remember(next,{id:title.id,kind:'title',date,provenance,title:title.title,text:title.description,category:title.order,origin:`${title.attributes.join(' + ')} development`});return next;
}
export function preferTitle(state:State,id:string|null):State {
 if(state.world.preferredTitle===id||(id!==null&&!known(state,'title',id)))return state;
 return {...state,world:{...state.world,preferredTitle:id}};
}
export function displayedTitle(state:State) {return state.world.milestones.find(m=>m.kind==='title'&&m.id===state.world.preferredTitle)?.title;}
