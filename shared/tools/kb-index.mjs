// kb-index — knowledge cards (knowledge-base/decisions/2026-11-10-libraries-and-loop.md §3.1, §8).
// A knowledge-base page joins the index by starting with a front-matter block; every H2 then carries a card marker:
//
//   ---
//   id: KB-difficulty-curve
//   kind: method
//   topic: [difficulty, fairness]
//   genre: "*"
//   rules: [RULE-CURVE-TREND]
//   reviewedAt: 2026-10-21
//   ---
//   ## 4. 驗收門檻
//   <!-- card: KB-difficulty-curve.gates; topic=difficulty; kind=method -->
//   <!-- card: skip; reason=資產資料，改查 index/assets.json -->
//
// Front-matter is a deliberately small YAML subset: `key: value` or `key: [a, b]`, one per line.
// A marker may override page facets for its card (`key=a,b`). An H3 becomes its own card only when it carries a marker;
// it then records its H2 card as `parent`, and its text is left out of the parent's body.
// `line` / `end` are 1-based: the heading line and the last non-blank line of the card (child H3 cards sit inside).
// Required fields, id format and the size threshold come from RULE-KB-CARDS / RULE-KB-CARD-SIZE (rules.mjs).
// Called by index-build.mjs, which writes knowledge-base/index/kb.json.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadRules } from './rules.mjs';

const FACETS_FILE = join('shared', 'index', 'facets.json');
const KB = 'knowledge-base';
export const FACET_KEYS = ['topic', 'genre', 'skillAxis', 'renderer', 'jurisdiction', 'artStyle', 'source'];
const PAGE_KEYS = new Set(['id', 'kind', 'rules', 'reviewedAt', ...FACET_KEYS]);
const CARD_KEYS = new Set(['kind', 'rules', ...FACET_KEYS]);

const norm = s => s.replace(/\r\n/g, '\n');
const list = v => (Array.isArray(v) ? v : [v]);

/** Token estimate (RULE-KB-CARD-SIZE measurement): CJK / full-width chars count 1, everything else 1 per 4 chars. */
export function tokens(s) {
  const cjk = (s.match(/[　-鿿＀-￯]/g) || []).length;
  return cjk + Math.ceil((s.length - cjk) / 4);
}

/** Vocabulary: { facets: { key: Set }, kinds: Set }. `source` also accepts every knowledge-base/ad-funnel/af-*.md name. */
export function loadVocabulary(root) {
  const doc = JSON.parse(readFileSync(join(root, FACETS_FILE), 'utf8'));
  const facets = Object.fromEntries(Object.entries(doc.facets).map(([k, f]) => [k, new Set(Object.keys(f.values))]));
  const af = join(root, KB, 'ad-funnel');
  if (existsSync(af)) for (const f of readdirSync(af)) if (/^af-.*\.md$/.test(f)) facets.source.add(f.slice(0, -3));
  return { facets, kinds: new Set(Object.keys(doc.kbKinds)) };
}

