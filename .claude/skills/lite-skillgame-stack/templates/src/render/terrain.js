// Terrain layer: bakes the surface into chunk textures once, shows them as plain sprites, never
// rebuilds per frame. Shape and passability come from the grid (src/sim/core/grid.js); this is look only.
//
// Occlusion (2.5D): every elevated component (plateau) is also cut into "front" sprites placed in
// the actors' y-sorted layer with zIndex = the plateau's north edge. An actor standing north of it
// (behind) sorts first and is covered; actors on top or in front sort after it. isOccluded() tells
// the caller when to show the actor's outline (render/xray.js).
//
// Coordinates: art px. World (x, y, level) -> screen-art (x, y - level * cliffPx); multiply by
// cfg.scale for screen px. Actor zIndex = world feet y (art px).
import { Container, Sprite, Texture } from 'pixi.js';
import { makeSampler, noiseTile, bakeRegion, elevatedComponents } from './terrainBake.js';

const toTexture = (rgba, w, h) => {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').putImageData(new ImageData(rgba, w, h), 0, 0);
  const texture = Texture.from(canvas);
  texture.source.scaleMode = 'nearest';     // pixel art: no smoothing when scaled up
  return texture;
};

/**
 * Load material tiles that come from art (cfg.materials[i].src, e.g. a generated texture that passed
 * tools/tile_prep.py + tile_check.py) as { w, h, data } for the baker. Materials without `src` keep
 * the procedural noiseTile().
 */
export async function loadTiles(cfg) {
  const out = {};
  await Promise.all(cfg.materials.filter(m => m.src).map(async m => {
    // onload, not img.decode(): decode() can stay pending while the page is in a background tab.
    const img = await new Promise(res => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => { console.warn(`terrain tile ${m.src} failed; using the procedural tile`); res(null); };
      i.src = m.src;
    });
    if (!img) return;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    out[m.id] = { w: c.width, h: c.height, data: g.getImageData(0, 0, c.width, c.height).data };
  }));
  return out;
}

export class TerrainView {
  /**
   * @param terrain  makeTerrain() result (built by the sim when terrain affects gameplay)
   * @param cfg      TERRAIN from terrainConfig.js
   * @param seed     match seed (render-only noise derives from it, so every client sees the same edges)
   * @param front    optional sortable Container holding the actors; occluder sprites go there
   * @param tiles    optional { [materialId]: tile } from loadTiles(); overrides the procedural tile
   */
  constructor(terrain, cfg, seed, front = null, tiles = {}) {
    this.cfg = cfg;
    this.front = front;
    this.view = new Container();
    this.view.scale.set(cfg.scale);
    this.chunks = new Map();                   // "cx,cy" -> { sprite, occluders[], comp, used }
    this.frame = 0;
    this.sampler = makeSampler(terrain, {
      seed, tile: cfg.tile, edge: cfg.edge, edgeScale: cfg.edgeScale, edgeLongScale: cfg.edgeLongScale, grain: cfg.grain,
    });
    this.tex = {
      materials: Object.fromEntries(cfg.materials.map((m, k) => [m.id, tiles[m.id] ?? noiseTile(seed, 200 + k * 2, cfg.texSize, m.palette, cfg.texCell)])),
      cliff: cfg.cliff ? noiseTile(seed, 240, cfg.texSize, cfg.cliff.palette, cfg.texCell >> 1 || 1) : null,
    };
    this.style = { ...cfg.style, seed, maxLevel: Math.max(0, ...(cfg.levels ?? []).map(l => l.value)) };
    this.cliffPx = this.tex.cliff ? cfg.style.cliffPx : 0;
    this.comps = elevatedComponents(terrain);
    // Sort key per component: just north of its north edge. smoothCellAt() never puts plateau ground
    // north of the north-most cell row, so an actor standing on the plateau (feet y >= north edge)
    // always sorts in front, and one on low ground behind it (feet y < north edge) sorts under it.
    this.keys = this.comps.comps.map(c => c.north * cfg.tile - 1);
    this.occ = { t: terrain, comps: this.comps, tile: cfg.tile };
  }

