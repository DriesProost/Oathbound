# Optional pony-tailed portrait

The user requested another selectable character likeness based on their friend's supplied photograph. Original illustrations were generated with OpenAI image generation on 10 October 2026. The photograph itself is not bundled. No commercial artwork was downloaded.

Select **Knight → Character portrait → Ponytailed knight**. This is a third cosmetic choice alongside Original knight and Curly-haired knight, not a separate account or campaign. Existing saves retain their choice, with Original knight remaining the default when none is set. Save v3 accepts the optional centrally validated `portrait: "tied-hair"` value without a version change.

Fifteen transparent 900 × 1350 WebP atlases provide the same five armour ranks, three Wisdom beard stages, three body builds and two Presence/grooming states: ninety combinations. The starting beard is short stubble; tied-back brown hair and the supplied facial likeness remain distinct from the curly-haired portrait. Existing Strength, Vitality and optional weight-linked appearance rules are retained. Switching portraits leaves every campaign record and progression value untouched.

Vite fingerprints and the existing service worker precaches the new images. The app introduces no upload, image-generation service, external image host or dependency. Shipping conversion only resizes and optimises generated artwork; the existing metadata script reads alpha boundaries, torso anchors and silhouette clips without altering pixels.

## Generated sources

| Bundled atlas | Generated PNG in execution workspace |
| --- | --- |
| tied-hair-knight-0.webp | exec-17a839eb-d601-4c41-8246-a02760086c15.png |
| tied-hair-knight-1.webp | exec-04bf75e3-9f88-44c0-ba55-0c6ece995cf6.png |
| tied-hair-knight-2.webp | exec-e037e003-56fa-4d6d-9101-e93d4377347c.png |
| tied-hair-knight-banneret-0.webp | exec-81d699e8-c1bb-4c8c-9bb5-620a8b5be23b.png |
| tied-hair-knight-banneret-1.webp | exec-3b423eb4-c1c2-4995-a757-089885130cc2.png |
| tied-hair-knight-banneret-2.webp | exec-320baa2d-2400-480c-9857-b1c5cf386124.png |
| tied-hair-knight-errant-0.webp | exec-ea1a7d47-0d3e-417e-ae9a-dff668cbe173.png |
| tied-hair-knight-errant-1.webp | exec-7cfe4b86-8d05-4530-8b66-50d84d4d29c9.png |
| tied-hair-knight-errant-2.webp | exec-2cdf3b8b-b28f-4f1b-86e9-f3f0c0763409.png |
| tied-hair-man-at-arms-0.webp | exec-d1ae5c3f-d99e-492c-81d5-20d33603d727.png |
| tied-hair-man-at-arms-1.webp | exec-02acf9a9-d0fc-4407-b3d3-846a118badf5.png |
| tied-hair-man-at-arms-2.webp | exec-35c440b6-1c33-42dc-83ac-1d26dd8b1f54.png |
| tied-hair-squire-0.webp | exec-7d886e95-adc2-4a3d-a9ce-1cc814c3e2cb.png |
| tied-hair-squire-1.webp | exec-65b40045-ee58-45d3-8bc2-5077f804de53.png |
| tied-hair-squire-2.webp | exec-015ac63d-2aa7-4023-9ef0-6c0fe82899d1.png |

## Validation

Run `npm test` and `npm run build -- --base=/Oathbound/`. Tests cover all 270 appearance combinations across the three portrait choices, save validation/reload, reward isolation and unchanged appearance progression.

With the development server running, run `scripts/personal-portrait-smoke.cjs` using `OATHBOUND_PORTRAIT=tied-hair` (and separately its default `personal` choice). It checks selector persistence, Keep/Knight framing at narrow and wide widths, all ninety rendered combinations per likeness, production Pages paths, all fifteen images and portrait switching offline. Playwright and Chromium can be supplied through `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH`.
