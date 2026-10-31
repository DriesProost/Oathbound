import {describe,it,expect,vi} from 'vitest';
import {createKnight,totals} from './domain';
import {synchronizeWorld} from './worldProgression';
import {withDistance} from './testFixtures/journey';
import {reconcileRetinue} from './retinue';
import {reconcileKeep} from './keep';
import {retiredHouseholdKinds,roadText} from './retiredHousehold';
import {nextAutomaticJob,reserveAutomaticJob,runAutomaticJob,finishAutomaticJob} from './living/automatic';
import {continueStory} from './living/director';
import {narrativeContext} from './living/context';
import {techniques} from './living/combatContent';
import {techniqueDiscovered,startBattle} from './living/combat';
import {load,save} from './storage';
const date='2026-10-31',now=new Date(date+'T19:00:00');
function legacy(){const s=withDistance(createKnight('R','2026-10-01'),120);s.oaths['2026-10-02']={status:'kept',reward:{renown:3000,xp:{Wisdom:600}}};return reconcileKeep(reconcileRetinue(s,'2026-10-02','earned'),'2026-10-02','earned');}
describe('Knight-focused campaign, retired household',()=>{
 it('does not grow rooms, recruit residents or issue household relics and songs',()=>{
  const s=withDistance(createKnight('R',date),750);s.oaths[date]={status:'kept',reward:{renown:30000,xp:{Strength:10000,Wisdom:10000}}};
  const after=synchronizeWorld(s,date);expect(after.world.milestones.filter(m=>retiredHouseholdKinds.has(m.kind))).toEqual([]);expect(totals(after)).toEqual(totals(s));
 });
 it('preserves every archived household record, song and reward across load and reconciliation',()=>{
  const s=legacy();s.world.songs=[{id:'private',title:'My song',notes:'My words',chords:'Am',created:'2026-10-02',updated:'2026-10-02'}];
  const data=new Map<string,string>(),store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};save(s,store);const loaded=load(store,date)!;expect(loaded.world).toEqual(s.world);expect(loaded.entries).toEqual(s.entries);
  const after=synchronizeWorld(loaded,date);expect(after.world.milestones.filter(m=>retiredHouseholdKinds.has(m.kind))).toEqual(s.world.milestones.filter(m=>retiredHouseholdKinds.has(m.kind)));expect(after.world.songs).toEqual(s.world.songs);expect(totals(after)).toEqual(totals(s));
 });
 it('schedules no household dialogue or Bard generation even when old settings enable it',()=>{
  const s=legacy();s.living.settings.enabled=true;s.living.settings.dialogue=true;
  const jobs=[];let current=s;
  for(let i=0;i<10;i++){const job=nextAutomaticJob(current,now);if(!job)break;jobs.push(job.kind);current=reserveAutomaticJob(current,job,now);current={...current,living:{...current.living,automatic:{...current.living.automatic!,jobs:current.living.automatic!.jobs.map(j=>({...j,status:'done'}))}}};}
  expect(jobs).not.toContain('dialogue');expect(jobs).not.toContain('bard');
 });
 it('recovers an old pending household request without a paid call or new dialogue',async()=>{
  const s=legacy(),job={id:'old:dialogue',date,kind:'dialogue' as const,target:'scholar',stamp:'old'};
  const base=reserveAutomaticJob(s,job,now),provider={generate:vi.fn()},result=await runAutomaticJob(base,job,provider),done=finishAutomaticJob(base,base,result,job,date);
  expect(provider.generate).not.toHaveBeenCalled();expect(done.living.story.creative).toEqual(base.living.story.creative);expect(done.living.automatic!.jobs.at(-1)!.status).toBe('done');
 });
 it('does not include household profiles or private player data in current AI story context',()=>{
  const s=legacy();s.living.story.npcs=[{id:'scholar',name:'Brother Aldren',role:'Scholar'}];const c=narrativeContext(s);expect(c).not.toHaveProperty('retinue');expect(c.canon.npcs).toEqual([]);expect(JSON.stringify(c)).not.toContain('Brother Aldren');
 });
 it('uses anonymous travellers in new authored pages without rewriting archived scenes',async()=>{
  const s=withDistance(createKnight('R',date),30),next=await continueStory(s,date),before=structuredClone(next.living.story.beats);
  expect(next.living.story.npcs).toEqual([]);expect(next.living.story.beats[0].prose).not.toMatch(/Ysabel|Oswin|Tomas|Aldren/);expect(synchronizeWorld(next,date).living.story.beats).toEqual(before);
 });
 it('keeps the Reedmere place name while substituting retired names in displayed fiction',()=>{
  expect(roadText('Reedmere welcomes Tomas Reed.')).toBe('Reedmere welcomes a traveller.');expect(roadText('Ser Oswin watches.')).toBe('A veteran watches.');expect(roadText('Edric Vale visits Orchard Vale.')).toBe('A clerk visits Orchard Vale.');expect(roadText('The road leads to the Keeper’s gate.')).toBe('The road leads to the Keeper’s gate.');
 });
});
