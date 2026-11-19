import { existsSync } from 'node:fs';
// Tests for context.mjs (the dynamic index) and the GateLane pilot of decision 2026-11-10 §6 phase C.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContext, checkRuleScopes, facetMatch, loadProfile, renderPack, resolveValues, ruleApplies, ruleScope } from './context.mjs';
import { loadVocabulary } from './kb-index.mjs';
import { loadNodes } from './loop.mjs';
import { findRoot, loadRules } from './rules.mjs';
// skillgame-kit 只收錄遊戲的文字規格；需要完整遊戲程式（TwinStrike/game 等）的整合測試在此略過。
const FULL_REPO = { skip: !existsSync(new URL('../../TwinStrike/game/package.json', import.meta.url)) && '需要完整遊戲範例（本精簡版未收錄遊戲程式）' };

const root = findRoot(fileURLToPath(import.meta.url));
const pilot = JSON.parse(readFileSync(join(root, 'shared', 'tools', 'fixtures', 'context-pilot.json'), 'utf8')).steps;

test('facet match: exact, explicit "*", unknown ranks lower, unknown jurisdiction never matches, all-unknown does not match', () => {
  assert.deepEqual(facetMatch({ topic: ['art'], genre: ['rhythm'] }, { topic: ['art'], genre: ['rhythm'] }), { ok: true, exact: 2, unknown: 0 });
  assert.deepEqual(facetMatch({ topic: ['art'], genre: ['*'] }, { topic: ['art'], genre: ['rhythm'] }), { ok: true, exact: 1, unknown: 0 });
  assert.deepEqual(facetMatch({ topic: ['art'] }, { topic: ['art'], genre: ['rhythm'] }), { ok: true, exact: 1, unknown: 1 });
  assert.equal(facetMatch({ topic: ['art'], genre: ['physics'] }, { genre: ['rhythm'] }).ok, false);
  assert.equal(facetMatch({ topic: ['legal'] }, { topic: ['legal'], jurisdiction: ['TW'] }).ok, false);
  assert.equal(facetMatch({ topic: ['legal'], jurisdiction: ['*'] }, { jurisdiction: ['TW'] }).ok, true);
  assert.equal(facetMatch({ topic: ['art'] }, { source: ['af-x'] }).ok, false);
  assert.equal(facetMatch({}, { kind: ['method'] }).ok, true);
});

test('$profile values resolve; rule scope selectors exclude what does not apply to the game', () => {
  assert.deepEqual(resolveValues({ genre: '$profile.genre', topic: ['art'] }, { genre: ['rhythm'] }), { genre: ['rhythm'], topic: ['art'] });
  const prof = { genre: ['lane-shooter'], renderer: ['2d'], source: ['af-gate-lane-shooter'] };
  assert.equal(ruleApplies({ scope: { selector: { genre: 'rhythm' } } }, prof), false);
  assert.equal(ruleApplies({ scope: { selector: { renderer: '3d' } } }, prof), false);
  assert.equal(ruleApplies({ scope: { selector: { source: 'ad-funnel' } } }, prof), true);
  assert.equal(ruleApplies({ scope: { selector: { source: 'ad-funnel' } } }, { source: ['original'] }), false);
});

test('every game profile validates against the facet vocabulary', () => {
  for (const g of ['GateLane', 'TwinStrike', 'SwarmDuel']) assert.deepEqual(loadProfile(root, g).errors, [], g);
});

