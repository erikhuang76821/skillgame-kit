// Human playtest analysis (docs/human_playtest_plan.md): reads the JSON files testers export from the game
// (?playtest=1&tester=<name>), re-verifies and REPLAYS every match with the same sim the server would use, and
// compares real players with the human-factor bots (tools/humanBots.mjs) section by section.
// Exit 2 when there is nothing to analyse (no input, or a folder without records): the loop gate reads that as
// "could not run", not as a failed check.
// Usage: node tools/human-report.mjs <file-or-folder>... [--out ../docs/human_playtest_report.md]
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { verify, replay, decodeLog } from '../src/sim/core/index.js';
import { GAME, SEGMENTS, GRADE, createSim, step, phase } from '../src/sim/sim.js';
import { HUMANS } from './humanBots.mjs';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const inputs = args.filter((a, i) => !a.startsWith('--') && !(outIdx >= 0 && i === outIdx + 1));
const missing = inputs.filter(p => !existsSync(p));
if (!inputs.length || missing.length) {
  console.error(missing.length ? `找不到：${missing.join('、')}` : '請指定試玩紀錄的檔案或資料夾');
  console.error('把試玩者匯出的 twinstrike-playtest-*.json 放進 TwinStrike/playtest-data/ 後再執行（流程見 docs/human_playtest_plan.md）。');
  process.exit(2);   // no data to analyse: could not run (loop test-card convention), not a failed check
}
const files = inputs.flatMap(p => (statSync(p).isDirectory() ? readdirSync(p).filter(f => f.endsWith('.json')).map(f => join(p, f)) : [p]));
if (!files.length) {
  console.error(`${inputs.join('、')} 裡還沒有試玩紀錄（twinstrike-playtest-*.json）。收到試玩者的檔案後放進來再執行。`);
  process.exit(2);   // no data to analyse: could not run (loop test-card convention), not a failed check
}
const mean = a => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const pct = v => (Number.isFinite(v) ? `${Math.round(v * 100)}%` : '—');
const MAIN = SEGMENTS.map((s, k) => k).filter(k => SEGMENTS[k].levels.length > 1);

/** Per-section hit rate (only sections reached), death time, perfect rate, whiffs for a finished sim. */
function profile(sim) {
  const sec = SEGMENTS.map((s, k) => {
    if (sim.deathTick >= 0 && sim.deathTick < s.from) return NaN;
    const g = sim.chart.map((n, i) => (n.seg === k ? sim.judge.grade[i] : null)).filter(x => x !== null);
    return g.length ? g.filter(x => x > GRADE.MISS).length / g.length : NaN;
  });
  const [miss, good, great, perfect] = sim.judge.counts;
  const judged = miss + good + great + perfect;
  return { sec, death: sim.deathTick < 0 ? null : sim.deathTick / 60, perfect: perfect / (judged || 1), whiffs: sim.judge.whiffs, score: sim.judge.score, finished: sim.hp > 0 };
}

