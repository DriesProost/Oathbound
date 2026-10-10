# Oathbound character artwork

Original illustrations generated for Oathbound with OpenAI image generation on 9 October 2026. All reference art was generated for this project. No third-party game or stock artwork was downloaded.

The three Squire sheets were redrawn on the same date to make the larger build visibly distinct: a rounded belly, fuller cheeks and chin, broader waist and thicker limbs. These are original generated edits of this project's sheets, preserving independent beard and grooming variants. Later-rank sheets are unchanged by this refinement. Source outputs: `exec-62fd5219-b257-4991-a8bc-4d7e5d8fb670.png` (clean-shaven), `exec-2d484993-b4e8-4689-84d6-82d4bf26a176.png` (short beard), and `exec-3cdb47e6-b119-42a6-b462-d5ab4af74652.png` (full beard).

The shipped `sheets/` directory contains fifteen transparent WebP sheets: five equipment ranks × three Wisdom beard stages. Each 900 × 1350 sheet has three columns (large, sturdy, lean) and two rows (untidy, well-kept). Presence selects the grooming row; optional weight-plan appearance selects the build column. Rank equipment and Wisdom beard remain independent.

An additional `squire-large.webp` overrides only the larger Squire build. Its columns are clean-shaven, short beard and full beard; its two rows remain untidy and well-kept. This dedicated atlas gives the belly and double chin room to remain visible at phone size, instead of deriving a heavy build from an athletic illustration. Original generated source: `exec-5d77a260-f95e-4d15-b65f-10cfc6209f07.png`, edited from original project source `exec-ed0a62ce-c56c-4e41-84f3-813365f43172.png`. Other ranks and Squire builds keep their existing artwork.

`characterSheets.ts` imports the sheets. Generated viewport metadata in `characterBounds.ts` fits each complete figure without changing artwork pixels. After replacing assets, regenerate it with `python scripts/character-sheet-bounds.py` (Pillow, NumPy and SciPy required for this optional development step). Vite fingerprints them and the existing service worker precaches all variants for offline use. The original standalone portraits remain here as archived references and are no longer bundled. Source PNG outputs remain in the execution workspace’s `generated_images` directory; WebP conversion only resizes and optimises them.

Each viewport also stores a person-center anchor. The renderer centers the torso rather than a turned head or asymmetric shield, while fitting all equipment inside the portrait. The Banneret anchor accounts for the banner extending above the helmet.

On 10 October 2026 the larger Squire was toned down to a moderately rounded belly and softer chin, preserving all six beard/grooming combinations. Current original source: `exec-a3ac192f-beb8-43a8-a3bd-9195d9d759d0.png`, a spacing refinement of `exec-8e369761-d983-4511-b765-2b6e4ee8a036.png`. The appearance remains opt-in and uses the unchanged recorded-trend rules.

These are complete illustrations rather than rigged models. Strength adds a bounded silhouette adjustment and Vitality a subtle face-only complexion treatment. Appearance rules never grant progression rewards. See `docs/body-appearance.md` for optional weight-plan semantics.
