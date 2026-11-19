// Usage: node tools/skill-dominance.mjs [seeds=30] [--out ../docs/skill_dominance_report.md] [--baseline]
// Exits 1 when the game fails the skill-dominance thresholds (RULE-SKILL-DOMINANCE), so it can gate CI.
// --baseline: exit code follows RULE-SKILL-BASELINE instead (1 when it fails or bots.mjs has no BASELINES).
import { writeFileSync } from 'node:fs';
import { GAME } from '../src/sim/sim.js';
import * as bots from './bots.mjs';
import { runDominance, toMarkdown } from './lib/dominance.mjs';

const args = process.argv.slice(2);
const n = Number(args.find(a => /^\d+$/.test(a))) || 30;
const outIdx = args.indexOf('--out');

const report = runDominance(GAME, bots.BOTS, n, 2026, bots.BASELINES ?? null);
const md = toMarkdown(report, `node tools/skill-dominance.mjs ${n}`);
if (outIdx >= 0) writeFileSync(args[outIdx + 1], md, 'utf8');
console.log(md);
if (args.includes('--baseline')) {
  const b = report.baseline, pct = v => `${(v * 100).toFixed(1)}%`;
  console.log(b ? `RULE-SKILL-BASELINE：最好的基準策略「${b.best}」= ${report.tiers.at(-1)} 的 ${pct(b.ratio)} → ${b.pass ? '通過' : '超過門檻'}` : 'RULE-SKILL-BASELINE：bots.mjs 沒有匯出 BASELINES → 未驗證');
}
process.exitCode = (args.includes('--baseline') ? report.baseline?.pass : report.pass) ? 0 : 1;
