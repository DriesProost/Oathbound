import { createLiving } from './living/model';
import { validLiving } from './living/validation';
import { createWorld } from "./worldModel";
import { validWorld } from "./worldValidation";
import { validVentureHistory } from "./ventureValidation";
import { validWeightData } from "./weight";
import { attributes, quests, type Reward } from "./config";
import { validDay, dayKey, weekStart, addDays } from "./calendar";
import {
  createCampaign,
  defaultGoals,
  configureCampaign,
  goalDefinitions,
  validGoals,
  validTarget,
  validWeeklyTarget,
} from "./campaign";
import { ensureWeeklyPeriod } from "./weekly";
import { campaignRules } from "./config";
import { goalIds, portraitIds, type State, type Entry } from "./model";
export const storageKeys = {
  current: "oathbound.knight.v7",
  v6: "oathbound.knight.v6",
  choreBackup: "oathbound.knight.v6.chore.backup",
  v5: "oathbound.knight.v5",
  livingBackup: "oathbound.knight.v5.living.backup",
  v4: "oathbound.knight.v4",
  worldBackup: "oathbound.knight.v4.world.backup",
  v3: "oathbound.knight.v3",
  ventureBackup: "oathbound.knight.v3.ventures.backup",
  weeklyBackup: "oathbound.knight.v3.2a.backup",
  previous: "oathbound.knight.v2",
  legacy: "oathbound.knight.v1",
  backup: "oathbound.knight.v1.backup",
  previousBackup: "oathbound.knight.v2.backup",
};
type V3State = Omit<State, "version" | "ventures" | "world" | "living"> & { version: 3 };
type V4State = Omit<State, "version" | "world" | "living"> & { version: 4 };
type Store = Pick<Storage, "getItem" | "setItem">;
type ObjectValue = Record<string, any>;
const failure = (): never => {
  throw Error(
    "Saved chronicle cannot be read. Original data has been left untouched.",
  );
};
const object = (v: unknown): v is ObjectValue =>
  !!v && typeof v === "object" && !Array.isArray(v);
