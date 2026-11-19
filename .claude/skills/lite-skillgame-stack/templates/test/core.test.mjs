// Core guarantees, independent of the game rules. Keep this file unchanged in every game.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hash32, makeRng, seedFromString, SIN, COS, angleOf, createHasher,
  Recorder, replay, verify, encodeLog, decodeLog, playMatch,
} from '../src/sim/core/index.js';

test('golden constants (run on every target engine: Node/V8, Safari/JSC, Firefox)', () => {
  // Any drift here means client and server replays would disagree.
  assert.equal(hash32(1, 2, 3), 1647877407);
  assert.equal(seedFromString('daily-2026-10-19'), 1943510868);
  assert.equal([...SIN].reduce((s, v) => s + v * v, 0), 8388772);
  assert.equal(SIN[64], 256);
  assert.equal(COS[0], 256);
  assert.equal(SIN[32], 181);
  const r = makeRng({ a: 1 });
  assert.equal(r(42, 'a', 0), 481396865);
  assert.equal(r.shuffle(42, 'a', 0, [1, 2, 3, 4, 5]).join(','), '4,2,1,3,5');
});

test('rng is stateless: order of draws never changes values', () => {
  const r = makeRng({ spawn: 1, offer: 2 });
  const forward = [0, 1, 2, 3].map(i => r(7, 'spawn', i));
  r(7, 'offer', 99);
  const backward = [3, 2, 1, 0].map(i => r(7, 'spawn', i)).reverse();
  assert.deepEqual(forward, backward);
  assert.notEqual(r(7, 'spawn', 0), r(7, 'offer', 0));
  assert.throws(() => r(7, 'typo', 0));
  for (let i = 0; i < 200; i++) {
    const v = r.range(7, 'spawn', i, 3, 5);
    assert.ok(v >= 3 && v <= 5);
  }
});

test('angleOf inverts the trig table exactly', () => {
  for (let a = 0; a < 256; a++) assert.equal(angleOf(COS[a] * 1000, SIN[a] * 1000), a);
  assert.equal(angleOf(1, 1), 32);
  assert.equal(angleOf(0, -3), 192);
});

// A tiny game with a mid-match choice, to exercise Recorder / replay / verify.
const MINI = {
  id: 'mini', version: 3, maxTicks: 120, maxChoices: 1,
  createSim: seed => ({ seed, tick: 0, x: 0, mult: 1, picked: false }),
  step(s, input) { s.x += (input & 3) * s.mult; s.tick++; },
  phase: s => (s.tick >= 100 ? 'over' : s.tick === 50 && !s.picked ? 'choice' : 'play'),
  choose(s, i) { if (i < 0 || i > 2) return false; s.mult = i + 1; s.picked = true; return true; },
  score: s => s.x,
  stateHash: s => createHasher(s.tick).mixAll([s.x, s.mult]).value(),
};
const policy = { input: s => hash32(s.seed, 1, s.tick) & 3, pick: () => 2 };

test('record -> upload -> verify round trip', () => {
  const rec = playMatch(MINI, 99, policy);
  const up = rec.upload();
  assert.equal(up.ticks, 100);
  assert.deepEqual(up.choices, [[50, 0, 2]]);
  const v = verify(MINI, up);
  assert.equal(v.valid, true);
  assert.equal(v.score, up.score);
});

test('verify rejects tampering, wrong version, wrong choices, overlong logs', () => {
  const up = playMatch(MINI, 99, policy).upload();
  assert.equal(verify(MINI, { ...up, score: up.score + 1 }).valid, false);
  assert.equal(verify(MINI, { ...up, version: 2 }).valid, false);
  assert.equal(verify(MINI, { ...up, choices: [[50, 0, 0]] }).valid, false);
  assert.equal(verify(MINI, { ...up, choices: [] }).valid, false);
  assert.equal(verify(MINI, { ...up, ticks: 110 }).valid, false);
  const log = decodeLog(up.log, MINI.maxTicks);
  log[10] ^= 1;
  assert.equal(verify(MINI, { ...up, log: encodeLog(log, up.ticks) }).valid, false);
});

test('log encoding is lossless and compact', () => {
  const log = new Uint8Array(10800);
  for (let i = 0; i < log.length; i++) log[i] = (i >> 7) & 9;
  const enc = encodeLog(log);
  assert.deepEqual(decodeLog(enc, log.length), log);
  assert.ok(enc.length < 2048, `${enc.length} B`);
});

test('recorder refuses input outside the play phase', () => {
  const rec = new Recorder(MINI, 1);
  for (let i = 0; i < 50; i++) rec.step(1);
  assert.equal(rec.phase, 'choice');
  assert.equal(rec.step(1), false);
  assert.equal(rec.choose(5), false);
  assert.equal(rec.choose(0), true);
  assert.equal(replay(MINI, 1, rec.log, rec.choices, rec.ticks).valid, false, 'claimed 50 ticks, match needs 100');
});

