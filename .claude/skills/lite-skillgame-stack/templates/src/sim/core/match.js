// Recording, replay verification and compact log encoding for any game that implements the
// GameDef contract below. The server runs replay() on the uploaded log; a mismatch voids the score.
//
// GameDef (exported by src/sim/sim.js as GAME):
//   id, version          string / int — bump `version` whenever a rule change alters outcomes
//   maxTicks             hard cap on match length (log buffer size)
//   createSim(seed)      -> sim
//   step(sim, input)     one fixed tick; `input` is one byte (see spec §2 for the bit layout)
//   phase(sim)           'play' | 'choice' | 'over'
//   choose(sim, index)   -> true | false (only while phase === 'choice'); omit if the game has none.
//                        Returning false must leave the sim untouched: a refused choice is not logged, so any
//                        change it made would be missing from the replay
//   maxChoices           hard cap on the number of choices in one match; required when the game has choose()
//   score(sim)           -> int
//   stateHash(sim)       -> uint32
//
// Turn-based games (cards, boards, word and logic puzzles) need no ticks at all: set maxTicks to 0, keep phase() at
// 'choice' until the match is over, and make every move one choose() call. A move is ONE integer: encode a move with
// several parts (card + target, a word) as an index into a table the sim builds from the seed, or as several choices
// in a row. The encoding is part of the rules: changing it bumps `version`. maxTicks does not bound such a match,
// maxChoices does — the recorder and the server both enforce it.

/** The game's choice cap: 0 when it has no choose(); a misconfigured GameDef is a programming error, not a bad upload. */
function choiceCap(game) {
  if (typeof game.choose !== 'function') return 0;
  if (!(Number.isInteger(game.maxChoices) && game.maxChoices >= 1)) throw new Error(`GameDef ${game.id}: choose() needs an integer maxChoices >= 1`);
  return game.maxChoices;
}

export class Recorder {
  constructor(game, seed) {
    this.game = game;
    this.seed = seed >>> 0;
    this.sim = game.createSim(this.seed);
    this.log = new Uint8Array(game.maxTicks);
    this.ticks = 0;
    this.maxChoices = choiceCap(game);
    this.choices = []; // [tick, ordinal, index]
    this.meta = {};    // client facts the server checks but the sim never reads (e.g. inputOffsetMs, late taps)
  }

  get phase() { return this.game.phase(this.sim); }

  step(input) {
    // Only a byte can be logged; anything else would reach the sim as one value and the log as another.
    if (this.phase !== 'play' || this.ticks >= this.game.maxTicks || !Number.isInteger(input) || input < 0 || input > 255) return false;
    this.log[this.ticks++] = input;
    this.game.step(this.sim, input);
    return true;
  }

  choose(index) {
    if (this.phase !== 'choice' || !Number.isInteger(index) || this.choices.length >= this.maxChoices) return false;
    const entry = [this.ticks, this.choices.length, index];
    if (this.game.choose(this.sim, index) !== true) return false;
    this.choices.push(entry);
    return true;
  }

  /** What the client uploads (plus the encoded log). */
  result() {
    const { game, sim } = this;
    return { game: game.id, version: game.version, seed: this.seed, ticks: this.ticks, score: game.score(sim), hash: game.stateHash(sim) };
  }

  upload() {
    return { ...this.result(), log: encodeLog(this.log, this.ticks), choices: this.choices, meta: this.meta };
  }
}

/**
 * Re-run a match from (seed, log, choices). Returns { valid, score, hash, ticks, sim }.
 * Pass `ticks` (the claimed match length) to also reject logs that run past the end of the match.
 */
