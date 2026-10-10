import {afterEach,describe,expect,it,vi} from 'vitest';
import {KeepAmbience,readAmbience,writeAmbience} from './ambience';
afterEach(()=>vi.unstubAllGlobals());
describe('optional original ambience',()=>{
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
});
