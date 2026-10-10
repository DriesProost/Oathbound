# Campaign journal and steps

The journal is presentation only: parchment washes, original SVG foliage confined to margins, compact headings, bookmark navigation and a non-blocking 420 ms page-leaf overlay. The overlay is removed under reduced motion. Navigation still begins at the heading; form/completion rerenders do not replay page turns. Existing optional paper feedback marks navigation only when sound effects are enabled.

The stronger parchment treatment uses an original procedural SVG fibre texture, warm edge washes, binding shadows and stacked page edges, with darker supporting text. No reference photographs or commercial textures are bundled. A folio inscription labels each section.

Horizontal touch swipes turn between the five sections in navigation order, without wrapping at the ends. The leaf animation matches forward/backward travel. Vertical scrolling and pinch zoom remain native; short nudges, diagonal/vertical gestures, prolonged touches, multiple fingers, selected text, active editing, controls and browser-edge starts do not trigger a turn. Buttons remain available for keyboard and assistive navigation. No form, save or progression logic depends on a gesture or animation. Reduced motion retains swipe navigation with the animation removed.

`scripts/journal-swipe-smoke.cjs` exercises native Chromium touch swipes in both directions, vertical intent, controls/end boundaries, unchanged saves, narrow layouts and reduced motion. These are browser checks; a real Android field test remains useful for device-specific gesture behaviour.

Keep attributes expand from a labelled summary; their exact levels/XP remain accessible there and on Knight. No campaign progression or reward values change.

## Optional supplied ambience

The Sound button opens independent effects and ambience controls. The user supplied `Loop_The_Bards_Tale.wav` on 10 October 2026 for use as the soundtrack. The complete 57.73-second stereo recording replaces the synthesized placeholder. Its bundled derivative, `src/assets/audio/the-bards-tale.m4a`, uses AAC at 160 kbit/s and 44.1 kHz, reducing the 10.2 MB WAV to approximately 1.2 MB. Conversion removes file metadata and keeps the full track; no other recording was sourced. Original upload SHA-256: `6d0852a758dc41a763cd33b0693fa878e36d7f1d0149f7674bc82241a7a90de1`.

Vite fingerprints the URL and the existing worker precaches the file for offline use. After an explicit gesture, Web Audio fetches/decodes the bundled recording and loops its audio buffer; decoded audio is reused for subsequent starts. Loading or decoding failure cannot affect the campaign. Muting or hiding the page while audio is loading prevents that pending start from subsequently playing.

The independent `oathbound.ambience.v1` preference remembers choice and volume. Playback requires an explicit Play/Resume gesture on each visit and never starts on reload. Closing settings leaves playback running; hiding the page pauses it, and resuming requires an explicit gesture. Mute stops the sources; pending starts are cancelled. Unsupported audio/storage fails without touching campaign data. Deed sound preference and reduced motion remain independent.

## Step patrols and safe existing campaigns

New campaigns default to 4,000 steps. Existing kilometre targets remain valid. Journey offers Use steps for patrols, which writes a prospective campaign revision converting the current target at the centrally configured estimate of 0.75 metres per step. Campaign settings can then change the target. Existing records, distance, rewards and target snapshots are untouched. No save version change is required.

Completing a step target snapshots that target and writes its estimated route distance once under the existing daily reward-slot protection. The route keeps canonical kilometre coordinates internally, so landmarks stay in place; its displayed units are equivalent route steps, clearly described as estimates. Older step records with zero distance are not retrospectively converted or fabricated. This is manual target confirmation, not sensor integration or an exact record of every step taken.

## Checks

`npm test` covers independent preferences, unavailable audio/storage, pending-start cancellation, step estimates and once-only route/reward accounting, alongside existing save/migration/progression tests. With Vite running, `scripts/journal-smoke.cjs` checks narrow/wide layouts, expandable attributes, actual Web Audio startup after a gesture, controls, reload without autoplay, prospective step conversion and reduced motion. `scripts/journey-scenes-smoke.cjs` checks stories, arrival feedback, mobile layout and offline artwork/history.
