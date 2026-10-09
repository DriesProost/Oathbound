# Oathbound

A mobile-first self-improvement app. Real-world actions train a grounded medieval knight; a setback is a lost skirmish, not a deleted campaign.

## Development

Node.js 22+ and npm are required.

```sh
npm ci
npm run dev
```

On Windows, open the folder containing `package.json`, type `cmd` in File Explorer's address bar, and run these commands. Open the Local address printed by Vite. Keep that window open while using the app.

Run `npm test` for campaign goals, targets, weekly boundaries/snapshots, reward slots, progression, action timing, Oath correction and persistence/migration tests, plus kg conversion, weight editing, sparse trends and outcome-isolation checks. Run `npm run build` for TypeScript checking and the production build.

## Structure

- `src/config.ts`: central quest definitions, difficulty, reward snapshots, action timing, rank thresholds and attribute XP curve.
- `src/model.ts`: v3 save, campaign, activity and separate outcome types.
- `src/campaign.ts`: goal catalogue, target validation, dated configuration revisions and goal-driven deeds.
- `src/calendar.ts`: local calendar keys, validation and configurable week boundaries.
- `src/weekly.ts`: weekly commission snapshots, prospective targets and unique activity links.
- `src/WeeklyTraining.tsx` / `src/weekly.css`: pinned weekly commission and Chronicle ledger.
- `src/domain.ts`: pure progression and confirmation rules; no browser storage or UI dependencies.
- `src/CampaignEditor.tsx`: independent goal → target → review flow, shared by onboarding and campaign editing.
- `src/campaign.css`: campaign parchment, form and responsive presentation.
- `src/storage.ts`: validated versioned persistence and safe migration.
- `src/weight.ts`: exact kg/gram boundaries, independent outcome CRUD, baseline/target calculations and sparse seven-day averages.
- `src/WeightChronicle.tsx`, `src/WeightChart.tsx`, `src/WeightSettingsFields.tsx`: manuscript tracker, measurement chart and reusable optional setup fields.
- `src/weight.css`: responsive weight ledger and forms.
- `src/components.tsx`: attribute progress, reward display, Oath lifecycle and historical correction controls.
- `src/App.tsx`: onboarding, Keep, Quest Board, Journey, Knight and Chronicle.
- `src/KnightArt.tsx`: temporary knight illustration.
- `src/style.css`: base responsive layout and interface styles.
- `src/materials.css`: shared parchment, oak, iron, wax and heraldic visual language.
- `src/presentation.ts`: localized display dates; stored date keys remain unchanged.
- `src/JourneyMap.tsx`: illustrated route presentation derived from existing walking distance.

## Progression

Ranks use cumulative Renown: Squire 0, Man-at-Arms 1,000, Knight Errant 3,000, Knight 7,500 and Knight Banneret 15,000. Typical consistent days earn around 120–160 Renown; completing every configured action earns 195. No daily quota is required.

All six attributes start at level 1. Going from level L to L+1 costs `100 + 25 * (L - 1)` additional XP. Lifetime XP is derived from reward snapshots; UI levels and progress are calculated separately. Changing quest rewards does not rewrite completed action rewards. Each action can award multiple attribute XP amounts.

## Timing and the Oath

Workouts, walking, grooming and study can be recorded when performed. Nutrition is confirmed after the centrally configured evening hour (18:00 local time by default). Sleep is retrospective: confirm last night's sleep against the previous date, starting after the first night of the campaign. Active pages refresh the clock and date on focus and every 30 seconds.

Swearing an Oath records intention without rewards. Today can be confirmed kept or broken after the evening hour. Yesterday can be confirmed retrospectively, and older recorded Oaths can be corrected in Chronicle. There is no expiry or automatic success/failure. Only confirmed kept Oaths count as sober; taken and unlogged days remain unknown. Recent percentages use confirmed days only and show the denominator.

Correcting kept → broken removes exactly that record's stored reward; it does not touch other actions or dates. Correcting broken → kept grants the current configured Oath reward once. Repeated confirmations are idempotent. Streak statistics are recalculated from corrected history: legitimate earlier streaks remain, while an incorrectly recorded success no longer inflates a streak.

## Local saves and migration

No account or backend is required. Progress stays in this browser; clearing site data removes it.

Version 3 uses `oathbound.knight.v3`. Valid v2 and v1 saves migrate automatically. The exact source is backed up at `oathbound.knight.v2.backup` or `oathbound.knight.v1.backup` before v3 is written. Source keys and existing backups are never overwritten. Invalid saves and failed backup writes stop migration; corrupt newer saves never silently fall back to older campaigns.

