import { formatDay } from "./presentation";
import { useState } from "react";
import {
  Shield,
  ArrowRight,
  Check,
  ScrollText,
  Footprints,
  Swords,
  Heart,
  Crown,
  BookOpen,
  Moon,
  Scale,
} from "lucide-react";
import { type CampaignGoal, type GoalId, type GoalTarget } from "./model";
import {
  goalDefinitions,
  defaultGoals,
  validGoals,
  targetDescription,
  targetRules,
  validTarget,
} from "./campaign";
import { quests, oathDefinition, campaignRules } from "./config";
import { RewardText } from "./components";
import "./campaign.css";
const goalIcons = {
  weight: Scale,
  temperance: Shield,
  strength: Swords,
  walking: Footprints,
  nutrition: Heart,
  care: Crown,
  study: BookOpen,
  recovery: Moon,
};
// Campaign configuration owns its draft and flow; it has no Knight-domain dependency.
export default function CampaignEditor({
  initialGoals,
  mode,
  onSave,
  onCancel,
  error = "",
  weeklyContext,
}: {
  initialGoals?: CampaignGoal[];
  mode: "onboarding" | "edit";
  onSave: (goals: CampaignGoal[]) => boolean;
  onCancel: (draft: CampaignGoal[]) => void;
  error?: string;
  weeklyContext?: { currentTarget: number; nextStart: string };
}) {
  const [goals, setGoals] = useState(() =>
    structuredClone(initialGoals || defaultGoals(false)),
  );
  const [page, setPage] = useState<"goals" | "targets" | "review">("goals");
  const [validation, setValidation] = useState("");
  const selected = goals.filter((g) => g.active);
  function target(id: GoalId, next: GoalTarget) {
    setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, target: next } : g)));
  }
  function changeMetric(goal: CampaignGoal, metric: GoalTarget["metric"]) {
    if (metric === "check")
      target(goal.id, structuredClone(goalDefinitions[goal.id].defaultTarget));
    else if (
      metric === "km" ||
      metric === "steps" ||
      metric === "minutes" ||
      metric === "pages" ||
      metric === "hours"
    ) {
      target(goal.id, { metric, value: targetRules[metric].defaultValue });
    }
  }
  function next() {
    if (mode === "onboarding" && !selected.length) {
      setValidation("Choose at least one goal to begin your campaign.");
      return;
    }
    if (page === "targets" && !validGoals(goals)) {
      setValidation(
        "Check your targets: enter a value within the shown range, or a criterion of 3–160 characters.",
      );
      return;
    }
    setValidation("");
    setPage(page === "goals" ? "targets" : "review");
    window.scrollTo({ top: 0 });
  }
  return (
    <section
      className="campaign-editor"
      aria-label={
        mode === "onboarding" ? "Set up your campaign" : "Edit your campaign"
      }
    >
      <header className="campaign-heading">
        <div className="campaign-crest">
          <ScrollText size={28} />
        </div>
        <div>
          <span className="eyebrow">YOUR CAMPAIGN, YOUR PURPOSE</span>
          <h1>
            {page === "goals"
              ? "Choose your campaign goals."
              : page === "targets"
                ? "Set a worthy measure."
                : "Your campaign, considered."}
          </h1>
          <p>
            {page === "goals"
              ? "Choose the goals that serve your real life. There is no perfect-day checklist."
              : page === "targets"
                ? "A clear personal target, with room to grow. Change it whenever your needs change."
                : "These are opportunities, not obligations. Your history remains yours."}
          </p>
        </div>
      </header>
      <ol className="campaign-steps" aria-label="Campaign setup steps">
        {["goals", "targets", "review"].map((p, i) => (
          <li key={p} aria-current={page === p ? "step" : undefined}>
            <span>{i + 1}</span>
            {p}
          </li>
        ))}
      </ol>
      {(validation || error) && (
        <p role="alert" className="error">
          {validation || error}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (page === "review") {
            if (!validGoals(goals)) {
              setValidation("Your targets need a valid value before saving.");
              return;
            }
            onSave(goals);
          } else next();
        }}
      >
        {page === "goals" && (
          <div className="campaign-goals">
            {goals.map((goal) => {
              const Icon = goalIcons[goal.id];
              return (
                <label
                  className={"campaign-goal " + (goal.active ? "selected" : "")}
                  key={goal.id}
                >
                  <input
                    type="checkbox"
                    checked={goal.active}
                    onChange={(e) =>
                      setGoals((gs) =>
                        gs.map((g) =>
                          g.id === goal.id
                            ? {
                                ...g,
                                active: e.target.checked,
                                ...(g.id === "strength" &&
                                !e.target.checked &&
                                (!g.weeklyTarget ||
                                  g.weeklyTarget.value <
                                    campaignRules.trainingSessions.min ||
                                  g.weeklyTarget.value >
                                    campaignRules.trainingSessions.max ||
                                  !Number.isInteger(g.weeklyTarget.value))
                                  ? {
                                      weeklyTarget: {
                                        metric: "sessions" as const,
                                        value:
                                          campaignRules.trainingSessions
                                            .defaultValue,
                                      },
                                    }
                                  : {}),
                                target:
                                  !e.target.checked && !validTarget(g.target)
                                    ? structuredClone(
                                        goalDefinitions[g.id].defaultTarget,
                                      )
                                    : g.target,
                              }
                            : g,
                        ),
                      )
                    }
                  />
                  <Icon size={22} />
                  <span>
                    <strong>{goalDefinitions[goal.id].name}</strong>
                    <small>{goalDefinitions[goal.id].description}</small>
                    {goal.id === "weight" && (
                      <small className="availability-note">
                        Weight tracking is coming next. This goal adds no
                        reward-bearing deeds.
                      </small>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {page === "targets" && (
          <div className="campaign-targets">
            {selected.map((goal) => {
              const Icon = goalIcons[goal.id],
                t = goal.target;
              return (
                <fieldset className="campaign-target" key={goal.id}>
                  <legend>
                    <Icon size={18} />
                    {goalDefinitions[goal.id].name}
                  </legend>
                  {goal.id === "strength" && (
                    <>
                      <label htmlFor="target-strength-weekly">
                        Training sessions per week
                      </label>
                      <input
                        id="target-strength-weekly"
                        type="number"
                        required
                        min={campaignRules.trainingSessions.min}
                        max={campaignRules.trainingSessions.max}
                        step={1}
                        value={goal.weeklyTarget?.value || ""}
                        onChange={(e) =>
                          setGoals((gs) =>
                            gs.map((g) =>
                              g.id === "strength"
                                ? {
                                    ...g,
                                    weeklyTarget: {
                                      metric: "sessions",
                                      value: Number(e.target.value),
                                    },
                                  }
                                : g,
                            ),
                          )
                        }
                      />
                      <p className="target-help">
                        One training day counts once. Weekly progress earns no
                        additional Renown or XP.
                      </p>
                      {mode === "edit" && weeklyContext ? (
                        <p className="target-help">
                          This week’s target stays at{" "}
                          {weeklyContext.currentTarget} sessions. Target changes
                          begin {formatDay(weeklyContext.nextStart)}.
                        </p>
                      ) : (
                        <p className="target-help">
                          Your first weekly commission begins with your
                          campaign. Train on the days that serve you.
                        </p>
                      )}
                    </>
                  )}
                  {goal.id === "walking" && (
                    <>
                      <label htmlFor="target-walking-metric">
                        Patrol target
                      </label>
                      <select
                        id="target-walking-metric"
                        value={t.metric}
                        onChange={(e) =>
                          changeMetric(
                            goal,
                            e.target.value as GoalTarget["metric"],
                          )
                        }
                      >
                        <option value="km">Distance in kilometres</option>
                        <option value="steps">Steps</option>
                      </select>
                      {t.metric === "km" && (
                        <div className="target-presets">
                          {[3, 5].map((value) => (
                            <button
                              type="button"
                              aria-pressed={t.value === value}
                              key={value}
                              onClick={() =>
                                target(goal.id, { metric: "km", value })
                              }
                            >
                              {value} km
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="target-help">
                        A confirmed distance deed records the selected
                        kilometres on Journey. Steps do not imply a distance.
                      </p>
                    </>
                  )}
                  {goal.id === "study" && (
                    <>
                      <label htmlFor="target-study-metric">
                        Reading target
                      </label>
                      <select
                        id="target-study-metric"
                        value={t.metric}
                        onChange={(e) =>
                          changeMetric(
                            goal,
                            e.target.value as GoalTarget["metric"],
                          )
                        }
                      >
                        <option value="minutes">Minutes</option>
                        <option value="pages">Pages</option>
                      </select>
                    </>
                  )}
                  {goal.id === "recovery" && (
                    <>
                      <label htmlFor="target-recovery-metric">
                        Sleep criterion
                      </label>
                      <select
                        id="target-recovery-metric"
                        value={t.metric}
                        onChange={(e) =>
                          changeMetric(
                            goal,
                            e.target.value as GoalTarget["metric"],
                          )
                        }
                      >
                        <option value="check">
                          My personal sleep criterion
                        </option>
                        <option value="hours">Hours of sleep</option>
                      </select>
                      <p className="target-help">
                        Confirm the previous night, starting after your first
                        night with this goal.
                      </p>
                    </>
                  )}
                  {t.metric === "check" && (
                    <>
                      <label htmlFor={`target-${goal.id}`}>
                        Your completion criterion
                      </label>
                      <textarea
                        id={`target-${goal.id}`}
                        value={t.criterion}
                        minLength={3}
                        maxLength={160}
                        required
                        onChange={(e) =>
                          target(goal.id, {
                            metric: "check",
                            criterion: e.target.value,
                          })
                        }
                      />
                      <p className="target-help">
                        {goal.id === "nutrition"
                          ? "Confirm this in the evening. No calorie database is needed."
                          : "Describe the real-world action you will honestly confirm."}
                      </p>
                    </>
                  )}
                  {"value" in t && (
                    <>
                      <label htmlFor={`target-${goal.id}`}>
                        Target ({t.metric})
                      </label>
                      <input
                        id={`target-${goal.id}`}
                        type="number"
                        required
                        min={targetRules[t.metric].min}
                        max={targetRules[t.metric].max}
                        step={targetRules[t.metric].step}
                        value={t.value || ""}
                        onChange={(e) =>
                          target(goal.id, {
                            metric: t.metric,
                            value: Number(e.target.value),
                          })
                        }
                      />
                      <p className="target-help">
                        {targetRules[t.metric].min}–{targetRules[t.metric].max}{" "}
                        {t.metric}. Rewards stay fixed; a larger target does not
                        multiply XP.
                      </p>
                    </>
                  )}
                  {t.metric === "oath" && (
                    <p>
                      Swear the Oath of Temperance, then confirm it this
                      evening. Intent alone does not earn rewards.
                    </p>
                  )}
                  {t.metric === "outcome" && (
                    <p>
                      Weight measurements and target progress are an outcome
                      record. The tracker is coming next; neither measurements
                      nor weight changes earn Renown or XP.
                    </p>
                  )}
                </fieldset>
              );
            })}
            {!selected.length && (
              <p className="campaign-empty">
                No active goals. Saving will pause new deeds while preserving
                your entire campaign history.
              </p>
            )}
          </div>
        )}
        {page === "review" && (
          <div className="campaign-review">
            <div className="review-inscription">
              <Shield size={19} />
              <span>BY DEED, NOT WORD</span>
              <strong>
                {selected.length} active{" "}
                {selected.length === 1 ? "goal" : "goals"}
              </strong>
            </div>
            {selected.map((goal) => {
              const quest = quests.find((q) => q.goalId === goal.id);
              return (
                <article className="review-deed" key={goal.id}>
                  <Check size={18} />
                  <div>
                    <span className="eyebrow">
                      {goalDefinitions[goal.id].name}
                    </span>
                    <h2>
                      {quest?.name ||
                        (goal.id === "temperance"
                          ? oathDefinition.name
                          : "Weight management")}
                    </h2>
                    <p>{targetDescription(goal.target)}</p>
                    {goal.id === "strength" && (
                      <p className="weekly-review">
                        Train {goal.weeklyTarget?.value} times per week · no
                        weekly reward bonus.
                        {mode === "edit" && weeklyContext && (
                          <>
                            {" "}
                            Target changes begin{" "}
                            {formatDay(weeklyContext.nextStart)}; this week
                            stays at {weeklyContext.currentTarget}.
                          </>
                        )}
                      </p>
                    )}
                    {quest && <RewardText reward={quest.reward} />}{" "}
                    {goal.id === "temperance" && (
                      <RewardText reward={oathDefinition.reward} />
                    )}{" "}
                    {goal.id === "weight" && (
                      <small className="availability-note">
                        Saved for the upcoming tracker. No measurements are
                        invented.
                      </small>
                    )}
                  </div>
                </article>
              );
            })}
            {!selected.length && (
              <p className="campaign-empty">
                Your campaign is paused. Previously earned Renown, attributes
                and history remain intact.
              </p>
            )}
            <p className="target-help">
              New settings affect future confirmations. Completed deeds keep
              their original rewards and criteria. One rewarded deed per goal
              per day.
            </p>
          </div>
        )}
        <footer className="campaign-actions">
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setValidation("");
              if (page === "goals") onCancel(goals);
              else {
                setPage(page === "review" ? "targets" : "goals");
                window.scrollTo({ top: 0 });
              }
            }}
          >
            {page === "goals"
              ? mode === "edit"
                ? "Cancel"
                : "Back to knight setup"
              : "Back"}
          </button>
          <button className="primary" type="submit">
            {page === "goals"
              ? "Set my targets"
              : page === "targets"
                ? "Review my campaign"
                : mode === "onboarding"
                  ? "Begin my campaign"
                  : "Save campaign"}
            <ArrowRight size={17} />
          </button>
        </footer>
      </form>
    </section>
  );
}
