import {migrate,validate,save,storageKeys} from './storage';
import type {State} from './model';
import {totals} from './domain';
import {dayKey} from './calendar';
type Store=Pick<Storage,'getItem'|'setItem'>;
export const recoveryKeys=Object.values(storageKeys).filter(k=>k!==storageKeys.beforeRecovery);
export const memoryKey='oathbound.knight.in-memory.v1';
const labels:Record<string,string>={
 [memoryKey]:'Campaign visible in this window', [storageKeys.current]:'Current campaign',[storageKeys.lastGood]:'Protected previous save',
 [storageKeys.v6]:'Earlier v6 campaign',[storageKeys.choreBackup]:'Original v6 migration backup',
 [storageKeys.v5]:'Earlier v5 campaign',[storageKeys.livingBackup]:'Original v5 migration backup',
 [storageKeys.v4]:'Earlier v4 campaign',[storageKeys.worldBackup]:'Original v4 migration backup',
 [storageKeys.v3]:'Earlier v3 campaign',[storageKeys.ventureBackup]:'Original Venture migration backup',
 [storageKeys.weeklyBackup]:'Original weekly-goal migration backup',
 [storageKeys.previous]:'Earlier v2 campaign',[storageKeys.previousBackup]:'Original v2 backup',
 [storageKeys.legacy]:'Earlier v1 campaign',[storageKeys.backup]:'Original v1 backup',
};
export type RecoveryEntry={key:string;raw:string};
export type RecoveryCandidate=RecoveryEntry&{label:string;state?:State;error?:string;summary?:{name:string;created:string;lastActivity:string;deeds:number;ventures:number;renown:number}};
export function inspectCandidate(entry:RecoveryEntry,date=dayKey()):RecoveryCandidate {
 try{
  const state=migrate(JSON.parse(entry.raw),date),completed=state.ventures.filter(v=>v.rewardGrant);
  const dates=[state.created,...state.entries.map(e=>e.date),...completed.map(v=>v.date),...Object.entries(state.oaths).filter(([,o])=>o.status==='kept'||o.status==='broken').map(([d])=>d),...state.weight.measurements.map(m=>m.date),...(state.deedNotes??[]).map(n=>n.date),...state.living.story.beats.map(b=>b.date)];
  return {...entry,label:labels[entry.key]??entry.key,state,summary:{name:state.name,created:state.created,lastActivity:dates.sort().at(-1)!,deeds:state.entries.length,ventures:completed.length,renown:totals(state).renown}};
 }catch{return {...entry,label:labels[entry.key]??entry.key,error:'This copy could not be validated. Its original bytes can still be downloaded.'};}
}
export function storedRecoveryEntries(store:Pick<Storage,'getItem'>=localStorage):RecoveryEntry[] {
 return recoveryKeys.flatMap(key=>{const raw=store.getItem(key);return raw===null?[]:[{key,raw}];});
}
export function recoveryBundle(store:Pick<Storage,'getItem'>=localStorage,memoryState?:State) {
 return {format:'oathbound-recovery',version:1,exportedAt:new Date().toISOString(),entries:[...storedRecoveryEntries(store),...(memoryState?[{key:memoryKey,raw:JSON.stringify(validate(memoryState))}]:[])],beforeRecovery:store.getItem(storageKeys.beforeRecovery)};
}
export function parseRecoveryFile(raw:string):RecoveryEntry[] {
 if(raw.length>32*1024*1024)throw Error('This file is too large for a campaign backup.');
 const value=JSON.parse(raw);
 if(value?.format==='oathbound-recovery'){
  if(value.version!==1||!Array.isArray(value.entries)||value.entries.length>32||!value.entries.every((e:any)=>e&&typeof e.key==='string'&&(recoveryKeys.includes(e.key)||e.key===memoryKey)&&typeof e.raw==='string'))throw Error('This recovery file has an unsupported format.');
  return value.entries;
 }
 // A plain exported save can also be previewed. Validation is still required.
 if(value&&Number.isInteger(value.version)&&value.version>=1&&value.version<=7)return [{key:'Imported campaign',raw}];
 throw Error('This file is not an Oathbound campaign or recovery backup.');
}
export function recoveryCandidates(store:Pick<Storage,'getItem'>=localStorage,date=dayKey()) {
 const entries=storedRecoveryEntries(store),before=store.getItem(storageKeys.beforeRecovery);
 if(before){try{const saved=JSON.parse(before);for(const e of parseRecoveryFile(before))entries.push({key:`Before recovery: ${labels[e.key]??e.key}`,raw:e.raw});if(typeof saved.selectedRaw==='string')entries.push({key:'Original selected recovery copy',raw:saved.selectedRaw});}catch{/* An unreadable archive stays in the raw download; it is never discarded. */}}
 return entries.map(e=>inspectCandidate(e,date));
}
export function restoreCandidate(candidate:RecoveryCandidate,expectedCurrent:string|null,store:Store=localStorage,date=dayKey()):State {
 if(store.getItem(storageKeys.current)!==expectedCurrent)throw Error('Your save changed after this preview. Scan again before restoring.');
 const selected=inspectCandidate(candidate,date);if(!selected.state)throw Error('This copy cannot be restored because it did not pass save validation.');
 // Preserve every original source before an explicit recovery. Never replace the
 // first rescue archive. A quota/storage failure aborts before the current write.
 if(store.getItem(storageKeys.beforeRecovery)===null)store.setItem(storageKeys.beforeRecovery,JSON.stringify({...recoveryBundle(store),selectedRaw:candidate.raw}));
 let readable=expectedCurrent===null;
 if(expectedCurrent!==null){try{migrate(JSON.parse(expectedCurrent),date);readable=true;}catch{/* Explicit recovery can replace a corrupt current save after archival. */}}
 if(readable){save(selected.state,store,expectedCurrent,true);return selected.state;}

 return commit(selected.state,store);
}
function commit(state:State,store:Store){store.setItem(storageKeys.current,JSON.stringify(validate(state)));return state;}
