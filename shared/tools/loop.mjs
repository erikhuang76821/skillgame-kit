// loop — the loop plane (knowledge-base/decisions/2026-11-10-libraries-and-loop.md §4.2–§4.3, §8): runs one game through
// the node graph in shared/loop/nodes.json.
//
//   node shared/tools/loop.mjs status <Game> [--json]          where the game stands (rebuilt from docs/loop/ every time)
//   node shared/tools/loop.mjs next   <Game> [--node <id>]     the node to work on, its iteration and its context pack
//   node shared/tools/loop.mjs gate   <Game> [--node <id>] [--dry]   run the node's gate, record the event, route
//   node shared/tools/loop.mjs log    <Game> --node <id> (--approve <who> [--waive] | --rollback <node> | --note <text>)
//
// Source of truth (§8 item 3): <Game>/docs/loop/<date>-<node>-<n>.md, one event per file, append-only, in git. The
// front-matter is `key: <JSON>` per line (valid YAML). <Game>/loop/state.json is a cache rewritten on every command and
// git-ignored; deleting it loses nothing.
//   inputHash  = content hash of every upstream node's `produces` (transitive) + this node's `requires`
//   outputHash = content hash of this node's `produces`
// A passed node whose input or output hash changed is "stale" (needs re-verification). Retries count per
// (node, inputHash), not per session. Approvals bind to the outputHash they saw. The loop never edits thresholds.
//
// Gate (§8): cheap tests all run; medium / heavy / human stop at the first failure (the rest are "not run", never
// passed). Review rules and checkpoints need a human `log --approve`. Several failures route to the most upstream
// onFail target; maxIterations failures on one inputHash escalate to a person.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROFILE_FLAGS, buildContext, renderPack } from './context.mjs';
import { FACET_KEYS, loadVocabulary } from './kb-index.mjs';
import { findRoot, loadRules } from './rules.mjs';

export const NODES_FILE = 'shared/loop/nodes.json';
export const LOOP_DIR = 'docs/loop';
const COST_ORDER = ['cheap', 'medium', 'heavy', 'human'];
const DONE = new Set(['passed', 'waived']);
const list = v => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const idMatch = (id, pats) => pats.some(p => (p.endsWith('*') ? id.startsWith(p.slice(0, -1)) : id === p));

export const loadNodes = root => readJson(join(root, NODES_FILE));

/** <Game>/game.profile.json as written, or {} when it is missing or unreadable (validation is context.mjs's job). */
export function readProfile(root, game) {
  try { return readJson(join(root, game, 'game.profile.json')) ?? {}; } catch { return {}; }
}
/**
 * The paths a node produces for this game: `produces` plus each `producesWhen` group whose profile flag is not false.
 * An unanswered flag keeps the group (the gate is blocked by the pending rules anyway); only an explicit false drops it.
 */
export function nodeProduces(node, profile = {}) {
  return [...list(node.produces), ...Object.entries(node.producesWhen ?? {}).flatMap(([flag, paths]) => (profile?.[flag] === false ? [] : list(paths)))];
}

/** Topological order (ties keep file order). Throws on a cycle. */
export function topoOrder(nodes) {
  const out = [], seen = new Set(), busy = new Set(), byId = new Map(nodes.map(n => [n.id, n]));
  const visit = id => {
    if (seen.has(id)) return;
    if (busy.has(id)) throw new Error(`nodes: 循環依賴經過 ${id}`);
    busy.add(id);
    for (const a of byId.get(id)?.after ?? []) visit(a);
    busy.delete(id); seen.add(id); out.push(id);
  };
  for (const n of nodes) visit(n.id);
  return out;
}

/** Every node `id` depends on, transitively. */
export function upstream(nodes, id) {
  const byId = new Map(nodes.map(n => [n.id, n])), out = new Set(), stack = [...(byId.get(id)?.after ?? [])];
  while (stack.length) { const x = stack.pop(); if (!out.has(x)) { out.add(x); stack.push(...(byId.get(x)?.after ?? [])); } }
  return out;
}

