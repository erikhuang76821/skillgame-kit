// Code-driven particles: one ParticleContainer, one shared texture (a white dot), fixed-size pool -> 1 draw call.
import { ParticleContainer, Particle, Graphics } from 'pixi.js';
import { FEEL } from './feel.js';

export class Particles {
  /** @param {import('pixi.js').Renderer} renderer */
  constructor(renderer) {
    // Generated once at boot; in production put a 4x4 white dot in the main atlas instead.
    this.texture = renderer.generateTexture(new Graphics().circle(4, 4, 4).fill(0xffffff));
    this.view = new ParticleContainer({
      texture: this.texture,
      dynamicProperties: { position: true, vertex: true, color: true, rotation: false, uvs: false },
    });
    this.view.blendMode = 'add';
    this.live = [];   // { p, vx, vy, t, life }
  }

  burst(x, y, tint = 0xffd23a, n = FEEL.particles.burst) {
    if (!FEEL.enabled) n = Math.ceil(n / 3);
    const { speed, life, max } = FEEL.particles;
    for (let i = 0; i < n; i++) {
      if (this.live.length >= max) this.kill(0);           // drop the oldest instead of growing
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
      const p = new Particle({ texture: this.texture, x, y, anchorX: 0.5, anchorY: 0.5, tint });
      this.view.addParticle(p);
      this.live.push({ p, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: life * (0.6 + Math.random() * 0.4) });
    }
  }

  kill(i) {
    this.view.removeParticle(this.live[i].p);
    this.live.splice(i, 1);
  }

  /** @param {number} dt seconds (render time) */
  update(dt) {
    const g = FEEL.particles.gravity;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const o = this.live[i];
      o.t += dt;
      if (o.t >= o.life) { this.kill(i); continue; }
      o.vy += g * dt;
      o.p.x += o.vx * dt; o.p.y += o.vy * dt;
      const k = 1 - o.t / o.life;
      o.p.alpha = k; o.p.scaleX = o.p.scaleY = 0.5 + k;
    }
  }
}
