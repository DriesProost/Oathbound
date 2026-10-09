import { useFeedback } from "./feedback/Feedback";
import { useEffect, useState } from "react";
import { Scale, Pencil, Trash2, Settings2 } from "lucide-react";
import { goalActive } from "./campaign";
import { formatDay } from "./presentation";
import {
  addWeighIn,
  editWeighIn,
  deleteWeighIn,
  setWeightSettings,
  useWeighInAsBaseline,
  WeightDateConflict,
  formatKg,
  signedKg,
  gramsToKgInput,
  orderedMeasurements,
  weightSummary,
  weightTrend,
} from "./weight";
import {
  WeightSettingsFields,
  weightSettingsDraft,
  parseWeightSettingsDraft,
  parseKgEntry,
} from "./WeightSettingsFields";
import WeightChart from "./WeightChart";
import type { State, WeighIn } from "./model";
import "./weight.css";
type Pending =
  | { kind: "replace"; date: string; grams: number; existing: WeighIn }
  | { kind: "delete"; measurement: WeighIn };
export default function WeightChronicle({
  state,
  today,
  update,
  configure,
}: {
  state: State;
  today: string;
  update: (next: State) => boolean;
  configure: () => void;
}) {
  const active = goalActive(state, "weight", today),
    { settings, measurements } = state.weight;
  const [date, setDate] = useState(today),
    [kg, setKg] = useState(""),
    [editing, setEditing] = useState<string | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [pending, setPending] = useState<Pending | null>(null),
    [baselineOffer, setBaselineOffer] = useState<string | null>(null),
    [settingsOpen, setSettingsOpen] = useState(false),
    [draft, setDraft] = useState(() => weightSettingsDraft(settings, today));
  const [entryDay, setEntryDay] = useState(today);
  // A clean add form follows the local day; an in-progress entry keeps its chosen date.
  useEffect(() => {
    if (entryDay === today) return;
    if (!editing && !kg && !pending && date === entryDay) setDate(today);
    setEntryDay(today);
  }, [today, entryDay, editing, kg, pending, date]);
  useEffect(() => {
    if (pending) {
      const confirmation = document.getElementById("weight-confirmation");
      confirmation?.scrollIntoView({ block: "center" });
      confirmation?.focus();
    }
  }, [pending]);
  const summary = weightSummary(state.weight),
    ordered = orderedMeasurements(measurements),
    trend = weightTrend(measurements),
    latestAverage =
      trend.at(-1)?.date === summary.latest?.date ? trend.at(-1) : null;
  const offered =
    baselineOffer && !settings.baseline
      ? measurements.find((m) => m.id === baselineOffer)
      : null;
  const feedback = useFeedback();
  function commit(next: State, text: string) {
    if (update(next)) {
      if (next.weight.measurements !== state.weight.measurements)
        feedback.quiet();
      setError("");
      setMessage(text);
      return true;
    }
    setError("This change could not be saved. Your previous records remain.");
    return false;
  }
  function resetForm() {
    setDate(today);
    setKg("");
    setEditing(null);
    setPending(null);
    setError("");
  }
  function submit() {
    try {
      const grams = parseKgEntry(kg);
      const next = editing
        ? editWeighIn(state, editing, date, grams)
        : addWeighIn(state, date, grams);
      if (
        commit(next, editing ? "Measurement updated." : "Measurement recorded.")
      ) {
        if (!editing && !measurements.length && !settings.baseline)
          setBaselineOffer(
            next.weight.measurements.find((m) => m.date === date)!.id,
          );
        resetForm();
      }
    } catch (e) {
      if (e instanceof WeightDateConflict && !editing) {
        setPending({
          kind: "replace",
          date,
          grams: parseKgEntry(kg),
          existing: e.measurement,
        });
        setError("");
      } else
        setError(
          e instanceof WeightDateConflict
            ? "Another entry already uses that date. Choose a different date, or edit that entry."
            : e instanceof Error
              ? e.message
              : "Check your entry.",
        );
    }
  }
  function confirmPending() {
    if (!pending) return;
    try {
      const next =
        pending.kind === "delete"
          ? deleteWeighIn(state, pending.measurement.id)
          : addWeighIn(state, pending.date, pending.grams, {
              replaceId: pending.existing.id,
            });
      if (
        commit(
          next,
          pending.kind === "delete"
            ? "Measurement deleted. Starting weight and target remain separate settings."
            : "Measurement replaced.",
        )
      ) {
        if (pending.kind === "delete" && editing === pending.measurement.id)
          resetForm();
        setPending(null);
        if (pending.kind === "replace") resetForm();
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "This entry could not be changed.",
      );
    }
  }
  const content = (
    <>
      <div className="weight-statistics">
        <div>
          <span>Latest recorded weight</span>
          <strong>
            {summary.latest ? formatKg(summary.latest.grams) : "—"}
          </strong>
          <small>
            {summary.latest
              ? formatDay(summary.latest.date, true)
              : "No measurements yet"}
          </small>
        </div>
        <div>
          <span>Change since starting weight</span>
          <strong>
            {summary.changeGrams !== null ? signedKg(summary.changeGrams) : "—"}
          </strong>
          <small>
            {settings.baseline
              ? `${formatKg(settings.baseline.grams)} · ${formatDay(settings.baseline.date)}`
              : "Starting weight is optional"}
          </small>
        </div>
        <div>
          <span>Target weight</span>
          <strong>
            {settings.targetGrams !== null
              ? formatKg(settings.targetGrams)
              : "—"}
          </strong>
          <small>
            {summary.distanceGrams !== null
              ? `${formatKg(summary.distanceGrams)} from target`
              : "A target is optional"}
          </small>
        </div>
      </div>
      {summary.progress !== null && (
        <div className="weight-target-progress">
          <div>
            <span>Baseline-to-target span</span>
            <span>
              {Math.round(summary.progress * 100)}% of the measured change
            </span>
          </div>
          <div
            className="weight-span"
            role="progressbar"
            aria-label="Measured change across baseline-to-target span"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(summary.progress * 100)}
          >
            <i style={{ width: `${summary.progress * 100}%` }} />
          </div>
        </div>
      )}
      {settings.baseline &&
        settings.targetGrams === settings.baseline.grams && (
          <p className="target-help">
            Starting and target weights are equal. The ledger shows distance
            from target.
          </p>
        )}
      {settings.baseline && summary.latest && summary.changeGrams === null && (
        <p className="target-help">
          Change is shown once a measurement is dated on or after your starting
          date.
        </p>
      )}
      <WeightChart measurements={measurements} />
      {latestAverage && (
        <p className="weight-average-summary">
          7-day average at {formatDay(latestAverage.date)}:{" "}
          <strong>{formatKg(latestAverage.meanGrams)}</strong> ·{" "}
          {latestAverage.count} actual measurements.
        </p>
      )}
      {active && (
        <>
          <form
            className="weight-entry-form"
            aria-label={
              editing ? "Edit weight measurement" : "Add weight measurement"
            }
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <h3>{editing ? "Amend a measurement" : "Record a measurement"}</h3>
            <div className="weight-entry-fields">
              <div>
                <label htmlFor="weigh-in-date">Measurement date</label>
                <input
                  id="weigh-in-date"
                  type="date"
                  max={today}
                  required
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setPending(null);
                  }}
                />
              </div>
              <div>
                <label htmlFor="weigh-in-kg">Weight (kg)</label>
                <input
                  id="weigh-in-kg"
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="e.g. 87.45"
                  value={kg}
                  onChange={(e) => {
                    setKg(e.target.value);
                    setPending(null);
                  }}
                />
              </div>
              <button className="primary" type="submit">
                {editing ? "Save measurement" : "Record weight"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="text-button"
                  onClick={resetForm}
                >
                  Cancel edit
                </button>
              )}
            </div>
            <p className="target-help">
              Enter up to three decimals without thousands separators. A
              measurement earns no Renown or XP.
              {editing &&
                " Starting weight is a separate setting; this edit will not change it."}
            </p>
          </form>
          {offered && (
            <section
              className="weight-baseline-offer"
              aria-label="Choose a starting weight"
            >
              <p>
                Your first entry is {formatKg(offered.grams)} on{" "}
                {formatDay(offered.date)}. Starting weight remains unset.
              </p>
              <button
                className="secondary"
                onClick={() => {
                  if (
                    commit(
                      useWeighInAsBaseline(state, offered.id),
                      "Starting weight set explicitly.",
                    )
                  ) {
                    setBaselineOffer(null);
                    setSettingsOpen(false);
                  }
                }}
              >
                Use this as my starting weight
              </button>
              <button
                className="text-button"
                onClick={() => setBaselineOffer(null)}
              >
                Keep baseline unset
              </button>
            </section>
          )}
          <button
            className="text-button weight-settings-toggle"
            aria-expanded={settingsOpen}
            onClick={() => {
              if (!settingsOpen) setDraft(weightSettingsDraft(settings, today));
              setSettingsOpen(!settingsOpen);
              setError("");
            }}
          >
            <Settings2 size={16} />
            {settingsOpen
              ? "Close weight settings"
              : "Starting weight & target"}
          </button>
          {settingsOpen && (
            <form
              className="weight-settings-form"
              aria-label="Weight settings"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  if (
                    commit(
                      setWeightSettings(
                        state,
                        parseWeightSettingsDraft(draft, settings, today),
                      ),
                      "Weight settings saved. Measurements remain unchanged.",
                    )
                  )
                    setSettingsOpen(false);
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Check your settings.",
                  );
                }
              }}
            >
              <WeightSettingsFields
                draft={draft}
                onChange={setDraft}
                today={today}
              />
              <button className="secondary" type="submit">
                Save weight settings
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => setSettingsOpen(false)}
              >
                Cancel settings
              </button>
            </form>
          )}
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="weight-feedback" role="status">
          {message}
        </p>
      )}
      {active && pending && (
        <section
          className="weight-confirmation"
          id="weight-confirmation"
          tabIndex={-1}
          aria-label={
            pending.kind === "replace"
              ? "Confirm measurement replacement"
              : "Confirm measurement deletion"
          }
        >
          <h3>
            {pending.kind === "replace"
              ? "An entry already bears this date."
              : "Remove this measurement?"}
          </h3>
          <p>
            {pending.kind === "replace"
              ? `${formatDay(pending.date, true)}: replace ${formatKg(pending.existing.grams)} with ${formatKg(pending.grams)}? The entry keeps its ID and original creation time.`
              : `${formatDay(pending.measurement.date, true)} · ${formatKg(pending.measurement.grams)}. Only this measurement will be removed. Starting weight, target and earned progress remain.`}
          </p>
          <button className="secondary" onClick={confirmPending}>
            {pending.kind === "replace"
              ? "Confirm replacement"
              : "Confirm deletion"}
          </button>
          <button
            className="text-button"
            onClick={() => {
              setPending(null);
              setError("");
            }}
          >
            Cancel
          </button>
        </section>
      )}
      {ordered.length > 0 && (
        <div className="weight-history">
          <h3>Dated measurements</h3>
          <ol>
            {ordered.toReversed().map((m) => (
              <li key={m.id}>
                <time dateTime={m.date}>{formatDay(m.date, true)}</time>
                <strong>{formatKg(m.grams)}</strong>
                {active && (
                  <div>
                    <button
                      className="text-button"
                      aria-label={`Edit weight on ${formatDay(m.date, true)}`}
                      onClick={() => {
                        setEditing(m.id);
                        setDate(m.date);
                        setKg(gramsToKgInput(m.grams));
                        setError("");
                        setMessage("");
                        setPending(null);
                        document
                          .getElementById("weigh-in-kg")
                          ?.scrollIntoView({ block: "center" });
                        document.getElementById("weigh-in-kg")?.focus();
                      }}
                    >
                      <Pencil size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      className="text-button"
                      aria-label={`Delete weight on ${formatDay(m.date, true)}`}
                      onClick={() => {
                        setPending({ kind: "delete", measurement: m });
                        setError("");
                        setMessage("");
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
  if (!active) {
    if (
      !measurements.length &&
      !settings.baseline &&
      settings.targetGrams === null &&
      !settings.appearance?.enabled
    )
      return null;
    return (
      <section className="panel weight-chronicle inactive-weight">
        <details>
          <summary>
            <Scale size={19} />
            Weight Chronicle · tracker paused
          </summary>
          <p className="muted">
            Measurements and settings are preserved. Re-enable Weight Management
            to add or edit entries.
          </p>
          {content}
          <button className="text-button" onClick={configure}>
            Configure campaign
          </button>
        </details>
      </section>
    );
  }
  return (
    <section className="panel weight-chronicle" aria-label="Weight Chronicle">
      <div className="section-heading">
        <div>
          <span className="eyebrow">A RECORD, NOT A REWARD</span>
          <h2>Weight Chronicle</h2>
        </div>
        <Scale size={23} />
      </div>
      <p className="muted">
        The Chronicle records where your body is going. Your deeds build the
        knight.
      </p>
      {content}
    </section>
  );
}
