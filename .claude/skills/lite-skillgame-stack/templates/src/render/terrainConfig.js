// Per-game terrain parameters (knowledge-base/11 §4). Numbers live here, never in the prompts or code.
// Demo values: muted, dark, low-saturation ground so the blue/green beat target and the red
// whiff vignette (reserved hues) stay the most readable things on screen.
export const TERRAIN = {
  cols: 48, rows: 32,          // grid cells (gameplay grid when terrain affects the sim)
  tile: 16,                    // art px per cell
  scale: 2,                    // screen px per art px (nearest-neighbour)
  chunk: 256,                  // art px per baked chunk; keep visible chunks <= 16 textures for one batch
  cacheChunks: 16,             // baked chunks kept in memory (VRAM ~ chunk^2 * 4 B each)
  edge: 7,                     // max boundary displacement, art px (< tile / 2: drawn edge stays near the collision shape)
  edgeScale: 10,               // short wobble wavelength, art px (texture of the edge)
  edgeLongScale: 64,           // long wobble wavelength, art px (keeps edges from running straight)
  grain: 22,                   // % of boundary pixels turned into specks of the neighbour material
  texSize: 128, texCell: 8,     // seamless material tile size and noise lattice (texSize % texCell === 0)
  noise: { scale: 7, octaves: 3, smooth: 2 },
  materials: [                 // fbm thresholds ascending; palette dark -> light, low contrast
    { id: 0, name: 'moss', upTo: 27000, passable: true, palette: [[30, 40, 42], [34, 45, 46], [38, 49, 50], [43, 54, 54]] },
    // Art tile: generated with knowledge-base/11 ② (prompt + provenance in assets/terrain/dust.prompt.txt),
    // post-processed by tools/tile_prep.py, checked by tools/tile_check.py. `palette` stays as the
    // procedural fallback (tests, or if the image fails to load).
    { id: 1, name: 'dust', upTo: 41000, passable: true, palette: [[46, 43, 39], [51, 48, 43], [56, 52, 47], [61, 57, 51]],
      src: new URL('../assets/terrain/dust.png', import.meta.url).href },
    { id: 2, name: 'slate', upTo: 65535, passable: true, palette: [[44, 48, 56], [49, 53, 61], [54, 58, 66], [59, 63, 71]] },
  ],
  levels: [{ value: 0, upTo: 43000 }, { value: 1, upTo: 65535 }],   // [] or omit for flat maps
  cliff: { palette: [[26, 28, 34], [31, 33, 39], [36, 38, 45]] },
  style: { cliffPx: 12, levelLight: 7, lipLight: 26, faceDark: 0.45, macro: 4, macroScale: 120 },
};
