# Optional personal portrait

The user authorised a character likeness based on their supplied photograph and requested that it develop with the existing campaign. Original illustrations were generated with OpenAI image generation on 10 October 2026. The initial original reference is `exec-85ab5126-9016-4d92-a953-750c3d135945.png`. No commercial/stock/game artwork was downloaded, and the supplied photograph itself is not shipped with the app.

Select **Knight → Character portrait → Curly-haired knight**. Original knight remains the default for existing and new saves. Save v3 gains only an optional validated `portrait: "classic" | "personal"` field; no migration, reward change or account is needed. Switching the choice preserves the campaign, deeds, Renown, XP, Oaths, weekly commissions, weight records and Journey progress.

The personal set contains fifteen 900 × 1350 transparent WebP atlases: five existing equipment ranks × three Wisdom beard stages. Each has larger/sturdy/lean columns and untidy/well-kept rows, giving ninety combinations. The personal beard begins with the short beard from the reference, then becomes fuller and long at the same existing Wisdom thresholds. Rank, Presence, optional weight-linked build, Strength and Vitality use the original presentation rules. The weight link still requires the existing explicit baseline/target and genuine seven-day trend. The illustrations are discrete stages, not rigged models.

Vite fingerprints the illustrations; the existing service worker precaches them for offline use. No runtime image generation, photo upload, external image host or new app dependency is introduced.

The optional development metadata script reads alpha/component boundaries into `characterBounds.ts` and `characterClips.ts`. Original image pixels remain unchanged. Torso anchors center the person. Source-coordinate silhouette clips isolate neighbours whose equipment bounding rectangles interleave; disconnected equipment such as standards is grouped with its figure. Internal transparency remains in the original image. Subpixel boundary simplification limits metadata size. Python dependencies are used only when replacing artwork, not by the app or its production build.

## Original generated sources

PNG sources remain in the execution workspace's `generated_images` directory. Shipping conversion only resizes and optimises them.

| Bundled atlas | Original generated PNG |
| --- | --- |
| personal-squire-0.webp | exec-8564fb26-0922-4bb5-94a0-b68ca5c12cfc.png |
| personal-squire-1.webp | exec-e6ade243-2f87-4244-994d-981594805003.png |
| personal-squire-2.webp | exec-a03a084a-102c-4f1a-9450-075333583829.png |
| personal-man-at-arms-0.webp | exec-0fbc7368-849e-4566-ae66-707375b9f788.png |
| personal-man-at-arms-1.webp | exec-76a475d6-cd88-4c83-8ddc-4b1984c8512c.png |
| personal-man-at-arms-2.webp | exec-580f13b5-b6ff-46d0-adb5-13345d3b68a9.png |
| personal-knight-errant-0.webp | exec-3d76405c-04d2-48f6-b9de-b19d9a5c914e.png |
| personal-knight-errant-1.webp | exec-6609dd54-f011-4d83-8031-e83aee9be02a.png |
| personal-knight-errant-2.webp | exec-592e22cb-b4ea-46bf-85c8-238e62bb389e.png |
| personal-knight-0.webp | exec-2e51e2eb-f50f-4dbb-8332-6d7f4ff3d2ed.png |
| personal-knight-1.webp | exec-38160894-f77b-4f60-bb8f-acaf8d541cc1.png |
| personal-knight-2.webp | exec-8e851ee2-6fdd-41de-b06e-d65a01170a13.png |
| personal-knight-banneret-0.webp | exec-07491833-fca5-46ca-8eb9-4fc10b92dfa6.png |
| personal-knight-banneret-1.webp | exec-b8923837-1c4a-4a7a-afac-ae3da46583a6.png |
| personal-knight-banneret-2.webp | exec-5131b113-ca44-41a3-8bcf-752b96e7addb.png |

## Validation

### Keep portrait framing

The original personal Squire proportions are retained following user review.

Keep passes an explicit presentation placement to constrain the SVG to its allocated arch, including when a legacy fixed-width theme rule is present. Knight screen framing is unchanged. Neither change affects campaign state or progression.

Run `npm test` and `npm run build -- --base=/Oathbound/`. With the dev server running, `scripts/personal-portrait-smoke.cjs` checks the real selector, save/reload, both app portrait locations, narrow layouts, all ninety new combinations, production Pages base path, and all fifteen images plus portrait switching offline. It uses isolated browser fixtures.

