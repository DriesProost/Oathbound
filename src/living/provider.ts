import {runtimeAi} from './aiConfig';
import type {AiSettings} from './model';
import {campaignBible} from './bible';
import {object} from './validation';
export type NarrativeTask = 'story'|'venture'|'dialogue'|'lesson'|'encounter'|'chronicle'|'bard';
export type NarrativeRequest = {task:NarrativeTask;context:unknown;schema:unknown;instruction:string};
export interface NarrativeProvider { generate(request:NarrativeRequest,signal?:AbortSignal):Promise<unknown> }
let sessionKey='';
// Intentionally never written to State, localStorage, exports, or logs.
export function setSessionKey(value:string){sessionKey=value.trim();}
export function validEndpoint(endpoint:string) {
 try {const u=new URL(endpoint);return !u.username&&!u.password&&!u.hash&&!u.search&&(u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname));}catch{return false;}
}
export class JsonNarrativeProvider implements NarrativeProvider {
 constructor(private settings:AiSettings,private fetcher:typeof fetch=(input,init)=>globalThis.fetch(input,init),private timeout:number=runtimeAi.timeoutMs){}
 async generate(request:NarrativeRequest,signal?:AbortSignal):Promise<unknown> {
  if(!this.settings.enabled||!validEndpoint(this.settings.endpoint))throw Error('Narrative unavailable');
  for(let attempt=0;attempt<2;attempt++){
   const controller=new AbortController(),stop=()=>controller.abort();
   if(signal?.aborted)throw Error('Cancelled');signal?.addEventListener('abort',stop,{once:true});
   const timer=setTimeout(stop,this.timeout);
   try {
    const response=await this.fetcher(this.settings.endpoint,{method:'POST',signal:controller.signal,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json',...(sessionKey?{Authorization:`Bearer ${sessionKey}`}:{})},body:JSON.stringify({model:runtimeAi.model,reasoning_effort:runtimeAi.reasoning,max_completion_tokens:runtimeAi.maxCompletionTokens,response_format:{type:'json_object'},messages:[{role:'system',content:campaignBible.canon},{role:'user',content:JSON.stringify({...request,bibleVersion:campaignBible.version})}]})});
    if(!response.ok){if(attempt===0&&[429,502,503,504].includes(response.status))continue;throw Error('Narrative unavailable');}
    const raw=await response.text();if(raw.length>64000)throw Error('Response too large');
    const envelope=JSON.parse(raw);
    // OpenAI-compatible backend. The provider never accepts a game-state object.
    if(!object(envelope)||(envelope.model!==undefined&&!/^gpt-6-luna(?:-|$)/.test(envelope.model))||!Array.isArray(envelope.choices)||typeof envelope.choices[0]?.message?.content!=='string')throw Error('Invalid narrative envelope');
    return JSON.parse(envelope.choices[0].message.content);
   } finally {clearTimeout(timer);signal?.removeEventListener('abort',stop);}
  }
  throw Error('Narrative unavailable');
 }
}
export async function generateSafely<T>(provider:NarrativeProvider|undefined,request:NarrativeRequest,validate:(v:unknown)=>v is T,fallback:T,signal?:AbortSignal):Promise<{content:T;source:'authored'|'ai'}>{
 if(provider)try{const value=await provider.generate(request,signal);if(validate(value))return {content:value,source:'ai'};}catch{/* The authored road remains available. */}
 return {content:structuredClone(fallback),source:'authored'};
}