const number = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
function reward(v: unknown): v is Reward {
  return (
    object(v) &&
    number(v.renown) &&
    object(v.xp) &&
    Object.entries(v.xp).every(
      ([a, n]) => attributes.includes(a as any) && number(n),
    )
  );
}
function base(s: unknown): s is ObjectValue & {
  entries: ObjectValue[];
  oaths: Record<string, ObjectValue>;
} {
  return (
    object(s) &&
    typeof s.name === "string" &&
    s.name.trim().length > 0 &&
    validDay(s.created) &&
    Array.isArray(s.entries) &&
    object(s.oaths)
  );
}
function unique(values: string[]) {
  return new Set(values).size === values.length;
}
function validOaths(oaths: Record<string, unknown>) {
  return Object.entries(oaths).every(
    ([date, o]) =>
      validDay(date) &&
      object(o) &&
      ["taken", "kept", "broken"].includes(o.status) &&
      (o.status === "kept" ? reward(o.reward) : o.reward === null),
  );
}
function validCampaign(c: unknown, created: string) {
  if (!object(c) || !Array.isArray(c.revisions) || !c.revisions.length)
    return false;
  const rs: unknown[] = c.revisions;
  return (
    rs.every(
      (r, i) =>
        object(r) &&
        typeof r.id === "string" &&
        r.id.length > 0 &&
        validDay(r.effectiveDate) &&
        validGoals(r.goals) &&
        (i === 0
          ? r.effectiveDate === created
          : r.effectiveDate >= (rs[i - 1] as ObjectValue).effectiveDate),
    ) && unique(c.revisions.map((r: ObjectValue) => r.id))
  );
}
function validateBaseV3(s: unknown): V3State {
  if (
    !base(s) ||
    s.version !== 3 ||
    !validCampaign(s.campaign, s.created) ||
    !validOaths(s.oaths) ||
    !validWeightData(s.weight)
  )
    return failure();
  if (
    !s.entries.every(
      (e) =>
        object(e) &&
        typeof e.id === "string" &&
        e.id.length > 0 &&
        typeof e.activityId === "string" &&
        e.activityId.length > 0 &&
        validDay(e.date) &&
        typeof e.questId === "string" &&
        e.questId !== "oath" &&
        (e.goalId === null ||
          (goalIds.includes(e.goalId) &&
            !["weight", "temperance"].includes(e.goalId))) &&
        object(e.period) &&
        e.period.kind === "day" &&
        e.period.start === e.date &&
        reward(e.reward) &&
        number(e.distance) &&
        object(e.deed) &&
        typeof e.deed.name === "string" &&
        typeof e.deed.description === "string" &&
        (e.deed.timing === null ||
          ["immediate", "end-of-day", "retrospective"].includes(
            e.deed.timing,
          )) &&
        (e.deed.target === null ||
          (validTarget(e.deed.target) &&
            !["oath", "outcome"].includes(e.deed.target.metric))),
    )
  )
    return failure();
  if (
    !unique(s.entries.map((e) => e.id)) ||
    !unique(s.entries.map((e) => e.activityId)) ||
    !unique(s.entries.map((e) => `${e.date}:${e.questId}`)) ||
    !unique(
      s.entries
        .filter((e) => e.goalId !== null)
        .map((e) => `${e.date}:${e.goalId}`),
    )
  )
    return failure();
  return s as V3State;
}
function validateV3(source: unknown): V3State {
  const s = validateBaseV3(source);
  if (s.portrait !== undefined && !portraitIds.some(id => id === s.portrait)) return failure();
  if (s.deedNotes !== undefined && (
    !Array.isArray(s.deedNotes) ||
    !s.deedNotes.every((n) => object(n) && validDay(n.date) && n.date >= s.created &&
      quests.some((q) => q.id === n.questId) && typeof n.name === "string" && n.name.length > 0 &&
      ["not-completed", "not-planned"].includes(n.status) &&
      !s.entries.some((e) => e.date === n.date && e.questId === n.questId)) ||
    !unique(s.deedNotes.map((n) => `${n.date}:${n.questId}`))
  )) return failure();
  if (
    !object(s.weekly) ||
    !validDay(s.weekly.trackingSince) ||
    !Number.isInteger(s.weekly.weekStartsOn) ||
    s.weekly.weekStartsOn < 0 ||
    s.weekly.weekStartsOn > 6 ||
    !Array.isArray(s.weekly.commissions)
  )
    return failure();
  if (
    !s.campaign.revisions.every(
      (r) =>
        validDay(r.weeklyEffectiveFrom) &&
        r.goals.every(
          (g) => g.id !== "strength" || validWeeklyTarget(g.weeklyTarget),
        ),
    )
  )
    return failure();
  if (
    !s.entries.every((e) =>
      e.rewardGrant === null
        ? e.reward.renown === 0 &&
          Object.values(e.reward.xp).every((n) => n === 0)
        : object(e.rewardGrant) &&
          typeof e.rewardGrant.id === "string" &&
          e.rewardGrant.id.length > 0 &&
          e.rewardGrant.activityId === e.activityId &&
          e.rewardGrant.goalId === e.goalId &&
          object(e.rewardGrant.period) &&
          e.rewardGrant.period.kind === "day" &&
          e.rewardGrant.period.start === e.date,
    )
  )
    return failure();
  if (
    !unique(
      s.entries
        .filter((e) => e.rewardGrant !== null)
        .map((e) => e.rewardGrant!.id),
    )
  )
    return failure();
  const cs = s.weekly.commissions;
  if (
    !cs.every(
      (c) =>
        object(c) &&
        typeof c.id === "string" &&
        c.id === `week:${c.period?.start}:${c.goalId}` &&
        goalIds.includes(c.goalId) &&
        !["weight", "temperance"].includes(c.goalId) &&
        object(c.period) &&
        c.period.kind === "week" &&
        validDay(c.period.start) &&
        validDay(c.period.end) &&
        Number.isInteger(c.period.weekStartsOn) &&
        c.period.weekStartsOn >= 0 &&
        c.period.weekStartsOn <= 6 &&
        weekStart(c.period.start, c.period.weekStartsOn) === c.period.start &&
        addDays(c.period.start, 6) === c.period.end &&
        validWeeklyTarget(c.target) &&
        Array.isArray(c.activityIds) &&
        c.activityIds.every(
          (id) =>
            typeof id === "string" &&
            s.entries.some(
              (e) =>
                e.activityId === id &&
                e.goalId === c.goalId &&
                e.date >= c.period.start &&
                e.date <= c.period.end &&
                e.date >= s.weekly.trackingSince,
            ),
        ),
    )
  )
    return failure();
  if (!unique(cs.map((c) => c.id)) || !unique(cs.flatMap((c) => c.activityIds)))
    return failure();
  for (const c of cs) {
    if(c.bonus!==undefined && (!object(c.bonus)||c.bonus.id!==`bonus:${c.id}`||c.goalId!=='strength'||!reward(c.bonus.reward)||!c.activityIds.includes(c.bonus.activityId)||c.activityIds.indexOf(c.bonus.activityId)<c.target.value-1))return failure();
    const activities = s.entries.filter(
      (e) =>
        e.goalId === c.goalId &&
        e.date >= c.period.start &&
        e.date <= c.period.end &&
        e.date >= s.weekly.trackingSince,
    );
    if (
      !unique(activities.map((e) => e.date)) ||
      activities.length !== c.activityIds.length ||
      activities.some((e) => !c.activityIds.includes(e.activityId))
    )
      return failure();
    if (
      cs.some(
        (other) =>
          other.id !== c.id &&
          other.goalId === c.goalId &&
          other.period.start <= c.period.end &&
          other.period.end >= c.period.start,
      )
    )
      return failure();
  }
  return s;
}
function addWeeklyModel(source: unknown, date: string): V3State {
  const s = validateBaseV3(source);
  if (!validDay(date)) return failure();
  const start = weekStart(date);
  const next = {
    ...structuredClone(s),
    campaign: {
      revisions: s.campaign.revisions.map((r) => ({
        ...structuredClone(r),
        weeklyEffectiveFrom: start,
        goals: r.goals.map((g) =>
          g.id === "strength"
            ? {
                ...structuredClone(g),
                weeklyTarget: {
                  metric: "sessions" as const,
                  value: campaignRules.trainingSessions.defaultValue,
                },
              }
            : structuredClone(g),
        ),
      })),
    },
    entries: s.entries.map((e) => ({
      ...structuredClone(e),
      rewardGrant: {
        id: `award:${e.activityId}`,
        activityId: e.activityId,
        goalId: e.goalId,
        period: { kind: "day" as const, start: e.date },
      },
    })),
    weekly: {
      weekStartsOn: campaignRules.weekStartsOn,
      trackingSince: start < s.created ? s.created : start,
      commissions: [],
    },
  };
  const ready = ensureWeeklyPeriod({ ...next, version: 7, living: createLiving(), ventures: [], world: createWorld(date) }, date);
  const { ventures: _ventures, world: _world, living: _living, ...legacy } = ready;
  return validateV3({ ...legacy, version: 3 });
}
function validateV2(s: unknown) {
  if (
    !base(s) ||
    s.version !== 2 ||
    !s.entries.every(
      (e) =>
        object(e) &&
        validDay(e.date) &&
        typeof e.questId === "string" &&
        e.questId !== "oath" &&
        reward(e.reward) &&
        number(e.distance),
    ) ||
    !unique(s.entries.map((e) => `${e.date}:${e.questId}`)) ||
    !validOaths(s.oaths)
  )
    return failure();
  return s;
}
function v1ToV2(s: unknown) {
  if (
    !base(s) ||
    s.version !== 1 ||
    !s.entries.every(
      (e) =>
        object(e) &&
        validDay(e.date) &&
        typeof e.questId === "string" &&
        attributes.includes(e.attribute) &&
        number(e.points) &&
        number(e.renown) &&
        number(e.distance),
    ) ||
    !unique(s.entries.map((e) => `${e.date}:${e.questId}`)) ||
    !Object.entries(s.oaths).every(
      ([d, o]) => validDay(d) && typeof o === "boolean",
    )
  )
    return failure();
  const convert = (e: ObjectValue) => ({
    date: e.date,
    questId: e.questId,
    reward: { renown: e.renown, xp: { [e.attribute]: e.points } },
    distance: e.distance,
  });
  const oaths: Record<string, unknown> = {};
  for (const [date, kept] of Object.entries(s.oaths)) {
    const earned = s.entries.find(
      (e) => e.questId === "oath" && e.date === date,
    );
    if (kept && !earned) return failure();
    oaths[date] = {
      status: kept ? "kept" : "broken",
      reward: kept ? convert(earned!).reward : null,
    };
  }
  if (s.entries.some((e) => e.questId === "oath" && !(e.date in s.oaths)))
    return failure();
  return validateV2({
    version: 2,
    name: s.name,
    created: s.created,
    entries: s.entries.filter((e) => e.questId !== "oath").map(convert),
    oaths,
  });
}
function migrateV3(source: unknown, date = dayKey()): V3State {
  if (!object(source) || source.ventures !== undefined) return failure();
  if (source.version === 3) {
    if (source.weekly !== undefined) return validateV3(source);
    // A partial newer schema must not masquerade as an old save.
    if (
      source.entries?.some((e: ObjectValue) => e.rewardGrant !== undefined) ||
      source.campaign?.revisions?.some(
        (r: ObjectValue) => r.weeklyEffectiveFrom !== undefined,
      )
    )
      return failure();
    return addWeeklyModel(source, date);
  }
  const old = source.version === 1 ? v1ToV2(source) : validateV2(source);
  const entries: Entry[] = old.entries.map((e) => {
    const template = quests.find((q) => q.id === e.questId);
    return {
      ...structuredClone(e),
      id: `legacy:${e.date}:${e.questId}`,
      activityId: `legacy-activity:${e.date}:${e.questId}`,
      goalId: template?.goalId || null,
      period: { kind: "day", start: e.date },
      deed: {
        name: template?.name || e.questId,
        description:
          e.distance > 0
            ? `${e.distance} km recorded · original target not stored`
            : "Original target not stored",
        timing: template?.timing || null,
        target: null,
      },
    } as Entry;
  });
  return addWeeklyModel(
    {
      version: 3,
      name: old.name,
      created: old.created,
      entries,
      oaths: structuredClone(old.oaths),
      campaign: createCampaign(old.created, defaultGoals().filter(g=>g.id!=="chore")),
      weight: {
        settings: { displayUnit: "kg", baseline: null, targetGrams: null },
        measurements: [],
      },
      migratedFrom: source.version,
    },
    date,
  );
}
function validateV4(source: unknown): V4State {
  if (!object(source) || source.version !== 4) return failure();
  const existing = validateV3({ ...source, version: 3 });
  if (!validVentureHistory(source.ventures, source.created)) return failure();
  const receipts = [...existing.entries.filter(e => e.rewardGrant).map(e => e.rewardGrant!.id),
    ...source.ventures.filter(v => v.rewardGrant).map(v => v.rewardGrant!.id),
    ...existing.weekly.commissions.filter(c => c.bonus).map(c => c.bonus!.id)];
  if (!unique(receipts)) return failure();
  return source as V4State;
}
function validateV5(source: unknown) {
  if (!object(source) || source.version !== 5 || !validWorld(source.world, source.created)) return failure();
  validateV4({ ...source, version: 4 });
  return source;
}
function validateV6(source: unknown) {
  if (!object(source) || source.version !== 6 || !validLiving(source.living, source.created)) return failure();
  validateV5({ ...source, version: 5 });
  return source;
}
export function validate(source: unknown): State {
  if (!object(source) || source.version !== 7) return failure();
  validateV6({ ...source, version: 6 });
  return source as State;
}
function addChore(state:State,date:string):State {
 const last=state.campaign.revisions.at(-1)!;
 if(last.goals.some(g=>g.id==='chore'))return state;
 return configureCampaign(state,[...last.goals,{id:'chore',active:true,target:structuredClone(goalDefinitions.chore.defaultTarget)}],date<last.effectiveDate?last.effectiveDate:date);
}
export function migrate(source: unknown, date = dayKey()): State {
  if (object(source) && source.version === 7) return validate(source);
  if (!object(source) || !validDay(date)) return failure();
  if (source.version === 6) return validate(addChore({...validateV6(source),version:7} as State,date));
  if (source.version === 5) return validate(addChore({ ...validateV5(source), version: 7, living: createLiving() } as State,date));
  if (source.world !== undefined) return failure();
  const old = source.version === 4 ? validateV4(source) : { ...migrateV3(source, date), version: 4, ventures: [] };
  return validate(addChore({ ...old, version: 7, living: createLiving(), world: createWorld(date < old.created ? old.created : date) },date));
}
export function load(
  store: Store = localStorage,
  date = dayKey(),
): State | null {
  const v7 = store.getItem(storageKeys.current);
  const current = v7 ?? store.getItem(storageKeys.v6) ?? store.getItem(storageKeys.v5) ?? store.getItem(storageKeys.v4) ?? store.getItem(storageKeys.v3);
  if (current !== null) {
    const source = JSON.parse(current);
    const migrated = migrate(source, date);
    const next = validate(ensureWeeklyPeriod(migrated, date));
    if (
      source.weekly === undefined &&
      store.getItem(storageKeys.weeklyBackup) === null
    )
      store.setItem(storageKeys.weeklyBackup, current);
    if (source.version === 3 && store.getItem(storageKeys.ventureBackup) === null)
      store.setItem(storageKeys.ventureBackup, current);
    if (source.version === 4 && store.getItem(storageKeys.worldBackup) === null)
      store.setItem(storageKeys.worldBackup, current);
    if (source.version === 5 && store.getItem(storageKeys.livingBackup) === null)
      store.setItem(storageKeys.livingBackup, current);
    if (source.version === 6 && store.getItem(storageKeys.choreBackup) === null)
      store.setItem(storageKeys.choreBackup, current);
    if (v7 === null || source.version !== 7 || source.weekly === undefined || next !== migrated)
      store.setItem(storageKeys.current, JSON.stringify(next));
    return next;
  }
  // An invalid newer source must never silently fall back to older history.
  const v2 = store.getItem(storageKeys.previous),
    source = v2 ?? store.getItem(storageKeys.legacy);
  if (source === null) return null;
  const next = migrate(JSON.parse(source), date);
  const backupKey =
    v2 !== null ? storageKeys.previousBackup : storageKeys.backup;
  if (store.getItem(backupKey) === null) store.setItem(backupKey, source);
  store.setItem(storageKeys.current, JSON.stringify(next));
  return next;
}
export function save(state: State, store: Store = localStorage) {
  store.setItem(storageKeys.current, JSON.stringify(validate(state)));
}
