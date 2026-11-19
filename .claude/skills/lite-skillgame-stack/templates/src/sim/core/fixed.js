// Fixed-point math for the sim. Positions are integers in 1/ONE units (sub-pixels).
// Only + - * / and Math.sqrt are used (IEEE-exact everywhere). Math.sin/cos/atan2/pow may differ
// in the last bit between JavaScriptCore (iOS) and V8 (server), so trig comes from tables
// built with a Taylor series of basic arithmetic.
export const ONE = 256;

function taylorSin(x) {
  const x2 = x * x;
  let term = x, sum = x;
  for (let k = 1; k < 14; k++) {
    term *= -x2 / ((2 * k) * (2 * k + 1));
    sum += term;
  }
  return sum;
}

/** 256 angle steps per turn; SIN[a], COS[a] are scaled by ONE. Angle 0 = +x, 64 = +y (screen down). */
export const ANGLES = 256;
export const SIN = new Int32Array(ANGLES);
export const COS = new Int32Array(ANGLES);
for (let i = 0; i < ANGLES; i++) {
  let a = (i * 2 * Math.PI) / ANGLES;
  if (a > Math.PI) a -= 2 * Math.PI;
  SIN[i] = Math.round(taylorSin(a) * ONE);
}
for (let i = 0; i < ANGLES; i++) COS[i] = SIN[(i + 64) & 255];

// 2^16-scaled copy used only by angleOf: the ONE-scaled table rounds too coarsely to separate
// neighbouring angles near the maximum of the dot product.
const HI = 65536;
const SIN_HI = new Int32Array(ANGLES);
for (let i = 0; i < ANGLES; i++) {
  let a = (i * 2 * Math.PI) / ANGLES;
  if (a > Math.PI) a -= 2 * Math.PI;
  SIN_HI[i] = Math.round(taylorSin(a) * HI);
}

/** Deterministic atan2 replacement: the table angle (0..255) closest to the direction (dx, dy). Keep |dx|,|dy| < 2^30. */
export function angleOf(dx, dy) {
  if (dx === 0 && dy === 0) return 0;
  let best = 0, bestDot = -Infinity;
  for (let a = 0; a < ANGLES; a++) {
    const d = dx * SIN_HI[(a + 64) & 255] + dy * SIN_HI[a];   // integer products, exact below 2^53
    if (d > bestDot) { bestDot = d; best = a; }
  }
  return best;
}

// Eight directions in sprite-row order: down, down_right, right, up_right, up, up_left, left, down_left.
// Index 0 = stop is NOT included; input codes 1..8 map to DX[code - 1].
const D = 181; // round(ONE / sqrt 2)
export const DX = Int32Array.of(0, D, ONE, D, 0, -D, -ONE, -D);
export const DY = Int32Array.of(ONE, D, 0, -D, -ONE, -D, 0, D);

/** Fixed-point multiply / divide (truncate toward zero, same as the sim's integer convention). */
export const fmul = (a, b) => Math.trunc((a * b) / ONE);
export const fdiv = (a, b) => Math.trunc((a * ONE) / b);
export const toFixed = v => Math.round(v * ONE);
export const fromFixed = v => v / ONE;

/** Squared distance: compare against r * r, never take sqrt in a branch condition. */
export const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
