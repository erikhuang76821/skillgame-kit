// Comparison strategies for the turn-based example (tools/lib/evidence.mjs). Each one is frozen before the
// confirmation run and says what it sees and what it is limited to; none sees more than the player does.
import { hash32 } from '../../src/sim/core/index.js';
import { LEFT, RIGHT, houseTakesLeft } from './sim.js';

/** Best total the player can still collect from row[lo..hi], and the move that gets it (exact, memoised). */
function best(row, lo, hi, memo = new Map()) {
  if (lo > hi) return { value: 0, move: LEFT };
  const key = lo * 64 + hi;
  if (memo.has(key)) return memo.get(key);
  const after = (l, h) => (l > h ? 0 : houseTakesLeft(row, l, h) ? best(row, l + 1, h, memo).value : best(row, l, h - 1, memo).value);
  const left = row[lo] + after(lo + 1, hi), right = row[hi] + after(lo, hi - 1);
  const r = left >= right ? { value: left, move: LEFT } : { value: right, move: RIGHT };
  memo.set(key, r);
  return r;
}

export const STRATEGIES = {
  optimal: {
    role: 'strong',
    sees: '整排牌面與莊家的固定規則（玩家也看得到）',
    limits: '完整往後推算到結束；可證明最佳',
    policy: { pick: sim => best(sim.row, sim.lo, sim.hi).move },
  },
  'uniform random end': {
    role: 'random',
    sees: '不看牌面',
    limits: '左右兩端各半機率；兩端都是合法且會推進牌局的步',
    policy: { pick: sim => hash32(sim.seed, 701, sim.moves) & 1 },
  },
  'take the larger end': {
    role: 'simple',
    sees: '只看兩端的牌',
    limits: '不往後推算；一句話規則',
    policy: { pick: sim => (sim.row[sim.lo] >= sim.row[sim.hi] ? LEFT : RIGHT) },
  },
};
