import { detectFeedback } from './feedback/events';
import { describe, it, expect } from 'vitest';
import { bodyAppearance, bodyAppearanceExplanation, knightAppearance } from './appearance';
import { createKnight, totals, completeQuest, confirmOath, oathStats } from './domain';
import { addWeighIn, setWeightSettings, deleteWeighIn, editWeighIn, validWeightSettings } from './weight';
import { defaultGoals, configureCampaign } from './campaign';
import { save, load, validate } from './storage';
import { weightSettingsDraft, parseWeightSettingsDraft } from './WeightSettingsFields';
const now = new Date('2026-10-09T19:00:00');
function start(baseline = 100000, target = 80000, from: 'large'|'sturdy'|'lean' = 'large', to: 'large'|'sturdy'|'lean' = 'lean') {
  return setWeightSettings(createKnight('Ada','2026-10-01',defaultGoals()), {
    displayUnit:'kg', baseline:{date:'2026-10-01',grams:baseline}, targetGrams:target,
    appearance:{enabled:true,startingBuild:from,targetBuild:to},
  });
}
function measure(s: ReturnType<typeof start>, date: string, grams: number) {
  return addWeighIn(s,date,grams,{id:date,now});
}
describe('optional outcome appearance', () => {
  it('explains a single target-weight observation without inventing trend progress', () => {
    const s=measure(start(),'2026-10-09',80000);
    expect(bodyAppearance(s.weight,'2026-10-09').build).toBe('large');
    expect(bodyAppearanceExplanation(s.weight,'2026-10-09')).toContain('one weigh-in does not change it');
    expect(bodyAppearanceExplanation({...s.weight,settings:{...s.weight.settings,baseline:null}},'2026-10-09')).toContain('Set a starting weight and target');
    expect(bodyAppearanceExplanation({...s.weight,settings:{...s.weight.settings,targetGrams:100000}},'2026-10-09')).toContain('equal');
    expect(bodyAppearanceExplanation(createKnight('Ada','2026-10-01').weight,'2026-10-09')).toBeNull();
  });
  it('keeps legacy saves unlinked; valid explicit choices round-trip without version churn', () => {
    const legacy=createKnight('Ada','2026-10-01');
    expect(bodyAppearance(legacy.weight,'2026-10-09').linked).toBe(false);
    expect(validate(JSON.parse(JSON.stringify(legacy)))).toEqual(legacy);
    const s=start();
    expect(validWeightSettings(s.weight.settings)).toBe(true);
    expect(validWeightSettings({...s.weight.settings,appearance:{enabled:true,startingBuild:'bad',targetBuild:'lean'}})).toBe(false);
    expect(validWeightSettings({...s.weight.settings,appearance:{enabled:'yes',startingBuild:'large',targetBuild:'lean'}})).toBe(false);
    const values=new Map<string,string>();
    const store={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};
    save(s,store);
    expect(load(store,'2026-10-09')?.weight).toEqual(s.weight);
    expect(s.version).toBe(3);
  });
  it('leaves explicit starting build in place without baseline, target or sufficient observations', () => {
    let s=start();
    expect(bodyAppearance(s.weight,'2026-10-09').build).toBe('large');
    s=measure(s,'2026-10-01',80000);
    s=measure(s,'2026-10-02',80000);
    expect(bodyAppearance(s.weight,'2026-10-09').build).toBe('large');
    expect(bodyAppearance({...s.weight,settings:{...s.weight.settings,baseline:null}},'2026-10-09').progress).toBeNull();
    expect(bodyAppearance({...s.weight,settings:{...s.weight.settings,targetGrams:null}},'2026-10-09').progress).toBeNull();
    expect(bodyAppearance({...s.weight,settings:{...s.weight.settings,targetGrams:100000}},'2026-10-09').build).toBe('large');
  });
  it('uses actual seven-day trends for staged loss and gain plans', () => {
    let loss=start();
    for(const d of ['2026-10-01','2026-10-02','2026-10-03']) loss=measure(loss,d,90000);
    expect(bodyAppearance(loss.weight,'2026-10-09').build).toBe('sturdy');
    let gain=start(60000,80000,'lean','large');
    for(const d of ['2026-10-01','2026-10-02','2026-10-03']) gain=measure(gain,d,70000);
    expect(bodyAppearance(gain.weight,'2026-10-09').build).toBe('sturdy');
    for(const d of ['2026-10-07','2026-10-08','2026-10-09']) gain=measure(gain,d,90000);
    expect(bodyAppearance(gain.weight,'2026-10-09').build).toBe('large');
    expect(gain.weight.measurements).toHaveLength(6);
    expect(bodyAppearance(gain.weight,'2026-10-02').build).toBe('lean');
  });
  it('retains a reached visual stage through fluctuations, without storing a weight achievement', () => {
    let s=start();
    for(const d of ['2026-10-01','2026-10-02','2026-10-03']) s=measure(s,d,80000);
    expect(bodyAppearance(s.weight,'2026-10-03').build).toBe('lean');
    s=measure(s,'2026-10-09',110000);
    expect(bodyAppearance(s.weight,'2026-10-09').build).toBe('lean');
    expect(Object.keys(s)).not.toContain('appearanceMilestones');
    const before=structuredClone(s);
    bodyAppearance(s.weight,'2026-10-09');
    expect(s).toEqual(before);
  });
  it('recomputes edited source data safely and ignores sparse/pre-baseline/future windows', () => {
    let s=start();
    for(const d of ['2026-10-01','2026-10-02','2026-10-03']) s=measure(s,d,80000);
    s=editWeighIn(s,'2026-10-03','2026-10-03',110000,now);
    expect(bodyAppearance(s.weight,'2026-10-09').build).toBe('sturdy');
    s=deleteWeighIn(s,'2026-10-02');
    expect(bodyAppearance(s.weight,'2026-10-09').build).toBe('large');
    let sparse=start();
    for(const d of ['2026-10-01','2026-10-05','2026-10-09']) sparse=measure(sparse,d,80000);
    expect(bodyAppearance(sparse.weight,'2026-10-09').hasTrend).toBe(false);
    expect(sparse.weight.measurements).toHaveLength(3);
    const shifted={...sparse.weight,settings:{...sparse.weight.settings,baseline:{date:'2026-10-09',grams:100000}}};
    expect(bodyAppearance(shifted,'2026-10-09').build).toBe('large');
  });
  it('never changes rewards, attributes, ranks, Oaths, commissions or Journey; disabling preserves data', () => {
    let s=completeQuest(start(),'training','2026-10-01',now);
    s=confirmOath(s,'2026-10-01','kept',now);
    const original=structuredClone(s), earned=totals(s), oaths=oathStats(s,'2026-10-09');
    for(const d of ['2026-10-01','2026-10-02','2026-10-03']) s=measure(s,d,80000);
    const look=knightAppearance(totals(s).renown,totals(s).xp,s.weight,'2026-10-09');
    expect(look.body).toBe('lean');
    expect(totals(s)).toEqual(earned);
    expect(detectFeedback(original,s,'quiet')).toEqual([]);
    expect(detectFeedback(original,s,'deed')).toEqual([]);
    expect(s.entries).toEqual(original.entries);
    expect(s.weekly).toEqual(original.weekly);
    expect(s.oaths).toEqual(original.oaths);
    expect(oathStats(s,'2026-10-09')).toEqual(oaths);
    const storedWeight=structuredClone(s.weight);
    s=configureCampaign(s,defaultGoals(false),'2026-10-09');
    expect(s.weight).toEqual(storedWeight);
    s=configureCampaign(s,defaultGoals(true).map(g=>({...g,active:true})),'2026-10-09');
    expect(s.weight).toEqual(storedWeight);
    expect(bodyAppearance(s.weight,'2026-10-09').build).toBe('lean');
  });
  it('keeps grooming, beard, muscle and rank independent of outcomes', () => {
    const s=start();
    const plain=knightAppearance(0,{},s.weight,'2026-10-09');
    const groomed=knightAppearance(0,{Presence:225},s.weight,'2026-10-09');
    expect(plain.groomed).toBe(false);
    expect(groomed.groomed).toBe(true);
    expect(groomed.body).toBe('large');
    expect(groomed.stage).toBe(0);
    expect(groomed.beard).toBe(0);
    expect(groomed.buildScale).toBe(1);
    const wise=knightAppearance(0,{Wisdom:750},s.weight,'2026-10-09');
    expect(wise.beard).toBe(2);
    expect(wise.groomed).toBe(false);
    expect(wise.body).toBe('large');
  });
  it('makes the link optional in shared campaign/Chronicle settings and keeps measurements untouched', () => {
    const s=start();
    const draft=weightSettingsDraft(s.weight.settings,'2026-10-09');
    expect(draft.appearanceEnabled).toBe(true);
    const off=parseWeightSettingsDraft({...draft,appearanceEnabled:false},s.weight.settings,'2026-10-09');
    const next=setWeightSettings(s,off);
    expect(next.weight.measurements).toEqual(s.weight.measurements);
    expect(bodyAppearance(next.weight,'2026-10-09').linked).toBe(false);
    expect(next.weight.settings.appearance?.startingBuild).toBe('large');
    expect(parseWeightSettingsDraft(weightSettingsDraft({...s.weight.settings,appearance:undefined},'2026-10-09'),{...s.weight.settings,appearance:undefined},'2026-10-09').appearance).toBeUndefined();
  });
});
