export const attributes = ['Strength','Endurance','Resolve','Vitality','Presence','Wisdom'] as const;
export type Attribute = typeof attributes[number];
export type Quest = {id:string;name:string;description:string;attribute:Attribute;points:number;renown:number;distance?:number};
export const quests:Quest[] = [
 {id:'oath',name:'Keep the Oath',description:'Remain alcohol-free today',attribute:'Resolve',points:25,renown:40},
 {id:'training',name:'Training Yard',description:'Complete a workout',attribute:'Strength',points:20,renown:35},
 {id:'patrol',name:'Patrol the Realm',description:'Walk 3 km today',attribute:'Endurance',points:15,renown:30,distance:3},
 {id:'provisions',name:'Mind Your Provisions',description:'Meet your personal nutrition target',attribute:'Vitality',points:15,renown:25},
 {id:'presence',name:'Attend Thy Person',description:'Take time for grooming or skincare',attribute:'Presence',points:10,renown:20},
 {id:'study',name:"Scholar’s Hour",description:'Read or study for 20 minutes',attribute:'Wisdom',points:15,renown:25},
 {id:'rest',name:'Rest for the Road',description:'Meet your personal sleep goal',attribute:'Vitality',points:15,renown:25},
];
export type Entry = {date:string;questId:string;renown:number;attribute:Attribute;points:number;distance:number};
export type State = {version:1;name:string;created:string;entries:Entry[];oaths:Record<string,boolean>};
export function dayKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function previousDay(day:string){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()-1);return dayKey(d);}
export function createKnight(name:string,date=dayKey()):State{return {version:1,name:name.trim()||'The Traveller',created:date,entries:[],oaths:{}};}
export function completeQuest(state:State,id:string,date=dayKey()):State{
 const quest=quests.find(q=>q.id===id);
 if(!quest||state.entries.some(e=>e.date===date&&e.questId===id)||(id==='oath'&&state.oaths[date]===false))return state;
 return {...state,entries:[...state.entries,{date,questId:id,renown:quest.renown,attribute:quest.attribute,points:quest.points,distance:quest.distance||0}],oaths:id==='oath'?{...state.oaths,[date]:true}:state.oaths};
}
export function recordSetback(state:State,date=dayKey()):State{return {...state,oaths:{...state.oaths,[date]:false}};}
export function totals(state:State){return {renown:state.entries.reduce((n,e)=>n+e.renown,0),distance:state.entries.reduce((n,e)=>n+e.distance,0),stats:Object.fromEntries(attributes.map(a=>[a,state.entries.filter(e=>e.attribute===a).reduce((n,e)=>n+e.points,0)])) as Record<Attribute,number>};}
export const ranks=[{name:'Squire',threshold:0},{name:'Man-at-Arms',threshold:250},{name:'Knight Errant',threshold:750},{name:'Knight',threshold:1500},{name:'Knight Banneret',threshold:3000}];
export function rankProgress(renown:number){const index=ranks.findLastIndex(r=>renown>=r.threshold);const rank=ranks[index],next=ranks[index+1];return {rank,next,progress:next?(renown-rank.threshold)/(next.threshold-rank.threshold):1};}
export function oathStats(state:State,today=dayKey()){
 const dates=Object.keys(state.oaths).filter(d=>d<=today).sort();let longest=0,run=0,last='';
 for(const d of dates){run=state.oaths[d]?(last===previousDay(d)?run+1:1):0;longest=Math.max(longest,run);last=d;}
 let current=0,cursor=state.oaths[today]===undefined?previousDay(today):today;
 while(state.oaths[cursor]===true){current++;cursor=previousDay(cursor);}
 let start=today;for(let i=1;i<30;i++)start=previousDay(start);
 const recent=dates.filter(d=>d>=start);const sober=dates.filter(d=>state.oaths[d]).length;
 return {current,longest,sober,logged:recent.length,percentage:recent.length?Math.round(recent.filter(d=>state.oaths[d]).length/recent.length*100):null};
}
