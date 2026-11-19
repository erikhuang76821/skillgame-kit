// Every juice tunable lives here. Effects read FEEL at call time, so editing window.FEEL in dev takes effect live.
// Durations in seconds, distances in CSS / logical px. Copy tuned values back into this file.
export const FEEL = {
  enabled: true,                       // false = LOW effects / prefers-reduced-motion
  shake: {
    light: { px: 4, dur: 0.12 },
    crit: { px: 8, dur: 0.25 },
    boss: { px: 14, dur: 0.4 },
    step: 0.032,                       // seconds per random offset; smaller = buzzier
    rotPerPx: 0.05,                    // degrees of rotation per px of offset
  },
  hitStop: { light: 0.03, crit: 0.06, boss: 0.1 }, // render-only freeze
  flash: { alpha: 0.6, dur: 0.12 },
  hurt: { dur: 0.6, ease: 'power2.out' },
  squash: { sx: 1.25, sy: 0.8, in: 0.06, out: 0.2, outEase: 'elastic.out(1, 0.35)' },
  popup: { rise: 40, dur: 0.6, ease: 'power3.out' },
  shockwave: { radius: 260, width: 40, amp: 18, dur: 0.45, ease: 'power2.out' },
  particles: { burst: 24, speed: 420, life: 0.5, gravity: 900, max: 512 },
  ui: { in: 0.25, out: 0.15, inEase: 'back.out(1.7)', outEase: 'power2.in', stagger: 0.04 },
};

if (import.meta.env?.DEV) window.FEEL = FEEL;
