import {useState} from 'react';
import {ChevronLeft,ChevronRight,BookOpen} from 'lucide-react';
import {addDays,dayKey,weekStart} from './calendar';
import {formatDay} from './presentation';
import {weeklyReview} from './weeklyReview';
import type {State} from './model';
export default function WeeklyReview({state,now}:{state:State;now:Date}) {
 const current=weekStart(dayKey(now)),first=weekStart(state.created);
 const [offset,setOffset]=useState(0);const start=addDays(current,offset*7),review=weeklyReview(state,start,now);
 return <section className="panel weekly-review" aria-label="Weekly campaign review">
  <div className="section-heading"><h2><BookOpen size={20}/> The week’s reckoning</h2><div className="review-navigation">
   <button className="text-button" aria-label="Review previous week" disabled={start<=first} onClick={()=>setOffset(offset-1)}><ChevronLeft size={18}/></button>
   <button className="text-button" aria-label="Review next week" disabled={offset>=0} onClick={()=>setOffset(offset+1)}><ChevronRight size={18}/></button>
  </div></div>
  <p>Week of {formatDay(start)} · {start===current?'so far':'recorded history'}</p>
  {review.rows.length ? <table><caption className="sr-only">Completed, failed, not planned and unlogged deeds</caption><thead><tr><th>Deed</th><th>Done</th><th>Failed</th><th>Rest / flexible</th><th>Unlogged</th></tr></thead>
   <tbody>{review.rows.map(r=><tr key={r.id}><th scope="row">{r.name}</th><td>{r.done}</td><td className={r.failed?'review-failed':''}>{r.failed}</td><td>{r.rest+r.flexible}</td><td>{r.unlogged}</td></tr>)}</tbody></table>
   :<p>No deed records for this period.</p>}
  {(review.kept+review.broken)>0 && <p>Temperance: {review.kept} Oaths kept · {review.broken} broken. Unconfirmed days are not counted as alcohol-free.</p>}
  <p className="muted">Failed means you explicitly recorded a missed deed. Rest includes not-planned days and flexible training days. Unlogged means no result was recorded for an available deed, not failure. Training days are flexible; your weekly commission remains the target.</p>
  <p className="muted">Use the pattern to choose a more workable next week. Fulfilled training earns one weekly bonus; rest days and incomplete weeks carry no penalty.</p>
 </section>;
}
