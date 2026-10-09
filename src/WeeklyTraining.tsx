import { Swords, ShieldCheck } from "lucide-react";
import { trainingStatus } from "./weekly";
import { nextWeekStart } from "./calendar";
import { formatDay } from "./presentation";
import type { State } from "./model";
import "./weekly.css";
const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven"];
export function WeeklyTraining({
  state,
  date,
}: {
  state: State;
  date: string;
}) {
  const status = trainingStatus(state, date);
  if (!status) return null;
  const { count, target, remaining, commission, active, pendingTarget } =
    status;
  const inscription =
    remaining === 0
      ? "The week’s training is fulfilled."
      : count === 0
        ? "The yard awaits. Train on the days that serve you."
        : `${words[count] || count} ${count === 1 ? "visit" : "visits"} to the yard. ${words[remaining] || remaining} ${remaining === 1 ? "remains" : "remain"}.`;
  return (
    <section className="weekly-commission" aria-label="This week’s training">
      <div className="notice-pin" aria-hidden="true" />
      <header>
        <span className="eyebrow">THIS WEEK</span>
        <time dateTime={commission.period.start}>
          {formatDay(commission.period.start)} –{" "}
          {formatDay(commission.period.end)}
        </time>
      </header>
      <div className="weekly-order">
        <Swords size={24} />
        <div>
          <h2>Training Yard</h2>
          <p>{inscription}</p>
        </div>
        <strong>
          {count} / {target}
          <small>sessions</small>
        </strong>
        {remaining === 0 && (
          <ShieldCheck
            className="weekly-fulfilled"
            size={23}
            aria-label="Weekly training fulfilled"
          />
        )}
      </div>
      <div
        className="weekly-marks"
        role="progressbar"
        aria-label="Weekly training sessions"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(count, target)}
        aria-valuetext={`${count} of ${target} sessions`}
      >
        {Array.from({ length: target }, (_, i) => (
          <span
            key={i}
            className={i < count ? "visited" : ""}
            aria-hidden="true"
          />
        ))}
      </div>
      <footer>
        <span>
          {active
            ? "One training day, one reward. No weekly bonus."
            : "Training is paused. Your recorded visits remain."}
        </span>
        {pendingTarget !== null && (
          <span>
            Next target: {pendingTarget} sessions from{" "}
            {formatDay(nextWeekStart(date, state.weekly.weekStartsOn))}.
          </span>
        )}
      </footer>
    </section>
  );
}
export function WeeklyLedger({ state, date }: { state: State; date: string }) {
  const past = state.weekly.commissions
    .filter((c) => c.goalId === "strength" && c.period.end < date)
    .toSorted((a, b) => b.period.start.localeCompare(a.period.start));
  if (!past.length) return null;
  return (
    <section className="panel weekly-ledger" aria-label="Past weekly training">
      <div className="section-heading">
        <h2>Commissions of the yard</h2>
        <Swords size={21} />
      </div>
      <p className="muted">
        Training days recorded. Each week keeps its own measure.
      </p>
      {past.map((c) => (
        <article key={c.id}>
          <div>
            <h3>
              Week of{" "}
              <time dateTime={c.period.start}>
                {formatDay(c.period.start, true)}
              </time>
            </h3>
            <small>
              {formatDay(c.period.start)} – {formatDay(c.period.end)}
            </small>
          </div>
          <strong>
            Training: {c.activityIds.length} / {c.target.value} sessions
          </strong>
        </article>
      ))}
    </section>
  );
}
