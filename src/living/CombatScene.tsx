import type {State} from '../model';
import {totals} from '../domain';
import {startBattle,takeTurn,enemyIntent,techniqueDiscovered,techniqueUsable,resolveWithoutCombat} from './combat';
import {techniques,enemies,intents} from './combatContent';
export default function CombatScene({state,date,beatId,update}:{state:State;date:string;beatId:string;update:(s:State)=>boolean}){
 const beat=state.living.story.beats.find(b=>b.id===beatId),enemy=enemies.find(e=>e.id===beat?.combatSetup),battle=state.living.battle?.beatId===beatId?state.living.battle:undefined;
 if(!enemy)return null;
 if(!battle)return <section className="combat-invitation" aria-label="Road confrontation"><h3>A meeting at the gate</h3><p>{enemy.description}</p><small>Optional tactical scene. Defeat costs no real-life progress. Your resources fully recover after the confrontation.</small><div className="encounter-choices">
 {enemy.alternatives.map((a,i)=><button className="secondary" key={a.label} disabled={totals(state).stats[a.attribute].level<a.min} onClick={()=>update(resolveWithoutCombat(state,beatId,i,date))}>{a.label}<small>{a.attribute} {a.min}</small></button>)}
 <button className="primary" onClick={()=>update(startBattle(state,beatId,date))}>Enter the confrontation</button>
 <button className="text-button" onClick={()=>update(takeTurn(startBattle(state,beatId,date),'withdraw'))}>Find another way</button></div></section>;
 const intent=enemyIntent(battle),active=battle.status==='active';
 return <section className={`combat-scene combat-${battle.lastAction}`} aria-label="Tactical confrontation">
 <div className="combat-stage" key={`${battle.id}:${battle.round}`}>
 <svg className="combat-silhouettes" viewBox="0 0 600 220" role="img" aria-label={`Your knight faces ${enemy.name} on the road`}><path d="M0 210Q130 185 300 200T600 210V220H0" fill="#342f24"/><g className="combat-knight" transform="translate(130 85)"><circle cy="-25" r="14" fill="#a5a69e"/><path d="M-20-10H20L32 65H-30Z" fill="#646e6b"/><path d="M-20 10L-36 60M17 10L42 36M-14 65L-20 115M15 65L25 115" stroke="#a2a69d" strokeWidth="12"/><path d="M40 38L83-18" stroke="#d0cbc0" strokeWidth="5"/><path d="M-40 18L-10 18L-17 63L-32 76L-47 61Z" fill="#5d7175" stroke="#bcad84" strokeWidth="3"/></g><g className="combat-opponent" transform="translate(455 80)"><circle cy="-20" r="13" fill="#8b8171"/><path d="M-19-5H19L29 67H-25Z" fill="#675346"/><path d="M-18 67L-22 118M17 67L25 118M-18 5L-45 44M17 5L30 52" stroke="#8b8171" strokeWidth="11"/><path d="M-47 45L-72-7" stroke="#b4b1a5" strokeWidth="5"/></g></svg>
 <div className="enemy-intent"><span className="eyebrow">ENEMY INTENT</span><strong>{intents[intent].label}</strong>{battle.levels.Wisdom>=3&&<small>Following: {intents[enemy.pattern[(battle.round+1)%enemy.pattern.length]].label}</small>}</div></div>
 <h3>{enemy.name} · Turn {battle.round+1}</h3>
 <div className="combat-resources"><div><strong>Your knight</strong><Resource label="Health" value={battle.player.health} max={battle.player.maxHealth}/><Resource label="Stamina" value={battle.player.stamina} max={battle.player.maxStamina}/><p>Guard {battle.player.guard} · Momentum {battle.player.momentum}</p></div><div><strong>{enemy.name}</strong><Resource label="Enemy Health" value={battle.enemy.health} max={battle.enemy.maxHealth}/><p>Guard {battle.enemy.guard}</p></div></div>
 {active?<><div className="technique-bar" aria-label="Combat techniques">{techniques.filter(t=>techniqueDiscovered(battle,t)).map(t=><button className="technique" key={t.id} disabled={!techniqueUsable(battle,t)} onClick={()=>update(takeTurn(state,t.id))}><strong>{t.name}</strong><span>{t.description}</span><small>{t.stamina} Stamina · {t.momentum} Momentum{t.requires?` · ${t.requires.attribute} ${t.requires.level}`:''}{t.once?' · once per fight':''}</small></button>)}</div><button className="text-button" onClick={()=>update(takeTurn(state,'withdraw'))}>Withdraw and find another way</button><p className="muted">You can leave this page and resume later. A turn happens only when you choose a technique.</p></>:<p className="combat-result"><strong>{({victory:'The road opens',defeat:'Driven back, not undone',withdrawn:'Another way forward',resolved:'Words before weapons',active:''})[battle.status]}</strong> Health and Stamina restore outside combat. No Renown, XP, Oath or Relic is lost.</p>}
 <ol className="combat-log" role="log" aria-live="polite" aria-label="Combat log">{battle.log.map((line,i)=><li key={`${battle.round}:${i}`}>{line}</li>)}</ol>
 </section>;
}
function Resource({label,value,max}:{label:string;value:number;max:number}){return <label className="combat-resource">{label} {value}/{max}<meter aria-label={label} min={0} max={max} value={value}/></label>;}
export function TechniqueBook({state}:{state:State}){
 const stats=totals(state).stats;
 return <details className="profile-flavour"><summary>Your practice and Techniques</summary><p>Useful lessons come from the household and road. Real-world development makes them usable in a fictional confrontation.</p><div className="technique-book">{techniques.map(t=>{
 const known=(!t.retainer||state.world.milestones.some(m=>m.kind==='retinue'&&m.id===t.retainer))&&(!t.distance||totals(state).distance>=t.distance),usable=known&&(!t.requires||stats[t.requires.attribute].level>=t.requires.level);
 return <article key={t.id}><h3>{t.name}</h3><small>{usable?'Ready to practise':known?'Discovered · developing':'A lesson still to find'} · {t.source}</small><p>{t.description}</p>{t.requires&&<p>{t.requires.attribute} level {t.requires.level}{t.retainer?' · learned from the resident named above':''}</p>}</article>;
 })}</div></details>;
}
