# Earned appearance and the Oakhaven road

The character uses detailed, original, generated transparent illustrations rather than the first polygon-style SVG. Five equipment stages follow the existing Squire → Man-at-Arms → Knight Errant → Knight → Knight Banneret rank thresholds. Onboarding, Keep and Knight use the same component and asset registry.

Rank controls clothing, armour, weapons, shield and heraldry. Wisdom controls facial hair independently: clean-shaven initially, short brown beard at level 3, full brown beard at level 6. Each beard stage has its own illustration for all five ranks. Wisdom no longer grants the old visual satchel, and Endurance no longer adds the old rolled cloak. Those were placeholders for the new physical-character direction.

Strength provides a gradual, bounded silhouette adjustment (up to 8% width at level 10). Vitality provides a subtle complexion treatment limited to the face (up to 6% brightness / 8% saturation at level 10). Baselines remain healthy and dignified. These presentation rules are centrally configurable in `appearance.ts` and never affect XP, Renown, rank thresholds or saved state. No weights or outcomes influence the artwork.

Artwork is bundled locally as optimised transparent WebP. Vite fingerprints each asset and the existing worker precaches them, including variants a player has not yet reached. Switching ranks or beard stages therefore works offline. The larger mobile Knight frame makes the detail readable. See `src/assets/knight/README.md` for provenance and limitations.

The existing 0 / 9 / 21 / 30 km route tells an original connected story in four three-paragraph chapters. The Keep chapter is available at departure. Other chapters appear only when actual accumulated distance reaches their landmark, and remain rereadable from Journey. A teaser hints at the next setting without revealing its chapter. Landmark feedback retains a brief inscription, keeping action receipts concise.

No save changes, extra rewards, progression adjustments or encounters are introduced. Reopening a reached chapter creates no achievement ceremony.
