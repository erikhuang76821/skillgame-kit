// Game-rule determinism and fairness. Rewrite the bodies for your game, keep the test names (spec §12).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { Recorder, playMatch, verify, replay } from '../src/sim/core/index.js';
import { GAME, IN_TAP, createSim, step } from '../src/sim/sim.js';
import { STRATEGIES } from '../tools/strategies.mjs';
import { runEvidence } from '../tools/lib/evidence.mjs';

// The game's own comparison strategies (tools/strategies.mjs) play the matches here; no tier bots are needed.
const play = role => Object.values(STRATEGIES).find(s => s.role === role).policy;
const STRONG = play('strong'), SIMPLE = play('simple'), RANDOM = play('random');

test('same seed + same inputs => identical result', () => {
  assert.deepEqual(playMatch(GAME, 1234, STRONG).result(), playMatch(GAME, 1234, STRONG).result());
});

test('golden match (cross-engine determinism; update only when GAME.version is bumped)', () => {
  assert.deepEqual(playMatch(GAME, 1234, STRONG).result(),
    { game: 'beat-tap', version: 2, seed: 1234, ticks: 1800, score: 423, hash: 2394985397 });
});

test('uploaded match verifies; tampered score does not', () => {
  const up = playMatch(GAME, 98765, SIMPLE).upload();
  assert.equal(verify(GAME, up).valid, true);
  assert.equal(verify(GAME, { ...up, score: up.score + 10 }).valid, false);
});

test('different seeds diverge', () => {
  assert.notEqual(playMatch(GAME, 1, STRONG).result().hash, playMatch(GAME, 2, STRONG).result().hash);
});

test('the challenge depends only on the seed, not on player behaviour (fairness E2)', () => {
  const beats = taps => {
    const sim = createSim(77), seen = [];
    for (let t = 0; t < GAME.maxTicks; t++) {
      if (!seen.includes(sim.nextBeat)) seen.push(sim.nextBeat);
      step(sim, taps(t) ? IN_TAP : 0);
    }
    return seen;
  };
  assert.deepEqual(beats(() => false), beats(t => t % 3 === 0));
});

test('render events never change the outcome (recordEvents off = same hash)', () => {
  const rec = new Recorder(GAME, 4242);                  // events on, like the live client
  while (rec.phase !== 'over') rec.step(RANDOM.input(rec.sim));
  assert.equal(rec.sim.recordEvents, true);
  const r = replay(GAME, 4242, rec.log, rec.choices, rec.ticks);   // events off, like the server
  assert.equal(r.hash, rec.result().hash);
});

// Thresholds come from RULE-SKILL-EVIDENCE through shared/tools/rules.mjs (never written here). Tuning questions only:
// the confirmation run is npm run evidence:confirm, done by a person once the strategies are frozen.
async function evidenceThresholds() {
  const { dirname, join } = await import('node:path'), { existsSync } = await import('node:fs'), { fileURLToPath, pathToFileURL } = await import('node:url');
  let d = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(d, 'shared', 'tools', 'rules.mjs'))) { const up = dirname(d); if (up === d) throw new Error('shared/tools/rules.mjs not found'); d = up; }
  const rules = (await import(pathToFileURL(join(d, 'shared', 'tools', 'rules.mjs')).href)).loadRules({ from: fileURLToPath(import.meta.url) });
  return { alpha: rules.value('RULE-SKILL-EVIDENCE', 'alpha'), minQuestions: rules.value('RULE-SKILL-EVIDENCE', 'minQuestions') };
}

test('skill evidence on the tuning questions: the strong strategy beats the random one and every simple one', async () => {
  const thresholds = await evidenceThresholds();
  const r = runEvidence(GAME, STRATEGIES, { n: thresholds.minQuestions, thresholds });
  assert.deepEqual(r.verdict, { enoughQuestions: true, beatsRandom: true, beatsEverySimple: true, pass: true }, r.pairs.map(p => `${p.other}: ${p.wins}-${p.ties}-${p.losses} p=${p.p}`).join('; '));
});

// Legacy measure (RULE-SKILL-DOMINANCE applies to the three existing games only). It runs only while tools/bots.mjs
// exists: a new game deletes bots.mjs and skill-dominance.mjs, and this test skips itself. (tools/lib/dominance.mjs
// stays while examples/ and test/recipes.test.mjs are kept: the recipe examples still use it.)
const hasTiers = existsSync(new URL('../tools/bots.mjs', import.meta.url));
test('legacy: skill tiers separate on the same seeds (only with tools/bots.mjs)', { skip: !hasTiers && 'no tools/bots.mjs' }, async () => {
  const { runDominance } = await import('../tools/lib/dominance.mjs');
  const { BOTS } = await import('../tools/bots.mjs');
  const r = runDominance(GAME, BOTS, 12);
  assert.ok(r.pass, `skill share ${r.shares.skillTier.toFixed(2)}, top win rate ${r.top.toFixed(2)}`);
});

// Only games with scripted progression have a difficulty curve to check (RULE-CURVE-*, RULE-GAME-DOCS). A game whose
// <Game>/game.profile.json says scriptedProgression: false skips this test; the template itself (no profile) runs it.
const noCurve = (() => {
  try { return JSON.parse(readFileSync(new URL('../../game.profile.json', import.meta.url), 'utf8')).scriptedProgression === false; } catch { return false; }
})();

test('scripted difficulty curve passes the D-gates (knowledge-base/16; full report: npm run playtest)', { skip: noCurve && 'game.profile.json: scriptedProgression is false' }, async () => {
  const { execFileSync } = await import('node:child_process');
  // tools/playtest.mjs exits 1 when any check fails; 8 seeds keep the test fast
  assert.doesNotThrow(() => execFileSync(process.execPath, ['tools/playtest.mjs', '8'], { cwd: new URL('..', import.meta.url), stdio: 'pipe' }));
});

test('full-match replay fits the server budget', () => {
  const rec = playMatch(GAME, 4242, STRONG);
  const t0 = performance.now();
  assert.equal(replay(GAME, 4242, rec.log, rec.choices, rec.ticks).valid, true);
  assert.ok(performance.now() - t0 < 500);
});