for (const step of pilot) {
  test(`GateLane pilot «${step.name}»: the final pack covers the hand-written must-read pages`, () => {
    const { errors, pack } = buildContext(root, 'GateLane', step);
    assert.deepEqual(errors, []);
    const pages = new Set(pack.cards.map(c => c.id.split('.')[0]));
    for (const p of step.expectPages) assert.ok(pages.has(p), `${p} 不在脈絡包`);
    assert.ok(pack.budget.used <= pack.budget.kbTokens);
    assert.ok(pack.cards.every(c => c.text.length > 0), 'every card carries its text');
    const gate = pack.rules.filter(r => r.gate).map(r => r.id);
    const floor = pack.cards.filter(c => c.why === 'floor');
    assert.ok(floor.length > 0 || gate.length === 0 || !step.gate, 'gate rules bring their cards in as floor');
    assert.match(renderPack(pack), /^# Context pack — GateLane/);
  });
}

test('rhythm-only rules are not applicable to GateLane but are to TwinStrike', () => {
  const step = pilot.find(s => s.id === 'difficulty');
  const gl = buildContext(root, 'GateLane', step).pack, ts = buildContext(root, 'TwinStrike', step).pack;
  assert.ok(gl.notApplicable.includes('RULE-CURVE-BEATGRID'));
  assert.ok(ts.rules.some(r => r.id === 'RULE-CURVE-BEATGRID'));
});

test('a floor larger than the budget is an error, never a truncation', () => {
  const step = { ...pilot.find(s => s.id === 'difficulty'), budget: { kbTokens: 10 } };
  const { errors, pack } = buildContext(root, 'GateLane', step);
  assert.match(errors.join(), /保底卡片共 \d+ tokens，超過預算 10/);
  assert.ok(pack.cards.every(c => c.why === 'floor'));
});

test('tests are listed cheapest first and say whether this game can run them', FULL_REPO, () => {
  const { pack } = buildContext(root, 'TwinStrike', pilot.find(s => s.id === 'tech'));   // a game whose files are in git (GateLane/ is not yet)
  const order = ['cheap', 'medium', 'heavy', 'human'];
  assert.deepEqual(pack.tests.map(t => order.indexOf(t.cost)), [...pack.tests.map(t => order.indexOf(t.cost))].sort((a, b) => a - b));
  assert.ok(pack.tests.find(t => t.id === 'TEST-SIZE').runnable);
});

// ---------- rule applicability (decision 2026-11-11-generality-backlog, step 1) ----------
const fixture = name => JSON.parse(readFileSync(join(root, 'shared', 'tools', 'fixtures', name), 'utf8'));
const synthetic = fixture('synthetic-profiles.json').profiles;
const rule = selector => ({ scope: { selector } });
const CURVE = ['RULE-CURVE-TREND', 'RULE-CURVE-LINEARITY', 'RULE-CURVE-PEAKS', 'RULE-CURVE-CLIFF', 'RULE-CURVE-FLOW'];

test('rule scope is three-state: applies, not applicable, or pending when the profile does not answer', () => {
  const prof = { genre: ['physics'], renderer: ['2d'], source: ['original'], scriptedProgression: false };
  assert.deepEqual(ruleScope(rule({ kind: 'game-build' }), {}), { state: 'applies', missing: [] });
  assert.deepEqual(ruleScope(rule({ scriptedProgression: true }), prof), { state: 'not-applicable', missing: [] });
  assert.deepEqual(ruleScope(rule({ scriptedProgression: true }), { ...prof, scriptedProgression: true }), { state: 'applies', missing: [] });
  assert.deepEqual(ruleScope(rule({ scriptedProgression: true }), { genre: ['physics'] }), { state: 'pending', missing: ['scriptedProgression'] });
  // A missing renderer no longer makes both the 2d and the 3d rule apply.
  assert.deepEqual(ruleScope(rule({ renderer: '2d' }), { genre: ['physics'] }), { state: 'pending', missing: ['renderer'] });
  assert.deepEqual(ruleScope(rule({ source: 'ad-funnel' }), {}), { state: 'pending', missing: ['source'] });
  // One key clearly does not fit, another is missing: not applicable (an unrelated blank must not block the gate).
  assert.deepEqual(ruleScope(rule({ genre: 'rhythm', scriptedProgression: true }), { genre: ['physics'] }), { state: 'not-applicable', missing: [] });
  assert.deepEqual(ruleScope(rule({ genre: 'physics', renderer: '2d', scriptedProgression: true }), { genre: ['physics'] }), { state: 'pending', missing: ['renderer', 'scriptedProgression'] });
  // The generic "*" profile (bootstrap table) fits every scope.
  assert.equal(ruleScope(rule({ genre: 'rhythm', renderer: '3d', source: 'ad-funnel', scriptedProgression: true }), { genre: ['*'], renderer: ['*'], source: ['*'], scriptedProgression: '*' }).state, 'applies');
  assert.equal(ruleApplies(rule({ renderer: '2d' }), {}), false);
});

test('rule scopes may only use keys the tools check (the unchecked "difficulty" key made five rules apply to every game)', () => {
  const vocab = loadVocabulary(root);
  assert.deepEqual(checkRuleScopes(JSON.parse(readFileSync(join(root, 'knowledge-base', 'index', 'rules.json'), 'utf8')).rules, vocab), []);
  const bad = [
    { id: 'R-1', scope: { selector: { kind: 'game-build', difficulty: 'scripted' } } },
    { id: 'R-2', scope: { selector: { scriptedProgression: 'yes' } } },
    { id: 'R-3', scope: { selector: { genre: 'chess' } } },
    { id: 'R-4', scope: { selector: { kind: 'game-source', path: 'game/src/sim/', renderer: '2d', source: 'ad-funnel' } } },
  ];
  const e = checkRuleScopes(bad, vocab).join('\n');
  assert.match(e, /R-1: scope\.selector\.difficulty 不是認得的/);
  assert.match(e, /R-2: scope\.selector\.scriptedProgression 必須是 true 或 false/);
  assert.match(e, /R-3: scope\.selector\.genre「chess」/);
  assert.doesNotMatch(e, /R-4/);
});

test('a profile flag must be a boolean', () => {
  const dir = mkdtempSync(join(tmpdir(), 'profile-'));
  mkdirSync(join(dir, 'X'));
  writeFileSync(join(dir, 'X', 'game.profile.json'), JSON.stringify({ schemaVersion: 1, game: 'X', scriptedProgression: 'scripted' }));
  assert.match(loadProfile(dir, 'X', loadVocabulary(root)).errors.join('\n'), /scriptedProgression 必須是 true 或 false/);
});

test('games without scripted progression do not get the difficulty-curve rules or their test', () => {
  const nodes = loadNodes(root).nodes, pick = id => nodes.find(n => n.id === id);
  for (const name of ['solitaire', 'word', 'pool']) for (const id of ['N5-tune', 'N10-release']) {
    const { errors, pack } = buildContext(root, synthetic[name].game, pick(id), { profile: synthetic[name] });
    assert.deepEqual(errors, [], `${name} ${id}`);
    assert.ok(!pack.rules.some(r => r.id.startsWith('RULE-CURVE-')), `${name} ${id}: curve rules must not apply`);
    for (const c of CURVE) assert.ok(pack.notApplicable.includes(c), `${name} ${id}: ${c} listed as not applicable`);
    assert.deepEqual(pack.pending, []);
    assert.ok(!pack.tests.some(t => t.id === 'TEST-CURVE'), `${name} ${id}: TEST-CURVE is not asked for`);
    // Skill evidence does not depend on this flag: every new game owes it; the legacy measures are for the three named games only.
    for (const id of ['RULE-SKILL-EVIDENCE', 'RULE-SKILL-NOT-LUCK', 'RULE-SKILL-BEATS-SIMPLE']) assert.ok(pack.rules.some(r => r.id === id), `${name} ${id}: ${id} applies`);
    for (const id of ['RULE-SKILL-DOMINANCE', 'RULE-SKILL-BASELINE']) assert.ok(pack.notApplicable.includes(id), `${name} ${id}: ${id} is not for new games`);
    if (id === 'N5-tune') assert.deepEqual(pack.tests.filter(t => t.id.startsWith('TEST-SKILL-')).map(t => t.id).sort(), ['TEST-SKILL-BEATS-SIMPLE', 'TEST-SKILL-EVIDENCE', 'TEST-SKILL-NOT-LUCK']);
  }
});

test('a rule scoped to named games applies to those games only, and the scope is validated', () => {
  const rule = { id: 'R', scope: { selector: { kind: 'game-build', game: ['TwinStrike'] } } };
  assert.equal(ruleScope(rule, { game: 'TwinStrike' }).state, 'applies');
  assert.equal(ruleScope(rule, { game: 'NewGame' }).state, 'not-applicable');
  assert.equal(ruleScope(rule, { genre: ['*'], renderer: ['*'] }).state, 'not-applicable', 'the generic bootstrap profile is not a named game');
  assert.equal(ruleScope({ id: 'R', scope: { selector: { game: ['NewGame'], scriptedProgression: true } } }, { game: 'NewGame' }).state, 'pending', 'other keys still ask the profile');
  const vocab = loadVocabulary(root);
  for (const bad of ['TwinStrike', [], ['*'], [''], [3]]) assert.match(checkRuleScopes([{ id: 'R', scope: { selector: { game: bad } } }], vocab).join('\n'), /遊戲資料夾名稱的清單/, JSON.stringify(bad));
  assert.deepEqual(checkRuleScopes([rule], vocab), []);
});

test('a profile that does not answer scriptedProgression leaves the curve rules pending, never silently applied or dropped', () => {
  const n5 = loadNodes(root).nodes.find(n => n.id === 'N5-tune');
  const { warnings, pack } = buildContext(root, 'Synthetic-unanswered', n5, { profile: synthetic.unanswered });
  assert.deepEqual(pack.pending.map(p => p.id), CURVE);
  for (const p of pack.pending) assert.deepEqual([p.level, p.gate, p.missing], ['must', true, ['scriptedProgression']]);
  for (const c of CURVE) assert.ok(!pack.rules.some(r => r.id === c) && !pack.notApplicable.includes(c), c);
  // The rhythm-only curve rules clearly do not fit a physics game: not applicable, not pending.
  assert.ok(pack.notApplicable.includes('RULE-CURVE-BEATGRID') && pack.notApplicable.includes('RULE-CURVE-PHRASE'));
  assert.match(warnings.join('\n'), /資料待補/);
  assert.match(renderPack(pack, [], warnings), /資料待補[\s\S]*RULE-CURVE-TREND[\s\S]*缺 scriptedProgression/);
});

test('the three existing games select exactly the rules and tests they did before (snapshot)', () => {
  const snap = fixture('applicability-snapshot.json'), nodes = loadNodes(root).nodes;
  for (const g of Object.keys(snap)) for (const n of nodes) {
    const { pack } = buildContext(root, g, n);
    assert.deepEqual({ rules: pack.rules.map(r => r.id + (r.gate ? '*' : '')), notApplicable: pack.notApplicable, tests: pack.tests.map(x => x.id) }, snap[g][n.id], `${g} ${n.id}`);
    assert.deepEqual(pack.pending, [], `${g} ${n.id}`);
  }
});

test('a malformed profile value is reported and counts as unanswered; it never throws', () => {
  assert.deepEqual(ruleScope(rule({ source: 'ad-funnel' }), { source: [null] }), { state: 'pending', missing: ['source'] });
  assert.deepEqual(ruleScope(rule({ genre: 'rhythm' }), { genre: [42] }), { state: 'pending', missing: ['genre'] });
  const dir = mkdtempSync(join(tmpdir(), 'profile-'));
  mkdirSync(join(dir, 'X'));
  writeFileSync(join(dir, 'X', 'game.profile.json'), JSON.stringify({ schemaVersion: 1, game: 'X', source: [null] }));
  assert.match(loadProfile(dir, 'X', loadVocabulary(root)).errors.join('\n'), /source「null」不在/);
});

test('a rule scope with an unchecked key is an error in the context pack itself, not only at index build', () => {
  const base = loadRules({ from: root }), n5 = loadNodes(root).nodes.find(n => n.id === 'N5-tune');
  const resolver = { ...base, rules: base.rules.map(r => (r.id === 'RULE-CURVE-TREND' ? { ...r, scope: { selector: { kind: 'game-build', difficulty: 'scripted' } } } : r)) };
  const { errors } = buildContext(root, 'TwinStrike', n5, { resolver });
  assert.match(errors.join('\n'), /RULE-CURVE-TREND: scope\.selector\.difficulty 不是認得的/);
  assert.deepEqual(buildContext(root, 'TwinStrike', n5).errors, []);
});
