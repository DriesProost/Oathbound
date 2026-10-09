import { kgToGrams, gramsToKgInput, weightUiRules } from "./weight";
import { validDay } from "./calendar";
import type { WeightSettings } from "./model";
export type WeightSettingsDraft = {
  baselineDate: string;
  baselineKg: string;
  targetKg: string;
};
export function weightSettingsDraft(
  settings: WeightSettings,
  today: string,
): WeightSettingsDraft {
  return {
    baselineDate: settings.baseline?.date || today,
    baselineKg: settings.baseline
      ? gramsToKgInput(settings.baseline.grams)
      : "",
    targetKg:
      settings.targetGrams !== null ? gramsToKgInput(settings.targetGrams) : "",
  };
}
export function parseKgEntry(value: string): number {
  const grams = kgToGrams(value);
  if (grams < weightUiRules.minGrams || grams > weightUiRules.maxGrams)
    throw Error("Check the units: enter a weight between 0.1 and 1,000 kg.");
  return grams;
}
export function parseWeightSettingsDraft(
  draft: WeightSettingsDraft,
  previous: WeightSettings,
  today: string,
): WeightSettings {
  const baseline = draft.baselineKg.trim()
    ? { date: draft.baselineDate, grams: parseKgEntry(draft.baselineKg) }
    : null;
  if (baseline && (!validDay(baseline.date) || baseline.date > today))
    throw Error("Choose a valid starting date on or before today.");
  return {
    ...previous,
    baseline,
    targetGrams: draft.targetKg.trim() ? parseKgEntry(draft.targetKg) : null,
  };
}
export function WeightSettingsFields({
  draft,
  onChange,
  today,
  prefix = "weight-settings",
}: {
  draft: WeightSettingsDraft;
  onChange: (draft: WeightSettingsDraft) => void;
  today: string;
  prefix?: string;
}) {
  return (
    <div className="weight-settings-fields">
      <div>
        <label htmlFor={prefix + "-baseline"}>
          Starting weight (kg, optional)
        </label>
        <input
          id={prefix + "-baseline"}
          type="text"
          inputMode="decimal"
          value={draft.baselineKg}
          placeholder="e.g. 90"
          onChange={(e) => onChange({ ...draft, baselineKg: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor={prefix + "-date"}>Starting date</label>
        <input
          id={prefix + "-date"}
          type="date"
          max={today}
          required={!!draft.baselineKg.trim()}
          value={draft.baselineDate}
          onChange={(e) => onChange({ ...draft, baselineDate: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor={prefix + "-target"}>Target weight (kg, optional)</label>
        <input
          id={prefix + "-target"}
          type="text"
          inputMode="decimal"
          value={draft.targetKg}
          placeholder="Leave blank without a target"
          onChange={(e) => onChange({ ...draft, targetKg: e.target.value })}
        />
      </div>
      <p className="target-help">
        Targets may be above or below your starting weight. Leave a weight blank
        to keep it unset. Changes do not rewrite measurements.
      </p>
    </div>
  );
}
