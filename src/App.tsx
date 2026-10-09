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
  quests,
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
import KnightArt from "./KnightArt";
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
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  function update(next: State) {
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
                update(createKnight(name));
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
        (e) => e.date === date && e.questId === q.id,
      ),
      completed = !!recorded;
    const allowed = date >= state!.created && canConfirm(date, q.timing, now),
      Icon = icons[Object.keys(q.reward.xp)[0] as keyof typeof icons];
    const timing =
      q.timing === "end-of-day"
        ? `Confirm after ${String(progression.eveningConfirmationHour).padStart(2, "0")}:00`
        : q.timing === "retrospective"
          ? `Previous night · ${date}`
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
            <h3>{q.name}</h3>
            {material && <span className="difficulty">{q.difficulty}</span>}
          </div>
          <p>{q.description}</p>
          <RewardText reward={recorded?.reward || q.reward} />
          <small className="quest-timing">
            {date < state!.created
              ? "Available after your first night on campaign"
              : completed
                ? `Recorded · ${date}`
                : timing}
          </small>
        </div>
        <button
          className={"complete-button " + (completed ? "checked" : "")}
          disabled={completed || !allowed}
          aria-label={completed ? `${q.name} completed` : `Complete ${q.name}`}
          onClick={() => finish(q, date)}
        >
          {completed ? (
            <>
              <Check size={18} />
              <span>Sealed</span>
            </>
          ) : !allowed ? (
            "Later"
          ) : q.timing === "immediate" ? (
            "Complete"
          ) : (
            "Confirm"
          )}
        </button>
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
              {now.toLocaleDateString("en-GB", {
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
          className={"content " + (tab === "Quest Board" ? "board-page" : "")}
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
                  Attribute points are now XP, and ranks follow the slower
                  campaign curve. Legitimate rewards remain unchanged. Any
                  reward attached to a previously broken Oath was corrected for
                  that entry only. An untouched copy of your original save is
                  retained in this browser.
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
                  <span className="eyebrow">YOUR KNIGHT</span>
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
                  <KnightArt />
                  <span>STEADY IN PURPOSE</span>
                </div>
                <div className="hero-quote">
                  Your keep is quiet.
                  <br />
                  Your story is just beginning.
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
                    {quests
                      .filter((q) => q.timing === "immediate")
                      .slice(0, 3)
                      .map((q) => questCard(q))}
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
                <OathPanel
                  state={state}
                  now={now}
                  update={update}
                  report={report}
                />
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
                ].map((section) => (
                  <section className="board-section" key={section.id}>
                    <div className="board-section-heading">
                      <h2>{section.title}</h2>
                      <p>{section.subtitle}</p>
                    </div>
                    <div className="quest-list">
                      {quests
                        .filter((q) => q.category === section.id)
                        .map((q) => questCard(q, true))}
                    </div>
                  </section>
                ))}
                <p className="board-bottom">
                  Take what serves you. Return when the deed is done.
                </p>
              </div>
            </>
          )}
          {tab === "Knight" && (
            <>
              <div className="knight-profile panel">
                <div className="profile-art">
                  <KnightArt />
                </div>
                <div>
                  <span className="eyebrow">YOUR CHARACTER</span>
                  <h2>{state.name}</h2>
                  <span className="rank-badge dark">{rank.rank.name}</span>
                  <p>
                    {total.renown} Renown earned across{" "}
                    {state.entries.length +
                      Object.values(state.oaths).filter(
                        (o) => o.status === "kept",
                      ).length}{" "}
                    recorded deeds.
                  </p>
                  <p className="muted">
                    Starting equipment: steel helm, simple armour, oak shield.
                    Appearance customisation will come in a later chapter.
                  </p>
                </div>
              </div>
              <Attributes state={state} />
              <section className="panel">
                <h2>The path to knighthood</h2>
                {ranks.map((r) => (
                  <div className="rank-row" key={r.name}>
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
              <Map size={60} />
              <h2>{total.distance.toFixed(1)} km travelled</h2>
              <p>
                Complete “Patrol the Realm” after walking 3 km to move along the
                road. Distance is self-reported; wearable tracking comes later.
              </p>
              <div className="road">
                {[
                  { name: "Your keep", km: 0 },
                  { name: "Old Mill", km: 9 },
                  { name: "Wayfarer’s Inn", km: 21 },
                  { name: "Oakhaven", km: 30 },
                ].map((l) => (
                  <div
                    key={l.name}
                    className={total.distance >= l.km ? "reached" : ""}
                  >
                    <span>◆</span>
                    <strong>{l.name}</strong>
                    <small>{l.km} km</small>
                  </div>
                ))}
              </div>
              <div className="progress light">
                <i
                  style={{
                    width: `${Math.min(total.distance / 30, 1) * 100}%`,
                  }}
                />
              </div>
              <button
                className="primary"
                onClick={() => switchTab("Quest Board")}
              >
                Take a patrol <ArrowRight size={16} />
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
              <section className="panel">
                <div className="section-heading">
                  <h2>The Oath of Temperance</h2>
                  <Shield size={22} />
                </div>
                <div className="history-stats oath-history">
                  {[
                    { label: "Current streak", value: oath.current },
                    { label: "Longest legitimate streak", value: oath.longest },
                    { label: "Historical sober days", value: oath.sober },
                    {
                      label: "Last 30 days · confirmed days only",
                      value:
                        oath.percentage === null ? "—" : `${oath.percentage}%`,
                    },
                  ].map((s) => (
                    <div key={s.label}>
                      <strong>{s.value}</strong>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
                <p className="muted">
                  {oath.logged} days confirmed in the last 30 days. Active Oaths
                  and unlogged days are unknown. Correcting an entry updates its
                  statistics and only its rewards.
                </p>
              </section>
              <section className="panel">
                <h2>Your chronicle</h2>
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
                            {new Date(date + "T12:00:00").toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </h3>
                          <span>{earned} Renown</span>
                        </div>
                        {entries.map((e) => (
                          <div className="history-entry" key={e.questId}>
                            <Check size={15} />
                            <span>
                              {quests.find((q) => q.id === e.questId)?.name ||
                                e.questId}
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
                Progress stays in this browser. Weight and detailed step logging
                remain future work.
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
