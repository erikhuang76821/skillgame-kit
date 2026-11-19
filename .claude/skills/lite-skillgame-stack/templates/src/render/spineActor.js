// Spine actor wrapper (spine-pixi-v8 4.3): track 0 = base loop, track 1+ = overlays, skins swapped in place.
// Needs `npm i @esotericsoftware/spine-pixi-v8@<editor major.minor>`; not in the template's default deps.
import { Assets } from 'pixi.js';
import { Spine, Skin } from '@esotericsoftware/spine-pixi-v8';

export async function loadSpine(alias, skelUrl, atlasUrl) {
  Assets.add({ alias: `${alias}-data`, src: skelUrl });
  Assets.add({ alias: `${alias}-atlas`, src: atlasUrl });
  await Assets.load([`${alias}-data`, `${alias}-atlas`]);
}

export class SpineActor {
  constructor(alias, { scale = 1, mix = 0.2 } = {}) {
    this.view = Spine.from({ skeleton: `${alias}-data`, atlas: `${alias}-atlas`, scale });
    this.state = this.view.state;
    this.skeleton = this.view.skeleton;
    this.state.data.defaultMix = mix;            // cross-fade every animation pair
  }

  /** Per-pair override when the default mix feels wrong (e.g. run -> idle should stop faster). */
  mix(from, to, sec) { this.state.data.setMix(from, to, sec); }

  /** Track 0: legs / base loop. No-op if already playing, so it is safe to call every frame. */
  base(name, loop = true) {
    const cur = this.state.tracks[0];
    if (cur?.animation?.name === name) return cur;
    return this.state.setAnimation(0, name, loop);
  }

  /** Track 1+: upper-body one-shot (attack, cast, hit), then fade the track back out. */
  overlay(name, { track = 1, fadeOut = 0.2 } = {}) {
    const entry = this.state.setAnimation(track, name, false);
    this.state.addEmptyAnimation(track, fadeOut, 0);
    return entry;
  }

  /** Combine part skins ('body/base', 'weapon/axe', ...) without rebuilding the Spine object. */
  wear(...skinNames) {
    const skin = new Skin('outfit');
    for (const n of skinNames) {
      const s = this.skeleton.data.findSkin(n);
      if (!s) throw new Error(`Spine skin not found: ${n}`);
      skin.addSkin(s);
    }
    this.skeleton.setSkin(skin);
    this.skeleton.setupPoseSlots();
  }

  /** Swap one slot's attachment (weapon, hat). null clears it. */
  equip(slot, attachment) { this.skeleton.setAttachment(slot, attachment); }

  /** Render-only hit-stop: freeze this actor for `sec`. */
  freeze(sec) {
    this.view.autoUpdate = false;
    clearTimeout(this._freeze);
    this._freeze = setTimeout(() => { this.view.autoUpdate = true; }, sec * 1000);
  }
}