/** Validate nodes.json against rules.json, the test registry and the facet vocabulary. */
export function checkNodes(doc, { ruleIds, testIds, vocab }) {
  const errors = [], warnings = [];
  if (doc.schemaVersion !== 1) errors.push(`${NODES_FILE}: schemaVersion 必須是 1`);
  const nodes = doc.nodes ?? [], ids = new Set();
  for (const n of nodes) {
    const at = `${NODES_FILE} ${n.id}`;
    if (!/^N\d+-[a-z0-9-]+$/.test(n.id ?? '')) errors.push(`${NODES_FILE}: 節點 id「${n.id}」格式應為 N<數字>-<slug>`);
    if (ids.has(n.id)) errors.push(`${at}: id 重複`);
    ids.add(n.id);
    if (!n.name) errors.push(`${at}: 缺 name`);
    if (!(Number.isInteger(n.maxIterations) && n.maxIterations >= 1)) errors.push(`${at}: maxIterations 要是 ≥ 1 的整數`);
    if (typeof n.budget?.kbTokens !== 'number') errors.push(`${at}: 缺 budget.kbTokens`);
    for (const k of Object.keys(n.producesWhen ?? {})) if (!PROFILE_FLAGS.includes(k)) errors.push(`${at}: producesWhen 的「${k}」不是 profile 旗標（${PROFILE_FLAGS.join('、')}）`);
    for (const p of [...nodeProduces(n), ...list(n.requires)]) if (typeof p !== 'string' || p.includes('..') || p.startsWith('/')) errors.push(`${at}: 路徑「${p}」要相對於 <Game>/`);
    for (const p of list(n.gate?.must)) if (!ruleIds.some(r => idMatch(r, [p]))) errors.push(`${at}: gate 引用不存在的規則 ${p}`);
    for (const t of list(n.gate?.tests)) if (!testIds.includes(t)) errors.push(`${at}: gate.tests 引用不存在的測試卡 ${t}`);
    for (const sel of list(n.pull?.kb)) for (const [k, vs] of Object.entries(sel)) {
      if (k === 'kind') { for (const v of list(vs)) if (!vocab.kinds.has(v)) errors.push(`${at}: kind「${v}」不在詞彙`); continue; }
      if (!FACET_KEYS.includes(k)) { errors.push(`${at}: pull.kb 不認得的 facet ${k}`); continue; }
      for (const v of list(vs)) {
        if (typeof v === 'string' && v.startsWith('$profile.')) { if (!FACET_KEYS.includes(v.slice(9))) errors.push(`${at}: ${v} 不是 profile 欄位`); }
        else if (v !== '*' && !vocab.facets[k].has(v)) errors.push(`${at}: ${k}「${v}」不在 shared/index/facets.json`);
      }
    }
  }
  for (const n of nodes) {
    for (const a of list(n.after)) if (!ids.has(a)) errors.push(`${NODES_FILE} ${n.id}: after 引用不存在的節點 ${a}`);
    for (const f of list(n.onFail)) {
      if (!ids.has(f.goto)) errors.push(`${NODES_FILE} ${n.id}: onFail 路由到不存在的節點 ${f.goto}`);
      if (f.rule && !list(n.gate?.must).some(p => idMatch(f.rule.replace(/\*$/, ''), [p]) || idMatch(p.replace(/\*$/, ''), [f.rule])))
        warnings.push(`${NODES_FILE} ${n.id}: onFail 的 ${f.rule} 不在本節點 gate`);
      if (!f.rule && !f.when) errors.push(`${NODES_FILE} ${n.id}: onFail 每項要有 rule 或 when`);
    }
  }
  try { topoOrder(nodes); } catch (e) { errors.push(e.message); }
  return { errors, warnings };
}

// ---------- hashes ----------
function walk(p) {
  if (!existsSync(p)) return [];
  if (!statSync(p).isDirectory()) return [p];
  return readdirSync(p).sort().flatMap(f => (f === 'node_modules' || f === 'dist' ? [] : walk(join(p, f))));
}
/** sha256 (first 16 hex) over each path's files and contents; a missing path hashes as "missing". */
export function hashPaths(base, paths) {
  const h = createHash('sha256');
  for (const p of [...new Set(paths)].sort()) {
    const files = walk(join(base, p));
    if (!files.length) h.update(`${p}\0missing\0`);
    for (const f of files) h.update(`${f.slice(base.length).replace(/\\/g, '/')}\0`).update(readFileSync(f)).update('\0');
  }
  return h.digest('hex').slice(0, 16);
}
export function nodeHashes(root, game, nodes, node, profile = readProfile(root, game)) {
  const byId = new Map(nodes.map(n => [n.id, n])), base = join(root, game);
  const inputs = [...upstream(nodes, node.id)].flatMap(id => nodeProduces(byId.get(id), profile)).concat(list(node.requires));
  return { inputHash: hashPaths(base, inputs), outputHash: hashPaths(base, nodeProduces(node, profile)) };
}

