import {routePosition} from '../journey';
import type {State} from '../model';
import {totals,rankProgress} from '../domain';
import {campaignGoals} from '../campaign';
import {retinue} from '../retinue';
export function narrativeContext(state:State) {
 const t=totals(state),s=state.living.story,arc=s.arcs.find(a=>a.id===s.currentArcId),road=routePosition(t.distance);
 return { rank:rankProgress(t.renown).rank.name, attributes:Object.fromEntries(Object.entries(t.stats).map(([a,v])=>[a,v.level])),
  goals:campaignGoals(state.campaign).filter(g=>g.active).map(g=>g.id),
  arc:arc?{id:arc.id,title:arc.title,premise:arc.premise,stage:arc.stage}:null,
  retinue:retinue.filter(r=>state.world.milestones.some(m=>m.kind==='retinue'&&m.id===r.id)).map(r=>({id:r.id,name:r.name,role:r.role,personality:r.personality})),
  journey:{distance:t.distance,currentPlace:road.current.name,nextPlace:road.next?.name,questPickup:arc?.route?.pickupName,completedChapters:state.world.milestones.filter(m=>m.kind==='chapter').map(m=>m.id)},
  recentVentures:state.ventures.slice(-8).map(v=>({id:v.id,title:v.title,attribute:v.attribute,tier:v.tier,status:v.status,...(v.rewardGrant&&v.generation?{fictionalOpportunity:v.generation.consequenceHook}:{})})),
  recentConfrontations:state.living.battles.slice(-3).map(b=>({enemy:b.opponent.name,outcome:b.status,fictionalConsequence:b.log.at(-1)})),
  recentDeeds:state.entries.slice(-6).map(e=>({goal:e.goalId})),
  canon:{hooks:s.hooks.slice(-8),facts:s.worldFacts.slice(-12),npcs:s.npcs.slice(-12).map(n=>({id:n.id,name:n.name,role:n.role.slice(0,200)})),places:s.places.slice(-8).map(p=>({id:p.id,name:p.name,description:p.description.slice(0,200)})),relationships:s.relationships.slice(-6).map(r=>({npcId:r.npcId,note:r.note.slice(0,300)})),mysteries:s.mysteries.slice(-6),completedMysteries:s.completedMysteries.slice(-6),choices:s.choices.slice(-6).map(c=>({choice:c.choiceId,outcome:c.outcome.slice(0,300)})),recentBeats:s.beats.slice(-4).map(b=>({title:b.title,prose:b.prose.slice(0,600),chosen:b.chosen})),futureSeeds:s.futureSeeds.slice(-3),mood:s.mood,season:s.season,weather:s.weather},
  preferences:{minutes:state.living.settings.preferredMinutes,outdoors:state.living.settings.outdoors,equipment:state.living.settings.equipment} };
}
export function sourceHash(value:unknown):string {
 let h=2166136261;for(const c of JSON.stringify(value))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(36);
}
