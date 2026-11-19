// Full-screen shockwave as a GLSL filter. Attached only while playing (each filter = an extra render pass).
// WebGL only; add a gpuProgram (WGSL) if the project enables WebGPU.
import { Filter, defaultFilterVert } from 'pixi.js';
import { gsap } from 'gsap';
import { FEEL } from './feel.js';

// highp is required: uInputSize is shared with the (highp) vertex stage, a precision mismatch fails to link.
const fragment = /* glsl */ `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;   // xy = input size px, zw = 1 / size
uniform vec4 uInputClamp;

uniform vec2 uCenter;      // px, relative to the filter area
uniform float uRadius;     // px, current ring radius
uniform float uWidth;      // px, half thickness of the ring
uniform float uAmp;        // px, max displacement

void main(void) {
  vec2 d = vTextureCoord * uInputSize.xy - uCenter;
  float dist = length(d);
  float x = clamp((dist - uRadius) / uWidth, -1.0, 1.0);
  float w = sin(x * 3.14159265) * (1.0 - abs(x));          // 0 outside the ring
  vec2 dir = dist > 0.0 ? d / dist : vec2(0.0);
  vec2 uv = clamp(vTextureCoord - dir * w * uAmp * uInputSize.zw, uInputClamp.xy, uInputClamp.zw);
  vec4 c = texture(uTexture, uv);
  c.rgb += c.a * (1.0 - abs(x)) * uAmp * 0.01;              // faint bright rim
  finalColor = c;
}`;

export class Shockwave {
  /** @param {import('pixi.js').Container} target  @param {import('pixi.js').Rectangle} area  usually app.screen */
  constructor(target, area) {
    this.target = target;
    this.target.filterArea = area;
    this.filter = Filter.from({
      gl: { vertex: defaultFilterVert, fragment, name: 'shockwave' },
      resources: {
        shock: {
          uCenter: { value: new Float32Array(2), type: 'vec2<f32>' },
          uRadius: { value: 0, type: 'f32' },
          uWidth: { value: 40, type: 'f32' },
          uAmp: { value: 0, type: 'f32' },
        },
      },
    });
    this.u = this.filter.resources.shock.uniforms;
    this.tween = null;
  }

  play(x, y) {
    if (!FEEL.enabled) return;
    const { radius, width, amp, dur, ease } = FEEL.shockwave;
    this.u.uCenter[0] = x; this.u.uCenter[1] = y;
    this.u.uWidth = width;
    this.target.filters = [this.filter];
    this.tween?.kill();
    this.tween = gsap.fromTo(this.u, { uRadius: 0, uAmp: amp }, {
      uRadius: radius, uAmp: 0, duration: dur, ease,
      onComplete: () => { this.target.filters = null; },   // drop the extra pass as soon as it ends
    });
  }
}
