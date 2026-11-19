// Recipe example: solo "clear the table" billiards on core/physics.js (headless GameDef; knowledge-base/12 §2).
// Same seed = same rack for every player. 24 shots; each shot is a choice event
// index = aim * 32 + (power - 1), aim 0..4095, power 1..32. Balls roll on sim ticks (input byte unused).
import { createHasher, hash32 } from '../../src/sim/core/index.js';
import { AIM_STEPS, createWorld, addBall, strike, stepWorld, atRest, worldState } from '../../src/sim/core/physics.js';

export const TABLE = { w: 640, h: 320, ball: 9, pocket: 18 };
export const SHOTS = 24, OBJECT_BALLS = 14, POWERS = 32, MAX_SHOT_TICKS = 600;
export const MATCH_TICKS = SHOTS * MAX_SHOT_TICKS;
export const FRICTION = 10;                               // /1024 per tick
export const powerSpeed = p => p * 90;                    // sub-px per tick (power 32 ≈ 11 px/tick)
export const encodeShot = (aim, power) => (aim & (AIM_STEPS - 1)) * POWERS + (power - 1);

const MOUTH = TABLE.ball + 2;
const mouths = [[MOUTH, MOUTH], [TABLE.w / 2, MOUTH - 4], [TABLE.w - MOUTH, MOUTH],
  [MOUTH, TABLE.h - MOUTH], [TABLE.w / 2, TABLE.h - MOUTH + 4], [TABLE.w - MOUTH, TABLE.h - MOUTH]];

/** Is point o within distance r of segment a-b? Compared squared, scaled by |ab|^2: no division, no sqrt. */
function nearSegment(o, a, b, r) {
  const vx = b[0] - a[0], vy = b[1] - a[1], wx = o.x - a[0], wy = o.y - a[1], L = vx * vx + vy * vy;
  const t = wx * vx + wy * vy;                          // projection × L
  if (t <= 0) return wx * wx + wy * wy < r * r;
  if (t >= L) return (o.x - b[0]) ** 2 + (o.y - b[1]) ** 2 < r * r;
  const cross = wx * vy - wy * vx;                      // distance × sqrt(L)
  return cross * cross < r * r * L;
}
const hasOpenLine = (ball, all) => mouths.some(m => all.every(o => o === ball || !nearSegment(o, [ball.x, ball.y], m, TABLE.ball * 2)));

const pockets = (() => {
  const { w, h, pocket: r } = TABLE;
  return [[0, 0], [w / 2, -4], [w, 0], [0, h], [w / 2, h + 4], [w, h]].map(([x, y]) => ({ x, y, r }));
})();

export function createSim(seed) {
  const world = createWorld({ w: TABLE.w, h: TABLE.h, pockets, restitution: 780, ballRestitution: 950, friction: FRICTION });
  const cue = addBall(world, 0, TABLE.w * 0.25, TABLE.h / 2, TABLE.ball);
  // Seeded rack in the right half; rejection sampling by attempt index keeps it deterministic.
  // Fairness of the *problem*: a candidate is accepted only if it has an open line to some pocket
  // mouth and does not close the last open line of a ball already placed — so no seed deals a rack
  // where luck (a hidden ball) decides more than aim does. (Integer / sqrt-free geometry.)
  const placed = [];
  for (let k = 0; placed.length < OBJECT_BALLS && k < 6000; k++) {
    const x = Math.trunc(TABLE.w * 0.55) + (hash32(seed, 41, k) % Math.trunc(TABLE.w * 0.38));
    const y = 40 + (hash32(seed, 42, k) % (TABLE.h - 80));
    if (!placed.every(b => (b.x - x) ** 2 + (b.y - y) ** 2 > (TABLE.ball * 3) ** 2)) continue;
    const next = [...placed, { x, y }];
    if (next.every(b => hasOpenLine(b, next))) placed.push({ x, y });
  }
  placed.forEach((b, i) => addBall(world, i + 1, b.x, b.y, TABLE.ball));
  return {
    seed: seed >>> 0, tick: 0, world, cue, shots: 0, rolling: false, shotTicks: 0,
    potted: 0, fouls: 0, score: 0, shotPotted: 0, events: [], recordEvents: true,
  };
}

const objectsLeft = sim => sim.world.balls.filter(b => b.id && b.alive).length;

export function phase(sim) {
  if (sim.rolling) return 'play';
  return sim.shots >= SHOTS || objectsLeft(sim) === 0 ? 'over' : 'choice';
}

export function choose(sim, index) {
  if (sim.rolling || index < 0 || index >= AIM_STEPS * POWERS) return false;
  strike(sim.cue, Math.floor(index / POWERS), powerSpeed((index % POWERS) + 1));
  sim.rolling = true; sim.shots++; sim.shotTicks = 0; sim.shotPotted = 0;
  return true;
}

export function step(sim) {
  sim.events.length = 0;
  const ev = [];
  stepWorld(sim.world, ev);
  for (const e of ev) {
    if (e.type !== 'pocket') continue;
    if (e.id === 0) { sim.fouls++; sim.score = Math.max(0, sim.score - 100); }
    // Flat 100 per ball. A streak multiplier was tried and dropped: it amplified rack luck
    // (skill share 62% -> 71% without it). v2: open-line racks + 24 shots / 14 balls -> 75–81% on
    // four seed sets (tools/skill-dominance, knowledge-base/12 §2).
    else { sim.potted++; sim.shotPotted++; sim.score += 100; }
  }
  if (sim.recordEvents) sim.events.push(...ev);
  sim.tick++; sim.shotTicks++;
  if (atRest(sim.world) || sim.shotTicks >= MAX_SHOT_TICKS) {
    sim.rolling = false;
    for (const b of sim.world.balls) b.vx = b.vy = 0;
    if (!sim.cue.alive) {                                  // foul: respot the cue ball
      sim.cue.alive = true; sim.cue.x = Math.round(TABLE.w * 0.25 * 256); sim.cue.y = Math.round((TABLE.h / 2) * 256);
    }
    if (objectsLeft(sim) === 0) sim.score += 150 * (SHOTS - sim.shots);   // clearance bonus: unused shots
  }
}

export const score = sim => sim.score;
export const scoreBreakdown = sim => ({ potted: sim.potted, fouls: sim.fouls, shots: sim.shots });
export const stateHash = sim => createHasher(sim.tick).mixAll([sim.score, sim.shots, sim.potted, sim.fouls, ...worldState(sim.world)]).value();

export const GAME = Object.freeze({ id: 'example-billiards', version: 2, maxTicks: MATCH_TICKS, maxChoices: SHOTS, createSim, step, phase, choose, score, stateHash, scoreBreakdown });
