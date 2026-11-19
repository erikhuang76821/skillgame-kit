// Whole-game automated playtest (knowledge-base/16 D1–D8): the difficulty curve with the human-factor bots, unit by
// unit. Skill evidence is a separate report (tools/skill-evidence.mjs). Rewrite the "units" part for your game: what one
// unit is (bar, wave, room, 2-second slice), its difficulty index DI, and which targets the player hit in it.
// Usage: node tools/playtest.mjs [seeds=30] [--out ../docs/playtest_report.md]   (exit 1 if a check fails)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { hash32, TPS } from '../src/sim/core/index.js';
import { GAME, createSim, step, phase, SCRIPT, sectionAt } from '../src/sim/sim.js';
import { HUMANS } from './humanBots.mjs';
import { curveChecks, checksTable, mean, pct } from './lib/curve.mjs';

const args = process.argv.slice(2);
const N = Number(args.find(a => /^\d+$/.test(a))) || 30;
const outIdx = args.indexOf('--out');
const seeds = Array.from({ length: N }, (_, i) => hash32(2026, 9, i));

// ---------- units: 2-second slices of the 30-second match (a beat belongs to the slice its window opens in) ----------
const UNIT = 2 * TPS;
const units = Array.from({ length: GAME.maxTicks / UNIT }, (_, k) => ({ name: `${k * 2}–${k * 2 + 2} s`, from: k * UNIT, t: k * 2, section: sectionAt(k * UNIT) }));
const unitOf = tick => Math.min(units.length - 1, Math.floor(tick / UNIT));

/** Play one run; returns every beat as { tick, window, hit }. */
function run(seed, bot) {
  const sim = createSim(seed), beats = [];
  while (phase(sim) === 'play') {
    const beat = sim.beat, at = sim.nextBeat, w = SCRIPT[sectionAt(at)].window;
    step(sim, bot ? bot.input(sim) : 0);
    if (sim.beat !== beat) beats.push({ tick: at, window: w, hit: sim.hitBeat === beat });
  }
  return beats;
}

// DI = beats per second × (8 / window): denser beats and a tighter window both make a slice harder.
const di = units.map(() => []);
for (const seed of seeds) {
  const beats = run(seed, null);
  units.forEach((u, k) => {
    const bs = beats.filter(b => unitOf(b.tick) === k);
    di[k].push(bs.length ? (bs.length / (UNIT / TPS)) * mean(bs.map(b => 8 / b.window)) : 0);
  });
}
units.forEach((u, k) => { u.di = mean(di[k]); u.hit = {}; });
for (const [name, bot] of Object.entries(HUMANS)) {
  const hit = units.map(() => []);
  for (const seed of seeds) {
    const beats = run(seed, bot);
    units.forEach((u, k) => { const bs = beats.filter(b => unitOf(b.tick) === k); if (bs.length) hit[k].push(bs.filter(b => b.hit).length / bs.length); });
  }
  units.forEach((u, k) => { u.hit[name] = mean(hit[k]); });
}

// ---------- checks ----------
const sections = SCRIPT.map(s => ({ name: s.name, main: !s.safe }));
const curve = curveChecks(units, sections);
const checks = [
  ...curve.checks,
  // Rhythm games add RULE-CURVE-BEATGRID / RULE-CURVE-PHRASE here (TwinStrike/game/tools/playtest.mjs). Beat Tap has no bars.
  { name: '拍格與樂句長度（RULE-CURVE-BEATGRID / PHRASE，節奏類才檢查）', ok: null, detail: '示範遊戲沒有小節' },
];

const md = [
  `# Playtest Report — ${GAME.id}（自動產生）`,
  '',
  `- 產生：\`node tools/playtest.mjs ${N}\`；${N} 個種子；sim v${GAME.version}；單位 = 2 秒`,
  '- DI = 每秒拍數 × (8 / 判定窗 tick)；人性化試玩：tools/humanBots.mjs（新手 / 一般 / 熟手）',
  '',
  '## 檢查',
  '',
  checksTable(checks),
  '',
  '## 段落',
  '',
  '| 段落 | 主段落 | DI 平均 / 高峰 | 命中率 新手 · 一般 · 熟手 |',
  '|---|---|---|---|',
  ...curve.sec.map(s => `| ${s.name} | ${s.main ? '✓' : ''} | ${s.di.toFixed(2)} / ${s.peak.toFixed(2)} | ${pct(s.hit.casual)} · ${pct(s.hit.regular)} · ${pct(s.hit.skilled)} |`),
  '',
  '## 單位',
  '',
  '| 時間 | 段落 | DI | 命中率 新手 · 一般 · 熟手 |',
  '|---|---|---|---|',
  ...units.map(u => `| ${u.name} | ${SCRIPT[u.section].name} | ${u.di.toFixed(2)} | ${pct(u.hit.casual)} · ${pct(u.hit.regular)} · ${pct(u.hit.skilled)} |`),
  '',
  `曲線擬合（主段落）：DI ≈ ${curve.fit.icpt.toFixed(2)} + ${curve.fit.slope.toFixed(3)} × 秒，R² ${curve.fit.r2.toFixed(2)}，Spearman ρ ${curve.fit.rho.toFixed(2)}。`,
  '',
].join('\n');

if (outIdx >= 0) { mkdirSync(dirname(args[outIdx + 1]), { recursive: true }); writeFileSync(args[outIdx + 1], md, 'utf8'); }
console.log(md);
process.exitCode = checks.every(c => c.ok !== false) ? 0 : 1;
