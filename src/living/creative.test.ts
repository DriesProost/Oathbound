import {describe,it,expect,vi} from 'vitest';
import {createKnight,confirmOath,totals} from '../domain';
import {reconcileChronicle} from '../illuminatedChronicle';
import {illuminatePage,chroniclePacket,askBard,speakWith,dialoguePacket} from './creative';
import {synchronizeWorld} from '../worldProgression';
import {validate} from '../storage';
const date='2026-10-21';
function household(){const s=createKnight('Private name','2026-10-01');return synchronizeWorld({...s,oaths:{'2026-10-02':{status:'kept',reward:{renown:3500,xp:{Wisdom:250}}}}},date);}
describe('Factual Chronicle and creative Bard',()=>{
 it('arranges only authoritative fact IDs, refusing invented values or unsupported prose',async()=>{
  let s=confirmOath(createKnight('R','2026-10-05'),'2026-10-06','kept',new Date('2026-10-06T20:00:00'));s=reconcileChronicle(s,date);s.living.settings.enabled=true;
  const page=s.world.pages[0],packet=chroniclePacket(page),ids=packet.facts.map(f=>f.id);
  const good={generate:vi.fn().mockResolvedValue({opening:1,factOrder:[...ids].reverse(),ending:2})},next=await illuminatePage(s,page.id,date,good);
  expect(next.living.story.creative[0].source).toBe('ai');expect(next.living.story.creative[0].text).toContain('Renown earned: 40.');expect(totals(next)).toEqual(totals(s));expect(await illuminatePage(next,page.id,date,good)).toBe(next);expect(good.generate).toHaveBeenCalledTimes(1);
  const bad=await illuminatePage(s,page.id,date,{generate:async()=>({opening:1,factOrder:ids,ending:1,prose:'You ran 500 km'})});expect(bad.living.story.creative[0].source).toBe('authored');expect(bad.living.story.creative[0].text).not.toContain('500');
  const corrected=confirmOath(next,'2026-10-06','broken',new Date(date+'T20:00:00'));expect(corrected.living.story.creative).toEqual([]);expect(corrected.world.pages[0].highlights.find(h=>h.label==='Oaths kept')!.value).toBe('0');
 });
 it('keeps Bard suggestions separate from player songs and caches a daily verse with no network while disabled',async()=>{
  const s=household();s.world.songs=[{id:'private',title:'My private song',notes:'Private lyrics',chords:'G',created:date,updated:date}];
  const provider={generate:vi.fn()},next=await askBard(s,date,provider);expect(provider.generate).not.toHaveBeenCalled();expect(next.world.songs).toEqual(s.world.songs);expect(next.living.story.creative[0].kind).toBe('bard');expect(await askBard(next,date,provider)).toBe(next);expect(validate(next)).toBe(next);
 });
 it('selects an arrived character’s own personality and recurring canon without private history',async()=>{
  const s=household(),packet=dialoguePacket(s,'scholar',date)!;expect(packet.character.name).toBe('Brother Aldren');expect(packet.character.personality).toContain('Curious');expect(JSON.stringify(packet)).not.toContain('Private name');
  s.living.settings.enabled=true;s.living.settings.dialogue=true;
  const provider={generate:vi.fn().mockResolvedValue({text:'The diagram is where I left it. Unfortunately I have forgotten where that was.'})};const next=await speakWith(s,'scholar',date,provider);expect(next.living.story.creative[0].source).toBe('ai');expect(await speakWith(next,'scholar',date,provider)).toBe(next);expect(await speakWith(s,'physician',date,provider)).toBe(s);
 });
});