// ---------- events ----------
const FIELDS = ['schema', 'eventId', 'parent', 'type', 'node', 'iteration', 'inputHash', 'outputHash', 'result', 'needsApproval',
  'rules', 'tests', 'route', 'rollback', 'approval', 'at'];
export function formatEvent(ev, body = '') {
  const keys = [...FIELDS.filter(k => k in ev), ...Object.keys(ev).filter(k => !FIELDS.includes(k))];
  return `---\n${keys.map(k => `${k}: ${JSON.stringify(ev[k])}`).join('\n')}\n---\n${body}`;
}
export function parseEvent(text) {
  const m = text.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  return Object.fromEntries(m[1].split(/\r?\n/).filter(l => l.trim()).map(l => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), JSON.parse(l.slice(i + 1).trim())];
  }));
}
export function readEvents(root, game) {
  const dir = join(root, game, LOOP_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.md')).map(f => ({ ...parseEvent(readFileSync(join(dir, f), 'utf8')), file: f }))
    .filter(e => e.eventId).sort((a, b) => a.at.localeCompare(b.at) || a.eventId.localeCompare(b.eventId));
}
function writeEvent(root, game, ev, body) {
  const dir = join(root, game, LOOP_DIR);
  mkdirSync(dir, { recursive: true });
  const n = readdirSync(dir).filter(f => f.includes(`-${ev.node}-`)).length + 1;
  const date = ev.at.slice(0, 10), stem = `${date}-${ev.node}-${n}`;
  const full = { schema: 1, eventId: stem, ...ev };
  writeFileSync(join(dir, `${stem}.md`), formatEvent(full, body));
  return { ...full, file: `${stem}.md` };
}

/**
 * Pure: node states from the events and the current hashes ({ [id]: { inputHash, outputHash } }).
 * status: todo | passed | waived | awaiting-approval | failed | blocked | escalated | stale | reopened
 */
export function deriveStatus(nodes, events, hashes) {
  const out = {};
  for (const n of nodes) {
    const cur = hashes[n.id], mine = events.filter(e => e.node === n.id);
    const gates = mine.filter(e => e.type === 'gate'), last = gates.at(-1);
    const tries = gates.filter(e => e.inputHash === cur.inputHash).length;
    const fails = gates.filter(e => e.inputHash === cur.inputHash && e.result === 'fail').length;
    const approvals = mine.filter(e => e.type === 'approval' && e.outputHash === cur.outputHash && e.inputHash === cur.inputHash);
    const waived = approvals.find(e => e.approval?.waive);
    const reopen = events.filter(e => e.rollback === n.id).at(-1);
    let status;
    if (waived) status = 'waived';
    else if (!last) status = 'todo';
    else if (last.inputHash !== cur.inputHash || last.outputHash !== cur.outputHash) status = 'stale';
    else if (last.result === 'pass') status = !last.needsApproval || approvals.some(e => e.at >= last.at) ? 'passed' : 'awaiting-approval';
    else if (fails >= n.maxIterations) status = 'escalated';
    else status = last.result === 'blocked' ? 'blocked' : 'failed';
    if (reopen && DONE.has(status) && reopen.at > (waived ?? last).at) status = 'reopened';
    out[n.id] = { status, iteration: tries, fails, maxIterations: n.maxIterations, last: last?.eventId ?? null, ...cur };
  }
  const order = topoOrder(nodes), byId = new Map(nodes.map(n => [n.id, n]));
  const ready = order.filter(id => !DONE.has(out[id].status) && byId.get(id).after.every(a => DONE.has(out[a].status)));
  return { nodes: out, current: ready[0] ?? null, ready, done: order.every(id => DONE.has(out[id].status)) };
}

export function gameStatus(root, game, doc = loadNodes(root)) {
  const nodes = doc.nodes;
  const profile = readProfile(root, game);
  const hashes = Object.fromEntries(nodes.map(n => [n.id, nodeHashes(root, game, nodes, n, profile)]));
  const st = deriveStatus(nodes, readEvents(root, game), hashes);
  const cache = join(root, game, 'loop');
  mkdirSync(cache, { recursive: true });
  writeFileSync(join(cache, 'state.json'), JSON.stringify({ note: `快取，可刪；由 ${LOOP_DIR}/ 重建（loop.mjs status）`, ...st }, null, 1) + '\n');
  return st;
}

// ---------- gate ----------
/** Order gate tests: cheap first (all run), then medium / heavy / human (stop at the first failure). */
export function planGate(tests) {
  return [...tests].sort((a, b) => COST_ORDER.indexOf(a.cost) - COST_ORDER.indexOf(b.cost) || a.id.localeCompare(b.id));
}

/**
 * How the gate reads a finished test process (r = spawnSync result). Convention for test cards:
 *   0 = pass; 2 = the test could not run (misuse, a refused run, a file it cannot read); anything else = the check
 *   ran and failed. "Could not run" blocks the gate but is not a failed attempt.
 * A process that never started (spawn error), was killed by a signal, or that the shell could not find (127 POSIX,
 * 9009 Windows cmd) also could not run. Limit: some shells report a missing command as 1, which reads as a failure.
 * A card that returns 1 when its input data is missing (instead of 2) is read as a failure too: the convention holds
 * only for cards that follow it (see knowledge-base/decisions/2026-11-11-generality-backlog.md §10, step 4b).
 */
export function classifyRun(r) {
  const tail = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-3).join(' ⏎ ').slice(0, 300);
  if (r.error || r.status === null || r.status === undefined) {
    const why = r.error ? r.error.message : r.signal ? `被訊號 ${r.signal} 終止` : '沒有結束碼';
    return { ok: false, blocked: true, detail: `無法啟動（不算未過）：${why}${tail ? ` ⏎ ${tail}` : ''}` };
  }
  if (r.status === 0) return { ok: true, detail: '' };
  if (r.status === 2 || r.status === 127 || r.status === 9009) {
    const what = r.status === 2 ? '無法執行' : '找不到指令';
    return { ok: false, blocked: true, detail: `exit ${r.status}（${what}，不算未過）：${tail}` };
  }
  return { ok: false, detail: `exit ${r.status}：${tail}` };
}

