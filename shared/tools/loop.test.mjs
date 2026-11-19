import { existsSync } from 'node:fs';
// Tests for loop.mjs (decision 2026-11-10 §4.2–§4.3, §8 item 3, phase D) and the profile-scoped card filter.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContext, fitsProfile } from './context.mjs';
import { loadVocabulary } from './kb-index.mjs';
import { applyMustRead, checkNodes, classifyRun, deriveStatus, formatEvent, hashPaths, loadNodes, mustReadTable, nodeHashes, nodeProduces, parseEvent, planGate, routeFor, runGate, topoOrder } from './loop.mjs';
import { findRoot, loadRules } from './rules.mjs';
// skillgame-kit 只收錄遊戲的文字規格；需要完整遊戲程式（TwinStrike/game 等）的整合測試在此略過。
const FULL_REPO = { skip: !existsSync(new URL('../../TwinStrike/game/package.json', import.meta.url)) && '需要完整遊戲範例（本精簡版未收錄遊戲程式）' };

const root = findRoot(fileURLToPath(import.meta.url));
const doc = loadNodes(root), nodes = doc.nodes;
const ctx = () => ({
  ruleIds: loadRules({ from: root }).rules.map(r => r.id),
  testIds: JSON.parse(readFileSync(join(root, 'shared', 'tests', 'registry.json'), 'utf8')).tests.map(t => t.id),
  vocab: loadVocabulary(root),
});

test('nodes.json validates and is acyclic, N0 first', () => {
  assert.deepEqual(checkNodes(doc, ctx()).errors, []);
  assert.equal(topoOrder(nodes)[0], 'N0-kickoff');
});

