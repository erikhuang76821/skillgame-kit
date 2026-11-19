// Skill evidence on THIS game: its strategies (tools/strategies.mjs) and the command line (tools/skill-evidence.mjs).
// Rewrite the numbers for your game: the values asserted here are the demo's (Beat Tap). The tool itself is tested in
// evidence.test.mjs, which stays unchanged. Thresholds come from RULE-SKILL-EVIDENCE through shared/tools/rules.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME as DEMO } from '../src/sim/sim.js';
import { STRATEGIES as DEMO_STRATEGIES } from '../tools/strategies.mjs';
import { checkStrategies, runEvidence } from '../tools/lib/evidence.mjs';

test('this game\'s strategy file is complete and fits the game', () => {
  assert.deepEqual(checkStrategies(DEMO_STRATEGIES, DEMO), []);
});

test('demo: the random strategy plays every beat: it scores, but far below the strong strategy', () => {
  const r = runEvidence(DEMO, DEMO_STRATEGIES, { n: 30 });
  const random = r.pairs.find(p => p.role === 'random');
  const simple = Math.max(...r.pairs.filter(p => p.role === 'simple').map(p => p.scoreRatio));
  assert.ok(random.scoreRatio > 0.02 && random.scoreRatio < 0.8, `ratio ${random.scoreRatio}`);
  assert.ok(random.scoreRatio > simple, 'it plays the beats, unlike tapping blind');
});

// ---------- command line ----------
const CLI = fileURLToPath(new URL('../tools/skill-evidence.mjs', import.meta.url));
const cli = (args, cwd) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd });

