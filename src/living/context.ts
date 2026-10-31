import {routePosition} from '../journey';
import type {State} from '../model';
import {totals,rankProgress} from '../domain';
import {campaignGoals} from '../campaign';
import {retiredPeople,roadText} from '../retiredHousehold';
export function narrativeContext(state:State) {
 const t=totals(state),s=state.living.story,arc=s.arcs.find(a=>a.id===s.currentArcId),road=routePosition(t.distance);
 return { rank:rankProgress(t.renown).rank.name, attributes:Object.fromEntries(Object.entries(t.stats).map(([a,v])=>[a,v.level])),
  goals:campaignGoals(state.campaign).filter(g=>g.active).map(g=>g.id),
  arc:arc?{id:arc.id,title:roadText(arc.title),premise:roadText(arc.premise),stage:arc.stage}:null,
  journey:{distance:t.distance,currentPlace:road.current.name,nextPlace:road.next?.name,questPickup:arc?.route?.pickupName,completedChapters:state.world.milestones.filter(m=>m.kind==='chapter').map(m=>m.id)},
  recentVentures:state.ventures.slice(-8).map(v=>({id:v.id,title:v.title,attribute:v.attribute,tier:v.tier,status:v.status,...(v.rewardGrant&&v.generation?{fictionalOpportunity:v.generation.consequenceHook}:{})})),
  recentConfrontations:state.living.battles.slice(-3).map(b=>({enemy:b.opponent.name,outcome:b.status,fictionalConsequence:b.log.at(-1)})),
  recentDeeds:state.entries.slice(-6).map(e=>({goal:e.goalId})),
  canon:{hooks:s.hooks.slice(-8),facts:s.worldFacts.slice(-12).map(roadText),npcs:s.npcs.filter(n=>!retiredPeople[n.id]).slice(-12).map(n=>({id:n.id,name:roadText(n.name),role:roadText(n.role).slice(0,200)})),places:s.places.slice(-8).map(p=>({id:p.id,name:p.name,description:p.description.slice(0,200)})),relationships:s.relationships.filter(r=>!retiredPeople[r.npcId]).slice(-6).map(r=>({npcId:r.npcId,note:roadText(r.note).slice(0,300)})),mysteries:s.mysteries.slice(-6),completedMysteries:s.completedMysteries.slice(-6),choices:s.choices.slice(-6).map(c=>({choice:c.choiceId,outcome:roadText(c.outcome).slice(0,300)})),recentBeats:s.beats.slice(-4).map(b=>({title:b.title,prose:roadText(b.prose).slice(0,600),chosen:b.chosen})),futureSeeds:s.futureSeeds.slice(-3).map(roadText),mood:s.mood,season:s.season,weather:s.weather},
  preferences:{minutes:state.living.settings.preferredMinutes,outdoors:state.living.settings.outdoors,equipment:state.living.settings.equipment} };
}
export function sourceHash(value:unknown):string {
 let h=2166136261;for(const c of JSON.stringify(value))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(36);
}
