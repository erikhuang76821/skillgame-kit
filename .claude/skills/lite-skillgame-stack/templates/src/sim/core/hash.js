// State hash for replay verification: client and server must reach the same value after the
// same inputs. Feed every integer that can affect the score, in a fixed order (entities by id).
export function createHasher(seed = 0x9e3779b9) {
  let h = seed >>> 0;
  const hasher = {
    mix(v) { h = Math.imul(h ^ (v | 0), 0x01000193) >>> 0; return hasher; },
    mixAll(values) { for (const v of values) hasher.mix(v); return hasher; },
    value() { return h; },
  };
  return hasher;
}