test('CLI: misuse exits 2 without running; thresholds come from the rules; a tuning run exits 0', async () => {
  for (const args of [['0'], ['1.5'], ['30', '40'], ['--bogus'], ['--alpha', '0.5'], ['--min-questions', '1'], ['--out'], ['--ledger', '--confirm'],
    ['--generation', '2'], ['--confirm', '30'], ['--rule', 'RULE-SKILL-DOMINANCE'], ['--rule'], ['5', '--out', join(tmpdir(), 'no-such-dir-evidence', 'x', 'report.md')]]) {
    const r = cli(args);
    assert.equal(r.status, 2, `${args.join(' ')} -> ${r.status}\n${r.stderr}`);
    assert.match(r.stderr, /✘/); assert.equal(r.stdout, '', args.join(' '));
  }
  // Thresholds come from the rules (never the command line); with no count, the rule's minimum is the batch size.
  // Found by walking up, so this works both in the template and in <Game>/game/test.
  const { dirname: up } = await import('node:path'), { pathToFileURL } = await import('node:url');
  let d = up(fileURLToPath(import.meta.url));
  while (!existsSync(join(d, 'shared', 'tools', 'rules.mjs'))) { const p = up(d); if (p === d) throw new Error('shared/tools/rules.mjs not found'); d = p; }
  const { loadRules } = await import(pathToFileURL(join(d, 'shared', 'tools', 'rules.mjs')).href);
  const rules = loadRules({ from: fileURLToPath(import.meta.url) });
  const alpha = rules.value('RULE-SKILL-EVIDENCE', 'alpha'), min = rules.value('RULE-SKILL-EVIDENCE', 'minQuestions');
  const ok = cli([]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.ok(ok.stdout.includes(`題目：${min} 題`) && ok.stdout.includes(`門檻取自 RULE-SKILL-EVIDENCE：顯著水準 ${alpha}、至少 ${min} 題`), ok.stdout.slice(0, 600));
  assert.match(ok.stdout, /調校用（不能當確認證據）[\s\S]*排除純運氣 → \*\*通過\*\*/);
  const tooFew = cli([String(min - 1)]);
  assert.equal(tooFew.status, 1, 'a failed verdict is exit 1, not misuse');
  assert.match(tooFew.stdout, /題數不足/);
  // One card per rule: the exit code follows the named rule only (the demo passes all three on enough questions).
  for (const rule of ['RULE-SKILL-EVIDENCE', 'RULE-SKILL-NOT-LUCK', 'RULE-SKILL-BEATS-SIMPLE']) {
    assert.equal(cli(['--rule', rule]).status, 0, rule);
    assert.equal(cli([String(min - 1), '--rule', rule]).status, 1, `${rule} with too few questions`);
  }
});

test('CLI: the confirmation ledger is frozen, found by its path from any working directory, and never overwritten when damaged', () => {
  const dir = mkdtempSync(join(tmpdir(), 'evidence-'));
  try {
    const ledger = join(dir, 'ledger.json'), json = join(dir, 'table.json');
    // The gate's command never opens a batch: no ledger, an empty one, or JSON null are all refused, and nothing is written.
    for (const content of [null, '[]', 'null']) {
      if (content !== null) writeFileSync(ledger, content, 'utf8'); else rmSync(ledger, { force: true });
      const gate = cli(['--confirm', '--require-recorded', '--ledger', ledger]);
      assert.equal(gate.status, 2, `${content}: ${gate.stderr}`); assert.match(gate.stderr, /第一次確認要在策略凍結後由人下/);
      assert.equal(existsSync(ledger) ? readFileSync(ledger, 'utf8') : null, content);
    }
    assert.equal(cli(['--require-recorded']).status, 2, 'only with --confirm');
    rmSync(ledger, { force: true });
    const first = cli(['30', '--confirm', '--ledger', ledger, '--json', json]);
    assert.equal(first.status, 0, first.stderr);
    const entries = JSON.parse(readFileSync(ledger, 'utf8'));
    assert.deepEqual(entries.map(e => [e.generation, e.n, e.game]), [[1, 30, DEMO.id]]);
    const table = JSON.parse(readFileSync(json, 'utf8'));
    for (const f of ['tools/strategies.mjs', 'src/sim/sim.js', 'src/sim/core/index.js', 'src/sim/core/rng.js', 'src/sim/core/match.js',
      'tools/skill-evidence.mjs', 'tools/lib/evidence.mjs']) {
      assert.ok(table.hashedFiles.includes(f), `the hash covers ${f}`);
    }
    assert.equal(entries[0].strategyHash, table.strategyHash);

    // Same batch from another working directory with a relative ledger path resolved there: same file, a plain re-run.
    const again = cli(['30', '--confirm', '--ledger', 'ledger.json'], dir);
    assert.equal(again.status, 0, again.stderr);
    assert.deepEqual(JSON.parse(readFileSync(ledger, 'utf8')), entries);

    // A refused run writes nothing at all: not the ledger, and not the report it was asked to write.
    const out = join(dir, 'report.md');
    writeFileSync(out, 'kept', 'utf8');
    const redraw = cli(['40', '--confirm', '--ledger', ledger, '--out', out, '--json', join(dir, 'refused.json')]);
    assert.equal(redraw.status, 2); assert.match(redraw.stderr, /n 與紀錄不同[\s\S]*第 2 批/);
    assert.equal(readFileSync(out, 'utf8'), 'kept');
    assert.equal(existsSync(join(dir, 'refused.json')), false);
    const skip = cli(['30', '--confirm', '--generation', '3', '--ledger', ledger]);
    assert.equal(skip.status, 2); assert.match(skip.stderr, /下一批是第 2 批/);
    assert.deepEqual(JSON.parse(readFileSync(ledger, 'utf8')), entries, 'refused runs write nothing');
    const next = cli(['40', '--confirm', '--generation', '2', '--ledger', ledger]);
    assert.equal(next.status, 0, next.stderr);
    assert.deepEqual(JSON.parse(readFileSync(ledger, 'utf8')).map(e => [e.generation, e.n]), [[1, 30], [2, 40]]);
    // With no count, a re-run keeps the recorded batch's count (40 here, not the rule's minimum): this is what the gate runs.
    const notYet = cli(['--confirm', '--require-recorded', '--generation', '3', '--ledger', ledger]);
    assert.equal(notYet.status, 2); assert.match(notYet.stderr, /第 3 批還沒有紀錄/);
    const rerun = cli(['--confirm', '--require-recorded', '--ledger', ledger, '--out', out]);
    assert.equal(rerun.status, 0, rerun.stderr);
    assert.match(readFileSync(out, 'utf8'), /題目：40 題[\s\S]*確認用第 2 批/);
    assert.equal(JSON.parse(readFileSync(ledger, 'utf8')).length, 2);

    for (const damaged of ['{ not json', JSON.stringify({ entries })]) {
      writeFileSync(ledger, damaged, 'utf8');
      const r = cli(['30', '--confirm', '--ledger', ledger]);
      assert.equal(r.status, 2, r.stderr); assert.match(r.stderr, /紀錄檔/);
      assert.equal(readFileSync(ledger, 'utf8'), damaged, 'a damaged ledger is left for a person to repair');
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
