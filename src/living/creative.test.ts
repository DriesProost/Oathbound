import {reconcileRetinue} from '../retinue';
import {withDistance} from '../testFixtures/journey';
import {describe,it,expect,vi} from 'vitest';
import {createKnight,confirmOath,totals} from '../domain';
import {reconcileChronicle} from '../illuminatedChronicle';
import {illuminatePage,chroniclePacket,creativeCurrent} from './creative';
import {synchronizeWorld} from '../worldProgression';
import {validate} from '../storage';
const date='2026-10-21';
function household(){const s=createKnight('Private name','2026-10-01');return reconcileRetinue({...withDistance(s,90),oaths:{'2026-10-02':{status:'kept',reward:{renown:3500,xp:{Wisdom:250}}}}},date,'discovered');}
describe('Factual Chronicle and creative Bard',()=>{
 it('arranges only authoritative fact IDs, refusing invented values or unsupported prose',async()=>{
  let s=confirmOath(createKnight('R','2026-10-05'),'2026-10-06','kept',new Date('2026-10-06T20:00:00'));s=reconcileChronicle(s,date);s.living.settings.enabled=true;
  const page=s.world.pages[0],packet=chroniclePacket(page),ids=packet.facts.map(f=>f.id);
  const good={generate:vi.fn().mockResolvedValue({opening:1,factOrder:[...ids].reverse(),ending:2})},next=await illuminatePage(s,page.id,date,good);
  expect(next.living.story.creative[0].source).toBe('ai');expect(next.living.story.creative[0].text).toContain('Renown earned: 40.');expect(totals(next)).toEqual(totals(s));expect(await illuminatePage(next,page.id,date,good)).toBe(next);expect(good.generate).toHaveBeenCalledTimes(1);
  const bad=await illuminatePage(s,page.id,date,{generate:async()=>({opening:1,factOrder:ids,ending:1,prose:'You ran 500 km'})});expect(bad.living.story.creative[0].source).toBe('authored');expect(bad.living.story.creative[0].text).not.toContain('500');
  const corrected=confirmOath(next,'2026-10-06','broken',new Date(date+'T20:00:00'));expect(corrected.living.story.creative).toEqual([]);expect(corrected.world.pages[0].highlights.find(h=>h.label==='Oaths kept')!.value).toBe('0');
 });
 it('keeps archived player songs and creative entries intact when arranging a factual page',async()=>{
  let s=household();s=reconcileChronicle(s,date);s.world.songs=[{id:'private',title:'My private song',notes:'Private lyrics',chords:'G',created:date,updated:date}];
  s.living.story.creative=[{id:'old:bard',kind:'bard',sourceId:'bard',sourceHash:'old',date,text:'A saved verse',source:'authored'}];
  const before=structuredClone(s),provider={generate:vi.fn()},next=await illuminatePage(s,s.world.pages[0].id,date,provider);
  expect(provider.generate).not.toHaveBeenCalled();expect(next.world.songs).toEqual(before.world.songs);expect(next.living.story.creative).toContainEqual(before.living.story.creative[0]);expect(validate(next)).toBe(next);
 });
 it('reuses accepted factual arrangements instead of making repeated paid requests',async()=>{
  const s=reconcileChronicle(household(),date),page=s.world.pages[0],provider={generate:vi.fn()};
  const next=await illuminatePage(s,page.id,date,provider);expect(creativeCurrent(next,'chronicle',page.id,chroniclePacket(page))).toBeDefined();expect(await illuminatePage(next,page.id,date,provider)).toBe(next);expect(provider.generate).not.toHaveBeenCalled();
 });
});