function defaultRunner(t, root) {
  return classifyRun(spawnSync(t.run, { cwd: join(root, t.cwd === '.' ? '' : t.cwd), shell: true, encoding: 'utf8', maxBuffer: 64 << 20 }));
}
async function defaultAuditor(root, game, opts) { return (await import('./game-audit.mjs')).auditGame(root, game, opts); }

/**
 * Run one node's gate. Returns { result: pass|fail|blocked, needsApproval, rules, tests, missing }.
 * opts.runner(test, root) -> { ok, detail, blocked? } and opts.auditor(root, game, { profile }) -> audit results are injectable for tests;
 * opts.profile / opts.resolver go to buildContext, opts.pack replaces it altogether.
 */
export async function runGate(root, game, node, opts = {}) {
  const runner = opts.runner ?? defaultRunner, auditor = opts.auditor ?? defaultAuditor;
  const { errors, pack } = opts.pack ? { errors: [], pack: opts.pack } : buildContext(root, game, node, { profile: opts.profile, resolver: opts.resolver });
  if (!pack) throw new Error(errors.join('\n'));
  // Gate rules the profile cannot answer yet: must-level ones block the gate, should-level ones only show up as rows.
  const pendingGate = (pack.pending ?? []).filter(p => p.gate);
  const missing = nodeProduces(node, opts.profile ?? readProfile(root, game)).filter(p => !existsSync(join(root, game, p)));
  const gateRules = pack.rules.filter(r => r.gate);
  const registry = opts.registry ?? readJson(join(root, 'knowledge-base', 'index', 'tests.json')).tests;
  const extra = list(node.gate?.tests).filter(id => !pack.tests.some(t => t.id === id)).map(id => {
    const t = registry.find(x => x.id === id), miss = t.needs.filter(n => !existsSync(join(root, game, n)));
    return { id, kind: t.kind, cost: t.cost, implements: [], run: t.run ?? null, cwd: t.cwd.replace('<Game>', game), runnable: !miss.length, missing: miss };
  });
  const wanted = pack.tests.filter(t => t.implements.some(r => gateRules.some(g => g.id === r)) || list(node.gate?.tests).includes(t.id)).concat(extra);

  const tests = [];
  let audit = null, stopped = false;
  for (const t of planGate(wanted)) {
    const row = { id: t.id, cost: t.cost };
    if (t.kind === 'review') { tests.push({ ...row, status: 'review', detail: '人工審查（log --approve）' }); continue; }
    if (!t.runnable) { tests.push({ ...row, status: 'blocked', detail: `缺 ${t.missing.join('、')}` }); continue; }
    if (stopped && t.cost !== 'cheap') { tests.push({ ...row, status: 'not-run', detail: '前一個 medium / heavy 測試失敗，未跑（不算通過）' }); continue; }
    if (t.kind === 'audit') {
      audit = await auditor(root, game, { profile: opts.profile });   // the audit judges the same profile as the context and the produces check
      tests.push({ ...row, status: 'ran', detail: `${audit.length} 項檢查` });
      continue;
    }
    const r = runner({ ...t, run: t.run.replace(/<Game>/g, game) }, root);
    if (r.blocked) { tests.push({ ...row, status: 'blocked', detail: r.detail }); continue; }   // could not run: not a failure, nothing to stop for
    tests.push({ ...row, status: r.ok ? 'pass' : 'fail', detail: r.detail });
    // Only a failure that can fail the gate stops the rest: a test for a must rule or a node gate test (not a should-only one).
    const blocking = list(node.gate?.tests).includes(t.id) || t.implements.some(id => gateRules.some(g => g.id === id && g.level === 'must'));
    if (!r.ok && t.cost !== 'cheap' && blocking) stopped = true;
  }

  const rules = gateRules.map(r => {
    const by = wanted.filter(t => t.implements.includes(r.id)), rows = by.map(t => tests.find(x => x.id === t.id));
    let result, detail = '';
    if (!by.length) { result = 'not-run'; detail = '沒有測試卡'; }
    else if (rows.some(x => x.status === 'review')) {
      result = 'review';
      detail = by.flatMap(t => (t.checklists ?? []).filter(c => c.rule === r.id).map(c => c.checklist)).join('；') || '人工審查';
    }
    else if (audit && by.some(t => t.kind === 'audit')) {   // audit is null when the audit card could not run (missing files): fall through to not-run
      // An audit row carries its own level: a should-level row that fails warns, even under a must rule.
      const items = audit.filter(x => x.rule === r.id), bad = items.filter(x => !x.ok), hard = bad.filter(x => x.level !== 'should');
      result = hard.length ? 'fail' : bad.length ? 'warn' : 'pass';
      detail = bad.length ? bad.map(x => `${x.item}：${x.detail}`).join('；').slice(0, 300) : items.length ? `${items.length} 項通過` : '本作沒有適用的檢查項';
    } else if (rows.some(x => x.status === 'fail')) { result = 'fail'; detail = rows.find(x => x.status === 'fail').detail; }
    else if (rows.some(x => x.status === 'blocked' || x.status === 'not-run')) { result = 'not-run'; detail = rows.find(x => x.status !== 'pass').detail; }
    else result = 'pass';
    if (result === 'fail' && r.level !== 'must') result = 'warn';
    return { id: r.id, level: r.level, result, detail };
  }).concat(pendingGate.map(p => ({ id: p.id, level: p.level, result: 'pending', detail: `game.profile.json 缺 ${p.missing.join('、')}，無法判斷是否適用` })));

  const mustRules = rules.filter(r => r.level === 'must');
  const extraFail = tests.some(t => extra.some(e => e.id === t.id) && t.status === 'fail');
  const extraBlocked = tests.some(t => list(node.gate?.tests).includes(t.id) && ['blocked', 'not-run'].includes(t.status));
  // Context errors (invalid profile, floor cards over the budget, stale index) and pending must rules mean the gate
  // cannot be trusted: blocked, whatever the tests said.
  const result = missing.length || errors.length || mustRules.some(r => r.result === 'pending') ? 'blocked'
    : mustRules.some(r => r.result === 'fail') || extraFail ? 'fail'
      : mustRules.some(r => r.result === 'not-run') || extraBlocked ? 'blocked' : 'pass';
  const needsApproval = Boolean(node.checkpoint) || rules.some(r => r.result === 'review');
  return { result, needsApproval, rules, tests, missing, errors };
}

