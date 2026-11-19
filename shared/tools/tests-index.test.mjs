// Tests for tests-index.mjs: the test registry validates and covers every rule without rewriting rules.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadVocabulary } from './kb-index.mjs';
import { buildTests, checkRegistry } from './tests-index.mjs';
import { findRoot } from './rules.mjs';

const root = findRoot(fileURLToPath(import.meta.url));
const vocab = loadVocabulary(root);
const rule = (id, level, type) => ({ id, level, enforcement: type === 'review' ? { type, checklist: `${id} 檢核` } : { type, ref: 'x' } });
const card = o => ({ id: 'TEST-A', kind: 'script', implements: ['RULE-S'], run: 'npm test', cwd: '<Game>/game', source: null, needs: [], cost: 'cheap', fresh: null, ...o });
const check = (tests, rules = [rule('RULE-S', 'must', 'script')]) => checkRegistry({ schemaVersion: 1, tests }, rules, vocab, p => p === 'exists.mjs');

test('a script rule is covered by a non-review card', () => {
  const r = check([card({ source: 'exists.mjs', facets: { topic: ['fairness'] } })]);
  assert.deepEqual(r.errors, []); assert.deepEqual(r.coverage[0], { rule: 'RULE-S', level: 'must', enforcement: 'script', tests: ['TEST-A'], covered: true });
});

test('an uncovered must rule is an error; an uncovered should rule is a warning', () => {
  const r = check([], [rule('RULE-M', 'must', 'script'), rule('RULE-W', 'should', 'review')]);
  assert.match(r.errors.join(), /RULE-M/); assert.match(r.warnings.join(), /RULE-W/);
});

test('a review rule needs a review card, and the card carries the rule checklist instead of a run command', () => {
  const rules = [rule('RULE-R', 'must', 'review')];
  assert.match(check([card({ implements: ['RULE-R'] })], rules).errors.join(), /沒有 review 測試卡/);
  const ok = check([card({ kind: 'review', implements: ['RULE-R'], run: undefined, cost: 'human' })], rules);
  assert.deepEqual(ok.errors, []);
  assert.deepEqual(ok.tests[0].checklists, [{ rule: 'RULE-R', checklist: 'RULE-R 檢核' }]);
  assert.match(check([card({ kind: 'review', implements: ['RULE-R'], cost: 'human' })], rules).errors.join(), /review 卡不寫 run/);
});

test('cards are validated: unknown rule, kind, cost, facet, source, duplicate id, human cost only for people', () => {
  const e = check([
    card({ implements: ['RULE-S', 'RULE-NOPE'] }),
    card({ kind: 'magic', cost: 'free' }),
    card({ id: 'TEST-B', facets: { topic: ['nope'] }, source: 'missing.mjs' }),
    card({ id: 'TEST-C', cost: 'human' }),
    card({ id: 'bad' }),
  ]).errors.join('\n');
  for (const m of ['RULE-NOPE 不存在', 'kind「magic」', 'cost「free」', 'topic「nope」', '找不到 source missing.mjs', 'id 重複', 'cost 必須是 human', 'TEST-[A-Z0-9-]+'])
    assert.ok(e.includes(m), m);
});

test('the repository registry covers every rule and tests.json is up to date', () => {
  const { errors, data } = buildTests(root);
  assert.deepEqual(errors, []);
  assert.equal(data.counts.covered, data.counts.rules);
  const built = JSON.parse(readFileSync(join(root, 'knowledge-base', 'index', 'tests.json'), 'utf8'));
  assert.deepEqual(built.coverage, data.coverage);
  assert.deepEqual(built.tests, data.tests);
});

test('rules.json is never rewritten by the build', () => {
  const before = readFileSync(join(root, 'knowledge-base', 'index', 'rules.json'), 'utf8');
  buildTests(root);
  assert.equal(readFileSync(join(root, 'knowledge-base', 'index', 'rules.json'), 'utf8'), before);
});
