# Daily Ventures

An optional authored challenge is offered on each local date the player visits Oathbound. Nothing is backfilled for absent days. Ignored notices have no penalty, streak or Chronicle entry.

## Content and selection

Add a data object to `src/ventures.ts` with a stable ID, title, primary attribute, tier, duration, introduction, instructions and tags. Optional steps appear after the instruction ending in a colon; a steps-only Venture uses a numbered sequence. Reading, reflection and adaptation notes are optional. Wisdom reading is local authored text, with no quiz or required answer. Keep IDs stable when editing content; retire a definition by removing it from the library. Existing assignments retain their entire content. The library now contains 60 Ventures: the original 12 plus eight additions led by each attribute. The additions include eight original Wisdom lessons of 150–400 words.

Set optional `secondaryAttributes` when the activity meaningfully develops more than one attribute. Keep them distinct from one another and from the primary attribute. The primary attribute remains the category used to balance the daily rotation; all attributes are displayed on Keep, Quest Board and Chronicle.

`ventureTiers` is the only reward and difficulty weight configuration: Brief 30 Renown / 60 XP (45%), Standard 45 / 80 (40%), Bold 65 / 100 (15%). A Venture shares its tier's total XP between its attributes; Renown is still awarded once. For example, Standard Strength + Endurance grants 45 Renown, 40 Strength XP and 40 Endurance XP. Integer division puts any remainder into the earlier attributes, primary first (Standard with three attributes: 27 + 27 + 26 XP). Single-attribute Ventures receive the full tier XP. These larger pools make even a two-attribute Brief Venture worth 30 XP in each attribute, above ordinary deeds (8–20 XP) and the Oath (25 XP). Previously persisted assignments and completion receipts retain their original reward snapshots.

Selection first applies suitability constraints: prefer no overlap with the previous Venture's attributes where possible, then fall back to a different primary attribute, exclude today's already offered IDs, and allow at most two Bold assignments in seven local dates (including set-aside notices). Prefer IDs outside the last 14 assignments; then draw a weighted available tier and prefer less represented recent primary attributes, counting all attributes on recent notices when measuring representation. An exhausted suitable pool uses its least recently offered ID. Constraints and the available library can shift observed tier proportions from the nominal weights.

Selection is pure and reproducibly seeded from campaign identity, date and assignment count; it is called on assignment/replacement, not render. The complete snapshot is persisted before exposing a successful action. Refresh never selects a replacement. A single explicit replacement sets aside the first notice and links its successor. Completion requires the currently active assignment ID and current local date. Neither old nor replaced notices can complete, and completed notices cannot be replaced.

## Rewards and saves

State v4 adds `ventures` to the existing model. Each assignment has the stable definition ID, assignment ID, local date, full authored snapshot, tier-derived reward snapshot, status, replacement information and optional completion timestamp. Completion adds the shared domain `RewardGrant` receipt, with a distinct Venture activity/award identity and no ordinary goal ID. `totals` sums those receipts with existing deed, Oath and commission receipts; there is no separate progression counter. A Venture does not consume a deed's daily reward slot, advance a weekly training commission or add Journey distance. A genuinely qualifying ordinary deed can be recorded independently.

The v3 → v4 migration validates existing data and changes only `version` plus an empty Venture list. It invents no historical assignments and retains all previous fields. Loading creates an exact original-byte backup at `oathbound.knight.v3.ventures.backup` before committing `oathbound.knight.v4`, leaving the v3 key intact. Existing backups are retained. Invalid newer saves never fall back to older ones, and backup failure prevents the v4 write. The v1/v2 and older v3 weekly upgrade paths remain supported. Secondary attributes are an optional v4 field; existing single-attribute v4 snapshots require no migration and retain their exact rewards. Validation checks snapshot content, one replacement, completion timestamps, unique identities, distinct primary/secondary attributes and matching XP keys independently of the current authored library.

## Presentation and offline behavior

Quest Board owns a pinned Venture notice and accessible native modal, including lessons, optional reflection and self-reported completion. Keep has a compact teaser. Chronicle renders only completed snapshots in its Venture ledger. Completion enters the existing single feedback surface, ordered after rank, landmark/commission and attribute level, before ordinary deeds/Oaths and reward. Assignments and replacements are quiet; reload has no event to replay, and navigation dismisses an active ceremony.

All definitions and lessons are bundled into the precached application shell. The service worker ignores response `Vary` headers when matching its known immutable static assets, because browser module requests and precache requests can carry different Origin headers. This prevents a cached script from falling back to network on an offline reload. No Venture uses a service, GPS, wearable or generated text.

## Verification

Run `npm test` and `npm run build`. `scripts/daily-ventures-smoke.cjs` exercises a real browser with isolated fixtures, 320/390/768/1440px layouts, a Wisdom lesson, coordinated rank/level/Venture feedback, no replay on navigation/reload, replacement persistence, local rollover and completed-only Chronicle. It also loads the production service worker, switches the browser offline and reads/completes/reloads a Wisdom Venture.

To run the browser check, start the development server on port 5173 and preview the production build on port 4173, then run `node scripts/daily-ventures-smoke.cjs`. `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, `DEV_URL` and `PWA_URL` can select local browser tooling and server locations.

Stage 2D remains deferred. No custom ordinary deeds, generated quests, remote content, leaderboards, proof verification, streaks or skipping penalties are added.
