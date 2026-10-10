import {describe, it, expect} from 'vitest';
import {createKnight, totals} from './domain';
import {knightAppearance} from './appearance';
import {detectFeedback} from './feedback/events';
import {validate, save, load} from './storage';

describe('optional character likeness', () => {
  it('preserves existing saves and changes only the selected portrait', () => {
    const before=createKnight('Rowan','2026-10-10');
    expect(validate(before)).toEqual(before);
    expect(before.portrait).toBeUndefined();
    const next={...before,portrait:'personal' as const};
    expect(validate(next)).toEqual(next);
    expect(totals(next)).toEqual(totals(before));
    expect(detectFeedback(before,next,'quiet')).toEqual([]);
    expect(next.weight).toEqual(before.weight);
    expect(next.weekly).toEqual(before.weekly);
    expect(next.oaths).toEqual(before.oaths);
    const values=new Map<string,string>();
    const store={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)}};
    save(next,store);
    expect(load(store,'2026-10-10')?.portrait).toBe('personal');
    expect(()=>validate({...next,portrait:'unknown'})).toThrow();
    expect(validate({...next,portrait:'classic'}).portrait).toBe('classic');
  });
  it('keeps earned rank, attributes and build identical between likeness choices', () => {
    const original=knightAppearance(7500,{Wisdom:750,Presence:225,Strength:750,Vitality:750});
    const personal=knightAppearance(7500,{Wisdom:750,Presence:225,Strength:750,Vitality:750},undefined,'2026-10-10','personal');
    const {description: a,...baseA}=original;
    const {description: b,...baseB}=personal;
    expect(baseB).toEqual(baseA);
    expect(a).toContain('full brown beard');
    expect(b).toContain('long brown beard');
    expect(knightAppearance(0,{},undefined,'2026-10-10','personal').description).toContain('short brown beard');
  });
});
