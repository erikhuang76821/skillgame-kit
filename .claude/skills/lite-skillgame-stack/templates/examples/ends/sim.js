// Example turn-based game: no ticks at all, every move is one choice (knowledge-base: technical reference only).
// A row of face-up number cards comes from the seed. Each turn the player takes the card at the left or the right
// end, then the house takes the larger remaining end (left on a tie). Score = sum of the player's cards.
// Everything is visible and the house is a fixed rule, so the best line can be computed exactly: the strong
// strategy in strategies.mjs is provably optimal, which gives the skill-evidence tool a known ceiling to test against.
import { createHasher, makeRng } from '../../src/sim/core/index.js';

export const CARDS = 16, MOVES = CARDS / 2, MAX_VALUE = 9;
export const LEFT = 0, RIGHT = 1;
const rng = makeRng({ card: 1 });

export function createSim(seed) {
  seed >>>= 0;
  const row = Array.from({ length: CARDS }, (_, i) => rng.range(seed, 'card', i, 1, MAX_VALUE));
  return { seed, row, lo: 0, hi: CARDS - 1, moves: 0, score: 0, house: 0 };
}

export const phase = sim => (sim.lo > sim.hi ? 'over' : 'choice');

/** The house's fixed rule, exported so strategies can look ahead exactly like a player who knows the rules. */
export const houseTakesLeft = (row, lo, hi) => row[lo] >= row[hi];

export function choose(sim, index) {
  if (phase(sim) !== 'choice' || (index !== LEFT && index !== RIGHT)) return false;   // refuse without touching the sim
  sim.score += index === LEFT ? sim.row[sim.lo++] : sim.row[sim.hi--];
  if (sim.lo <= sim.hi) sim.house += houseTakesLeft(sim.row, sim.lo, sim.hi) ? sim.row[sim.lo++] : sim.row[sim.hi--];
  sim.moves++;
  return true;
}

export function step() {}   // never called: maxTicks is 0
export const score = sim => sim.score;
export const stateHash = sim => createHasher(sim.moves).mixAll([sim.score, sim.house, sim.lo, sim.hi]).value();
export const scoreBreakdown = sim => ({ house: sim.house });

export const GAME = Object.freeze({ id: 'example-ends', version: 1, maxTicks: 0, maxChoices: MOVES, createSim, step, phase, choose, score, stateHash, scoreBreakdown });
