import {useState} from 'react';
import type {State} from './model';
import type {FeedbackIntent} from './feedback/events';
import {taskResults,type TaskOutcome} from './taskResults';
import {canConfirm,completeQuest,confirmOath,recordDeedStatus} from './domain';
import {configuredQuests} from './campaign';
import {formatDay} from './presentation';
import './task-results.css';
const labels:Record<TaskOutcome,string>={done:'Completed',failed:'Failed','not-planned':'Not planned',unlogged:'Unlogged',pending:'Open today',flexible:'Flexible training day',inactive:'Not scheduled'};
const symbols:Record<TaskOutcome,string>={done:'✓',failed:'×','not-planned':'–',unlogged:'?',pending:'·',flexible:'○',inactive:'—'};
export default function TaskResults({state,now,update,current}:{state:State;now:Date;update:(s:State,intent?:FeedbackIntent)=>boolean;current:()=>State|null}) {
 const [days,setDays]=useState(7),[selected,setSelected]=useState<{id:string;date:string}|null>(null),[message,setMessage]=useState('');
 const result=taskResults(state,now,days),failed=result.rows.reduce((n,r)=>n+r.failed,0),unlogged=result.rows.reduce((n,r)=>n+r.unlogged,0);
 const row=result.rows.find(r=>r.id===selected?.id),cell=row?.cells.find(c=>c.date===selected?.date),quest=cell?.questId?configuredQuests(state,cell.date).find(q=>q.id===cell.questId):undefined;
 const allowed=!!cell&&cell.status!=='done'&&(row?.id==='temperance'||!!quest)&&canConfirm(cell.date,quest?.timing??'end-of-day',now);
 function record(status:'done'|'failed'|'not-planned'|'unlogged') {
  const latest=current();if(!latest||!cell||!row)return;
  const next=row.id==='temperance'?status==='done'||status==='failed'?confirmOath(latest,cell.date,status==='done'?'kept':'broken',now):latest:
   !cell.questId?latest:status==='done'?completeQuest(latest,cell.questId,cell.date,now):recordDeedStatus(latest,cell.questId,cell.date,status==='failed'?'not-completed':status,now);
  const intent:FeedbackIntent=status==='done'?(row.id==='temperance'?(latest.oaths[cell.date]?.status==='broken'?'correction':'oath'):'deed'):'quiet';
  if(next!==latest&&update(next,intent)){setMessage(`${row.name} · ${formatDay(cell.date)}: ${status==='done'?'completed':status==='failed'?'failed':status==='not-planned'?'not planned':'left unlogged'}.`);setSelected(null);}
 }
 return <section className="panel task-results" aria-label="Task results"><div className="section-heading"><h2>Your recent results</h2><label><span className="sr-only">Results period</span><select value={days} onChange={e=>{setDays(Number(e.target.value));setSelected(null);}}><option value={7}>7 days</option><option value={14}>14 days</option></select></label></div>
 <p><strong>{failed} explicitly failed</strong> · {unlogged} unlogged in the last {days} days.</p>{result.rows.some(r=>r.failed)&&<p className="failure-pattern">Most often marked failed: {result.rows.filter(r=>r.failed).sort((a,b)=>b.failed-a.failed).slice(0,3).map(r=>`${r.name} (${r.failed})`).join(' · ')}</p>}
 <details className="results-detail"><summary>Review results by task and day</summary><div className="results-scroll"><table><caption className="sr-only">Task outcomes by local date. Completed, failed, not planned, unlogged, flexible and open days remain distinct.</caption><thead><tr><th scope="col">Task</th>{result.dates.map(d=><th scope="col" key={d}><time dateTime={d}>{new Date(d+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short'})}</time></th>)}<th scope="col">Done / Failed / ?</th></tr></thead><tbody>{result.rows.map(r=><tr key={r.id}><th scope="row">{r.name}</th>{r.cells.map(c=><td key={c.date}><button className={`result-cell result-${c.status}`} disabled={c.status==='inactive'} aria-label={`${r.name}, ${formatDay(c.date,true)}: ${labels[c.status]}`} title={labels[c.status]} onClick={()=>{setSelected({id:r.id,date:c.date});setMessage('');}}>{symbols[c.status]}</button></td>)}<td className="result-counts">{r.done} / <strong>{r.failed}</strong> / {r.unlogged}</td></tr>)}</tbody></table></div>
 <p className="result-key">✓ Completed · × Failed · – Not planned · ? Unlogged · ○ Flexible training · · Open today</p>
 {row&&cell&&<div className="result-editor" role="region" aria-label="Record task result"><strong>{row.name} · {formatDay(cell.date,true)}</strong><p>{labels[cell.status]}{cell.status==='done'?' · reward already recorded.':''}</p>{cell.status!=='done'&&<div className="result-editor-actions"><button disabled={!allowed} onClick={()=>record('done')}>Completed</button><button disabled={!allowed} onClick={()=>record('failed')}>Failed</button>{row.id!=='temperance'&&<><button disabled={!quest} onClick={()=>record('not-planned')}>Not planned</button><button disabled={!quest} onClick={()=>record('unlogged')}>Leave unlogged</button></>}</div>}<button className="text-button" onClick={()=>setSelected(null)}>Close result</button></div>}
 {message&&<p role="status">{message}</p>}
 </details><p className="muted">Only a recorded failure counts as failed. Today is still open; unlogged days are unknown. Training has a weekly target, so blank training days are flexible. Daily Ventures stay optional and are not counted as missed tasks.</p>
 </section>;
}