// ---------- load + verify + replay ----------
const records = [], rejected = [];
for (const f of files) {
  let list;
  try { list = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { rejected.push(`${f}: 不是有效的 JSON`); continue; }
  for (const r of Array.isArray(list) ? list : [list]) {
    const u = r.upload;
    if (!u || u.game !== GAME.id) { rejected.push(`${f}: 不是 ${GAME.id} 的紀錄`); continue; }
    if (u.version !== GAME.version) { rejected.push(`${r.tester} 第 ${r.run} 局：sim v${u.version}，目前是 v${GAME.version}（請用同版本分析）`); continue; }
    const v = verify(GAME, u);
    if (!v.valid) { rejected.push(`${r.tester} 第 ${r.run} 局：重播驗證失敗（${v.reason}）`); continue; }
    const sim = replay(GAME, u.seed, decodeLog(u.log, GAME.maxTicks), u.choices, u.ticks).sim;
    records.push({ ...r, p: profile(sim) });
  }
}

// ---------- bot predictions on the same seeds ----------
const seeds = [...new Set(records.map(r => r.upload.seed))];
const bots = Object.fromEntries(Object.entries(HUMANS).map(([name, bot]) => {
  const ps = seeds.map(seed => { const sim = createSim(seed); while (phase(sim) === 'play') step(sim, bot.input(sim)); return profile(sim); });
  return [name, { sec: SEGMENTS.map((s, k) => mean(ps.map(p => p.sec[k]).filter(Number.isFinite))), death: median(ps.map(p => p.death ?? 90)), finish: mean(ps.map(p => (p.finished ? 1 : 0))) }];
}));
const nearest = p => Object.entries(bots).map(([name, b]) => {
  const d = MAIN.filter(k => Number.isFinite(p.sec[k]) && Number.isFinite(b.sec[k])).map(k => (p.sec[k] - b.sec[k]) ** 2);
  return [name, d.length ? Math.sqrt(mean(d)) : Infinity];
}).sort((a, b) => a[1] - b[1])[0];

// ---------- per tester ----------
const testers = [...new Set(records.map(r => r.tester))].map(name => {
  const rs = records.filter(r => r.tester === name).sort((a, b) => a.run - b.run || a.at.localeCompare(b.at));
  const first = rs[0], best = rs.reduce((x, y) => (y.p.score > x.p.score ? y : x));
  const [model, dist] = nearest(best.p);
  return { name, runs: rs.length, first, best, model, dist, gain: rs.length > 1 ? best.p.score / Math.max(1, first.p.score) - 1 : NaN, device: first.device, latency: first.latency };
});

// model gaps: sections where testers matched to a profile differ from that profile by > 10 pp
const gaps = [];
for (const name of Object.keys(bots)) {
  const group = testers.filter(t => t.model === name);
  if (!group.length) continue;
  for (const k of MAIN) {
    const h = mean(group.map(t => t.best.p.sec[k]).filter(Number.isFinite));
    if (Number.isFinite(h) && Math.abs(h - bots[name].sec[k]) > 0.1) gaps.push(`${name}（${group.length} 人）在「${SEGMENTS[k].name}」：真人 ${pct(h)}，模型 ${pct(bots[name].sec[k])}`);
  }
}

const allBest = testers.map(t => t.best.p), firsts = testers.map(t => t.first.p);
const lat = testers.map(t => t.latency).filter(l => l && Number.isFinite(l.input));
const md = [
  '# Human Playtest Report — 喵拳道場（自動產生）',
  '',
  `- 產生：\`node tools/human-report.mjs ${inputs.join(' ')}\`；sim v${GAME.version}；${files.length} 個檔案 → ${records.length} 局有效（${testers.length} 位試玩者）、${rejected.length} 筆剔除`,
  '- 每局都用伺服器同一份 sim 重播驗證後才計入；命中率只算有打到的段落',
  '',
  '## 總覽',
  '',
  '| 指標 | 第一局 | 最佳局 | 模型（新手 / 一般 / 熟手） |',
  '|---|---|---|---|',
  `| 打完全場 | ${pct(mean(firsts.map(p => (p.finished ? 1 : 0))))} | ${pct(mean(allBest.map(p => (p.finished ? 1 : 0))))} | ${pct(bots.casual?.finish)} / ${pct(bots.regular?.finish)} / ${pct(bots.skilled?.finish)} |`,
  `| 倒下時間中位數（沒倒下記 90 s） | ${Math.round(median(firsts.map(p => p.death ?? 90)))} s | ${Math.round(median(allBest.map(p => p.death ?? 90)))} s | ${Math.round(bots.casual?.death)} / ${Math.round(bots.regular?.death)} / ${Math.round(bots.skilled?.death)} s |`,
  `| Perfect 率 | ${pct(mean(firsts.map(p => p.perfect)))} | ${pct(mean(allBest.map(p => p.perfect)))} | — |`,
  `| 空揮次數（平均） | ${Math.round(mean(firsts.map(p => p.whiffs)))} | ${Math.round(mean(allBest.map(p => p.whiffs)))} | — |`,
  `| 學習曲線（最佳 / 第一局分數，多局者） | — | ${(g => (Number.isFinite(g) ? '+' + pct(g) : '—'))(mean(testers.map(t => t.gain).filter(Number.isFinite)))} | — |`,
  '',
  '## 各段命中率（最佳局）',
  '',
  `| 段落 | 真人平均 | 新手模型 | 一般模型 | 熟手模型 |`,
  '|---|---|---|---|---|',
  ...SEGMENTS.map((s, k) => `| ${s.name} | ${pct(mean(allBest.map(p => p.sec[k]).filter(Number.isFinite)))} | ${pct(bots.casual?.sec[k])} | ${pct(bots.regular?.sec[k])} | ${pct(bots.skilled?.sec[k])} |`),
  '',
  '## 試玩者',
  '',
  '| 試玩者 | 局數 | 第一局分數 | 最佳分數 | 最佳局倒下 | 最像哪個模型（誤差） | 觸控 / 音訊延遲 | 裝置 |',
  '|---|---|---|---|---|---|---|---|',
  ...testers.map(t => `| ${t.name} | ${t.runs} | ${t.first.p.score} | ${t.best.p.score} | ${t.best.p.death == null ? '打完' : Math.round(t.best.p.death) + ' s'} | ${t.model}（${t.dist.toFixed(2)}） | ${t.latency?.input ?? '—'} / ${t.latency?.audio ?? '—'} ms | ${t.device?.touch ? '觸控' : '滑鼠 / 鍵盤'} ${t.device?.w}×${t.device?.h} |`),
  '',
  '## 模型偏差（真人和對應模型差 > 10 pp 的段落 → 回頭調 tools/humanBots.mjs）',
  '',
  ...(gaps.length ? gaps.map(g => `- ${g}`) : ['- 無']),
  '',
  `## 延遲校正分布（${lat.length} 人）`,
  '',
  lat.length ? `觸控中位數 ${median(lat.map(l => l.input))} ms（範圍 ${Math.min(...lat.map(l => l.input))}–${Math.max(...lat.map(l => l.input))}）；音訊中位數 ${median(lat.map(l => l.audio ?? 0))} ms（範圍 ${Math.min(...lat.map(l => l.audio ?? 0))}–${Math.max(...lat.map(l => l.audio ?? 0))}）` : '沒有校正資料',
  '',
  ...(rejected.length ? ['## 剔除', '', ...rejected.map(x => `- ${x}`), ''] : []),
].join('\n');

if (outIdx >= 0) writeFileSync(args[outIdx + 1], md, 'utf8');
console.log(md);
