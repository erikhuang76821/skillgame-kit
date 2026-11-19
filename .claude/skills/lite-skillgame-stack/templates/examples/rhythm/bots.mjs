// Rhythm bots: see the chart like a human sees scrolling notes, tap with a timing error drawn per
// note (deterministic hash, roughly bell-shaped), sometimes miss or press the wrong lane.
import { hash32 } from '../../src/sim/core/index.js';
import { SUB, msToSub } from '../../src/sim/core/timing.js';
import { encode, LANE0, LANE1 } from './sim.js';

const bell = (seed, salt, i) => {                        // sum of 4 uniforms in -1..1 -> ~normal, sd ≈ 0.58
  let s = 0;
  for (let k = 0; k < 4; k++) s += (hash32(seed, salt + k, i) / 4294967296) * 2 - 1;
  return s / 2;
};

function timingBot(salt, sdMs, missPct, wrongLanePct) {
  const sd = msToSub(sdMs) / 0.58;
  return {
    input(sim) {
      const from = sim.tick * SUB, to = from + SUB;
      for (let i = sim.judge.next; i < sim.chart.length && sim.chart[i].t < to + 4 * sd; i++) {
        if (hash32(sim.seed, salt + 9, i) % 100 < missPct) continue;
        const at = sim.chart[i].t + Math.round(bell(sim.seed, salt, i) * sd);
        if (at < from || at >= to) continue;
        const wrong = hash32(sim.seed, salt + 8, i) % 100 < wrongLanePct;
        const lane = sim.chart[i].lane ^ (wrong ? 1 : 0);
        return encode(lane ? LANE1 : LANE0, at - from);
      }
      return 0;
    },
  };
}

export const BOTS = {
  novice: timingBot(100, 75, 25, 15),
  intermediate: timingBot(200, 38, 8, 4),
  expert: timingBot(300, 16, 1, 0),
};
