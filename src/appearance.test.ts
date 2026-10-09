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
  it('uses actual attribute levels for understated equipment details', () => {
    expect(knightAppearance(0,{Wisdom:224,Endurance:224}).scholar).toBe(false);
    const look=knightAppearance(0,{Wisdom:225,Endurance:225});
    expect(look.scholar).toBe(true);
    expect(look.traveller).toBe(true);
    expect(look.stage).toBe(0);
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
