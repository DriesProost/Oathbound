# Oathbound

A mobile-first self-improvement app. Real-world actions train a grounded medieval knight; a setback is a lost skirmish, not a deleted campaign.

## Development

Node.js 22+ and npm are required.

```sh
npm ci
npm run dev
```

On Windows, open the folder containing `package.json`, type `cmd` in File Explorer's address bar, and run these commands. Open the Local address printed by Vite. Keep that window open while using the app.

Run `npm test` for campaign goals, targets, reward slots, progression, action timing, Oath correction and persistence/migration tests. Run `npm run build` for TypeScript checking and the production build.

## Structure

- `src/config.ts`: central quest definitions, difficulty, reward snapshots, action timing, rank thresholds and attribute XP curve.
- `src/model.ts`: v3 save, campaign, activity and separate outcome types.
- `src/campaign.ts`: goal catalogue, target validation, dated configuration revisions and goal-driven deeds.
- `src/calendar.ts`: local calendar keys and date validation.
- `src/domain.ts`: pure progression and confirmation rules; no browser storage or UI dependencies.
- `src/CampaignEditor.tsx`: independent goal → target → review flow, shared by onboarding and campaign editing.
- `src/campaign.css`: campaign parchment, form and responsive presentation.
- `src/storage.ts`: validated versioned persistence and safe migration.
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

Only selected behaviours produce default deeds. Walking supports 3/5 km presets, custom kilometres or steps; study supports minutes/pages; sleep supports a personal criterion or hours. Training, nutrition and personal care use editable completion criteria. Weekly workout targets are reserved for 2B. These are self-reported confirmations of meeting a criterion, not automatic tracking or incremental quantity logging.

Rewards are fixed per template and remain unchanged by larger targets. Each goal shares one reward slot per local date, so changing targets or templates cannot award again that day. Completed deeds snapshot their criterion and reward. Dated campaign revisions preserve previous-day sleep criteria; sleep starts after the first night with that goal. Disabling temperance blocks new current-day Oaths while corrections to existing recorded Oaths remain available.

A confirmed kilometre patrol records its selected distance on Journey. Steps never imply kilometres. Previously recorded distance is retained when switching targets or disabling walking. Unlogged dates remain unknown.

`progression.rewardBudget` centrally retains the possible future ordinary/Oath budget, with `enabled: false`. No global reward ceiling is enforced. Outcome settings and records are independent of reward-bearing deeds; body-weight data never contributes to Renown, attribute XP or Oath streaks. Selecting weight management currently saves that goal and clearly explains that tracker UI arrives in 2C. No measurements are fabricated.

Stop for review after 2A. Weekly periods/training targets (2B), kg weight tracking (2C), lb support (2D) and custom deeds are not implemented. Audio, accounts, sync, wearables, calorie databases, equipment customisation and keep-building remain deferred. Remote fonts are optional; system and Georgia fallbacks work offline.
