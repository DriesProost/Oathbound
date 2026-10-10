import {describe,expect,it} from 'vitest';
import {swipeDirection} from './journalSwipe';
describe('journal swipe intent',()=>{
 it('turns deliberately left or right',()=>{expect(swipeDirection(-110,12,300)).toBe(1);expect(swipeDirection(110,12,300)).toBe(-1);});
 it('ignores vertical scroll, short nudges, ambiguous diagonals and long presses',()=>{
  expect(swipeDirection(20,180,250)).toBe(0);expect(swipeDirection(-60,0,250)).toBe(0);
  expect(swipeDirection(100,80,250)).toBe(0);expect(swipeDirection(100,0,1500)).toBe(0);
 });
});
