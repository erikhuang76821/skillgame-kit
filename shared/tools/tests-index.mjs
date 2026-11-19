// tests-index — the test library registry and its rule coverage (knowledge-base/decisions/2026-11-10-libraries-and-loop.md
// §3.3, §8). Source: shared/tests/registry.json (hand-edited). rules.json keeps its enforcement field as the authority;
// this module only checks that the two agree and never writes back to rules.json:
//   - a must rule enforced by script needs a non-review test card implementing it, one enforced by review needs a
//     review card (missing = error; for should rules = warning)
//   - every card's implements[] names existing rules, its facets come from shared/index/facets.json, its source exists
// Called by index-build.mjs, which writes knowledge-base/index/tests.json.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FACET_KEYS, loadVocabulary } from './kb-index.mjs';

export const REGISTRY = join('shared', 'tests', 'registry.json');
export const TEST_KINDS = ['unit', 'script', 'sim-playtest', 'human-playtest', 'review', 'audit'];
export const COSTS = ['cheap', 'medium', 'heavy', 'human'];
export const FRESH = [null, 'GAME.version', 'contentHash'];
const FIELDS = new Set(['id', 'kind', 'implements', 'facets', 'run', 'cwd', 'source', 'needs', 'produces', 'cost', 'fresh', 'note']);
const HUMAN_KINDS = new Set(['review', 'human-playtest']);

/**
 * Validate cards against rules and vocabulary. Pure apart from `exists(path)`.
 * @param registry { schemaVersion, tests: [...] }
 * @param rules    rules.json `rules` array
 * @returns { errors, warnings, tests, coverage }
 */
export function checkRegistry(registry, rules, vocab, exists) {
  const errors = [], warnings = [], ids = new Set(), byId = new Map(rules.map(r => [r.id, r]));
  if (registry.schemaVersion !== 1) errors.push(`${REGISTRY}: schemaVersion 必須是 1`);
  for (const t of registry.tests) {
    const at = `${REGISTRY} ${t.id}`;
    if (!/^TEST-[A-Z0-9-]+$/.test(t.id ?? '')) errors.push(`${at}: id 要符合 TEST-[A-Z0-9-]+`);
    if (ids.has(t.id)) errors.push(`${at}: id 重複`); else ids.add(t.id);
    for (const k of Object.keys(t)) if (!FIELDS.has(k)) errors.push(`${at}: 不認得的欄位 ${k}`);
    if (!TEST_KINDS.includes(t.kind)) errors.push(`${at}: kind「${t.kind}」不在 ${TEST_KINDS.join(' / ')}`);
    if (!COSTS.includes(t.cost)) errors.push(`${at}: cost「${t.cost}」不在 ${COSTS.join(' / ')}`);
    if (!FRESH.includes(t.fresh ?? null)) errors.push(`${at}: fresh 只能是 null / GAME.version / contentHash`);
    if (HUMAN_KINDS.has(t.kind) !== (t.cost === 'human')) errors.push(`${at}: review / human-playtest 的 cost 必須是 human，其他不可以`);
    if (t.kind === 'review' ? t.run : !t.run) errors.push(`${at}: ${t.kind === 'review' ? 'review 卡不寫 run（檢核內容取自規則的 checklist）' : '缺 run'}`);
    if (!(t.cwd === '.' || t.cwd?.startsWith('<Game>'))) errors.push(`${at}: cwd 要是 "." 或以 <Game> 開頭`);
    if (!Array.isArray(t.implements)) errors.push(`${at}: implements 要是陣列`);
    if (!Array.isArray(t.needs)) errors.push(`${at}: needs 要是陣列`);
    for (const r of t.implements ?? []) if (!byId.has(r)) errors.push(`${at}: 規則 ${r} 不存在`);
    if (t.source && !exists(t.source)) errors.push(`${at}: 找不到 source ${t.source}`);
    for (const [k, vals] of Object.entries(t.facets ?? {})) {
      if (!FACET_KEYS.includes(k)) { errors.push(`${at}: 不認得的 facet ${k}`); continue; }
      for (const v of vals) if (v !== '*' && !vocab.facets[k].has(v)) errors.push(`${at}: ${k}「${v}」不在 shared/index/facets.json`);
    }
  }

  const coverage = rules.map(r => {
    const review = r.enforcement.type === 'review';
    const cards = registry.tests.filter(t => (t.implements ?? []).includes(r.id));
    const matching = cards.filter(t => (t.kind === 'review') === review).map(t => t.id);
    if (!matching.length) {
      const msg = `${r.id}（${r.level}，enforcement=${r.enforcement.type}）沒有 ${review ? 'review' : '非 review'} 測試卡`;
      (r.level === 'must' ? errors : warnings).push(msg);
    }
    return { rule: r.id, level: r.level, enforcement: r.enforcement.type, tests: cards.map(t => t.id), covered: matching.length > 0 };
  });

  const tests = registry.tests.map(t => ({
    ...t,
    ...(t.kind === 'review' ? { checklists: (t.implements ?? []).filter(id => byId.has(id)).map(id => ({ rule: id, checklist: byId.get(id).enforcement.checklist ?? null })) } : {}),
  }));
  return { errors, warnings, tests, coverage };
}

/** Load registry + rules from the repo; returns { errors, warnings, data } where data is the tests.json payload. */
export function buildTests(root) {
  if (!existsSync(join(root, REGISTRY))) return { errors: [`缺 ${REGISTRY}`], warnings: [], data: null };
  const registry = JSON.parse(readFileSync(join(root, REGISTRY), 'utf8'));
  const rules = JSON.parse(readFileSync(join(root, 'knowledge-base', 'index', 'rules.json'), 'utf8')).rules;
  const r = checkRegistry(registry, rules, loadVocabulary(root), p => existsSync(join(root, p)));
  const tally = vals => Object.fromEntries([...vals.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map())].sort());
  const counts = {
    tests: r.tests.length, byKind: tally(r.tests.map(t => t.kind)), byCost: tally(r.tests.map(t => t.cost)),
    rules: rules.length, covered: r.coverage.filter(c => c.covered).length,
  };
  return { errors: r.errors, warnings: r.warnings, data: { counts, tests: r.tests, coverage: r.coverage } };
}
