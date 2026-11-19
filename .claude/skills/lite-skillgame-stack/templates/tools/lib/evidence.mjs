// Skill evidence as one result table (knowledge-base/decisions/2026-11-11-skill-evidence.md §3, §9).
// Works for any GameDef and any set of named strategies: a strategy only has to play a match to the end
// (policy.pick(sim) for choices, policy.input(sim) for ticks). Nothing here assumes bots, tiers, ticks or seconds.
//
// What it DOES assume (stated in every report; a game outside these needs its own comparison, not this verdict):
//   - questions are drawn from seeds (a fixed, hand-made question bank is a census and is not supported yet);
//   - one question = one match, and a strategy's result on it is deterministic;
//   - game.score(sim) is a finite number and a higher score is the better result (no ranks, lowest-wins or teams).
//
// What it measures, per pair (strong strategy vs each other one), on the SAME questions:
//   wins / ties / losses, tie rate, advantage = (wins + ties/2) / questions, score difference, score ratio,
//   and an exact one-sided sign test on the questions that were decided (ties carry no direction and are left out
//   of the test, but stay in every reported rate). The test asks: "would this many wins out of the decided
//   questions be surprising if the two were equally good?"
// What it does NOT decide: how close a simple strategy may come before the game is too shallow. That is reported
// (score ratio, share of questions the simple strategy did not lose) and judged by a person.
//
// No thresholds live here. The caller passes { alpha, minQuestions }; the command line (tools/skill-evidence.mjs)
// takes them from RULE-SKILL-EVIDENCE in knowledge-base/index/rules.json. Without them the report carries
// measurements only and no verdict.
import { createHash } from 'node:crypto';
import { hash32, playMatch } from '../../src/sim/core/index.js';

export const ROLES = ['strong', 'random', 'simple'];
const STREAM_TUNING = 7, STREAM_CONFIRM = 0xc0f, U32 = 0xffffffff;
const MAX_GENERATION = U32 - STREAM_CONFIRM;      // the stream id stays a distinct 32-bit value

const mean = a => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };
const extent = a => { let lo = Infinity, hi = -Infinity; for (const v of a) { if (v < lo) lo = v; if (v > hi) hi = v; } return [lo, hi]; };
const isCount = v => Number.isInteger(v) && v >= 1;
const LEDGER_SCHEMA = 1;

/**
 * Exact one-sided sign test: P(X >= wins) for X ~ Binomial(wins + losses, 1/2). 1 when nothing was decided.
 * Only the smaller tail is summed (in log space, compensated), so the result neither underflows nor drifts:
 * 0 wins is exactly 1, and a p-value near 1 is 1 minus a small sum. Floating point, not arbitrary precision.
 */
export function signTest(wins, losses) {
  if (!(Number.isInteger(wins) && Number.isInteger(losses) && wins >= 0 && losses >= 0)) throw new Error('signTest: wins and losses are non-negative integers');
  const n = wins + losses;
  if (wins === 0) return 1;
  const logFact = new Float64Array(n + 1);
  for (let i = 1, c = 0; i <= n; i++) { const y = Math.log(i) - c, t = logFact[i - 1] + y; c = (t - logFact[i - 1]) - y; logFact[i] = t; }
  const term = k => Math.exp(logFact[n] - logFact[k] - logFact[n - k] - n * Math.LN2);
  let tail = 0;
  if (2 * wins > n) { for (let k = n; k >= wins; k--) tail += term(k); return Math.min(1, tail); }
  for (let k = 0; k < wins; k++) tail += term(k);            // P(X < wins), the smaller side
  return Math.min(1, Math.max(0, 1 - tail));
}

function checkBatch(seedBase, n, mode, generation) {
  if (mode !== 'tuning' && mode !== 'confirm') throw new Error(`evidence: unknown mode ${mode}`);
  if (!(Number.isInteger(seedBase) && seedBase >= 0 && seedBase <= U32)) throw new Error('evidence: seedBase 是 0 到 0xffffffff 的整數');
  if (!(isCount(n) && n <= U32)) throw new Error('evidence: 題數是 1 以上的整數');
  if (!(isCount(generation) && generation <= MAX_GENERATION)) throw new Error(`evidence: generation 是 1 到 ${MAX_GENERATION} 的整數`);
}

/**
 * The questions of one batch: n distinct seeds from the batch's own stream (repeats inside a batch are skipped).
 * A confirmation batch also skips every seed of the tuning batch of the same size and seedBase, so the two never
 * share a question. Different confirmation generations use different streams: a shared question between two
 * generations is unlikely but possible (seeds are 32-bit) and is not checked — it costs a little independence
 * between two confirmations, it does not let a batch be re-drawn.
 */
