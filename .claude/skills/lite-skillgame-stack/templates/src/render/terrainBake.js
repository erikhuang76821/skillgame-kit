// Terrain surface baker — pure functions (no Pixi / DOM), so it runs in tests and in a worker.
// Implements knowledge-base/11 ③: the grid decides shape and collision; this file only decides
// how the surface looks.
//  - Shape = smoothCellAt() (rounded corners; the sim can use the same function for collision)
//    displaced by seeded noise: a long wave so edges never run straight, a short wave for texture.
//  - Total displacement <= `edge` art px, so the drawn boundary stays within `edge` of the shape
//    the sim collides with.
//  - Same-material areas merge with no seam (material tiles are sampled in world coordinates).
//  - A few grains of the neighbour material near boundaries; a broad brightness drift hides tiling.
import { hash32, valueNoise, smoothCellAt } from '../sim/core/index.js';

// Render-only noise streams (kept apart from the sim's streams used by makeTerrain).
const WARP_X = 101, WARP_Y = 102, LONG_X = 103, LONG_Y = 104, GRAIN_X = 105, GRAIN_Y = 106, GRAIN_PICK = 107, MACRO = 108;

const offset = (v, amp) => ((v * (2 * amp + 1)) >>> 16) - amp;   // 0..65535 -> -amp..+amp

/**
 * @param t   terrain from makeTerrain()
 * @param o   { seed, tile: art px per cell, edge: max total displacement (art px, keep < tile / 2),
 *              edgeScale: short-wave length, edgeLongScale: long-wave length (art px),
 *              grain: % of near-boundary pixels that show the neighbour material }
 */
export function makeSampler(t, { seed, tile, edge, edgeScale, edgeLongScale = edgeScale * 5, grain = 0 }) {
  const long = Math.ceil((edge * 2) / 3), short = edge - long;
  const g = Math.max(1, edge >> 1), gScale = Math.max(2, edgeScale >> 1);
  const longWarp = (px, py, amp) => [
    px + offset(valueNoise(seed, LONG_X, px, py, edgeLongScale), amp),
    py + offset(valueNoise(seed, LONG_Y, px, py, edgeLongScale), amp),
  ];
  const warp = (px, py) => {
    const [lx, ly] = longWarp(px, py, long);
    return [lx + offset(valueNoise(seed, WARP_X, px, py, edgeScale), short), ly + offset(valueNoise(seed, WARP_Y, px, py, edgeScale), short)];
  };
  return {
    tile, edge,
    /** Height level at world art-px (px, py): the full `edge` on the long wave only (no short wave,
     *  no grains), so plateau rims curve without leaving 1-px cliff slivers. */
    level(px, py) { const [wx, wy] = longWarp(px, py, edge); return smoothCellAt(t, 'level', wx, wy, tile); },
    /** Same, plus the warped point (to look up which elevated component it belongs to). */
    levelPoint(px, py) { const [wx, wy] = longWarp(px, py, edge); return { level: smoothCellAt(t, 'level', wx, wy, tile), wx, wy }; },
    /** Material shown at art-px (px, py). */
    mat(px, py) {
      const [wx, wy] = warp(px, py);
      const m = smoothCellAt(t, 'mat', wx, wy, tile);
      if (!grain) return m;
      const gx = wx + offset(valueNoise(seed, GRAIN_X, px, py, gScale), g), gy = wy + offset(valueNoise(seed, GRAIN_Y, px, py, gScale), g);
      const n = smoothCellAt(t, 'mat', gx, gy, tile);
      return n !== m && hash32(seed, GRAIN_PICK, (px & 0xffff) | ((py & 0xffff) << 16)) % 100 < grain ? n : m;
    },
  };
}

/** Seamless quantized noise tile: { w, h, data: RGBA }. `cell` must divide `size`. Palette = [[r,g,b], …] dark→light. */
export function noiseTile(seed, stream, size, palette, cell = 8) {
  const data = new Uint8ClampedArray(size * size * 4), period = size / cell;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    // two octaves, both periodic over the tile
    const v = (valueNoise(seed, stream, x, y, cell, period) * 2 + valueNoise(seed, stream + 1, x, y, cell >> 1 || 1, period * 2)) / 3;
    const c = palette[Math.min(palette.length - 1, Math.floor((v * palette.length) / 65536))];
    const i = (y * size + x) * 4;
    data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
  }
  return { w: size, h: size, data };
}

const texel = (tex, x, y) => (((((y % tex.h) + tex.h) % tex.h) * tex.w) + (((x % tex.w) + tex.w) % tex.w)) * 4;

/**
 * 4-connected components of elevated cells (level > 0). Each component becomes one occluder: a
 * front sprite y-sorted with the actors, so an actor standing behind the plateau is drawn under it.
 * @returns { id: Int32Array (0 = ground, k = component k), comps: [{ north, south, minX, maxX }] } (cell units)
 */
