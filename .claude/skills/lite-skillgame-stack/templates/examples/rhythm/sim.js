// Recipe example: 2-lane rhythm game on core/timing.js (headless GameDef; knowledge-base/12 §1).
// Input byte: bit 0 tap lane 0, bit 1 tap lane 1, bits 4..7 sub-tick phase of the (first) tap.
import { createHasher, TPS } from '../../src/sim/core/index.js';
import { SUB, WINDOWS, makeChart, createJudge, judgeTap, judgeMisses, maxScore } from '../../src/sim/core/timing.js';

export const LANE0 = 1, LANE1 = 2;
export const encode = (lanes, phase = 0) => lanes | ((phase & 15) << 4);

const CHART = { startTick: 90, beats: 48, beatTicks: 24, lanes: 2 };     // 150 BPM, ~50 s
export const MATCH_TICKS = CHART.startTick + CHART.beats * CHART.beatTicks + TPS;

export function createSim(seed) {
  const chart = makeChart(seed, CHART);
  return { seed: seed >>> 0, tick: 0, chart, judge: createJudge(chart), events: [], recordEvents: true };
}

export function step(sim, input) {
  sim.events.length = 0;
  const t = sim.tick * SUB + ((input >> 4) & 15);
  for (const [bit, lane] of [[LANE0, 0], [LANE1, 1]]) {
    if (!(input & bit)) continue;
    const r = judgeTap(sim.judge, sim.chart, t, lane, WINDOWS);
    if (sim.recordEvents) sim.events.push({ type: r.whiff ? 'whiff' : 'hit', lane, ...r });
  }
  judgeMisses(sim.judge, sim.chart, sim.tick * SUB, WINDOWS, n => sim.recordEvents && sim.events.push({ type: 'miss', note: n }));
  sim.tick++;
}

export const phase = sim => (sim.tick >= MATCH_TICKS ? 'over' : 'play');
export const score = sim => sim.judge.score;
export const scoreBreakdown = sim => {
  const [miss, good, great, perfect] = sim.judge.counts;
  return { perfect, great, good, miss, whiffs: sim.judge.whiffs, maxCombo: sim.judge.maxCombo };
};
export const stateHash = sim => createHasher(sim.tick).mixAll([sim.judge.score, sim.judge.combo, sim.judge.whiffs, ...sim.judge.grade]).value();
export { maxScore };

export const GAME = Object.freeze({ id: 'example-rhythm', version: 1, maxTicks: MATCH_TICKS, createSim, step, phase, score, stateHash, scoreBreakdown });
