import {useState} from 'react';
import type {State} from '../model';
import {setSessionKey,validEndpoint} from './provider';
export default function NarrativeSettings({state,update}:{state:State;update:(s:State)=>boolean}) {
 const [settings,setSettings]=useState(state.living.settings),[key,setKey]=useState(''),[message,setMessage]=useState('');
 return <details className="panel world-panel"><summary>Narrative preferences <span>Optional AI storyteller</span></summary><p>AI receives rank, attribute levels, selected goal types, recent Venture titles and fictional story context. Your name, weight history, journal and Songbook are never sent. AI cannot award progress or decide a fight. The authored campaign works offline.</p>
 <form onSubmit={e=>{e.preventDefault();if(settings.enabled&&!validEndpoint(settings.endpoint)){setMessage('Use an HTTPS chat-completions endpoint, or a local development backend.');return;}if(update({...state,living:{...state.living,settings}})){setSessionKey(key);setKey('');setMessage('Preferences saved. Any API key is held only for this open session.');}}}>
 {(['enabled','story','ventures','dialogue'] as const).map((id,i)=><label className="check-row" key={id}><input type="checkbox" checked={settings[id]} onChange={e=>setSettings({...settings,[id]:e.target.checked})}/>{['Enable AI narration','Story scenes','Generated Ventures','Retinue dialogue'][i]}</label>)}
 <label>Chat-completions endpoint<input type="url" maxLength={2000} value={settings.endpoint} placeholder="https://your-backend.example/chat/completions" onChange={e=>setSettings({...settings,endpoint:e.target.value})}/></label>
 <label>Model<input maxLength={120} required value={settings.model} onChange={e=>setSettings({...settings,model:e.target.value})}/></label>
 <label>API key (this session only)<input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)}/></label>
 <p className="muted">Use a backend to keep a provider key off the device. Your chosen endpoint receives the context above; its own privacy policy applies. No request is sent until you ask for content. Do not put keys in the endpoint URL.</p>
 <label>Preferred Venture minutes<input type="number" min={5} max={90} value={settings.preferredMinutes} onChange={e=>setSettings({...settings,preferredMinutes:Number(e.target.value)})}/></label>
 <label className="check-row"><input type="checkbox" checked={settings.outdoors} onChange={e=>setSettings({...settings,outdoors:e.target.checked})}/>Outdoor suggestions suit me</label>
 <label>Available equipment (comma separated)<input maxLength={300} value={settings.equipment.join(', ')} onChange={e=>setSettings({...settings,equipment:e.target.value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,20)})}/></label>
 <button className="secondary">Save narrative preferences</button>{message&&<p role="status">{message}</p>}
 </form></details>;
}