Legitimate historical reward amounts, XP, dates, Oaths and walking distances remain unchanged. Migration adds stable activity IDs and daily reward slots. Old targets were not stored: migrated deeds explicitly show that their original target is unknown, instead of inventing a quantity. Existing behaviour goals stay enabled and weight remains off. Legacy v1 rewards already attached to a broken Oath are corrected for that entry only, following the existing policy. Weight history starts empty.

## Personal campaigns — Stage 2A

New players enter a knight name, choose goals, configure targets and review the deeds before saving. No goals are preselected. Existing players use **Knight → Configure campaign**. The editor is a standalone component; its settings belong to the campaign, separate from the knight profile. Cancel discards the draft. Goals can be changed or paused without erasing earned history.

Only selected behaviours produce default deeds. Walking supports 3/5 km presets, custom kilometres or steps; study supports minutes/pages; sleep supports a personal criterion or hours. Training, nutrition and personal care use editable completion criteria. Strength also has a weekly target of 1–7 sessions. These are self-reported confirmations of meeting a criterion, not automatic tracking or incremental quantity logging.

Rewards are fixed per template and remain unchanged by larger targets. Each goal shares one reward slot per local date, so changing targets or templates cannot award again that day. Completed deeds snapshot their criterion and reward. Dated campaign revisions preserve previous-day sleep criteria; sleep starts after the first night with that goal. Disabling temperance blocks new current-day Oaths while corrections to existing recorded Oaths remain available.

A confirmed kilometre patrol records its selected distance on Journey. Steps never imply kilometres. Previously recorded distance is retained when switching targets or disabling walking. Unlogged dates remain unknown.

`progression.rewardBudget` centrally retains the possible future ordinary/Oath budget, with `enabled: false`. No global reward ceiling is enforced. Outcome settings and records are independent of reward-bearing deeds; body-weight data never contributes to Renown, attribute XP or Oath streaks. Selecting Weight Management enables its separate Chronicle tracker. Optional starting weight and target can be configured during campaign setup or left for later. No measurements are fabricated.

## Weekly commissions — Stage 2B

Strength training supports a configurable 1–7 sessions/week target, defaulting to 3. **Knight → Configure campaign → Targets** edits it. The daily Training Yard deed remains available on chosen training days. At most one training completion per local date advances both the daily deed and weekly commission. Completing a commission grants no extra Renown or attribute XP; additional training days retain only their ordinary daily reward.

Local weeks run Monday–Sunday. `campaignRules.weekStartsOn` centrally configures the default start rule. Campaigns retain their chosen rule so changing a future default cannot regroup existing periods. Each commission stores a stable ID, period kind/start/end/week-rule snapshot, target snapshot and unique activity IDs. Each activity has a separate daily reward receipt/slot; totals use daily receipts and kept Oaths, never weekly commissions. Historical criteria, rewards and periods remain unchanged.

Weekly target edits take effect from the **following Monday**, including edits made on a Monday. Daily goal activation and criteria still take effect immediately. The editor and board explain the current target and pending target. There is no “apply to this week” override. Pausing strength preserves the current commission and earlier records; inactive future weeks receive no new commission. Re-enabling opens the current period prospectively using its applicable target. Only actual recorded training days count.

Quest Board shows a compact pinned **This Week** notice. Chronicle lists closed commissions, including incomplete results, without failure labels or penalties. Opening/revisiting the app creates the applicable active commission; week rollover also refreshes on focus or the usual clock tick. Unvisited weeks are not fabricated as empty results.

Existing 2A saves receive an additive v3 upgrade. Before changing the current save, its exact bytes are retained at `oathbound.knight.v3.2a.backup`; existing backups are never overwritten. Rewards, goal choices, criteria, Oaths, distance and outcome data are preserved. The new default weekly target begins in the current local week, counting existing actual training days in that week. Earlier closed weeks have no invented targets or results. Invalid/partial newer schemas and failed backup writes leave the source untouched.

## Weight Chronicle — Stage 2C

Enable **Weight Management** in **Knight → Configure campaign**, then open **Chronicle**. Campaign setup defaults to **Set this up later**; the optional short form can set a dated starting weight and target without inventing measurements. Chronicle provides date + kg entry (today by default, past dates allowed), optional starting/target settings and actual dated history. No weighing deed is added to the Quest Board.

All values are positive safe integer grams internally. Decimal kg input is parsed using integer arithmetic, with up to three fractional places; 87.45 kg stores exactly 87,450 g. Forms accept decimal points or commas without thousands separators and use broad 0.1–1,000 kg guardrails; the domain itself has no narrow human-weight bounds. Stage 2C displays and accepts kg only.

