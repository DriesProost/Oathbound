import {enemies} from './combatContent';
import {runtimeAi} from './aiConfig';
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
 const arc:Arc={id,template:template.id,title:template.title,premise:template.premise,mystery:template.mystery,stage:0,started:date};
 return {...state,living:{...state.living,story:{...state.living.story,arcs:[arc],currentArcId:id,npcs:retinue.map(m=>({id:m.id,name:m.name,role:m.role})),places:structuredClone(storyPlaces),mysteries:[template.mystery]}}};
}
export function canContinue(state:State,date:string):boolean {
 if(!validDay(date)||date<state.created)return false;
 const s=state.living.story,last=s.beats.at(-1);
 if(!last)return true;
 if(last.date>=date||s.beats.some(b=>b.choices.length&&!b.chosen)||last.combatSetup&&!state.living.battles.some(b=>b.beatId===last.id&&b.status!=='active'&&(b.status!=='withdrawn'||(enemies.find(e=>e.id===b.enemyId)?.alternatives.length??1)>0)))return false;
 // Two recorded real-world actions between developments; no deadline or loss.
 return progressCount(state)>=(last.progress??0)+2;
}
type SceneResponse={title:string;prose:string;canonFactsAdded:string[];hooksAdded:string[];hooksResolved:string[];choices:StoryChoice[];speakerId?:string;newNpc?:{id:string;name:string;role:string};newPlace?:{id:string;name:string;description:string};futureSeed?:string;nextArc?:{title:string;premise:string;mystery:string}};
const forbiddenTruth=/\b(?:xp|renown|rank|oath|kilometre|kilometer|workout|weight|calorie|attribute level|relic earned|completed.{0,15}venture|you (?:ran|walked|trained|lost))\b/i;
export function validScene(v:unknown):v is SceneResponse {
 if(!exact(v,['title','prose','canonFactsAdded','hooksAdded','hooksResolved','choices','speakerId','newNpc','newPlace','futureSeed','nextArc']))return false;
 const g=v as SceneResponse;
 if(!safeProse(g.title,160)||!safeProse(g.prose,4000)||!texts(g.canonFactsAdded,4)||!texts(g.hooksAdded,3)||!texts(g.hooksResolved,3)||![...g.canonFactsAdded,...g.hooksAdded,...g.hooksResolved].every(t=>safeProse(t,300))||forbiddenTruth.test(JSON.stringify(g)))return false;
 if(!Array.isArray(g.choices)||g.choices.length>2||!g.choices.every(c=>exact(c,['id','label','outcome'])&&text(c.id,80)&&safeProse(c.label,150)&&safeProse(c.outcome,800))||new Set(g.choices.map(c=>c.id)).size!==g.choices.length)return false;
 if(g.speakerId!==undefined&&!text(g.speakerId,80))return false;
 if(g.newNpc!==undefined&&(!exact(g.newNpc,['id','name','role'])||!/^npc:[a-z0-9-]{1,50}$/.test(g.newNpc.id)||!safeProse(g.newNpc.name,80)||!safeProse(g.newNpc.role,200)))return false;
 if(g.newPlace!==undefined&&(!exact(g.newPlace,['id','name','description'])||!/^place:[a-z0-9-]{1,50}$/.test(g.newPlace.id)||!safeProse(g.newPlace.name,80)||!safeProse(g.newPlace.description,300)))return false;
 if(g.nextArc!==undefined&&(!exact(g.nextArc,['title','premise','mystery'])||!safeProse(g.nextArc.title,160)||!safeProse(g.nextArc.premise,800)||!safeProse(g.nextArc.mystery,300)))return false;
 return g.futureSeed===undefined||safeProse(g.futureSeed,150);
}
export async function continueStory(original:State,date:string,provider?:NarrativeProvider,signal?:AbortSignal):Promise<State> {
 let state=prepareStory(original,date);if(!canContinue(state,date))return state;
 let s=state.living.story,arc=s.arcs.find(a=>a.id===s.currentArcId)!;
 if(arc.completed){
  const template=arcTemplates[s.arcs.length%arcTemplates.length],id=`arc:${s.arcs.length+1}`,seed=s.futureSeeds.at(-1);
  const planned=s.plannedArc;
  arc={id,template:s.arcs.length<2?template.id:'open-road',title:planned?.title??seed??template.title,
   premise:planned?.premise??(s.arcs.length<2?template.premise:'A neighbouring household has sent a letter. A local question is waiting for patient attention.'),
   mystery:planned?.mystery??(s.arcs.length<2?template.mystery:`What has prompted the letter called “${seed??template.title}”?`),stage:0,started:date};
  s={...s,arcs:[...s.arcs,arc],currentArcId:id,plannedArc:null,mysteries:[...s.mysteries,arc.mystery!]};state={...state,living:{...state.living,story:s}};
 }
 const template=arcTemplates.find(t=>t.id===arc.template)??arcTemplates[0],stage=arc.stage;
 const genericScenes=[
  {title:'A letter from a neighbour',prose:'The letter has been folded and refolded. A neighbouring household asks for someone willing to hear a question without deciding the answer first.',location:'village',type:'letter'},
  {title:'The place mentioned',prose:'The road leads to the place described in the letter. Old repairs and recent footprints tell different parts of its story. Ysabel suggests beginning with the people who use it.',location:'fields',type:'scene'},
  {title:'An account worth hearing',prose:'A neighbour brings a second account. It does not quite agree with the first. Aldren asks which detail each person thought too obvious to mention.',location:'monastery',type:'scene'},
  {title:'How to put the question',prose:'Those involved offer two ways forward: an open hearing or a quiet conversation first. Each has its advantages, and each will be remembered by the people asked to attend.',location:'inn',type:'scene'},
  {title:'An objection on the road',prose:'A traveller objects to carrying the question further. The disagreement has reached the road ahead. There is room to talk, to stand your ground, or to find another way.',location:'forest',type:'confrontation',enemy:'poacher'},
  {title:'What the neighbours knew',prose:'With the different accounts brought together, the misunderstanding becomes smaller and more useful. The people involved agree on a practical arrangement they can explain to their neighbours.',location:'mill',type:'scene'},
  {title:'A useful ending',prose:'The neighbours have an arrangement of their own, and the letter can be put away. Tomas leaves a few lines beside it. Another question will belong to another journey; this one has its ending.',location:'village',type:'ending'},
 ] as const;
 const baseScene=arc.template==='open-road'?genericScenes[stage]:template.scenes[stage];
 const rotation=['poacher','boar','veteran','ambush','tavern-challenger'];
 const rotatedEnemy=rotation[(s.arcs.length-3+rotation.length)%rotation.length];
 const scene=arc.template==='open-road'&&stage===4?{...baseScene,enemy:rotatedEnemy,prose:rotatedEnemy==='boar'?'A startled boar stands beside the thicket. It needs space, not an argument. The path beyond remains visible.':rotatedEnemy==='veteran'?'A veteran offers a measured bout with practice blades, as a test before opening the tower’s training court. You may leave and return; settling the bout requires facing it.':'A local confrontation interrupts the question you are following. There is room to understand the people involved before deciding how to proceed.'}:baseScene,mystery=arc.mystery??template.mystery;
 const choices:StoryChoice[]=stage===3?[{id:'public',label:'Carry the request for an open hearing',outcome:'You carry the neighbours’ request for a public hearing. The innkeeper offers a table and agrees to listen.'},{id:'quiet',label:'Begin with a quiet conversation',outcome:'You ask for a quiet conversation first. The villagers agree to hear what comes of it before gathering.'}]:[];
 const previousBattle=state.living.battles.at(-1);
 const fallbackProse=stage===5&&previousBattle&&['defeat','withdrawn'].includes(previousBattle.status)?'After you find another route, a neighbour brings the account to the inn. The people named in it agree to speak. '+scene.prose.replace('Inside the tower, a ledger', 'A copied ledger'):scene.prose;
 const fallback:SceneResponse={title:scene.title,prose:fallbackProse,canonFactsAdded:stage===5?[mystery+' The neighbours’ account is now understood.']:[],hooksAdded:stage===0?[mystery]:[],hooksResolved:stage===6?[mystery]:[],choices};
 const enabled=state.living.settings.enabled&&state.living.settings.story;
 let generated=await generateSafely(enabled?provider:undefined,{task:'story',context:{...narrativeContext(state),nextScene:scene,requiredChoice:stage===3,previousOutcome:s.choices.at(-1)?.outcome},schema:{title:'string',prose:'string',canonFactsAdded:['fictional fact'],hooksAdded:['fictional hook'],hooksResolved:['existing hook only'],choices:stage===3?[{id:'string',label:'string',outcome:'fiction only'}]:[],speakerId:'optional established NPC ID',newNpc:'optional {id: npc:slug,name,role}',newPlace:'optional {id: place:slug,name,description}',futureSeed:'optional future arc title',nextArc:stage===6?'optional {title,premise,mystery} for a genuinely new local problem':'omit'},instruction:'Write the next stage of this connected arc, using nextScene as the structural plan and the previous choice as canon. Never resolve combat in prose. No real-life claims. Include two meaningful choices at the required choice stage and none elsewhere. Respect the planned discoveries and ending.'},validScene,fallback,signal);
 const g=generated.content;
 if((stage!==6&&!!g.nextArc)||(stage===4&&/\b(victory|defeated|killed|slain|health|stamina|momentum)\b/i.test(g.prose))||(stage===3?g.choices.length!==2:g.choices.length!==0)||g.speakerId&&!s.npcs.some(n=>n.id===g.speakerId)||g.hooksResolved.some(h=>!s.hooks.includes(h))||g.newNpc&&s.npcs.some(n=>n.id===g.newNpc!.id)||g.newPlace&&s.places.some(p=>p.id===g.newPlace!.id))generated={content:fallback,source:'authored'};
 const c=generated.content;
 const beat:StoryBeat={id:`${arc.id}:stage:${stage}`,date,arcId:arc.id,stage,type:scene.type,title:c.title,prose:c.prose,speakerId:c.speakerId,locationId:c.newPlace?.id??scene.location,canonFactsAdded:c.canonFactsAdded,hooksAdded:c.hooksAdded,hooksResolved:c.hooksResolved,choices:c.choices,progress:progressCount(state),...('enemy' in scene?{combatSetup:scene.enemy}:{}),provenance:{source:generated.source,generatedAt:date,...(generated.source==='ai'?{model:runtimeAi.model}:{})}};
 if(s.beats.some(b=>b.id===beat.id))return state;
 const ending=stage===6;
 return {...state,living:{...state.living,story:{...s,arcs:s.arcs.map(a=>a.id===arc.id?{...a,stage:Math.min(6,stage+1),...(ending?{completed:date}:{})}:a),beats:[...s.beats,beat],lastGenerated:date,
  hooks:[...new Set([...s.hooks.filter(h=>!c.hooksResolved.includes(h)),...c.hooksAdded])],worldFacts:[...new Set([...s.worldFacts,...c.canonFactsAdded])],
  npcs:c.newNpc?[...s.npcs,c.newNpc]:s.npcs,places:c.newPlace?[...s.places,c.newPlace]:s.places,
  mysteries:ending?s.mysteries.filter(m=>m!==mystery):s.mysteries,completedMysteries:ending?[...new Set([...s.completedMysteries,mystery])]:s.completedMysteries,
  plannedArc:ending?c.nextArc??null:s.plannedArc,
  futureSeeds:ending?[...s.futureSeeds,c.futureSeed??template.seed]:s.futureSeeds,mood:ending?'A lamp at a new window':'A question worth following',weather:recordedDays(state).size%2?'Rain beyond the windows':'Pale light on the road'}}};
}
export function chooseStory(state:State,beatId:string,choiceId:string,date:string):State {
 const s=state.living.story,b=s.beats.find(b=>b.id===beatId),choice=b?.choices.find(c=>c.id===choiceId);
 if(!b||b.chosen||!choice||!validDay(date)||date<b.date)return state;
 return {...state,living:{...state.living,story:{...s,beats:s.beats.map(x=>x.id===beatId?{...x,chosen:choiceId}:x),choices:[...s.choices,{beatId,choiceId,outcome:choice.outcome,date}],worldFacts:[...s.worldFacts,choice.outcome],relationships:[...s.relationships,{npcId:'scout',note:'Ysabel remembers: '+choice.outcome}]}}};
}

export function storyWaitingMessage(state:State,date:string):string {
 const s=state.living.story,last=s.beats.at(-1);
 if(!last)return 'A letter is finding its way to the Keep. Your deeds are ready while the scene is prepared.';
 if(s.beats.some(b=>b.choices.length&&!b.chosen))return 'Your reply above will shape this part of the road.';
 if(last.combatSetup&&!state.living.battles.some(b=>b.beatId===last.id&&b.status!=='active'&&(b.status!=='withdrawn'||b.opponent.alternatives.length>0)))return 'The meeting on the road awaits your response. Choose how to approach it above.';
 if(last.date>=date)return 'This is today’s page. The next page becomes available on a later day as your campaign grows.';
 if(!canContinue(state,date))return 'The road is quiet. A little more recorded real-life activity will carry the story forward.';
 return 'The next page is being prepared. Open it whenever it suits you.';
}