export function questions(seedBase, n, { mode = 'tuning', generation = 1 } = {}) {
  checkBatch(seedBase, n, mode, generation);
  const draw = (stream, skip) => {
    const seen = new Set();
    for (let i = 0; seen.size < n; i++) {
      if (i > U32) throw new Error('evidence: 這個批次抽不出這麼多不重複的題目');
      const s = hash32(seedBase, stream, i);
      if (!skip?.has(s)) seen.add(s);
    }
    return seen;
  };
  const tuning = draw(STREAM_TUNING, null);
  return [...(mode === 'confirm' ? draw(STREAM_CONFIRM + generation, tuning) : tuning)];
}

/**
 * Validate the strategy set: exactly one strong, exactly one random, at least one simple; each says what it sees and
 * its limits. With a game, each policy must also have the methods that game will call (input for ticks, pick for
 * choices). What a strategy really sees, and whether "random" is uniform over real actions, is for a person to review.
 */
export function checkStrategies(strategies, game = null) {
  const errors = [], names = Object.keys(strategies ?? {});
  const by = role => names.filter(n => strategies[n]?.role === role);
  const fn = (s, k) => typeof s?.policy?.[k] === 'function';
  for (const n of names) {
    const s = strategies[n];
    if (!ROLES.includes(s?.role)) errors.push(`${n}: role 必須是 ${ROLES.join(' / ')}`);
    if (!fn(s, 'pick') && !fn(s, 'input')) errors.push(`${n}: policy 要有 pick(sim) 或 input(sim)`);
    else if (game) {
      if (game.maxTicks > 0 && !fn(s, 'input')) errors.push(`${n}: 這款遊戲會跑 tick，policy 要有 input(sim)`);
      if (typeof game.choose === 'function' && !fn(s, 'pick')) errors.push(`${n}: 這款遊戲有選擇，policy 要有 pick(sim)`);
    }
    for (const k of ['sees', 'limits']) if (typeof s?.[k] !== 'string' || !s[k].trim()) errors.push(`${n}: 缺 ${k}（它能看到什麼／能力限制）`);
  }
  if (by('strong').length !== 1) errors.push(`要恰好一個 strong 策略（現在 ${by('strong').length} 個）`);
  if (by('random').length !== 1) errors.push(`要恰好一個 random 策略（現在 ${by('random').length} 個）`);
  if (by('simple').length < 1) errors.push('至少要一個 simple 策略');
  return errors;
}

/** Thresholds are checked before anything runs. Returns the error text, or null. */
export function checkThresholds(t) {
  if (t === null || t === undefined) return null;
  if (!(typeof t.alpha === 'number' && t.alpha > 0 && t.alpha < 1)) return 'thresholds.alpha 要是 0 與 1 之間的數（不含兩端）';
  if (!isCount(t.minQuestions)) return 'thresholds.minQuestions 要是 1 以上的整數';
  return null;
}

function pairStats(rows, a, b) {
  let wins = 0, ties = 0, losses = 0;
  const sa = rows.map(r => r.results[a].score), sb = rows.map(r => r.results[b].score);
  const diffs = sa.map((v, i) => v - sb[i]);
  for (const d of diffs) d > 0 ? wins++ : d < 0 ? losses++ : ties++;
  const n = rows.length, meanA = mean(sa), [minDiff, maxDiff] = extent(diffs);
  // A ratio of means only says something when no score is negative and the strong strategy scores at all.
  const ratioOk = extent(sa)[0] >= 0 && extent(sb)[0] >= 0 && meanA > 0;
  return {
    strong: a, other: b, wins, ties, losses,
    advantage: (wins + ties / 2) / n, tieRate: ties / n, decided: wins + losses,
    p: signTest(wins, losses),
    meanDiff: mean(diffs), medianDiff: median(diffs), minDiff, maxDiff,
    // Closeness (reported, never gated): how much of the strong strategy's result the other one gets.
    scoreRatio: ratioOk ? mean(sb) / meanA : null, notLost: (ties + losses) / n,
  };
}

/**
 * @param game        GameDef; optional game.completed(sim) -> boolean adds a completion column
 * @param strategies  { name: { role, sees, limits, policy } } (see checkStrategies)
 * @param opts        { n, seedBase, mode: 'tuning'|'confirm', generation, thresholds: { alpha, minQuestions } | null,
 *                      thresholdSource (rule id shown in the report), strategyHash, hashedFiles, command }
 * Everything is validated before the first match is played. Every match is played twice: throws on invalid input,
 * on a strategy that fails or gives a different result the second time, and on scores that are not finite numbers
 * or too large to average.
 */
