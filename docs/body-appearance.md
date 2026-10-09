# Optional weight-linked appearance

This is an explicitly authorised cosmetic connection between the Weight Chronicle and character art. It does not change rewards, XP curves, rank thresholds, weekly targets, Oaths, Journey distances or achievement systems. Weight remains an outcome record and never produces gameplay feedback.

## Configuration

The shared starting-weight/target form in Campaign and Chronicle includes an optional link with independently selected starting and desired builds: larger, sturdy or lean. The link defaults off for old saves and new setup. Starting weight and target remain explicit and optional; enabling the link with neither simply shows the selected starting build. Set this up later continues to work.

Optional `weight.settings.appearance` stores only the boolean and the two build choices. Save v3 remains valid without it; validation rejects invalid choices. Measurements and all other history are untouched. Disabling Weight Management preserves the settings, data and retained visual stage. Turning off the appearance link uses the normal standalone character artwork; its choices remain saved for re-enabling.

## Build calculation

Use the existing seven-calendar-day trend from actual measurements, requiring at least three measurements in a window. Only observations on or after the explicit baseline and no later than the current local date contribute. With missing baseline, target, equal baseline/target, or no supported trend, retain the selected starting build. There is no invented observation, weighing streak, prompt to weigh daily or reward for frequency.

The baseline-to-target calculation is direction-aware and works for loss or gain. Three build stages are available: an intermediate build at 50% of the span when the selected extremes have a middle stage, and the desired build when the trend reaches/passes the target. Choosing the same starting/desired build keeps it constant; adjacent build choices change only when the target is reached.

Appearance uses the best valid trend progress for this baseline and target, so later fluctuations do not remove a reached visual stage. This is a retained fantasy depiction, not a representation of the latest measurement. Chronicle continues to show raw observations and the actual current trend. The result is derived, not written as an achievement or additional progression history. Correcting/deleting source measurements or changing baseline/target recomputes the depiction from the remaining real data.

## Independent traits

Each of the existing five ranks has three Wisdom/beard sheets. Each sheet has three build columns and two grooming rows. Presence level 3 selects the well-kept row; initial levels select untidy hair/clothing. Build never changes grooming or equipment. Wisdom never upgrades armour. Rank decides gear at its existing Renown thresholds. Strength retains its small bounded muscle/silhouette treatment; Vitality retains the subtle face-only complexion treatment.

SVG viewport clipping uses generated alpha-bound metadata to frame one complete cell without altering the source artwork. Assets are original generated illustrations, optimised locally and included in the normal fingerprinted offline shell. No runtime image generation or image hosting is needed. All builds are dignified and capable.
