// Fixture for game-audit.test.mjs: a sim that breaks the rules on purpose. Math.random in a comment is fine.
export const RUN_SPEED = 5;
export const TABLE = [0, 10, 12, 14];
export const RULES = Object.freeze({ hpMax: 6 });
export const GAME = Object.freeze({ id: 'audit-bad', version: 3, maxTicks: 600 });
export function step(sim) {
  sim.t = Date.now();             // wall clock in the sim
  return Math.random() < 0.5;     // unseeded randomness
}
