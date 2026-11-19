// Dev-only draw call counter: wraps gl.draw* and reports the previous frame's count.
import { UPDATE_PRIORITY } from 'pixi.js';

/** @param {import('pixi.js').Application} app  @returns {() => number} last frame's draw calls (-1 on WebGPU) */
export function drawCallCounter(app) {
  const gl = app.renderer.gl;
  if (!gl) return () => -1;
  let n = 0, last = 0;
  for (const k of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
    const f = gl[k]?.bind(gl);
    if (f) gl[k] = (...a) => { n++; return f(...a); };
  }
  // HIGH runs before Pixi's render (LOW), so n holds exactly one finished frame here.
  app.ticker.add(() => { last = n; n = 0; }, null, UPDATE_PRIORITY.HIGH);
  return () => last;
}
