# Earned action feedback

Feedback is presentation-only. Progression configuration, rewards, save v3, and historical records are unchanged.

`feedback/events.ts` compares the state immediately before a successful user-action save with its actual saved result. It uses the existing totals, rank, Oath, and commission helpers and shared Journey landmarks. Automatic period updates, configuration edits, loading, navigation, and weight operations cannot emit gameplay ceremonies. Oath corrections display only the exact signed adjustment, with no triumphant or negative sound.

One event batch has this deterministic order: rank promotion, route landmarks in distance order, weekly commissions in ID order, attribute levels in configuration order, Oath/deed recording, and exact rewards. All results are readable immediately. During the brief ceremony, the receipt stays in view even when the deed was recorded low on the board; it then returns to its normal inline position without moving focus or scrolling the page. The shared presentation timeline sequences emphasis and the count-up; the highest event leads the sound. Multiple landmarks are listed individually. Later actions replace the surface and cancel pending sounds, rather than building an exhausting ceremony queue. Reward receipts remain on completed notices and in Chronicle.

Transient batches are never stored in campaign history. Duplicate resulting-state dispatches are ignored, and components mounted on navigation initialize from the current facts. Save failure produces no ceremony. Counters animate only positive reward batches; reduced motion presents final values immediately. Accessible summaries announce a complete receipt once, not every animated number.

## Audio provenance and control

All cues in `feedback/audio.ts` are original Web Audio synthesized placeholders: noise filtered to resemble paper/quill/wood impacts and quiet sinusoidal/triangle partials for steel, bell, drum and horn-like resonances. There are no third-party recordings, copyrighted soundtrack clips, audio downloads, or background music. These generated cues are authored as part of Oathbound and carry no external asset attribution requirements.

A single lazy audio context is unlocked only by a user action when enabled. Preference `oathbound.feedback.v1` stores `sound: unset | enabled | disabled`, volume, independent haptic opt-in, and an offer marker. Unset produces no audio. The first successfully recorded deed/Oath offers sound once, with an explicitly requested short seal preview; declining is persisted. The persistent speaker control can change the choice later. Enabled preferences still require a user gesture on each browser visit. Muting cancels pending sounds. Unsupported devices, denied playback, or unavailable preference storage never affect campaign actions.

Haptics are independently optional: a 12 ms pulse for normal deeds, or a short 20/30/20 ms pattern for milestones. Neither haptics nor sound carries required information. Broken Oaths are silent. Weight entry/editing uses only a quiet quill cue, independent of the measured direction, and never produces gameplay events.

“A worthy day” describes any recorded deed or kept Oath in the existing summary. It adds no threshold, target, streak, bonus, or zero-day judgement.

## Validation

Run `npm test` and `npm run build`. Browser review should cover one ordinary deed, simultaneous milestones, Oath kept/broken/corrected, quiet weight records, sound offer/decline/reload/enable/mute, blocked devices, failed saves, rapid completions, reduced motion, and mobile layouts. Subjective cue quality is reviewed by listening; it is not asserted in unit tests.

For the cloud development environment, start the Vite server, then run:

```sh
PLAYWRIGHT_MODULE=/opt/codex/runtimes/cua/lib/node_modules/playwright CHROMIUM_PATH=/usr/bin/chromium node scripts/feedback-smoke.cjs
```

The browser smoke test replaces device APIs with deterministic generated-source spies. It verifies dispatch/control behavior without relying on speaker hardware. It writes review screenshots under `/tmp`; a listening review with real audio remains separate.
