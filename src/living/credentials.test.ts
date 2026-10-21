import {describe,it,expect} from 'vitest';
import {createCredentialVault,credentialStorageKey} from './credentials';
import {openAiEndpoint} from './endpoint';
import {createKnight} from '../domain';
import {narrativeContext} from './context';
const memory=()=>{const m=new Map<string,string>();return {getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);},removeItem:(k:string)=>{m.delete(k);}};};
const endpoint=openAiEndpoint;
describe('Device AI credential vault',()=>{
 it('restores a remembered key after a new session without requiring a new API key',()=>{
  const store=memory(),first=createCredentialVault(()=>store);first.save(endpoint,' existing-test-key ',true);
  const nextSession=createCredentialVault(()=>store);expect(nextSession.getKey(endpoint)).toBe('existing-test-key');expect(nextSession.status(endpoint)).toBe('remembered');
 });
 it('keeps session-only keys out of browser storage and loses them in a new session',()=>{
  const store=memory(),first=createCredentialVault(()=>store);first.save(endpoint,'session-test-key',false);expect(first.status(endpoint)).toBe('session');expect(first.getKey(endpoint)).toBe('session-test-key');expect(store.getItem(credentialStorageKey)).toBeNull();expect(createCredentialVault(()=>store).getKey(endpoint)).toBe('');
 });
 it('never sends a remembered or session key to another endpoint, including another path on the same host',()=>{
  const store=memory(),vault=createCredentialVault(()=>store);vault.save(endpoint,'private-test-key',true);
  for(const changed of ['https://other.example/chat/completions','https://api.openai.com/other','https://user:key@api.openai.com/v1/chat/completions','https://api.openai.com/v1/chat/completions?key=secret'])expect(vault.getKey(changed)).toBe('');
  expect(vault.getKey('https://API.OPENAI.COM/v1/chat/completions')).toBe('private-test-key');
 });
 it('preserves the existing key on blank preference saves and can switch retention without re-entry',()=>{
  const store=memory(),vault=createCredentialVault(()=>store);vault.save(endpoint,'existing-test-key',true);vault.save(endpoint,'',true);expect(vault.getKey(endpoint)).toBe('existing-test-key');vault.save(endpoint,'',false);expect(store.getItem(credentialStorageKey)).toBeNull();expect(vault.status(endpoint)).toBe('session');vault.save(endpoint,'',true);expect(createCredentialVault(()=>store).getKey(endpoint)).toBe('existing-test-key');
 });
 it('forgets both device and in-memory copies and leaves campaign state untouched',()=>{
  const store=memory(),vault=createCredentialVault(()=>store),state=createKnight('R');const before=structuredClone(state);vault.save(endpoint,'private-test-key',true);vault.forget(endpoint);expect(vault.status(endpoint)).toBe('none');expect(createCredentialVault(()=>store).status(endpoint)).toBe('none');expect(state).toEqual(before);
 });
 it('reports persistence failure cleanly while permitting session-only use with unavailable storage',()=>{
  const vault=createCredentialVault(()=>{throw Error('storage unavailable');});expect(vault.status(endpoint)).toBe('none');expect(()=>vault.save(endpoint,'key',true)).toThrow('storage unavailable');expect(vault.status(endpoint)).toBe('none');vault.save(endpoint,'key',false);expect(vault.status(endpoint)).toBe('session');vault.forget(endpoint);expect(vault.status(endpoint)).toBe('none');
 });
 it('ignores malformed stored credentials and excludes remembered keys from campaign saves and AI context',()=>{
  const store=memory(),vault=createCredentialVault(()=>store);store.setItem(credentialStorageKey,'{bad');expect(vault.status(endpoint)).toBe('none');vault.save(endpoint,'private-test-key',true);const state=createKnight('R');expect(JSON.stringify(state)).not.toContain('private-test-key');expect(JSON.stringify(narrativeContext(state))).not.toContain('private-test-key');
 });
});
