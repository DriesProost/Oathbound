import {runtimeAi} from './aiConfig';
import type {AiSettings} from './model';
import {campaignBible} from './bible';
import {object} from './validation';
import {apiCredentials} from './credentials';
import {validEndpoint} from './endpoint';
export {validEndpoint} from './endpoint';
export type NarrativeTask = 'story'|'venture'|'dialogue'|'lesson'|'encounter'|'chronicle'|'bard'|'connection';
export type NarrativeRequest = {task:NarrativeTask;context:unknown;schema:unknown;instruction:string};
export interface NarrativeProvider { generate(request:NarrativeRequest,signal?:AbortSignal):Promise<unknown> }
export type ConnectionFailure='disabled'|'endpoint'|'authentication'|'permission'|'model'|'quota'|'rate-limit'|'network'|'timeout'|'cancelled'|'invalid-response'|'wrong-model'|'service'|'request';
const failureMessages:Record<ConnectionFailure,string>={
 disabled:'Enable AI narration before testing the connection.',
 endpoint:'The endpoint was not found or is invalid. Use an HTTPS chat-completions URL.',
 authentication:'The API key was rejected (401). Check or replace the key; you can reuse an existing valid key.',
 permission:'Your API project is not permitted to use this service (403). Check its permissions.',
 model:'The endpoint cannot access gpt-6-luna. Check whether that model is available to your API project. No other model was tried.',
 quota:'The API project has no available quota or billing credit. Check OpenAI API billing; ChatGPT subscriptions do not include API credit.',
 'rate-limit':'The service is rate-limiting requests (429). Wait briefly and try again.',
 network:'The endpoint could not be reached. Check your connection and the endpoint’s browser/CORS support.',
 timeout:'The connection test timed out. Check the endpoint and try again.',
 cancelled:'Connection test cancelled.',
 'invalid-response':'The endpoint did not return the expected JSON response. Check its chat-completions support.',
 'wrong-model':'The endpoint did not confirm GPT-6 Luna. No other model is permitted.',
 service:'The AI service is temporarily unavailable. Try again later; authored content remains available.',
 request:'The endpoint rejected the required Luna request format. Check its chat-completions and model support.',
};
export class NarrativeConnectionError extends Error {
 constructor(public readonly code:ConnectionFailure){super(failureMessages[code]);this.name='NarrativeConnectionError';}
}
async function httpFailure(response:Response):Promise<NarrativeConnectionError> {
 let code='';
 try{const raw=await response.text();if(raw.length<64000){const body=JSON.parse(raw);if(typeof body?.error?.code==='string')code=body.error.code;}}
 catch{/* Never surface raw provider messages: they can echo sensitive input. */}
 if(code==='invalid_api_key')return new NarrativeConnectionError('authentication');
 if(['model_not_found','unsupported_model','model_not_available'].includes(code))return new NarrativeConnectionError('model');
 if(['insufficient_quota','billing_hard_limit_reached','billing_not_active','usage_limit_reached'].includes(code)||response.status===402)return new NarrativeConnectionError('quota');
 return new NarrativeConnectionError(response.status===401?'authentication':response.status===403?'permission':response.status===404?'endpoint':response.status===429?'rate-limit':response.status>=500?'service':'request');
}
export class JsonNarrativeProvider implements NarrativeProvider {
 private responseModel:string|undefined;
 constructor(private settings:AiSettings,private fetcher:typeof fetch=(input,init)=>globalThis.fetch(input,init),private timeout:number=runtimeAi.timeoutMs,private keyOverride?:string){}
 async generate(request:NarrativeRequest,signal?:AbortSignal):Promise<unknown> {
  if(!this.settings.enabled)throw new NarrativeConnectionError('disabled');
  if(!validEndpoint(this.settings.endpoint))throw new NarrativeConnectionError('endpoint');
  const testing=request.task==='connection';
  for(let attempt=0;attempt<(testing?1:2);attempt++){
   const controller=new AbortController(),stop=()=>controller.abort();let timedOut=false;
   if(signal?.aborted)throw new NarrativeConnectionError('cancelled');signal?.addEventListener('abort',stop,{once:true});
   const timer=setTimeout(()=>{timedOut=true;stop();},this.timeout);
   try {
    const key=this.keyOverride??apiCredentials.getKey(this.settings.endpoint);
    const response=await this.fetcher(this.settings.endpoint,{method:'POST',signal:controller.signal,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json',...(key?{Authorization:`Bearer ${key}`}:{})},body:JSON.stringify({model:runtimeAi.model,reasoning_effort:runtimeAi.reasoning,max_completion_tokens:testing?512:runtimeAi.maxCompletionTokens,response_format:{type:'json_object'},messages:[{role:'system',content:testing?'Connection test only. Return exactly the JSON object {"ok":true}.':campaignBible.canon},{role:'user',content:testing?'Return JSON {"ok":true}.':JSON.stringify({...request,bibleVersion:campaignBible.version})}]})});
    if(!response.ok){const failure=await httpFailure(response);if(!testing&&attempt===0&&['rate-limit','service'].includes(failure.code))continue;throw failure;}
    const raw=await response.text();if(raw.length>64000)throw new NarrativeConnectionError('invalid-response');
    let envelope;try{envelope=JSON.parse(raw);}catch{throw new NarrativeConnectionError('invalid-response');}
    if(!object(envelope))throw new NarrativeConnectionError('invalid-response');
    if(envelope.model!==undefined&&(typeof envelope.model!=='string'||!/^gpt-6-luna(?:-\d{4}-\d{2}-\d{2})?$/.test(envelope.model)))throw new NarrativeConnectionError('wrong-model');
    if(!Array.isArray(envelope.choices)||typeof envelope.choices[0]?.message?.content!=='string')throw new NarrativeConnectionError('invalid-response');
    this.responseModel=envelope.model;
    try{return JSON.parse(envelope.choices[0].message.content);}catch{throw new NarrativeConnectionError('invalid-response');}
   }catch(error){
    if(error instanceof NarrativeConnectionError)throw error;
    throw new NarrativeConnectionError(signal?.aborted?'cancelled':timedOut?'timeout':'network');
   }finally{clearTimeout(timer);signal?.removeEventListener('abort',stop);}
  }
  throw new NarrativeConnectionError('service');
 }
 async testConnection(signal?:AbortSignal):Promise<{model:string}> {
  // A real, minimal request. Never routed through authored fallback and never
  // supplied campaign context or persisted as a fictional accomplishment.
  const result=await this.generate({task:'connection',context:{},schema:{ok:true},instruction:'Return JSON {"ok":true}.'},signal);
  if(!object(result)||result.ok!==true||Object.keys(result).length!==1)throw new NarrativeConnectionError('invalid-response');
  if(!this.responseModel)throw new NarrativeConnectionError('wrong-model');
  return {model:this.responseModel};
 }
}
export async function generateSafely<T>(provider:NarrativeProvider|undefined,request:NarrativeRequest,validate:(v:unknown)=>v is T,fallback:T,signal?:AbortSignal):Promise<{content:T;source:'authored'|'ai'}>{
 if(provider)try{const value=await provider.generate(request,signal);if(validate(value))return {content:value,source:'ai'};}catch{/* The authored road remains available. */}
 return {content:structuredClone(fallback),source:'authored'};
}
