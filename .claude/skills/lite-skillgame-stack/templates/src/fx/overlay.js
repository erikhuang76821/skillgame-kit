// Hurt vignette and white flash as CSS overlays: 0 draw calls, 0 bytes of images.
import { gsap } from 'gsap';
import { FEEL } from './feel.js';

const vignette = document.getElementById('fx-vignette');
const flashEl = document.getElementById('fx-flash');

export function hurt(intensity = 1) {
  const { dur, ease } = FEEL.hurt;
  gsap.fromTo(vignette, { opacity: Math.min(1, intensity) },
    { opacity: 0, duration: FEEL.enabled ? dur : dur / 3, ease, overwrite: true });
}

export function flash() {
  if (!FEEL.enabled) return;                         // photosensitivity: no flashes in reduced mode
  gsap.fromTo(flashEl, { opacity: FEEL.flash.alpha },
    { opacity: 0, duration: FEEL.flash.dur, ease: 'power1.out', overwrite: true });
}
