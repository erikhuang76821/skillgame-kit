// Paper pilot: walk every loop node with a made-up profile (no game folder) and dump what the libraries hand out.
// usage: node shared/experiments/2026-11-11-paper-pilots/walk-nodes.mjs <solitaire|pool|word> [outDir]
//        per-node packs go to outDir (default ./out/<pilot>, git-ignored); the summary is printed and saved there too.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..', '..', '..'), which = process.argv[2] ?? 'solitaire', out = resolve(process.argv[3] ?? join(here, 'out', which));
mkdirSync(out, { recursive: true });
const imp = p => import(pathToFileURL(root + '/shared/tools/' + p).href);
const { buildContext, renderPack } = await imp('context.mjs');
const { loadNodes } = await imp('loop.mjs');
const { loadVocabulary } = await imp('kb-index.mjs');
const vocab = loadVocabulary(root);
// What the designer would WANT to write, vs. what the vocabulary accepts.
// want = what the designer would write; profile = the nearest values the vocabulary accepts today.
const J = { source: ['original'], jurisdiction: ['TW', 'US-*'] };
const PILOTS = {
  // Timed Klondike, same deal for everyone: discrete moves, hidden cards, card faces.
  solitaire: { want: { genre: ['solitaire'], skillAxis: ['planning', 'speed'], renderer: ['dom'], artStyle: ['flat-vector'], ...J },
    profile: { genre: ['sort-puzzle'], skillAxis: ['planning'], renderer: ['2d'], artStyle: ['procedural'], ...J } },
  // Pool trick-shot challenge: one shot at a time (angle + power), deterministic physics, same racks for everyone.
  pool: { want: { genre: ['physics'], skillAxis: ['aim', 'planning'], renderer: ['2d'], artStyle: ['realistic'], ...J },
    profile: { genre: ['physics'], skillAxis: ['aim', 'planning'], renderer: ['2d'], artStyle: ['realistic'], ...J } },
  // Timed word-finding on a seeded letter grid, scored against a dictionary (zh-TW / en word lists).
  word: { want: { genre: ['word'], skillAxis: ['vocabulary', 'speed'], renderer: ['dom'], artStyle: ['typographic'], ...J },
    profile: { genre: ['block-puzzle'], skillAxis: ['planning', 'reaction'], renderer: ['2d'], artStyle: ['procedural'], ...J } },
};
if (!PILOTS[which]) { console.error('pilot must be one of: ' + Object.keys(PILOTS).join(', ')); process.exit(2); }
const want = PILOTS[which].want;
const bad = Object.entries(want).flatMap(([k, vs]) => vs.filter(v => !vocab.facets[k]?.has(v)).map(v => `${k}=${v}`));
console.log('profile values the vocabulary rejects:', bad.join(', ') || '(none)');
const game = 'Paper-' + which, profile = { schemaVersion: 1, game, ...PILOTS[which].profile };
const rows = [];
for (const n of loadNodes(root).nodes) {
  let r;
  try { r = buildContext(root, game, n, { profile }); } catch (e) { rows.push({ node: n.id, crash: e.message.split('\n')[0] }); continue; }
  const p = r.pack;
  rows.push({ node: n.id, name: n.name, produces: n.produces, gate: n.gate, errors: r.errors, warnings: r.warnings,
    rules: p?.rules.map(x => `${x.id}${x.gate ? '*' : ''}(${x.level})`), tests: p?.tests.map(t => `${t.id}:${t.runnable ? 'ok' : 'missing ' + t.missing.join('+')}`),
    cards: p?.cards.map(c => `${c.id} [${c.tokens}t]`), gaps: p?.gaps, assets: p?.assets?.length });
  if (p) writeFileSync(`${out}/${n.id}.md`, renderPack(p, r.errors, r.warnings));
}
writeFileSync(join(out, 'summary.json'), JSON.stringify(rows, null, 1));
for (const r of rows) console.log(`\n## ${r.node} ${r.name ?? ''}${r.crash ? ' CRASH ' + r.crash : ''}\n produces: ${JSON.stringify(r.produces)}\n rules: ${r.rules?.join(', ')}\n tests: ${r.tests?.join(', ')}\n cards(${r.cards?.length}): ${r.cards?.map(c => c.split(' ')[0]).join(', ')}\n errors: ${r.errors?.join(' | ')}\n assets: ${r.assets}`);
