import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ShieldCheck, Volume2, VolumeX, X } from "lucide-react";
import { totals, type State } from "../domain";
import { formatDay } from "../presentation";
import {
  detectFeedback,
  presentationTimeline,
  type FeedbackBatch,
  type FeedbackEvent,
  type FeedbackIntent,
} from "./events";
import {
  FeedbackAudio,
  haptic,
  readPreferences,
  writePreferences,
  type Cue,
  type Preferences,
} from "./audio";
import "./feedback.css";
import { landmarks } from "../journey";
import { landmarkScene } from "../journeyArt";
const titles: Record<FeedbackEvent["kind"], string> = {
  rank: "RISE",
  landmark: "A LANDMARK REACHED",
  commission: "COMMISSION FULFILLED",
  level: "AN ATTRIBUTE GROWS",
  oath: "OATH KEPT",
  deed: "DEED RECORDED",
  reward: "RENOWN EARNED",
  correction: "OATH RECORD CORRECTED",
};
export function leadCue(events: FeedbackEvent[]): Cue | null {
  const lead = events[0]?.kind;
  return (
    (
      {
        rank: "rankUp",
        landmark: "landmark",
        commission: "commission",
        level: "steel",
        oath: "oath",
        deed: "seal",
        reward: "renown",
        correction: null,
      } as const
    )[lead] ?? null
  );
}
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    query.addEventListener?.("change", change);
    return () => query.removeEventListener?.("change", change);
  }, []);
  return reduced;
}
type FeedbackContext = {
  batch: FeedbackBatch | null;
  emit: (before: State, after: State, intent: FeedbackIntent) => void;
  quiet: () => void;
  interact: (cue: "paper" | "woodClick") => void;
  dismiss: () => void;
};
const Context = createContext<FeedbackContext>({
  batch: null,
  emit: () => {},
  quiet: () => {},
  interact: () => {},
  dismiss: () => {},
});
export const useFeedback = () => useContext(Context);
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [batch, setBatch] = useState<FeedbackBatch | null>(null);
  const [preferences, setPreferences] = useState(readPreferences);
  const preferenceRef = useRef(preferences);
  const [settingsOpen, setSettingsOpen] = useState(false),
    [offer, setOffer] = useState(false),
    [preferenceError, setPreferenceError] = useState(false);
  const offered = useRef(false),
    audio = useRef(new FeedbackAudio()),
    sequence = useRef(0);
  const received = useRef(new WeakSet<State>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  function stop() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    audio.current.stop();
  }
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      audio.current.stop();
    },
    [],
  );
  function play(cue: Cue, delay = 0) {
    const token = audio.current.token;
    void audio.current.unlock().then((ready) => {
      if (
        !ready ||
        audio.current.token !== token ||
        preferenceRef.current.sound !== "enabled"
      )
        return;
      if (!delay) audio.current.play(cue, preferenceRef.current);
      else
        timers.current.push(
          setTimeout(() => {
            if (audio.current.token === token)
              audio.current.play(cue, preferenceRef.current);
          }, delay),
        );
    });
  }
  function cue(c: Cue, delay = 0) {
    if (preferenceRef.current.sound === "enabled") play(c, delay);
  }
  function choose(next: Preferences, preview = false) {
    stop();
    preferenceRef.current = next;
    setPreferences(next);
    setPreferenceError(!writePreferences(next));
    setOffer(false);
    if (preview && next.sound === "enabled") play("seal");
  }
  function emit(before: State, after: State, intent: FeedbackIntent) {
    if (received.current.has(after)) return;
    const events = detectFeedback(before, after, intent);
    if (!events.length) return;
    received.current.add(after);
    stop();
    const next = {
      id: ++sequence.current,
      events,
      before: totals(before),
      after: totals(after),
    };
    setBatch(next);
    if (events[0].kind !== "correction") {
      const lead = leadCue(events);
      if (lead) cue(lead);
      // Two restrained accents, one coordinated sequence; never a sound per point.
      if (
        events.some((e) => e.kind === "reward" && e.reward.renown > 0) &&
        lead !== "renown"
      )
        cue(
          "renown",
          presentationTimeline(events).find(
            (item) => item.event.kind === "reward",
          )!.at,
        );
      haptic(
        preferenceRef.current.haptics,
        ["rank", "level", "commission", "landmark"].includes(events[0].kind),
      );
      if (
        preferenceRef.current.sound === "unset" &&
        !preferenceRef.current.offered &&
        !offered.current
      ) {
        offered.current = true;
        const marked = { ...preferenceRef.current, offered: true };
        preferenceRef.current = marked;
        setPreferences(marked);
        setPreferenceError(!writePreferences(marked));
        setOffer(true);
      }
    }
  }
  function dismiss() {
    stop();
    setBatch(null);
  }
  return (
    <Context.Provider
      value={{
        batch,
        emit,
        quiet: () => {
          stop();
          setBatch(null);
          cue("quill");
        },
        interact: cue,
        dismiss,
      }}
    >
      {children}
      <span className="sr-only" role="status" aria-atomic="true">
        {batch
          ? `${titles[batch.events[0].kind]}. ${batch.events.map(eventText).join(". ")}`
          : ""}
      </span>
      <div className="feedback-controls">
        <button
          className="sound-toggle"
          aria-label="Sound effects settings"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          {preferences.sound === "enabled" ? (
            <Volume2 size={18} />
          ) : (
            <VolumeX size={18} />
          )}
          <span>Sound</span>
        </button>
        {settingsOpen && (
          <section className="sound-settings" aria-label="Feedback settings">
            <strong>Sounds of the keep</strong>
            <p>Quiet sound effects. No background music.</p>
            <button
              className="secondary"
              onClick={() =>
                choose(
                  {
                    ...preferences,
                    sound:
                      preferences.sound === "enabled" ? "disabled" : "enabled",
                  },
                  preferences.sound !== "enabled",
                )
              }
            >
              {preferences.sound === "enabled"
                ? "Mute sound effects"
                : "Enable sound effects & preview"}
            </button>
            <label>
              Effect volume{" "}
              <input
                aria-label="Effect volume"
                type="range"
                min="0"
                max="1"
                step=".05"
                value={preferences.volume}
                onChange={(e) =>
                  choose({ ...preferences, volume: Number(e.target.value) })
                }
              />
            </label>
            <label className="haptic-choice">
              <input
                type="checkbox"
                checked={preferences.haptics}
                onChange={(e) =>
                  choose({ ...preferences, haptics: e.target.checked })
                }
              />{" "}
              Brief haptics, where supported
            </label>
            {preferenceError && (
              <p role="status">
                Preference applies for this visit; browser storage could not
                save it.
              </p>
            )}
          </section>
        )}
      </div>
      {offer && (
        <section className="sound-offer" aria-label="Optional sound effects">
          <strong>A little sound to mark your deeds?</strong>
          <p>Quiet seals and steel. Always optional.</p>
          <div>
            <button
              className="secondary"
              onClick={() => choose({ ...preferences, sound: "enabled" }, true)}
            >
              Enable & preview
            </button>
            <button
              className="text-button"
              onClick={() => choose({ ...preferences, sound: "disabled" })}
            >
              No thanks
            </button>
          </div>
          {preferenceError && (
            <p role="status">Your choice could not be saved in this browser.</p>
          )}
        </section>
      )}
    </Context.Provider>
  );
}
export function useAnimatedValue(value: number, duration = 800) {
  const { batch } = useFeedback(),
    reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value),
    displayRef = useRef(value);
  const currentBatch = useRef(batch);
  currentBatch.current = batch;
  useEffect(() => {
    const before = previous.current;
    previous.current = value;
    if (before === value) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    const start = displayRef.current;
    if (
      reduced ||
      value < before ||
      !currentBatch.current ||
      !currentBatch.current.events.some((e) => e.kind === "reward")
    ) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    let frame = 0,
      began: number | null = null;
    const delay =
      presentationTimeline(currentBatch.current.events).find(
        (item) => item.event.kind === "reward",
      )?.at ?? 0;
    function tick(now: number) {
      began ??= now;
      const t = Math.min(1, (now - began) / duration);
      const current = Math.round(
        start + (value - start) * (1 - Math.pow(1 - t, 3)),
      );
      displayRef.current = current;
      setDisplay(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [value, reduced, duration]);
  return reduced ? value : display;
}
// A component mounting on navigation starts from the current facts, not the last ceremony.
export function useFeedbackPulse(
  duration = 1200,
): [FeedbackBatch | null, () => void] {
  const { batch } = useFeedback();
  const seen = useRef(batch?.id);
  const [pulse, setPulse] = useState<FeedbackBatch | null>(null);
  useEffect(() => {
    if (!batch) {
      setPulse(null);
      return;
    }
    if (seen.current === batch.id) return;
    seen.current = batch.id;
    setPulse(batch);
    const timer = setTimeout(() => setPulse(null), duration);
    return () => clearTimeout(timer);
  }, [batch, duration]);
  return [pulse?.id === batch?.id ? pulse : null, () => setPulse(null)];
}
export function eventText(event: FeedbackEvent): string {
  switch (event.kind) {
    case "rank":
      return `${event.from} → ${event.to}`;
    case "landmark":
      return `Reached ${event.name} · ${event.inscription}`;
    case "commission":
      return `Commission fulfilled · Training Yard · ${event.count} / ${event.target} sessions. No additional reward.`;
    case "level":
      return `${event.attribute} ${roman(event.to)} · level ${event.from} → ${event.to}`;
    case "oath":
      return `Oath kept · ${event.streak} ${event.streak === 1 ? "day" : "days"} steadfast · ${formatDay(event.date)}`;
    case "deed":
      return event.name;
    case "reward":
    case "correction":
      return `${signed(event.reward.renown)} Renown${Object.entries(
        event.reward.xp,
      )
        .map(([a, xp]) => ` · ${signed(xp!)} ${a} XP`)
        .join("")}`;
  }
}
function signed(n: number) {
  return `${n < 0 ? "−" : "+"}${Math.abs(n)}`;
}
function roman(n: number) {
  if (n > 39) return String(n);
  const values: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let text = "";
  for (const [v, s] of values)
    while (n >= v) {
      text += s;
      n -= v;
    }
  return text;
}
export function FeedbackSurface({ onReadJourney }: { onReadJourney?: () => void }) {
  const { batch, dismiss } = useFeedback();
  const [pulse] = useFeedbackPulse(3200);
  if (!batch) return null;
  const lead = batch.events[0];
  const arrivedNames = batch.events.filter(e => e.kind === "landmark").map(e => e.name);
  const arrival = landmarks.findLast(stop => arrivedNames.includes(stop.name));
  return (
    <section
      className={`reward-feedback tier-${lead.kind}${pulse?.id === batch.id ? " feedback-fresh" : ""}`}
      key={batch.id}
      aria-label="Action feedback"
      data-feedback-id={batch.id}
    >
      <div className="feedback-emblem" aria-hidden="true">
        <ShieldCheck size={28} />
      </div>
      <div className="feedback-record">
        <h2>
          {lead.kind === "rank"
            ? `RISE, ${lead.to.toUpperCase()}`
            : lead.kind === "level"
              ? `${lead.attribute.toUpperCase()} ${roman(lead.to)}`
              : titles[lead.kind]}
        </h2>
        {batch.events.some((e) => e.kind === "landmark") && (
          <svg
            className="feedback-route"
            viewBox="0 0 180 30"
            aria-hidden="true"
          >
            <path
              d="M8 22 Q45 -2 88 15 T172 8"
              fill="none"
              stroke="#8e805e"
              strokeDasharray="3 4"
            />
            <circle cx="8" cy="22" r="3" fill="#8e805e" />
            <circle
              className="arrival-marker"
              cx="172"
              cy="8"
              r="5"
              fill="#7b4939"
            />
            <path d="M172 8V-1l8 3-8 3" fill="none" stroke="#516349" />
          </svg>
        )}
        <ul>
          {presentationTimeline(batch.events).map(({ event, at }, index) => (
            <li
              key={index}
              className={`feedback-result result-${event.kind}`}
              style={{ animationDelay: `${at}ms` }}
            >
              {eventText(event)}
            </li>
          ))}
        </ul>
        {arrival && (
          <div className="feedback-arrival" data-arrival={arrival.id}>
            {landmarkScene(arrival.id) && <img src={landmarkScene(arrival.id)}
              alt={arrival.sceneAlt} width={1440} height={810} />}
            <div><strong>{arrival.name}</strong><span>{arrival.km} km from the Keep</span></div>
            {onReadJourney && <button className="text-button" onClick={onReadJourney}>
              Read {arrival.name}’s chapter
            </button>}
          </div>
        )}
        {lead.kind === "correction" && (
          <p>
            Only this Oath entry’s reward was adjusted. Your other deeds remain
            yours.
          </p>
        )}
      </div>
      <button
        className="feedback-dismiss"
        aria-label="Dismiss action feedback"
        onClick={dismiss}
      >
        <X size={18} />
      </button>
    </section>
  );
}