export function runEvidence(game, strategies, opts = {}) {
  const { n = 30, seedBase = 2026, mode = 'tuning', generation = 1, thresholds = null, thresholdSource = null, strategyHash = null, hashedFiles = null, command = null } = opts;
  const errors = checkStrategies(strategies, game);
  if (errors.length) throw new Error(`evidence: 策略定義不完整\n- ${errors.join('\n- ')}`);
  const bad = checkThresholds(thresholds);
  if (bad) throw new Error(`evidence: ${bad}`);
  const seeds = questions(seedBase, n, { mode, generation });
  const names = Object.keys(strategies), strong = names.find(k => strategies[k].role === 'strong');
  const play = (k, seed) => {
    let rec;
    try { rec = playMatch(game, seed, strategies[k].policy); } catch (e) { throw new Error(`evidence: 策略「${k}」在題目 ${seed} 失敗：${e.message}`); }
    const score = game.score(rec.sim);
    if (typeof score !== 'number' || !Number.isFinite(score)) throw new Error(`evidence: 策略「${k}」在題目 ${seed} 的分數不是有限數值（${score}）`);
    return { score, ...(game.completed ? { completed: game.completed(rec.sim) === true } : {}) };
  };
  // One deterministic result per question is the premise of the test, so every match is played twice and compared.
  const twice = (k, seed) => {
    const a = play(k, seed), b = play(k, seed);
    if (a.score !== b.score || a.completed !== b.completed) throw new Error(`evidence: 策略「${k}」在題目 ${seed} 重跑的結果不同；策略或 sim 不是確定性的`);
    return a;
  };
  const rows = seeds.map(seed => ({ seed, results: Object.fromEntries(names.map(k => [k, twice(k, seed)])) }));

  const summary = Object.fromEntries(names.map(k => {
    const sc = rows.map(r => r.results[k].score), [min, max] = extent(sc);
    return [k, { role: strategies[k].role, sees: strategies[k].sees, limits: strategies[k].limits, mean: mean(sc), median: median(sc), min, max,
      ...(game.completed ? { completion: mean(rows.map(r => (r.results[k].completed ? 1 : 0))) } : {}) }];
  }));
  const pairs = names.filter(k => k !== strong).map(k => ({ ...pairStats(rows, strong, k), role: strategies[k].role }));
  // Finite scores can still overflow a sum or a difference; a report with such numbers is not a result.
  for (const [k, s] of Object.entries(summary)) if (!Number.isFinite(s.mean)) throw new Error(`evidence: 策略「${k}」的分數大到無法計算平均`);
  for (const p of pairs) for (const f of ['meanDiff', 'medianDiff', 'minDiff', 'maxDiff']) if (!Number.isFinite(p[f])) throw new Error(`evidence: ${p.strong} 對 ${p.other} 的分差大到無法計算`);
  const resultHash = createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 16);

  // Verdicts need thresholds from the rules. A pair passes when the sign test is significant on enough questions.
  let verdict = null;
  if (thresholds) {
    const { alpha, minQuestions } = thresholds;
    const enough = n >= minQuestions, passes = p => enough && p.p <= alpha;
    for (const p of pairs) p.pass = passes(p);
    verdict = {
      enoughQuestions: enough,
      beatsRandom: pairs.filter(p => p.role === 'random').every(passes),
      beatsEverySimple: pairs.filter(p => p.role === 'simple').every(passes),   // each one, no correction: all must hold
    };
    verdict.pass = verdict.beatsRandom && verdict.beatsEverySimple;
  }
  return { game: game.id, version: game.version, n, seedBase, mode, generation: mode === 'confirm' ? generation : null, sampling: 'seeded',
    strong, strategyHash, hashedFiles, command, thresholdSource: thresholds ? thresholdSource : null, thresholds: thresholds ? { alpha: thresholds.alpha, minQuestions: thresholds.minQuestions } : null,
    summary, pairs, verdict, resultHash, rows };
}

