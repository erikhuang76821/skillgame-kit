// Terrain guarantees from knowledge-base/11: deterministic grid, seamless tiles, visuals that match
// the collision shape, merged same-material areas, boundaries that never run straight.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTerrain, terrainHash, smoothCellAt, cellAt, valueNoise, fbm, cornerMask } from '../src/sim/core/index.js';
import { makeSampler, noiseTile, bakeRegion, elevatedComponents } from '../src/render/terrainBake.js';
import { TERRAIN } from '../src/render/terrainConfig.js';

const opts = {
  cols: TERRAIN.cols, rows: TERRAIN.rows, levels: TERRAIN.levels, ...TERRAIN.noise,
  materials: TERRAIN.materials.map(m => ({ value: m.id, upTo: m.upTo })),
};
const sampler = (t, seed = 9) => makeSampler(t, { seed, tile: TERRAIN.tile, edge: TERRAIN.edge, edgeScale: TERRAIN.edgeScale, edgeLongScale: TERRAIN.edgeLongScale, grain: TERRAIN.grain });
const flat = (cols, rows, fill) => ({ cols, rows, mat: Uint8Array.from({ length: cols * rows }, (_, i) => fill(i % cols, Math.floor(i / cols))), level: new Uint8Array(cols * rows) });

test('terrain grid is a pure function of the seed (golden hash; sim and server agree)', () => {
  const a = makeTerrain(20261019, opts), b = makeTerrain(20261019, opts);
  assert.equal(terrainHash(a), terrainHash(b));
  assert.equal(terrainHash(a), 1139027214);
  assert.notEqual(terrainHash(makeTerrain(1, opts)), terrainHash(a));
});

test('majority smoothing leaves no isolated single cells', () => {
  const t = makeTerrain(4242, opts);
  for (let y = 1; y < t.rows - 1; y++) for (let x = 1; x < t.cols - 1; x++) {
    const v = cellAt(t, 'mat', x, y);
    let same = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) same += cellAt(t, 'mat', x + dx, y + dy) === v;
    assert.ok(same > 0, `isolated cell at ${x},${y}`);
  }
});

test('noise tiles wrap seamlessly (period = tile size)', () => {
  for (let y = 0; y < 64; y += 7) {
    assert.equal(valueNoise(3, 5, 0, y, 8, 8), valueNoise(3, 5, 64, y, 8, 8));
    assert.equal(fbm(3, 5, y, 0, 16, 3, 4), fbm(3, 5, y, 64, 16, 3, 4));
  }
  const tile = noiseTile(7, 200, 64, [[10, 10, 10], [20, 20, 20], [30, 30, 30]], 8);
  assert.equal(tile.data.length, 64 * 64 * 4);
});

test('same material everywhere -> one continuous surface, no internal seams', () => {
  const t = flat(8, 8, () => 1);
  const s = sampler(t);
  for (let y = 0; y < 128; y += 3) for (let x = 0; x < 128; x += 3) assert.equal(s.mat(x, y), 1);
});

test('what is drawn matches the collision shape within `edge` art px', () => {
  const t = makeTerrain(777, opts), s = sampler(t), T = TERRAIN.tile, E = TERRAIN.edge;
  let checked = 0;
  for (let py = 0; py < 160; py++) for (let px = 0; px < 160; px++) {
    // The sim collides with smoothCellAt(); every pixel whose whole `edge` neighbourhood has one
    // shape value must be drawn with that value (grains included).
    const v = smoothCellAt(t, 'mat', px, py, T);
    let uniform = true;
    for (let d = -E - 2; d <= E + 2 && uniform; d += 2) for (let e = -E - 2; e <= E + 2 && uniform; e += 2)
      uniform = smoothCellAt(t, 'mat', px + d, py + e, T) === v;
    if (!uniform) continue;
    checked++;
    assert.equal(s.mat(px, py), v, `pixel ${px},${py}`);
  }
  assert.ok(checked > 10000);
});

test('boundaries wobble instead of running straight, and stay within `edge`', () => {
  const t = flat(12, 12, x => (x < 6 ? 0 : 2)), s = sampler(t), T = TERRAIN.tile, E = TERRAIN.edge;
  const xs = [];
  for (let py = 0; py < 192; py++) {
    let bx = 0;
    for (let px = 0; px < 192; px++) if (s.level(px, py) === 0 && s.mat(px, py) === 2 && s.mat(px - 1, py) === 0) { bx = px; break; }
    xs.push(bx);
  }
  const valid = xs.filter(Boolean);
  assert.ok(valid.length > 150);
  for (const x of valid) assert.ok(Math.abs(x - 6 * T) <= E + 1, `boundary at ${x}`);
  assert.ok(new Set(valid).size >= 5, 'boundary is a straight line');
});

