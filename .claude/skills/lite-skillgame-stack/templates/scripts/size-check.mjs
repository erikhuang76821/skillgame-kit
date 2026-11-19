// Package budget gate. Fails when dist/ exceeds the target; warns on runtime CDN URLs.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
// Thresholds come from knowledge-base/index/rules.json through shared/tools/rules.mjs — never hard-coded here
// (knowledge-base/decisions/2026-10-21-kb-asset-architecture.md). The calling game's config/rules.overrides.json applies.
const RULES = await (async () => {
  let d = fileURLToPath(new URL('.', import.meta.url));
  while (!existsSync(join(d, 'shared', 'tools', 'rules.mjs'))) {
    const up = dirname(d);
    if (up === d) throw new Error('shared/tools/rules.mjs not found above ' + fileURLToPath(import.meta.url));
    d = up;
  }
  const { loadRules } = await import(pathToFileURL(join(d, 'shared', 'tools', 'rules.mjs')).href);
  return loadRules({ from: fileURLToPath(import.meta.url) });
})();
const TARGET = RULES.value('RULE-BUNDLE-SIZE', 'target'), HARD = RULES.value('RULE-BUNDLE-SIZE', 'hard');
const CDN = /https?:\/\/(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)[^"'`\s]*/g;

const walk = dir => readdirSync(dir).flatMap(n => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const cdnHits = [];
const rows = walk(DIST).map(path => {
  const buf = readFileSync(path);
  const text = /\.(js|css|html|json|svg)$/.test(path);
  const file = relative(DIST, path).split(sep).join('/');
  if (text) for (const m of buf.toString().matchAll(CDN)) cdnHits.push(`${file}: ${m[0]}`);
  return {
    file,
    raw: buf.length,
    gz: text ? gzipSync(buf, { level: 9 }).length : buf.length,
    br: text ? brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length : buf.length,
  };
}).sort((a, b) => b.raw - a.raw);

const kb = n => `${(n / 1024).toFixed(1).padStart(8)} KB`;
console.log(`${'file'.padEnd(44)}${'raw'.padStart(11)}${'gzip'.padStart(11)}${'brotli'.padStart(11)}`);
for (const r of rows) console.log(`${r.file.padEnd(44)}${kb(r.raw)}${kb(r.gz)}${kb(r.br)}`);
const sum = k => rows.reduce((s, r) => s + r[k], 0);
console.log(`${'TOTAL'.padEnd(44)}${kb(sum('raw'))}${kb(sum('gz'))}${kb(sum('br'))}`);
console.log(`budget: target ${kb(TARGET).trim()} / hard ${kb(HARD).trim()} (raw on disk)`);
// Library defaults (e.g. Pixi's KTX2 transcoder URL) show up here even when overridden — confirm each is overridden.
if (cdnHits.length) console.warn(`WARN: CDN URLs in bundle, make sure each is overridden to a local path:\n  ${[...new Set(cdnHits)].join('\n  ')}`);
if (sum('raw') > TARGET) { console.error(`FAIL: package exceeds the ${kb(TARGET).trim()} target (RULE-BUNDLE-SIZE)`); process.exit(1); }
console.log('OK');
