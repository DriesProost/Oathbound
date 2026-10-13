import { useEffect, useRef } from 'react';
import type { State, VentureAssignment } from './model';
import { icons, RewardText } from './components';
import { formatDay } from './presentation';
import { ventureAttributeLabel, ventureAttributes } from './ventures';
import { completedVentures } from './ventureDomain';
import './ventures.css';

export function DailyVenture({ venture, open, onOpen, onClose, onComplete, onReplace }: {
  venture: VentureAssignment; open: boolean; onOpen: () => void; onClose: () => void;
  onComplete: () => void; onReplace: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && !element?.open) element?.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  return <article className="venture-notice parchment-notice" aria-label="Today's Venture">
    <div className="notice-pin" />
    <span className="eyebrow">TODAY'S VENTURE</span>
    <div className="venture-attribute">{ventureAttributes(venture).map((attribute, index) => {
      const Icon = icons[attribute];
      return <span key={attribute}>{index > 0 && <span aria-hidden="true"> + </span>}<Icon size={20} aria-hidden="true" /> {attribute}</span>;
    })}</div>
    <h2>{venture.title}</h2>
    <p className="venture-flavour">{venture.introduction}</p>
    <p>{venture.duration} · {venture.tier}</p>
    <RewardText reward={venture.reward} />
    <div className="venture-actions">
      <button className="secondary" onClick={onOpen}>Open Venture</button>
      {venture.status === 'completed' ? <span className="venture-seal">✦ Venture complete</span> :
        !venture.replacementOf && <button className="text-button" onClick={onReplace}>Choose another Venture</button>}
    </div>
    <small>Optional. Tomorrow brings another Venture.</small>
    <dialog className="venture-dialog" ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="venture-title">
      <div className="venture-dialog-heading"><span className="eyebrow">TODAY'S VENTURE · {ventureAttributeLabel(venture)}</span><button className="text-button" onClick={onClose} aria-label="Close Venture">Close</button></div>
      <h2 id="venture-title">{venture.title}</h2>
      <p className="venture-flavour">{venture.introduction}</p>
      <p>{venture.duration} · {venture.tier}</p>
      <RewardText reward={venture.reward} />
      {venture.reading && <section className="venture-lesson" aria-label="Lesson"><h3>The lesson</h3>{venture.reading.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</section>}
      <section aria-label="Practical instructions">
        {venture.instructions.map((instruction, i) => <div key={i}><p>{instruction}</p>
          {venture.steps && instruction.endsWith(':') && <ul>{venture.steps.map(step => <li key={step}>{step}</li>)}</ul>}
        </div>)}
        {!venture.instructions.length && venture.steps && <ol>{venture.steps.map(step => <li key={step}>{step}</li>)}</ol>}
      </section>
      {venture.safety && <p className="venture-adaptation">{venture.safety}</p>}
      {venture.reflection && <section className="venture-reflection"><h3>Consider</h3><p>{venture.reflection}</p><small>Reflection is optional. No answer is needed to complete the Venture.</small></section>}
      {venture.status === 'completed' ? <p className="venture-seal">✦ Venture complete</p> :
        <button className="primary" onClick={onComplete}>{venture.reading ? 'Mark as read & complete Venture' : 'Complete Venture'}</button>}
      <p className="muted">Self-reported. If this also satisfies an ordinary deed, record that deed normally for its own reward.</p>
    </dialog>
  </article>;
}
export function VentureLedger({ state }: { state: State }) {
  const completed = completedVentures(state);
  if (!completed.length) return null;
  return <section className="panel venture-ledger" aria-label="Completed Ventures"><span className="eyebrow">PATHS YOU CHOSE</span><h2>Venture ledger</h2>
    {completed.map(v => <div className="history-entry" key={v.assignmentId}><time dateTime={v.date}>{formatDay(v.date, true)}</time><div><strong>{v.title}</strong><small>{ventureAttributeLabel(v)} · {v.tier}</small></div><RewardText reward={v.reward} /></div>)}
  </section>;
}
