// Synthesised sound effects (knowledge-base/14): oscillators + noise + envelopes, 0 bytes of audio.
// Render layer only — play() is called from sim events, never the other way round.
// A recipe is a list of layers; every number lives in RECIPES so sounds are tuned like FEEL.
//   osc:   { type: 'osc', wave, f0, f1 (end freq), dur, attack, gain, delay?, filter? }
//   noise: { type: 'noise', dur, attack, gain, delay?, filter: { type, f0, f1?, q? } }
export const RECIPES = {
  perfect: [
    { type: 'osc', wave: 'triangle', f0: 880, f1: 1320, dur: 0.09, attack: 0.002, gain: 0.32 },
    { type: 'osc', wave: 'sine', f0: 1760, f1: 1760, dur: 0.16, attack: 0.004, gain: 0.12, delay: 0.012 },
    { type: 'noise', dur: 0.03, attack: 0.001, gain: 0.12, filter: { type: 'highpass', f0: 4000 } },
  ],
  hit: [
    { type: 'osc', wave: 'square', f0: 420, f1: 300, dur: 0.06, attack: 0.002, gain: 0.16, filter: { type: 'lowpass', f0: 2400 } },
    { type: 'noise', dur: 0.04, attack: 0.001, gain: 0.18, filter: { type: 'bandpass', f0: 1500, q: 1.2 } },
  ],
  whiff: [
    { type: 'noise', dur: 0.12, attack: 0.004, gain: 0.34, filter: { type: 'bandpass', f0: 1100, f1: 320, q: 2 } },
  ],
  miss: [
    { type: 'osc', wave: 'sawtooth', f0: 220, f1: 110, dur: 0.18, attack: 0.004, gain: 0.12, filter: { type: 'lowpass', f0: 900 } },
  ],
  pickup: [
    { type: 'osc', wave: 'square', f0: 660, f1: 990, dur: 0.06, attack: 0.002, gain: 0.1 },
    { type: 'osc', wave: 'square', f0: 990, f1: 1320, dur: 0.07, attack: 0.002, gain: 0.1, delay: 0.055 },
  ],
  click: [
    { type: 'osc', wave: 'sine', f0: 1200, f1: 900, dur: 0.03, attack: 0.001, gain: 0.12 },
  ],
  boom: [
    { type: 'osc', wave: 'sine', f0: 110, f1: 38, dur: 0.38, attack: 0.003, gain: 0.5 },
    { type: 'noise', dur: 0.26, attack: 0.002, gain: 0.28, filter: { type: 'lowpass', f0: 900, f1: 200 } },
  ],
};

/** Pitch multiplier for a combo: one semitone per step, capped (rising pitch = rising tension). */
export const comboPitch = (combo, cap = 12) => 2 ** (Math.min(Math.max(combo - 1, 0), cap) / 12);

const noiseBuffers = new WeakMap();
function noiseBuffer(ctx) {
  let b = noiseBuffers.get(ctx);
  if (b) return b;
  b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = b.getChannelData(0);
  let s = 0x2545f491;
  for (let i = 0; i < d.length; i++) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; d[i] = (s >>> 0) / 2147483648 - 1; }
  noiseBuffers.set(ctx, b);
  return b;
}

/**
 * Schedule `recipe` on any BaseAudioContext (live or OfflineAudioContext) at time `when`.
 * @returns end time (s)
 */
export function scheduleRecipe(ctx, dest, recipe, when, { pitch = 1, gain = 1 } = {}) {
  let end = when;
  for (const L of recipe) {
    const t = when + (L.delay ?? 0), stop = t + L.dur;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(L.gain * gain, t + (L.attack ?? 0.002));
    env.gain.exponentialRampToValueAtTime(0.0001, stop);
    let src;
    if (L.type === 'osc') {
      src = ctx.createOscillator();
      src.type = L.wave;
      src.frequency.setValueAtTime(L.f0 * pitch, t);
      if (L.f1 && L.f1 !== L.f0) src.frequency.exponentialRampToValueAtTime(L.f1 * pitch, stop);
    } else {
      src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      src.playbackRate.value = pitch;
    }
    let out = src;
    if (L.filter) {
      const f = ctx.createBiquadFilter();
      f.type = L.filter.type;
      f.frequency.setValueAtTime(L.filter.f0 * pitch, t);
      if (L.filter.f1) f.frequency.exponentialRampToValueAtTime(L.filter.f1 * pitch, stop);
      if (L.filter.q) f.Q.value = L.filter.q;
      src.connect(f);
      out = f;
    }
    out.connect(env).connect(dest);
    src.start(t);
    src.stop(stop + 0.02);
    end = Math.max(end, stop);
  }
  return end;
}

/** Render a recipe offline (tests, previews, exporting to a file if a platform needs one). */
export async function renderOffline(recipe, opts = {}, sampleRate = 22050) {
  const len = Math.ceil(sampleRate * (Math.max(...recipe.map(L => (L.delay ?? 0) + L.dur)) + 0.05));
  const ctx = new OfflineAudioContext(1, len, sampleRate);
  scheduleRecipe(ctx, ctx.destination, recipe, 0, opts);
  return (await ctx.startRendering()).getChannelData(0);
}

export class Sfx {
  /** @param o { volume 0..1, maxVoices, variation: ± random pitch spread (render-only randomness is fine) } */
  constructor({ volume = 0.6, maxVoices = 12, variation = 0.04 } = {}) {
    this.volume = volume; this.maxVoices = maxVoices; this.variation = variation;
    this.ctx = null; this.master = null; this.voices = 0;
    try { this.muted = localStorage.getItem('sfx-muted') === '1'; } catch { this.muted = false; }
  }

  /** Call from the first user gesture (pointerdown / keydown): browsers start audio only after one. */
  unlock() {
    if (!this.ctx) {
      const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC({ latencyHint: 'interactive' });
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      // Gentle limiter so stacked hits never clip.
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -10; comp.ratio.value = 8;
      this.master.connect(comp).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this.volume;
    try { localStorage.setItem('sfx-muted', m ? '1' : '0'); } catch { /* storage may be blocked */ }
  }

  /** Output latency in ms (feeds the calibration test of knowledge-base/13). */
  get latencyMs() { return this.ctx ? ((this.ctx.outputLatency || 0) + (this.ctx.baseLatency || 0)) * 1000 : 0; }

  play(name, { pitch = 1, gain = 1 } = {}) {
    const recipe = RECIPES[name];
    if (!recipe || !this.ctx || this.muted || this.ctx.state !== 'running' || this.voices >= this.maxVoices) return;
    const p = pitch * (1 + (Math.random() * 2 - 1) * this.variation);
    const end = scheduleRecipe(this.ctx, this.master, recipe, this.ctx.currentTime, { pitch: p, gain });
    this.voices++;
    setTimeout(() => { this.voices--; }, (end - this.ctx.currentTime) * 1000 + 30);
  }
}
