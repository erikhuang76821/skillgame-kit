// Demo game "Beat Tap" — replace this file with your game's rules (spec: references/game-spec-template.md).
// Deterministic: no rendering, no wall clock, no unseeded randomness (SKILL.md §7 greps for them).
// Same seed + same input bytes = same score.
//
// Rules: beats arrive at seed-driven intervals. Tap inside the window that opens on each beat
// = perfect (+10, +2 per combo step, capped). Tap outside a window = whiff (-5, combo reset).
// A beat that passes untouched = miss (combo reset). 30-second match.
// Difficulty is a fixed script (knowledge-base/16): each section sets the gap range and the window; the seed
// only varies the gaps inside a section. tools/playtest.mjs checks the curve against RULE-CURVE-*.
import { makeRng, createHasher, TPS } from './core/index.js';

export { TICK_MS } from './core/index.js';

// --- Spec §2 input byte ---
export const IN_TAP = 1;

// --- Spec §3 random streams (never renumber after release) ---
const rng = makeRng({ beat: 1 });

// --- Spec §0 / §6 tuning (judgement numbers live here, not in fx/feel.js) ---
export const MATCH_TICKS = 30 * TPS;
export const RULES = Object.freeze({
  firstBeat: 60,
  perfect: 10, comboStep: 2, comboCap: 10, whiff: -5,
});

// --- Spec §5 difficulty script: one new pressure per section, a breather before the climax ---
// from = first tick of the section; a beat belongs to the section its window opens in.
export const SCRIPT = Object.freeze([
  { name: '暖身', from: 0, gapMin: 66, gapMax: 84, window: 10, safe: true },
  { name: '上升', from: 6 * TPS, gapMin: 50, gapMax: 66, window: 9 },
  { name: '加速', from: 12 * TPS, gapMin: 44, gapMax: 58, window: 8 },
  { name: '調息', from: 18 * TPS, gapMin: 66, gapMax: 84, window: 9, safe: true },
  { name: '高潮', from: 21 * TPS, gapMin: 38, gapMax: 50, window: 8 },
]);
export const sectionAt = tick => { let k = 0; while (k + 1 < SCRIPT.length && tick >= SCRIPT[k + 1].from) k++; return k; };
const windowOf = beatTick => SCRIPT[sectionAt(beatTick)].window;

export function createSim(seed) {
  return {
    seed: seed >>> 0, tick: 0, score: 0, combo: 0, best: 0,
    beat: 0, nextBeat: RULES.firstBeat, hitBeat: -1,
    perfects: 0, whiffs: 0, misses: 0,
    events: [], recordEvents: true,
  };
}

const emit = (sim, ev) => { if (sim.recordEvents) sim.events.push(ev); };

/** True while the current beat's perfect window is open (render uses this for the cue). */
export const windowOpen = sim => sim.tick >= sim.nextBeat && sim.tick < sim.nextBeat + windowOf(sim.nextBeat);
/** Ticks the current beat's window stays open (bots and render read it like the on-screen cue). */
export const beatWindow = sim => windowOf(sim.nextBeat);

function advanceBeat(sim) {
  const sec = SCRIPT[sectionAt(sim.nextBeat)];
  sim.nextBeat += rng.range(sim.seed, 'beat', sim.beat, sec.gapMin, sec.gapMax);
  sim.beat++;
}

/** Spec §4 tick order: input -> rules -> beat bookkeeping -> clock. */
export function step(sim, input) {
  sim.events.length = 0;
  if (sim.tick >= MATCH_TICKS) return;

  if (input & IN_TAP) {
    if (windowOpen(sim) && sim.hitBeat !== sim.beat) {
      sim.hitBeat = sim.beat;
      sim.combo++;
      sim.best = Math.max(sim.best, sim.combo);
      sim.perfects++;
      const pts = RULES.perfect + RULES.comboStep * Math.min(sim.combo, RULES.comboCap);
      sim.score += pts;
      emit(sim, { type: 'hit', perfect: true, combo: sim.combo, pts });
    } else {
      sim.combo = 0;
      sim.whiffs++;
      sim.score = Math.max(0, sim.score + RULES.whiff);
      emit(sim, { type: 'hit', perfect: false, combo: 0, pts: RULES.whiff });
    }
  }

  if (sim.tick === sim.nextBeat + windowOf(sim.nextBeat) - 1) {      // last tick of the window
    if (sim.hitBeat !== sim.beat) { sim.combo = 0; sim.misses++; emit(sim, { type: 'miss' }); }
    advanceBeat(sim);
  }
  sim.tick++;
}

export const phase = sim => (sim.tick >= MATCH_TICKS ? 'over' : 'play');
export const score = sim => sim.score;
export const scoreBreakdown = sim => ({ perfects: sim.perfects, whiffs: sim.whiffs, misses: sim.misses, bestCombo: sim.best });

export function stateHash(sim) {
  return createHasher(sim.tick).mixAll([
    sim.score, sim.combo, sim.best, sim.beat, sim.nextBeat, sim.hitBeat, sim.perfects, sim.whiffs, sim.misses,
  ]).value();
}

/** GameDef consumed by core/match.js (Recorder, replay, verify) and tools/skill-dominance.mjs. */
export const GAME = Object.freeze({
  id: 'beat-tap', version: 2, maxTicks: MATCH_TICKS,
  createSim, step, phase, score, stateHash, scoreBreakdown,
});