test('checkNodes rejects unknown rules, tests, gotos, facets and cycles', () => {
  const bad = { schemaVersion: 1, nodes: [
    { id: 'N0-a', name: 'a', after: ['N1-b'], budget: { kbTokens: 0 }, maxIterations: 1, gate: { must: ['RULE-NOPE'], tests: ['TEST-NOPE'] }, pull: { kb: { genre: ['chess'] } }, onFail: [{ when: 'x', goto: 'N9-zz' }] },
    { id: 'N1-b', name: 'b', after: ['N0-a'], budget: { kbTokens: 0 }, maxIterations: 1, gate: { must: [] }, produces: ['../x'] },
  ] };
  const e = checkNodes(bad, ctx()).errors.join('\n');
  for (const m of ['RULE-NOPE', 'TEST-NOPE', 'N9-zz', 'chess', '循環', '../x']) assert.match(e, new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

// Phase C pilot steps → the nodes that replaced them: the union of their GateLane packs still covers the hand-written pages.
const pilot = JSON.parse(readFileSync(join(root, 'shared', 'tools', 'fixtures', 'context-pilot.json'), 'utf8')).steps;
const MAP = { kickoff: ['N0-kickoff', 'N1-derandomize'], adaptation: ['N2-spec'], spec: ['N2-spec'], difficulty: ['N5-tune'], feel: ['N7-feel'], art: ['N6-art'], tech: ['N8-budget', 'N4-sim'] };
test('every node builds a GateLane pack without errors, and the nodes cover the phase C pilot pages', () => {
  const pages = new Map();
  for (const n of nodes) {
    const { errors, pack } = buildContext(root, 'GateLane', n);
    assert.deepEqual(errors, [], n.id);
    pages.set(n.id, new Set(pack.cards.map(c => c.id.split('.')[0])));
  }
  for (const s of pilot) for (const p of s.expectPages) assert.ok(MAP[s.id].some(id => pages.get(id).has(p)), `${s.id}: ${p} 不在 ${MAP[s.id].join('/')}`);
});

test('cards scoped to another source / genre stay out of the pack', () => {
  assert.equal(fitsProfile({ source: ['af-x'] }, { source: ['original'] }), false);
  assert.equal(fitsProfile({ source: ['af-x'] }, { source: ['af-x'] }), true);
  assert.equal(fitsProfile({ genre: ['*'] }, { genre: ['rhythm'] }), true);
  assert.equal(fitsProfile({ topic: ['art'] }, { genre: ['rhythm'] }), true);
  const n1 = nodes.find(n => n.id === 'N1-derandomize'), n2 = nodes.find(n => n.id === 'N2-spec');
  assert.ok(!buildContext(root, 'TwinStrike', n1).pack.cards.some(c => c.id.startsWith('KB-af-')));
  assert.ok(buildContext(root, 'GateLane', n2).pack.cards.some(c => c.id.startsWith('KB-af-gate-lane-shooter')));
});

test('event files round-trip (front-matter is one JSON value per key)', () => {
  const ev = { schema: 1, eventId: '2026-11-10-N4-sim-1', parent: null, type: 'gate', node: 'N4-sim', result: 'pass', rules: [{ id: 'R', result: 'pass' }], route: { goto: ['N5-tune'], reason: '關卡通過' }, at: '2026-11-10T00:00:00.000Z' };
  assert.deepEqual(parseEvent(formatEvent(ev, '# body\n')), ev);
});

// deriveStatus is pure: events + current hashes.
const H = (i = 'i', o = 'o') => Object.fromEntries(nodes.map(n => [n.id, { inputHash: i, outputHash: o }]));
const gate = (node, result, { at = 1, ...extra } = {}) => ({ type: 'gate', node, result, inputHash: 'i', outputHash: 'o', needsApproval: false, eventId: `${node}-${at}`, at: `t${at}`, ...extra });
test('status: todo, pass, awaiting approval, approval binds to the output hash, stale, escalated, reopened, waived', () => {
  assert.equal(deriveStatus(nodes, [], H()).current, 'N0-kickoff');
  const pass0 = gate('N0-kickoff', 'pass', { needsApproval: true, at: 1 });
  assert.equal(deriveStatus(nodes, [pass0], H()).nodes['N0-kickoff'].status, 'awaiting-approval');
  const ok = { type: 'approval', node: 'N0-kickoff', inputHash: 'i', outputHash: 'o', approval: { by: 'pm' }, eventId: 'a', at: 't2' };
  const st = deriveStatus(nodes, [pass0, ok], H());
  assert.equal(st.nodes['N0-kickoff'].status, 'passed');
  assert.equal(st.current, 'N1-derandomize');
  assert.equal(deriveStatus(nodes, [pass0, ok], H('i', 'changed')).nodes['N0-kickoff'].status, 'stale');
  const fails = [1, 2, 3].map(at => gate('N1-derandomize', 'fail', { at: at + 2 }));
  assert.equal(deriveStatus(nodes, [pass0, ok, ...fails], H()).nodes['N1-derandomize'].status, 'escalated');
  assert.equal(deriveStatus(nodes, [pass0, ok, fails[0]], H()).nodes['N1-derandomize'].iteration, 1);
  const back = { type: 'rollback', node: 'N1-derandomize', rollback: 'N0-kickoff', inputHash: 'i', outputHash: 'o', eventId: 'r', at: 't9' };
  const re = deriveStatus(nodes, [pass0, ok, back], H());
  assert.equal(re.nodes['N0-kickoff'].status, 'reopened');
  assert.equal(re.current, 'N0-kickoff');
  const waive = { type: 'approval', node: 'N9-human', inputHash: 'i', outputHash: 'o', approval: { by: 'pm', waive: true }, eventId: 'w', at: 't9' };
  assert.equal(deriveStatus(nodes, [waive], H()).nodes['N9-human'].status, 'waived');
});

test('gate: a test that could not run (exit 2) blocks the gate without failing its rules or using up an attempt', async () => {
  const t = (id, impl) => ({ id, kind: 'script', cost: 'medium', implements: impl, run: id, cwd: '.', runnable: true, missing: [] });
  const pack = { rules: ['R-A', 'R-B', 'R-C'].map(id => ({ id, level: 'must', gate: true })), tests: [t('M1', ['R-A', 'R-B']), t('M2', ['R-C'])] };
  const node = { id: 'N10-release', produces: [], gate: { must: ['R-*'] }, checkpoint: null, maxIterations: 3 };
  const ran = [];
  const run = by => runGate(root, 'GateLane', node, { pack, registry: [], runner: x => { ran.push(x.id); return by(x); } });
  const refused = await run(x => (x.id === 'M1' ? { ok: false, blocked: true, detail: 'exit 2：換下一批' } : { ok: true, detail: '' }));
  assert.deepEqual(ran, ['M1', 'M2'], 'a test that could not run does not stop the ones after it');
  assert.deepEqual(Object.fromEntries(refused.rules.map(x => [x.id, x.result])), { 'R-A': 'not-run', 'R-B': 'not-run', 'R-C': 'pass' });
  assert.equal(refused.result, 'blocked');
  assert.deepEqual(routeFor([node], node, refused, 0), { goto: 'N10-release', reason: '有測試無法執行（缺檔或未跑），補齊後重跑' });
  // The same card failing its check (any other non-zero exit) is a failure of every rule it implements.
  const failed = await run(x => ({ ok: x.id !== 'M1', detail: 'exit 1' }));
  assert.deepEqual(Object.fromEntries(failed.rules.map(x => [x.id, x.result])), { 'R-A': 'fail', 'R-B': 'fail', 'R-C': 'not-run' });
  assert.equal(failed.result, 'fail');
});

test('the gate reads exit codes by the test-card convention; a process that never ran is not a failed check', () => {
  const at = (status, extra = {}) => classifyRun({ status, stdout: 'out', stderr: '', ...extra });
  assert.deepEqual(at(0), { ok: true, detail: '' });
  for (const s of [1, 3, 255]) assert.deepEqual([at(s).ok, at(s).blocked], [false, undefined], `exit ${s} is a failed check`);
  for (const s of [2, 127, 9009]) assert.deepEqual([at(s).ok, at(s).blocked], [false, true], `exit ${s} could not run`);
  assert.equal(at(null, { error: new Error('spawn EPERM') }).blocked, true);
  assert.match(at(null, { error: new Error('spawn EPERM') }).detail, /無法啟動[\s\S]*EPERM/);
  assert.match(at(null, { signal: 'SIGKILL' }).detail, /SIGKILL/);
  assert.equal(at(undefined).blocked, true);
  // The real process path: node exiting 2 and 1.
  const run = code => classifyRun(spawnSync(process.execPath, ['-e', `process.exit(${code})`], { encoding: 'utf8' }));
  assert.deepEqual([run(2).blocked, run(1).blocked, run(0).ok], [true, undefined, true]);
});

test('gate: cheap tests all run, medium stops at the first failure, review needs approval, missing needs block', async () => {
  const t = (id, cost, impl, kind = 'script', runnable = true) => ({ id, kind, cost, implements: impl, run: id, cwd: '.', runnable, missing: runnable ? [] : ['x'] });
  const pack = {
    rules: ['R-A', 'R-B', 'R-C', 'R-D', 'R-E'].map(id => ({ id, level: 'must', gate: true })),
    tests: [t('M2', 'medium', ['R-C']), t('C1', 'cheap', ['R-A']), t('C2', 'cheap', ['R-B']), t('M1', 'medium', ['R-B']), t('V', 'human', ['R-D'], 'review'), t('X', 'medium', ['R-E'], 'script', false)],
  };
  const ran = [];
  const runner = x => { ran.push(x.id); return { ok: !['C1', 'M1'].includes(x.id), detail: 'boom' }; };
  const node = { id: 'N5-tune', produces: [], gate: { must: ['R-*'] }, checkpoint: null };
  const g = await runGate(root, 'GateLane', node, { pack, runner, registry: [] });
  assert.deepEqual(ran, ['C1', 'C2', 'M1']);                 // M2 is not run after M1 failed
  assert.deepEqual(planGate(pack.tests).map(x => x.id).slice(0, 2), ['C1', 'C2']);
  const r = Object.fromEntries(g.rules.map(x => [x.id, x.result]));
  assert.deepEqual(r, { 'R-A': 'fail', 'R-B': 'fail', 'R-C': 'not-run', 'R-D': 'review', 'R-E': 'not-run' });
  assert.equal(g.result, 'fail');
  assert.equal(g.needsApproval, true);

  // A failing test for a should-only rule warns and does not stop the medium tests after it.
  const pack2 = { rules: [{ id: 'R-S', level: 'should', gate: true }, { id: 'R-M', level: 'must', gate: true }], tests: [t('A1', 'medium', ['R-S']), t('Z1', 'medium', ['R-M'])] };
  const ran2 = [];
  const g2 = await runGate(root, 'GateLane', node, { pack: pack2, runner: x => { ran2.push(x.id); return { ok: x.id !== 'A1', detail: '' }; }, registry: [] });
  assert.deepEqual(ran2, ['A1', 'Z1']);
  assert.deepEqual(Object.fromEntries(g2.rules.map(x => [x.id, x.result])), { 'R-S': 'warn', 'R-M': 'pass' });
  assert.equal(g2.result, 'pass');
});

test('route: most upstream onFail target, owner node for unrouted rules, escalation at maxIterations', () => {
  const n5 = nodes.find(n => n.id === 'N5-tune'), n10 = nodes.find(n => n.id === 'N10-release'), n8 = nodes.find(n => n.id === 'N8-budget');
  const fail = ids => ({ result: 'fail', missing: [], needsApproval: false, rules: ids.map(id => ({ id, result: 'fail' })) });
  assert.equal(routeFor(nodes, n5, fail(['RULE-SKILL-EVIDENCE']), 1).goto, 'N4-sim');
  assert.equal(routeFor(nodes, n5, fail(['RULE-SKILL-NOT-LUCK']), 1).goto, 'N2-spec');
  assert.equal(routeFor(nodes, n5, fail(['RULE-SKILL-EVIDENCE', 'RULE-SKILL-BEATS-SIMPLE']), 1).goto, 'N2-spec', 'the most upstream target wins');
  assert.equal(routeFor(nodes, n8, fail(['RULE-DRAWCALL-2D', 'RULE-BUNDLE-SIZE']), 1).goto, 'N6-art');
  assert.equal(routeFor(nodes, n10, fail(['RULE-ART-TW-TABOO', 'RULE-SPEC-FAIRNESS']), 1).goto, 'N2-spec');
  assert.equal(routeFor(nodes, n10, fail(['RULE-REPORT-FRESH']), 1).goto, 'N10-release');
  assert.equal(routeFor(nodes, n5, fail(['RULE-SKILL-NOT-LUCK']), 5).goto, 'human');
  assert.deepEqual(routeFor(nodes, n5, { result: 'pass', rules: [], missing: [] }, 0).goto, ['N9-human']);
});

test('bootstrap §0 must-read table is generated and current', () => {
  const r = applyMustRead(root, doc);
  assert.equal(r.error, undefined);
  assert.equal(r.changed, false, '跑 node shared/tools/index-build.mjs');
  for (const n of nodes) assert.ok(r.text.includes(`**${n.id}**`), n.id);
  assert.ok(!/af-gate-lane-shooter/.test(r.text.split('generated:loop-mustread')[1]), 'a generic (original) game does not get one adaptation\'s cards');
});

test('CLI gate --dry runs TEST-AUDIT to completion (no import-cycle deadlock under top-level await)', () => {
  const r = spawnSync(process.execPath, [join(root, 'shared', 'tools', 'loop.mjs'), 'gate', 'TwinStrike', '--node', 'N2-spec', '--dry'], { cwd: root, encoding: 'utf8', timeout: 60000 });
  assert.doesNotMatch(r.stderr, /unsettled top-level await/);
  assert.match(r.stdout, /TEST-AUDIT | cheap | ran/);
});

test('gate: a pending must rule blocks, a pending should rule does not; context errors block', FULL_REPO, async () => {
  const node = { id: 'N5-tune', produces: [], gate: { must: ['R-*'] }, checkpoint: null };
  const mk = level => ({ rules: [{ id: 'R-A', level: 'must', gate: true }], pending: [{ id: 'R-P', level, gate: true, missing: ['scriptedProgression'] }],
    tests: [{ id: 'T1', kind: 'script', cost: 'cheap', implements: ['R-A'], run: 'x', cwd: '.', runnable: true, missing: [] }] });
  const runner = () => ({ ok: true, detail: '' });
  const must = await runGate(root, 'GateLane', node, { pack: mk('must'), runner, registry: [] });
  assert.equal(must.result, 'blocked');
  assert.deepEqual(must.rules.map(r => [r.id, r.result]), [['R-A', 'pass'], ['R-P', 'pending']]);
  assert.match(routeFor(nodes, nodes.find(n => n.id === 'N5-tune'), must, 0).reason, /資料待補.*R-P/);
  const should = await runGate(root, 'GateLane', node, { pack: mk('should'), runner, registry: [] });
  assert.equal(should.result, 'pass');
  assert.equal(should.rules.find(r => r.id === 'R-P').result, 'pending');

  // Context errors (here: floor cards over the token budget) make the gate untrustworthy.
  const n2 = nodes.find(n => n.id === 'N2-spec'), stubs = { runner, auditor: () => [] };
  const ok = await runGate(root, 'TwinStrike', n2, stubs);
  assert.deepEqual([ok.result, ok.errors], ['pass', []]);
  const over = await runGate(root, 'TwinStrike', { ...n2, budget: { kbTokens: 1 } }, stubs);
  assert.equal(over.result, 'blocked');
  assert.match(over.errors.join('\n'), /超過預算/);
  assert.match(routeFor(nodes, n2, over, 0).reason, /取用器回報錯誤/);
});

// The same three cases through the real buildContext -> runGate path (no injected pack).
test('gate, real context: unanswered flag, malformed source and a misspelt scope key all block', FULL_REPO, async () => {
  const profileOf = g => JSON.parse(readFileSync(join(root, g, 'game.profile.json'), 'utf8'));
  const runner = () => ({ ok: true, detail: '' }), stubs = { runner, auditor: () => [] };
  const n5 = nodes.find(n => n.id === 'N5-tune'), n2 = nodes.find(n => n.id === 'N2-spec');

  const { scriptedProgression, ...unanswered } = profileOf('TwinStrike');
  assert.equal(scriptedProgression, true);
  const g1 = await runGate(root, 'TwinStrike', n5, { ...stubs, profile: unanswered });
  assert.equal(g1.result, 'blocked');
  const pend = g1.rules.filter(r => r.result === 'pending').map(r => r.id);
  assert.deepEqual(pend, ['RULE-CURVE-TREND', 'RULE-CURVE-LINEARITY', 'RULE-CURVE-PEAKS', 'RULE-CURVE-CLIFF', 'RULE-CURVE-FLOW', 'RULE-CURVE-BEATGRID', 'RULE-CURVE-PHRASE']);
  // A rhythm game that answers "no scripted progression" owes none of the curve rules, nor the playtest card that measures them.
  const g0 = await runGate(root, 'TwinStrike', { ...n5, produces: [], producesWhen: {} }, { ...stubs, profile: { ...unanswered, scriptedProgression: false } });
  assert.ok(!g0.rules.some(r => r.id.startsWith('RULE-CURVE-')), 'no curve rule in the gate');
  assert.ok(!g0.tests.some(t => t.id === 'TEST-CURVE'), 'TEST-CURVE is not asked for');
  // What still blocks it is the skill evidence TwinStrike does not have (no strategy file, no ledger): not the curve.
  assert.deepEqual([g0.result, g0.rules.filter(r => r.result === 'not-run').map(r => r.id)], ['blocked', ['RULE-SKILL-EVIDENCE', 'RULE-SKILL-NOT-LUCK', 'RULE-SKILL-BEATS-SIMPLE']]);
  const route = routeFor(nodes, n5, g1, 0);
  assert.equal(route.goto, 'N5-tune');
  assert.match(route.reason, /資料待補.*RULE-CURVE-TREND/);

  // RULE-AF-ADAPTATION (must, gate of N2) needs the profile's source: a malformed one is pending, not a crash.
  const g2 = await runGate(root, 'GateLane', { ...n2, produces: [] }, { ...stubs, profile: { ...profileOf('GateLane'), source: [null] } });
  assert.equal(g2.result, 'blocked');
  assert.equal(g2.rules.find(r => r.id === 'RULE-AF-ADAPTATION').result, 'pending');

  const base = loadRules({ from: root });
  const resolver = { ...base, rules: base.rules.map(r => (r.id === 'RULE-CURVE-TREND' ? { ...r, scope: { selector: { kind: 'game-build', difficulty: 'scripted' } } } : r)) };
  const g3 = await runGate(root, 'TwinStrike', n5, { ...stubs, resolver });
  assert.equal(g3.result, 'blocked');
  assert.match(routeFor(nodes, n5, g3, 0).reason, /取用器回報錯誤.*difficulty/);
});

test('gate: an audit card that cannot run (missing files) leaves its rules not-run and the gate blocked, without crashing', async () => {
  const pack = { rules: [{ id: 'R-A', level: 'must', gate: true }], pending: [],
    tests: [{ id: 'T-AUDIT', kind: 'audit', cost: 'cheap', implements: ['R-A'], run: null, cwd: '.', runnable: false, missing: ['game/src/sim/sim.js'] }] };
  const g = await runGate(root, 'GateLane', { id: 'N2-spec', produces: [], gate: { must: ['R-A'] }, checkpoint: null }, { pack, auditor: () => { throw new Error('must not be called'); }, registry: [] });
  assert.deepEqual(g.rules.map(r => [r.id, r.result]), [['R-A', 'not-run']]);
  assert.equal(g.result, 'blocked');
});

// Step 2 (generality backlog): the difficulty document and the playtest report are N5 outputs only for games with scripted progression.
test('producesWhen: a group is dropped only when the profile flag is false; unanswered keeps it', () => {
  const n5 = nodes.find(n => n.id === 'N5-tune');
  const own = ['docs/skill_evidence_report.md', 'docs/skill_evidence_ledger.json'], all = [...own, 'docs/playtest_report.md', 'gdd/07_difficulty_curve.md'];
  assert.deepEqual(nodeProduces(n5, { scriptedProgression: true }), all);
  assert.deepEqual(nodeProduces(n5, {}), all);
  assert.deepEqual(nodeProduces(n5, { scriptedProgression: false }), own);
  // Scripted games hash the plain list in that order.
  assert.equal(nodeHashes(root, 'TwinStrike', nodes, n5).outputHash, hashPaths(join(root, 'TwinStrike'), all));
  assert.notEqual(nodeHashes(root, 'TwinStrike', nodes, n5, { scriptedProgression: false }).outputHash, hashPaths(join(root, 'TwinStrike'), all));
  assert.match(mustReadTable(root, doc), /`docs\/playtest_report\.md`（`scriptedProgression` 時）/);

  const bad = { schemaVersion: 1, nodes: [{ id: 'N0-a', name: 'a', after: [], budget: { kbTokens: 0 }, maxIterations: 1, gate: { must: [] }, producesWhen: { hasLevels: ['x.md'], scriptedProgression: ['../y.md'] } }] };
  const e = checkNodes(bad, ctx()).errors.join('\n');
  assert.match(e, /producesWhen 的「hasLevels」不是 profile 旗標/);
  assert.match(e, /\.\.\/y\.md/);
});

test('gate: a game without scripted progression is not blocked by the missing curve outputs', FULL_REPO, async () => {
  const profileOf = g => JSON.parse(readFileSync(join(root, g, 'game.profile.json'), 'utf8'));
  const stubs = { runner: () => ({ ok: true, detail: '' }), auditor: () => [] };
  const n5 = { ...nodes.find(n => n.id === 'N5-tune'), produces: ['docs/skill_dominance_report.md'], producesWhen: { scriptedProgression: ['docs/not-written.md'] } };
  const scripted = await runGate(root, 'TwinStrike', n5, stubs);
  assert.deepEqual([scripted.result, scripted.missing], ['blocked', ['docs/not-written.md']]);
  const free = await runGate(root, 'TwinStrike', n5, { ...stubs, profile: { ...profileOf('TwinStrike'), scriptedProgression: false } });
  assert.deepEqual(free.missing, []);
  assert.deepEqual([free.result, free.rules.filter(r => r.result === 'not-run').map(r => r.id)], ['blocked', ['RULE-SKILL-EVIDENCE', 'RULE-SKILL-NOT-LUCK', 'RULE-SKILL-BEATS-SIMPLE']], 'only the skill evidence TwinStrike lacks still blocks');
  assert.ok(!free.rules.some(r => ['RULE-CURVE-TREND', 'RULE-CURVE-CLIFF'].includes(r.id)), 'the curve rules are not part of this gate');
});

test('flipping scriptedProgression makes N5 and everything downstream stale, in both directions', () => {
  const n5 = nodes.find(n => n.id === 'N5-tune'), down = nodes.filter(n => n.after.includes('N5-tune')).map(n => n.id);
  assert.ok(down.length > 0);
  const hashesFor = profile => Object.fromEntries(nodes.map(n => [n.id, nodeHashes(root, 'TwinStrike', nodes, n, profile)]));
  const passedUnder = profile => { const h = hashesFor(profile); return [n5.id, ...down].map((id, i) => ({ eventId: `e${i}`, type: 'gate', node: id, result: 'pass', needsApproval: false, at: `2026-01-0${i + 1}`, ...h[id] })); };
  for (const [from, to] of [[true, false], [false, true]]) {
    const events = passedUnder({ scriptedProgression: from });
    const same = deriveStatus(nodes, events, hashesFor({ scriptedProgression: from })), flipped = deriveStatus(nodes, events, hashesFor({ scriptedProgression: to }));
    for (const id of [n5.id, ...down]) {
      assert.equal(same.nodes[id].status, 'passed', `${id} ${from}`);
      assert.equal(flipped.nodes[id].status, 'stale', `${id} ${from} -> ${to}`);
    }
  }
});

test('gate: an injected profile reaches the audit too, so context, produces and audit judge the same game', FULL_REPO, async () => {
  const seen = [];
  const auditor = (r, g, o) => { seen.push(o?.profile?.scriptedProgression); return []; };
  const n2 = nodes.find(n => n.id === 'N2-spec'), profile = { ...JSON.parse(readFileSync(join(root, 'TwinStrike', 'game.profile.json'), 'utf8')), scriptedProgression: false };
  await runGate(root, 'TwinStrike', n2, { runner: () => ({ ok: true, detail: '' }), auditor, profile });
  assert.deepEqual(seen, [false]);
});
