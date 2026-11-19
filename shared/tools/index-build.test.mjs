import { existsSync } from 'node:fs';
// Tests for index-build.mjs: the central asset index is valid, complete, reproducible and up to date.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, loadManifests, KINDS, STATUSES } from './index-build.mjs';
import { findRoot } from './rules.mjs';
// skillgame-kit 只收錄遊戲的文字規格；需要完整遊戲程式（TwinStrike/game 等）的整合測試在此略過。
const FULL_REPO = { skip: !existsSync(new URL('../../TwinStrike/game/package.json', import.meta.url)) && '需要完整遊戲範例（本精簡版未收錄遊戲程式）' };

const root = findRoot(fileURLToPath(import.meta.url));
const norm = s => s.replace(/\r\n/g, '\n');

test('every manifest validates: unique ids, known kinds / statuses, files exist, references resolve, hashes match', () => {
  const { errors } = loadManifests(root);
  assert.deepEqual(errors, []);
});

test('the index holds every manifest asset, tagged with its game', FULL_REPO, () => {
  const { manifests } = loadManifests(root);
  const idx = JSON.parse(buildIndex(root).json);
  assert.equal(idx.assets.length, manifests.reduce((n, { m }) => n + m.assets.length, 0));
  assert.ok(idx.assets.every(a => a.game && KINDS.includes(a.kind) && STATUSES.includes(a.status)));
  assert.ok(idx.counts.byGame.TwinStrike > 0 && idx.counts.byGame.SwarmDuel > 0 && idx.counts.byGame.shared > 0);
});

test('a rebuild is byte-identical (no timestamps), so --check can gate commits', () => {
  const a = buildIndex(root), b = buildIndex(root);
  assert.equal(a.json, b.json); assert.equal(a.md, b.md);
});

test('the committed knowledge-base/index files are up to date', () => {
  const { json, md } = buildIndex(root);
  assert.equal(norm(readFileSync(join(root, 'knowledge-base', 'index', 'assets.json'), 'utf8')), json);
  assert.equal(norm(readFileSync(join(root, 'knowledge-base', 'index', 'INDEX.md'), 'utf8')), md);
});
