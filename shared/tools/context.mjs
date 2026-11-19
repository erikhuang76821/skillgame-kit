// context — the dynamic index: one loop step's context pack (knowledge-base/decisions/2026-11-10-libraries-and-loop.md
// §4.4, §8). Joins a step declaration (what it pulls, its token budget, its gate rules) with <Game>/game.profile.json
// against the generated indexes (kb.json, tests.json, assets.json) and the rules resolver (effective values, overrides).
//
//   node shared/tools/context.mjs <Game> --node <node id> [--json]            (a node of shared/loop/nodes.json)
//   node shared/tools/context.mjs <Game> --pull <steps.json> --step <id> [--json]
//
// A step: { id, name, pull: { kb, rules, tests, assets }, budget: { kbTokens }, gate: { must: [rule id or RULE-X-*] } }
//   pull.kb      facet selector over knowledge cards, plus `kind: [...]` (its order is the preference order); a list of
//                selectors is a union (e.g. one with jurisdiction for legal cards, one without for the rest)
//   pull.rules   { category: [...], level: [...], id: [...] }
//   pull.tests   "$pulled.rules" (default: cards implementing the pulled rules) or { topic: [...] }
//   pull.assets  { kind, status, reusePolicy, game } or null; values may be "$profile.<key>" (game -> profile.game)
// Selector semantics (§8): every key must match, arrays match any value; a card tagged "*" matches anything; a card with
// no value for a key is "unknown": it still matches but ranks lower and is flagged — except jurisdiction, which never
// matches when unknown, and except a card that is unknown on every selector key, which does not match at all. Cards linked to the gate rules form a floor that is neither ranked nor cut; a floor larger than
// the budget is an error. Everything else is ranked (exact facet hits, fewer unknowns, kind preference, newer
// reviewedAt, id) and added while it fits; whatever does not fit is listed. Cards are never truncated.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FACET_KEYS, kbContext, loadVocabulary, parsePage } from './kb-index.mjs';
import { findRoot, loadRules } from './rules.mjs';

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const list = v => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const COST_ORDER = ['cheap', 'medium', 'heavy', 'human'];
// Structure flags: booleans about how the game is built. They decide which rules apply; they are not retrieval facets.
//   scriptedProgression  one match has measurable, pre-scripted sections (waves, song sections) — the difficulty-curve rules need them
export const PROFILE_FLAGS = ['scriptedProgression'];
const PROFILE_KEYS = new Set(['schemaVersion', 'game', ...FACET_KEYS, ...PROFILE_FLAGS]);
// Keys a rule's scope.selector may use: what the rule checks (target) and which games it is for (answered by the profile).
export const SCOPE_TARGET_KEYS = ['kind', 'path'];
export const SCOPE_PROFILE_KEYS = ['genre', 'renderer', 'source', ...PROFILE_FLAGS];
// A rule kept for named games only (a legacy measure that new games do not get): scope.selector.game is a list of game
// folder names, matched against the profile's `game` (which must equal its folder). It is never "pending": a game that
// is not on the list — including the generic profile behind the bootstrap table — is simply not one of them.
export const SCOPE_GAME_KEY = 'game';
// Facets that say what a game *is*: a card tagged with a concrete value here is about such games only, so it is left out
// for a game whose profile has none of those values even when the selector does not ask about the key (an
// af-gate-lane-shooter card is not general fairness advice for a rhythm game).
export const SCOPED_FACETS = ['source', 'genre', 'renderer'];
export function fitsProfile(facets, profile) {
  return SCOPED_FACETS.every(k => {
    const have = facets[k], mine = list(profile[k]);
    return !have || have.includes('*') || !mine.length || mine.includes('*') || have.some(v => mine.includes(v));
  });
}

