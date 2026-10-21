import {validBattle} from './combatValidation';
import { validDay } from '../calendar';
import type { LivingCampaign } from './model';
export const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
export const text = (v: unknown, max=4000): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
export const texts = (v: unknown, max=1000): v is string[] => Array.isArray(v) && v.length<=max && v.every(x=>text(x));
export const exact = (v: unknown, keys: string[]): v is Record<string, any> => object(v) && Object.keys(v).every(k=>keys.includes(k));
const unique = (v: string[]) => new Set(v).size===v.length;
export function validLiving(v: unknown): v is LivingCampaign {
 if(!object(v)||v.version!==1||!object(v.settings)||!object(v.story)||!Array.isArray(v.battles))return false;
 const c=v.settings,s=v.story;
 if(!['enabled','story','ventures','dialogue','outdoors'].every(k=>typeof c[k]==='boolean')||typeof c.endpoint!=='string'||c.endpoint.length>2000||!text(c.model,120)||!Number.isInteger(c.preferredMinutes)||c.preferredMinutes<5||c.preferredMinutes>90||!texts(c.equipment,20))return false;
 if(!Array.isArray(s.arcs)||!s.arcs.every((a:any)=>object(a)&&text(a.id,160)&&text(a.template,160)&&text(a.title,200)&&text(a.premise)&&Number.isInteger(a.stage)&&a.stage>=0&&a.stage<=6&&validDay(a.started)&&(a.completed===undefined||validDay(a.completed)&&a.completed>=a.started))||!unique(s.arcs.map((a:any)=>a.id)))return false;
 if(typeof s.currentArcId!=='string'||s.currentArcId!==''&&!s.arcs.some((a:any)=>a.id===s.currentArcId))return false;
 if(!['hooks','mysteries','completedMysteries','worldFacts','futureSeeds'].every(k=>texts(s[k],10000))||!['mood','season','weather'].every(k=>text(s[k],300)))return false;
 if(!Array.isArray(s.npcs)||!s.npcs.every((n:any)=>object(n)&&text(n.id,160)&&text(n.name,200)&&text(n.role,500))||!unique(s.npcs.map((n:any)=>n.id)))return false;
 if(!Array.isArray(s.places)||!s.places.every((p:any)=>object(p)&&text(p.id,160)&&text(p.name,200)&&text(p.description,1000))||!unique(s.places.map((p:any)=>p.id)))return false;
 if(!Array.isArray(s.relationships)||!s.relationships.every((r:any)=>object(r)&&s.npcs.some((n:any)=>n.id===r.npcId)&&text(r.note)))return false;
 if(!Array.isArray(s.beats)||!s.beats.every((b:any)=>object(b)&&text(b.id,180)&&Number.isInteger(b.progress)&&b.progress>=0&&validDay(b.date)&&s.arcs.some((a:any)=>a.id===b.arcId)&&Number.isInteger(b.stage)&&b.stage>=0&&b.stage<=6&&['scene','letter','rumour','quiet','confrontation','ending'].includes(b.type)&&text(b.title,200)&&text(b.prose,8000)&&text(b.locationId,160)&&texts(b.canonFactsAdded,8)&&texts(b.hooksAdded,8)&&texts(b.hooksResolved,8)&&Array.isArray(b.choices)&&b.choices.length<=3&&b.choices.every((c:any)=>object(c)&&text(c.id,80)&&text(c.label,200)&&text(c.outcome,2000))&&unique(b.choices.map((c:any)=>c.id))&&(b.chosen===undefined||b.choices.some((c:any)=>c.id===b.chosen))&&object(b.provenance)&&['ai','authored'].includes(b.provenance.source)&&validDay(b.provenance.generatedAt)&&(b.speakerId===undefined||s.npcs.some((n:any)=>n.id===b.speakerId))&&(b.combatSetup===undefined||text(b.combatSetup,100)))||!unique(s.beats.map((b:any)=>b.id)))return false;
 if(s.lastGenerated!==null&&!validDay(s.lastGenerated))return false;
 if(!Array.isArray(s.choices)||!s.choices.every((c:any)=>object(c)&&validDay(c.date)&&text(c.outcome)&&s.beats.some((b:any)=>b.id===c.beatId&&b.chosen===c.choiceId&&b.date<=c.date)))return false;
 if(!Array.isArray(s.creative)||!s.creative.every((e:any)=>object(e)&&text(e.id,250)&&['dialogue','bard','chronicle'].includes(e.kind)&&validDay(e.date)&&text(e.sourceId,180)&&text(e.sourceHash,100)&&text(e.text,8000)&&['authored','ai'].includes(e.source))||!unique(s.creative.map((e:any)=>e.id)))return false;
 return (v.battle===null||validBattle(v.battle,s as any)) && v.battles.every((b:any)=>validBattle(b,s as any)&&b.status!=='active') && unique(v.battles.map((b:any)=>b.id)) && (v.battle===null||v.battle.status==='active'?!v.battle||!v.battles.some((b:any)=>b.id===v.battle.id):v.battles.some((b:any)=>JSON.stringify(b)===JSON.stringify(v.battle)));
}
