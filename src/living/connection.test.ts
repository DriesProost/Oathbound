import {describe,it,expect,vi} from 'vitest';
import {createKnight} from '../domain';
import {JsonNarrativeProvider} from './provider';
import {apiCredentials} from './credentials';
import {openAiEndpoint} from './endpoint';
const settings=()=>({...createKnight('Private name').living.settings,enabled:true,endpoint:openAiEndpoint});
const envelope=(model:unknown='gpt-6-luna',content='{"ok":true}')=>new Response(JSON.stringify({model,choices:[{message:{content}}]}));
describe('Real AI connection probe',()=>{
 it('makes one minimal Luna request with no campaign packet and verifies JSON plus model identity',async()=>{
  const fetcher=vi.fn().mockResolvedValue(envelope());const state=createKnight('Private name'),before=structuredClone(state);
  expect(await new JsonNarrativeProvider(settings(),fetcher,1000,'draft-test-key').testConnection()).toEqual({model:'gpt-6-luna'});
  expect(fetcher).toHaveBeenCalledTimes(1);const options=fetcher.mock.calls[0][1],body=JSON.parse(options.body);expect(options.headers.Authorization).toBe('Bearer draft-test-key');expect(body.model).toBe('gpt-6-luna');expect(body.reasoning_effort).toBe('low');expect(body.max_completion_tokens).toBe(512);expect(options.body).not.toMatch(/Private name|attributes|rank|worldFacts|recentVentures|weight/);expect(state).toEqual(before);
 });
 it('uses the remembered endpoint-bound credential for ordinary generation as well as tests',async()=>{
  apiCredentials.save(openAiEndpoint,'remembered-test-key',false);
  try{const fetcher=vi.fn().mockResolvedValue(envelope());await new JsonNarrativeProvider(settings(),fetcher).testConnection();expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer remembered-test-key');const other=vi.fn().mockResolvedValue(envelope());await new JsonNarrativeProvider({...settings(),endpoint:'https://other.example/chat/completions'},other).testConnection();expect(other.mock.calls[0][1].headers).not.toHaveProperty('Authorization');}finally{apiCredentials.forget(openAiEndpoint);}
 });
 it.each([
  [401,'invalid_api_key','authentication'],[403,'permission_denied','permission'],[404,'model_not_found','model'],[400,'model_not_found','model'],[404,'not_found','endpoint'],[429,'insufficient_quota','quota'],[429,'rate_limit_exceeded','rate-limit'],[503,'unavailable','service'],[400,'unsupported_parameter','request'],
 ])('diagnoses HTTP %s / %s without fallback, escalation or leaking the provider body',async(status,code,expected)=>{
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{code,message:'Echoed secret sk-private-value'}}),{status}));
  const result=new JsonNarrativeProvider(settings(),fetcher).testConnection();await expect(result).rejects.toMatchObject({code:expected});await expect(result).rejects.not.toThrow('sk-private-value');expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it.each([['gpt-6-sol','{"ok":true}','wrong-model'],[undefined,'{"ok":true}','wrong-model'],['gpt-6-luna','{"ok":false}','invalid-response'],['gpt-6-luna','not JSON','invalid-response'],['gpt-6-luna-other-model','{"ok":true}','wrong-model']])('never reports connection success for model %s and invalid output',async(model,content,code)=>{
  const fetcher=vi.fn().mockResolvedValue(envelope(model,content));
  // Explicit undefined must omit the response model, not apply the helper default.
  if(model===undefined)fetcher.mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content}}]})));
  await expect(new JsonNarrativeProvider(settings(),fetcher).testConnection()).rejects.toMatchObject({code});
 });
 it('distinguishes timeout and network/CORS failure from a successful authored fallback',async()=>{
  const offline=vi.fn().mockRejectedValue(Error('raw request included secret'));await expect(new JsonNarrativeProvider(settings(),offline).testConnection()).rejects.toMatchObject({code:'network'});
  const slow=vi.fn((_url,options)=>new Promise<Response>((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted')))));
  await expect(new JsonNarrativeProvider(settings(),slow as typeof fetch,5).testConnection()).rejects.toMatchObject({code:'timeout'});
 });
});