const tally = pairs => pairs.map(p => ({ other: p.other, wins: p.wins, ties: p.ties, losses: p.losses }));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Shape check for a ledger read from disk. Returns the error text, or null. A missing ledger (null) is an empty one. */
export function checkLedger(ledger) {
  if (ledger === null || ledger === undefined) return null;
  if (!Array.isArray(ledger)) return '紀錄檔不是陣列';
  for (let i = 0; i < ledger.length; i++) {
    const e = ledger[i], at = `紀錄檔第 ${i + 1} 筆`;
    if (!e || typeof e !== 'object') return `${at}不是物件`;
    if (e.generation !== i + 1) return `${at}的批次應該是 ${i + 1}`;
    if (e.schema !== LEDGER_SCHEMA) return `${at}的格式版本不是 ${LEDGER_SCHEMA}`;
    const str = k => typeof e[k] === 'string' && e[k] !== '';
    if (!str('game') || !str('strategyHash') || !str('resultHash') || !('version' in e)) return `${at}缺 game、version、strategyHash 或 resultHash`;
    if (!isCount(e.n) || !(Number.isInteger(e.seedBase) && e.seedBase >= 0 && e.seedBase <= U32)) return `${at}的 n 或 seedBase 不合法`;
    if (e.thresholds !== null && (typeof e.thresholds !== 'object' || checkThresholds(e.thresholds))) return `${at}的 thresholds 不合法`;
    if (e.thresholds === null ? e.pass !== null : typeof e.pass !== 'boolean') return `${at}的 pass 與 thresholds 不一致`;
    const count = v => Number.isInteger(v) && v >= 0;
    if (!Array.isArray(e.pairs) || !e.pairs.length || e.pairs.some(p => !p || typeof p.other !== 'string' || !count(p.wins) || !count(p.ties) || !count(p.losses) || p.wins + p.ties + p.losses !== e.n)) return `${at}的 pairs 不合法（勝平敗要是非負整數，加起來等於題數）`;
    if (e.game !== ledger[0].game || e.seedBase !== ledger[0].seedBase) return `${at}的 game 或 seedBase 與第 1 筆不同`;
  }
  return null;
}

/**
 * Confirmation ledger: one entry per confirmation batch, used in order. An entry freezes everything that defines the
 * batch and its outcome: game, version, strategy hash, number of questions, seedBase, thresholds, the verdict, the
 * win/tie/loss counts and a hash of every per-question result.
 * Re-running a recorded batch is allowed only when ALL of those are identical (it then records nothing new);
 * any difference — changed strategies or rules, another question count, other thresholds — needs the next batch,
 * so a batch cannot be re-drawn until it passes. Every batch of one ledger uses the same game and seedBase.
 * This records use; it cannot prove nobody looked at the questions first.
 * Returns { ok, reason?, ledger } (ledger = the list to write back).
 */
export function recordConfirmation(ledger, report) {
  const broken = checkLedger(ledger);
  if (broken) return { ok: false, reason: `${broken}；請修復或還原紀錄檔，不要刪除`, ledger };
  const entries = ledger ?? [];
  if (report.mode !== 'confirm') return { ok: false, reason: '只有確認模式會寫入紀錄', ledger: entries };
  if (!report.strategyHash) return { ok: false, reason: '確認模式需要策略程式的雜湊', ledger: entries };
  const next = entries.length + 1;
  if (!report.resultHash) return { ok: false, reason: '報告缺逐題結果的雜湊', ledger: entries };
  const entry = { schema: LEDGER_SCHEMA, generation: report.generation, game: report.game, version: report.version, strategyHash: report.strategyHash,
    n: report.n, seedBase: report.seedBase, thresholds: report.thresholds ?? null, pass: report.verdict?.pass ?? null, pairs: tally(report.pairs), resultHash: report.resultHash };
  if (entries.length && (entries[0].game !== report.game || entries[0].seedBase !== report.seedBase)) {
    return { ok: false, reason: `這份紀錄屬於 ${entries[0].game}、基準種子 ${entries[0].seedBase}；同一份紀錄不能換遊戲或基準種子`, ledger: entries };
  }
  const mine = entries[report.generation - 1];
  if (!mine) {
    if (report.generation !== next) return { ok: false, reason: `確認批次要依序使用：下一批是第 ${next} 批`, ledger: entries };
    return { ok: true, ledger: [...entries, entry] };
  }
  const OUTCOME = ['pass', 'pairs', 'resultHash'];
  const changed = Object.keys(entry).filter(k => !OUTCOME.includes(k) && !sameJson(mine[k], entry[k]));
  if (changed.length) return { ok: false, reason: `第 ${report.generation} 批確認題目已經用過，這次的 ${changed.join('、')} 與紀錄不同；改過策略、規則、題數或門檻後請用第 ${next} 批`, ledger: entries };
  if (OUTCOME.some(k => !sameJson(mine[k], entry[k]))) return { ok: false, reason: `第 ${report.generation} 批重跑的結果與紀錄不同；設定相同而結果不同，代表有未納入雜湊的改動或環境差異`, ledger: entries };
  return { ok: true, ledger: entries };
}