  /** Screen-art y of an actor's feet. */
  screenY(worldY, level = 0) { return worldY - level * this.cliffPx; }

  /** Make sure chunks covering the screen-px rect (x, y, w, h) exist; evict the least recently used beyond the cache size. */
  update(x, y, w, h) {
    const size = this.cfg.chunk * this.cfg.scale;
    const x0 = Math.floor(x / size), y0 = Math.floor(y / size), x1 = Math.floor((x + w - 1) / size), y1 = Math.floor((y + h - 1) / size);
    this.frame++;
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const key = `${cx},${cy}`;
      const c = this.chunks.get(key) ?? this.bake(cx, cy, key);
      c.used = this.frame;
    }
    if (this.chunks.size > this.cfg.cacheChunks) {
      const old = [...this.chunks].filter(([, c]) => c.used !== this.frame).sort((a, b) => a[1].used - b[1].used);
      for (const [key, c] of old.slice(0, this.chunks.size - this.cfg.cacheChunks)) {
        for (const s of [c.sprite, ...c.occluders]) s.destroy({ texture: true, textureSource: true });
        this.chunks.delete(key);
      }
    }
  }

  bake(cx, cy, key) {
    const n = this.cfg.chunk, ox = cx * n, oy = cy * n;
    const { rgba, comp } = bakeRegion(this.sampler, this.tex, ox, oy, n, n, this.style, this.front ? this.occ : null);
    const sprite = new Sprite(toTexture(rgba, n, n));
    sprite.position.set(ox, oy);
    this.view.addChild(sprite);
    const occluders = this.front ? this.cutOccluders(rgba, comp, ox, oy) : [];
    const c = { sprite, occluders, comp, used: this.frame };
    this.chunks.set(key, c);
    return c;
  }

  /** One sprite per component present in the chunk: its pixels only, cropped to its bounding box. */
  cutOccluders(rgba, comp, ox, oy) {
    const n = this.cfg.chunk, boxes = new Map();
    for (let i = 0; i < comp.length; i++) {
      const k = comp[i];
      if (!k) continue;
      const x = i % n, y = (i - x) / n, b = boxes.get(k);
      if (b) { b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x); b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y); }
      else boxes.set(k, { x0: x, x1: x, y0: y, y1: y });
    }
    const out = [];
    for (const [k, b] of boxes) {
      const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1, px = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const s = (y + b.y0) * n + x + b.x0;
        if (comp[s] !== k) continue;
        px.set(rgba.subarray(s * 4, s * 4 + 4), (y * w + x) * 4);
      }
      const sprite = new Sprite(toTexture(px, w, h));
      sprite.scale.set(this.cfg.scale);
      sprite.position.set((ox + b.x0) * this.cfg.scale, (oy + b.y0) * this.cfg.scale);
      sprite.zIndex = this.keys[k - 1];
      this.front.addChild(sprite);
      out.push(sprite);
    }
    return out;
  }

  /** Component drawn at screen-art pixel (sx, sy), 0 = ground / not baked. */
  compAtScreen(sx, sy) {
    const n = this.cfg.chunk, c = this.chunks.get(`${Math.floor(sx / n)},${Math.floor(sy / n)}`);
    if (!c?.comp) return 0;
    return c.comp[(((sy % n) + n) % n) * n + (((sx % n) + n) % n)];
  }

  /**
   * Is any part of an actor's rectangle covered by a plateau that sorts in front of it?
   * @param x, y    world feet position (art px); level = the level the actor stands on
   * @param w, h    actor size (art px), anchored at the feet (bottom centre)
   */
  isOccluded(x, y, level, w, h, samples = 5) {
    const sy0 = this.screenY(y, level);
    for (let i = 0; i < samples; i++) for (let j = 0; j < samples; j++) {
      const sx = Math.round(x - w / 2 + ((i + 0.5) * w) / samples), sy = Math.round(sy0 - ((j + 0.5) * h) / samples);
      const k = this.compAtScreen(sx, sy);
      if (k && this.keys[k - 1] > y) return true;
    }
    return false;
  }
}