// A turn-based game: no ticks at all, every move is a choice (cards, boards, word and logic puzzles).
const STEPS = {
  id: 'steps', version: 1, maxTicks: 0, maxChoices: 6,
  createSim: seed => ({ seed, n: 0, acc: seed >>> 0 }),
  step() { throw new Error('a turn-based game is never stepped'); },
  phase: s => (s.n >= 6 ? 'over' : 'choice'),
  choose(s, i) { if (i < 0 || i > 9) return false; s.acc = (Math.imul(s.acc, 31) + i) >>> 0; s.n++; return true; },
  score: s => s.acc % 1000,
  stateHash: s => createHasher(s.n).mixAll([s.acc]).value(),
};
const MOVES = [3, 1, 4, 1, 5, 9];
const playSteps = () => { const rec = new Recorder(STEPS, 7); for (const m of MOVES) assert.equal(rec.choose(m), true); return rec; };

test('turn-based match (maxTicks 0, choices only) records, uploads and verifies', () => {
  const rec = playSteps(), up = rec.upload();
  assert.equal(rec.phase, 'over');
  assert.deepEqual([up.ticks, up.log, up.choices.length], [0, '', 6]);
  assert.deepEqual(up.choices[2], [0, 2, 4]);
  const v = verify(STEPS, up);
  assert.deepEqual([v.valid, v.score], [true, up.score]);
  assert.deepEqual(playMatch(STEPS, 7, { pick: s => MOVES[s.n] }).result(), rec.result());
});

test('turn-based replay rejects a changed, missing, extra, reordered or illegal move', () => {
  const up = playSteps().upload(), swap = (k, v) => up.choices.map((c, i) => (i === k ? v : c));
  assert.equal(verify(STEPS, { ...up, choices: swap(2, [0, 2, 7]) }).valid, false, 'changed move');
  assert.equal(verify(STEPS, { ...up, choices: up.choices.slice(0, 5) }).valid, false, 'missing move');
  assert.equal(verify(STEPS, { ...up, choices: [...up.choices.slice(0, 5), [0, 5, 9], [0, 6, 1]] }).reason, 'too many choices');
  assert.equal(verify(STEPS, { ...up, choices: [up.choices[1], up.choices[0], ...up.choices.slice(2)] }).valid, false, 'reordered');
  assert.equal(verify(STEPS, { ...up, choices: swap(0, [0, 0, 10]) }).valid, false, 'index the game refuses');
  assert.equal(verify(STEPS, { ...up, choices: swap(0, [0, 0, 3.5]) }).valid, false, 'non-integer index');
  assert.equal(verify(STEPS, { ...up, choices: swap(0, [1, 0, 3]) }).valid, false, 'wrong tick');
  assert.equal(verify(STEPS, { ...up, ticks: 1 }).valid, false, 'claims ticks the match never had');
});

test('maxChoices bounds a match on both sides, and a game with choose() must declare it', () => {
  // A buggy or hostile game whose choices never end the match: the recorder stops taking moves, the server rejects the list.
  const ENDLESS = { ...STEPS, id: 'endless', maxChoices: 4, phase: () => 'choice' };
  const rec = new Recorder(ENDLESS, 1);
  for (let i = 0; i < 4; i++) assert.equal(rec.choose(1), true);
  assert.equal(rec.choose(1), false, 'the fifth move is refused');
  const many = Array.from({ length: 5 }, (_, i) => [0, i, 1]);
  assert.equal(replay(ENDLESS, 1, new Uint8Array(0), many, 0).reason, 'too many choices');
  assert.equal(replay(ENDLESS, 1, new Uint8Array(0), many.slice(0, 4), 0).valid, false, 'the list ran out before the match ended');
  assert.throws(() => new Recorder({ ...STEPS, maxChoices: undefined }, 1), /maxChoices/);
  assert.throws(() => replay({ ...STEPS, maxChoices: 0 }, 1, new Uint8Array(0), [], 0), /maxChoices/);
  // A game without choose() needs no cap and accepts no choices.
  const { choose, maxChoices, ...NOCHOICE } = MINI;
  assert.equal(new Recorder(NOCHOICE, 1).maxChoices, 0);
  assert.equal(replay({ ...NOCHOICE, phase: s => (s.tick >= 100 ? 'over' : 'play') }, 1, new Uint8Array(120), [[0, 0, 0]], 100).reason, 'too many choices');
});