/** <Game>/game.profile.json, validated against shared/index/facets.json. */
export function loadProfile(root, game, vocab = loadVocabulary(root)) {
  const p = join(root, game, 'game.profile.json'), errors = [];
  if (!existsSync(p)) return { profile: null, errors: [`缺 ${game}/game.profile.json`] };
  const profile = readJson(p);
  if (profile.schemaVersion !== 1) errors.push(`${game}/game.profile.json: schemaVersion 必須是 1`);
  if (profile.game !== game) errors.push(`${game}/game.profile.json: game 應為 ${game}`);
  for (const [k, v] of Object.entries(profile)) {
    if (!PROFILE_KEYS.has(k)) { errors.push(`${game}/game.profile.json: 不認得的欄位 ${k}`); continue; }
    if (PROFILE_FLAGS.includes(k) && typeof v !== 'boolean') errors.push(`${game}/game.profile.json: ${k} 必須是 true 或 false`);
    if (!FACET_KEYS.includes(k)) continue;
    for (const x of list(v)) if (!vocab.facets[k].has(x)) errors.push(`${game}/game.profile.json: ${k}「${x}」不在 shared/index/facets.json`);
  }
  return { profile, errors };
}

/** Replace "$profile.<key>" values (strings or array items) with the profile's values. */
export function resolveValues(sel, profile) {
  if (!sel || typeof sel !== 'object') return sel;
  const one = v => (typeof v === 'string' && v.startsWith('$profile.') ? list(profile[v.slice(9)]) : [v]);
  return Object.fromEntries(Object.entries(sel).map(([k, v]) => [k, list(v).flatMap(one)]));
}

/**
 * Facet match of a card against a resolved selector: { ok, exact, unknown }. `kind` is handled by the caller.
 * A card whose every selector key is unknown does not match (otherwise a one-key selector such as { source } would pull
 * every card that simply was never tagged with that key).
 */
export function facetMatch(facets, sel) {
  let exact = 0, unknown = 0, wild = 0, keys = 0;
  for (const [key, wanted] of Object.entries(sel)) {
    if (key === 'kind') continue;
    keys++;
    const have = facets[key];
    if (!have) { if (key === 'jurisdiction') return { ok: false, exact, unknown }; unknown++; continue; }
    if (have.includes('*') || wanted.includes('*')) { wild++; continue; }
    if (!have.some(v => wanted.includes(v))) return { ok: false, exact, unknown };
    exact++;
  }
  return { ok: !keys || exact + wild > 0, exact, unknown };
}

/**
 * Does a rule's scope selector apply to this game? -> { state: 'applies' | 'not-applicable' | 'pending', missing: [keys] }.
 * A key the scope names but the profile does not answer is 'pending' (the profile must be completed), never a silent
 * 'applies' or 'not-applicable'. A key that clearly does not fit wins over a missing one. A "*" profile value (the generic
 * profile behind the bootstrap table) fits every scope.
 */
export function ruleScope(rule, profile) {
  const sel = rule.scope?.selector ?? {}, missing = [];
  let mismatch = sel[SCOPE_GAME_KEY] !== undefined && !list(sel[SCOPE_GAME_KEY]).includes(profile.game);
  for (const k of SCOPE_PROFILE_KEYS) {
    if (sel[k] === undefined) continue;
    if (PROFILE_FLAGS.includes(k)) {
      if (profile[k] === undefined) missing.push(k);
      else if (profile[k] !== '*' && profile[k] !== sel[k]) mismatch = true;
      continue;
    }
    const mine = list(profile[k]).filter(x => typeof x === 'string');   // a malformed value (reported by loadProfile) counts as unanswered
    if (!mine.length) missing.push(k);
    else if (mine.includes('*')) continue;
    else if (k === 'source' && sel[k] === 'ad-funnel' ? !mine.some(s => s.startsWith('af-')) : !mine.includes(sel[k])) mismatch = true;
  }
  return { state: mismatch ? 'not-applicable' : missing.length ? 'pending' : 'applies', missing: mismatch ? [] : missing };
}
export const ruleApplies = (rule, profile) => ruleScope(rule, profile).state === 'applies';

/**
 * Every key in a rule's scope.selector must be one the tools understand: a scope key nobody checks makes the rule apply
 * to every game (the `difficulty: "scripted"` bug). Flags must be booleans; genre / renderer must be vocabulary values.
 */
