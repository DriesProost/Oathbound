import type {State} from '../model';
import {totals,rankProgress} from '../domain';
import {campaignGoals} from '../campaign';
import {retinue} from '../retinue';
export function narrativeContext(state:State) {
 const t=totals(state),s=state.living.story,arc=s.arcs.find(a=>a.id===s.currentArcId);
 return { rank:rankProgress(t.renown).rank.name, attributes:Object.fromEntries(Object.entries(t.stats).map(([a,v])=>[a,v.level])),
  goals:campaignGoals(state.campaign).filter(g=>g.active).map(g=>g.id),
  arc:arc?{id:arc.id,title:arc.title,premise:arc.premise,stage:arc.stage}:null,
  retinue:retinue.filter(r=>state.world.milestones.some(m=>m.kind==='retinue'&&m.id===r.id)).map(r=>({id:r.id,name:r.name,role:r.role,personality:r.personality})),
  journey:{distance:t.distance,completedChapters:state.world.milestones.filter(m=>m.kind==='chapter').map(m=>m.id)},
  recentVentures:state.ventures.slice(-8).map(v=>({id:v.id,title:v.title,attribute:v.attribute,tier:v.tier,status:v.status})),
  recentDeeds:state.entries.slice(-6).map(e=>({goal:e.goalId})),
  canon:{hooks:s.hooks.slice(-8),facts:s.worldFacts.slice(-16),npcs:s.npcs.slice(-12),places:s.places.slice(-12),relationships:s.relationships.slice(-8),mysteries:s.mysteries.slice(-6),completedMysteries:s.completedMysteries.slice(-6),choices:s.choices.slice(-6).map(c=>({choice:c.choiceId,outcome:c.outcome})),recentBeats:s.beats.slice(-4).map(b=>({title:b.title,prose:b.prose,chosen:b.chosen})),futureSeeds:s.futureSeeds.slice(-3),mood:s.mood,season:s.season,weather:s.weather},
  preferences:{minutes:state.living.settings.preferredMinutes,outdoors:state.living.settings.outdoors,equipment:state.living.settings.equipment} };
}
export function sourceHash(value:unknown):string {
 let h=2166136261;for(const c of JSON.stringify(value))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(36);
}
