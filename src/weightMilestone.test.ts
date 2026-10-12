import {describe,expect,it} from 'vitest';
import {createKnight,totals} from './domain';
import {addWeighIn,setWeightSettings,deleteWeighIn} from './weight';
import {bodyAppearance} from './appearance';
import {acknowledgeWeightMilestone} from './weightMilestone';
import {validate} from './storage';
const today='2026-10-12',now=new Date(today+'T19:00:00');
const start=()=>setWeightSettings(createKnight('Rowan','2026-10-01'),{displayUnit:'kg',baseline:{date:'2026-10-01',grams:100000},targetGrams:80000,appearance:{enabled:true,startingBuild:'large',targetBuild:'lean'}});
describe('cosmetic weight milestones',()=>{
 it('moves to sturdy at halfway and lean at the target using confirmed weigh-ins',()=>{
  let s=start();expect(bodyAppearance(s.weight,today).build).toBe('large');s=addWeighIn(s,'2026-10-10',90000,{id:'half',now});expect(bodyAppearance(s.weight,today).build).toBe('sturdy');
  s=addWeighIn(s,today,80000,{id:'target',now});expect(bodyAppearance(s.weight,today).build).toBe('lean');
 });
 it('acknowledges once, never grants XP or changes behaviour records, and does not replay',()=>{
  const before=start(),measured=addWeighIn(before,today,80000,{id:'target',now});const result=acknowledgeWeightMilestone(before,measured,today);expect(result.celebrate).toBe(true);expect(validate(result.state)).toEqual(result.state);
  expect(totals(result.state)).toEqual(totals(before));expect(result.state.entries).toEqual(before.entries);expect(result.state.weekly).toEqual(before.weekly);expect(result.state.oaths).toEqual(before.oaths);
  expect(acknowledgeWeightMilestone(result.state,result.state,today).celebrate).toBe(false);
  const deleted=deleteWeighIn(result.state,'target'),reentered=addWeighIn(deleted,today,80000,{id:'replacement',now});expect(acknowledgeWeightMilestone(deleted,reentered,today).celebrate).toBe(false);
 });
 it('does not invent a celebration by changing a target or using baseline equal to target',()=>{
  const s=start(),measured=addWeighIn(s,today,90000,{id:'weight',now});const changed=setWeightSettings(measured,{...s.weight.settings,targetGrams:90000});expect(acknowledgeWeightMilestone(measured,changed,today).celebrate).toBe(false);
  const equal=setWeightSettings(s,{...s.weight.settings,targetGrams:100000});expect(acknowledgeWeightMilestone(equal,addWeighIn(equal,today,100000,{id:'same',now}),today).celebrate).toBe(false);
 });
});
