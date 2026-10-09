# Earned appearance and the Oakhaven road

The character uses detailed, original, generated transparent illustrations rather than the first polygon-style SVG. Five equipment stages follow the existing Squire → Man-at-Arms → Knight Errant → Knight → Knight Banneret rank thresholds. Onboarding, Keep and Knight use the same component and asset registry.

Rank controls clothing, armour, weapons, shield and heraldry. Wisdom controls facial hair independently: clean-shaven initially, short brown beard at level 3, full brown beard at level 6. Each beard stage has its own sheet for all five ranks, with independent build and grooming variants. Wisdom no longer grants the old visual satchel, and Endurance no longer adds the old rolled cloak. Those were placeholders for the new physical-character direction.

Strength provides a gradual, bounded silhouette adjustment (up to 8% width at level 10). Vitality provides a subtle complexion treatment limited to the face (up to 6% brightness / 8% saturation at level 10). Baselines remain healthy and dignified. These presentation rules are centrally configurable in `appearance.ts` and never affect XP, Renown, rank thresholds or saved state. Presence selects well-kept hair and clothing from level 3. An explicit optional weight-plan setting can select body-build artwork only; see `docs/body-appearance.md`. Weight still grants no progression.

Artwork is bundled locally as optimised transparent WebP. Vite fingerprints each asset and the existing worker precaches them, including variants a player has not yet reached. Switching ranks or beard stages therefore works offline. The larger mobile Knight frame makes the detail readable. See `src/assets/knight/README.md` for provenance and limitations.

The existing 0 / 9 / 21 / 30 km route tells an original connected story in four three-paragraph chapters. The Keep chapter is available at departure. Other chapters appear only when actual accumulated distance reaches their landmark, and remain rereadable from Journey. A teaser hints at the next setting without revealing its chapter. Landmark feedback retains a brief inscription, keeping action receipts concise.

Optional appearance settings remain compatible with save v3. No extra rewards, progression adjustments or encounters are introduced. Reopening a reached chapter creates no achievement ceremony.

## Illustrated places and knightly address

Each of the four existing locations has its own original 16:9 scene, bundled as local WebP with the offline shell. Journey shows muted/blurred previews for unreached places without mounting their story text. At the existing distance threshold, its scene is revealed and the latest reached chapter opens on a parchment panel overlapping the lower image. Earlier chapters remain keyboard-accessible and rereadable; their full three paragraphs and road-ahead teasers are preserved.

The existing coordinated action receipt shows a postcard for the furthest newly reached landmark and a Read chapter control. If several landmarks are crossed in one action, every arrival and exact reward remains in the receipt; there is one presentation surface. Reading dismisses that receipt, opens Journey and focuses the latest chapter. Navigation/reload creates no new arrival ceremony. No encounter, reward, distance or save-model changes are introduced. See `src/assets/journey/README.md` for artwork provenance.

Names are displayed with Sir from Knight Errant onward, using the existing configurable rank thresholds. Squire and Man-at-Arms retain the plain name. An existing Sir prefix is not doubled. This display-only honour appears in Keep, Knight and the sidebar; the stored personal name, account-independent avatar initial and all history remain unchanged.
