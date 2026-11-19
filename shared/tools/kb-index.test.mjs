// Tests for kb-index.mjs: knowledge cards parse, validate and stay in sync (RULE-KB-CARDS, RULE-KB-CARD-SIZE).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKb, loadVocabulary, parseMarker, parsePage, tokens } from './kb-index.mjs';
import { findRoot } from './rules.mjs';

const root = findRoot(fileURLToPath(import.meta.url));
const ctx = {
  vocab: loadVocabulary(root), ruleIds: new Set(['RULE-X']), pageFields: ['id', 'kind', 'topic', 'reviewedAt'],
  pageIdRe: /^KB-[a-z0-9-]+$/, maxTokens: 50,
};
const page = (body, fm = 'id: KB-t\nkind: method\ntopic: [fairness]\ngenre: ["*"]\nreviewedAt: 2026-11-10') => `---\n${fm}\n---\n# T\nintro\n${body}`;
const parse = body => parsePage(page(body), 't.md', ctx);

test('a page without front-matter is not indexed and not an error', () => {
  const r = parsePage('# T\n## A\ntext', 't.md', ctx);
  assert.equal(r.page, null); assert.deepEqual(r.errors, []);
});

test('H2 cards inherit page facets, markers override them, "*" is a valid explicit wildcard', () => {
  const r = parse('## A\n<!-- card: KB-t.a -->\naaa\n## B\n\n<!-- card: KB-t.b; topic=tech,budget; kind=lesson; rules=RULE-X -->\nbbb');
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.cards.map(c => c.id), ['KB-t.a', 'KB-t.b']);
  assert.deepEqual(r.cards[0].facets, { topic: ['fairness'], genre: ['*'] });
  assert.deepEqual(r.cards[1].facets.topic, ['tech', 'budget']);
  assert.equal(r.cards[1].kind, 'lesson'); assert.deepEqual(r.cards[1].rules, ['RULE-X']);
  assert.equal(r.page.cards, 2);
});

test('every H2 needs a marker; skip needs a reason; card ids carry the page prefix', () => {
  assert.match(parse('## A\ntext').errors.join(), /沒有 <!-- card/);
  assert.match(parse('## A\n<!-- card: skip -->').errors.join(), /reason/);
  assert.deepEqual(parse('## A\n<!-- card: skip; reason=資產資料 -->\nx').errors, []);
  assert.match(parse('## A\n<!-- card: KB-other.a -->').errors.join(), /要以「KB-t\.」開頭/);
  assert.match(parse('## A\n<!-- card: KB-t.Bad_Id -->').errors.join(), /小寫英數/);
});

test('unknown facet values, kinds, fields and rules are rejected', () => {
  const r = parse('## A\n<!-- card: KB-t.a; topic=nope; kind=essay; colour=red; rules=RULE-NOPE -->');
  const e = r.errors.join('\n');
  for (const m of ['topic「nope」', 'kind「essay」', '不認得的欄位 colour', 'RULE-NOPE']) assert.ok(e.includes(m), m);
  assert.match(parsePage(page('', 'id: KB-t\nkind: method\nreviewedAt: 2026-11-10'), 't.md', ctx).errors.join(), /缺 topic/);
});

test('an H3 is a card only when marked; it gets a parent and leaves the parent body', () => {
  const r = parse('## A\n<!-- card: KB-t.a -->\nparent text\n### plain\nstays in A\n### big\n<!-- card: KB-t.big -->\nchild text');
  assert.deepEqual(r.errors, []);
  const [a, big] = r.cards;
  assert.equal(big.parent, 'KB-t.a'); assert.deepEqual(big.heading, ['A', 'big']);
  assert.equal(a.tokens, tokens('parent text\n### plain\nstays in A'));
});

test('headings inside code fences are not cards', () => {
  assert.deepEqual(parse('## A\n<!-- card: KB-t.a -->\n```md\n## not a heading\n```').errors, []);
});

test('oversized cards warn (RULE-KB-CARD-SIZE) instead of failing', () => {
  const r = parse(`## A\n<!-- card: KB-t.a -->\n${'字'.repeat(60)}`);
  assert.deepEqual(r.errors, []); assert.match(r.warnings.join(), /超過 50/);
});

test('marker syntax', () => {
  assert.deepEqual(parseMarker('<!-- card: skip; reason=x -->'), { skip: true, reason: 'x' });
  assert.equal(parseMarker('<!-- note -->'), null);
});

test('the repository knowledge base validates and kb.json is up to date', () => {
  const { errors, data } = buildKb(root);
  assert.deepEqual(errors, []);
  assert.ok(data.counts.cards > 0);
  const built = JSON.parse(readFileSync(join(root, 'knowledge-base', 'index', 'kb.json'), 'utf8'));
  assert.deepEqual(built.cards, data.cards);
});
