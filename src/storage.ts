import {
  attributes,
  validDay,
  type State,
  type Reward,
  type Entry,
} from "./domain";
export const storageKeys = {
  current: "oathbound.knight.v2",
  legacy: "oathbound.knight.v1",
  backup: "oathbound.knight.v1.backup",
};
type Store = Pick<Storage, "getItem" | "setItem">;
const failure = () => {
  throw new Error(
    "Saved chronicle cannot be read. Original data has been left untouched.",
  );
};
const object = (v: unknown): v is Record<string, any> =>
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
function base(
  s: unknown,
): s is Record<string, any> & {
  entries: Record<string, any>[];
  oaths: Record<string, any>;
} {
  return (
    object(s) &&
    typeof s.name === "string" &&
    s.name.trim().length > 0 &&
    typeof s.created === "string" &&
    validDay(s.created) &&
    Array.isArray(s.entries) &&
    object(s.oaths)
  );
}
function unique(entries: Record<string, any>[]) {
  return (
    new Set(entries.map((e) => `${e.date}:${e.questId}`)).size ===
    entries.length
  );
}
export function validate(s: unknown): State {
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
    !unique(s.entries)
  )
    return failure();
  if (
    !Object.entries(s.oaths).every(
      ([date, o]) =>
        validDay(date) &&
        object(o) &&
        ["taken", "kept", "broken"].includes(o.status) &&
        (o.status === "kept" ? reward(o.reward) : o.reward === null),
    )
  )
    return failure();
  return s as State;
}
export function migrate(s: unknown): State {
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
    !unique(s.entries) ||
    !Object.entries(s.oaths).every(
      ([date, o]) => validDay(date) && typeof o === "boolean",
    )
  )
    return failure();
  const convert = (e: Record<string, any>): Entry => ({
    date: e.date,
    questId: e.questId,
    reward: { renown: e.renown, xp: { [e.attribute]: e.points } },
    distance: e.distance,
  });
  const next: State = {
    version: 2,
    name: s.name,
    created: s.created,
    entries: s.entries.filter((e) => e.questId !== "oath").map(convert),
    oaths: {},
    migratedFrom: 1,
  };
  for (const [date, kept] of Object.entries(s.oaths)) {
    const earned = s.entries.find(
      (e) => e.questId === "oath" && e.date === date,
    );
    if (kept && !earned) return failure(); // Do not invent historical rewards.
    next.oaths[date] = {
      status: kept ? "kept" : "broken",
      reward: kept ? convert(earned!).reward : null,
    };
  }
  // A rewarded legacy oath without a status is inconsistent; preserve the save for diagnosis.
  if (s.entries.some((e) => e.questId === "oath" && !(e.date in s.oaths)))
    return failure();
  return validate(next);
}
export function load(store: Store = localStorage): State | null {
  const current = store.getItem(storageKeys.current);
  if (current !== null) return validate(JSON.parse(current));
  const legacy = store.getItem(storageKeys.legacy);
  if (legacy === null) return null;
  const next = migrate(JSON.parse(legacy));
  if (store.getItem(storageKeys.backup) === null)
    store.setItem(storageKeys.backup, legacy);
  store.setItem(storageKeys.current, JSON.stringify(next));
  return next;
}
export function save(state: State, store: Store = localStorage) {
  store.setItem(storageKeys.current, JSON.stringify(validate(state)));
}
