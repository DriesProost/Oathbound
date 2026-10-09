import { attributes, quests, type Reward } from "./config";
import { validDay } from "./calendar";
import { createCampaign, validGoals, validTarget } from "./campaign";
import { goalIds, type State, type Entry } from "./model";
export const storageKeys = {
  current: "oathbound.knight.v3",
  previous: "oathbound.knight.v2",
  legacy: "oathbound.knight.v1",
  backup: "oathbound.knight.v1.backup",
  previousBackup: "oathbound.knight.v2.backup",
};
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
const positiveGrams = (v: unknown) =>
  number(v) && Number.isSafeInteger(v) && v > 0;
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
function base(
  s: unknown,
): s is ObjectValue & {
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
function validWeight(w: unknown) {
  if (
    !object(w) ||
    !object(w.settings) ||
    !["kg", "lb"].includes(w.settings.displayUnit) ||
    !Array.isArray(w.measurements)
  )
    return false;
  const s = w.settings;
  return (
    (s.baseline === null ||
      (object(s.baseline) &&
        validDay(s.baseline.date) &&
        positiveGrams(s.baseline.grams))) &&
    (s.targetGrams === null || positiveGrams(s.targetGrams)) &&
    w.measurements.every(
      (m: unknown) =>
        object(m) &&
        typeof m.id === "string" &&
        m.id.length > 0 &&
        validDay(m.date) &&
        positiveGrams(m.grams) &&
        typeof m.createdAt === "string" &&
        Number.isFinite(Date.parse(m.createdAt)) &&
        typeof m.updatedAt === "string" &&
        Number.isFinite(Date.parse(m.updatedAt)),
    ) &&
    unique(w.measurements.map((m: ObjectValue) => m.id)) &&
    unique(w.measurements.map((m: ObjectValue) => m.date))
  );
}
export function validate(s: unknown): State {
  if (
    !base(s) ||
    s.version !== 3 ||
    !validCampaign(s.campaign, s.created) ||
    !validOaths(s.oaths) ||
    !validWeight(s.weight)
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
  return s as State;
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
export function migrate(source: unknown): State {
  if (!object(source)) return failure();
  if (source.version === 3) return validate(source);
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
  return validate({
    version: 3,
    name: old.name,
    created: old.created,
    entries,
    oaths: structuredClone(old.oaths),
    campaign: createCampaign(old.created),
    weight: {
      settings: { displayUnit: "kg", baseline: null, targetGrams: null },
      measurements: [],
    },
    migratedFrom: source.version,
  });
}
export function load(store: Store = localStorage): State | null {
  const current = store.getItem(storageKeys.current);
  if (current !== null) return validate(JSON.parse(current));
  // An invalid newer source must never silently fall back to older history.
  const v2 = store.getItem(storageKeys.previous),
    source = v2 ?? store.getItem(storageKeys.legacy);
  if (source === null) return null;
  const next = migrate(JSON.parse(source));
  const backupKey =
    v2 !== null ? storageKeys.previousBackup : storageKeys.backup;
  if (store.getItem(backupKey) === null) store.setItem(backupKey, source);
  store.setItem(storageKeys.current, JSON.stringify(next));
  return next;
}
export function save(state: State, store: Store = localStorage) {
  store.setItem(storageKeys.current, JSON.stringify(validate(state)));
}
