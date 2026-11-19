// Deterministic circle physics recipe (knowledge-base/12 §2): billiards, bubble shooters, pucks, marbles.
// State is integer sub-px (ONE per px) so it hashes and serialises exactly. Collision response uses
// doubles, but only + - * / and Math.sqrt — IEEE-754 guarantees identical results on every engine;
// never Math.sin/cos/atan2/pow in here (aim directions come from the Taylor-built table below).
// Order is fixed (balls by array index, pairs i < j), and fast balls are sub-stepped so they cannot
// tunnel through each other.
import { ONE } from './fixed.js';

// ---- aim: 4096 directions (0.088° each), table built with basic arithmetic only ----
export const AIM_STEPS = 4096;
function taylorSin(x) {
  const x2 = x * x;
  let term = x, sum = x;
  for (let k = 1; k < 16; k++) { term *= -x2 / ((2 * k) * (2 * k + 1)); sum += term; }
  return sum;
}
const AIM_SIN = new Float64Array(AIM_STEPS);
for (let i = 0; i < AIM_STEPS; i++) {
  let a = (i * 2 * Math.PI) / AIM_STEPS;
  if (a > Math.PI) a -= 2 * Math.PI;
  AIM_SIN[i] = Math.max(-1, Math.min(1, taylorSin(a)));   // Taylor overshoots 1 by an ulp near ±90°
}
/** Unit direction for aim step a (0 = +x, 1024 = +y / screen down). */
export const aimDir = a => [AIM_SIN[((a & 4095) + 1024) & 4095], AIM_SIN[a & 4095]];

/**
 * @param o { w, h (px), restitution: cushion bounce (0..1024 = 0..1), ballRestitution (0..1024),
 *            friction: per-tick velocity loss (/1024), rolling: constant loss per tick (sub-px/tick),
 *            stopSpeed (sub-px/tick), pockets: [{ x, y, r }] px }
 */
export function createWorld(o) {
  return {
    w: o.w * ONE, h: o.h * ONE, e: o.restitution ?? 800, eb: o.ballRestitution ?? 950,
    friction: o.friction ?? 12, roll: o.rolling ?? 1, stop: o.stopSpeed ?? 6,
    pockets: (o.pockets ?? []).map(p => ({ x: p.x * ONE, y: p.y * ONE, r2: (p.r * ONE) ** 2 })),
    balls: [],
  };
}

export function addBall(world, id, x, y, r) {
  const b = { id, x: Math.round(x * ONE), y: Math.round(y * ONE), vx: 0, vy: 0, r: r * ONE, alive: true };
  world.balls.push(b);
  return b;
}

/** Shoot: speed in sub-px per tick along aim step `a`. */
export function strike(ball, a, speed) {
  const [dx, dy] = aimDir(a);
  ball.vx = Math.round(dx * speed);
  ball.vy = Math.round(dy * speed);
}

export const atRest = world => world.balls.every(b => !b.alive || (b.vx === 0 && b.vy === 0));

/** One sim tick. Pushes { type: 'ball' | 'cushion' | 'pocket', … } into `events` when given. */
export function stepWorld(world, events = null) {
  const balls = world.balls;
  let maxV = 0, minR = Infinity;
  for (const b of balls) if (b.alive) { maxV = Math.max(maxV, Math.abs(b.vx) + Math.abs(b.vy)); minR = Math.min(minR, b.r); }
  if (!maxV) return;
  const n = Math.min(32, Math.max(1, Math.ceil(maxV / (minR / 2))));    // never move more than r/2 per sub-step
  for (let k = 0; k < n; k++) {
    for (const b of balls) {
      if (!b.alive) continue;
      // distribute the tick's motion over n sub-steps exactly (no remainder drift)
      b.x += Math.trunc((b.vx * (k + 1)) / n) - Math.trunc((b.vx * k) / n);
      b.y += Math.trunc((b.vy * (k + 1)) / n) - Math.trunc((b.vy * k) / n);
      pocket(world, b, events);                                          // before cushions: no bounce in the pocket mouth
      if (b.alive) cushions(world, b, events);
    }
    for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) collide(world, balls[i], balls[j], n, events);
  }
  for (const b of balls) {
    if (!b.alive) continue;
    b.vx = slow(b.vx, world); b.vy = slow(b.vy, world);
    if (Math.abs(b.vx) + Math.abs(b.vy) < world.stop) b.vx = b.vy = 0;
  }
}

