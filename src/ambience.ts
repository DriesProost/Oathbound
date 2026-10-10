// User-supplied recording, bundled locally with the offline app shell.
import musicUrl from './assets/audio/the-bards-tale.m4a?url';
export {musicUrl};
export const ambienceKey = 'oathbound.ambience.v1';
export function readAmbience() {
  try {
    const p = JSON.parse(localStorage.getItem(ambienceKey) || 'null');
    return {enabled: p?.enabled === true, volume: typeof p?.volume === 'number' && Number.isFinite(p.volume) ? Math.max(0, Math.min(1, p.volume)) : .25};
  } catch { return {enabled: false, volume: .25}; }
}
export function writeAmbience(p: {enabled: boolean; volume: number}) {
  try { localStorage.setItem(ambienceKey, JSON.stringify(p)); return true; } catch { return false; }
}
export class KeepAmbience {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private generation = 0;
  private buffer: AudioBuffer | null = null;
  private loading: Promise<AudioBuffer> | null = null;
  async start(volume: number) {
    this.stop();
    const generation = this.generation;
    try {
      this.context ??= new AudioContext();
      const ctx = this.context;
      await ctx.resume();
      if (generation !== this.generation || ctx.state !== 'running') return false;
      if (!this.buffer) {
        this.loading ??= (async () => {
          const response = await fetch(musicUrl);
          if (!response.ok) throw Error('Music unavailable');
          return ctx.decodeAudioData(await response.arrayBuffer());
        })();
        try { this.buffer = await this.loading; } finally { this.loading = null; }
      }
      if (generation !== this.generation || ctx.state !== 'running') return false;
      this.gain = ctx.createGain(); this.gain.gain.value = Math.max(0, Math.min(1, volume));
      this.source = ctx.createBufferSource(); this.source.buffer = this.buffer; this.source.loop = true;
      this.source.connect(this.gain); this.gain.connect(ctx.destination); this.source.start();
      return true;
    } catch { if (generation === this.generation) this.stop(); return false; }
  }
  setVolume(volume: number) {
    try { this.gain?.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.context!.currentTime, .1); } catch { /* best effort */ }
  }
  stop() {
    this.generation++;
    try { this.source?.stop(); this.source?.disconnect(); this.gain?.disconnect(); } catch { /* already stopped */ }
    this.source = null; this.gain = null;
  }
  dispose() { this.stop(); void this.context?.close().catch(() => {}); this.context = null; }
}