/** Where to go after a gate: next nodes on pass; most upstream onFail target on failure; a person past maxIterations. */
export function routeFor(nodes, node, gate, fails) {
  const order = topoOrder(nodes);
  if (gate.result === 'pass') {
    const next = nodes.filter(n => n.after.includes(node.id)).map(n => n.id);
    return { goto: next.length ? next : null, reason: gate.needsApproval ? '關卡通過，等人工核准（log --approve）' : '關卡通過' };
  }
  if (fails >= node.maxIterations) return { goto: 'human', reason: `同一輸入已失敗 ${fails} 次（上限 ${node.maxIterations}）：停下來交給人，附最後三輪紀錄；不得改門檻` };
  if (gate.result === 'blocked') {
    const pend = list(gate.rules).filter(r => r.result === 'pending' && r.level === 'must').map(r => r.id);
    const reason = list(gate.errors).length ? `取用器回報錯誤，先修正：${gate.errors.join('；')}`
      : pend.length ? `game.profile.json 資料待補，無法判斷 ${pend.join('、')} 是否適用；補齊後重跑`
        : gate.missing.length ? `缺產出：${gate.missing.join('、')}` : '有測試無法執行（缺檔或未跑），補齊後重跑';
    return { goto: node.id, reason };
  }
  const failed = gate.rules.filter(r => r.result === 'fail').map(r => r.id);
  const owner = id => {                                     // a rule with no onFail goes to the most upstream node gating it
    const hit = list(node.onFail).find(f => f.rule && idMatch(id, [f.rule]));
    if (hit) return hit.goto;
    const gating = order.filter(x => { const g = nodes.find(n => n.id === x).gate; return !list(g?.must).includes('*') && idMatch(id, list(g?.must)); });
    return gating[0] ?? node.id;
  };
  const targets = [...new Set(failed.map(owner))];
  if (!targets.length) targets.push(node.id);
  const goto = targets.sort((a, b) => order.indexOf(a) - order.indexOf(b))[0];
  const hints = list(node.onFail).filter(f => f.goto === goto && f.hint).map(f => f.hint);
  return { goto, reason: `${failed.join('、') || '關卡測試'} 未過${hints.length ? `；${hints.join('；')}` : ''}` };
}