export function checkRuleScopes(rules, vocab) {
  const errors = [];
  for (const r of rules) for (const [k, v] of Object.entries(r.scope?.selector ?? {})) {
    const at = `rules.json ${r.id}: scope.selector.${k}`;
    if (SCOPE_TARGET_KEYS.includes(k)) { if (typeof v !== 'string') errors.push(`${at} 要是字串`); continue; }
    if (k === SCOPE_GAME_KEY) { if (!Array.isArray(v) || !v.length || v.some(x => typeof x !== 'string' || !x || x === '*')) errors.push(`${at} 要是遊戲資料夾名稱的清單（不可為空、不可用 *）`); continue; }
    if (!SCOPE_PROFILE_KEYS.includes(k)) { errors.push(`${at} 不是認得的適用範圍欄位（可用：${[...SCOPE_TARGET_KEYS, ...SCOPE_PROFILE_KEYS, SCOPE_GAME_KEY].join('、')}）`); continue; }
    if (PROFILE_FLAGS.includes(k)) { if (typeof v !== 'boolean') errors.push(`${at} 必須是 true 或 false`); }
    else if (k === 'source') { if (v !== 'ad-funnel' && !vocab.facets.source.has(v)) errors.push(`${at}「${v}」不在 shared/index/facets.json（或用 ad-funnel）`); }
    else if (!vocab.facets[k].has(v)) errors.push(`${at}「${v}」不在 shared/index/facets.json`);
  }
  return errors;
}

const idMatch = (id, pats) => pats.some(p => (p.endsWith('*') ? id.startsWith(p.slice(0, -1)) : id === p));

/**
 * Build one step's context pack. Returns { errors, warnings, pack }. opts.profile replaces <Game>/game.profile.json;
 * opts.resolver replaces the rules resolver (tests).
 */
