// Deterministic terrain grids: integer value noise, seeded material / height maps, autotile masks.
// Pure integer math (hash32 + * / and Math.floor/trunc on safe integers), so the sim, the server
// replay and the render baker all get the same grid from the same seed.
import { hash32 } from './rng.js';
import { createHasher } from './hash.js';

export const NOISE_MAX = 65535;

/** Lattice value 0..65535 at integer lattice point (ix, iy); `period` (in lattice cells) wraps for seamless tiles. */
function lattice(seed, stream, ix, iy, period) {
  if (period) { ix = ((ix % period) + period) % period; iy = ((iy % period) + period) % period; }
  return hash32(seed >>> 0, stream, ((ix & 0xffff) | ((iy & 0xffff) << 16)) >>> 0) >>> 16;
}

/**
 * Smooth value noise in 0..65535 at integer point (x, y) with lattice spacing `cell`.
 * `stream` is a small integer (keep a table per game, like makeRng stream ids).
 * `period` = repeat every `period` lattice cells (tile size = period * cell) for seamless textures.
 */
export function valueNoise(seed, stream, x, y, cell, period = 0) {
  const ix = Math.floor(x / cell), iy = Math.floor(y / cell);
  const tx = Math.trunc(((x - ix * cell) * 1024) / cell), ty = Math.trunc(((y - iy * cell) * 1024) / cell);
  const sx = Math.trunc((tx * tx * (3072 - 2 * tx)) / 1048576);   // smoothstep, 0..1024
  const sy = Math.trunc((ty * ty * (3072 - 2 * ty)) / 1048576);
  const a = lattice(seed, stream, ix, iy, period), b = lattice(seed, stream, ix + 1, iy, period);
  const c = lattice(seed, stream, ix, iy + 1, period), d = lattice(seed, stream, ix + 1, iy + 1, period);
  const top = a + Math.trunc(((b - a) * sx) / 1024), bot = c + Math.trunc(((d - c) * sx) / 1024);
  return top + Math.trunc(((bot - top) * sy) / 1024);
}

/** Fractal sum of `octaves` value-noise layers (cell halves, weight halves), still 0..65535. */
export function fbm(seed, stream, x, y, cell, octaves = 3, period = 0) {
  let sum = 0, total = 0, w = 1 << octaves;
  for (let o = 0; o < octaves && cell >= 1; o++) {
    sum += valueNoise(seed, stream * 16 + o, x, y, cell, period) * w;
    total += w;
    cell >>= 1; period *= 2; w >>= 1;
  }
  return Math.trunc(sum / total);
}

/** Pick the first band whose `upTo` (0..65535, ascending) is >= v. */
const band = (bands, v) => { for (const b of bands) if (v <= b.upTo) return b.value; return bands.at(-1).value; };

/**
 * Seeded terrain grid.
 * @param opts.cols, opts.rows   grid size in cells
 * @param opts.materials         [{ value: materialId, upTo: 0..65535 }] ascending thresholds on fbm noise
 * @param opts.levels            optional [{ value: heightLevel, upTo }] on a second noise stream
 * @param opts.scale             noise lattice spacing in cells (bigger = larger blobs)
 * @param opts.smooth            majority-filter passes that remove 1-cell specks (natural shapes)
 * @returns { cols, rows, mat: Uint8Array, level: Uint8Array }
 */
export function makeTerrain(seed, { cols, rows, materials, levels = null, scale = 8, octaves = 3, smooth = 2 }) {
  const n = cols * rows;
  const mat = new Uint8Array(n), level = new Uint8Array(n);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x;
    mat[i] = band(materials, fbm(seed, 1, x * 16, y * 16, scale * 16, octaves));
    if (levels) level[i] = band(levels, fbm(seed, 2, x * 16, y * 16, scale * 16, octaves));
  }
  for (let p = 0; p < smooth; p++) { majority(mat, cols, rows); if (levels) majority(level, cols, rows); }
  return { cols, rows, mat, level };
}

/** One majority pass (double-buffered, fixed order): a cell adopts a value held by >= 5 of its 8 neighbours. */
function majority(grid, cols, rows) {
  const src = grid.slice(), count = new Uint8Array(256);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    count.fill(0);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = Math.min(cols - 1, Math.max(0, x + dx)), ny = Math.min(rows - 1, Math.max(0, y + dy));
      count[src[ny * cols + nx]]++;
    }
    for (let v = 0; v < 256; v++) if (count[v] >= 5) { grid[y * cols + x] = v; break; }
  }
}

/** Cell value with edge clamping. */
export const cellAt = (t, field, x, y) =>
  t[field][Math.min(t.rows - 1, Math.max(0, y)) * t.cols + Math.min(t.cols - 1, Math.max(0, x))];

/**
 * Rounded-shape lookup at integer point (x, y), `tile` units per cell: the value whose bilinear
 * weight from the 4 nearest cell centres is largest (ties -> the cell containing the point).
 * Equals the cell's own value except near corners, which come out cut / rounded instead of
 * stair-stepped. Use the same function for collision so the sim matches what the renderer draws.
 */
export function smoothCellAt(t, field, x, y, tile) {
  const half = tile >> 1, fx = x - half, fy = y - half;
  const i = Math.floor(fx / tile), j = Math.floor(fy / tile);
  const u = fx - i * tile, v = fy - j * tile;
  const vals = [cellAt(t, field, i, j), cellAt(t, field, i + 1, j), cellAt(t, field, i, j + 1), cellAt(t, field, i + 1, j + 1)];
  const w = [(tile - u) * (tile - v), u * (tile - v), (tile - u) * v, u * v];
  const own = cellAt(t, field, Math.floor(x / tile), Math.floor(y / tile));
  let best = own, bestW = -1;
  for (let k = 0; k < 4; k++) {
    let sum = 0;
    for (let m = 0; m < 4; m++) if (vals[m] === vals[k]) sum += w[m];
    if (sum > bestW || (sum === bestW && vals[k] === own)) { bestW = sum; best = vals[k]; }
  }
  return best;
}

/**
 * Dual-grid autotile mask at grid vertex (vx, vy): bit 1 = top-left cell, 2 = top-right,
 * 4 = bottom-left, 8 = bottom-right is `value`. 0..15 picks one of 16 transition tiles.
 */
export function cornerMask(t, field, vx, vy, value) {
  return (cellAt(t, field, vx - 1, vy - 1) === value ? 1 : 0) | (cellAt(t, field, vx, vy - 1) === value ? 2 : 0)
       | (cellAt(t, field, vx - 1, vy) === value ? 4 : 0) | (cellAt(t, field, vx, vy) === value ? 8 : 0);
}

export function terrainHash(t) {
  const h = createHasher(t.cols * 65536 + t.rows);
  for (let i = 0; i < t.mat.length; i++) h.mix(t.mat[i] | (t.level[i] << 8));
  return h.value();
}
