// Input fairness (knowledge-base/13). Client-side helpers, pure (no DOM), so they are testable and
// also usable on the server for checks:
//  - InputClock: event timestamp -> (sim tick, sub-tick phase). The tick a tap lands on depends on
//    WHEN the finger hit the glass (PointerEvent.timeStamp), not on when the next frame ran, so a
//    30 / 60 / 120 / 144 Hz screen or a slow frame produces the same input log.
//  - TapQueue: delivers queued taps to the ticks they belong to, one per tick.
//  - calibrate(): per-device latency offset from a tap-along test, bounded and recorded in the upload.
//  - macroSuspicion() / errorSuspicion(): inhuman regularity flags for the server's risk review.
import { SUB } from './timing.js';

export class InputClock {
  /**
   * @param t0        timestamp (ms, performance.now() timebase) of sim tick 0
   * @param offsetMs  calibrated device latency: taps are shifted earlier by this much (0 = none)
   */
  constructor(t0, offsetMs = 0, tickMs = 1000 / 60) {
    this.t0 = t0; this.offsetMs = offsetMs; this.tickMs = tickMs;
  }
  /** { tick, phase } of an event at `ts`. */
  at(ts) {
    const t = (ts - this.t0 - this.offsetMs) / this.tickMs, tick = Math.floor(t);
    return { tick, phase: Math.min(SUB - 1, Math.max(0, Math.floor((t - tick) * SUB))) };
  }
  /**
   * Last tick whose whole time window has passed at wall time `now`: step the sim through this one.
   * Stepping a tick only after it ended (≤ 1 tick of display latency) guarantees every tap that
   * happened inside it has already been delivered, whatever the frame rate.
   */
  targetTick(now) { return Math.floor((now - this.t0) / this.tickMs) - 1; }
  /** After a hitch (tab hidden, long GC) move t0 so the sim does not fast-forward through it. */
  skip(ms) { this.t0 += ms; }
}

export class TapQueue {
  constructor(clock, cap = 8) { this.clock = clock; this.cap = cap; this.q = []; this.late = 0; }
  /** Queue a tap seen at `ts`; `data` rides along for the render layer (e.g. position). */
  push(ts, data = null) {
    if (this.q.length >= this.cap) return false;
    const { tick, phase } = this.clock.at(ts);
    this.q.push({ tick, phase, data });
    this.q.sort((a, b) => a.tick - b.tick || a.phase - b.phase);
    return true;
  }
  /**
   * The tap for sim tick `tick`, or null. A tap whose tick already passed (event arrived after its
   * tick was simulated, or two taps in one tick) is delivered now with phase 0 and counted in `late`.
   */
  take(tick) {
    const t = this.q[0];
    if (!t || t.tick > tick) return null;
    this.q.shift();
    if (t.tick < tick) { this.late++; return { tick, phase: 0, data: t.data, late: true }; }
    return t;
  }
  clear() { this.q.length = 0; }
}

const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/**
 * Latency calibration from a tap-along test: samples = (tap time − beat time) in ms.
 * Trimmed median (robust to stray taps), clamped to ±maxAbs so it can never become an advantage.
 * @returns { offsetMs, spreadMs (median absolute deviation), n, ok }
 */
export function calibrate(samples, { maxAbs = 150, trim = 0.2, minSamples = 8 } = {}) {
  if (samples.length < minSamples) return { offsetMs: 0, spreadMs: Infinity, n: samples.length, ok: false };
  const s = [...samples].sort((a, b) => a - b), cut = Math.floor(s.length * trim), core = s.slice(cut, s.length - cut);
  const m = median(core), spread = median(core.map(v => Math.abs(v - m)));
  return { offsetMs: Math.round(Math.max(-maxAbs, Math.min(maxAbs, m))), spreadMs: spread, n: samples.length, ok: spread < 40 };
}

const stats = a => {
  const mean = a.reduce((s, v) => s + v, 0) / a.length;
  return { mean, sd: Math.sqrt(a.reduce((s, v) => s + (v - mean) ** 2, 0) / a.length) };
};

/** Tap rhythm check (OFDP / Timberman style mashing games): intervals too fast or too even. */
export function macroSuspicion(tapTimesMs, { minIntervalMs = 45, minSdMs = 3, minTaps = 20 } = {}) {
  if (tapTimesMs.length < minTaps) return { suspicious: false, reasons: [], n: tapTimesMs.length };
  const iv = tapTimesMs.slice(1).map((t, i) => t - tapTimesMs[i]), { mean, sd } = stats(iv), min = Math.min(...iv);
  const reasons = [];
  if (min < minIntervalMs) reasons.push(`interval ${min.toFixed(1)} ms < ${minIntervalMs}`);
  if (sd < minSdMs) reasons.push(`interval sd ${sd.toFixed(2)} ms < ${minSdMs}`);
  return { suspicious: reasons.length > 0, reasons, n: tapTimesMs.length, meanMs: mean, sdMs: sd, minMs: min };
}

/** Timing-error check (rhythm games): humans scatter; an input bot hits with near-zero spread. */
export function errorSuspicion(errorsMs, { minSdMs = 2.5, minHits = 30 } = {}) {
  if (errorsMs.length < minHits) return { suspicious: false, n: errorsMs.length };
  const { mean, sd } = stats(errorsMs);
  return { suspicious: sd < minSdMs, n: errorsMs.length, meanMs: mean, sdMs: sd };
}
