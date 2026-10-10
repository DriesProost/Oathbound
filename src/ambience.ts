// Original, deterministic lute-inspired synthesis; no third-party recordings.
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
  async start(volume: number) {
    this.stop();
    const generation = this.generation;
    try {
      this.context ??= new AudioContext();
      const ctx = this.context;
      await ctx.resume();
      if (generation !== this.generation || ctx.state !== 'running') return false;
      const rate = ctx.sampleRate, length = rate * 32;
      const buffer = ctx.createBuffer(1, length, rate), samples = buffer.getChannelData(0);
      const notes = [146.83,220,293.66,261.63,220,196,146.83,220,174.61,220,293.66,329.63,293.66,220,196,146.83];
      let seed = 17;
      notes.forEach((hz, index) => {
        const delay = new Float32Array(Math.round(rate / hz));
        for (let j = 0; j < delay.length; j++) { seed = (seed * 1664525 + 1013904223) >>> 0; delay[j] = (seed / 4294967296 - .5) * .22; }
        for (let j = 0; j < rate * 5; j++) {
          const k = j % delay.length, value = delay[k];
          delay[k] = .996 * .5 * (value + delay[(k + 1) % delay.length]);
          samples[(index * rate * 2 + j) % length] += value * Math.min(1, j / (rate * .008)) * Math.min(1, (rate * 5 - j) / (rate * .3));
        }
      });
      this.gain = ctx.createGain(); this.gain.gain.value = Math.max(0, Math.min(1, volume));
      this.source = ctx.createBufferSource(); this.source.buffer = buffer; this.source.loop = true;
      this.source.connect(this.gain); this.gain.connect(ctx.destination); this.source.start();
      return true;
    } catch { this.stop(); return false; }
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
