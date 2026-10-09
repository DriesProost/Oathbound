# Oathbound

A mobile-first self-improvement app. Real-world actions train a grounded medieval knight; a setback is a lost skirmish, not a deleted campaign.

## Development

Node.js 22+ and npm are required.

```sh
npm ci
npm run dev
```

On Windows, open the folder containing `package.json`, type `cmd` in File Explorer's address bar, and run these commands. Open the Local address printed by Vite. Keep that window open while using the app.

Run `npm test` for progression, action timing, Oath correction and persistence/migration tests. Run `npm run build` for TypeScript checking and the production build.

## Structure

- `src/config.ts`: central quest definitions, difficulty, reward snapshots, action timing, rank thresholds and attribute XP curve.
- `src/domain.ts`: pure campaign rules; no browser storage or UI dependencies.
- `src/storage.ts`: validated versioned persistence and safe migration.
- `src/components.tsx`: attribute progress, reward display, Oath lifecycle and historical correction controls.
- `src/App.tsx`: onboarding, Keep, Quest Board, Journey, Knight and Chronicle.
- `src/KnightArt.tsx`: temporary knight illustration.
- `src/style.css`: responsive theme. Oak, parchment, pins and seals are confined to the Quest Board reference pending visual review.

## Progression

Ranks use cumulative Renown: Squire 0, Man-at-Arms 1,000, Knight Errant 3,000, Knight 7,500 and Knight Banneret 15,000. Typical consistent days earn around 120–160 Renown; completing every configured action earns 195. No daily quota is required.

All six attributes start at level 1. Going from level L to L+1 costs `100 + 25 * (L - 1)` additional XP. Lifetime XP is derived from reward snapshots; UI levels and progress are calculated separately. Changing quest rewards does not rewrite completed action rewards. Each action can award multiple attribute XP amounts.

## Timing and the Oath

Workouts, walking, grooming and study can be recorded when performed. Nutrition is confirmed after the centrally configured evening hour (18:00 local time by default). Sleep is retrospective: confirm last night's sleep against the previous date, starting after the first night of the campaign. Active pages refresh the clock and date on focus and every 30 seconds.

Taking an Oath records intention without rewards. Today can be confirmed kept or broken after the evening hour. Yesterday can be confirmed retrospectively, and older recorded Oaths can be corrected in Chronicle. There is no expiry or automatic success/failure. Only confirmed kept Oaths count as sober; taken and unlogged days remain unknown. Recent percentages use confirmed days only and show the denominator.

Correcting kept → broken removes exactly that record's stored reward; it does not touch other actions or dates. Correcting broken → kept grants the current configured Oath reward once. Repeated confirmations are idempotent. Streak statistics are recalculated from corrected history: legitimate earlier streaks remain, while an incorrectly recorded success no longer inflates a streak.

## Local saves and migration

No account or backend is required. Progress stays in this browser; clearing site data removes it.

Version 2 uses `oathbound.knight.v2`. Before migrating a valid version-1 save, the exact original is retained at `oathbound.knight.v1.backup`, and the original `oathbound.knight.v1` key is left untouched. An existing backup is never overwritten. Invalid saves or failed backup writes stop migration without replacing the original. A corrupt version-2 save does not silently fall back to an older campaign.

Legacy action points become attribute XP, preserving original legitimate reward amounts. Existing rank/attribute displays may decrease under the slower progression model. Legacy rewards attached to an already-broken Oath are removed for that record only, following the corrected reward policy. The app explains this during migration. Historical walking distance is retained.

Fixed quests and a basic illustration remain. Audio, custom quests, accounts, sync, weight logging, detailed steps, wearables, equipment customisation and keep-building are deferred. Remote fonts are optional; system and Georgia fallbacks work offline.
