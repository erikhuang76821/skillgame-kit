// Screen shake by moving the DOM wrapper around the canvas (compositor transform: no layout, no WebGL cost).
import { gsap } from 'gsap';
import { FEEL } from './feel.js';

let tl = null, current = 0;

/** @param {HTMLElement} el  the #stage-shake wrapper  @param {'light'|'crit'|'boss'} kind */
export function shake(el, kind = 'light') {
  if (!FEEL.enabled) return;
  const { px, dur } = FEEL.shake[kind];
  if (tl?.isActive() && px < current) return;      // a stronger shake is already running
  tl?.kill();
  current = px;
  const steps = Math.max(3, Math.round(dur / FEEL.shake.step));
  tl = gsap.timeline({ defaults: { ease: 'none', duration: dur / steps, overwrite: 'auto' }, onComplete: () => { current = 0; } });
  for (let i = 0; i < steps; i++) {
    const k = px * (1 - i / steps);                // linear decay
    tl.to(el, { x: gsap.utils.random(-k, k), y: gsap.utils.random(-k, k), rotation: gsap.utils.random(-k, k) * FEEL.shake.rotPerPx });
  }
  tl.to(el, { x: 0, y: 0, rotation: 0, duration: 0.05, ease: 'power1.out' });
}
