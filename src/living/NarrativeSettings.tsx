import {runtimeAi} from './aiConfig';
import {useEffect,useRef,useState} from 'react';
import type {State} from '../model';
import {JsonNarrativeProvider,NarrativeConnectionError,validEndpoint} from './provider';
import {apiCredentials} from './credentials';
import {openAiEndpoint} from './endpoint';
export default function NarrativeSettings({state,update,current}:{current?:()=>State|null;state:State;update:(s:State)=>boolean}) {
 const [settings,setSettings]=useState({...state.living.settings,endpoint:state.living.settings.endpoint||openAiEndpoint});
 const [key,setKey]=useState(''),[remember,setRemember]=useState(()=>apiCredentials.status(state.living.settings.endpoint||openAiEndpoint)!=='session');
 const [message,setMessage]=useState(''),[,setRevision]=useState(0);
 const [test,setTest]=useState<{kind:'idle'|'testing'|'success'|'error';text:string}>({kind:'idle',text:''});
 const request=useRef<AbortController|null>(null);
 useEffect(()=>()=>{request.current?.abort();request.current=null;},[]);
 const saved=apiCredentials.status(settings.endpoint),testing=test.kind==='testing';
 async function testConnection(){
  if(request.current)return;
  if(!validEndpoint(settings.endpoint)){setTest({kind:'error',text:'Use an HTTPS chat-completions endpoint, or a local development backend.'});return;}
  const controller=new AbortController();request.current=controller;setTest({kind:'testing',text:'Testing connection to GPT-6 Luna…'});
  try{
   const result=await new JsonNarrativeProvider({...settings,endpoint:settings.endpoint.trim(),enabled:true},undefined,undefined,key.trim()||undefined).testConnection(controller.signal);
   if(request.current===controller&&!controller.signal.aborted)setTest({kind:'success',text:`Connection works · ${result.model} returned valid JSON. ${settings.enabled?'Save your preferences to use this configuration.':'Enable AI narration and save to use it in the campaign.'}`});
  }catch(error){
   if(request.current===controller&&!controller.signal.aborted)setTest({kind:'error',text:error instanceof NarrativeConnectionError?error.message:'The connection could not be tested. Check your endpoint and connection.'});
  }finally{if(request.current===controller)request.current=null;}
 }
 return <details className="panel world-panel"><summary>Narrative preferences <span>Optional AI storyteller</span></summary><p>AI receives rank, attribute levels, selected goal types, recent Venture titles and fictional story context. Your name, weight history, journal and Songbook are never sent. AI cannot award progress or decide a fight. The authored campaign works offline.</p>
 <form onSubmit={e=>{
  e.preventDefault();if(testing)return;
  if(!validEndpoint(settings.endpoint)){setMessage('Use an HTTPS chat-completions endpoint, or a local development backend.');return;}
  const latest=current?.()??state;
  if(!update({...latest,living:{...latest.living,settings:{...settings,endpoint:settings.endpoint.trim(),model:runtimeAi.model}}}))return;
  try{apiCredentials.save(settings.endpoint,key,remember);setKey('');setRevision(n=>n+1);setMessage(`Preferences saved. ${apiCredentials.status(settings.endpoint)==='remembered'?'Your key is remembered on this device; no need to enter it after reloading.':apiCredentials.status(settings.endpoint)==='session'?'Your key is available for this open session only.':'No device key is stored; your backend may handle authentication.'}`);}
  catch{setMessage('Preferences saved, but the key could not be stored. Check browser storage, or turn off Remember key on this device and save again.');}
 }}>
 <fieldset disabled={testing} className="narrative-configuration"><legend className="sr-only">AI configuration</legend>
 <label className="check-row"><input type="checkbox" checked={settings.enabled} onChange={e=>setSettings({...settings,enabled:e.target.checked,...(e.target.checked?{story:true,ventures:true,dialogue:true}:{})})}/>Enable AI narration</label>
 <p className="muted">Stories, Ventures and household remarks are prepared automatically. You choose when to read each page; unread story never expires.</p>
 <label>Chat-completions endpoint<input type="url" maxLength={2000} value={settings.endpoint} onChange={e=>{setSettings({...settings,endpoint:e.target.value});setTest({kind:'idle',text:''});setMessage('');}}/></label>
 <p><strong>OpenAI GPT-6 Luna</strong> · {runtimeAi.model} · low reasoning. No automatic model escalation. If Luna is unavailable, the authored campaign continues.</p>
 <label>API key<input type="password" autoComplete="off" maxLength={16000} value={key} placeholder={saved==='remembered'?'Key remembered · leave blank to keep it':saved==='session'?'Session key available · leave blank to keep it':'Paste your existing API key'} onChange={e=>{setKey(e.target.value);setTest({kind:'idle',text:''});setMessage('');}}/></label>
 <label className="check-row"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>Remember key on this device</label>
 <p className="muted">Remembered keys are stored in this browser’s local storage, separately from campaign saves, and sent only to the matching endpoint. Use this on a device you trust. Clearing site data removes the key. Leave the key field blank to keep an existing key.</p>
 {saved!=='none'&&<div><span className="credential-state">{saved==='remembered'?'Key remembered on this device.':'Key available for this session.'}</span><button type="button" className="text-button" onClick={()=>{try{apiCredentials.forget(settings.endpoint);setKey('');setRevision(n=>n+1);setTest({kind:'idle',text:''});setMessage('Key forgotten on this device. Your campaign is unchanged.');}catch{setMessage('The browser could not remove the remembered key. Check site storage permissions.');}}}>Forget saved key</button></div>}
 <div><button type="button" className="secondary" onClick={testConnection}>Test connection</button><small className="connection-explanation">Sends one small API request to check this endpoint, key and Luna model. No campaign data is sent; a small API charge may apply. Testing does not save your key.</small></div>
 <p className="muted">The OpenAI endpoint is filled in for you; change it only if you use your own compatible backend. A backend can keep its provider key off the device. Do not put keys in the endpoint URL. Generated Ventures are prepared before you open a new notice. Choose another Venture remains available once if it does not suit the day.</p>
 <details className="ai-advanced"><summary>Fine-tune suggestions</summary>
 {(['story','ventures','dialogue'] as const).map((id,i)=><label className="check-row" key={id}><input type="checkbox" checked={settings[id]} onChange={e=>setSettings({...settings,[id]:e.target.checked})}/>{['AI story scenes','AI Ventures','AI household dialogue'][i]}</label>)}
 <label>Preferred Venture minutes<input type="number" min={5} max={90} value={settings.preferredMinutes} onChange={e=>setSettings({...settings,preferredMinutes:Number(e.target.value)})}/></label>
 <label className="check-row"><input type="checkbox" checked={settings.outdoors} onChange={e=>setSettings({...settings,outdoors:e.target.checked})}/>Outdoor suggestions suit me</label>
 <label>Available equipment (comma separated)<input maxLength={300} value={settings.equipment.join(', ')} onChange={e=>setSettings({...settings,equipment:e.target.value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,20)})}/></label>
 </details>
 <button className="secondary">Save narrative preferences</button>
 </fieldset>
 {test.text&&<p className={`connection-result connection-${test.kind}`} role={test.kind==='error'?'alert':'status'}>{test.text}</p>}
 {testing&&<button type="button" className="text-button" onClick={()=>{request.current?.abort();request.current=null;setTest({kind:'idle',text:'Connection test cancelled.'});}}>Cancel connection test</button>}
 {message&&<p role="status">{message}</p>}
 </form></details>;
}
