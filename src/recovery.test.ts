import {describe,it,expect} from 'vitest';
import {createKnight,completeQuest,confirmOath,totals} from './domain';
import {load,save,storageKeys,SaveConflictError,SaveRegressionError} from './storage';
import {recoveryBundle,recoveryCandidates,inspectCandidate,restoreCandidate,parseRecoveryFile,memoryKey} from './recovery';
import {campaignDay} from './calendar';
const date='2026-11-03',now=new Date(date+'T19:00:00');
function memory(){const map=new Map<string,string>();return {getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);},removeItem:(k:string)=>{map.delete(k);},map};}
const developed=()=>completeQuest(createKnight('Rowan','2026-10-10'),'training','2026-11-02',now);
describe('Save protection and recovery',()=>{
 it('backs up the exact previous readable bytes before a normal write',()=>{
  const store=memory(),s=developed(),raw=JSON.stringify(s,null,2);store.setItem(storageKeys.current,raw);const next=completeQuest(s,'chore',date,now);save(next,store,raw);expect(store.getItem(storageKeys.lastGood)).toBe(raw);expect(JSON.parse(store.getItem(storageKeys.current)!)).toEqual(JSON.parse(JSON.stringify(next)));
 });
 it('rejects stale writes without changing any source or backup',()=>{
  const store=memory(),s=developed();save(s,store);const original=store.getItem(storageKeys.current)!,next=completeQuest(s,'chore',date,now);save(next,store,original);const before=new Map(store.map);expect(()=>save(s,store,original)).toThrow(SaveConflictError);expect(store.map).toEqual(before);
 });
 it('rejects an accidental history reset even when the caller has the latest baseline',()=>{
  const store=memory(),s=developed();save(s,store);const raw=store.getItem(storageKeys.current);expect(()=>save(createKnight(s.name,s.created),store,raw)).toThrow(SaveRegressionError);expect(store.getItem(storageKeys.current)).toBe(raw);
 });
 it('does not replace a protected richer save with a regressed external copy',()=>{
  const store=memory(),old=developed(),raw=JSON.stringify(old);store.setItem(storageKeys.lastGood,raw);const reset=createKnight(old.name,old.created);store.setItem(storageKeys.current,JSON.stringify(reset));save(completeQuest(reset,'chore',date,now),store,JSON.stringify(reset));expect(store.getItem(storageKeys.lastGood)).toBe(raw);
 });
 it('does not let an unreadable current copy overwrite the existing protection',()=>{
  const store=memory();store.setItem(storageKeys.current,'{bad');store.setItem(storageKeys.lastGood,JSON.stringify(developed()));const before=new Map(store.map);expect(()=>save(developed(),store)).toThrow();expect(store.map).toEqual(before);
 });
 it('aborts a save before replacing current data when its backup cannot be written',()=>{
  const store=memory(),s=developed(),raw=JSON.stringify(s);store.setItem(storageKeys.current,raw);expect(()=>save(completeQuest(s,'chore',date,now),{getItem:store.getItem,setItem:(k,v)=>{if(k===storageKeys.lastGood)throw Error('quota');store.setItem(k,v);}},raw)).toThrow('quota');expect(store.getItem(storageKeys.current)).toBe(raw);
 });
 it('allows explicit Oath corrections without treating a reward reversal as a reset',()=>{
  const store=memory(),s=confirmOath(developed(),'2026-11-02','kept',now);save(s,store);const corrected=confirmOath(s,'2026-11-02','broken',now);expect(()=>save(corrected,store,store.getItem(storageKeys.current))).not.toThrow();expect(totals(corrected).renown).toBeLessThan(totals(s).renown);
 });
 it('does not silently migrate an older source when the newer campaign is missing but protected',()=>{
  const store=memory(),s=developed();store.setItem(storageKeys.lastGood,JSON.stringify(s));store.setItem(storageKeys.v6,JSON.stringify({...s,version:6}));const before=new Map(store.map);expect(()=>load(store,date)).toThrow('protected copy');expect(store.map).toEqual(before);
 });
 it('scans valid, corrupt and migration copies read-only without picking a winner',()=>{
  const store=memory(),s=developed();store.setItem(storageKeys.current,'{bad');store.setItem(storageKeys.v6,JSON.stringify({...s,version:6}));const before=new Map(store.map),copies=recoveryCandidates(store,date);expect(copies).toHaveLength(2);expect(copies[0].state).toBeUndefined();expect(copies[1].summary).toMatchObject({name:'Rowan',deeds:1,renown:35,lastActivity:'2026-11-02'});expect(store.map).toEqual(before);
 });
 it('exports original bytes including corrupt data but excludes API credential namespaces',()=>{
  const store=memory(),raw='{ unreadable original';store.setItem(storageKeys.current,raw);store.setItem('oathbound.ai-credential.v1','PRIVATE_KEY');const bundle=recoveryBundle(store);expect(bundle.entries).toEqual([{key:storageKeys.current,raw}]);expect(JSON.stringify(bundle)).not.toContain('PRIVATE_KEY');expect(parseRecoveryFile(JSON.stringify(bundle))[0].raw).toBe(raw);
 });
 it('exports the visible in-memory campaign if browser storage was cleared',()=>{
  const store=memory(),s=developed(),bundle=recoveryBundle(store,s);expect(bundle.entries).toEqual([{key:memoryKey,raw:JSON.stringify(s)}]);expect(inspectCandidate(parseRecoveryFile(JSON.stringify(bundle))[0],date).summary!.deeds).toBe(1);
 });
 it('previews a plain save file without writing it, and rejects unrelated or forged-key bundles',()=>{
  const raw=JSON.stringify(developed());expect(inspectCandidate(parseRecoveryFile(raw)[0],date).summary!.renown).toBe(35);expect(()=>parseRecoveryFile(JSON.stringify({format:'oathbound-recovery',version:1,entries:[{key:'oathbound.ai-credential.v1',raw:'secret'}]}))).toThrow();expect(()=>parseRecoveryFile('{}')).toThrow();
 });
 it('restores a chosen copy only after preserving the current and all migration originals',()=>{
  const store=memory(),old=developed(),current=completeQuest(old,'chore',date,now),raw=JSON.stringify(current,null,2),oldRaw=JSON.stringify(old,null,2);store.setItem(storageKeys.current,raw);store.setItem(storageKeys.lastGood,oldRaw);store.setItem(storageKeys.v5,JSON.stringify({...old,version:5}));
  const candidate=inspectCandidate({key:storageKeys.lastGood,raw:oldRaw},date),restored=restoreCandidate(candidate,raw,store,date);expect(totals(restored)).toEqual(totals(old));const archive=JSON.parse(store.getItem(storageKeys.beforeRecovery)!);expect(archive.entries).toContainEqual({key:storageKeys.current,raw});expect(archive.entries).toContainEqual({key:storageKeys.lastGood,raw:oldRaw});expect(archive.selectedRaw).toBe(oldRaw);expect(store.getItem(storageKeys.v5)).toBe(JSON.stringify({...old,version:5}));
 });
 it('allows explicit recovery of a valid older copy over a corrupt current save',()=>{
  const store=memory();store.setItem(storageKeys.current,'{bad');const s=developed(),candidate=inspectCandidate({key:'Imported campaign',raw:JSON.stringify(s)},date);restoreCandidate(candidate,'{bad',store,date);expect(JSON.parse(store.getItem(storageKeys.beforeRecovery)!).entries).toContainEqual({key:storageKeys.current,raw:'{bad'});expect(totals(load(store,date)!)).toEqual(totals(s));
 });
 it('rejects restore after another window changes the save or when archival fails',()=>{
  const store=memory(),s=developed(),raw=JSON.stringify(s),candidate=inspectCandidate({key:'Imported campaign',raw},date);store.setItem(storageKeys.current,raw);expect(()=>restoreCandidate(candidate,'old',store,date)).toThrow('changed');expect(()=>restoreCandidate(candidate,raw,{getItem:store.getItem,setItem:()=>{throw Error('quota');}},date)).toThrow('quota');expect(store.getItem(storageKeys.current)).toBe(raw);
 });
 it('never restores unvalidated reward data and never overwrites the first recovery archive',()=>{
  const store=memory(),s=developed();store.setItem(storageKeys.current,JSON.stringify(s));store.setItem(storageKeys.beforeRecovery,'FIRST_ARCHIVE');const invalid=inspectCandidate({key:'file',raw:JSON.stringify({...s,entries:[{madeUp:900}]})},date);expect(()=>restoreCandidate(invalid,JSON.stringify(s),store,date)).toThrow('validation');restoreCandidate(inspectCandidate({key:'file',raw:JSON.stringify(s)},date),JSON.stringify(s),store,date);expect(store.getItem(storageKeys.beforeRecovery)).toBe('FIRST_ARCHIVE');
 });
});
describe('Local calendar campaign day',()=>{
 it('advances by local calendar dates rather than elapsed hours',()=>{expect(campaignDay('2026-10-10','2026-11-03')).toBe(25);expect(campaignDay('2026-10-10','2026-11-04')).toBe(26);expect(campaignDay('2026-10-10','2026-10-10')).toBe(1);});
 it('keeps daylight-saving, month boundaries and leap days deterministic',()=>{expect(campaignDay('2026-10-24','2026-10-26')).toBe(3);expect(campaignDay('2028-02-28','2028-03-01')).toBe(3);expect(campaignDay('2026-11-04','2026-11-03')).toBe(1);expect(()=>campaignDay('bad',date)).toThrow();});
});
