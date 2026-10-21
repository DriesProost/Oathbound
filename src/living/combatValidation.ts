import type {Battle,StoryState} from './model';
import {attributes} from '../config';
import {validDay} from '../calendar';
import {enemies,techniques,combatRules} from './combatContent';
import {object,text,texts} from './validation';
export function validBattle(v:unknown,story:StoryState):v is Battle {
 if(!object(v)||!text(v.id,240)||!text(v.beatId,180)||v.id!==`battle:${v.beatId}`||!enemies.some(e=>e.id===v.enemyId)||!story.beats.some(b=>b.id===v.beatId&&b.combatSetup===v.enemyId&&b.date<=v.date)||!validDay(v.date)||!Number.isInteger(v.round)||v.round<0||v.round>combatRules.maxRounds||!['active','victory','defeat','withdrawn','resolved'].includes(v.status))return false;
 if(!object(v.levels)||Object.keys(v.levels).length!==attributes.length||!attributes.every(a=>Number.isInteger(v.levels[a])&&v.levels[a]>=1&&v.levels[a]<=combatRules.levelCap)||!texts(v.allies,7)||!Number.isFinite(v.distance)||v.distance<0||!texts(v.used,12)||!v.used.every((id:string)=>techniques.some(t=>t.id===id&&t.once))||new Set(v.used).size!==v.used.length||!texts(v.log,12)||!text(v.lastAction,100))return false;
 for(const f of [v.player,v.enemy])if(!object(f)||!['health','maxHealth','stamina','maxStamina','guard','momentum'].every(k=>Number.isInteger(f[k])&&f[k]>=0)||f.maxHealth<1||f.health>f.maxHealth||f.stamina>f.maxStamina||f.guard>combatRules.guardCap||f.momentum>combatRules.momentumCap)return false;
 const e=enemies.find(e=>e.id===v.enemyId)!,maxHealth=combatRules.healthBase+combatRules.healthPerVitality*v.levels.Vitality,maxStamina=combatRules.staminaBase+Math.floor(v.levels.Endurance/2);
 return v.enemy.maxHealth===e.health&&v.enemy.maxStamina===0&&v.player.maxHealth===maxHealth&&v.player.maxStamina===maxStamina&&(v.status!=='active'||v.player.health>0&&v.enemy.health>0&&v.round<combatRules.maxRounds)&&(v.status!=='defeat'||v.player.health===0);
}
