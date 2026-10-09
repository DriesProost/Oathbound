# Stage 2 proposal: a personal campaign

Status: approved with amendments. Stages 2A, 2B and 2C are implemented. Stage 2C is awaiting kg-tracker review; 2D and custom deeds remain unimplemented.

Approved amendments: retain the centrally configured reward-budget concept but leave it disabled; use per-goal/daily reward slots for now. Outcome data, weigh-ins and target attainment never award progression or create punitive streaks. Campaign editing remains independent of the Knight domain. Stages 2A and 2B have been approved. Stop after 2C for review and stop again before custom deeds.

The campaign should follow the player's real goals. Daily rewards remain immediate, attributes grow through repeated behaviours, and ranks remain long-term milestones. Missing a day or disabling a goal never deletes history.

## 1. Campaign-goal model

Introduce a `CampaignGoal` with a stable ID, goal kind, active/archived state, effective configuration date, target and linked deed definitions. Supported goal kinds are weight management, temperance, strength training, walking/cardio, nutrition, personal care, reading/study and sleep/recovery.

Keep four concepts separate:

- A goal explains what the player is working toward.
- A deed definition describes a controllable action, its target, cadence, confirmation timing and reward policy.
- An activity record stores what happened and when. Its reward/title/target snapshots preserve history.
- A tracker stores outcomes such as body weight, independently of rewards.

Active goals determine available default deeds. Weight management enables its tracker and can suggest nutrition or walking; it does not automatically enrol the player in those behaviours. Temperance retains its special Oath lifecycle. Archived goals and deed definitions remain available to historical records.

## 2. Onboarding and configuration

Keep knight creation, then add a short goal-selection step and a review of applicable targets. Allow sensible behaviour defaults and defer optional weight details. Avoid a long health questionnaire.

Existing players can configure their campaign from Knight, using the same compact editor. Preview which deeds will appear before saving. Changes apply prospectively; editing or disabling a goal never reinterprets historical rewards. Current weekly targets stay fixed until the next week. The explicit active-week override is deferred; edits start the following Monday.

## 3. Daily deeds and weekly goals

Keep today's opportunities separate from a small “This week” section. Daily habits can be confirmed once per local date; a weekly target such as three workouts accumulates completed sessions throughout the week. The workout action remains available on days the player chooses to train, without making every untrained day a failure.

One activity can advance the daily record and weekly target, but receives one reward award. Do not add a weekly completion bonus initially. Stage 2B amendment: at most one training completion per local date advances the weekly target. Multiple same-day sessions are deferred. Use Monday–Sunday local calendar weeks by default, configured centrally, and snapshot each record's period start so later settings changes do not regroup history.

Unlogged days remain unknown. An unmet weekly target is simply recorded as progress made, not a penalty or broken streak.

## 4. Configurable targets

Use a typed target union rather than free-text numbers:

- Distance: kilometres, with presets 3 and 5 km and a custom positive target.
- Steps: a manually entered daily count; no automatic tracking or assumed conversion to distance.
- Reading: minutes or pages; one selected metric per deed.
- Training: sessions per week, with completion criteria for a workout.
- Sleep: hours for the previous night, retaining retrospective confirmation.
- Nutrition/personal care: a clear player-defined confirmation criterion. Nutrition remains end-of-day; there is no calorie lookup database.
- Temperance: the existing daily Oath, with no adjustable reward loophole.

A target includes its metric, unit, value or criterion, comparison rule and cadence. Distance, steps and reading quantities can accumulate within their period; award once when the criterion is met, with further logs updating totals without another award. Sleep is one retrospective measurement per night rather than an accumulated daily quantity. Validate values and show the criterion before confirmation. Future target changes do not rewrite completed records. Steps only move Journey when actual distance is also manually recorded; never invent a stride length.

## 5. Custom deeds and progression protection

Initially attach custom deeds to an existing campaign goal. Let the player set title, criterion, timing, cadence and difficulty. Derive the attribute from the goal, and derive rewards centrally from difficulty; do not expose arbitrary Renown or XP fields.

Suggested tiers remain light 15 Renown / 8 XP, moderate 25 / 15 and substantial 35 / 20, with total XP bounded even if split between attributes later. Existing template rewards retain their tuned values.

Default and custom deeds for the same goal share one daily reward slot. An activity can fulfil multiple targets, but its award is unique. Temperance cannot be recreated as a normal immediately completable custom deed.

Recommend a centrally configured ceiling of 160 ordinary-deed Renown per local date, with 40 reserved for the Oath, for a maximum of 200. Before confirming an extra deed that exceeds the remaining budget, explain that it can be recorded without extra game rewards. Never silently clip a promised reward, remove existing awards or apply caps retroactively. Amendment: this ceiling is disabled during this phase. Revisit it when custom deeds are reviewed; do not clip current or historical rewards.

Keep rank thresholds initially. Players with fewer goals will progress more slowly; do not manufacture extra XP to equalise campaigns. Review pacing after observing the new goal mix.

## 6. Body-weight model and UX

Use separate `WeightSettings` and `WeighIn` records:

- Settings: display unit, optional dated baseline, optional target weight.
- Weigh-in: stable ID, local date, integer grams, creation/update timestamps.

Store a canonical value in grams; convert kg/lb at input and display boundaries. Switching units must not repeatedly convert stored records. Start the smallest implementation with kg, keeping the model ready for lb support.

Provide a quick dated entry form, editable past entries and one weigh-in per date. Replacing an existing date requires explicit confirmation. Starting and target weights are optional. Offer to use the first weigh-in as the baseline, without silently inventing one.

Chronicle shows actual dated points, latest measurement and change over time. A seven-day average may be shown alongside raw points when enough observations exist; missing days are never filled with fabricated measurements. When baseline and target exist, show distance remaining and direction-aware progress toward the target. Handle loss and gain consistently; when target equals baseline, show the difference from target rather than dividing by zero. Without a baseline or target, show the trend without a percentage.

Neither weigh-ins nor weight changes award Renown or attribute XP. No judgemental red/green weight-loss scoring, required daily weigh-ins or success streaks. Rewards continue to come from controllable behaviour deeds.

## 7. Save migration

Propose save version 3 with campaign goals, versioned deed definitions, stable activity/period IDs, target snapshots, unit preferences and an initially empty weigh-in collection. Keep the special Oath records and their reward-correction semantics.

For existing players, enable the behaviour goals corresponding to their current default deeds, preserving their current board until they choose changes. Weight tracking remains opt-in. Map existing quest IDs to archived/preserved template definitions. Retain every legitimate reward snapshot, attribute XP, date, oath status and walking distance; do not enforce new budgets on historical entries.

Preserve exact source saves before writing version 3. Version-1 users pass through pure validated migrations without losing the existing original backup. Keep version-2 data and its original backup untouched. Validate the complete migrated state before selecting the new save; failed migration must not replace or reset a campaign. Never invent weight history, calorie data or activity quantities that were not logged.

## 8. Implementation order

1. Add domain types, target validation, stable activity/period identity and migration tests.
2. Add goal selection/configuration and goal-driven default deeds, retaining existing local history.
3. Add weekly workout targets and daily/weekly roll-ups without duplicate rewards.
4. Add the dedicated weight tracker in kg, then dated Chronicle trend and target progress.
5. Add lb input/display and conversion tests.
6. Add bounded custom deeds after the reward-budget policy is approved.
7. Validate corrections, time boundaries, target revisions, migrations, browser persistence and mobile layouts.

Keep domain, persistence, presentation and theme separate. Each increment remains runnable. Accounts, sync, wearable integration, calorie databases, social features, AI coaching and audio remain outside this phase.