export function elevatedComponents(t) {
  const id = new Int32Array(t.cols * t.rows), comps = [];
  for (let start = 0; start < id.length; start++) {
    if (id[start] || !t.level[start]) continue;
    const c = { north: Infinity, south: -1, minX: Infinity, maxX: -1 }, k = comps.push(c), stack = [start];
    id[start] = k;
    while (stack.length) {
      const i = stack.pop(), x = i % t.cols, y = (i - x) / t.cols;
      c.north = Math.min(c.north, y); c.south = Math.max(c.south, y); c.minX = Math.min(c.minX, x); c.maxX = Math.max(c.maxX, x);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= t.cols || ny >= t.rows) continue;
        const n = ny * t.cols + nx;
        if (!id[n] && t.level[n]) { id[n] = k; stack.push(n); }
      }
    }
  }
  return { id, comps };
}

/** Component under a warped point: its own cell, else an elevated cell of the bilinear quad (rounded corners reach into neighbours). */
function compAt(t, comps, wx, wy, tile) {
  const cx = Math.min(t.cols - 1, Math.max(0, Math.floor(wx / tile))), cy = Math.min(t.rows - 1, Math.max(0, Math.floor(wy / tile)));
  const own = comps.id[cy * t.cols + cx];
  if (own) return own;
  const half = tile >> 1, i = Math.floor((wx - half) / tile), j = Math.floor((wy - half) / tile);
  for (const [x, y] of [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]]) {
    if (x < 0 || y < 0 || x >= t.cols || y >= t.rows) continue;
    const c = comps.id[y * t.cols + x];
    if (c) return c;
  }
  return 0;
}

/**
 * Bake the screen-space art-px rectangle (x0, y0, w, h) with a 3/4 height projection:
 * the surface of a level-L point at world (x, y) appears at screen (x, y - L * cliffPx), and the
 * exposed south side of a higher area is drawn as a cliff face. Low ground just north of a plateau
 * is therefore hidden behind it, exactly like an actor standing there.
 * @param tex    { materials: { [id]: tile }, cliff: tile | null }
 * @param style  { cliffPx: screen height per level (art px), levelLight: +brightness per level,
 *                 lipLight: highlight on the first face row, faceDark: 0..1 darkening toward the face foot,
 *                 macro: ± brightness drift, macroScale: its wavelength (art px), maxLevel, seed }
 * @param occ    optional { t, comps, tile } from elevatedComponents(): also returns which component
 *               each pixel shows (0 = level-0 ground) so the renderer can cut occluder sprites.
 * @returns { rgba: Uint8ClampedArray, comp: Uint16Array | null }
 */
export function bakeRegion(sampler, tex, x0, y0, w, h, style = {}, occ = null) {
  const { cliffPx = 0, levelLight = 0, lipLight = 0, faceDark = 0, maxLevel = 0, macro = 0, macroScale = 96, seed = 0 } = style;
  const H = tex.cliff ? cliffPx : 0, reach = H * maxLevel;
  const lw = w + 2, rows = h + reach;                    // world rows y0 .. y0+h+reach; 1-px side margin for rims
  const lev = new Uint8Array(lw * rows), wcomp = occ ? new Uint16Array(lw * rows) : null;
  for (let y = 0; y < rows; y++) for (let x = -1; x <= w; x++) {
    const p = sampler.levelPoint(x0 + x, y0 + y), k = y * lw + x + 1;
    lev[k] = p.level;
    if (occ && p.level) wcomp[k] = compAt(occ.t, occ.comps, p.wx, p.wy, occ.tile);
  }
  // Visible column for each screen pixel: the south-most world row whose column reaches up to it.
  const vis = new Int32Array(lw * h);                    // world row offset j (0..reach) of the visible column
  for (let y = 0; y < h; y++) for (let x = -1; x <= w; x++) {
    let j = reach;
    for (; j > 0; j--) if (j <= lev[(y + j) * lw + x + 1] * H) break;
    vis[y * lw + x + 1] = j;
  }
  const visLevel = (x, y) => lev[(y + vis[y * lw + x + 1]) * lw + x + 1];
  const rgba = new Uint8ClampedArray(w * h * 4), comp = occ ? new Uint16Array(w * h) : null;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const j = vis[y * lw + x + 1], k = (y + j) * lw + x + 1, L = lev[k];
    const px = x0 + x, wy = y0 + y + j, o = (y * w + x) * 4;
    let src, sy = wy, add = 0, mul = 1;
    if (j < L * H) {                                     // exposed south side of a higher column
      const Ls = lev[k + lw], v = L * H - j, face = (L - Ls) * H;
      src = tex.cliff; sy = v; add = v === 1 ? lipLight : 0;
      mul = 1 - (faceDark * (v - 1)) / Math.max(1, face - 1);
    } else {                                             // top surface of the column
      src = tex.materials[sampler.mat(px, wy)];
      add = levelLight * L;
      if (macro) add += offset(valueNoise(seed, MACRO, px, wy, macroScale), macro);
      if (faceDark && (visLevel(x - 1, y) > L || visLevel(x + 1, y) > L)) mul = 1 - faceDark / 2;   // side rim
    }
    if (comp && L) comp[y * w + x] = wcomp[k];
    const i = texel(src, px, sy);
    rgba[o] = src.data[i] * mul + add; rgba[o + 1] = src.data[i + 1] * mul + add; rgba[o + 2] = src.data[i + 2] * mul + add; rgba[o + 3] = 255;
  }
  return { rgba, comp };
}
