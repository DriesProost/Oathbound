import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Music2, Pause} from 'lucide-react';
import {KeepAmbience, readAmbience, writeAmbience} from './ambience';
export default function AmbienceControl() {
  const [preference, setPreference] = useState(readAmbience);
  const [playing, setPlaying] = useState(false), [message, setMessage] = useState('');
  const audio = useRef<KeepAmbience | null>(null);
  useEffect(() => {
    const pause = () => { if (document.hidden) { audio.current?.stop(); setPlaying(false); } };
    document.addEventListener('visibilitychange', pause);
    return () => { document.removeEventListener('visibilitychange', pause); audio.current?.dispose(); audio.current = null; };
  }, []);
  function save(next: typeof preference) {
    setPreference(next);
    setMessage(writeAmbience(next) ? '' : 'Preference applies for this visit; browser storage could not save it.');
  }
  return <>
    {playing && createPortal(<button className="ambience-mute" aria-label="Pause background music" title="Pause background music" onClick={() => {audio.current?.stop();setPlaying(false);save({...preference,enabled:false});}}><Music2 size={17}/></button>,document.body)}
    <section className="ambience-settings" aria-label="Keep ambience">
    <strong>The Bard’s Tale</strong>
    <p>A quiet looping soundtrack. Separate from deed sounds. Pauses when you leave the app.</p>
    <button className="secondary" aria-pressed={playing} onClick={async () => {
      if (playing) { audio.current?.stop(); setPlaying(false); save({...preference, enabled:false}); }
      else { audio.current ??= new KeepAmbience(); const started = await audio.current.start(preference.volume); setPlaying(started); if (started) save({...preference, enabled:true}); else setMessage('Audio is unavailable here. Your campaign is unaffected.'); }
    }}>{playing ? <Pause size={16}/> : <Music2 size={16}/>}{playing ? 'Mute ambience' : preference.enabled ? 'Resume ambience' : 'Play ambience'}</button>
    <label>Ambience volume<input aria-label="Ambience volume" type="range" min="0" max="1" step=".05" value={preference.volume}
      onChange={e => { const volume=Number(e.target.value); audio.current?.setVolume(volume); save({...preference,volume}); }}/></label>
    {message && <p role="status">{message}</p>}
  </section></>;
}
