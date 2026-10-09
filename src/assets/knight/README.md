# Oathbound character artwork

Original illustrations generated for Oathbound with OpenAI image generation on 9 October 2026. The reference concept and each intermediate reference were also generated for this project; no stock, commercial soundtrack, game artwork or third-party character assets were downloaded.

The five rank filenames correspond to existing progression ranks. Each has three facial-hair variants:

- no suffix: clean-shaven baseline
- `-wisdom1`: short brown beard (Wisdom level 3)
- `-wisdom2`: full brown beard (Wisdom level 6)

Rank variants change equipment, not attribute thresholds. Wisdom variants preserve rank equipment. Healthy, dignified baseline faces are retained; higher Wisdom does not imply ageing or grey hair.

Source outputs remain in the execution workspace's `generated_images` directory. Shipped transparent WebP files are resized to 640 × 960 and encoded at quality 86 for mobile use. Assets are imported through `characterAssets.ts`, fingerprinted by Vite and included in the existing offline-shell precache. No external image host or runtime generation service is required.

These are complete illustrations, not a fully rigged character model. Strength currently uses a bounded silhouette adjustment (at most 8% wider) and Vitality a subtle face-only complexion treatment. Other independent facial/body traits would require further aligned artwork rather than being inferred from armour or these beard variants.
