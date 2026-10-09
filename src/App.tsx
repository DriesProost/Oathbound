import WeightChronicle from "./WeightChronicle";
import { setWeightSettings } from "./weight";
import { WeeklyTraining, WeeklyLedger } from "./WeeklyTraining";
import { ensureWeeklyPeriod, weeklyTarget, currentCommission } from "./weekly";
import { weekStart, nextWeekStart } from "./calendar";
import { useEffect, useState } from "react";
import {
  Castle,
  ScrollText,
  Map,
  Shield,
  BookOpen,
  Check,
  ArrowRight,
  ChevronRight,
  Sun,
  Flame,
} from "lucide-react";
import {
  createKnight,
  completeQuest,
  totals,
  rankProgress,
  oathStats,
  dayKey,
  questDate,
  canConfirm,
  progression,
  ranks,
  type State,
  type Reward,
  type Quest,
} from "./domain";
import { load, save } from "./storage";
import CampaignEditor from "./CampaignEditor";
import {
  availableQuests,
  configuredQuests,
  campaignGoals,
  configureCampaign,
  defaultGoals,
  goalDefinitions,
  goalActive,
} from "./campaign";
import type { CampaignGoal } from "./model";
import KnightArt from "./KnightArt";
import { formatDay } from "./presentation";
import JourneyMap from "./JourneyMap";
import {
  Attributes,
  OathPanel,
  HistoricalOath,
  RewardText,
  icons,
} from "./components";
const tabs = [
  { name: "Keep", icon: Castle },
  { name: "Quest Board", icon: ScrollText },
  { name: "Journey", icon: Map },
  { name: "Knight", icon: Shield },
  { name: "Chronicle", icon: BookOpen },
];
export default function App() {
  const [initial] = useState(() => {
    try {
      return { state: load(), error: "" };
    } catch {
      return {
        state: null,
        error:
          "Your saved chronicle could not be read or migrated. Your original data has been left untouched. Please do not clear browser storage.",
      };
    }
  });
  const [state, setState] = useState<State | null>(initial.state),
    [error, setError] = useState(initial.error);
  const [tab, setTab] = useState("Keep"),
    [name, setName] = useState(""),
    [step, setStep] = useState(0);
  const [notice, setNotice] = useState<{
    title: string;
    reward?: Reward;
    negative?: boolean;
  } | null>(null);
  const [migrationVisible, setMigrationVisible] = useState(
    !!initial.state?.migratedFrom,
  );
  const [now, setNow] = useState(new Date());
  const [campaignEditing, setCampaignEditing] = useState(false);
  const [onboardingGoals, setOnboardingGoals] = useState<CampaignGoal[]>(() =>
    defaultGoals(false),
  );
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    if (!state) return;
    const next = ensureWeeklyPeriod(state, dayKey(now));
    if (next !== state) update(next);
  }, [state, now]);
  function update(next: State) {
    return persist(ensureWeeklyPeriod(next, dayKey(now)));
  }
  function persist(next: State) {
    try {
      save(next);
      setState(next);
      setError("");
      return true;
    } catch {
      setError(
        "Your progress could not be saved. Check that browser storage is available. This action has not been recorded.",
      );
      return false;
    }
  }
  function report(title: string, reward?: Reward, negative?: boolean) {
    setNotice({ title, reward, negative });
  }
  if (!state && step === 2)
    return (
      <main className="campaign-shell">
        <div className="campaign-brand">
          <Shield size={23} />
          <span>
            OATHBOUND <small>A LIFE WELL FOUGHT</small>
          </span>
        </div>
        <CampaignEditor
          mode="onboarding"
          initialGoals={onboardingGoals}
          error={error}
          onCancel={(draft) => {
            setOnboardingGoals(draft);
            setStep(1);
          }}
          today={dayKey(now)}
          onSave={(goals, weightSettings) => {
            const next = createKnight(name, dayKey(now), goals);
            return update(
              weightSettings ? setWeightSettings(next, weightSettings) : next,
            );
          }}
        />
      </main>
    );
  if (!state)
    return (
      <main className="welcome">
        <div className="welcome-card">
          <div className="brand">
            <Shield size={30} />
            <span>
              OATHBOUND<small>A LIFE WELL FOUGHT</small>
            </span>
          </div>
          <div className="welcome-art">
            <KnightArt />
          </div>
          <span className="eyebrow">YOUR CAMPAIGN BEGINS HERE</span>
          <h1>
            {step === 0
              ? "Build a life worthy of your oath."
              : "Every knight begins as a squire."}
          </h1>
          <p>
            Small actions. Steady resolve. Train your knight through the things
            that make your real life better.
          </p>
          {error ? (
            <p role="alert" className="error">
              {error}
            </p>
          ) : step === 0 ? (
            <>
              <div className="welcome-features">
                <span>
                  <Shield />
                  Train in the real world
                </span>
                <span>
                  <Shield />
                  Keep your earned progress
                </span>
                <span>
                  <BookOpen />
                  Write your own chronicle
                </span>
              </div>
              <button className="primary" onClick={() => setStep(1)}>
                Begin your campaign <ArrowRight size={18} />
              </button>
              <small className="muted">
                No account needed. Your progress stays in this browser.
              </small>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              <label htmlFor="name">What shall we call you?</label>
              <input
                id="name"
                required
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name or knight’s name"
                autoFocus
              />
              <p className="muted">
                You start with a clean slate. Small deeds build a lasting
                campaign.
              </p>
              <button className="primary">
                Take up the shield <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setStep(0)}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </main>
    );
  const today = dayKey(now),
    total = totals(state),
    rank = rankProgress(total.renown),
    oath = oathStats(state, today);
  const currentGoals = campaignGoals(state.campaign, today);
  const campaignQuests = availableQuests(state, now);
  const showOath =
    goalActive(state, "temperance", today) || !!state.oaths[today];
  const hasOathHistory = Object.keys(state.oaths).length > 0;
  const activeGoals = currentGoals.filter((g) => g.active);
  if (campaignEditing)
    return (
      <main className="campaign-shell">
        <div className="campaign-brand">
          <Shield size={23} />
          <span>
            OATHBOUND <small>YOUR CAMPAIGN</small>
          </span>
        </div>
        <CampaignEditor
          mode="edit"
          weeklyContext={{
            currentTarget:
              currentCommission(state, today)?.target.value ??
              weeklyTarget(
                state,
                "strength",
                weekStart(today, state.weekly.weekStartsOn),
              ).value,
            nextStart: nextWeekStart(today, state.weekly.weekStartsOn),
          }}
          initialGoals={currentGoals}
          initialWeightSettings={state.weight.settings}
          today={today}
          error={error}
          onCancel={() => {
            setCampaignEditing(false);
            setError("");
          }}
          onSave={(goals, weightSettings) => {
            try {
              const configured = configureCampaign(state, goals, today);
              const next = weightSettings
                ? setWeightSettings(configured, weightSettings)
                : configured;
              if (!update(next)) return false;
              setCampaignEditing(false);
              setTab("Quest Board");
              report("Campaign updated. Your earned history remains yours.");
              window.scrollTo({ top: 0 });
              return true;
            } catch {
              setError(
                "Your campaign settings could not be saved. Please check your targets.",
              );
              return false;
            }
          }}
        />
      </main>
    );
  const done = state.entries.filter((e) => e.date === today),
    oathKept = state.oaths[today]?.status === "kept";
  const deedsToday = done.length + Number(oathKept);
  const dailyRenown =
    done.reduce((n, e) => n + e.reward.renown, 0) +
    (oathKept ? state.oaths[today].reward!.renown : 0);
  function finish(q: Quest, date: string) {
    const next = completeQuest(state!, q.id, date, now);
    if (next !== state && update(next))
      report(`${q.name} · deed recorded.`, q.reward);
  }
  function questCard(q: Quest, material = false) {
    const date = questDate(q, now),
      recorded = state!.entries.find(
        (e) => e.date === date && (e.goalId === q.goalId || e.questId === q.id),
      ),
      completed = !!recorded;
    const allowed =
        date >= state!.created &&
        !!configuredQuests(state!, date).find((p) => p.id === q.id) &&
        canConfirm(date, q.timing, now),
      Icon = icons[Object.keys(q.reward.xp)[0] as keyof typeof icons];
    const timing =
      q.timing === "end-of-day"
        ? `Confirm after ${String(progression.eveningConfirmationHour).padStart(2, "0")}:00`
        : q.timing === "retrospective"
          ? `Previous night · ${formatDay(date)}`
          : "Record when performed";
    return (
      <article
        className={
          (material ? "quest parchment-notice " : "quest ") +
          (completed ? "completed" : "")
        }
        key={q.id}
      >
        {material && <div className="notice-pin" />}
        <div
          className={"quest-icon " + Object.keys(q.reward.xp)[0].toLowerCase()}
        >
          <Icon size={22} />
        </div>
        <div className="quest-info">
          <div className="quest-heading">
            <h3>{recorded?.deed.name || q.name}</h3>
            {material && <span className="difficulty">{q.difficulty}</span>}
          </div>
          <p>{recorded?.deed.description || q.description}</p>
          {!completed && <RewardText reward={q.reward} />}
          <small className="quest-timing" id={`timing-${q.id}`}>
            {date < state!.created ||
            !configuredQuests(state!, date).find((p) => p.id === q.id)
              ? "Available after your first night with this goal"
              : completed
                ? `Recorded · ${formatDay(date)}`
                : timing}
          </small>
        </div>
        {completed ? (
          <div
            className="completion-receipt"
            aria-label={`${q.name} completed`}
          >
            <span className="wax-seal" aria-hidden="true">
              <Check size={20} />
            </span>
            <div>
              <span className="receipt-title">DEED RECORDED</span>
              <RewardText reward={recorded!.reward} />
            </div>
          </div>
        ) : (
          <button
            className="complete-button"
            disabled={!allowed}
            aria-label={`Complete ${q.name}`}
            aria-describedby={`timing-${q.id}`}
            onClick={() => finish(q, date)}
          >
            {!allowed
              ? date < state!.created ||
                !configuredQuests(state!, date).find((p) => p.id === q.id)
                ? "Confirm after your first night"
                : "Confirm this evening"
              : q.timing === "immediate"
                ? "Complete"
                : "Confirm"}
          </button>
        )}
      </article>
    );
  }
  const switchTab = (name: string) => {
    setTab(name);
    setNotice(null);
  };
  const historyDates = [
    ...new Set([
      ...state.entries.map((e) => e.date),
      ...Object.keys(state.oaths),
    ]),
  ]
    .sort()
    .reverse();
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Shield size={30} />
          <span>
            OATHBOUND<small>A LIFE WELL FOUGHT</small>
          </span>
        </div>
        <div className="sidebar-rule" />
        <span className="nav-label">YOUR CAMPAIGN</span>
        <nav aria-label="Desktop navigation">
          {tabs.map((t) => (
            <button
              key={t.name}
              className={tab === t.name ? "active" : ""}
              onClick={() => switchTab(t.name)}
            >
              <t.icon size={20} />
              {t.name}
              {tab === t.name && <ChevronRight size={15} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-quote">
          <Shield size={22} />
          <p>
            “Great deeds are built
            <br />
            from small promises kept.”
          </p>
          <span>ONE DAY AT A TIME</span>
        </div>
        <div className="sidebar-profile">
          <div className="avatar">{state.name[0].toUpperCase()}</div>
          <div>
            <strong>{state.name}</strong>
            <small>{rank.rank.name} · A life well fought</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            <Castle size={17} /> Your{" "}
            {tab === "Keep" ? "keep" : tab.toLowerCase()}
          </span>
          <div>
            <span className="date">
              {now.toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "long",
              })}
            </span>
            <span className="top-renown">
              <Flame size={16} />
              {total.renown} <span>Renown</span>
            </span>
            <div className="avatar small">{state.name[0].toUpperCase()}</div>
          </div>
        </header>
        <main
          className={
            "content " +
            ({
              Keep: "keep-page",
              "Quest Board": "board-page",
              Knight: "knight-page",
              Chronicle: "chronicle-page",
              Journey: "journey-page",
            }[tab] || "")
          }
        >
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {tab === "Keep"
                  ? "A NEW DAY. A WORTHY PURPOSE."
                  : tab === "Quest Board"
                    ? "NOTICES FROM YOUR KEEP"
                    : "YOUR CAMPAIGN, ONE DAY AT A TIME."}
              </span>
              <h1>
                {tab === "Keep"
                  ? `Welcome to your keep, ${state.name}.`
                  : tab === "Quest Board"
                    ? "Small deeds. Lasting change."
                    : tab === "Journey"
                      ? "The road ahead."
                      : tab === "Knight"
                        ? "The knight you are becoming."
                        : "Every day is part of the story."}
              </h1>
              <p>
                {tab === "Keep"
                  ? "Your next chapter is written in the things you do today."
                  : tab === "Quest Board"
                    ? "Choose the deeds that serve you today. There is no perfect-day checklist."
                    : tab === "Journey"
                      ? "Let your daily walks carry you a little further."
                      : tab === "Knight"
                        ? "Earned through consistency. A campaign measured in seasons."
                        : "A lost skirmish never erases a campaign."}
              </p>
            </div>
            <span className="day-badge">
              <Sun size={17} /> Day{" "}
              {Math.max(
                1,
                Math.round(
                  (new Date(today + "T12:00:00").getTime() -
                    new Date(state.created + "T12:00:00").getTime()) /
                    86400000,
                ) + 1,
              )}
            </span>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {migrationVisible && (
            <div className="migration-note">
              <BookOpen size={19} />
              <div>
                <strong>Your chronicle has been preserved.</strong>
                <p>
                  Your existing behaviour goals remain active until you choose
                  changes. Legitimate earned rewards, dates and walking distance
                  have been preserved. Campaign settings now belong to your own
                  goals. An untouched original save is retained in this browser.
                  {state.migratedFrom === 1 &&
                    " As before, rewards incorrectly attached to a broken legacy Oath are corrected for that entry only."}
                </p>
              </div>
              <button
                aria-label="Dismiss migration explanation"
                onClick={() => setMigrationVisible(false)}
              >
                ×
              </button>
            </div>
          )}
          {notice && (
            <div className="notice ceremony" role="status">
              <div className="ceremony-seal">
                <Check size={22} />
              </div>
              <div>
                <strong>{notice.title}</strong>
                {notice.reward && (
                  <RewardText
                    reward={notice.reward}
                    negative={notice.negative}
                  />
                )}
              </div>
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice(null)}
              >
                ×
              </button>
            </div>
          )}
          {tab === "Keep" && (
            <>
              <div className="hero">
                <div className="hero-copy">
                  <span className="eyebrow">WITHIN YOUR STRONGHOLD</span>
                  <h2>{state.name}</h2>
                  <span className="rank-badge">
                    <Shield size={14} />
                    {rank.rank.name}
                  </span>
                  <p>
                    The armour may be humble.
                    <br />
                    The promise is anything but.
                  </p>
                  <div className="renown-label">
                    <span>RENOWN</span>
                    <strong>
                      {total.renown}{" "}
                      <small>
                        {rank.next
                          ? `/ ${rank.next.threshold}`
                          : "· highest rank"}
                      </small>
                    </strong>
                  </div>
                  <div
                    className="progress"
                    role="progressbar"
                    aria-label="Knight rank progress"
                    aria-valuenow={Math.round(rank.progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <i style={{ width: `${rank.progress * 100}%` }} />
                  </div>
                  <small className="next-rank">
                    {rank.next
                      ? `${rank.next.threshold - total.renown} Renown to ${rank.next.name}`
                      : "Your highest rank, earned."}
                  </small>
                  <button
                    className="hero-link"
                    onClick={() => switchTab("Knight")}
                  >
                    Meet your knight <ArrowRight size={16} />
                  </button>
                </div>
                <div className="hero-art">
                  <div className="stronghold-arch" aria-hidden="true" />
                  <KnightArt />
                  <span>STEADY IN PURPOSE</span>
                </div>
                <div className="hero-quote">
                  {total.renown
                    ? "Good deeds leave their mark."
                    : "Your keep is quiet."}
                  <br />
                  {total.renown
                    ? "Return steady in purpose."
                    : "Your story is just beginning."}
                  <div>
                    EST. {new Date(state.created + "T12:00:00").getFullYear()}
                  </div>
                </div>
              </div>
              <Attributes state={state} />
              <div className="dashboard-grid">
                <section>
                  <div className="section-heading">
                    <h2>Deeds for today</h2>
                    <button
                      className="text-button"
                      onClick={() => switchTab("Quest Board")}
                    >
                      View board <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="quest-list">
                    {[...campaignQuests]
                      .sort(
                        (a, b) =>
                          Number(a.timing !== "immediate") -
                          Number(b.timing !== "immediate"),
                      )
                      .slice(0, 3)
                      .map((q) => questCard(q, true))}
                    {!campaignQuests.length && (
                      <div className="campaign-empty">
                        <ScrollText size={25} />
                        <p>
                          No reward-bearing deeds are active. Choose the
                          behaviours that serve you.
                        </p>
                        <button
                          className="text-button"
                          onClick={() => setCampaignEditing(true)}
                        >
                          Configure campaign <ArrowRight size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="deeds-summary">
                    <Check size={16} />
                    <span>
                      {deedsToday} {deedsToday === 1 ? "deed" : "deeds"}{" "}
                      recorded today · {dailyRenown} Renown earned
                    </span>
                  </div>
                  <p className="muted">
                    A little progress is still progress. Choose what supports
                    your real life.
                  </p>
                </section>
                {showOath ? (
                  <section className="oath-card">
                    <div className="oath-title">
                      <Shield size={21} />
                      <span>THE OATH OF TEMPERANCE</span>
                    </div>
                    <h2>
                      {oath.current}
                      <small>days steadfast</small>
                    </h2>
                    <p>
                      {oathKept
                        ? "Today’s Oath is confirmed."
                        : state.oaths[today]?.status === "taken"
                          ? "Your Oath is active. Return this evening."
                          : state.oaths[today]?.status === "broken"
                            ? "Today is recorded. The campaign continues."
                            : "One promise. Renewed each day."}
                    </p>
                    <div className="oath-summary">
                      <div>
                        <strong>{oath.longest}</strong>
                        <span>Longest oath</span>
                      </div>
                      <div>
                        <strong>{oath.sober}</strong>
                        <span>Alcohol-free days</span>
                      </div>
                    </div>
                    <blockquote>
                      A setback is a lost skirmish,
                      <br />
                      not a deleted campaign.
                    </blockquote>
                    <button
                      className="text-button"
                      onClick={() => switchTab("Quest Board")}
                    >
                      Attend to your Oath <ArrowRight size={16} />
                    </button>
                  </section>
                ) : (
                  <section className="panel campaign-summary">
                    <span className="eyebrow">YOUR CAMPAIGN</span>
                    <h2>A purpose of your own.</h2>
                    <p>
                      {activeGoals.length} active{" "}
                      {activeGoals.length === 1 ? "goal" : "goals"}. No daily
                      quota.
                    </p>
                    <ul>
                      {activeGoals.map((g) => (
                        <li key={g.id}>{goalDefinitions[g.id].name}</li>
                      ))}
                    </ul>
                    {activeGoals.some((g) => g.id === "weight") && (
                      <p className="target-help">
                        Weight is recorded in Chronicle. Outcomes do not earn
                        Renown or XP.
                      </p>
                    )}
                    <button
                      className="text-button"
                      onClick={() => setCampaignEditing(true)}
                    >
                      Configure campaign <ArrowRight size={15} />
                    </button>
                  </section>
                )}
              </div>
              <div className="footer-note">
                <span>✦</span> You are training more than a knight. You are
                building a life.
              </div>
            </>
          )}
          {tab === "Quest Board" && (
            <>
              <div className="board-summary">
                <ScrollText size={24} />
                <div>
                  <strong>
                    {deedsToday} {deedsToday === 1 ? "deed" : "deeds"} recorded
                    today
                  </strong>
                  <p>
                    {dailyRenown} Renown earned · self-reported actions · no
                    daily quota
                  </p>
                </div>
                <span className="board-inscription">BY DEED, NOT WORD</span>
              </div>
              <div className="notice-board">
                <div className="board-plaque">
                  <span>✦</span> THE QUEST BOARD <span>✦</span>
                </div>
                {showOath && (
                  <OathPanel
                    state={state}
                    now={now}
                    update={update}
                    report={report}
                  />
                )}
                {!showOath && !campaignQuests.length && (
                  <div className="board-empty">
                    <ScrollText size={30} />
                    <h2>No deeds posted yet.</h2>
                    <p>
                      {activeGoals.some((g) => g.id === "weight")
                        ? "Your weight tracker is available in Chronicle. Add a behaviour goal to earn progress through controllable actions."
                        : "Choose the goals that serve you. Your earlier campaign remains in the Chronicle."}
                    </p>
                    <button
                      className="secondary"
                      onClick={() => setCampaignEditing(true)}
                    >
                      Configure campaign
                    </button>
                  </div>
                )}
                {[
                  {
                    id: "duties",
                    title: "Daily Duties",
                    subtitle: "Care for the person behind the armour.",
                  },
                  {
                    id: "training",
                    title: "Training & Study",
                    subtitle:
                      "Build strength, travel further, sharpen your mind.",
                  },
                ]
                  .filter((section) =>
                    campaignQuests.some((q) => q.category === section.id),
                  )
                  .map((section) => (
                    <section className="board-section" key={section.id}>
                      <div className="board-section-heading">
                        <h2>{section.title}</h2>
                        <p>{section.subtitle}</p>
                      </div>
                      <div className="quest-list">
                        {campaignQuests
                          .filter((q) => q.category === section.id)
                          .map((q) => questCard(q, true))}
                      </div>
                    </section>
                  ))}
                <WeeklyTraining state={state} date={today} />
                <p className="board-bottom">
                  <span className="board-motto">By deed, not word</span>
                  Take what serves you. Return when the deed is done.
                </p>
              </div>
            </>
          )}
          {tab === "Knight" && (
            <>
              <div className="knight-profile panel">
                <div className="profile-art">
                  <span className="heraldic-caption">BY DEED, NOT WORD</span>
                  <KnightArt />
                  <div
                    className="rank-insignia"
                    aria-label={`${rank.rank.name} insignia`}
                  >
                    <Shield size={32} />
                    <span>
                      {["I", "II", "III", "IV", "V"][ranks.indexOf(rank.rank)]}
                    </span>
                  </div>
                </div>
                <div className="character-record">
                  <span className="eyebrow">A HERALDIC RECORD</span>
                  <h2>{state.name}</h2>
                  <span className="rank-badge dark">{rank.rank.name}</span>
                  <div className="character-renown">
                    <div className="record-renown-heading">
                      <span>RENOWN EARNED</span>
                      <strong>{total.renown.toLocaleString()}</strong>
                    </div>
                    <div
                      className="progress light"
                      role="progressbar"
                      aria-label="Knight rank progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(rank.progress * 100)}
                    >
                      <i style={{ width: `${rank.progress * 100}%` }} />
                    </div>
                    <p>
                      {rank.next
                        ? `${(rank.next.threshold - total.renown).toLocaleString()} Renown to ${rank.next.name}`
                        : "Knight Banneret · your highest rank, earned."}
                    </p>
                  </div>
                  <p className="record-service">
                    {total.renown} Renown earned across{" "}
                    {state.entries.length +
                      Object.values(state.oaths).filter(
                        (o) => o.status === "kept",
                      ).length}{" "}
                    recorded deeds.
                  </p>
                  <p className="muted">
                    Steel helm · simple armour · oak shield
                  </p>
                </div>
              </div>
              <section className="panel campaign-summary">
                <div className="section-heading">
                  <h2>Your campaign</h2>
                  <button
                    className="text-button"
                    onClick={() => {
                      setCampaignEditing(true);
                      setError("");
                      window.scrollTo({ top: 0 });
                    }}
                  >
                    Configure campaign <ArrowRight size={15} />
                  </button>
                </div>
                <p>
                  {activeGoals.length} active{" "}
                  {activeGoals.length === 1 ? "goal" : "goals"} ·{" "}
                  {activeGoals
                    .map((g) => goalDefinitions[g.id].name)
                    .join(" · ") ||
                    "Your campaign is paused. History remains intact."}
                </p>
              </section>
              <Attributes state={state} />
              <section className="panel">
                <h2>The path to knighthood</h2>
                {ranks.map((r) => (
                  <div
                    className={
                      "rank-row " +
                      (r.name === rank.rank.name
                        ? "current-rank"
                        : total.renown >= r.threshold
                          ? "earned-rank"
                          : "")
                    }
                    key={r.name}
                  >
                    <Shield size={18} />
                    <strong>{r.name}</strong>
                    <span>{r.threshold.toLocaleString()} Renown</span>
                    {total.renown >= r.threshold && <Check size={18} />}
                  </div>
                ))}
              </section>
              <section className="panel">
                <h2>Milestones</h2>
                <p>
                  {total.renown
                    ? "✦ First deed — your campaign is underway."
                    : "Complete your first deed to write the first line of your story."}
                </p>
                {oath.longest >= 7 && (
                  <p>✦ Seven days steadfast — a week-long oath.</p>
                )}
                {total.distance >= 30 && (
                  <p>✦ A road well travelled — 30 km walked.</p>
                )}
              </section>
            </>
          )}
          {tab === "Journey" && (
            <section className="journey panel">
              <span className="eyebrow">THE ROAD TO OAKHAVEN</span>
              <h2>{total.distance.toFixed(1)} km travelled</h2>
              <JourneyMap distance={total.distance} />
              <p className="journey-method">
                {campaignQuests.find((q) => q.id === "patrol")?.target
                  ?.metric === "steps"
                  ? "Your patrol follows a step target. Steps do not convert automatically into distance; previously confirmed kilometres remain on this map."
                  : campaignQuests.find((q) => q.id === "patrol")
                    ? `Complete “Patrol the Realm” after walking your ${campaignQuests.find((q) => q.id === "patrol")!.distance} km target. Confirmed distance is self-reported.`
                    : "Your earlier travels remain here. Enable a walking goal to continue this route."}
              </p>
              <button
                className="primary"
                onClick={() =>
                  campaignQuests.some((q) => q.id === "patrol")
                    ? switchTab("Quest Board")
                    : setCampaignEditing(true)
                }
              >
                {campaignQuests.some((q) => q.id === "patrol")
                  ? "Take a patrol"
                  : "Configure walking goal"}{" "}
                <ArrowRight size={16} />
              </button>
            </section>
          )}
          {tab === "Chronicle" && (
            <>
              <div className="history-stats">
                {[
                  { label: "Renown earned", value: total.renown },
                  {
                    label: "Workouts completed",
                    value: state.entries.filter((e) => e.questId === "training")
                      .length,
                  },
                  { label: "Distance walked", value: `${total.distance} km` },
                  {
                    label: "Deeds recorded",
                    value:
                      state.entries.length +
                      Object.values(state.oaths).filter(
                        (o) => o.status === "kept",
                      ).length,
                  },
                ].map((s) => (
                  <div className="panel" key={s.label}>
                    <span>{s.label}</span>
                    <strong>{s.value}</strong>
                  </div>
                ))}
              </div>
              {(showOath || hasOathHistory) && (
                <section className="panel">
                  <div className="section-heading">
                    <h2>The Oath of Temperance</h2>
                    <Shield size={22} />
                  </div>
                  <div className="history-stats oath-history">
                    {[
                      { label: "Current streak", value: oath.current },
                      {
                        label: "Longest legitimate streak",
                        value: oath.longest,
                      },
                      { label: "Historical sober days", value: oath.sober },
                      {
                        label: "Last 30 days · confirmed days only",
                        value:
                          oath.percentage === null
                            ? "—"
                            : `${oath.percentage}%`,
                      },
                    ].map((s) => (
                      <div key={s.label}>
                        <strong>{s.value}</strong>
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="muted">
                    {oath.logged} days confirmed in the last 30 days. Active
                    Oaths and unlogged days are unknown. Correcting an entry
                    updates its statistics and only its rewards.
                  </p>
                </section>
              )}
              <WeightChronicle
                state={state}
                today={today}
                update={persist}
                configure={() => {
                  setCampaignEditing(true);
                  window.scrollTo({ top: 0 });
                }}
              />
              <WeeklyLedger state={state} date={today} />
              <section className="panel chronicle-ledger">
                <div className="ledger-heading">
                  <BookOpen size={22} />
                  <div>
                    <span className="eyebrow">A PERSONAL CAMPAIGN LEDGER</span>
                    <h2>Your chronicle</h2>
                  </div>
                  <span className="ledger-period">
                    BEGUN{" "}
                    <time dateTime={state.created}>
                      {formatDay(state.created, true)}
                    </time>
                  </span>
                </div>
                {!historyDates.length ? (
                  <div className="empty">
                    <BookOpen size={32} />
                    <h3>A blank page is a beginning.</h3>
                    <p>Your deeds and Oaths will appear here.</p>
                    <button
                      className="text-button"
                      onClick={() => switchTab("Quest Board")}
                    >
                      Write your first entry <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  historyDates.map((date) => {
                    const entries = state.entries.filter(
                        (e) => e.date === date,
                      ),
                      dayOath = state.oaths[date],
                      earned =
                        entries.reduce((n, e) => n + e.reward.renown, 0) +
                        (dayOath?.status === "kept"
                          ? dayOath.reward!.renown
                          : 0);
                    return (
                      <div className="history-day" key={date}>
                        <div className="section-heading">
                          <h3>
                            <time dateTime={date}>{formatDay(date, true)}</time>
                          </h3>
                          <span>{earned} Renown</span>
                        </div>
                        {entries.map((e) => (
                          <div className="history-entry" key={e.questId}>
                            <Check size={15} />
                            <span>
                              {e.deed.name}{" "}
                              <small className="history-criterion">
                                {e.deed.description}
                              </small>
                            </span>
                            <RewardText reward={e.reward} />
                          </div>
                        ))}
                        {dayOath && (
                          <HistoricalOath
                            state={state}
                            date={date}
                            now={now}
                            update={update}
                            report={report}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </section>
              <p className="muted">
                Progress and measurements stay in this browser. Detailed step
                logging remains future work.
              </p>
            </>
          )}
        </main>
        <nav className="mobile-nav" aria-label="Main navigation">
          {tabs.map((t) => (
            <button
              key={t.name}
              className={tab === t.name ? "active" : ""}
              onClick={() => switchTab(t.name)}
            >
              <t.icon size={21} />
              <span>{t.name === "Quest Board" ? "Quests" : t.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
