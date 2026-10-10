import {afterEach,describe,expect,it,vi} from 'vitest';
import {KeepAmbience,readAmbience,writeAmbience} from './ambience';
afterEach(()=>vi.unstubAllGlobals());
describe('optional supplied ambience',()=>{
  it('defaults to off and tolerates unavailable preference storage',()=>{
    vi.stubGlobal('localStorage',{getItem:()=>{throw Error();},setItem:()=>{throw Error();}});
    expect(readAmbience()).toEqual({enabled:false,volume:.25});
    expect(writeAmbience({enabled:true,volume:.4})).toBe(false);
  });
  it('persists an independent choice and clamps invalid volume',()=>{
    let value='';vi.stubGlobal('localStorage',{getItem:()=>value,setItem:(_key:string,next:string)=>{value=next;}});
    expect(writeAmbience({enabled:true,volume:.4})).toBe(true);
    expect(readAmbience()).toEqual({enabled:true,volume:.4});
    value='{"enabled":true,"volume":99}';expect(readAmbience().volume).toBe(1);
    value='{"enabled":true,"volume":"loud"}';expect(readAmbience().volume).toBe(.25);
  });
  it('unsupported audio does not throw or prevent normal app use',async()=>{
    vi.stubGlobal('AudioContext',class {constructor(){throw Error('unsupported');}});
    const audio=new KeepAmbience();expect(await audio.start(.25)).toBe(false);
    expect(()=>{audio.stop();audio.setVolume(.5);audio.dispose();}).not.toThrow();
  });
  it('a pending audio start cannot restart after mute',async()=>{
    let resume!:()=>void;const createBuffer=vi.fn();
    vi.stubGlobal('AudioContext',class {state='running';resume=()=>new Promise<void>(resolve=>{resume=resolve;});createBuffer=createBuffer;close=()=>Promise.resolve();});
    const audio=new KeepAmbience();const start=audio.start(.25);audio.stop();resume();
    expect(await start).toBe(false);expect(createBuffer).not.toHaveBeenCalled();audio.dispose();
  });
  it('cannot play after being muted during music loading',async()=>{
    let resolve!: (response: Response)=>void;
    vi.stubGlobal('fetch',()=>new Promise<Response>(r=>{resolve=r;}));
    const createBufferSource=vi.fn();
    vi.stubGlobal('AudioContext',class {state='running';resume=()=>Promise.resolve();decodeAudioData=()=>Promise.resolve({});createBufferSource=createBufferSource;close=()=>Promise.resolve();});
    const audio=new KeepAmbience();const start=audio.start(.25);
    await Promise.resolve();audio.stop();resolve(new Response(new Uint8Array([1,2])));
    expect(await start).toBe(false);expect(createBufferSource).not.toHaveBeenCalled();audio.dispose();
  });
  it('a failed recording request fails quietly and can be retried',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('',{status:404})));
    vi.stubGlobal('AudioContext',class {state='running';resume=()=>Promise.resolve();close=()=>Promise.resolve();});
    const audio=new KeepAmbience();expect(await audio.start(.25)).toBe(false);
    expect(await audio.start(.25)).toBe(false);expect(fetch).toHaveBeenCalledTimes(2);audio.dispose();
  });
});
