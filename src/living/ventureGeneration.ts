import {runtimeAi} from './aiConfig';
import type {State} from '../model';
import {attributes} from '../config';
import {ventures,ventureTiers,type VentureDefinition} from '../ventures';
import {selectVenture,replaceDailyVenture,todaysVenture,prepareDailyNotice} from '../ventureDomain';
import {dayKey} from '../calendar';
import {narrativeContext} from './context';
import {generateSafely,type NarrativeProvider} from './provider';
import {exact,text,texts} from './validation';
export const physicalPlans = {
 'comfortable-strength': {attribute:'Strength',instructions:['Choose a comfortable bodyweight movement that is already familiar to you. Perform two sets of five controlled repetitions, resting as needed.'],minutes:10},
 'easy-road': {attribute:'Endurance',instructions:['Walk at an easy, comfortable pace for 15 minutes on a safe, familiar surface. Notice a detail you usually pass by. Adapt the time or movement if needed.'],minutes:15},
 'gentle-mobility': {attribute:'Vitality',instructions:['Spend 10 minutes on gentle, familiar mobility movements in a comfortable range. Pause or adapt whenever needed.'],minutes:10},
} as const;
const unsafe = /maximal|one.rep.max|\b1rm\b|sprint|exhaust|failure|punish|calorie|fasting|hold.{0,12}breath|breath.hold|ice.bath|cold.plunge|heat.wave|storm|traffic|roof|weapon|knife|firearm|medicat|diagnos|treat.{0,12}(ill|disease|injur)|cure|ignore.{0,12}pain|trespass|alcohol|gambl|supplement|all.out|suicide/i;
export const safeProse=(v:unknown,max=8000):v is string=>text(v,max)&&!/<|>|https?:|www\.|\b(?:renown|xp|rank promotion|oath broken|weight loss)\b/i.test(v);
const safety='Use a comfortable effort. Adapt or stop if needed, especially for pain, dizziness or discomfort. Choose safe surroundings and familiar movements.';
type GeneratedVenture = { title:string;attribute:VentureDefinition['attribute'];secondaryAttribute?:VentureDefinition['attribute'];tier:VentureDefinition['tier'];minutes:number;introduction:string;instructions:string[];steps?:string[];reading?:string;reflection?:string;tags:string[];equipment:string[];safety:string;consequenceHook:string;physicalPlan?:keyof typeof physicalPlans };
export function validGeneratedVenture(v:unknown):v is GeneratedVenture {
 if(!exact(v,['title','attribute','secondaryAttribute','tier','minutes','introduction','instructions','steps','reading','reflection','tags','equipment','safety','consequenceHook','physicalPlan']))return false;
 const g=v as GeneratedVenture;
 if(!safeProse(g.title,160)||!attributes.includes(g.attribute)||g.secondaryAttribute!==undefined&&(!attributes.includes(g.secondaryAttribute)||g.secondaryAttribute===g.attribute)||!Object.hasOwn(ventureTiers,g.tier)||!Number.isInteger(g.minutes)||g.minutes<5||g.minutes>60||!safeProse(g.introduction,800)||!texts(g.instructions,6)||!g.instructions.length||!g.instructions.every(t=>safeProse(t,800))||!texts(g.tags,8)||!texts(g.equipment,8)||!safeProse(g.safety,800)||!safeProse(g.consequenceHook,300))return false;
 const range={Brief:[5,20],Standard:[15,40],Bold:[30,60]}[g.tier];if(g.minutes<range[0]||g.minutes>range[1])return false;
 if(g.tags.some(t=>!['indoor','outdoor','evening','quiet','gym','kitchen','bodyweight','nature','equipment','reading','writing','social'].includes(t)))return false;
 if(g.steps!==undefined&&(!texts(g.steps,8)||!g.steps.every(t=>safeProse(t,500))))return false;
 if(g.reflection!==undefined&&!safeProse(g.reflection,500))return false;
 if(g.reading!==undefined&&(!safeProse(g.reading)||g.reading.trim().split(/\s+/).length<150||g.reading.trim().split(/\s+/).length>500))return false;
 if(g.attribute==='Wisdom'&&!g.reading)return false;
 if(unsafe.test(JSON.stringify(g)))return false;
 const physical=[g.attribute,g.secondaryAttribute].some(a=>['Strength','Endurance','Vitality'].includes(a??''));
 if(physical){
  // Free-form exercise prescriptions never reach the player. A closed conservative
  // plan supplies all physical instructions, duration and adaptations.
  if(!g.physicalPlan||!Object.hasOwn(physicalPlans,g.physicalPlan))return false;
  const plan=physicalPlans[g.physicalPlan];
  if(g.attribute!==plan.attribute||g.tier!=='Brief'||g.minutes!==plan.minutes||g.steps?.length||g.instructions.join('\n')!==plan.instructions.join('\n'))return false;
 } else if(g.physicalPlan!==undefined)return false;
 if(!physical&&/\b(?:squats?|push.ups?|burpees?|run|running|lifts?|sprint|planks?|lunges?|breath.hold|workouts?|exercises?|swim|climb)\b/i.test([...g.instructions,...(g.steps??[])].join(' ')))return false;
 if(!physical&&g.tags.some(t=>['gym','running','lifting','swimming','climbing'].includes(t)))return false;
 return true;
}
export async function generateReplacement(state:State,id:string,now:Date,provider?:NarrativeProvider):Promise<State>{
 const date=dayKey(now),current=todaysVenture(state,date);
 if(!state.living.settings.enabled||!state.living.settings.ventures||!provider||!current||current.assignmentId!==id||current.status!=='assigned'||current.replaced||current.replacementOf)return replaceDailyVenture(state,id,now);
 const target=selectVenture(state.ventures,date,`${state.created}:${state.name}`,ventures,current.attribute);
 if(!target)return state;
 const definition=await generatedDefinition(state,target,date,provider,'replacement');
 return replaceDailyVenture(state,id,now,definition?[definition]:ventures);
}
export async function generateFirstNotice(state:State,date:string,provider?:NarrativeProvider,signal?:AbortSignal):Promise<State>{
 const target=todaysVenture(state,date);
 if(!target||target.status!=='assigned'||target.replacementOf||target.replaced||!state.living.settings.enabled||!state.living.settings.ventures||!provider)return state;
 const definition=await generatedDefinition(state,target,date,provider,'first',signal);
 return definition?prepareDailyNotice(state,target.assignmentId,definition,date):state;
}
async function generatedDefinition(state:State,target:VentureDefinition,date:string,provider:NarrativeProvider,slot:'first'|'replacement',signal?:AbortSignal):Promise<VentureDefinition|undefined>{
 const fallback:GeneratedVenture={title:target.title,attribute:target.attribute,tier:target.tier,minutes:20,introduction:target.introduction,instructions:target.instructions.length?target.instructions:['Read the notice.'],tags:target.tags,equipment:[],safety:target.safety??safety,consequenceHook:'The road offers another small possibility.'};
 const result=await generateSafely(provider,{task:'venture',context:{...narrativeContext(state),requiredAttribute:target.attribute,requiredTier:target.tier,physicalPlans},schema:{title:'string',attribute:target.attribute,tier:target.tier,minutes:'integer 5–60',introduction:'string',instructions:['string'],steps:'optional string[]',reading:'required for Wisdom, original 150–500 words',reflection:'optional string',secondaryAttribute:'optional distinct attribute',tags:['indoor or outdoor'],equipment:['known equipment only'],safety:'adaptation text',consequenceHook:'fictional hook',physicalPlan:'required physical plan key for physical attributes'},instruction:'Create one new conservative real-life Venture. Respect required attribute and tier, preferred duration, indoor/outdoor constraints and equipment. Physical instructions MUST be copied exactly from an eligible physicalPlans entry and tier Brief. Never prescribe free-form exercise, medicine, dieting or hazards. A Wisdom reading alone suffices; reflection is optional.'},validGeneratedVenture,fallback,signal);
 if(result.source!=='ai')return undefined;
 const g=result.content,settings=state.living.settings;
 if(g.attribute!==target.attribute||g.tier!==target.tier||g.minutes>settings.preferredMinutes||!settings.outdoors&&(g.tags.includes('outdoor')||g.physicalPlan==='easy-road'||/\b(outside|outdoors|park|street|trail|neighbourhood|neighborhood)\b/i.test(g.instructions.join(' ')))||g.equipment.some(e=>!settings.equipment.includes(e)))return undefined;
 const definition:VentureDefinition={id:`generated:${date}:${slot}`,title:g.title,attribute:g.attribute,...(g.secondaryAttribute?{secondaryAttributes:[g.secondaryAttribute]}:{}),tier:g.tier,duration:`approximately ${g.minutes} min`,introduction:g.introduction,instructions:g.instructions,steps:g.steps,reading:g.reading,reflection:g.reflection,tags:g.tags,safety:`${g.safety} ${safety}`,generation:{source:'ai',date,model:runtimeAi.model,consequenceHook:g.consequenceHook}};
 return definition;
}
