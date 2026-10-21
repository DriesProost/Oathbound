import type {State} from '../model';
import {attributes} from '../config';
import {totals} from '../domain';
import {validDay} from '../calendar';
import type {Battle,Fighter} from './model';
import {combatRules as rules,enemies,intents,techniques,type Technique,type Intent} from './combatContent';
export const enemyFor=(b:Battle)=>enemies.find(e=>e.id===b.enemyId)!;
export const enemyIntent=(b:Battle):Intent=>enemyFor(b).pattern[b.round%enemyFor(b).pattern.length];
const bounded=(n:number,max:number)=>Math.max(0,Math.min(max,n));
export function combatStats(levels:Battle['levels']):Fighter {
 const maxHealth=rules.healthBase+rules.healthPerVitality*bounded(levels.Vitality,rules.levelCap),maxStamina=rules.staminaBase+Math.floor(bounded(levels.Endurance,rules.levelCap)/2);
 return {health:maxHealth,maxHealth,stamina:maxStamina,maxStamina,guard:0,momentum:0};
}
export function techniqueDiscovered(b:Battle,t:Technique){return (!t.retainer||b.allies.includes(t.retainer))&&(!t.distance||b.distance>=t.distance);}
export function techniqueUsable(b:Battle,t:Technique){return techniqueDiscovered(b,t)&&(!t.requires||b.levels[t.requires.attribute]>=t.requires.level)&&b.player.stamina>=t.stamina&&b.player.momentum>=t.momentum&&(!t.once||!b.used.includes(t.id))&&(!t.human||enemyFor(b).human);}
export function startBattle(state:State,beatId:string,date:string):State {
 const beat=state.living.story.beats.find(b=>b.id===beatId),enemy=enemies.find(e=>e.id===beat?.combatSetup);
 if(!beat||!enemy||date<beat.date||!validDay(date)||state.living.battle?.status==='active'||state.living.battles.some(b=>b.beatId===beatId))return state;
 const t=totals(state),levels=Object.fromEntries(attributes.map(a=>[a,Math.min(rules.levelCap,t.stats[a].level)])) as Battle['levels'];
 const b:Battle={id:`battle:${beatId}`,beatId,enemyId:enemy.id,date,round:0,player:combatStats(levels),enemy:{health:enemy.health,maxHealth:enemy.health,stamina:0,maxStamina:0,guard:enemy.guard,momentum:0},levels,allies:state.world.milestones.filter(m=>m.kind==='retinue').map(m=>m.id),distance:t.distance,used:[],status:'active',log:[`${enemy.name} watches the road. Intent: ${intents[enemy.pattern[0]].label}.`],lastAction:'ready'};
 return {...state,living:{...state.living,battle:b}};
}
function archive(state:State,b:Battle):State {
 return {...state,living:{...state.living,battle:b,battles:b.status==='active'?state.living.battles:[...state.living.battles,b]}};
}
export function resolveWithoutCombat(state:State,beatId:string,index:number,date:string):State {
 const started=startBattle(state,beatId,date);if(started===state)return state;
 const b=started.living.battle!,alternative=enemyFor(b).alternatives[index];
 if(!alternative||b.levels[alternative.attribute]<alternative.min)return state;
 return archive(started,{...b,status:'resolved',lastAction:'conversation',log:[alternative.outcome]});
}
export function takeTurn(state:State,actionId:string):State {
 const original=state.living.battle;if(!original||original.status!=='active')return state;
 if(actionId==='withdraw')return archive(state,{...original,status:'withdrawn',lastAction:'withdraw',log:[...original.log.slice(-3),'You find another way. The road is still there tomorrow. No earned progress is lost.']});
 const technique=techniques.find(t=>t.id===actionId);if(!technique||!techniqueUsable(original,technique))return state;
 const b:Battle=structuredClone(original),p=b.player,e=b.enemy,intent=enemyIntent(b),enemy=enemyFor(b),log:string[]=[];
 p.stamina-=technique.stamina;p.momentum-=technique.momentum;
 p.guard=bounded(p.guard+technique.guard+((technique.guard>0)?Math.floor(b.levels.Resolve/2):0),rules.guardCap);
 if(actionId==='guard')p.stamina=bounded(p.stamina+2,p.maxStamina);
 if(actionId==='recover')p.stamina=bounded(p.stamina+5,p.maxStamina);
 if(technique.effect==='heal'){p.health=bounded(p.health+12+b.levels.Vitality,p.maxHealth);p.stamina=bounded(p.stamina+5,p.maxStamina);log.push('Second Wind restores your footing.');}
 if(technique.effect==='break')e.guard=Math.max(0,e.guard-10-Math.floor(b.levels.Strength/2));
 if(technique.damage){let damage=technique.damage+Math.floor(b.levels.Strength/2)+(intent==='recover'?4:0);const absorbed=Math.min(e.guard,damage);e.guard-=absorbed;damage-=absorbed;e.health=Math.max(0,e.health-damage);log.push(`${technique.name}: ${damage} damage, ${absorbed} stopped by Guard.`);if(damage)p.momentum=bounded(p.momentum+1,rules.momentumCap);}
 if(e.health===0){b.status='victory';log.push('The confrontation ends. Your combat resources recover outside the fight.');}
 else {
  const evaded=technique.effect==='evade'&&['heavy','grapple'].includes(intent),disrupted=technique.effect==='disrupt';
  if(evaded||disrupted){p.momentum=bounded(p.momentum+2,rules.momentumCap);log.push(evaded?'You step clear of the telegraphed attack.':'The remark breaks the opponent’s rhythm.');}
  else if(intent==='guard'){e.guard=bounded(e.guard+8,rules.guardCap);log.push('The opponent sets a Guard.');}
  else if(intent==='recover'){e.health=Math.min(e.maxHealth,e.health+3);log.push('The opponent catches breath.');}
  else if(intent==='retreat'){b.status='victory';log.push('The opponent leaves the road.');}
  else {const damage=intents[intent].damage+enemy.power,absorbed=Math.min(p.guard,intent==='feint'?Math.floor(damage/2):damage);p.guard-=absorbed;const taken=damage-absorbed;p.health=Math.max(0,p.health-taken);if(absorbed>=damage)p.momentum=bounded(p.momentum+1,rules.momentumCap);if(intent==='grapple')p.stamina=Math.max(0,p.stamina-2);log.push(`${intents[intent].label}: ${taken} damage, ${absorbed} stopped by Guard.`);}
 }
 if(technique.effect==='analyse'){p.momentum=bounded(p.momentum+2,rules.momentumCap);log.push(`Following intent: ${intents[enemy.pattern[(b.round+1)%enemy.pattern.length]].label}.`);}
 if(p.health===0){b.status='defeat';log.push('Driven back, not undone. The road is still there tomorrow. No earned progress is lost.');}
 if(technique.once)b.used.push(technique.id);
 p.stamina=bounded(p.stamina+1+Math.floor(b.levels.Endurance/10),p.maxStamina);
 b.round++;if(b.round>=rules.maxRounds&&b.status==='active'){b.status='withdrawn';log.push('You break off the long exchange and find another way.');}
 b.lastAction=actionId;b.log=[...b.log.slice(-3),...log];return archive(state,b);
}
