import {runtimeAi} from './aiConfig';
import {validBattle} from './combatValidation';
import { validDay } from '../calendar';
import type { LivingCampaign } from './model';
export const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
export const text = (v: unknown, max=4000): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
export const texts = (v: unknown, max=1000): v is string[] => Array.isArray(v) && v.length<=max && v.every(x=>text(x));
export const exact = (v: unknown, keys: string[]): v is Record<string, any> => object(v) && Object.keys(v).every(k=>keys.includes(k));
const unique = (v: string[]) => new Set(v).size===v.length;
export function validLiving(v: unknown, created: string): v is LivingCampaign {
 if(!object(v)||v.version!==1||!object(v.settings)||!object(v.story)||!Array.isArray(v.battles))return false;
 if(v.automatic!==undefined){
  const a=v.automatic;
  if(!object(a)||a.version!==1||!texts(a.seenVentures,64)||!Array.isArray(a.jobs)||a.jobs.length>128||!a.jobs.every((j:any)=>object(j)&&text(j.id,300)&&validDay(j.date)&&j.date>=created&&['story','venture','dialogue','chronicle','bard'].includes(j.kind)&&text(j.target,200)&&text(j.stamp,100)&&['pending','done'].includes(j.status)&&typeof j.startedAt==='string'&&Number.isFinite(Date.parse(j.startedAt)))||!unique(a.jobs.map((j:any)=>j.id)))return false;
 }
 const c=v.settings,s=v.story;
 if(!validDay(created))return false;
 if(s.plannedArc!==null&&(!object(s.plannedArc)||!text(s.plannedArc.title,160)||!text(s.plannedArc.premise,800)||!text(s.plannedArc.mystery,300)))return false;
 if(!['enabled','story','ventures','dialogue','outdoors'].every(k=>typeof c[k]==='boolean')||typeof c.endpoint!=='string'||c.endpoint.length>2000||c.model!==runtimeAi.model||!Number.isInteger(c.preferredMinutes)||c.preferredMinutes<5||c.preferredMinutes>90||!texts(c.equipment,20))return false;
 if(!Array.isArray(s.arcs)||!s.arcs.every((a:any)=>object(a)&&text(a.id,160)&&text(a.template,160)&&text(a.title,200)&&text(a.premise)&&Number.isInteger(a.stage)&&a.stage>=0&&a.stage<=6&&validDay(a.started)&&a.started>=created&&(a.completed===undefined||validDay(a.completed)&&a.completed>=a.started))||!unique(s.arcs.map((a:any)=>a.id)))return false;
 if(typeof s.currentArcId!=='string'||s.currentArcId!==''&&!s.arcs.some((a:any)=>a.id===s.currentArcId))return false;
 if(!['hooks','mysteries','completedMysteries','worldFacts','futureSeeds'].every(k=>texts(s[k],10000))||!['mood','season','weather'].every(k=>text(s[k],300)))return false;
 if(!Array.isArray(s.npcs)||!s.npcs.every((n:any)=>object(n)&&text(n.id,160)&&text(n.name,200)&&text(n.role,500))||!unique(s.npcs.map((n:any)=>n.id)))return false;
 if(!Array.isArray(s.places)||!s.places.every((p:any)=>object(p)&&text(p.id,160)&&text(p.name,200)&&text(p.description,1000))||!unique(s.places.map((p:any)=>p.id)))return false;
 if(!Array.isArray(s.relationships)||!s.relationships.every((r:any)=>object(r)&&s.npcs.some((n:any)=>n.id===r.npcId)&&text(r.note)))return false;
 if(!Array.isArray(s.beats)||!s.beats.every((b:any)=>object(b)&&text(b.id,180)&&Number.isInteger(b.progress)&&b.progress>=0&&validDay(b.date)&&b.date>=created&&s.arcs.some((a:any)=>a.id===b.arcId)&&Number.isInteger(b.stage)&&b.stage>=0&&b.stage<=6&&['scene','letter','rumour','quiet','confrontation','ending'].includes(b.type)&&text(b.title,200)&&text(b.prose,8000)&&text(b.locationId,160)&&texts(b.canonFactsAdded,8)&&texts(b.hooksAdded,8)&&texts(b.hooksResolved,8)&&Array.isArray(b.choices)&&b.choices.length<=3&&b.choices.every((c:any)=>object(c)&&text(c.id,80)&&text(c.label,200)&&text(c.outcome,2000))&&unique(b.choices.map((c:any)=>c.id))&&(b.chosen===undefined||b.choices.some((c:any)=>c.id===b.chosen))&&object(b.provenance)&&['ai','authored'].includes(b.provenance.source)&&validDay(b.provenance.generatedAt)&&(b.speakerId===undefined||s.npcs.some((n:any)=>n.id===b.speakerId))&&(b.combatSetup===undefined||text(b.combatSetup,100)))||!unique(s.beats.map((b:any)=>b.id)))return false;
 if(s.lastGenerated!==null&&!validDay(s.lastGenerated))return false;
 if(!Array.isArray(s.choices)||!s.choices.every((c:any)=>object(c)&&validDay(c.date)&&text(c.outcome)&&s.beats.some((b:any)=>b.id===c.beatId&&b.chosen===c.choiceId&&b.date<=c.date)))return false;
 if(!Array.isArray(s.creative)||!s.creative.every((e:any)=>object(e)&&text(e.id,250)&&['dialogue','bard','chronicle'].includes(e.kind)&&validDay(e.date)&&e.date>=created&&text(e.sourceId,180)&&text(e.sourceHash,100)&&text(e.text,8000)&&['authored','ai'].includes(e.source))||!unique(s.creative.map((e:any)=>e.id)))return false;
 if(v.automatic?.preparedStory!==undefined){
  const p=v.automatic.preparedStory;
  if(!object(p)||!text(p.baseHash,100)||!validDay(p.preparedAt)||!object(p.arc)||!object(p.beat)||p.arc.id!==p.beat.arcId||!Array.isArray(p.npcs)||!Array.isArray(p.places)||p.seed!==undefined&&!text(p.seed,150))return false;
  // Validate the queued fiction through the same complete story validator. Its
  // active history is untouched until Read the next page is pressed.
  const candidate={...v,automatic:undefined,story:{...s,arcs:[...s.arcs.filter((a:any)=>a.id!==p.arc.id),p.arc],currentArcId:p.arc.id,beats:[...s.beats,p.beat],npcs:[...s.npcs,...p.npcs],places:[...s.places,...p.places],plannedArc:p.plannedArc,mood:p.mood,season:p.season,weather:p.weather}};
  if(!validLiving(candidate,created))return false;
 }
 if(v.battle!==null&&!validBattle(v.battle,s as any))return false;
 if(!v.battles.every((b:any)=>validBattle(b,s as any)&&b.status!=='active')||!unique(v.battles.map((b:any)=>b.id)))return false;
 if(v.battle===null)return true;
 if(v.battle.status==='active')return !v.battles.some((b:any)=>b.id===v.battle.id);
 return v.battles.some((b:any)=>JSON.stringify(b)===JSON.stringify(v.battle));
}