export function replay(game, seed, log, choices = [], ticks) {
  const exact = ticks !== undefined;
  if (!exact) ticks = log.length;
  const cap = choiceCap(game);
  // Reject a malformed or oversized choice list before running anything: the upload is untrusted.
  if (!Array.isArray(choices)) return { valid: false, reason: 'malformed choices', sim: null, ticks: 0 };
  if (choices.length > cap) return { valid: false, reason: 'too many choices', sim: null, ticks: 0 };
  const sim = game.createSim(seed >>> 0);
  if ('recordEvents' in sim) sim.recordEvents = false;
  let t = 0, c = 0;
  const fail = reason => ({ valid: false, reason, sim, ticks: t });
  while (game.phase(sim) !== 'over') {
    if (game.phase(sim) === 'choice') {
      const ch = choices[c];
      if (!Array.isArray(ch) || ch.length !== 3 || ch[0] !== t || ch[1] !== c || !Number.isInteger(ch[2]) || game.choose(sim, ch[2]) !== true) return fail(`choice ${c}`);
      c++;
    } else {
      if (t >= ticks || t >= game.maxTicks) return fail('log ended before match');
      game.step(sim, log[t++]);
    }
  }
  if (c !== choices.length) return fail('unused choices');
  if (exact && t !== ticks) return fail('log longer than match');
  return { valid: true, score: game.score(sim), hash: game.stateHash(sim), ticks: t, sim };
}

/** Server-side check of an upload from Recorder.upload(). */
export function verify(game, upload) {
  // The upload is untrusted: check its shape and sizes before decoding or running anything, cheapest checks first.
  // (Cap the request size at the HTTP layer as well; this only bounds what a well-sized request can make us do.)
  const bad = reason => ({ valid: false, reason });
  if (upload === null || typeof upload !== 'object') return bad('malformed upload');
  if (upload.game !== game.id) return bad('wrong game');
  if (upload.version !== game.version) return bad(`sim version ${upload.version} != ${game.version}`);
  const { seed, ticks } = upload, choices = upload.choices === undefined ? [] : upload.choices;
  // One seed, one spelling: -1 or 2**32 + 7 would replay as another seed's match under `>>> 0`.
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return bad('malformed seed');
  if (!Number.isInteger(ticks) || ticks < 0 || ticks > game.maxTicks) return bad('malformed ticks');
  if (!Array.isArray(choices)) return bad('malformed choices');
  if (choices.length > choiceCap(game)) return bad('too many choices');
  // At most one (value, count) pair per tick, so the encoded length is bounded by the claimed ticks.
  if (typeof upload.log !== 'string' || upload.log.length > 4 * Math.ceil((2 * ticks) / 3)) return bad('malformed log');
  let log;
  try { log = decodeLog(upload.log, game.maxTicks); } catch { return bad('malformed log'); }
  // Only the recorder's own encoding of exactly `ticks` inputs is accepted: no padding, empty runs or trailing pairs.
  if (encodeLog(log, ticks) !== upload.log) return bad('malformed log');
  const r = replay(game, seed, log, choices, ticks);
  if (!r.valid) return r;
  if (r.score !== upload.score || r.hash !== upload.hash) return { ...r, valid: false, reason: 'score/hash mismatch' };
  return r;
}

// Run-length encode (value, count<=255) pairs -> base64. A 3-minute log is usually well under 2 KB.
export function encodeLog(log, length = log.length) {
  let bin = '';
  for (let i = 0; i < length;) {
    let n = 1;
    while (i + n < length && n < 255 && log[i + n] === log[i]) n++;
    bin += String.fromCharCode(log[i], n);
    i += n;
  }
  return btoa(bin);
}

export function decodeLog(text, maxTicks) {
  const bin = atob(text), log = new Uint8Array(maxTicks);
  let i = 0;
  for (let k = 0; k + 1 < bin.length && i < maxTicks; k += 2) {
    const n = bin.charCodeAt(k + 1);
    log.fill(bin.charCodeAt(k), i, Math.min(i + n, maxTicks));
    i += n;
  }
  return log;
}

/** Drive a match with a policy (bots, tests): policy.input(sim) -> byte, policy.pick(sim) -> index. */
export function playMatch(game, seed, policy) {
  const rec = new Recorder(game, seed);
  if ('recordEvents' in rec.sim) rec.sim.recordEvents = false;
  while (rec.phase !== 'over') {
    if (rec.phase === 'choice') { if (!rec.choose(policy.pick?.(rec.sim) ?? 0)) throw new Error('bot picked an invalid choice'); }
    else if (!rec.step(policy.input(rec.sim))) throw new Error(`match exceeded maxTicks (${game.maxTicks}), or the policy returned an input that is not a byte`);
  }
  return rec;
}