The first weigh-in leaves baseline unset and offers **Use this as my starting weight** explicitly. A manually configured starting weight is independent of the measurements: editing/deleting its source entry never changes it silently. Baseline and target are optional; target may be above or below baseline. Current summaries show actual latest weight, signed change since starting weight, target distance and direction-aware baseline-to-target span. Equal baseline/target uses distance without division by zero. Passing a target preserves the factual distance while clamping only the displayed span. Measurements earlier than the starting date are retained without claiming a change since that later baseline.

One weigh-in is allowed per local date. Adding another on an occupied date asks for explicit replacement; confirming preserves the existing ID and creation timestamp. Editing retains identity and can move a date, but an occupied destination is rejected without merging entries. Deletion needs confirmation and removes only that measurement. Valid timestamps and unique IDs/dates are checked at persistence boundaries.

The chart keeps authoritative raw points visible. Seven-day averages are calculated only from actual observations in each recorded date’s inclusive trailing seven calendar days (that date plus six preceding dates), and appear only with at least three observations. There are no synthetic dates, filled-in observations or saved derived values. Dashed average segments break across unsupported observation windows or long gaps; sparse histories still show raw measurements.

Disabling the goal retains every measurement and setting in a collapsed read-only ledger; re-enabling restores normal controls and history unchanged. Weight operations persist independently and never award Renown, XP, rank progress, weekly bonuses, achievements or weighing streaks. They preserve campaign configuration, deed receipts, Oaths, weekly activity links and Journey distance.

The existing v3 schema already supports this tracker: no new save version or migration is needed. Valid pre-existing weight data remains intact, and old empty trackers remain empty until the player records a measurement or explicitly sets a baseline. Existing migration and backup policies continue unchanged.

Stop for review after 2C. Lb support (2D) and custom deeds are not implemented. Audio, accounts, sync, wearables, calorie databases, equipment customisation and keep-building remain deferred. Remote fonts are optional; system and Georgia fallbacks work offline.

## Earned feedback polish

Recording a deed now creates one coordinated receipt with exact Renown and attribute XP, plus any newly earned levels, weekly commission, Journey landmarks or knight rank. The highest milestone leads the ceremony; every consequence remains visible. Renown and XP advance smoothly, while reduced motion shows final values immediately. Reloading or revisiting a notice does not replay ceremonies. Oath corrections show the exact entry adjustment calmly; broken Oaths remain silent. Weight entries stay independent and use only a quiet ledger confirmation.

The persistent **Sound** speaker control manages optional generated effects, volume and independently optional brief haptics. Sound starts **unset** and silent. After the first recorded deed/Oath, a one-time offer lets you enable and preview effects or decline. Your choice is saved separately from the campaign. Even when enabled, sound waits for a user gesture on each visit. There is no background music.

See [feedback design and audio provenance](docs/feedback.md). `npm test` includes event ordering, threshold detection, correction isolation, device failures and preference persistence. The optional `scripts/feedback-smoke.cjs` checks browser behavior against a running Vite server and requires externally supplied Playwright/Chromium; `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH` and `OATHBOUND_URL` can specify those paths and the development server. Stage 2D remains deferred.

## Mobile field testing and PWA

Oathbound now includes an owned heraldic icon, install manifest and production-only offline shell. Keep offers **Add to home screen**; new builds show **Update & reload** rather than refreshing an unfinished entry automatically. Phone navigation, touch targets, keyboard/type sizing, safe-area spacing and short landscape layouts have been refined. Existing campaign data still uses the same local persistence model.

For phone installation, publish the production `dist` directory over HTTPS, open it online once, then install from Keep or your browser menu. Check Chronicle in the installed app before logging there: some platforms keep its storage separate. See [mobile field-test instructions and update behavior](docs/mobile-field-test.md). The optional `scripts/mobile-pwa-smoke.cjs` verifies layouts, installability, offline startup and save preservation. Stage 2D remains deferred.

### Publish for Android installation

The **Publish Oathbound** GitHub Actions workflow builds for `https://driesproost.github.io/Oathbound/` and publishes the tested production shell to GitHub Pages. Enable it once in repository **Settings → Pages → Source → GitHub Actions**, then open **Actions → Publish Oathbound → Run workflow**. Wait for a successful deployment before opening that address on your phone. Future main-branch pushes publish updates automatically.

On Android, open the address in Chrome, choose **⋮ → Install app / Add to home screen → Install**, then launch the Oathbound icon. Progress is stored on that phone/browser; existing Windows localhost progress does not automatically transfer to the new address.
