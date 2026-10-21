import type {Battle,StoryState} from './model';
import {attributes} from '../config';
import {validDay} from '../calendar';
import {intents,techniques,combatRules} from './combatContent';
import {object,text,texts} from './validation';
export function validBattle(v:unknown,story:StoryState):v is Battle {
 if(!object(v)||!text(v.id,240)||!text(v.beatId,180)||!new RegExp('^battle:'+v.beatId.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+':attempt:[1-9][0-9]*$').test(v.id)||!object(v.opponent)||v.opponent.id!==v.enemyId||!story.beats.some(b=>b.id===v.beatId&&b.combatSetup===v.enemyId&&b.date<=v.date)||!validDay(v.date)||!Number.isInteger(v.round)||v.round<0||v.round>combatRules.maxRounds||!['active','victory','defeat','withdrawn','resolved'].includes(v.status))return false;
 if(!object(v.levels)||Object.keys(v.levels).length!==attributes.length||!attributes.every(a=>Number.isInteger(v.levels[a])&&v.levels[a]>=1&&v.levels[a]<=combatRules.levelCap)||!texts(v.allies,7)||!Number.isFinite(v.distance)||v.distance<0||!texts(v.used,12)||!v.used.every((id:string)=>techniques.some(t=>t.id===id&&t.once))||new Set(v.used).size!==v.used.length||!texts(v.log,12)||!text(v.lastAction,100))return false;
 for(const f of [v.player,v.enemy])if(!object(f)||!['health','maxHealth','stamina','maxStamina','guard','momentum'].every(k=>Number.isInteger(f[k])&&f[k]>=0)||f.maxHealth<1||f.health>f.maxHealth||f.stamina>f.maxStamina||f.guard>combatRules.guardCap||f.momentum>combatRules.momentumCap)return false;
 const e=v.opponent;
 if(!text(e.name,150)||!text(e.description,1000)||!Number.isInteger(e.health)||e.health<1||e.health>500||!Number.isInteger(e.guard)||e.guard<0||e.guard>24||!Number.isInteger(e.power)||e.power<0||e.power>10||typeof e.human!=='boolean'||!Array.isArray(e.pattern)||!e.pattern.length||e.pattern.length>12||!e.pattern.every((i:string)=>Object.hasOwn(intents,i))||!Array.isArray(e.alternatives)||!e.alternatives.every((a:any)=>object(a)&&attributes.includes(a.attribute)&&Number.isInteger(a.min)&&a.min>=1&&a.min<=20&&text(a.label,200)&&text(a.outcome,2000)))return false;
 const maxHealth=combatRules.healthBase+combatRules.healthPerVitality*v.levels.Vitality,maxStamina=combatRules.staminaBase+Math.floor(v.levels.Endurance/2);
 return v.enemy.maxHealth===e.health&&v.enemy.maxStamina===0&&v.player.maxHealth===maxHealth&&v.player.maxStamina===maxStamina&&(v.status!=='active'||v.player.health>0&&v.enemy.health>0&&v.round<combatRules.maxRounds)&&(v.status!=='defeat'||v.player.health===0);
}
