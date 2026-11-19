// Candidate skill metrics on the same (seed x tier) score table. rows: [{tierName: score}], tiers ordered weak -> strong.
import { pathToFileURL } from 'node:url';
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
export function metrics(rows, tiers) {
  const n = rows.length, k = tiers.length;
  const all = rows.flatMap(r => tiers.map(t => r[t])), g = mean(all);
  const ssT = all.reduce((x, v) => x + (v - g) ** 2, 0) || 1;
  const ssTier = tiers.reduce((x, t) => x + n * (mean(rows.map(r => r[t])) - g) ** 2, 0);
  const ssSeed = rows.reduce((x, r) => x + k * (mean(tiers.map(t => r[t])) - g) ** 2, 0);
  const win = (a, b) => mean(rows.map(r => (r[a] > r[b] ? 1 : r[a] === r[b] ? 0.5 : 0)));
  // One-sided 95% Wilson lower bound (the normal approximation gives a zero-width interval at 100%). Ties count as half a win here,
  // which is only descriptive: the decision (2026-11-11-skill-evidence) asks for strict wins or a paired resample.
  const lower = p => { const z = 1.645, d = 1 + (z * z) / n; return (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d; };
  // Kendall's W on within-seed ranks: 1 = every seed orders the tiers the same way (ties share ranks).
  const R = Object.fromEntries(tiers.map(t => [t, 0]));
  let monotone = 0;
  for (const r of rows) {
    for (const t of tiers) R[t] += 1 + tiers.filter(u => r[u] < r[t]).length + (tiers.filter(u => r[u] === r[t]).length - 1) / 2;
    if (tiers.every((t, i) => i === 0 || r[t] > r[tiers[i - 1]])) monotone++;
  }
  const rb = (k + 1) / 2 * n, S = tiers.reduce((x, t) => x + (R[t] - rb) ** 2, 0), W = (12 * S) / (n * n * (k ** 3 - k));
  const top = win(tiers.at(-1), tiers.at(-2)), mid = win(tiers.at(-2), tiers[0]);
  return { n, skillShare: ssTier / ssT, seedShare: ssSeed / ssT, withinSeedShare: ssTier / (ssT - ssSeed), top, topLo: lower(top), mid, kendallW: W, monotone: monotone / n };
}
export const fmt = m => `n=${m.n}｜技巧佔比 ${(m.skillShare * 100).toFixed(1)}%｜扣掉種子後 ${(m.withinSeedShare * 100).toFixed(1)}%｜最強vs次強 ${(m.top * 100).toFixed(1)}%（單側 95% Wilson 下界 ${(m.topLo * 100).toFixed(1)}%）｜次強vs最弱 ${(m.mid * 100).toFixed(1)}%｜排序一致度 W ${m.kendallW.toFixed(2)}｜三級全順 ${(m.monotone * 100).toFixed(0)}%`;

// usage: node metrics.mjs klondike            (the Klondike sim next to this file)
//        node metrics.mjs <Game>             (a repo game: <Game>/game with src/sim/sim.js and tools/bots.mjs)
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, '..', '..', '..');
const what = process.argv[2];
if (what === 'klondike') {
  const m = await import(pathToFileURL(resolve(here, 'klondike.mjs')).href);
  const V = {
    '接龍：決策＋速度': { novice: [m.novice, 2.5], intermediate: [m.intermediate, 1.5], expert: [m.expert, 0.9] },
    '接龍：只比速度（決策相同）': { novice: [m.expert, 2.5], intermediate: [m.expert, 1.5], expert: [m.expert, 0.9] },
    '接龍：只比決策（同速、無時間獎勵）': { novice: [m.novice, 1.2], intermediate: [m.intermediate, 1.2], expert: [m.expert, 1.2] },
  };
  for (const [name, T] of Object.entries(V)) for (const n of [30, 300]) {
    const rows = Array.from({ length: n }, (_, i) => { const seed = hashSeed(i); return Object.fromEntries(Object.entries(T).map(([t, [p, s]]) => [t, m.play(seed, p, s, { timeBonus: !name.includes('無時間') }).score])); });
    console.log(name, fmt(metrics(rows, Object.keys(T))));
  }
} else {
  const base = pathToFileURL(resolve(repo, what, 'game') + '/').href;
  const { playMatch, hash32 } = await import(base + 'src/sim/core/index.js');
  const { GAME } = await import(base + 'src/sim/sim.js');
  const { BOTS } = await import(base + 'tools/bots.mjs');
  for (const n of [30, 150]) {
    const rows = Array.from({ length: n }, (_, i) => { const seed = hash32(2026, 7, i); return Object.fromEntries(Object.keys(BOTS).map(t => [t, GAME.score(playMatch(GAME, seed, BOTS[t]).sim)])); });
    console.log(what, fmt(metrics(rows, Object.keys(BOTS))));
  }
}
function hashSeed(i) { let h = (2026 ^ 0x9e3779b9) >>> 0; for (const v of [7, i]) { h = Math.imul(h ^ (v >>> 0), 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; } return h >>> 0; }