export function buildContext(root, game, step, opts = {}) {
  const errors = [], warnings = [];
  const vocab = loadVocabulary(root);
  const { profile, errors: pe } = opts.profile ? { profile: opts.profile, errors: [] } : loadProfile(root, game, vocab);
  errors.push(...pe);
  if (!profile) return { errors, warnings, pack: null };
  const idx = name => readJson(join(root, 'knowledge-base', 'index', name));
  const kb = idx('kb.json'), tests = idx('tests.json'), assets = idx('assets.json');
  const resolver = opts.resolver ?? loadRules({ from: join(root, game), game });
  errors.push(...checkRuleScopes(resolver.rules, vocab));   // a scope key nobody checks would make the rule apply to every game
  const pull = step.pull ?? {};

  // Rules: applicable to this game, picked by the pull selector or named by the gate.
  const gatePats = list(step.gate?.must);
  const rsel = pull.rules ?? null;
  const picked = r => rsel && (!rsel.category || list(rsel.category).includes(r.category))
    && (!rsel.level || list(rsel.level).includes(r.level)) && (!rsel.id || idMatch(r.id, list(rsel.id)));
  // Only applicable rules enter the pack. Rules the profile cannot answer yet go to `pending` (the gate blocks on the
  // must-level ones); they are never treated as applicable or as not applicable.
  const gateIds = new Set(), notApplicable = [], pending = [];
  const rules = resolver.rules.filter(r => {
    const inGate = idMatch(r.id, gatePats);
    if (!inGate && !picked(r)) return false;
    const s = ruleScope(r, profile);
    if (s.state === 'not-applicable') { notApplicable.push(r.id); return false; }
    if (s.state === 'pending') { pending.push({ id: r.id, level: r.level, gate: inGate, missing: s.missing }); return false; }
    if (inGate) gateIds.add(r.id);
    return true;
  }).map(r => ({
    id: r.id, level: r.level, category: r.category, gate: gateIds.has(r.id),
    constraints: r.constraints.map(c => ({ name: c.name, ...(c.check ? { check: c.check } : { op: c.op, value: resolver.value(r.id, c.name), unit: c.unit }),
      ...(resolver.overrides.some(o => o.rule === r.id && o.constraint === c.name) ? { overridden: true } : {}) })),
    measurement: r.measurement, whyRef: r.whyRef, howRef: r.howRef,
  }));
  for (const p of gatePats) if (!resolver.rules.some(r => idMatch(r.id, [p]))) errors.push(`gate 引用不存在的規則 ${p}`);
  if (pending.length) warnings.push(`profile 資料待補，無法判斷這些規則是否適用：${pending.map(p => `${p.id}（缺 ${p.missing.join('、')}）`).join('；')}`);

  // Knowledge cards: floor (linked to gate rules) + ranked selection within the budget.
  // pull.kb may be one selector or a list (union): a card takes its best match over the selectors it satisfies.
  const ksels = list(pull.kb).map(s => resolveValues(s, profile));
  const best = c => {
    let top = null;
    for (const s of ksels) {
      const kinds = list(s.kind);
      if (kinds.length && !kinds.includes(c.kind)) continue;
      const m = facetMatch(c.facets, s);
      const k = kinds.length ? kinds.indexOf(c.kind) : 0;
      if (m.ok && (!top || m.exact > top.exact || (m.exact === top.exact && (m.unknown < top.unknown || (m.unknown === top.unknown && k < top.k))))) top = { ...m, k };
    }
    return top;
  };
  const budget = step.budget?.kbTokens ?? 0;
  const floor = kb.cards.filter(c => c.rules.some(r => gateIds.has(r)));
  const floorIds = new Set(floor.map(c => c.id));
  const candidates = kb.cards.filter(c => !floorIds.has(c.id) && fitsProfile(c.facets, profile)).map(c => ({ c, m: best(c) })).filter(x => x.m)
    .sort((a, b) => b.m.exact - a.m.exact || a.m.unknown - b.m.unknown || a.m.k - b.m.k
      || (b.c.reviewedAt ?? '').localeCompare(a.c.reviewedAt ?? '') || a.c.id.localeCompare(b.c.id));
  const floorTokens = floor.reduce((n, c) => n + c.tokens, 0);
  if (floorTokens > budget) errors.push(`保底卡片共 ${floorTokens} tokens，超過預算 ${budget}：調高 budget.kbTokens 或拆卡（不得截斷）`);
  let used = floorTokens;
  const chosen = floor.map(c => ({ c, why: 'floor', m: best(c) ?? { exact: 0, unknown: 0 } }));
  const excluded = [];
  for (const x of candidates) {
    if (used + x.c.tokens <= budget) { chosen.push({ ...x, why: 'ranked' }); used += x.c.tokens; }
    else excluded.push({ id: x.c.id, tokens: x.c.tokens });
  }

  // Card text straight from the pages (same parser as kb-index); a hash mismatch means kb.json is stale.
  const pctx = { ...kbContext(root), keepBody: true }, parsed = new Map();
  const textOf = c => {
    if (!parsed.has(c.path)) parsed.set(c.path, new Map(parsePage(readFileSync(join(root, c.path), 'utf8'), c.path, pctx).cards.map(x => [x.id, x])));
    const live = parsed.get(c.path).get(c.id);
    if (!live) { errors.push(`${c.id} 已不在 ${c.path}（kb.json 過期，跑 index-build）`); return ''; }
    if (live.hash !== c.hash) warnings.push(`${c.id} 內容與 kb.json 不同（kb.json 過期，跑 index-build）`);
    const parent = c.parent ? parsed.get(c.path).get(c.parent) : null;
    const intro = parent ? `${'#'.repeat(2)} ${parent.heading[0]}\n${parent.text.split(/\n#{3} /)[0].trim()}\n\n` : '';
    return `${intro}${'#'.repeat(c.parent ? 3 : 2)} ${c.heading.at(-1)}\n${live.text}`;
  };
  const cards = chosen.map(({ c, why, m }) => ({
    id: c.id, path: c.path, line: c.line, kind: c.kind, tokens: c.tokens, why,
    facetHits: m.exact, unknownFacets: m.unknown, text: textOf(c),
  }));

  // Knowledge gaps: a concrete facet value asked for with no exact card among the matches.
  const gaps = [], matched = candidates.map(x => x.c).concat(floor);
  for (const s of ksels) for (const [key, wanted] of Object.entries(s)) {
    if (key === 'kind') continue;
    for (const v of wanted) {
      if (v === '*' || gaps.some(g => g.facet === key && g.value === v) || matched.some(c => (c.facets[key] ?? []).includes(v))) continue;
      const generic = matched.some(c => (c.facets[key] ?? []).includes('*'));
      gaps.push({ facet: key, value: v, level: generic ? 'generic-only' : 'none',
        note: generic ? `沒有 ${key}=${v} 專屬的卡片，只有通用（"*"）卡片` : `沒有任何卡片涵蓋 ${key}=${v}` });
    }
  }

  // Tests: cards implementing the pulled rules (or a topic selector); runnable when every `needs` path exists.
  const ruleIds = new Set(rules.map(r => r.id));
  const tsel = pull.tests && pull.tests !== '$pulled.rules' ? resolveValues(pull.tests, profile) : null;
  const testCards = tests.tests.filter(t => (tsel ? facetMatch(t.facets ?? {}, tsel).ok && facetMatch(t.facets ?? {}, tsel).exact > 0 : false)
    || t.implements.some(r => ruleIds.has(r)))
    .map(t => {
      const missing = t.needs.filter(n => !existsSync(join(root, game, n)));
      return { id: t.id, kind: t.kind, cost: t.cost, implements: t.implements.filter(r => ruleIds.has(r)),
        run: t.run ?? null, cwd: t.cwd.replace('<Game>', game), runnable: !missing.length, missing,
        ...(t.checklists ? { checklists: t.checklists.filter(x => ruleIds.has(x.rule)) } : {}) };
    })
    .sort((a, b) => COST_ORDER.indexOf(a.cost) - COST_ORDER.indexOf(b.cost) || a.id.localeCompare(b.id));
  const uncovered = rules.filter(r => !testCards.some(t => t.implements.includes(r.id))).map(r => r.id);
  if (uncovered.length) warnings.push(`這些規則在本步沒有測試卡：${uncovered.join('、')}`);

  // Assets: classified by what can be done with them (no review evidence exists yet -> nothing is "direct use").
  const asel = pull.assets ? Object.fromEntries(Object.entries(pull.assets).map(([k, v]) =>
    [k, list(v).flatMap(x => (x === '$profile.game' ? [game] : typeof x === 'string' && x.startsWith('$profile.') ? list(profile[x.slice(9)]) : [x]))])) : null;
  const evidenceDir = join(root, 'knowledge-base', 'index', 'evidence');
  const evidence = existsSync(evidenceDir) ? readdirSync(evidenceDir) : [];
  const hasEvidence = id => evidence.some(f => f.includes(id));
  const assetHits = !asel ? [] : assets.assets.filter(a => Object.entries(asel).every(([k, vals]) => vals.includes(a[k])))
    .map(a => ({ id: a.id, kind: a.kind, status: a.status, reusePolicy: a.reusePolicy, name: a.name,
      use: hasEvidence(a.id) && a.status === 'shipped' ? 'direct' : (a.files.prompt?.length || a.recipe) ? 'regenerate' : 'reference' }));

  const pack = {
    game, step: step.id ?? null, name: step.name ?? null,
    profile: Object.fromEntries(FACET_KEYS.filter(k => profile[k]).map(k => [k, list(profile[k])])),
    budget: { kbTokens: budget, used, floor: floorTokens },
    rules, notApplicable, pending, cards, excluded, gaps, tests: testCards, assets: assetHits,
  };
  return { errors, warnings, pack };
}

