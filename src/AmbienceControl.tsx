import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Music2, Pause} from 'lucide-react';
import {KeepAmbience, readAmbience, writeAmbience} from './ambience';
export default function AmbienceControl() {
  const [preference, setPreference] = useState(readAmbience);
  const [playing, setPlaying] = useState(false), [message, setMessage] = useState('');
  const audio = useRef<KeepAmbience | null>(null);
  const preferenceRef=useRef(preference), playingRef=useRef(false), attempt=useRef(0);
  preferenceRef.current=preference;
  function play(showError=false) {
    if(document.hidden)return;
    const ticket=++attempt.current;
    audio.current ??= new KeepAmbience();
    void audio.current.start(preferenceRef.current.volume).then(started=>{
      if(ticket!==attempt.current)return;
      playingRef.current=started;setPlaying(started);
      if(!started && showError)setMessage('Your browser may require a tap to start audio. Your music preference is saved.');
    });
  }
  function pause() {
    attempt.current++;audio.current?.stop();playingRef.current=false;setPlaying(false);
  }
  function mute() {pause();save({...preferenceRef.current,enabled:false});}
  useEffect(() => {
    const visibility = () => {if(document.hidden)pause();else if(preferenceRef.current.enabled)play();};
    const gesture = () => {if(preferenceRef.current.enabled && !playingRef.current)play();};
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('pointerdown',gesture);
    document.addEventListener('keydown',gesture);
    if(preferenceRef.current.enabled)play();
    return () => {
      attempt.current++;document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('pointerdown',gesture);document.removeEventListener('keydown',gesture);
      audio.current?.dispose();audio.current = null;
    };
  }, []);
  function save(next: typeof preference) {
    setPreference(next);
    preferenceRef.current=next;
    setMessage(writeAmbience(next) ? '' : 'Preference applies for this visit; browser storage could not save it.');
  }
  return <>
    {preference.enabled && createPortal(<button className="ambience-mute" aria-label={playing?'Pause background music':'Resume background music'} title={playing?'Pause background music':'Resume background music'} onClick={() => {if(playing)mute();else play(true);}}><Music2 size={17}/></button>,document.body)}
    <section className="ambience-settings" aria-label="Keep ambience">
    <strong>The Bard’s Tale</strong>
    <p>Music remembers your choice and resumes when you return. If your browser blocks playback, one tap starts it. Separate from deed sounds.</p>
    <button className="secondary" aria-pressed={preference.enabled} onClick={() => {
      if (preference.enabled)mute();
      else {save({...preference,enabled:true});play(true);}
    }}>{preference.enabled ? <Pause size={16}/> : <Music2 size={16}/>}{preference.enabled ? 'Mute ambience' : 'Play ambience'}</button>
    <label>Ambience volume<input aria-label="Ambience volume" type="range" min="0" max="1" step=".05" value={preference.volume}
      onChange={e => { const volume=Number(e.target.value); audio.current?.setVolume(volume); save({...preference,volume}); }}/></label>
    {message && <p role="status">{message}</p>}
  </section></>;
}
