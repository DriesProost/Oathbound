# Oathbound Journey illustrations

Four original scenes generated for Oathbound with OpenAI image generation on 9 October 2026. They share a grounded medieval art direction: muted green/brown/steel, overcast light, working stone and timber buildings, mud, oak and restrained warm windows. No downloaded stock art, commercial game assets or external runtime image service is used.

- `keep.webp`: the modest dawn holdfast, kitchen chimney and muddy yard.
- `mill.webp`: the mossy river mill, waterwheel, stone steps and crows.
- `inn.webp`: the wet roadside inn at dusk, warm windows and tied horses.
- `oakhaven.webp`: open town gate, timbered houses, church tower, lanterns and river repairs.

The generated PNG sources remain in the execution workspace’s `generated_images` directory. Shipped images are optimised to 1440 × 810 WebP at quality 86; artwork content is unchanged. `journeyArt.ts` imports their local URLs, allowing Vite fingerprinting and the existing full offline-shell precache. Journey chapter cards and arrival receipts use the same assets. Unreached previews are blurred/dimmed using presentation CSS, and retain accessible place names/status without exposing chapter text.
