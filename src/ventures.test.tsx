import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createKnight, completeQuest, totals, confirmOath, quests, oathDefinition } from './domain';
import { addDays, dayKey } from './calendar';
import { ventures, ventureReward, ventureTiers, type VentureDefinition } from './ventures';
import { ensureDailyVenture, todaysVenture, replaceDailyVenture, completeDailyVenture, completedVentures, selectVenture } from './ventureDomain';
import { load, save, migrate, validate, storageKeys } from './storage';
import { detectFeedback } from './feedback/events';
import { eventText, leadCue } from './feedback/Feedback';
import { DailyVenture, VentureLedger } from './DailyVenture';
import type { State } from './model';
const date = '2026-10-13';
const now = new Date(date + 'T19:00:00');
const initial = () => createKnight('Rowan', date);
const assigned = () => ensureDailyVenture(initial(), date);
const current = (s: State, day = date) => todaysVenture(s, day)!;
const complete = (s: State, time = now) => completeDailyVenture(s, current(s, dayKey(time)).assignmentId, time);
const memory = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
};
const broadLibrary: VentureDefinition[] = Array.from({ length: 15 }, (_, i) => ventures.map(v => ({ ...v, id: `${v.id}-${i}` }))).flat();

describe('Daily Venture assignment', () => {
  it('assigns one stable notice per local date, including refresh and reopening', () => {
    const s = assigned(), store = memory();
    expect(ensureDailyVenture(s, date)).toBe(s);
    save(s, store);
    const reopened = load(store, date)!;
    expect(ensureDailyVenture(reopened, date)).toBe(reopened);
    expect(current(reopened)).toEqual(current(s));
    expect(reopened.ventures).toHaveLength(1);
  });
  it('uses the local calendar boundary and rolls over without backfilling absent days', () => {
    const s = assigned(), next = ensureDailyVenture(s, dayKey(new Date(2026, 9, 14, 0, 0)));
    expect(next.ventures).toHaveLength(2);
    expect(current(next, '2026-10-14').assignmentId).not.toBe(current(s).assignmentId);
    expect(ensureDailyVenture(next, '2026-10-20').ventures).toHaveLength(3);
    expect(ensureDailyVenture(s, '2026-02-30')).toBe(s);
    expect(ensureDailyVenture(s, '2026-10-12')).toBe(s);
  });
  it('avoids the previous 14 IDs when library size allows and consecutive attributes', () => {
    let s = initial();
    for (let i = 0; i < 80; i++) {
      const day = addDays(date, i), previous = s.ventures.slice(-14);
      s = ensureDailyVenture(s, day, broadLibrary);
      const venture = current(s, day);
      expect(previous.map(v => v.id)).not.toContain(venture.id);
      expect(venture.attribute).not.toBe(previous.at(-1)?.attribute);
    }
  });
  it('prefers less recently represented attributes among equally suitable notices', () => {
    let s = ensureDailyVenture(initial(), date, [ventures[0]]);
    s = ensureDailyVenture(s, addDays(date, 1), [ventures[4]]);
    const selected = selectVenture(s.ventures, addDays(date, 2), 'seed', [
      { ...ventures[0], id: 'another-strength' }, { ...ventures[8], id: 'another-presence' },
    ]);
    expect(selected?.attribute).toBe('Presence');
  });
  it('falls back to the least recently used suitable notice rather than failing', () => {
    const library = [ventures[1], ventures[4], ventures[7]];
    let s = initial();
    for (let i = 0; i < 9; i++) s = ensureDailyVenture(s, addDays(date, i), library);
    expect(s.ventures).toHaveLength(9);
    expect(s.ventures.map(v => v.id)).toEqual(Array.from({ length: 9 }, (_, i) => s.ventures[i % 3].id));
  });
  it('uses centrally weighted 45/40/15 tiers on unconstrained selections', () => {
    const counts = { Brief: 0, Standard: 0, Bold: 0 };
    for (let i = 0; i < 10000; i++) counts[selectVenture([], date, `player-${i}`, broadLibrary)!.tier]++;
    for (const tier of Object.keys(counts) as (keyof typeof counts)[])
      expect(Math.abs(counts[tier] / 10000 - ventureTiers[tier].weight / 100)).toBeLessThan(.025);
  });
  it('keeps Bold uncommon with at most two Bold days in every rolling seven-day window', () => {
    let s = initial();
    for (let i = 0; i < 180; i++) {
      const day = addDays(date, i);
      s = ensureDailyVenture(s, day);
      expect(s.ventures.filter(v => v.date >= addDays(day, -6) && v.tier === 'Bold').length).toBeLessThanOrEqual(2);
    }
    expect(s.ventures.filter(v => v.tier === 'Bold').length / s.ventures.length).toBeLessThan(.23);
    expect(new Set(s.ventures.map(v => v.attribute)).size).toBe(6);
  });
  it('does not bypass the Bold guard through replacements', () => {
    let s = initial();
    for (let i = 0; i < 40; i++) {
      const day = addDays(date, i), time = new Date(day + 'T12:00:00');
      s = ensureDailyVenture(s, day);
      s = replaceDailyVenture(s, current(s, day).assignmentId, time);
      expect(s.ventures.filter(v => v.date >= addDays(day, -6) && v.tier === 'Bold').length).toBeLessThanOrEqual(2);
    }
  });
});
describe('optional completion and replacement', () => {
  it('allows only one replacement, prefers another attribute and persists the first set-aside notice', () => {
    const before = assigned(), first = current(before);
    const next = replaceDailyVenture(before, first.assignmentId, now), replacement = current(next);
    expect(replacement.id).not.toBe(first.id);
    expect(replacement.attribute).not.toBe(first.attribute);
    expect(next.ventures[0]).toMatchObject({ replaced: true, status: 'set-aside', rewardGrant: null });
    expect(replacement.replacementOf).toBe(first.assignmentId);
    expect(replaceDailyVenture(next, replacement.assignmentId, now)).toBe(next);
    const store = memory(); save(next, store);
    const loaded = load(store, date)!;
    expect(replaceDailyVenture(loaded, current(loaded).assignmentId, now)).toBe(loaded);
  });
  it('cannot reward the replaced notice, a stale ID or both notices', () => {
    const s = assigned(), first = current(s).assignmentId, next = replaceDailyVenture(s, first, now);
    expect(completeDailyVenture(next, first, now)).toBe(next);
    const done = complete(next);
    expect(totals(done).renown).toBe(current(done).reward.renown);
    expect(done.ventures.filter(v => v.rewardGrant)).toHaveLength(1);
    expect(completeDailyVenture(done, first, now)).toBe(done);
  });
  it('grants one completion receipt and disallows replacement after completion', () => {
    const s = complete(assigned());
    expect(complete(s)).toBe(s);
    expect(replaceDailyVenture(s, current(s).assignmentId, now)).toBe(s);
    const store = memory(); save(s, store);
    expect(complete(load(store, date)!)).toEqual(s);
    expect(current(s).completedAt).toBe(now.toISOString());
    expect(validate(s)).toBe(s);
  });
  it.each([['Brief', 30, 60], ['Standard', 45, 80], ['Bold', 65, 100]] as const)('grants exact %s rewards for all six attributes', (tier, renown, xp) => {
    for (const attribute of ['Strength', 'Endurance', 'Wisdom', 'Vitality', 'Presence', 'Resolve'] as const) {
      const s = ensureDailyVenture(initial(), date, [{ ...ventures[0], tier, attribute }]);
      expect(ventureReward(tier, attribute)).toEqual({ renown, xp: { [attribute]: xp } });
      const total = totals(complete(s)); expect(total.renown).toBe(renown); expect(total.xp[attribute]).toBe(xp);
    }
  });
  it('coexists with the ordinary daily reward without consuming its slot or advancing commissions', () => {
    const s = ensureDailyVenture(initial(), date, [ventures[0]]), done = complete(s);
    expect(done.weekly).toEqual(s.weekly);
    const both = completeQuest(done, 'training', date, now);
    expect(totals(both).renown).toBe(totals(done).renown + 35);
    expect(both.entries).toHaveLength(1);
    expect(complete(both)).toBe(both);
    expect(complete(completeQuest(s, 'training', date, now))).toEqual(both);
  });
  it('does not grant an old Venture reward after the date has passed', () => {
    const s = assigned();
    expect(completeDailyVenture(s, current(s).assignmentId, new Date('2026-10-14T12:00:00'))).toBe(s);
    expect(replaceDailyVenture(s, current(s).assignmentId, new Date('2026-10-14T12:00:00'))).toBe(s);
  });
  it('skipping has no reward, penalty, streak, missed counter or feedback', () => {
    const s = assigned(), next = ensureDailyVenture(s, '2026-10-16');
    expect(totals(next)).toEqual(totals(s));
    expect(next.oaths).toEqual(s.oaths);
    expect(completedVentures(next)).toEqual([]);
    expect(detectFeedback(s, next, 'venture')).toEqual([]);
    expect(Object.keys(current(next, '2026-10-16'))).not.toEqual(expect.arrayContaining(['streak', 'missed']));
  });
  it('preserves every snapshot after definitions and tier configuration are edited', () => {
    const library = structuredClone([ventures[4]]), s = ensureDailyVenture(initial(), date, library), before = structuredClone(current(s));
    library[0].title = 'Edited'; library[0].reading = 'Different'; library[0].tier = 'Bold';
    expect(current(ensureDailyVenture(s, date, library))).toEqual(before);
    const done = complete(s), store = memory(); save(done, store);
    const config = ventureTiers.Brief as { renown: number; xp: number; weight: number };
    const original = { ...config };
    try {
      config.renown = 300; config.xp = 200;
      expect(current(load(store, date)!).reward).toEqual(before.reward);
      expect(totals(load(store, date)!).renown).toBe(before.reward.renown);
    } finally { Object.assign(config, original); }
  });
});
describe('Venture feedback and Chronicle', () => {
  it('coordinates Venture, attribute and rank events in the existing priority order', () => {
    let before = assigned();
    before = { ...before, oaths: { [date]: { status: 'kept', reward: { renown: 995, xp: { [current(before).attribute]: 99 } } } } };
    const after = complete(before), events = detectFeedback(before, after, 'venture');
    expect(events.map(e => e.kind)).toEqual(['rank', 'level', 'venture', 'reward']);
    expect(eventText(events[2])).toBe(current(after).title);
    expect(leadCue([{ kind: 'venture', name: current(after).title, id: current(after).assignmentId }])).toBe('steel');
  });
  it('fires once, with no ceremony on reload, assignment or a quiet transition', () => {
    const before = assigned(), after = complete(before), store = memory(); save(after, store);
    expect(detectFeedback(before, after, 'venture').filter(e => e.kind === 'venture')).toHaveLength(1);
    expect(detectFeedback(after, complete(after), 'venture')).toEqual([]);
    expect(detectFeedback(after, load(store, date)!, 'venture')).toEqual([]);
    expect(detectFeedback(before, after, 'quiet')).toEqual([]);
  });
  it('renders only completed Ventures in the ledger using historical snapshots', () => {
    const before = replaceDailyVenture(assigned(), current(assigned()).assignmentId, now);
    expect(renderToStaticMarkup(<VentureLedger state={before} />)).toBe('');
    const done = ensureDailyVenture(complete(before), '2026-10-14');
    const markup = renderToStaticMarkup(<VentureLedger state={done} />);
    expect(markup).toContain(current(before).title.replaceAll('&', '&amp;').replaceAll("'", '&#x27;'));
    expect(markup).not.toContain(current(done, '2026-10-14').title);
    expect(completedVentures(done)).toHaveLength(1);
  });
  it('ships lessons locally and can select, display and complete without network access', () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(Error('offline'));
    try {
      const s = ensureDailyVenture(initial(), date, [ventures[4]]);
      const markup = renderToStaticMarkup(<DailyVenture venture={current(s)} open={false} onOpen={() => {}} onClose={() => {}} onComplete={() => {}} onReplace={() => {}} />);
      expect(markup).toContain('Medieval guilds were more than associations');
      expect(markup).toContain('Mark as read &amp; complete Venture');
      expect(current(complete(s)).status).toBe('completed');
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });
});
describe('v3 → v4 save migration', () => {
  function v3() {
    let s = completeQuest(initial(), 'training', date, now);
    s = confirmOath(s, date, 'kept', now);
    s = { ...s, portrait: 'tied-hair', migratedFrom: 2,
      deedNotes: [{ date, questId: 'study', name: 'A note', status: 'not-planned' }],
      weight: {
        settings: { displayUnit: 'lb', baseline: { date, grams: 90000 }, targetGrams: 85000,
          appearance: { enabled: true, startingBuild: 'large', targetBuild: 'lean' }, acknowledgedGoal: `${date}:90000:85000` },
        measurements: [{ id: 'original-measurement', date, grams: 88000, createdAt: now.toISOString(), updatedAt: now.toISOString() }],
      },
    };
    const { ventures: _ventures, world: _world, living: _living, ...old } = s;
    return { ...old, version: 3 };
  }
  it('preserves every existing field/value, reward and history exactly and invents no Ventures', () => {
    const old = v3(), next = migrate(old, date), { ventures: history, world: _world, living: _living, version, ...rest } = next;
    const { version: _version, ...oldFields } = old;
    expect(rest).toEqual(oldFields);
    expect(version).toBe(6); expect(history).toEqual([]);
  });
  it('backs up exact v3 bytes before committing v4 and keeps migration idempotent', () => {
    const old = v3(), raw = JSON.stringify(old, null, 2), store = memory(); store.setItem(storageKeys.v3, raw);
    const next = load(store, date)!;
    expect(store.getItem(storageKeys.ventureBackup)).toBe(raw);
    expect(store.getItem(storageKeys.v3)).toBe(raw);
    expect(load(store, date)).toEqual(next);
    expect(next.ventures).toEqual([]);
  });
  it('keeps existing backups and never writes v4 when backup creation fails', () => {
    const store = memory(), raw = JSON.stringify(v3()); store.setItem(storageKeys.v3, raw);
    expect(() => load({ getItem: store.getItem, setItem: () => { throw Error('quota'); } }, date)).toThrow('quota');
    expect(store.getItem(storageKeys.current)).toBeNull(); expect(store.getItem(storageKeys.v3)).toBe(raw);
    store.setItem(storageKeys.ventureBackup, 'earlier backup'); load(store, date);
    expect(store.getItem(storageKeys.ventureBackup)).toBe('earlier backup');
  });
  it('rejects corrupt v4 without falling back and validates replacement/reward links', () => {
    const store = memory(); store.setItem(storageKeys.v3, JSON.stringify(v3())); store.setItem(storageKeys.current, '{bad');
    expect(() => load(store, date)).toThrow(); expect(store.getItem(storageKeys.ventureBackup)).toBeNull();
    const s = complete(assigned());
    for (const mutation of [
      (v: any) => { v.rewardGrant = null; }, (v: any) => { v.rewardGrant.period.start = '2026-10-12'; },
      (v: any) => { v.completedAt = 'bad'; }, (v: any) => { v.replacementOf = 'missing'; },
      (v: any) => { v.reward.xp.Extraneous = 10; }, (v: any) => { v.replaced = true; },
    ]) {
      const invalid = structuredClone(s); mutation(invalid.ventures[0]); expect(() => validate(invalid)).toThrow();
    }
    expect(() => validate({ ...s, ventures: [...s.ventures, ...s.ventures] })).toThrow();
  });
});

