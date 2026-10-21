import {describe,it,expect,vi} from 'vitest';
import {JsonNarrativeProvider,generateSafely,validEndpoint} from './provider';
import {apiCredentials} from './credentials';
import {createKnight} from '../domain';
import {narrativeContext} from './context';
const request={task:'story' as const,context:{},schema:{text:'string'},instruction:'A scene'};
const valid=(v:unknown):v is {text:string}=>!!v&&typeof (v as any).text==='string'&&Object.keys(v).length===1;
describe('Narrative provider boundary',()=>{
 it('does not call any endpoint while disabled and falls back on errors or malformed/unsupported JSON',async()=>{
  const s=createKnight('Private name','2026-10-21'),fetcher=vi.fn();
  const disabled=new JsonNarrativeProvider(s.living.settings,fetcher);
  expect((await generateSafely(disabled,request,valid,{text:'Quiet road'})).source).toBe('authored');expect(fetcher).not.toHaveBeenCalled();
  for(const value of [{text:'A road',renown:1000},{state:{}},null])expect((await generateSafely({generate:async()=>value},request,valid,{text:'fallback'})).content.text).toBe('fallback');
  expect((await generateSafely({generate:async()=>{throw Error('offline');}},request,valid,{text:'fallback'})).source).toBe('authored');
 });
 it('uses a bounded JSON backend request, immutable Bible, session-only key and retries transient status once',async()=>{
  const settings={...createKnight('R').living.settings,enabled:true,endpoint:'https://example.com/chat/completions'};
  const fetcher=vi.fn().mockResolvedValueOnce(new Response('',{status:503})).mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({text:'A quiet road'})}}]})));
  apiCredentials.save(settings.endpoint,'session-secret',false);const provider=new JsonNarrativeProvider(settings,fetcher);
  expect((await generateSafely(provider,request,valid,{text:'fallback'})).source).toBe('ai');expect(fetcher).toHaveBeenCalledTimes(2);
  const options=fetcher.mock.calls[1][1];expect(options.headers.Authorization).toBe('Bearer session-secret');expect(JSON.parse(options.body).messages[0].content).toContain('Never invent real-world');expect(JSON.stringify(settings)).not.toContain('secret');apiCredentials.forget(settings.endpoint);
 });
 it('calls the browser fetch with its global receiver, not the provider instance',async()=>{
  const native=globalThis.fetch;
  const fetcher=vi.fn(function(this:unknown){expect(this).toBe(globalThis);return Promise.resolve(new Response(JSON.stringify({model:'gpt-6-luna',choices:[{message:{content:'{"text":"A road"}'}}]})));});
  globalThis.fetch=fetcher as typeof fetch;
  try {const settings={...createKnight('R').living.settings,enabled:true,endpoint:'https://example.com/chat/completions'};expect(await new JsonNarrativeProvider(settings).generate(request)).toEqual({text:'A road'});}finally{globalThis.fetch=native;}
 });
 it('enforces GPT-6 Luna and low reasoning even if a provider caller supplies a different model',async()=>{
  const settings={...createKnight('R').living.settings,enabled:true,endpoint:'https://example.com/chat/completions',model:'gpt-6-astra'};
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({model:'gpt-6-luna',choices:[{message:{content:'{"text":"A road"}'}}]})));
  await new JsonNarrativeProvider(settings,fetcher).generate(request);
  const body=JSON.parse(fetcher.mock.calls[0][1].body);expect(body.model).toBe('gpt-6-luna');expect(body.reasoning_effort).toBe('low');expect(body).not.toHaveProperty('fallback_model');
 });
 it('rejects a backend model substitution and uses authored content rather than escalating',async()=>{
  const settings={...createKnight('R').living.settings,enabled:true,endpoint:'https://example.com/chat/completions'};
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({model:'gpt-6-sol',choices:[{message:{content:'{"text":"A road"}'}}]})));
  expect((await generateSafely(new JsonNarrativeProvider(settings,fetcher),request,valid,{text:'local'})).source).toBe('authored');expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it('times out without disabling the local campaign',async()=>{
  const settings={...createKnight('R').living.settings,enabled:true,endpoint:'https://example.com/chat/completions'};
  const fetcher=vi.fn((_url,options)=>new Promise<Response>((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout')))));
  const result=await generateSafely(new JsonNarrativeProvider(settings,fetcher as typeof fetch,5),request,valid,{text:'local'});expect(result.content.text).toBe('local');
 });
 it('never sends raw save, name, weight, song notes or journal, and rejects credential-bearing endpoints',()=>{
  const s=createKnight('Private name');s.world.songs=[{id:'s',title:'private title',notes:'private lyrics',chords:'Am',created:s.created,updated:s.created}];
  const context=JSON.stringify(narrativeContext(s));expect(context).not.toMatch(/Private name|private lyrics|private title|weight|measurements|grams|oaths|entries/);
  expect(validEndpoint('https://user:key@example.com')).toBe(false);expect(validEndpoint('https://example.com?key=secret')).toBe(false);expect(validEndpoint('http://remote.example.com')).toBe(false);
 });
});