test('a malformed upload is rejected with its reason, never thrown on', () => {
  const up = playSteps().upload(), reason = (game, u) => { const v = verify(game, u); assert.equal(v.valid, false, JSON.stringify(u)); return v.reason; };
  for (const u of [null, undefined, 7, 'x']) assert.equal(reason(STEPS, u), 'malformed upload');
  for (const choices of [null, 'x', { length: 6 }]) assert.equal(reason(STEPS, { ...up, choices }), 'malformed choices');
  for (const seed of ['7', 7.5, -1, 2 ** 32 + 7, null]) assert.equal(reason(STEPS, { ...up, seed }), 'malformed seed');
  for (const ticks of [null, 0.5, -1, 1, 2 ** 40]) assert.equal(reason(STEPS, { ...up, ticks }), 'malformed ticks');   // STEPS.maxTicks is 0
  for (const log of [5, null, [], '***', 'AQ==']) assert.equal(reason(STEPS, { ...up, log }), 'malformed log');        // a 0-tick match has an empty log
  for (const entry of [null, 1, 'a', {}, [], [0], [0, 0, 3, 'extra']]) assert.equal(reason(STEPS, { ...up, choices: [entry, ...up.choices.slice(1)] }), 'choice 0');
  // Aliases of a valid upload are not valid uploads: one match, one spelling.
  const max = playMatch(STEPS, 0xffffffff, { pick: s => MOVES[s.n] }).upload();
  assert.equal(verify(STEPS, max).valid, true);
  assert.equal(reason(STEPS, { ...max, seed: -1 }), 'malformed seed');
  // A missing choice list is an empty one (games without choices omit it); null is not.
  const mini = playMatch(MINI, 99, policy).upload();
  assert.equal(reason(MINI, { ...mini, choices: undefined }), 'choice 0');
  assert.equal(reason(MINI, { ...mini, choices: null }), 'malformed choices');
});

test('only the recorder\'s own log encoding is accepted, and an oversized log is refused before it is decoded', () => {
  const up = playMatch(MINI, 99, policy).upload();
  assert.equal(verify(MINI, up).valid, true);
  const raw = atob(up.log), re = s => btoa(s);
  assert.equal(verify(MINI, { ...up, log: re(raw + String.fromCharCode(0, 1)) }).reason, 'malformed log', 'a trailing pair past the claimed ticks');
  assert.equal(verify(MINI, { ...up, log: re(raw.slice(0, -2)) }).reason, 'malformed log', 'a log shorter than the claimed ticks');
  assert.equal(verify(MINI, { ...up, log: re(String.fromCharCode(0, 0) + raw) }).reason, 'malformed log', 'an empty run');
  assert.equal(verify(MINI, { ...up, log: 'AAAA'.repeat(500000) }).reason, 'malformed log', 'two megabytes of padding');
  // The worst case a real match can produce (every tick a different byte) still fits the length bound.
  const NOISY = { ...MINI, id: 'noisy' }, rec = playMatch(NOISY, 3, { input: s => s.tick & 1 ? 2 : 1, pick: () => 0 });
  assert.equal(verify(NOISY, rec.upload()).valid, true);
});

test('what the recorder accepts is exactly what replays: bytes only, and a choice counts only when choose() returns true', () => {
  const rec = new Recorder(MINI, 1);
  for (const input of [256, -1, 1.5, '1', undefined, true]) assert.equal(rec.step(input), false, String(input));
  assert.equal(rec.ticks, 0, 'nothing was logged or stepped');
  assert.equal(rec.step(255), true);
  // A game whose choose() returns a truthy non-boolean is refused on both sides instead of accepted on one.
  const SLOPPY = { ...STEPS, id: 'sloppy', choose(s, i) { s.n++; return 1; } };
  assert.equal(new Recorder(SLOPPY, 1).choose(1), false);
  assert.equal(replay(SLOPPY, 1, new Uint8Array(0), [[0, 0, 1]], 0).reason, 'choice 0');
});

test('ticks and choices mix: choices are pinned to the tick they happened at', () => {
  // Aim (choice), then the world runs for 10 ticks, three times over (physics-aiming games).
  const AIM = {
    id: 'aim', version: 1, maxTicks: 30, maxChoices: 3,
    createSim: seed => ({ seed, tick: 0, shots: 0, rolling: 0, x: 0, v: 0 }),
    step(s, input) { s.x += s.v + (input & 1); s.tick++; s.rolling--; },
    phase: s => (s.rolling > 0 ? 'play' : s.shots >= 3 ? 'over' : 'choice'),
    choose(s, i) { if (i < 0 || i > 15) return false; s.v = i; s.shots++; s.rolling = 10; return true; },
    score: s => s.x,
    stateHash: s => createHasher(s.tick).mixAll([s.x, s.shots]).value(),
  };
  const rec = playMatch(AIM, 5, { input: s => s.tick & 1, pick: s => 4 + s.shots }), up = rec.upload();
  assert.deepEqual(up.choices, [[0, 0, 4], [10, 1, 5], [20, 2, 6]]);
  assert.equal(up.ticks, 30);
  assert.equal(verify(AIM, up).valid, true);
  assert.equal(verify(AIM, { ...up, choices: [[0, 0, 4], [11, 1, 5], [20, 2, 6]] }).valid, false, 'a choice moved to another tick');
  assert.equal(rec.step(1), false, 'no input after the match is over');
  const mid = new Recorder(AIM, 5);
  assert.equal(mid.step(1), false, 'no tick while a choice is pending');
  assert.equal(mid.choose(4), true);
  assert.equal(mid.choose(4), false, 'no choice while the world is running');
});
