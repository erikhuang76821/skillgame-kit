// Stateless hash RNG: a value depends only on (seed, stream, index), never on call order,
// so two players who act differently still face the same spawns, offers and drops.
// Uses only 32-bit integer ops (Math.imul, xor, shifts): identical on every JS engine.

export function hash32(a, b, c) {
  let h = (a ^ Math.imul(b + 0x632be5ab, 0x9e3779b1) ^ Math.imul(c + 0x2545f491, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Build a named-stream RNG. Every source of randomness gets its own stream so adding draws to
 * one system never shifts another: makeRng({ spawn: 1, offer: 2 }) -> rng(seed, 'spawn', i).
 * Never renumber a stream after release: old replays would replay a different game.
 */
export function makeRng(streams) {
  const ids = Object.freeze({ ...streams });
  const id = name => {
    const s = ids[name];
    if (!s) throw new Error(`Unknown RNG stream: ${name}`);
    return s;
  };
  /** uint32 */
  const rng = (seed, stream, index) => hash32(seed >>> 0, id(stream), index >>> 0);
  /** integer in [0, n) — float ops here are exact (uint32 / 2^32 * n), so engine-independent */
  rng.int = (seed, stream, index, n) => Math.floor((rng(seed, stream, index) / 4294967296) * n);
  /** integer in [lo, hi] */
  rng.range = (seed, stream, index, lo, hi) => lo + rng.int(seed, stream, index, hi - lo + 1);
  /** Fisher–Yates copy of `arr`, the k-th shuffle of this stream (e.g. k-th level-up offer) */
  rng.shuffle = (seed, stream, k, arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor((hash32(rng(seed, stream, k), i, 0x5f3759df) / 4294967296) * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return rng;
}

/** FNV-1a over a string: share codes, daily seeds ('daily-2026-10-19'), tournament ids. */
export function seedFromString(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}