describe('expanded authored library and multiple attributes', () => {
  it('contains 60 unique Ventures, with eight additions led by each attribute', () => {
    expect(ventures).toHaveLength(60);
    expect(new Set(ventures.map(v => v.id)).size).toBe(60);
    for (const attribute of ['Strength', 'Endurance', 'Wisdom', 'Vitality', 'Presence', 'Resolve'])
      expect(ventures.slice(12).filter(v => v.attribute === attribute)).toHaveLength(8);
    for (const definition of ventures) {
      const s = ensureDailyVenture(initial(), date, [definition]);
      expect(validate(complete(s))).toBeDefined();
    }
    const lessons = ventures.slice(12).filter(v => v.reading);
    expect(lessons).toHaveLength(8);
    for (const lesson of lessons) {
      const words = lesson.reading!.trim().split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(150);
      expect(words).toBeLessThanOrEqual(400);
    }
  });
  it.each([['Brief', 30, 30], ['Standard', 45, 40], ['Bold', 65, 50]] as const)(
    'splits %s XP while granting Renown once and preserving one completion receipt', (tier, renown, xp) => {
      const definition: VentureDefinition = { ...ventures[0], tier, secondaryAttributes: ['Endurance'] };
      const s = ensureDailyVenture(initial(), date, [definition]), done = complete(s), total = totals(done);
      expect(current(done).reward).toEqual({ renown, xp: { Strength: xp, Endurance: xp } });
      expect(total.renown).toBe(renown); expect(total.xp.Strength).toBe(xp); expect(total.xp.Endurance).toBe(xp);
      expect(complete(done)).toBe(done);
      const store = memory(); save(done, store);
      expect(load(store, date)).toEqual(done);
    },
  );
  it('keeps integer XP and the total tier budget when divided across three attributes', () => {
    expect(ventureReward('Standard', 'Strength', ['Endurance', 'Resolve'])).toEqual({
      renown: 45, xp: { Strength: 27, Endurance: 27, Resolve: 26 },
    });
    expect(() => ventureReward('Brief', 'Strength', ['Strength'])).toThrow('distinct');
  });
  it('avoids repeating any previous attribute when a disjoint Venture is available', () => {
    let s = ensureDailyVenture(initial(), date, [{ ...ventures[0], secondaryAttributes: ['Endurance'] }]);
    const library: VentureDefinition[] = [
      { ...ventures[8], secondaryAttributes: ['Strength'] }, ventures[6],
    ];
    s = ensureDailyVenture(s, addDays(date, 1), library);
    expect(current(s, addDays(date, 1)).attribute).toBe('Vitality');
    const replaced = replaceDailyVenture(ensureDailyVenture(initial(), date, [{ ...ventures[0], secondaryAttributes: ['Endurance'] }]),
      `venture:${date}:first`, now, library);
    expect(current(replaced).attribute).toBe('Vitality');
  });
  it('falls back to a different primary attribute when all candidates overlap', () => {
    const s = ensureDailyVenture(initial(), date, [{ ...ventures[0], secondaryAttributes: ['Endurance'] }]);
    const next = ensureDailyVenture(s, addDays(date, 1), [{ ...ventures[8], secondaryAttributes: ['Strength'] }]);
    expect(current(next, addDays(date, 1)).attribute).toBe('Presence');
  });
  it('counts secondary attributes when preferring less frequently represented attributes', () => {
    let s = ensureDailyVenture(initial(), date, [{ ...ventures[6], secondaryAttributes: ['Wisdom'] }]);
    s = ensureDailyVenture(s, addDays(date, 1), [ventures[8]]);
    const next = ensureDailyVenture(s, addDays(date, 2), [ventures[0], { ...ventures[4], tier: 'Standard' }]);
    expect(current(next, addDays(date, 2)).attribute).toBe('Strength');
  });
  it('retains secondary attributes and rewards as historical snapshots after definition edits', () => {
    const definition: VentureDefinition = { ...structuredClone(ventures[0]), secondaryAttributes: ['Endurance'] };
    const done = complete(ensureDailyVenture(initial(), date, [definition]));
    definition.secondaryAttributes = ['Resolve'];
    const store = memory(); save(done, store);
    const history = current(load(store, date)!);
    expect(history.secondaryAttributes).toEqual(['Endurance']);
    expect(history.reward.xp).toEqual({ Strength: 40, Endurance: 40 });
    const markup = renderToStaticMarkup(<VentureLedger state={done} />);
    expect(markup).toContain('Strength + Endurance');
    expect(markup).toContain('15');
  });
  it('keeps old v4 single-attribute saves and their full original XP unchanged', () => {
    const original = ensureDailyVenture(initial(), date, [ventures[0]]), store = memory();
    // A pre-expansion v4 receipt contains the original Standard reward, not the new balance.
    original.ventures[0].reward = { renown: 45, xp: { Strength: 30 } };
    const done = complete(original);
    expect(current(done).secondaryAttributes).toBeUndefined();
    save(done, store);
    expect(load(store, date)).toEqual(done);
    expect(current(load(store, date)!).reward.xp).toEqual({ Strength: 30 });
  });
  it('coordinates both attribute level-ups with one Venture event and one total reward', () => {
    let s = ensureDailyVenture(initial(), date, [{ ...ventures[0], secondaryAttributes: ['Endurance'] }]);
    s = { ...s, oaths: { [date]: { status: 'kept', reward: { renown: 995, xp: { Strength: 99, Endurance: 99 } } } } };
    const events = detectFeedback(s, complete(s), 'venture');
    expect(events.map(e => e.kind)).toEqual(['rank', 'level', 'level', 'venture', 'reward']);
    expect(events.filter(e => e.kind === 'level').map(e => e.attribute)).toEqual(['Strength', 'Endurance']);
    expect(events.at(-1)).toEqual({ kind: 'reward', reward: { renown: 45, xp: { Strength: 40, Endurance: 40 } } });
  });
  it('keeps the share in every authored multi-attribute Venture above ordinary deed and Oath XP', () => {
    const ordinary = Math.max(...quests.flatMap(q => Object.values(q.reward.xp)), ...Object.values(oathDefinition.reward.xp));
    for (const definition of ventures.filter(v => v.secondaryAttributes?.length)) {
      const reward = ventureReward(definition.tier, definition.attribute, definition.secondaryAttributes);
      expect(Object.values(reward.xp).every(xp => xp! > ordinary)).toBe(true);
      expect(Object.values(reward.xp).reduce((total, xp) => total + xp!, 0)).toBe(ventureTiers[definition.tier].xp);
    }
  });
  it('rejects duplicate, unknown or incomplete multi-attribute snapshots', () => {
    const done = complete(ensureDailyVenture(initial(), date, [{ ...ventures[0], secondaryAttributes: ['Endurance'] }]));
    for (const mutate of [
      (v: any) => { v.secondaryAttributes = ['Strength']; },
      (v: any) => { v.secondaryAttributes = ['Endurance', 'Endurance']; },
      (v: any) => { v.secondaryAttributes = ['Magic']; },
      (v: any) => { v.secondaryAttributes = 'Endurance'; },
      (v: any) => { delete v.reward.xp.Endurance; },
      (v: any) => { v.reward.xp.Resolve = 10; },
    ]) {
      const bad = structuredClone(done); mutate(bad.ventures[0]); expect(() => validate(bad)).toThrow();
    }
  });
});
