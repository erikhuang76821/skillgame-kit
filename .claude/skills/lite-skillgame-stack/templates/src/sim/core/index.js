// Game-agnostic skill-game core. Copy as-is into every game; game rules live in ../sim.js.
export { hash32, makeRng, seedFromString } from './rng.js';
export { ONE, ANGLES, SIN, COS, DX, DY, angleOf, fmul, fdiv, toFixed, fromFixed, dist2, clamp } from './fixed.js';
export { createHasher } from './hash.js';
export { NOISE_MAX, valueNoise, fbm, makeTerrain, cellAt, smoothCellAt, cornerMask, terrainHash } from './grid.js';
export { Recorder, replay, verify, encodeLog, decodeLog, playMatch } from './match.js';
// Recipes (knowledge-base/12). Import directly from the file when a game needs them:
//   timing.js  — seeded charts, sub-tick judgement, capped combo score (rhythm / timing games)
//   physics.js — deterministic circle physics with pockets and cushions (billiards, pucks, shooters)
//   input.js   — timestamped taps -> (tick, phase), latency calibration, macro detection (client side)

export const TPS = 60;              // sim ticks per second
export const TICK_MS = 1000 / TPS;
