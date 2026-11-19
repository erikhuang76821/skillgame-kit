// "X-ray" outline for actors hidden behind terrain (or any occluder): a 1-px ring around the
// sprite's opaque pixels, generated once per texture at boot (0 bytes of download), drawn in a
// layer ABOVE the occluders and shown only while TerrainView.isOccluded() says so.
// Keep the colour out of the terrain palette and away from reserved danger hues (knowledge-base/11 A3).
import { Sprite, Texture } from 'pixi.js';

const cache = new WeakMap();

/** Outline texture for `texture` (same frame size + 2 px border). Cached per texture. */
export function outlineTexture(renderer, texture, color = 0xe7eef5) {
  let out = cache.get(texture);
  if (out) return out;
  const { pixels, width: w, height: h } = renderer.extract.pixels({ target: new Sprite(texture), resolution: 1 });
  const W = w + 2, H = h + 2, data = new Uint8ClampedArray(W * H * 4);
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && pixels[(y * w + x) * 4 + 3] > 127;
  const r = color >> 16, g = (color >> 8) & 255, b = color & 255;
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
    if (solid(x, y)) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
      const o = ((y + 1) * W + x + 1) * 4;
      data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.getContext('2d').putImageData(new ImageData(data, W, H), 0, 0);
  out = Texture.from(canvas);
  out.source.scaleMode = 'nearest';
  cache.set(texture, out);
  return out;
}

/** Outline sprite that follows `actor` (same anchor, position and scale). Put it in a layer above the occluders. */
export function makeXray(renderer, actor, color) {
  const tex = outlineTexture(renderer, actor.texture, color);
  const s = new Sprite(tex);
  // Align the 1-px border: anchor shifted by one texel on each side.
  s.anchor.set((actor.anchor.x * actor.texture.width + 1) / tex.width, (actor.anchor.y * actor.texture.height + 1) / tex.height);
  s.visible = false;
  s.alpha = 0.9;
  return {
    sprite: s,
    /** Call after moving the actor each frame. */
    sync(occluded) {
      s.visible = occluded && actor.visible;
      if (!s.visible) return;
      s.position.copyFrom(actor.position);
      s.scale.copyFrom(actor.scale);
    },
  };
}
