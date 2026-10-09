export type SoundChoice = "unset" | "enabled" | "disabled";
export type Preferences = {
  sound: SoundChoice;
  volume: number;
  haptics: boolean;
  offered: boolean;
};
export const preferenceKey = "oathbound.feedback.v1";
export const defaults: Preferences = {
  sound: "unset",
  volume: 0.35,
  haptics: false,
  offered: false,
};
export function readPreferences(): Preferences {
  try {
    const p = JSON.parse(localStorage.getItem(preferenceKey) || "null");
    if (!p || !["unset", "enabled", "disabled"].includes(p.sound))
      return { ...defaults };
    return {
      sound: p.sound,
      volume:
        typeof p.volume === "number" && Number.isFinite(p.volume)
          ? Math.max(0, Math.min(1, p.volume))
          : defaults.volume,
      haptics: p.haptics === true,
      offered: p.offered === true,
    };
  } catch {
    return { ...defaults };
  }
}
export function writePreferences(p: Preferences): boolean {
  try {
    localStorage.setItem(preferenceKey, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
export type Cue =
  | "paper"
  | "woodClick"
  | "seal"
  | "renown"
  | "steel"
  | "oath"
  | "commission"
  | "landmark"
  | "rankUp"
  | "quill";
// Original synthesized placeholders: no downloaded audio, music, or third-party assets.
export class FeedbackAudio {
  private context: AudioContext | null = null;
  private nodes = new Set<AudioScheduledSourceNode>();
  private generation = 0;
  async unlock() {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") await this.context.resume();
      return this.context.state === "running";
    } catch {
      return false;
    }
  }
  stop() {
    this.generation++;
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {
        /* already ended */
      }
    }
    this.nodes.clear();
  }
  play(cue: Cue, p: Preferences) {
    if (
      p.sound !== "enabled" ||
      p.volume <= 0 ||
      this.context?.state !== "running"
    )
      return;
    try {
      const ctx = this.context,
        base = ctx.currentTime;
      const tone = (
        hz: number,
        duration: number,
        offset = 0,
        gain = 0.08,
        type: OscillatorType = "sine",
      ) => {
        const node = ctx.createOscillator(),
          envelope = ctx.createGain();
        node.type = type;
        node.frequency.setValueAtTime(hz, base + offset);
        envelope.gain.setValueAtTime(0, base + offset);
        envelope.gain.linearRampToValueAtTime(
          gain * p.volume,
          base + offset + 0.012,
        );
        envelope.gain.exponentialRampToValueAtTime(
          0.0001,
          base + offset + duration,
        );
        node.connect(envelope);
        envelope.connect(ctx.destination);
        this.nodes.add(node);
        node.onended = () => {
          this.nodes.delete(node);
          node.disconnect();
          envelope.disconnect();
        };
        node.start(base + offset);
        node.stop(base + offset + duration);
      };
      const noise = (duration: number, hz: number, gain: number) => {
        const buffer = ctx.createBuffer(
          1,
          Math.ceil(ctx.sampleRate * duration),
          ctx.sampleRate,
        );
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const node = ctx.createBufferSource(),
          filter = ctx.createBiquadFilter(),
          envelope = ctx.createGain();
        node.buffer = buffer;
        filter.type = "lowpass";
        filter.frequency.value = hz;
        envelope.gain.setValueAtTime(gain * p.volume, base);
        envelope.gain.exponentialRampToValueAtTime(0.0001, base + duration);
        node.connect(filter);
        filter.connect(envelope);
        envelope.connect(ctx.destination);
        this.nodes.add(node);
        node.onended = () => {
          this.nodes.delete(node);
          node.disconnect();
          filter.disconnect();
          envelope.disconnect();
        };
        node.start(base);
        node.stop(base + duration);
      };
      switch (cue) {
        case "paper":
          noise(0.12, 1600, 0.035);
          break;
        case "quill":
          noise(0.09, 2400, 0.025);
          break;
        case "woodClick":
          noise(0.06, 450, 0.1);
          tone(110, 0.1);
          break;
        case "seal":
          noise(0.12, 500, 0.12);
          tone(85, 0.24);
          break;
        case "renown":
          tone(750, 0.25, 0.05, 0.035);
          tone(1120, 0.23, 0.34, 0.025);
          break;
        case "steel":
          tone(220, 0.7);
          tone(583, 0.5, 0, 0.035);
          break;
        case "oath":
          tone(110, 1.4);
          tone(277, 1.0, 0, 0.025);
          break;
        case "commission":
          noise(0.12, 650, 0.08);
          tone(147, 0.9);
          tone(220, 0.7, 0.08, 0.035);
          break;
        case "landmark":
          tone(196, 0.9, 0, 0.055);
          tone(294, 1.1, 0.12, 0.035);
          break;
        case "rankUp":
          tone(73, 1.2, 0, 0.07);
          tone(147, 1.8, 0.18, 0.05, "triangle");
          tone(220, 1.5, 0.35, 0.035);
          break;
      }
    } catch {
      /* Audio is presentation-only, including partial device failures. */
    }
  }
  get token() {
    return this.generation;
  }
}
export function haptic(enabled: boolean, major = false) {
  if (!enabled) return;
  try {
    navigator.vibrate?.(major ? [20, 30, 20] : 12);
  } catch {
    /* Optional hardware. */
  }
}
