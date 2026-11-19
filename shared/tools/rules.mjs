// Rule resolver (knowledge-base/decisions/2026-10-21-kb-asset-architecture.md §5).
// The ONLY place gate scripts get thresholds from: knowledge-base/index/rules.json, plus the calling game's
// <Game>/config/rules.overrides.json. A forbidden override, or one without a reason, is an error — never ignored.
//
//   import { loadRules } from '<repo>/shared/tools/rules.mjs';
//   const rules = loadRules({ from: fileURLToPath(import.meta.url) });   // game inferred from the caller's path
//   rules.value('RULE-BUNDLE-SIZE', 'target')                             // -> 8388608 (or the game's override)
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const RULES_FILE = join('knowledge-base', 'index', 'rules.json');

/** Repo root = nearest ancestor of `from` that holds knowledge-base/index/rules.json. */
export function findRoot(from) {
  let d = resolve(from);
  for (;;) {
    if (existsSync(join(d, RULES_FILE))) return d;
    const up = dirname(d);
    if (up === d) throw new Error(`rules: ${RULES_FILE} not found above ${from}`);
    d = up;
  }
}

/** The game folder (first path segment under the root) that `from` lives in, or null. */
function gameOf(root, from) {
  const rel = relative(root, resolve(from)).split(sep);
  const g = rel[0];
  return g && !g.startsWith('.') && existsSync(join(root, g, 'game')) ? g : null;
}

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));

/**
 * @param o { from: path inside the repo (caller's file), game?: override the inferred game }
 * @returns { root, game, rules, overrides, get(id), value(id, constraintName) }
 */
export function loadRules({ from = process.cwd(), game } = {}) {
  const root = findRoot(from);
  const doc = readJson(join(root, RULES_FILE));
  const byId = new Map();
  for (const r of doc.rules) {
    if (byId.has(r.id)) throw new Error(`rules: duplicate id ${r.id}`);
    byId.set(r.id, r);
  }
  const g = game ?? gameOf(root, from);
  const ovPath = g ? join(root, g, 'config', 'rules.overrides.json') : null;
  const overrides = ovPath && existsSync(ovPath) ? readJson(ovPath).overrides ?? [] : [];

  for (const o of overrides) {                       // validate every override up front
    const r = byId.get(o.rule);
    if (!r) throw new Error(`rules: ${g} overrides unknown rule ${o.rule}`);
    const c = r.constraints.find(x => x.name === o.constraint);
    if (!c) throw new Error(`rules: ${g} overrides unknown constraint ${o.rule}.${o.constraint}`);
    if (c.overridePolicy === 'forbid') throw new Error(`rules: ${o.rule}.${o.constraint} cannot be overridden (${g})`);
    if (!o.reason) throw new Error(`rules: ${g} override of ${o.rule}.${o.constraint} needs a reason`);
    const hard = r.constraints.find(x => x.name === 'hard');                 // a target may move, never past the hard limit
    if (hard && c !== hard && c.op === '<=' && o.value > hard.value) throw new Error(`rules: ${g} sets ${o.rule}.${o.constraint} above the hard limit`);
  }

  const get = id => {
    const r = byId.get(id);
    if (!r) throw new Error(`rules: unknown rule ${id}`);
    return r;
  };
  const value = (id, name) => {
    const c = get(id).constraints.find(x => x.name === name);
    if (!c) throw new Error(`rules: unknown constraint ${id}.${name}`);
    const o = overrides.find(x => x.rule === id && x.constraint === name);
    return o ? o.value : c.value;
  };
  return { root, game: g, rules: doc.rules, overrides, get, value };
}
