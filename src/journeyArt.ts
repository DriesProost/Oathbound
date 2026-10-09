// Shared local art for chapter cards and arrival receipts; Vite fingerprints and precaches it.
const scenes = import.meta.glob("./assets/journey/*.webp", {
  eager: true, query: "?url", import: "default",
});
export function landmarkScene(id: string) {
  return scenes[`./assets/journey/${id}.webp`] as string | undefined;
}
