import { addDays, dayKey, validDay } from "./calendar";
import type { State, WeighIn, WeightSettings } from "./model";
// These limits guide entry forms only. The outcome domain accepts every positive safe gram value.
export const weightUiRules = { minGrams: 100, maxGrams: 1_000_000 };
export function positiveGrams(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
export function kgToGrams(input: string): number {
  const value = input.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{0,3})?$/.test(value))
    throw Error("Enter kilograms with up to three decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const grams = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));
  if (grams <= 0n || grams > BigInt(Number.MAX_SAFE_INTEGER))
    throw Error("Enter a positive weight that can be stored safely.");
  return Number(grams);
}
export function gramsToKgInput(grams: number): string {
  if (!positiveGrams(grams)) throw Error("Invalid weight.");
  const fraction = String(grams % 1000)
    .padStart(3, "0")
    .replace(/0+$/, "");
  return `${(BigInt(grams) / 1000n).toString()}${fraction ? "." + fraction : ""}`;
}
export function formatKg(grams: number) {
  return `${(grams / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} kg`;
}
export function signedKg(grams: number) {
  return `${grams > 0 ? "+" : grams < 0 ? "−" : ""}${formatKg(Math.abs(grams))}`;
}
function object(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function validWeightSettings(value: unknown): value is WeightSettings {
  return (
    object(value) &&
    ["kg", "lb"].includes(value.displayUnit) &&
    (value.baseline === null ||
      (object(value.baseline) &&
        validDay(value.baseline.date) &&
        positiveGrams(value.baseline.grams))) &&
    (value.targetGrams === null || positiveGrams(value.targetGrams))
  );
}
export function validWeightData(value: unknown): value is State["weight"] {
  return (
    object(value) &&
    validWeightSettings(value.settings) &&
    Array.isArray(value.measurements) &&
    value.measurements.every(
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
    new Set(value.measurements.map((m: WeighIn) => m.id)).size ===
      value.measurements.length &&
    new Set(value.measurements.map((m: WeighIn) => m.date)).size ===
      value.measurements.length
  );
}
export function orderedMeasurements(measurements: WeighIn[]): WeighIn[] {
  return measurements.toSorted((a, b) => a.date.localeCompare(b.date));
}
function checkMeasurement(date: string, grams: number, now: Date) {
  if (
    !Number.isFinite(now.getTime()) ||
    !validDay(date) ||
    date > dayKey(now) ||
    !positiveGrams(grams)
  )
    throw Error("Enter a valid past or current date and positive weight.");
}
export class WeightDateConflict extends Error {
  constructor(public measurement: WeighIn) {
    super(
      "A measurement already exists on this date. Confirmation is needed to replace it.",
    );
  }
}
function updatedMeasurement(
  old: WeighIn,
  date: string,
  grams: number,
  now: Date,
): WeighIn {
  return {
    ...old,
    date,
    grams,
    updatedAt: new Date(
      Math.max(
        now.getTime(),
        Date.parse(old.createdAt),
        Date.parse(old.updatedAt),
      ),
    ).toISOString(),
  };
}
export function addWeighIn(
  state: State,
  date: string,
  grams: number,
  options: { now?: Date; id?: string; replaceId?: string } = {},
): State {
  const now = options.now || new Date();
  checkMeasurement(date, grams, now);
  const existing = state.weight.measurements.find((m) => m.date === date);
  if (existing && options.replaceId !== existing.id)
    throw new WeightDateConflict(existing);
  if (options.replaceId && (!existing || options.replaceId !== existing.id))
    throw Error(
      "That measurement changed. Review the current entry before replacing it.",
    );
  if (existing && existing.grams === grams) return state;
  const id =
    existing?.id ||
    options.id ||
    (crypto.randomUUID
      ? crypto.randomUUID()
      : `weight:${Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16)).join("-")}`);
  if (
    !existing &&
    (typeof id !== "string" ||
      !id ||
      state.weight.measurements.some((m) => m.id === id))
  )
    throw Error("Measurement ID must be unique.");
  const measurement = existing
    ? updatedMeasurement(existing, date, grams, now)
    : {
        id,
        date,
        grams,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
  return {
    ...state,
    weight: {
      ...state.weight,
      measurements: orderedMeasurements([
        ...state.weight.measurements.filter((m) => m.id !== measurement.id),
        measurement,
      ]),
    },
  };
}
export function editWeighIn(
  state: State,
  id: string,
  date: string,
  grams: number,
  now = new Date(),
): State {
  checkMeasurement(date, grams, now);
  const existing = state.weight.measurements.find((m) => m.id === id);
  if (!existing) throw Error("That measurement is no longer available.");
  const occupied = state.weight.measurements.find(
    (m) => m.date === date && m.id !== id,
  );
  if (occupied) throw new WeightDateConflict(occupied);
  if (existing.date === date && existing.grams === grams) return state;
  return {
    ...state,
    weight: {
      ...state.weight,
      measurements: orderedMeasurements(
        state.weight.measurements.map((m) =>
          m.id === id ? updatedMeasurement(m, date, grams, now) : m,
        ),
      ),
    },
  };
}
export function deleteWeighIn(state: State, id: string): State {
  if (!state.weight.measurements.some((m) => m.id === id)) return state;
  return {
    ...state,
    weight: {
      ...state.weight,
      measurements: state.weight.measurements.filter((m) => m.id !== id),
    },
  };
}
export function setWeightSettings(
  state: State,
  settings: WeightSettings,
): State {
  if (!validWeightSettings(settings))
    throw Error("Check your starting date and weight settings.");
  if (JSON.stringify(state.weight.settings) === JSON.stringify(settings))
    return state;
  return {
    ...state,
    weight: { ...state.weight, settings: structuredClone(settings) },
  };
}
export function useWeighInAsBaseline(state: State, id: string): State {
  const measurement = state.weight.measurements.find((m) => m.id === id);
  if (!measurement) throw Error("That measurement is no longer available.");
  return setWeightSettings(state, {
    ...state.weight.settings,
    baseline: { date: measurement.date, grams: measurement.grams },
  });
}
export function weightSummary(weight: State["weight"]) {
  const latest = orderedMeasurements(weight.measurements).at(-1) || null;
  const { baseline, targetGrams } = weight.settings;
  const relevant = latest && baseline && latest.date >= baseline.date;
  const changeGrams = relevant ? latest.grams - baseline.grams : null;
  const distanceGrams =
    latest && targetGrams !== null
      ? Math.abs(latest.grams - targetGrams)
      : null;
  const span =
    baseline && targetGrams !== null ? targetGrams - baseline.grams : null;
  const rawProgress =
    changeGrams !== null && span !== null && span !== 0
      ? changeGrams / span
      : null;
  return {
    latest,
    changeGrams,
    distanceGrams,
    rawProgress,
    progress:
      rawProgress === null ? null : Math.max(0, Math.min(1, rawProgress)),
  };
}
export type WeightTrendPoint = {
  date: string;
  meanGrams: number;
  count: number;
};
export function weightTrend(measurements: WeighIn[]): WeightTrendPoint[] {
  const ordered = orderedMeasurements(measurements);
  return ordered.flatMap((m) => {
    const start = addDays(m.date, -6),
      window = ordered.filter((p) => p.date >= start && p.date <= m.date);
    return window.length >= 3
      ? [
          {
            date: m.date,
            meanGrams:
              window.reduce((sum, p) => sum + p.grams, 0) / window.length,
            count: window.length,
          },
        ]
      : [];
  });
}