export function toMarkdown(r) {
  const pct = v => (v === null ? '—' : `${(v * 100).toFixed(1)}%`), num = v => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  const pv = p => (p < 0.0001 ? '< 0.0001' : p.toFixed(4));
  const hasCompletion = 'completion' in Object.values(r.summary)[0];
  const batch = r.mode === 'confirm' ? `確認用第 ${r.generation} 批` : '調校用（不能當確認證據）';
  const mark = ok => (ok ? '通過' : '未通過');
  const verdictLine = !r.verdict ? '- 自動統計判定：**未判定**（沒有提供門檻；本報告只有量測值）'
    : `- 自動統計判定（${r.thresholdSource ? `門檻取自 ${r.thresholdSource}` : '呼叫端傳入的門檻'}：顯著水準 ${r.thresholds.alpha}、至少 ${r.thresholds.minQuestions} 題）：排除純運氣 → **${mark(r.verdict.beatsRandom)}**；勝過每一條簡單策略 → **${mark(r.verdict.beatsEverySimple)}**${r.verdict.enoughQuestions ? '' : '（題數不足）'}。不含「簡單策略的接近程度」，那一項由人判定`;
  return [
    `# Skill Evidence Report — ${r.game} v${r.version}（自動產生）`,
    '',
    `- 產生：${r.command ? `\`${r.command}\`` : '（未提供指令）'}`,
    `- 題目：${r.n} 題，由基準種子 ${r.seedBase} 產生；${batch}`,
    `- 策略與量法程式雜湊：${r.strategyHash ?? '（未提供）'}${r.hashedFiles ? `（涵蓋 ${r.hashedFiles.length} 個檔案：${r.hashedFiles.join('、')}）` : ''}`,
    verdictLine,
    '- 前提：題目由種子抽出、每題一局、每個策略每題一個確定的結果、分數越高越好。名次制、低分制、多人賽不適用這份判定',
    '- 這份報告只陳述量測結果，不作法律判斷',
    '',
    '## 比較組',
    '',
    `| 策略 | 角色 | 能看到什麼 | 能力限制 | 平均分 | 中位數 | 最低 | 最高 |${hasCompletion ? ' 完成率 |' : ''}`,
    `|---|---|---|---|---|---|---|---|${hasCompletion ? '---|' : ''}`,
    ...Object.entries(r.summary).map(([k, s]) => `| ${k} | ${s.role} | ${s.sees} | ${s.limits} | ${num(s.mean)} | ${num(s.median)} | ${num(s.min)} | ${num(s.max)} |${hasCompletion ? ` ${pct(s.completion)} |` : ''}`),
    '',
    `## 同題配對：${r.strong} 對其他策略`,
    '',
    '| 對手 | 角色 | 勝 | 平 | 敗 | 平手率 | 配對優勢 | 符號檢定 p（單側，只算分出勝負的題） | 平均分差 | 中位分差 | 分數比 |' + (r.verdict ? ' 結果 |' : ''),
    '|---|---|---|---|---|---|---|---|---|---|---|' + (r.verdict ? '---|' : ''),
    ...r.pairs.map(p => `| ${p.other} | ${p.role} | ${p.wins} | ${p.ties} | ${p.losses} | ${pct(p.tieRate)} | ${pct(p.advantage)} | ${pv(p.p)} | ${num(p.meanDiff)} | ${num(p.medianDiff)} | ${pct(p.scoreRatio)} |${r.verdict ? ` ${p.pass ? '通過' : '**未通過**'} |` : ''}`),
    '',
    '配對優勢 =（勝 + 平手的一半）÷ 題數。平手不帶方向，不進檢定，但留在每一個比率裡。分數比 = 對手平均分 ÷ 強策略平均分；有負分或強策略平均分不大於零時不計算（—）。',
    '',
    '## 簡單策略的接近程度（人工判定，沒有通過線）',
    '',
    '| 簡單策略 | 平均分 ÷ 強策略平均分 | 沒輸給強策略的題數比例 | 平手率 |',
    '|---|---|---|---|',
    ...r.pairs.filter(p => p.role === 'simple').map(p => `| ${p.other} | ${pct(p.scoreRatio)} | ${pct(p.notLost)} | ${pct(p.tieRate)} |`),
    '',
    '比例高代表不靠判斷也能玩到接近強策略；平手率高代表多數題目上兩者沒有差別。這兩種情況都要由人看過並寫下理由。',
    '',
  ].join('\n');
}
