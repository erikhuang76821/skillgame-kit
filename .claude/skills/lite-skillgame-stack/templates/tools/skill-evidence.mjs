// Skill evidence: the result table for this game's frozen strategies (tools/strategies.mjs).
//   node tools/skill-evidence.mjs [questions] [--out report.md] [--json table.json]
//        [--confirm [--generation <n>] [--require-recorded]] [--ledger <path>] [--rule <rule id>]
// Without --confirm the questions are the tuning batch: use them freely, but they are not confirmation evidence.
// --confirm uses a confirmation batch and records it in the ledger (default: docs/skill_evidence_ledger.json next to
// the game folder, wherever the command is started from). Without --generation it re-runs the latest recorded batch
// (or starts batch 1). A recorded batch can only be re-run unchanged; after the strategies, the rules, this tool, the
// question count or the thresholds change, the next generation must be used.
// --require-recorded (what the loop gate runs): only re-run a batch that is already in the ledger. A missing or empty
// ledger, or a batch that is not recorded yet, is refused with exit 2, so the gate never opens a batch by itself.
// Thresholds are never hard-coded and cannot be passed on the command line: the significance level and the minimum
// number of questions come from RULE-SKILL-EVIDENCE in knowledge-base/index/rules.json through shared/tools/rules.mjs
// (this game's config/rules.overrides.json applies). Without a question count: a re-run of a recorded confirmation
// batch keeps that batch's count; anything else uses the rule's minimum.
// --rule <id> (what the loop's test cards run, one card per rule, without --out: a gate writes no file): the exit code
// follows that rule only.
//   RULE-SKILL-EVIDENCE      the strategy set is complete and the batch has enough questions
//   RULE-SKILL-NOT-LUCK      ...and the strong strategy beats the random one
//   RULE-SKILL-BEATS-SIMPLE  ...and it beats every simple one
// Without --rule the exit code follows all three.
// Exit codes: 0 = done (and passed, when a verdict was asked for); 1 = the verdict failed; 2 = anything else
// (misuse, a refused run, a file that cannot be loaded or written). An incomplete strategy set is 1 under
// --rule RULE-SKILL-EVIDENCE (that is what the rule checks) and 2 otherwise (nothing can be measured).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkLedger, checkStrategies, recordConfirmation, runEvidence, toMarkdown } from './lib/evidence.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), GAME_DIR = resolve(HERE, '..');
const fail = msg => { console.error(`✘ ${msg}`); process.exit(2); };

// --- arguments: --confirm is a flag; every other option takes exactly one value ---
const VALUE_OPTS = ['--out', '--json', '--ledger', '--generation', '--rule'];
const argv = process.argv.slice(2), o = {}, positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--confirm') o.confirm = true;
  else if (a === '--require-recorded') o.requireRecorded = true;
  else if (VALUE_OPTS.includes(a)) { if (argv[i + 1] === undefined || argv[i + 1].startsWith('--')) fail(`${a} 需要一個值`); o[a] = argv[++i]; }
  else if (a.startsWith('--')) fail(`不認識的選項 ${a}`);
  else positional.push(a);
}
if (positional.length > 1) fail(`只接受一個位置參數（題數），收到：${positional.join(' ')}`);
const int = (text, what) => { if (!/^\d+$/.test(text) || Number(text) < 1) fail(`${what} 要是 1 以上的整數，收到 ${text}`); return Number(text); };
if (o['--generation'] !== undefined && !o.confirm) fail('--generation 只能和 --confirm 一起用');
if (o.requireRecorded && !o.confirm) fail('--require-recorded 只能和 --confirm 一起用');
const RULE_VERDICT = {
  'RULE-SKILL-EVIDENCE': v => v.enoughQuestions,
  'RULE-SKILL-NOT-LUCK': v => v.enoughQuestions && v.beatsRandom,
  'RULE-SKILL-BEATS-SIMPLE': v => v.enoughQuestions && v.beatsEverySimple,
};
if (o['--rule'] !== undefined && !RULE_VERDICT[o['--rule']]) fail(`--rule 只能是 ${Object.keys(RULE_VERDICT).join('、')}`);

// --- thresholds: from the rules, never from here ---
const RULE = 'RULE-SKILL-EVIDENCE';
let thresholds;
try {
  let d = HERE;
  while (!existsSync(join(d, 'shared', 'tools', 'rules.mjs'))) { const up = dirname(d); if (up === d) throw new Error(`在 ${HERE} 以上找不到 shared/tools/rules.mjs`); d = up; }
  const { loadRules } = await import(pathToFileURL(join(d, 'shared', 'tools', 'rules.mjs')).href);
  const rules = loadRules({ from: fileURLToPath(import.meta.url) });
  thresholds = { alpha: rules.value(RULE, 'alpha'), minQuestions: rules.value(RULE, 'minQuestions') };
} catch (e) { fail(`讀不到 ${RULE} 的門檻：${e.message}`); }

