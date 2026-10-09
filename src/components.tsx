import { useAnimatedValue } from "./feedback/Feedback";
import type { FeedbackIntent } from "./feedback/events";
import { goalActive } from "./campaign";
import { useState } from "react";
import { formatDay } from "./presentation";
import {
  Shield,
  Swords,
  Footprints,
  Heart,
  Crown,
  BookOpen,
  Check,
  Flame,
} from "lucide-react";
import {
  attributeProgress,
  attributes,
  totals,
  canConfirm,
  progression,
  oathDefinition,
  confirmOath,
  takeOath,
  dayKey,
  previousDay,
  type Attribute,
  type State,
  type Reward,
} from "./domain";
export const icons: Record<Attribute, typeof Shield> = {
  Strength: Swords,
  Endurance: Footprints,
  Resolve: Shield,
  Vitality: Heart,
  Presence: Crown,
  Wisdom: BookOpen,
};
export function RewardText({
  reward,
  negative = false,
}: {
  reward: Reward;
  negative?: boolean;
}) {
  const sign = negative ? "−" : "+";
  return (
    <div className="rewards">
      <span className="renown">
        <Flame size={12} />
        {sign}
        {reward.renown} Renown
      </span>
      {Object.entries(reward.xp).map(([a, xp]) => (
        <span key={a}>
          {sign}
          {xp} {a} XP
        </span>
      ))}
    </div>
  );
}
function AttributeRow({
  attribute: a,
  stat,
}: {
  attribute: Attribute;
  stat: ReturnType<typeof attributeProgress>;
}) {
  const displayed = attributeProgress(useAnimatedValue(stat.lifetimeXP));
  const Icon = icons[a];
  return (
    <div className="attribute">
      <Icon size={19} />
      <span>{a}</span>
      <strong aria-label={`Level ${stat.level}`}>
        <span aria-hidden="true">
          {displayed.level}
          <small>Level</small>
        </span>
      </strong>
      <div
        className="progress light"
        role="progressbar"
        aria-label={`${a} XP toward level ${stat.level + 1}`}
        aria-valuemin={0}
        aria-valuemax={stat.required}
        aria-valuenow={stat.xp}
      >
        <i style={{ width: `${displayed.progress * 100}%` }} />
      </div>
      <small
        className="attribute-xp"
        aria-label={`${stat.xp} / ${stat.required} XP`}
      >
        <span aria-hidden="true">
          {displayed.xp} / {displayed.required} XP
        </span>
      </small>
    </div>
  );
}
export function Attributes({ state }: { state: State }) {
  const stats = totals(state).stats;
  return (
    <div className="attributes">
      {attributes.map((a) => (
        <AttributeRow key={a} attribute={a} stat={stats[a]} />
      ))}
    </div>
  );
}
export function OathPanel({
  state,
  now,
  update,
  report,
}: {
  state: State;
  now: Date;
  update: (s: State, intent?: FeedbackIntent) => boolean;
  report: (title: string, reward?: Reward, negative?: boolean) => void;
}) {
  const today = dayKey(now),
    yesterday = previousDay(today);
  const [selected, setSelected] = useState<"today" | "yesterday">("today");
  const [editing, setEditing] = useState(false),
    [pending, setPending] = useState<"kept" | "broken" | null>(null);
  const date = selected === "today" ? today : yesterday,
    record = state.oaths[date];
  const available =
      date >= state.created &&
      (goalActive(state, "temperance", date) || !!state.oaths[date]) &&
      canConfirm(date, "end-of-day", now),
    final = record?.status === "kept" || record?.status === "broken";
  function confirm(status: "kept" | "broken") {
    if (final && record.status !== status && !pending) {
      setPending(status);
      return;
    }
    const next = confirmOath(state, date, status, now);
    if (next !== state && update(next, final ? "correction" : "oath")) {
      report(
        status === "kept"
          ? "Oath kept. A promise honoured."
          : record?.status === "kept"
            ? "Oath record corrected. Only this entry’s reward was reversed."
            : "Oath recorded. Your campaign continues.",
        status === "kept"
          ? next.oaths[date].reward!
          : record?.status === "kept"
            ? record.reward!
            : undefined,
        status === "broken",
      );
      setEditing(false);
      setPending(null);
    }
  }
  return (
    <section className="oath-notice oath-compact">
      <div className="notice-pin" />
      <div className="oath-notice-heading">
        <div className="oath-emblem">
          <Shield size={26} />
        </div>
        <div>
          <span className="eyebrow">A DAILY PROMISE</span>
          <h2>{oathDefinition.name}</h2>
        </div>
      </div>
      <p className="oath-promise">“I shall remain steadfast today.”</p>
      <div className="oath-date-switch" aria-label="Oath date">
        {(["today", "yesterday"] as const).map((d) => (
          <button
            key={d}
            aria-pressed={selected === d}
            disabled={
              d === "yesterday" &&
              (yesterday < state.created ||
                (!goalActive(state, "temperance", yesterday) &&
                  !state.oaths[yesterday]))
            }
            onClick={() => {
              setSelected(d);
              setEditing(false);
              setPending(null);
            }}
          >
            {d === "today" ? "Today" : "Yesterday"} ·{" "}
            {formatDay(d === "today" ? today : yesterday)}
          </button>
        ))}
      </div>
      <div className={"oath-status " + (record?.status || "unlogged")}>
        <span>◆</span>
        {record?.status === "taken"
          ? "Oath active · awaiting confirmation"
          : record?.status === "kept"
            ? "Kept · confirmed alcohol-free"
            : record?.status === "broken"
              ? "Broken · honestly recorded"
              : "Unlogged · not counted as alcohol-free"}
      </div>
      {pending ? (
        <div className="correction-confirm">
          <strong>Correct this Oath to {pending}?</strong>
          <p>
            {pending === "broken"
              ? "This reverses only the reward previously granted for this date. All other deeds and Oaths remain unchanged."
              : "This awards the configured Oath reward once for this date."}
          </p>
          <RewardText
            reward={
              pending === "broken" ? record!.reward! : oathDefinition.reward
            }
            negative={pending === "broken"}
          />
          <button className="secondary" onClick={() => confirm(pending)}>
            Confirm correction
          </button>
          <button className="text-button" onClick={() => setPending(null)}>
            Cancel
          </button>
        </div>
      ) : (
        <>
          {!record && selected === "today" && (
            <button
              className="primary oath-take"
              onClick={() => {
                if (update(takeOath(state, date, now)))
                  report(
                    "Your Oath is taken. Return this evening to confirm it.",
                  );
              }}
            >
              Swear today’s Oath <Shield size={16} />
            </button>
          )}
          {(!final || editing) && (
            <div className="oath-confirm">
              <span className="confirmation-label">
                Did you keep your Oath?
              </span>
              <div>
                <button
                  disabled={!available}
                  className="secondary"
                  onClick={() => confirm("kept")}
                >
                  I remained steadfast
                </button>
                <button
                  disabled={!available}
                  className="text-button"
                  onClick={() => confirm("broken")}
                >
                  The oath was broken
                </button>
              </div>
              {!available && (
                <p className="timing-note">
                  Confirmation opens at{" "}
                  {String(progression.eveningConfirmationHour).padStart(2, "0")}
                  :00 local time. An active Oath earns nothing until confirmed.
                </p>
              )}
              {editing && (
                <button
                  className="text-button"
                  onClick={() => setEditing(false)}
                >
                  Cancel correction
                </button>
              )}
            </div>
          )}
          {final && !editing && (
            <button
              className="text-button correction-link"
              onClick={() => setEditing(true)}
            >
              Correct this record
            </button>
          )}
        </>
      )}
      <div className="oath-offered-reward">
        <span>REWARD FOR A KEPT OATH</span>
        <RewardText reward={oathDefinition.reward} />
      </div>
      <p className="oath-footnote">
        Rewards follow confirmation. A setback is a lost skirmish, not a deleted
        campaign.
      </p>
    </section>
  );
}
export function HistoricalOath({
  state,
  date,
  now,
  update,
  report,
}: {
  state: State;
  date: string;
  now: Date;
  update: (s: State, intent?: FeedbackIntent) => boolean;
  report: (title: string, reward?: Reward, negative?: boolean) => void;
}) {
  const [open, setOpen] = useState(false),
    record = state.oaths[date];
  const targets: ("kept" | "broken")[] =
    record.status === "taken"
      ? ["kept", "broken"]
      : [record.status === "kept" ? "broken" : "kept"];
  function submit(target: "kept" | "broken") {
    const next = confirmOath(state, date, target, now);
    if (
      next !== state &&
      update(next, record.status === "taken" ? "oath" : "correction")
    ) {
      report(
        "Oath history corrected.",
        target === "kept"
          ? next.oaths[date].reward!
          : record.status === "kept"
            ? record.reward!
            : undefined,
        target === "broken",
      );
      setOpen(false);
    }
  }
  return (
    <div className="historical-oath">
      <Shield size={16} />
      <span>
        Oath ·{" "}
        {record.status === "taken" ? "active / unconfirmed" : record.status}
      </span>
      {record.status === "kept" && <RewardText reward={record.reward!} />}
      <button className="text-button" onClick={() => setOpen(!open)}>
        {open
          ? "Cancel"
          : record.status === "taken"
            ? "Confirm record"
            : "Correct record"}
      </button>
      {open && (
        <div className="historical-correction">
          <p>
            {record.status === "kept"
              ? "Reverse only this date’s Oath reward? Other entries remain unchanged."
              : record.status === "broken"
                ? "Confirm this date as alcohol-free and award its Oath reward once?"
                : "Confirm this date honestly. Only a kept Oath earns rewards."}
          </p>
          {record.status !== "taken" && (
            <RewardText
              reward={
                record.status === "kept"
                  ? record.reward!
                  : oathDefinition.reward
              }
              negative={record.status === "kept"}
            />
          )}{" "}
          {targets.map((target) => (
            <button
              key={target}
              className="secondary"
              disabled={!canConfirm(date, "end-of-day", now)}
              onClick={() => submit(target)}
            >
              Confirm {target}
            </button>
          ))}
          {!canConfirm(date, "end-of-day", now) && (
            <p className="timing-note">
              Confirmation opens at{" "}
              {String(progression.eveningConfirmationHour).padStart(2, "0")}:00
              local time.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
