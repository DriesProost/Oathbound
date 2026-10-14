import { useState } from 'react';
import { Shield, Music2 } from 'lucide-react';
import type { State } from './model';
import { retinue, currentRemark } from './retinue';
import { known } from './worldRecords';
import { availableThemes, writeSong } from './songbook';
import { formatDay } from './presentation';
import './world.css';
export default function RetinuePanel({ state, date, update }: { state: State; date: string; update: (state: State) => boolean }) {
  const [title, setTitle] = useState(''), [notes, setNotes] = useState(''), [chords, setChords] = useState('');
  const [editing, setEditing] = useState<string | undefined>(), [error, setError] = useState('');
  const bard = known(state, 'retinue', 'bard');
  return <details className="panel world-panel"><summary>The Retinue <span>Inhabitants of the Keep</span></summary>
    <p className="muted">A household grows around the campaign. A quiet day sends nobody away.</p>
    <div className="retinue-grid">{retinue.map(member => {
      const arrived = state.world.milestones.find(m => m.kind === 'retinue' && m.id === member.id);
      if (!arrived) return <article className="retainer empty-chamber" key={member.id}><Shield aria-hidden="true" /><h3>{member.location}</h3><p>An empty chamber awaits a future guest.</p></article>;
      return <article className="retainer" key={member.id}>
        <div className="retainer-seal" aria-hidden="true">{member.id === 'bard' ? <Music2 /> : <Shield />}<span>{member.name.split(' ').map(n => n[0]).join('')}</span></div>
        <h3>{member.name}</h3><strong>{member.title}</strong><p className="muted">{member.role} · {member.location}</p>
        <blockquote>{currentRemark(state, member, date)}</blockquote>
        <details><summary>By the hearth</summary><p>{member.biography}</p><p>{arrived.text}</p><small>{arrived.provenance === 'discovered' ? 'Welcomed on' : 'Arrived'} {formatDay(arrived.date, true)}</small></details>
      </article>;
    })}</div>
    {bard && <section className="songbook" aria-label="Songbook"><h3>The Songbook</h3><p>Names of airs, and a place for words of your own. Music plays only through your existing ambience controls.</p>
      {availableThemes(state).map(theme => <p key={theme.id}><strong>{theme.title}</strong> · {theme.arrangement}<small>{theme.asset ? 'Available through Keep ambience' : 'An air awaiting its music'}</small></p>)}
      {state.world.songs.map(song => <details key={song.id}><summary>{song.title}</summary><p className="song-notes">{song.notes}</p><pre className="song-notes">{song.chords}</pre><small>Begun {formatDay(song.created, true)}</small><button className="text-button" onClick={() => { setTitle(song.title); setNotes(song.notes); setChords(song.chords); setEditing(song.id); }}>Edit song</button></details>)}
      <form onSubmit={e => { e.preventDefault(); const next = writeSong(state, { title, notes, chords }, date, editing);
        if (next === state) { setError('Give the song a title and keep the entry within the space provided.'); return; }
        if (update(next)) { setTitle(''); setNotes(''); setChords(''); setEditing(undefined); setError(''); }
      }}><h4>{editing ? 'Edit your song' : 'A song of your own'}</h4>
        <label>Title<input maxLength={120} required value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label>Lyrics or notes<textarea rows={4} maxLength={12000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
        <label>Chords<textarea rows={2} maxLength={4000} value={chords} onChange={e => setChords(e.target.value)} /></label>
        {error && <p role="status">{error}</p>}<button className="secondary">Save song</button>
        {editing && <button type="button" className="text-button" onClick={() => { setEditing(undefined); setTitle(''); setNotes(''); setChords(''); }}>Cancel editing</button>}
      </form></section>}
  </details>;
}
