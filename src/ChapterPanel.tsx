import type {State} from './model';
import {chapters,activeChapter} from './chapters';
import {totals} from './domain';
import {formatDay} from './presentation';
export default function ChapterPanel({state,date}:{state:State;date:string}) {
 const active=activeChapter(state,date),closed=state.world.milestones.filter(m=>m.kind==='chapter');
 return <section className="panel chapter-panel" aria-label="Campaign chapters"><span className="eyebrow">A ROAD WITH A BEGINNING AND AN END</span><h2>{active?.title??'Chapters of the campaign'}</h2>
 {active&&<><p>{active.subtitle}</p><details><summary>Open the chapter</summary><p>{active.opening}</p></details>
 <ol className="chapter-hooks">{active.hooks.map(h=><li key={h.km} className={totals(state).distance>=h.km?'chapter-reached':''}><strong>{h.title}</strong><p>{totals(state).distance>=h.km?h.text:'A place farther along the road.'}</p></li>)}</ol>
 <p className="muted">The road has no deadline. Earlier progress remains yours.</p></>}
 {closed.map(record=><details className="closed-chapter" key={record.id}><summary>{chapters.find(c=>c.id===record.id)?.title??record.title} · Closed</summary><h3>{record.title}</h3><p>{record.text}</p><small>{record.provenance==='discovered'?'Recorded on':'Completed'} {formatDay(record.date,true)}</small></details>)}
 {!active&&closed.length>0&&<p className="muted">This chapter is complete. Your Journey can continue while another chapter awaits its telling.</p>}
 </section>;
}
