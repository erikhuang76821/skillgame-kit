// Comparison strategies for the demo game's skill evidence (tools/skill-evidence.mjs). Replace with your game's.
// Freeze them before a confirmation run; say what each one sees and what it is limited to (spec §9).
//   strong  the best play you can script without seeing more than the player sees
//   random  uniform choice among actions that are legal AND move the game forward (not noise that never plays)
//   simple  rules a beginner can follow from one sentence, with no precise timing or aim; at least one
import { hash32 } from '../src/sim/core/index.js';
import { IN_TAP, SCRIPT, beatWindow } from '../src/sim/sim.js';

const simple = (limits, policy) => ({ role: 'simple', sees: '不看畫面提示', limits, policy });

// The strong strategy: tap at the centre of each beat's window with a seeded timing error of at most ±5 ticks.
const SPREAD = 10, STRONG_SALT = 303;
const strong = { input(sim) {
  const centre = sim.nextBeat + (beatWindow(sim) >> 1);
  const err = (hash32(sim.seed, STRONG_SALT, sim.beat) % (SPREAD + 1)) - (SPREAD >> 1);
  return sim.tick === centre + err ? IN_TAP : 0;
} };

// The random strategy's decision: once per beat, WHEN to tap. Its action set is every tick of a span that ends when
// the beat's window closes; the span is the shortest gap minus the longest window, so it never reaches back into the
// previous beat. Excluded: not tapping at all, and tapping more than once per beat (neither plays the beat).
const SPAN = Math.min(...SCRIPT.map(s => s.gapMin)) - Math.max(...SCRIPT.map(s => s.window));

export const STRATEGIES = {
  expert: { role: 'strong', sees: '下一拍何時開始（畫面上的提示）', limits: '每拍的時機誤差在 ±5 tick 內', policy: strong },
  'one random tap per beat': {
    role: 'random', sees: '下一拍何時開始（畫面上的提示）',
    limits: `每拍恰好點一下，時機在該拍判定窗關閉前的 ${SPAN} 個 tick 內均勻抽；不點與一拍多點不在動作集合內`,
    policy: { input: sim => (sim.tick === sim.nextBeat + beatWindow(sim) - 1 - (hash32(sim.seed, 909, sim.beat) % SPAN) ? IN_TAP : 0) },
  },
  'mash every 6 ticks': simple('固定節奏，一句話規則', { input: sim => (sim.tick % 6 === 0 ? IN_TAP : 0) }),
  'tap a steady beat (every 30 ticks)': simple('固定節奏，一句話規則', { input: sim => (sim.tick % 30 === 0 ? IN_TAP : 0) }),
};
