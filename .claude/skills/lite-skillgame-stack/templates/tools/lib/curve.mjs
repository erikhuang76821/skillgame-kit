// Difficulty-curve checks for any game (knowledge-base/16 D2–D6): the game cuts its match into units (bars,
// waves, rooms, 2-second slices…), gives each a difficulty index (DI) and the human-factor bots' hit rate, and
// this file fits the curve and checks it. Game-agnostic: genre-specific checks (beat grid, phrase length) stay
// in the game's tools/playtest.mjs. Reference implementation with charts: TwinStrike/game/tools/playtest.mjs.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Thresholds come from knowledge-base/index/rules.json through shared/tools/rules.mjs — never hard-coded here
// (knowledge-base/decisions/2026-10-21-kb-asset-architecture.md). The calling game's config/rules.overrides.json applies.
const RULES = await (async () => {
  let d = fileURLToPath(new URL('.', import.meta.url));
  while (!existsSync(join(d, 'shared', 'tools', 'rules.mjs'))) {
    const up = dirname(d);
    if (up === d) throw new Error('shared/tools/rules.mjs not found above ' + fileURLToPath(import.meta.url));
    d = up;
  }
  const { loadRules } = await import(pathToFileURL(join(d, 'shared', 'tools', 'rules.mjs')).href);
  return loadRules({ from: fileURLToPath(import.meta.url) });
})();
export const CURVE = Object.freeze({
  rho: RULES.value('RULE-CURVE-TREND', 'rho'), r2: RULES.value('RULE-CURVE-LINEARITY', 'r2'),
  peakTol: RULES.value('RULE-CURVE-PEAKS', 'tolerance'), cliff: RULES.value('RULE-CURVE-CLIFF', 'maxDropPp'),
  flowMin: RULES.value('RULE-CURVE-FLOW', 'min'), flowMax: RULES.value('RULE-CURVE-FLOW', 'max'),
});

export const mean = a => { const v = a.filter(Number.isFinite); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN; };
export const pct = v => (Number.isFinite(v) ? `${Math.round(v * 100)}%` : '—');

/**
 * @param units     [{ name, section, t (seconds, unit start), di, hit: { casual, regular, skilled } }] in time order;
 *                  hit = mean hit rate of the runs that reached the unit (NaN when none did)
 * @param sections  [{ name, main }]  main = a rising section (not warm-up, breather, fever or outro)
 * @returns { checks: [{ name, ok, detail }], fit: { slope, icpt, r2, rho }, sec: [{ name, main, di, peak, hit }] }
 */
export function curveChecks(units, sections) {
  const sec = sections.map((s, k) => {
    const us = units.filter(u => u.section === k);
    const hit = Object.fromEntries(['casual', 'regular', 'skilled'].map(p => [p, mean(us.map(u => u.hit[p]))]));
    return { name: s.name, main: s.main, di: mean(us.map(u => u.di)), peak: Math.max(...us.map(u => u.di)), hit };
  });
  const main = units.filter(u => sections[u.section].main), mainSec = sec.filter(s => s.main);
  const xs = main.map(u => u.t), ys = main.map(u => u.di), mx = mean(xs), my = mean(ys);
  const slope = xs.reduce((s, x, j) => s + (x - mx) * (ys[j] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const icpt = my - slope * mx;
  const ssRes = ys.reduce((s, y, j) => s + (y - (icpt + slope * xs[j])) ** 2, 0), ssTot = ys.reduce((s, y) => s + (y - my) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const rank = a => { const o = a.map((v, j) => [v, j]).sort((p, q) => p[0] - q[0]); const r = []; o.forEach(([, j], k) => { r[j] = k; }); return r; };
  const rx = rank(xs), ry = rank(ys), n = xs.length;
  const rho = 1 - (6 * rx.reduce((s, v, j) => s + (v - ry[j]) ** 2, 0)) / (n * (n * n - 1));

  const checks = [];
  const check = (name, ok, detail) => checks.push({ name, ok, detail });
  check(`難度整體上升（主段落逐單位 Spearman ρ ≥ ${CURVE.rho}）`, rho >= CURVE.rho, `ρ = ${rho.toFixed(2)}`);
  check(`難度接近線性（主段落 R² ≥ ${CURVE.r2}）`, r2 >= CURVE.r2, `R² = ${r2.toFixed(2)}，斜率 ${slope.toFixed(3)} DI/秒`);
  check('鋸齒向上（每個主段落的高峰 ≥ 前一段）', mainSec.every((s, j) => j === 0 || s.peak >= mainSec[j - 1].peak - CURVE.peakTol),
    mainSec.map(s => `${s.name} ${s.peak.toFixed(2)}`).join(' → '));
  const cliffs = mainSec.slice(1).filter((s, j) => (mainSec[j].hit.regular - s.hit.regular) * 100 > CURVE.cliff).map(s => s.name);
  check(`無斷崖（一般玩家相鄰主段落命中率下降 ≤ ${CURVE.cliff} pp）`, !cliffs.length, cliffs.join('、') || '—');
  check(`一般玩家在心流帶（主段落命中率 ${pct(CURVE.flowMin)}–${pct(CURVE.flowMax)}）`,
    mainSec.every(s => s.hit.regular >= CURVE.flowMin && s.hit.regular <= CURVE.flowMax), mainSec.map(s => `${s.name} ${pct(s.hit.regular)}`).join(' / '));
  return { checks, fit: { slope, icpt, r2, rho }, sec };
}

/** Markdown table for a list of checks (the same shape TwinStrike's report uses). */
export const checksTable = checks => [
  '| 檢查 | 結果 | 數據 |', '|---|---|---|',
  ...checks.map(c => `| ${c.name} | ${c.ok === null ? '— 不適用' : c.ok ? '✅' : '❌'} | ${c.detail} |`),
].join('\n');
