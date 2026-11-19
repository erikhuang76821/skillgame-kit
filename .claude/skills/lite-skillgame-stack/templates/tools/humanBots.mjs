// Human-factor playtest bots for the demo game (knowledge-base/16 §4). Replace with bots for your game.
// Unlike the skill-tier bots in bots.mjs, these model WHY people miss: reading load (beats close together),
// late-match fatigue, lapses and nervous extra taps. tools/playtest.mjs uses them to check the scripted curve.
// Same rules as every bot: only bytes a human could send, only what is on screen (the beat cue), deterministic.
// Fuller model (reaction time, side switches, novelty of a new enemy, learning): TwinStrike/game/tools/humanBots.mjs.
import { hash32, TPS } from '../src/sim/core/index.js';
import { IN_TAP, beatWindow } from '../src/sim/sim.js';

const MS = 1000 / TPS;
const bell = (seed, salt, i) => { let s = 0; for (let k = 0; k < 4; k++) s += (hash32(seed, salt + k, i) / 4294967296) * 2 - 1; return s / 2 / 0.58; };
const roll = (seed, salt, i) => hash32(seed, salt, i) / 4294967296;

/**
 * @param p { sdMs: timing spread, densityK: extra spread per beat/s above 1, fatigueK: extra spread in the last third,
 *            missPm: lapses per mille, mashPm: nervous extra taps per mille per tick }
 */
export function makeHumanBot(salt, p) {
  const last = new WeakMap();                                      // per sim: tick of the previous beat (to feel density)
  return {
    input(sim) {
      const seed = sim.seed, i = sim.beat, w = beatWindow(sim);
      let prev = last.get(sim);
      if (!prev || prev.beat !== i) { prev = { beat: i, gap: prev ? sim.nextBeat - prev.at : 60, at: sim.nextBeat }; last.set(sim, prev); }
      const rate = TPS / Math.max(1, prev.gap);
      const sd = p.sdMs * (1 + p.densityK * Math.max(0, rate - 1)) * (sim.tick > 20 * TPS ? 1 + p.fatigueK : 1);
      const at = sim.nextBeat + (w >> 1) + Math.round((bell(seed, salt, i) * sd) / MS);
      if (sim.tick === at && roll(seed, salt + 9, i) * 1000 >= p.missPm) return IN_TAP;
      return p.mashPm && roll(seed, salt + 5, sim.tick) * 1000 < p.mashPm ? IN_TAP : 0;
    },
  };
}

// Three people, not three skill levels of the same machine: a first-time casual player, a regular, a skilled player.
export const HUMANS = {
  casual: makeHumanBot(1100, { sdMs: 46, densityK: 0.5, fatigueK: 0.15, missPm: 40, mashPm: 2 }),
  regular: makeHumanBot(1200, { sdMs: 30, densityK: 0.35, fatigueK: 0.08, missPm: 12, mashPm: 0 }),
  skilled: makeHumanBot(1300, { sdMs: 18, densityK: 0.2, fatigueK: 0.04, missPm: 3, mashPm: 0 }),
};