// ---------- bootstrap §0 must-read table (generated) ----------
export const MUSTREAD_FILE = '.claude/skills/lite-skillgame-stack/references/bootstrap.md';
const BEGIN = '<!-- generated:loop-mustread (shared/loop/nodes.json × knowledge-base/index/kb.json; node shared/tools/index-build.mjs) -->';
const END = '<!-- /generated:loop-mustread -->';

/** The table for a generic profile (see below). Pages in the order their cards enter the pack. */
export function mustReadTable(root, doc = loadNodes(root)) {
  // "*" on every facet except source: a generic new game is original; adaptations get the af-* cards through N2's
  // { source: "$profile.source" } selector, which the note under the table points to.
  const profile = { ...Object.fromEntries(FACET_KEYS.map(k => [k, ['*']])), ...Object.fromEntries(PROFILE_FLAGS.map(k => [k, '*'])), source: ['original'] };
  const rows = ['| 節點 | 必讀（知識卡所在頁；`*` profile、節點預算內） | 產出 | 關卡 |', '|---|---|---|---|'];
  for (const n of doc.nodes) {
    const { pack } = buildContext(root, '<NewGame>', n, { profile });
    const pages = new Map();
    for (const c of pack.cards) pages.set(c.path, (pages.get(c.path) ?? 0) + 1);
    const read = [...pages].map(([p, k]) => `[${p.replace(/^knowledge-base\//, '').replace(/\.md$/, '')}](../../../../${p})（${k}）`).join('、') || '—';
    const gate = [...list(n.gate?.must).map(x => (x === '*' ? '全部有效規則' : `\`${x}\``)), ...list(n.gate?.tests).map(x => `\`${x}\``)];
    const produced = [...list(n.produces).map(p => `\`${p}\``), ...Object.entries(n.producesWhen ?? {}).flatMap(([flag, paths]) => list(paths).map(p => `\`${p}\`（\`${flag}\` 時）`))];
    rows.push(`| **${n.id}** ${n.name}${n.checkpoint ? ' ✋' : ''} | ${read} | ${produced.join('、') || '—'} | ${gate.join('、') || '—'} |`);
  }
  return `${BEGIN}\n${rows.join('\n')}\n\n✋ = 人工檢查點。括號內是取到的段落數。本作實際要讀的段落（依 profile、含全文）：\`node shared/tools/loop.mjs next <Game>\`。\n${END}`;
}
/** Replace the generated region of bootstrap.md; returns { text, changed } or an error when the markers are missing. */
export function applyMustRead(root, doc) {
  const p = join(root, MUSTREAD_FILE), text = readFileSync(p, 'utf8');
  const i = text.indexOf(BEGIN), j = text.indexOf(END);
  if (i < 0 || j < i) return { error: `${MUSTREAD_FILE} 缺 generated:loop-mustread 標記` };
  // Keep the file's own line endings: a Windows checkout with autocrlf has CRLF, and an LF table inside it would always look stale.
  const CRLF = String.fromCharCode(13, 10);
  const table = text.includes(CRLF) ? mustReadTable(root, doc).split(String.fromCharCode(10)).join(CRLF) : mustReadTable(root, doc);
  const next = text.slice(0, i) + table + text.slice(j + END.length);
  return { path: p, text: next, changed: next !== text };
}

