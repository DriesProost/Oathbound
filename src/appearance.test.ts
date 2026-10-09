import {describe, it, expect} from 'vitest';
import {knightAppearance} from './appearance';
import {progression} from './config';
import {landmarks} from './journey';
describe('earned visual progression', () => {
  it('starts as a squire and follows existing rank thresholds exactly', () => {
    expect(knightAppearance().description).toContain('Wool tunic');
    progression.ranks.forEach((rank, i) => {
      expect(knightAppearance(rank.threshold).stage).toBe(i);
      expect(knightAppearance(rank.threshold).rank).toBe(rank.name);
      if(i) expect(knightAppearance(rank.threshold-1).stage).toBe(i-1);
    });
  });
  it('uses Wisdom for beard stages independently of rank equipment', () => {
    expect(knightAppearance(0,{Wisdom:224}).beard).toBe(0);
    expect(knightAppearance(0,{Wisdom:225}).beard).toBe(1);
    expect(knightAppearance(0,{Wisdom:749}).beard).toBe(1);
    expect(knightAppearance(0,{Wisdom:750}).beard).toBe(2);
    expect(knightAppearance(0,{Wisdom:750}).stage).toBe(0);
    expect(knightAppearance(15000).beard).toBe(0);
  });
  it('keeps physique and complexion changes subtle, bounded, and independent', () => {
    const baseline = knightAppearance();
    const strong = knightAppearance(0,{Strength:225});
    const rested = knightAppearance(0,{Vitality:225});
    expect(strong.buildScale).toBeGreaterThan(baseline.buildScale);
    expect(strong.faceBrightness).toBe(1);
    expect(rested.buildScale).toBe(1);
    expect(rested.faceBrightness).toBeGreaterThan(1);
    const developed = knightAppearance(0,{Strength:100000,Vitality:100000});
    expect(developed.buildScale).toBeLessThanOrEqual(1.08);
    expect(developed.faceBrightness).toBeLessThanOrEqual(1.06);
    expect(developed.beard).toBe(0);
    expect(developed.stage).toBe(0);
  });
  it('keeps established map distances and gives every destination a rereadable chapter', () => {
    expect(landmarks.map(s=>s.km)).toEqual([0,9,21,30]);
    for(const stop of landmarks){
      expect(stop.story).toHaveLength(3);
      expect(stop.story.join(' ').split(/\s+/).length).toBeGreaterThan(150);
      expect(stop.title.length).toBeGreaterThan(0);
      expect(stop.teaser.length).toBeGreaterThan(0);
    }
  });
});