// --- ledger: its location does not depend on where the command is started from ---
const ledgerPath = o['--ledger'] ? resolve(o['--ledger']) : resolve(GAME_DIR, '..', 'docs', 'skill_evidence_ledger.json');
let ledger = null;
if (o.confirm) {
  if (existsSync(ledgerPath)) { try { ledger = JSON.parse(readFileSync(ledgerPath, 'utf8')); } catch (e) { fail(`紀錄檔 ${ledgerPath} 不是合法的 JSON：${e.message}`); } }
  const broken = checkLedger(ledger);
  if (broken) fail(`紀錄檔 ${ledgerPath}：${broken}；請修復或還原，不要刪除`);
}
const used = ledger?.length ?? 0;
const generation = !o.confirm ? 1 : o['--generation'] === undefined ? Math.max(1, used) : int(o['--generation'], '--generation');
if (generation > used + 1) fail(`確認批次要依序使用：下一批是第 ${used + 1} 批`);
const recorded = o.confirm ? ledger?.[generation - 1] : null;
if (o.requireRecorded && !recorded) fail(used ? `第 ${generation} 批還沒有紀錄；換批要人自己下 npm run evidence:confirm -- --generation ${generation}` : `紀錄檔 ${ledgerPath} 不存在或沒有任何批次；第一次確認要在策略凍結後由人下 npm run evidence:confirm`);
const n = positional.length ? int(positional[0], '題數') : recorded?.n ?? thresholds.minQuestions;

// --- hash: the strategy file, the sim, this tool and its measuring code, and every local file they import ---
// Found by scanning the text for relative specifiers written as string literals after `from` or `import` (comments
// in between are allowed). This is a text scan, not a parser: it can include a path that only appears in a comment
// (harmless), and it cannot see a file loaded through a computed specifier or read with fs. The report lists the
// files so a person can check that nothing that shapes the result is missing.
function importClosure(entries) {
  const seen = new Set(), todo = [...entries];
  while (todo.length) {
    const file = todo.pop();
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\b(?:from|import)\s*\(?\s*(?:\/\*[\s\S]*?\*\/\s*)*(['"])(\.{1,2}\/[^'"?#]+)(?:[?#][^'"]*)?\1/g)) todo.push(resolve(dirname(file), m[2]));
  }
  return [...seen].map(f => relative(GAME_DIR, f).split('\\').join('/')).sort();
}
const hashedFiles = importClosure([resolve(HERE, 'strategies.mjs'), resolve(GAME_DIR, 'src/sim/sim.js'), fileURLToPath(import.meta.url)]);
const hasher = createHash('sha256');
for (const f of hashedFiles) hasher.update(f).update('\0').update(readFileSync(resolve(GAME_DIR, f))).update('\0');
const strategyHash = hasher.digest('hex').slice(0, 16);

let report;
try {
  const { GAME } = await import('../src/sim/sim.js');
  const { STRATEGIES } = await import('./strategies.mjs');
  const incomplete = checkStrategies(STRATEGIES, GAME);
  if (incomplete.length) {
    console.error(`✘ tools/strategies.mjs 不完整\n- ${incomplete.join('\n- ')}`);
    process.exit(o['--rule'] === 'RULE-SKILL-EVIDENCE' ? 1 : 2);
  }
  report = runEvidence(GAME, STRATEGIES, { n, mode: o.confirm ? 'confirm' : 'tuning', generation, thresholds, thresholdSource: RULE, strategyHash, hashedFiles,
    ...(ledger?.length ? { seedBase: ledger[0].seedBase } : {}), command: `node tools/skill-evidence.mjs ${argv.join(' ')}`.trim() });
} catch (e) { fail(e.message); }

// A refused confirmation writes nothing: the ledger check comes before any file is touched. Then the reports, then
// the ledger — if a report cannot be written, the batch is not recorded as used.
const rec = o.confirm ? recordConfirmation(ledger, report) : null;
if (rec && !rec.ok) fail(rec.reason);
const md = toMarkdown(report);
try {
  if (o['--out']) writeFileSync(o['--out'], md, 'utf8');
  if (o['--json']) writeFileSync(o['--json'], JSON.stringify(report, null, 1) + '\n', 'utf8');
  if (rec) {
    writeFileSync(ledgerPath, JSON.stringify(rec.ledger, null, 1) + '\n', 'utf8');
    console.error(`紀錄檔：${ledgerPath}`);
  }
} catch (e) { fail(e.message); }
console.log(md);
const passed = o['--rule'] ? RULE_VERDICT[o['--rule']](report.verdict) : report.verdict.pass;
if (o['--rule']) console.error(`${o['--rule']}：${passed ? '通過' : '未通過'}`);
process.exitCode = passed ? 0 : 1;
