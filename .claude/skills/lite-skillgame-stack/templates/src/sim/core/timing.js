// Timing / rhythm recipe (knowledge-base/12 §1): seeded charts, sub-tick judgement, capped combo score.
// Everything is in integer "sub-ticks" (SUB per sim tick, ≈ 1.04 ms at 60 TPS), so a 60 Hz sim can
// judge taps far finer than one frame. The input byte carries the tap's sub-tick phase
// (core/input.js fills it from the event timestamp, independent of the display's frame rate).
import { hash32 } from './rng.js';

export const SUB = 16;
export const TAP = 1;                                        // input bit 0 = tap; bits 4..7 = phase
export const encodeTap = (phase = 0) => TAP | ((phase & 15) << 4);
export const isTap = byte => (byte & TAP) !== 0;
/** Absolute tap time in sub-ticks for the byte recorded at `tick`. */
export const tapTime = (tick, byte) => tick * SUB + ((byte >> 4) & 15);
export const msToSub = ms => Math.round((ms * 60 * SUB) / 1000);

/** Half-widths in sub-ticks. Tune per game; keep them in the spec (§6) and the result screen. */
export const WINDOWS = Object.freeze({ perfect: msToSub(35), great: msToSub(70), good: msToSub(110) });
export const GRADE = Object.freeze({ MISS: 0, GOOD: 1, GREAT: 2, PERFECT: 3 });
export const GRADE_NAME = ['miss', 'good', 'great', 'perfect'];

/**
 * Seeded chart: depends only on (seed, opts) — never on player input (fairness E2).
 * Each beat picks a pattern from `patterns` by weight: arrays of note offsets in beat fractions (0..1).
 * @returns [{ t: sub-ticks, lane }] sorted by t, ids = array index
 */
export function makeChart(seed, {
  startTick = 120, beats = 32, beatTicks = 30, lanes = 1, stream = 31,
  patterns = [{ w: 2, at: [] }, { w: 6, at: [0] }, { w: 3, at: [0, 0.5] }, { w: 1, at: [0, 0.25, 0.5] }],
} = {}) {
  const total = patterns.reduce((s, p) => s + p.w, 0), notes = [];
  for (let b = 0; b < beats; b++) {
    let pick = hash32(seed, stream, b) % total, p = patterns[0];
    for (const q of patterns) { if (pick < q.w) { p = q; break; } pick -= q.w; }
    for (let k = 0; k < p.at.length; k++) {
      const lane = lanes > 1 ? hash32(seed, stream + 1, b * 8 + k) % lanes : 0;
      notes.push({ t: (startTick + b * beatTicks) * SUB + Math.round(p.at[k] * beatTicks * SUB), lane });
    }
  }
  return notes;
}

/** Judge state; lives inside the sim object (plain integers / typed arrays, hashable). */
export function createJudge(chart) {
  return { next: 0, grade: new Int8Array(chart.length).fill(-1), combo: 0, maxCombo: 0, counts: [0, 0, 0, 0], score: 0, whiffs: 0 };
}

const gradeFor = (d, w) => (d <= w.perfect ? GRADE.PERFECT : d <= w.great ? GRADE.GREAT : d <= w.good ? GRADE.GOOD : -1);

/** Points for one note: base by grade, ×(100 + combo bonus) / 100, bonus capped (technique ceiling, anomaly check). */
export const POINTS = [0, 50, 80, 100];
export const COMBO_CAP = 50;
const award = (j, g) => {
  if (g === GRADE.MISS) { j.combo = 0; j.counts[0]++; return 0; }
  j.combo++; j.maxCombo = Math.max(j.maxCombo, j.combo); j.counts[g]++;
  const pts = Math.trunc((POINTS[g] * (100 + Math.min(j.combo - 1, COMBO_CAP))) / 100);
  j.score += pts;
  return pts;
};

/**
 * A tap at `time` (sub-ticks) on `lane`: judges the earliest unjudged note of that lane inside the
 * good window. No note in reach = whiff (breaks combo, counted — mashing must cost something).
 * @returns { note, grade, pts } | { whiff: true }
 */
export function judgeTap(j, chart, time, lane = 0, w = WINDOWS) {
  for (let i = j.next; i < chart.length && chart[i].t <= time + w.good; i++) {
    if (j.grade[i] >= 0 || chart[i].lane !== lane) continue;
    const g = gradeFor(Math.abs(time - chart[i].t), w);
    if (g < 0) continue;
    j.grade[i] = g;
    return { note: i, grade: g, pts: award(j, g) };
  }
  j.combo = 0; j.whiffs++;
  return { whiff: true };
}

/** Mark notes whose late window has passed as misses (call once per tick with now = tick * SUB). */
export function judgeMisses(j, chart, now, w = WINDOWS, onMiss = null) {
  while (j.next < chart.length && chart[j.next].t + w.good < now) {
    if (j.grade[j.next] < 0) { j.grade[j.next] = GRADE.MISS; award(j, GRADE.MISS); onMiss?.(j.next); }
    j.next++;
  }
}

/** Theoretical maximum (all perfect, full combo): uploads above it are invalid by construction. */
export function maxScore(chart) {
  let s = 0;
  for (let c = 0; c < chart.length; c++) s += Math.trunc((POINTS[GRADE.PERFECT] * (100 + Math.min(c, COMBO_CAP))) / 100);
  return s;
}