test('corners are rounded, not stair-stepped', () => {
  // A lone 2x2 block: the convex corner of a lone block must lose its tip.
  const t = flat(6, 6, (x, y) => (x >= 2 && x < 4 && y >= 2 && y < 4 ? 1 : 0));
  assert.equal(smoothCellAt(t, 'mat', 2 * 16 + 1, 2 * 16 + 1, 16), 0, 'corner tip cut');
  assert.equal(smoothCellAt(t, 'mat', 3 * 16, 3 * 16, 16), 1, 'block centre kept');
});

test('dual-grid corner mask encodes the four neighbour cells', () => {
  const t = flat(2, 2, (x, y) => [1, 0, 0, 1][y * 2 + x]);
  assert.equal(cornerMask(t, 'mat', 1, 1, 1), 1 | 8);
});

const solid = c => ({ w: 1, h: 1, data: Uint8ClampedArray.of(c, c, c, 255) });
const plateauRows = (r0, r1) => ({ ...flat(4, 8, () => 0), level: Uint8Array.from({ length: 32 }, (_, i) => (Math.floor(i / 4) >= r0 && Math.floor(i / 4) <= r1 ? 1 : 0)) });

test('3/4 projection: plateau top lifted by cliffPx, south face below it, low ground untouched', () => {
  const t = plateauRows(0, 2);                                    // world rows 0..47 are level 1
  const s = makeSampler(t, { seed: 1, tile: 16, edge: 0, edgeScale: 8 });
  const { rgba } = bakeRegion(s, { materials: { 0: solid(100) }, cliff: solid(40) }, 0, 0, 64, 96, { cliffPx: 8, maxLevel: 1, levelLight: 10 });
  const at = y => rgba[(y * 64 + 30) * 4];
  assert.equal(at(10), 110, 'plateau top is lit');
  assert.equal(at(44), 40, 'face spans screen rows 40..47 (top of the south row lifted to 39)');
  assert.equal(at(52), 100, 'low ground south of the face is untouched');
});

test('occlusion: low ground just north of a plateau is covered by it, and sorts behind it', () => {
  const t = plateauRows(2, 3);                                    // plateau at world rows 32..63
  const s = makeSampler(t, { seed: 1, tile: 16, edge: 0, edgeScale: 8 });
  const comps = elevatedComponents(t);
  assert.equal(comps.comps.length, 1);
  const { comp } = bakeRegion(s, { materials: { 0: solid(100) }, cliff: solid(40) }, 0, 0, 64, 128, { cliffPx: 8, maxLevel: 1 }, { t, comps, tile: 16 });
  const at = y => comp[y * 64 + 30];
  assert.equal(at(22), 0, 'ground well behind the plateau stays visible');
  assert.equal(at(28), 1, 'world row 28 (level 0) is hidden under the lifted plateau top');
  assert.equal(at(60), 1, 'face');
  assert.equal(at(70), 0, 'ground in front');
  // TerrainView sort key = north edge - 1 (art px): actors behind sort under the occluder, others over it.
  const key = comps.comps[0].north * 16 - 1;
  assert.ok(28 < key, 'actor behind (feet y 28) is drawn under the plateau');
  assert.ok(40 >= key && 70 >= key, 'actors on top of / in front of the plateau are drawn over it');
  // The sim's own shape never puts plateau ground north of the north-most cell row, so no plateau
  // walker can have feet y < key.
  for (let x = 0; x < 64; x++) assert.equal(smoothCellAt(t, 'level', x, key, 16), 0);
});

test('bake is deterministic', () => {
  const t = makeTerrain(5, opts), tex = { materials: Object.fromEntries(TERRAIN.materials.map((m, k) => [m.id, noiseTile(5, 200 + k * 2, 32, m.palette, 8)])), cliff: null };
  const a = bakeRegion(sampler(t, 5), tex, 100, 50, 48, 48), b = bakeRegion(sampler(t, 5), tex, 100, 50, 48, 48);
  assert.deepEqual(a.rgba, b.rgba);
});
