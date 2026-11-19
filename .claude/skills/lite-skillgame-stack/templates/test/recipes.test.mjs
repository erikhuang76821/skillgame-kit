// Recipe guarantees (knowledge-base/12): rhythm judgement and deterministic physics, plus the
// two headless example games under examples/. Delete the examples' tests if you delete examples/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { playMatch, verify } from '../src/sim/core/index.js';
import { SUB, WINDOWS, GRADE, makeChart, createJudge, judgeTap, judgeMisses, maxScore, msToSub } from '../src/sim/core/timing.js';
import { AIM_STEPS, aimDir, createWorld, addBall, strike, stepWorld, atRest } from '../src/sim/core/physics.js';
import * as rhythm from '../examples/rhythm/sim.js';
import { BOTS as RHYTHM_BOTS } from '../examples/rhythm/bots.mjs';
import * as pool from '../examples/billiards/sim.js';
import { BOTS as POOL_BOTS } from '../examples/billiards/bots.mjs';
import { runDominance } from '../tools/lib/dominance.mjs';

// ---------- timing ----------
test('chart depends only on the seed', () => {
  assert.deepEqual(makeChart(9), makeChart(9));
  assert.notDeepEqual(makeChart(9), makeChart(10));
});

test('judgement windows are exact at their edges (sub-tick precision)', () => {
  const chart = [{ t: 1000, lane: 0 }, { t: 3000, lane: 0 }, { t: 5000, lane: 0 }, { t: 7000, lane: 0 }];
  const j = createJudge(chart);
  assert.equal(judgeTap(j, chart, 1000 + WINDOWS.perfect).grade, GRADE.PERFECT);
  assert.equal(judgeTap(j, chart, 3000 - WINDOWS.perfect - 1).grade, GRADE.GREAT);
  assert.equal(judgeTap(j, chart, 5000 + WINDOWS.good).grade, GRADE.GOOD);
  assert.ok(judgeTap(j, chart, 7000 - WINDOWS.good - 1).whiff, 'outside good = whiff');
  assert.equal(j.combo, 0, 'whiff breaks combo');
  judgeMisses(j, chart, 7000 + WINDOWS.good + 1);
  assert.deepEqual([...j.grade], [3, 2, 1, 0]);
});

test('perfect play reaches exactly the theoretical maximum; nothing can exceed it', () => {
  const chart = makeChart(3, { beats: 40 });
  const j = createJudge(chart);
  for (const n of chart) judgeTap(j, chart, n.t, n.lane);
  assert.equal(j.score, maxScore(chart));
  assert.equal(j.maxCombo, chart.length);
});

test('one sub-tick = about 1 ms at 60 TPS', () => {
  assert.equal(SUB, 16);
  assert.equal(msToSub(1000), 960);
});

test('rhythm example: deterministic, verifiable, skill-dominant', () => {
  const rec = playMatch(rhythm.GAME, 77, RHYTHM_BOTS.intermediate);
  assert.deepEqual(rec.result(), playMatch(rhythm.GAME, 77, RHYTHM_BOTS.intermediate).result());
  assert.equal(verify(rhythm.GAME, rec.upload()).valid, true);
  assert.ok(rhythm.GAME.score(rec.sim) <= rhythm.maxScore(rec.sim.chart));
  const r = runDominance(rhythm.GAME, RHYTHM_BOTS, 20);
  assert.ok(r.pass, `skill ${r.shares.skillTier.toFixed(2)} top ${r.top.toFixed(2)}`);
});

// ---------- physics ----------
const table = (extra = {}) => createWorld({ w: 400, h: 200, restitution: 1024, ballRestitution: 1024, friction: 0, rolling: 0, stopSpeed: 0, ...extra });

test('aim table: 4096 unit directions, axis-exact', () => {
  assert.deepEqual(aimDir(0), [1, 0]);
  assert.ok(Math.abs(aimDir(1024)[1] - 1) < 1e-12);
  for (let a = 0; a < AIM_STEPS; a += 97) { const [x, y] = aimDir(a); assert.ok(Math.abs(x * x + y * y - 1) < 1e-12); }
});

test('head-on equal-mass hit: the cue stops, the object ball takes its speed', () => {
  const w = table(), a = addBall(w, 0, 100, 100, 8), b = addBall(w, 1, 200, 100, 8);
  strike(a, 0, 512);
  for (let i = 0; i < 70; i++) stepWorld(w);                     // 2 px/tick, 84 px gap
  assert.ok(Math.abs(a.vx) <= 2, `cue vx ${a.vx}`);
  assert.ok(Math.abs(b.vx - 512) <= 2, `object vx ${b.vx}`);
});

test('no tunnelling at very high speed', () => {
  const w = table(), a = addBall(w, 0, 20, 100, 4), b = addBall(w, 1, 60, 100, 4);
  strike(a, 0, 64 * 256);                                   // 64 px per tick, far more than a diameter
  const ev = [];
  stepWorld(w, ev);
  assert.ok(ev.some(e => e.type === 'ball'), 'the hit was detected');
  assert.ok(a.x < b.x, 'cue did not pass through');
});

test('friction brings everything to rest; pockets swallow balls', () => {
  const w = createWorld({ w: 400, h: 200, friction: 10, pockets: [{ x: 400, y: 100, r: 14 }] });
  const a = addBall(w, 0, 300, 100, 8);
  strike(a, 0, 900);
  const ev = [];
  for (let i = 0; i < 2000 && !atRest(w); i++) stepWorld(w, ev);
  assert.ok(atRest(w));
  assert.ok(ev.some(e => e.type === 'pocket') && !a.alive);
});

test('billiards example: deterministic golden, verifiable shots, skill beats luck on two seed sets', () => {
  assert.deepEqual(playMatch(pool.GAME, 5, POOL_BOTS.expert).result(),
    { game: 'example-billiards', version: 2, seed: 5, ticks: 5327, score: 900, hash: 743984462 });
  const up = playMatch(pool.GAME, 8, POOL_BOTS.intermediate).upload();
  assert.equal(verify(pool.GAME, up).valid, true);
  assert.equal(verify(pool.GAME, { ...up, choices: up.choices.map(([t, k, i]) => [t, k, i ^ 1]) }).valid, false);
  // Must hold on a second, unrelated seed set too, not just the default one (knowledge-base/12 §3).
  for (const [n, base] of [[30, 2026], [40, 777]]) {
    const r = runDominance(pool.GAME, POOL_BOTS, n, base);
    assert.ok(r.pass, `seeds ${base}: skill ${r.shares.skillTier.toFixed(2)} top ${r.top.toFixed(2)}`);
  }
});
