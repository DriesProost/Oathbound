import { kgToGrams, gramsToKgInput, weightUiRules } from "./weight";
import { validDay } from "./calendar";
import { bodyBuilds, type BodyBuild, type WeightSettings } from "./model";
export type WeightSettingsDraft = {
  baselineDate: string;
  baselineKg: string;
  targetKg: string;
  appearanceEnabled: boolean;
  startingBuild: BodyBuild;
  targetBuild: BodyBuild;
};
export function weightSettingsDraft(
  settings: WeightSettings,
  today: string,
): WeightSettingsDraft {
  return {
    appearanceEnabled: settings.appearance?.enabled || false,
    startingBuild: settings.appearance?.startingBuild || "large",
    targetBuild: settings.appearance?.targetBuild || "lean",
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
    ...(draft.appearanceEnabled || previous.appearance ? {appearance: {
      enabled: draft.appearanceEnabled,
      startingBuild: draft.startingBuild,
      targetBuild: draft.targetBuild,
    }} : {}),
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
      <fieldset className="weight-appearance-settings">
        <legend>Optional character appearance</legend>
        <label className="weight-appearance-choice">
          <input type="checkbox" checked={draft.appearanceEnabled}
            onChange={(e) => onChange({...draft, appearanceEnabled: e.target.checked})} />
          Let my knight’s build follow this weight plan
        </label>
        {draft.appearanceEnabled && <>
          <label htmlFor={prefix + "-starting-build"}>Starting build</label>
          <select id={prefix + "-starting-build"} value={draft.startingBuild}
            onChange={(e) => onChange({...draft, startingBuild: e.target.value as BodyBuild})}>
            {bodyBuilds.map(build => <option key={build} value={build}>{build === "large" ? "Larger" : build === "sturdy" ? "Sturdy" : "Lean"}</option>)}
          </select>
          <label htmlFor={prefix + "-target-build"}>Desired build</label>
          <select id={prefix + "-target-build"} value={draft.targetBuild}
            onChange={(e) => onChange({...draft, targetBuild: e.target.value as BodyBuild})}>
            {bodyBuilds.map(build => <option key={build} value={build}>{build === "large" ? "Larger" : build === "sturdy" ? "Sturdy" : "Lean"}</option>)}
          </select>
          <p className="target-help">A personal illustration, not a prediction of your body. Add an explicit starting weight and target when ready. Build changes use the recorded seven-day trend, with at least three measurements in a window. Reached visual stages remain through later fluctuations. You can turn this off at any time.</p>
        </>}
        <p className="target-help">Appearance only · no Renown or XP. Grooming follows Presence; muscle follows Strength. Weight measurements never change your rank or armour.</p>
      </fieldset>
      <p className="target-help">
        Targets may be above or below your starting weight. Leave a weight blank
        to keep it unset. Changes do not rewrite measurements.
      </p>
    </div>
  );
}
