# Oathbound character artwork

Original illustrations generated for Oathbound with OpenAI image generation on 9 October 2026. All reference art was generated for this project. No third-party game or stock artwork was downloaded.

The shipped `sheets/` directory contains fifteen transparent WebP sheets: five equipment ranks × three Wisdom beard stages. Each 900 × 1350 sheet has three columns (large, sturdy, lean) and two rows (untidy, well-kept). Presence selects the grooming row; optional weight-plan appearance selects the build column. Rank equipment and Wisdom beard remain independent.

`characterSheets.ts` imports the sheets. Generated viewport metadata in `characterBounds.ts` fits each complete figure without changing artwork pixels. After replacing assets, regenerate it with `python scripts/character-sheet-bounds.py` (Pillow, NumPy and SciPy required for this optional development step). Vite fingerprints them and the existing service worker precaches all variants for offline use. The original standalone portraits remain here as archived references and are no longer bundled. Source PNG outputs remain in the execution workspace’s `generated_images` directory; WebP conversion only resizes and optimises them.

These are complete illustrations rather than rigged models. Strength adds a bounded silhouette adjustment and Vitality a subtle face-only complexion treatment. Appearance rules never grant progression rewards. See `docs/body-appearance.md` for optional weight-plan semantics.