/** Proportional drag plus a constant rolling loss (rolling resistance), so slow balls really stop. */
function slow(v, world) {
  if (!v) return 0;
  const loss = Math.trunc((Math.abs(v) * world.friction) / 1024) + world.roll;
  return Math.abs(v) <= loss ? 0 : v - Math.sign(v) * loss;
}

function cushions(world, b, events) {
  const bounce = v => -Math.trunc((v * world.e) / 1024);
  let hit = false;
  if (b.x - b.r < 0) { b.x = 2 * b.r - b.x; b.vx = bounce(b.vx); hit = true; }
  else if (b.x + b.r > world.w) { b.x = 2 * (world.w - b.r) - b.x; b.vx = bounce(b.vx); hit = true; }
  if (b.y - b.r < 0) { b.y = 2 * b.r - b.y; b.vy = bounce(b.vy); hit = true; }
  else if (b.y + b.r > world.h) { b.y = 2 * (world.h - b.r) - b.y; b.vy = bounce(b.vy); hit = true; }
  if (hit) events?.push({ type: 'cushion', id: b.id });
}

function collide(world, a, b, n, events) {
  if (!a.alive || !b.alive) return;
  const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
  if (d2 >= rr * rr || d2 === 0) return;
  const d = Math.sqrt(d2);
  // Contact normal at the moment of touch, not after the overlap: rewind along the relative
  // sub-step motion u to |d - s·u| = rr (smallest s >= 0). Otherwise a ball that sank in by up to
  // r/2 bounces off at the wrong angle and aiming stops being exact.
  let cx = dx, cy = dy;
  const ux = (b.vx - a.vx) / n, uy = (b.vy - a.vy) / n, A = ux * ux + uy * uy;
  if (A > 0) {
    const B = dx * ux + dy * uy, s = (B + Math.sqrt(B * B - A * (d2 - rr * rr))) / A;
    if (s > 0 && s <= 1) { cx = dx - s * ux; cy = dy - s * uy; }
  }
  const cl = Math.sqrt(cx * cx + cy * cy) || d, nx = cx / cl, ny = cy / cl;
  const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (vn < 0) {                                                          // approaching: equal-mass impulse
    const J = (-(1 + world.eb / 1024) * vn) / 2;
    a.vx = Math.round(a.vx - J * nx); a.vy = Math.round(a.vy - J * ny);
    b.vx = Math.round(b.vx + J * nx); b.vy = Math.round(b.vy + J * ny);
    events?.push({ type: 'ball', a: a.id, b: b.id, speed: Math.round(-vn) });
  }
  const push = (rr - d) / 2;                                             // separate the overlap
  a.x -= Math.round(nx * push); a.y -= Math.round(ny * push);
  b.x += Math.round(nx * push); b.y += Math.round(ny * push);
}

function pocket(world, b, events) {
  if (!b.alive) return;
  for (let p = 0; p < world.pockets.length; p++) {
    const q = world.pockets[p], dx = b.x - q.x, dy = b.y - q.y;
    if (dx * dx + dy * dy < q.r2) { b.alive = false; b.vx = b.vy = 0; events?.push({ type: 'pocket', id: b.id, pocket: p }); return; }
  }
}

/** Integers that define the physical state, for stateHash(). */
export function worldState(world) {
  const out = [];
  for (const b of world.balls) out.push(b.id, b.x, b.y, b.vx, b.vy, b.alive ? 1 : 0);
  return out;
}