function parseScalar(s) {
  s = s.trim();
  if (s.startsWith('[') && s.endsWith(']')) return s.slice(1, -1).split(',').map(x => parseScalar(x)).filter(x => x !== '');
  return s.replace(/^["']|["']$/g, '');
}

/** Front-matter of a page, or null when the page does not start with `---`. */
export function frontMatter(text) {
  const lines = norm(text).split('\n');
  if (lines[0].trim() !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end < 0) return { error: 'front-matter 沒有結尾的 ---', fields: {}, bodyStart: 1 };
  const fields = {}, bad = [];
  for (const l of lines.slice(1, end)) {
    if (!l.trim() || l.trim().startsWith('#')) continue;
    const m = l.match(/^([A-Za-z]\w*):\s*(.*)$/);
    if (m) fields[m[1]] = parseScalar(m[2]); else bad.push(l);
  }
  return { fields, bodyStart: end + 1, error: bad.length ? `front-matter 無法解析：${bad.join(' / ')}` : null };
}

/** `<!-- card: ID; k=a,b -->` -> { id, skip, reason, overrides } or null. */
export function parseMarker(line) {
  const m = line.trim().match(/^<!--\s*card:\s*(.*?)\s*-->$/);
  if (!m) return null;
  const [head = '', ...rest] = m[1].split(';').map(s => s.trim()).filter(Boolean);
  const kv = Object.fromEntries(rest.map(p => { const i = p.indexOf('='); return i < 0 ? [p, ''] : [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }));
  if (head === 'skip') return { skip: true, reason: kv.reason ?? '' };
  const overrides = {};
  for (const [k, v] of Object.entries(kv)) overrides[k] = k === 'kind' ? v : v.split(',').map(s => s.trim()).filter(Boolean);
  return { id: head, skip: false, overrides };
}

/**
 * Parse one page into cards. Pure: everything it checks against comes in `ctx`
 * { vocab, ruleIds:Set, pageFields:[], pageIdRe:RegExp, maxTokens }.
 * @returns { page, cards, errors, warnings } — page is null when the page has no front-matter.
 */
export function parsePage(text, path, ctx) {
  const errors = [], warnings = [], fm = frontMatter(text);
  if (!fm) return { page: null, cards: [], errors, warnings };
  if (fm.error) errors.push(`${path}: ${fm.error}`);
  const f = fm.fields;
  for (const k of ctx.pageFields) if (f[k] === undefined || f[k] === '' || (Array.isArray(f[k]) && !f[k].length)) errors.push(`${path}: front-matter 缺 ${k}`);
  for (const k of Object.keys(f)) if (!PAGE_KEYS.has(k)) errors.push(`${path}: front-matter 不認得的欄位 ${k}`);
  if (f.id && !ctx.pageIdRe.test(f.id)) errors.push(`${path}: 頁 id「${f.id}」不符合 ${ctx.pageIdRe}`);
  if (f.reviewedAt && !/^\d{4}-\d{2}-\d{2}$/.test(f.reviewedAt)) errors.push(`${path}: reviewedAt 要是 YYYY-MM-DD`);

  const checkTags = (where, tags) => {
    if (tags.kind !== undefined && !ctx.vocab.kinds.has(tags.kind)) errors.push(`${where}: kind「${tags.kind}」不在 kbKinds`);
    for (const k of FACET_KEYS) for (const v of tags[k] === undefined ? [] : list(tags[k]))
      if (v !== '*' && !ctx.vocab.facets[k]?.has(v)) errors.push(`${where}: ${k}「${v}」不在 shared/index/facets.json`);
    for (const r of tags.rules === undefined ? [] : list(tags.rules)) if (!ctx.ruleIds.has(r)) errors.push(`${where}: 規則 ${r} 不存在`);
  };
  checkTags(path, f);
  const pageTags = Object.fromEntries([...FACET_KEYS, 'kind', 'rules'].filter(k => f[k] !== undefined).map(k => [k, k === 'kind' ? f.kind : list(f[k])]));

  const lines = norm(text).split('\n'), cards = [];
  const title = lines.slice(fm.bodyStart).find(l => /^# /.test(l))?.slice(2).trim() ?? '';
  let fence = false, h2 = null, h3 = null, skipped = 0;
  const nextLine = i => { for (let j = i + 1; j < lines.length; j++) if (lines[j].trim()) return j; return -1; };
  const open = (level, i, heading, marker, parent) => {
    const where = `${path}:${i + 1}`;
    for (const k of Object.keys(marker.overrides)) if (!CARD_KEYS.has(k)) errors.push(`${where}: 卡片不認得的欄位 ${k}`);
    checkTags(where, marker.overrides);
    if (f.id && !marker.id.startsWith(`${f.id}.`)) errors.push(`${where}: 卡片 id「${marker.id}」要以「${f.id}.」開頭`);
    if (!/^KB-[a-z0-9-]+\.[a-z0-9-]+$/.test(marker.id)) errors.push(`${where}: 卡片 id「${marker.id}」只能用小寫英數與 -`);
    const tags = { ...pageTags, ...marker.overrides };
    const card = { id: marker.id, page: f.id, path, line: i + 1, end: i + 1, heading: parent ? [parent.heading[0], heading] : [heading],
      ...(parent ? { parent: parent.id } : {}), kind: tags.kind,
      facets: Object.fromEntries(FACET_KEYS.filter(k => tags[k] !== undefined).map(k => [k, tags[k]])),
      rules: tags.rules ?? [], reviewedAt: f.reviewedAt, body: [] };
    cards.push(card);
    return card;
  };

  for (let i = fm.bodyStart; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*(```|~~~)/.test(l)) fence = !fence;
    const hm = !fence && l.match(/^(#{2,3}) (.*)$/);
    if (hm) {
      const level = hm[1].length, heading = hm[2].trim(), at = nextLine(i);
      const marker = at >= 0 ? parseMarker(lines[at]) : null;
      if (level === 2) {
        h3 = null;
        if (!marker) { errors.push(`${path}:${i + 1}: H2「${heading}」下沒有 <!-- card: … --> 標記`); h2 = null; continue; }
        if (marker.skip) { if (!marker.reason) errors.push(`${path}:${at + 1}: card: skip 要寫 reason=`); h2 = null; skipped++; i = at; continue; }
        h2 = open(2, i, heading, marker, null); i = at; continue;
      }
      if (marker && !marker.skip) {                                   // explicit H3 card
        if (!h2) errors.push(`${path}:${i + 1}: H3 卡片「${heading}」所屬的 H2 沒有卡片`);
        else { h3 = open(3, i, heading, marker, h2); i = at; continue; }
      }
      h3 = null;                                                       // plain H3: its text stays in the H2 card
    }
    const into = h3 ?? h2;
    if (into) { into.body.push(l); if (l.trim()) into.end = i + 1; }
  }

  for (const c of cards) {
    const body = c.body.join('\n').trim();
    c.tokens = tokens(body);
    c.hash = 'sha256:' + createHash('sha256').update(body).digest('hex').slice(0, 16);
    if (ctx.keepBody) c.text = body;
    delete c.body;
    if (c.tokens > ctx.maxTokens) warnings.push(`${path}:${c.line} ${c.id} 約 ${c.tokens} tokens，超過 ${ctx.maxTokens}（RULE-KB-CARD-SIZE）：拆段或顯式切 H3`);
  }
  const page = { id: f.id, path, title, kind: f.kind, facets: Object.fromEntries(FACET_KEYS.filter(k => f[k] !== undefined).map(k => [k, list(f[k])])),
    rules: f.rules === undefined ? [] : list(f.rules), reviewedAt: f.reviewedAt, cards: cards.length, skipped };
  return { page, cards, errors, warnings };
}

/** Every knowledge-base/**.md except the generated index/ folder, sorted, with / separators. */
export function kbFiles(root) {
  const walk = d => readdirSync(join(root, d), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? (d === KB && e.name === 'index' ? [] : walk(`${d}/${e.name}`)) : e.name.endsWith('.md') ? [`${d}/${e.name}`] : []);
  return walk(KB).sort();
}

/** The parsePage context for this repo (vocabulary, rule ids, RULE-KB-CARDS / RULE-KB-CARD-SIZE values). */
export function kbContext(root) {
  const rules = loadRules({ from: root, game: null });
  return {
    vocab: loadVocabulary(root), ruleIds: new Set(rules.rules.map(r => r.id)),
    pageFields: rules.value('RULE-KB-CARDS', 'pageFields'), pageIdRe: new RegExp(rules.value('RULE-KB-CARDS', 'pageId')),
    maxTokens: rules.value('RULE-KB-CARD-SIZE', 'maxTokens'),
  };
}

/** Parse every page; returns { errors, warnings, data } where data is the kb.json payload (without the header). */
export function buildKb(root) {
  const ctx = kbContext(root);
  const errors = [], warnings = [], pages = [], cards = [], unindexed = [], seen = new Map();
  for (const path of kbFiles(root)) {
    const r = parsePage(readFileSync(join(root, path), 'utf8'), path, ctx);
    errors.push(...r.errors); warnings.push(...r.warnings);
    if (!r.page) { unindexed.push(path); continue; }
    for (const id of [r.page.id, ...r.cards.map(c => c.id)]) {
      if (seen.has(id)) errors.push(`${path}: id ${id} 與 ${seen.get(id)} 重複`); else seen.set(id, path);
    }
    pages.push(r.page); cards.push(...r.cards);
  }
  const tally = vals => Object.fromEntries([...vals.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map())].sort());
  const counts = { pages: pages.length, cards: cards.length, unindexed: unindexed.length,
    byKind: tally(cards.map(c => c.kind)), byTopic: tally(cards.flatMap(c => c.facets.topic ?? ['（未標）'])) };
  return { errors, warnings, data: { counts, pages, cards, unindexed } };
}
