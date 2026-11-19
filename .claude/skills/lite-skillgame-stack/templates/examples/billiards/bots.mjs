// Billiards bots (tool side, so atan2 is fine here): ghost-ball aiming at the easiest
// ball/pocket pair, plus a per-shot aim and power error that shrinks with skill.
import { hash32 } from '../../src/sim/core/index.js';
import { AIM_STEPS } from '../../src/sim/core/physics.js';
import { TABLE, POWERS, FRICTION, encodeShot, powerSpeed } from './sim.js';

// Aim at each pocket's mouth (a point the ball centre can actually reach), not its centre.
const m = TABLE.ball + 2;
const pockets = [[m, m], [TABLE.w / 2, m - 4], [TABLE.w - m, m], [m, TABLE.h - m], [TABLE.w / 2, TABLE.h - m + 4], [TABLE.w - m, TABLE.h - m]];
/** Distance from point p to segment a-b. */
const segDist = (px, py, ax, ay, bx, by) => {
  const vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(px - ax - t * vx, py - ay - t * vy);
};
const toAim = (dx, dy) => (Math.round((Math.atan2(dy, dx) / (2 * Math.PI)) * AIM_STEPS) + AIM_STEPS) % AIM_STEPS;
const bell = (seed, salt, i) => { let s = 0; for (let k = 0; k < 4; k++) s += (hash32(seed, salt + k, i) / 4294967296) * 2 - 1; return s / 2; };

function planShot(sim) {
  const c = sim.cue, R = TABLE.ball * 2;
  let best = null;
  for (const b of sim.world.balls) {
    if (!b.id || !b.alive) continue;
    const bx = b.x / 256, by = b.y / 256, cx = c.x / 256, cy = c.y / 256;
    for (const [px, py] of pockets) {
      const ex = px - bx, ey = py - by, el = Math.hypot(ex, ey);
      const gx = bx - (ex / el) * R, gy = by - (ey / el) * R;         // ghost ball position
      const ax = gx - cx, ay = gy - cy, al = Math.hypot(ax, ay);
      const cut = Math.acos(Math.max(-1, Math.min(1, (ax * ex + ay * ey) / (al * el))));
      if (cut > 1.2) continue;                                         // too thin to make
      const blocked = sim.world.balls.some(o => o.alive && o !== b && o !== c &&
        (segDist(o.x / 256, o.y / 256, cx, cy, gx, gy) < R || segDist(o.x / 256, o.y / 256, bx, by, px, py) < R));
      if (blocked) continue;
      const cost = al + el * 1.5 + cut * 300;
      if (!best || cost < best.cost) best = { cost, aim: toAim(ax, ay), al, el, cut };
    }
  }
  return best;
}

function aimBot(salt, aimSdDeg, powerSd, pickWorst) {
  return {
    input: () => 0,
    pick(sim) {
      const plan = planShot(sim);
      const i = sim.shots;
      if (!plan || pickWorst) {                                        // blast at the rack
        const aim = (hash32(sim.seed, salt, i) % AIM_STEPS);
        return encodeShot(aim, 20 + (hash32(sim.seed, salt + 1, i) % 12));
      }
      const aim = plan.aim + Math.round((bell(sim.seed, salt, i) * aimSdDeg * AIM_STEPS) / 360 / 0.58);
      // Speed that carries the cue to contact and the object ball past the pocket, given drag k
      // (distance ≈ v / k) and the energy lost to the cut angle.
      const k = FRICTION / 1024, need = (plan.al + plan.el / Math.max(0.35, Math.cos(plan.cut))) * 1.35 * k * 256;
      const ideal = Math.min(POWERS, Math.max(4, Math.ceil(need / powerSpeed(1))));
      const power = Math.min(POWERS, Math.max(1, ideal + Math.round(bell(sim.seed, salt + 5, i) * powerSd / 0.58)));
      return encodeShot((aim + AIM_STEPS) % AIM_STEPS, power);
    },
  };
}

export const BOTS = {
  novice: aimBot(10, 6, 6, false),
  intermediate: aimBot(20, 1.6, 3, false),
  expert: aimBot(30, 0.35, 1, false),
};