// ---------- CLI ----------
const STATUS_LABEL = { todo: '未開始', passed: '✅ 通過', waived: '✅ 核准略過', 'awaiting-approval': '✋ 等核准', failed: '❌ 未過', blocked: '⛔ 無法驗證',
  escalated: '🆘 交給人', stale: '♻ 需重驗', reopened: '↩ 被退回' };

function printStatus(doc, st, game) {
  console.log(`# ${game} 迴圈狀態（由 ${game}/${LOOP_DIR}/ 重建）\n`);
  console.log('| 節點 | 狀態 | 本輸入第幾輪 | 最後紀錄 |\n|---|---|---|---|');
  for (const n of doc.nodes) { const s = st.nodes[n.id]; console.log(`| ${n.id} ${n.name} | ${STATUS_LABEL[s.status]} | ${s.iteration}/${s.maxIterations} | ${s.last ?? '—'} |`); }
  console.log(`\n${st.done ? '全部節點完成。' : `目前節點：**${st.current}**${st.ready.length > 1 ? `（可並行：${st.ready.slice(1).join('、')}）` : ''}`}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/').endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
// The CLI runs in main(), not at top level: a top-level await here would leave this module mid-evaluation while
// runGate dynamically imports game-audit → index-build → loop.mjs, and that cycle never settles.
if (isMain) main().catch(e => { console.error(e); process.exit(1); });

async function main() {
  const [cmd, game, ...rest] = process.argv.slice(2);
  const opt = n => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : null; };
  const usage = () => { console.error('用法：node shared/tools/loop.mjs status|next|gate|log <Game> [--node <id>] …（見檔頭）'); process.exit(2); };
  if (!['status', 'next', 'gate', 'log'].includes(cmd) || !game) usage();
  const root = findRoot(process.cwd()), doc = loadNodes(root);
  if (!existsSync(join(root, game, 'game.profile.json'))) { console.error(`缺 ${game}/game.profile.json`); process.exit(2); }
  const v = checkNodes(doc, { ruleIds: loadRules({ from: root }).rules.map(r => r.id), testIds: readJson(join(root, 'shared', 'tests', 'registry.json')).tests.map(t => t.id), vocab: loadVocabulary(root) });
  if (v.errors.length) { console.error(v.errors.join('\n')); process.exit(1); }
  let st = gameStatus(root, game, doc);
  const nodeId = opt('--node') ?? st.current;
  const node = doc.nodes.find(n => n.id === nodeId);
  if (cmd !== 'status' && !node) { console.error(nodeId ? `沒有節點 ${nodeId}` : '全部節點已完成'); process.exit(nodeId ? 2 : 0); }
  const s = node && st.nodes[node.id];
  const notReady = node ? node.after.filter(a => !DONE.has(st.nodes[a].status)) : [];

  if (cmd === 'status') {
    if (rest.includes('--json')) console.log(JSON.stringify(st, null, 1)); else printStatus(doc, st, game);
  } else if (cmd === 'next') {
    printStatus(doc, st, game);
    console.log(`\n## 下一步：${node.id} ${node.name} — 本輸入第 ${s.iteration + 1} 輪（上限 ${node.maxIterations}）\n`);
    if (notReady.length) console.log(`⚠ 上游尚未通過：${notReady.join('、')}（可以先做，但關卡結果在上游通過前只供參考）\n`);
    if (s.status === 'escalated') {
      console.log('🆘 已達 maxIterations：停下來交給人。最後三輪：');
      for (const e of readEvents(root, game).filter(e => e.node === node.id).slice(-3)) console.log(`- ${game}/${LOOP_DIR}/${e.file}：${e.result}，${e.route?.reason ?? ''}`);
      process.exit(3);
    }
    console.log(`只改：${nodeProduces(node, readProfile(root, game)).map(p => `\`${p}\``).join('、') || '（不改檔，只驗證）'}${node.checkpoint ? `；人工檢查點：${node.checkpoint}` : ''}\n`);
    const { errors, warnings, pack } = buildContext(root, game, node);
    process.stdout.write(renderPack(pack, errors, warnings));
  } else if (cmd === 'gate') {
    const gate = await runGate(root, game, node);
    const fails = s.fails + (gate.result === 'fail' ? 1 : 0);
    const route = routeFor(doc.nodes, node, gate, fails);
    const at = new Date().toISOString();
    console.log(`# ${game} @ ${node.id} 關卡：${gate.result}${gate.needsApproval && gate.result === 'pass' ? '（等人工核准）' : ''}\n`);
    console.log('| 規則 | 層級 | 結果 | 說明 |\n|---|---|---|---|');
    for (const r of gate.rules) console.log(`| ${r.id} | ${r.level} | ${r.result} | ${r.detail} |`);
    console.log('\n| 測試卡 | cost | 狀態 | 說明 |\n|---|---|---|---|');
    for (const t of gate.tests) console.log(`| ${t.id} | ${t.cost} | ${t.status} | ${t.detail} |`);
    if (gate.errors.length) console.log(`\n✘ 取用器錯誤：\n${gate.errors.map(e => `- ${e}`).join('\n')}`);
    if (gate.missing.length) console.log(`\n缺產出：${gate.missing.join('、')}`);
    if (notReady.length) console.log(`\n⚠ 上游尚未通過：${notReady.join('、')}`);
    console.log(`\n路由 → ${Array.isArray(route.goto) ? route.goto.join('、') : route.goto ?? '（終點）'}：${route.reason}`);
    if (!rest.includes('--dry')) {
      const events = readEvents(root, game);
      const ev = writeEvent(root, game, {
        parent: events.at(-1)?.eventId ?? null, type: 'gate', node: node.id, iteration: s.iteration + 1,
        inputHash: s.inputHash, outputHash: s.outputHash, result: gate.result, needsApproval: gate.needsApproval,
        rules: gate.rules.map(r => ({ id: r.id, result: r.result })), tests: gate.tests.map(t => ({ id: t.id, status: t.status })),
        route, rollback: gate.result === 'fail' && route.goto !== node.id && route.goto !== 'human' ? route.goto : null, approval: null, at,
      }, [
        `# ${node.id} ${node.name} — 第 ${s.iteration + 1} 輪：${gate.result}`, '',
        '| 規則 | 結果 | 說明 |', '|---|---|---|', ...gate.rules.map(r => `| ${r.id} | ${r.result} | ${r.detail.replace(/\|/g, '\\|')} |`), '',
        '| 測試卡 | 狀態 | 說明 |', '|---|---|---|', ...gate.tests.map(t => `| ${t.id} | ${t.status} | ${t.detail.replace(/\|/g, '\\|')} |`), '',
        `路由 → ${Array.isArray(route.goto) ? route.goto.join('、') : route.goto ?? '（終點）'}：${route.reason}`, '',
        '## 假設', '', opt('--hypothesis') ?? '（未填）', '', '## 改了什麼', '', opt('--changes') ?? '（未填）', '', '## 下一步', '', opt('--next') ?? '（未填）', '',
      ].join('\n'));
      console.log(`\n紀錄：${game}/${LOOP_DIR}/${ev.file}`);
    }
    process.exit(gate.result === 'pass' ? 0 : 1);
  } else if (cmd === 'log') {
    const approve = opt('--approve'), rollback = opt('--rollback'), note = opt('--note');
    if (!approve && !rollback && !note) usage();
    if (rollback && !doc.nodes.some(n => n.id === rollback)) { console.error(`沒有節點 ${rollback}`); process.exit(2); }
    const waive = rest.includes('--waive');
    if (approve && !waive && s.status !== 'awaiting-approval') { console.error(`${node.id} 目前是「${STATUS_LABEL[s.status]}」，沒有待核准的關卡結果（要核准略過請加 --waive 並寫 --note 理由）`); process.exit(1); }
    if (waive && !note) { console.error('--waive 必須附 --note 寫明理由'); process.exit(2); }
    const events = readEvents(root, game);
    const ev = writeEvent(root, game, {
      parent: events.at(-1)?.eventId ?? null, type: approve ? 'approval' : rollback ? 'rollback' : 'note', node: node.id,
      inputHash: s.inputHash, outputHash: s.outputHash, rollback: rollback ?? null,
      approval: approve ? { by: approve, ...(waive ? { waive: true } : {}) } : null, at: new Date().toISOString(),
    }, `# ${node.id} ${approve ? (waive ? `核准略過（${approve}）` : `核准（${approve}）`) : rollback ? `退回 ${rollback}` : '備註'}\n\n${note ?? ''}\n`);
    st = gameStatus(root, game, doc);
    console.log(`紀錄：${game}/${LOOP_DIR}/${ev.file}；${node.id} → ${STATUS_LABEL[st.nodes[node.id].status]}`);
  }
}
