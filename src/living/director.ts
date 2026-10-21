import type {State} from '../model';
import {validDay} from '../calendar';
import {retinue} from '../retinue';
import {recordedDays} from '../worldConditions';
import {arcTemplates,storyPlaces} from './arcs';
import type {StoryBeat,StoryChoice,Arc} from './model';
import {safeProse} from './ventureGeneration';
import {exact,text,texts} from './validation';
import {narrativeContext} from './context';
import {generateSafely,type NarrativeProvider} from './provider';
export const progressCount=(s:State)=>s.entries.length+s.ventures.filter(v=>v.rewardGrant).length+Object.values(s.oaths).filter(o=>o.status==='kept').length;
export function prepareStory(state:State,date:string):State {
 if(state.living.story.arcs.length||!validDay(date)||date<state.created)return state;
 const template=arcTemplates[0],id='arc:1';
 const arc:Arc={id,template:template.id,title:template.title,premise:template.premise,stage:0,started:date};
 return {...state,living:{...state.living,story:{...state.living.story,arcs:[arc],currentArcId:id,npcs:retinue.map(m=>({id:m.id,name:m.name,role:m.role})),places:structuredClone(storyPlaces),mysteries:[template.mystery]}}};
}
export function canContinue(state:State,date:string):boolean {
 if(!validDay(date)||date<state.created)return false;
 const s=state.living.story,last=s.beats.at(-1);
 if(!last)return true;
 if(last.date>=date||s.beats.some(b=>b.choices.length&&!b.chosen)||last.combatSetup&&!state.living.battles.some(b=>b.beatId===last.id&&b.status!=='active'))return false;
 // Two recorded real-world actions between developments; no deadline or loss.
 return progressCount(state)>=(last.progress??0)+2;
}
type SceneResponse={title:string;prose:string;canonFactsAdded:string[];hooksAdded:string[];hooksResolved:string[];choices:StoryChoice[];speakerId?:string;newNpc?:{id:string;name:string;role:string};newPlace?:{id:string;name:string;description:string};futureSeed?:string};
const forbiddenTruth=/\b(?:xp|renown|rank|oath|kilometre|kilometer|workout|weight|calorie|attribute level|relic earned|completed.{0,15}venture|you (?:ran|walked|trained|lost))\b/i;
export function validScene(v:unknown):v is SceneResponse {
 if(!exact(v,['title','prose','canonFactsAdded','hooksAdded','hooksResolved','choices','speakerId','newNpc','newPlace','futureSeed']))return false;
 const g=v as SceneResponse;
 if(!safeProse(g.title,160)||!safeProse(g.prose,4000)||!texts(g.canonFactsAdded,4)||!texts(g.hooksAdded,3)||!texts(g.hooksResolved,3)||![...g.canonFactsAdded,...g.hooksAdded,...g.hooksResolved].every(t=>safeProse(t,300))||forbiddenTruth.test(JSON.stringify(g)))return false;
 if(!Array.isArray(g.choices)||g.choices.length>2||!g.choices.every(c=>exact(c,['id','label','outcome'])&&text(c.id,80)&&safeProse(c.label,150)&&safeProse(c.outcome,800))||new Set(g.choices.map(c=>c.id)).size!==g.choices.length)return false;
 if(g.speakerId!==undefined&&!text(g.speakerId,80))return false;
 if(g.newNpc!==undefined&&(!exact(g.newNpc,['id','name','role'])||!/^npc:[a-z0-9-]{1,50}$/.test(g.newNpc.id)||!safeProse(g.newNpc.name,80)||!safeProse(g.newNpc.role,200)))return false;
 if(g.newPlace!==undefined&&(!exact(g.newPlace,['id','name','description'])||!/^place:[a-z0-9-]{1,50}$/.test(g.newPlace.id)||!safeProse(g.newPlace.name,80)||!safeProse(g.newPlace.description,300)))return false;
 return g.futureSeed===undefined||safeProse(g.futureSeed,150);
}
export async function continueStory(original:State,date:string,provider?:NarrativeProvider):Promise<State> {
 let state=prepareStory(original,date);if(!canContinue(state,date))return state;
 let s=state.living.story,arc=s.arcs.find(a=>a.id===s.currentArcId)!;
 if(arc.completed){
  const template=arcTemplates[s.arcs.length%arcTemplates.length],id=`arc:${s.arcs.length+1}`,seed=s.futureSeeds.at(-1);
  arc={id,template:template.id,title:seed??template.title,premise:template.premise,stage:0,started:date};
  s={...s,arcs:[...s.arcs,arc],currentArcId:id,mysteries:[...s.mysteries,template.mystery]};state={...state,living:{...state.living,story:s}};
 }
 const template=arcTemplates.find(t=>t.id===arc.template)??arcTemplates[0],stage=arc.stage,scene=template.scenes[stage];
 const choices:StoryChoice[]=stage===3?[{id:'public',label:'Carry the request for an open hearing',outcome:'You carry the neighbours’ request for a public hearing. The innkeeper offers a table and agrees to listen.'},{id:'quiet',label:'Begin with a quiet conversation',outcome:'You ask for a quiet conversation first. The villagers agree to hear what comes of it before gathering.'}]:[];
 const fallback:SceneResponse={title:scene.title,prose:scene.prose,canonFactsAdded:stage===5?[template.mystery+' The neighbours’ account is now understood.']:[],hooksAdded:stage===0?[template.mystery]:[],hooksResolved:stage===6?[template.mystery]:[],choices};
 const enabled=state.living.settings.enabled&&state.living.settings.story;
 let generated=await generateSafely(enabled?provider:undefined,{task:'story',context:{...narrativeContext(state),nextScene:scene,requiredChoice:stage===3,previousOutcome:s.choices.at(-1)?.outcome},schema:{title:'string',prose:'string',canonFactsAdded:['fictional fact'],hooksAdded:['fictional hook'],hooksResolved:['existing hook only'],choices:stage===3?[{id:'string',label:'string',outcome:'fiction only'}]:[],speakerId:'optional established NPC ID',newNpc:'optional {id: npc:slug,name,role}',newPlace:'optional {id: place:slug,name,description}',futureSeed:'optional future arc title'},instruction:'Write the next stage of this connected arc, using nextScene as the structural plan and the previous choice as canon. Never resolve combat in prose. No real-life claims. Include two meaningful choices at the required choice stage and none elsewhere. Respect the planned discoveries and ending.'},validScene,fallback);
 const g=generated.content;
 if((stage===3?g.choices.length!==2:g.choices.length!==0)||g.speakerId&&!s.npcs.some(n=>n.id===g.speakerId)||g.hooksResolved.some(h=>!s.hooks.includes(h))||g.newNpc&&s.npcs.some(n=>n.id===g.newNpc!.id)||g.newPlace&&s.places.some(p=>p.id===g.newPlace!.id))generated={content:fallback,source:'authored'};
 const c=generated.content;
 const beat:StoryBeat={id:`${arc.id}:stage:${stage}`,date,arcId:arc.id,stage,type:scene.type,title:c.title,prose:c.prose,speakerId:c.speakerId,locationId:c.newPlace?.id??scene.location,canonFactsAdded:c.canonFactsAdded,hooksAdded:c.hooksAdded,hooksResolved:c.hooksResolved,choices:c.choices,progress:progressCount(state),...('enemy' in scene?{combatSetup:scene.enemy}:{}),provenance:{source:generated.source,generatedAt:date,...(generated.source==='ai'?{model:state.living.settings.model}:{})}};
 if(s.beats.some(b=>b.id===beat.id))return state;
 const ending=stage===6;
 return {...state,living:{...state.living,story:{...s,arcs:s.arcs.map(a=>a.id===arc.id?{...a,stage:Math.min(6,stage+1),...(ending?{completed:date}:{})}:a),beats:[...s.beats,beat],lastGenerated:date,
  hooks:[...new Set([...s.hooks.filter(h=>!c.hooksResolved.includes(h)),...c.hooksAdded])],worldFacts:[...new Set([...s.worldFacts,...c.canonFactsAdded])],
  npcs:c.newNpc?[...s.npcs,c.newNpc]:s.npcs,places:c.newPlace?[...s.places,c.newPlace]:s.places,
  mysteries:ending?s.mysteries.filter(m=>m!==template.mystery):s.mysteries,completedMysteries:ending?[...new Set([...s.completedMysteries,template.mystery])]:s.completedMysteries,
  futureSeeds:ending?[...s.futureSeeds,c.futureSeed??template.seed]:s.futureSeeds,mood:ending?'A lamp at a new window':'A question worth following',weather:recordedDays(state).size%2?'Rain beyond the windows':'Pale light on the road'}}};
}
export function chooseStory(state:State,beatId:string,choiceId:string,date:string):State {
 const s=state.living.story,b=s.beats.find(b=>b.id===beatId),choice=b?.choices.find(c=>c.id===choiceId);
 if(!b||b.chosen||!choice||!validDay(date)||date<b.date)return state;
 return {...state,living:{...state.living,story:{...s,beats:s.beats.map(x=>x.id===beatId?{...x,chosen:choiceId}:x),choices:[...s.choices,{beatId,choiceId,outcome:choice.outcome,date}],worldFacts:[...s.worldFacts,choice.outcome],relationships:[...s.relationships,{npcId:'scout',note:'Ysabel remembers: '+choice.outcome}]}}};
}