/** Markdown for an AI reader. */
export function renderPack(pack, errors = [], warnings = []) {
  const p = pack, out = [];
  out.push(`# Context pack — ${p.game} @ ${p.step ?? '—'}${p.name ? `（${p.name}）` : ''}`, '');
  out.push(`profile：${Object.entries(p.profile).map(([k, v]) => `${k}=${v.join(',')}`).join('；')}`);
  out.push(`知識預算：${p.budget.used} / ${p.budget.kbTokens} tokens（保底 ${p.budget.floor}）`, '');
  if (errors.length) out.push('## ✘ 錯誤', '', ...errors.map(e => `- ${e}`), '');
  if (warnings.length) out.push('## ⚠ 警告', '', ...warnings.map(w => `- ${w}`), '');
  out.push(`## 有效規則（${p.rules.length}）`, '');
  for (const r of p.rules) {
    const cs = r.constraints.map(c => (c.check ? `${c.name}：${c.check}` : `${c.name} ${c.op ?? '='} ${JSON.stringify(c.value)}${c.unit ? ` ${c.unit}` : ''}${c.overridden ? '（本作覆寫）' : ''}`)).join('；');
    out.push(`- \`${r.id}\`（${r.level}${r.gate ? '，本步關卡' : ''}）${cs}　量測：${r.measurement}　why：${r.whyRef}`);
  }
  if (p.notApplicable.length) out.push('', `不適用本作（selector 不符）：${p.notApplicable.join('、')}`);
  if (p.pending?.length) out.push('', '資料待補（先補 game.profile.json，否則關卡無法驗證）：', ...p.pending.map(x => `- ${x.id}（${x.level}${x.gate ? '，本步關卡' : ''}）缺 ${x.missing.join('、')}`));
  out.push('', `## 測試（${p.tests.filter(t => t.runnable).length} 可跑，${p.tests.filter(t => !t.runnable).length} 不能跑）`, '');
  for (const t of p.tests) out.push(`- \`${t.id}\` ${t.cost} ${t.run ? `\`${t.run}\`（cwd ${t.cwd}）` : '人工審查'} → ${t.implements.join(', ') || '—'}${t.runnable ? '' : `　缺：${t.missing.join('、')}`}`
    + (t.checklists ? `　檢核：${t.checklists.map(x => x.checklist).join('；')}` : ''));
  if (p.assets.length) {
    out.push('', `## 資產（${p.assets.length}）`, '');
    for (const use of ['direct', 'regenerate', 'reference']) {
      const xs = p.assets.filter(a => a.use === use);
      if (xs.length) out.push(`- ${{ direct: '可直接用', regenerate: '可照 prompt / 配方重生', reference: '僅參考' }[use]}（${xs.length}）：${xs.map(a => `\`${a.id}\``).join(' ')}`);
    }
  }
  if (p.gaps.length) out.push('', '## 知識缺口', '', ...p.gaps.map(g => `- ${g.level === 'none' ? '❗' : 'ℹ'} ${g.facet}=${g.value}：${g.note}${g.level === 'none' ? '；建議在 knowledge-base 開 backlog 題目（不自動寫）' : ''}`));
  out.push('', `## 知識（${p.cards.length} 段${p.excluded.length ? `，預算外 ${p.excluded.length} 段` : ''}）`, '');
  for (const c of p.cards) out.push(`- \`${c.id}\` ${c.kind} ${c.tokens}t ${c.why === 'floor' ? '保底' : `facet 命中 ${c.facetHits}`}${c.unknownFacets ? `、未分類 ${c.unknownFacets}` : ''}　${c.path}:${c.line}`);
  if (p.excluded.length) out.push('', `預算外：${p.excluded.map(x => `\`${x.id}\`(${x.tokens}t)`).join(' ')}`);
  for (const c of p.cards) out.push('', '---', `<!-- ${c.id} · ${c.path}:${c.line} -->`, c.text);
  return out.join('\n') + '\n';
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/').endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const args = process.argv.slice(2), opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
  const game = args[0], nodeId = opt('--node'), pullFile = opt('--pull'), stepId = nodeId ?? opt('--step');
  if (!game || game.startsWith('--') || !stepId || (!nodeId && !pullFile)) {
    console.error('用法：node shared/tools/context.mjs <Game> --node <id> [--json]｜--pull <steps.json> --step <id> [--json]'); process.exit(2);
  }
  const root = findRoot(process.cwd());
  const src = nodeId ? join(root, 'shared', 'loop', 'nodes.json') : pullFile;
  const doc = readJson(src), step = (doc.nodes ?? doc.steps).find(s => s.id === stepId);
  if (!step) { console.error(`${src} 沒有 ${stepId}`); process.exit(2); }
  const { errors, warnings, pack } = buildContext(root, game, step);
  if (!pack) { console.error(errors.join('\n')); process.exit(1); }
  process.stdout.write(args.includes('--json') ? JSON.stringify({ errors, warnings, ...pack }, null, 1) + '\n' : renderPack(pack, errors, warnings));
  process.exit(errors.length ? 1 : 0);
}
