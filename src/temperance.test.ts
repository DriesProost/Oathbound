import { describe, it, expect } from 'vitest';
import { defaultGoals, configureCampaign, weekdayOathSummary, optionalOathDay, weekdayTemperance, validGoals } from './campaign';
import { createKnight, confirmOath, takeOath, totals } from './domain';
import { validate } from './storage';
const now = (day: string) => new Date(`${day}T19:00:00`);
const goals = () => defaultGoals(false).map(g => g.id === 'temperance' ? { ...g, active: true, target: { metric: 'oath' as const, schedule: 'weekdays' as const } } : g);
describe('weekday temperance plan', () => {
  it('validates plans and keeps legacy abstinence unchanged', () => {
    expect(validGoals(goals())).toBe(true);
    expect(validGoals(goals().map(g => g.id === 'temperance' ? {...g, target: {metric:'oath', schedule:'sometimes'}} : g))).toBe(false);
    const old = createKnight('Ada', '2026-10-05');
    expect(weekdayTemperance(old)).toBe(false);
    expect(optionalOathDay(old, '2026-10-10')).toBe(false);
    expect(validate(JSON.parse(JSON.stringify(old)))).toEqual(old);
  });
  it('leaves weekends optional and requires voluntary intent before a weekend reward', () => {
    let s = createKnight('Ada', '2026-10-05', goals());
    expect(optionalOathDay(s, '2026-10-09')).toBe(false);
    expect(optionalOathDay(s, '2026-10-10')).toBe(true);
    expect(optionalOathDay(s, '2026-10-11')).toBe(true);
    expect(optionalOathDay(s, '2026-10-12')).toBe(false);
    expect(confirmOath(s, '2026-10-10', 'kept', now('2026-10-10'))).toBe(s);
    s = takeOath(s, '2026-10-10', now('2026-10-10'));
    s = confirmOath(s, '2026-10-10', 'kept', now('2026-10-10'));
    expect(totals(s).renown).toBe(40);
    expect(confirmOath(s, '2026-10-10', 'kept', now('2026-10-10'))).toBe(s);
    expect(weekdayOathSummary(s, '2026-10-11').kept).toBe(0);
  });
  it('separates kept, drinking and unlogged weekdays without removing legitimate rewards', () => {
    let s = createKnight('Ada', '2026-10-05', goals());
    for (const day of ['2026-10-05','2026-10-06','2026-10-07','2026-10-08']) s = confirmOath(s, day, 'kept', now(day));
    s = confirmOath(s, '2026-10-09', 'broken', now('2026-10-09'));
    expect(weekdayOathSummary(s, '2026-10-11')).toEqual({kept:4, recorded:5, eligible:5, unlogged:0});
    expect(totals(s).renown).toBe(160);
    s = confirmOath(s, '2026-10-08', 'broken', now('2026-10-11'));
    expect(totals(s).renown).toBe(120);
    expect(weekdayOathSummary(createKnight('Ada', '2026-10-05', goals()), '2026-10-09').unlogged).toBe(5);
  });
  it('persists the plan and preserves history when switching or disabling it', () => {
    let s = createKnight('Ada', '2026-10-05');
    s = confirmOath(s, '2026-10-05', 'kept', now('2026-10-05'));
    const original = s.oaths;
    s = configureCampaign(s, goals(), '2026-10-09');
    expect(s.oaths).toEqual(original);
    expect(weekdayTemperance(s, '2026-10-05')).toBe(false);
    expect(weekdayTemperance(s, '2026-10-09')).toBe(true);
    expect(validate(JSON.parse(JSON.stringify(s)))).toEqual(s);
    s = configureCampaign(s, defaultGoals(false), '2026-10-10');
    expect(s.oaths).toEqual(original);
    expect(totals(s).renown).toBe(40);
  });
});
