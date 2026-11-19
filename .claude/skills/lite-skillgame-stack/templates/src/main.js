// Boot: Pixi app + fixed-step sim loop + render-only juice. Tap the screen; taps while the target is green are "perfect".
// The match is recorded by core/Recorder and re-verified on device at the end (the same check the server runs).
import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { Recorder, verify, makeTerrain } from './sim/core/index.js';
import { InputClock, TapQueue } from './sim/core/input.js';
import { encodeTap } from './sim/core/timing.js';
import { GAME, TICK_MS, windowOpen } from './sim/sim.js';
import { FEEL } from './fx/feel.js';
import { shake } from './fx/shake.js';
import { hurt, flash } from './fx/overlay.js';
import { Shockwave } from './fx/shockwave.js';
import { Particles } from './fx/particles.js';
import { TerrainView, loadTiles } from './render/terrain.js';
import { TERRAIN } from './render/terrainConfig.js';
import { makeXray } from './render/xray.js';
import { Sfx, comboPitch } from './audio/sfx.js';

// --- GSAP global settings (references/gsap.md §1) ---
gsap.defaults({ duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
gsap.config({ force3D: true, nullTargetWarn: import.meta.env.DEV });
gsap.ticker.lagSmoothing(500, 33);
gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
  FEEL.enabled = false;
  return () => { FEEL.enabled = true; };
});

// --- Pixi ---
const stage = document.getElementById('stage');
const shakeEl = document.getElementById('stage-shake');
const app = new Application();
await app.init({
  preference: 'webgl', resizeTo: stage, backgroundColor: 0x0e1620,
  antialias: false, autoDensity: true, resolution: Math.min(devicePixelRatio, 2),
});
shakeEl.appendChild(app.canvas);

const world = new Container();       // everything the shockwave distorts
const fxLayer = new Container();     // additive effects, drawn last so blend changes happen once
app.stage.addChild(world, fxLayer);

// Terrain (knowledge-base/11). Beat Tap ignores it, so it is decoration here; a game whose rules use
// terrain builds the grid inside createSim() with the same makeTerrain() call and passes sim.terrain.
const SEED = Number(new URLSearchParams(location.search).get('seed')) || 20261019;
const terrainGrid = makeTerrain(SEED, {
  cols: TERRAIN.cols, rows: TERRAIN.rows, levels: TERRAIN.levels, ...TERRAIN.noise,
  materials: TERRAIN.materials.map(m => ({ value: m.id, upTo: m.upTo })),
});
const camera = new Container();                              // scrolls the map; HUD-like target stays put
const actors = new Container({ sortableChildren: true });   // y-sorted: actors + plateau occluders
const xrayLayer = new Container();                           // outlines of actors hidden behind plateaus
const terrain = new TerrainView(terrainGrid, TERRAIN, SEED, actors, await loadTiles(TERRAIN));
camera.addChild(terrain.view, actors, xrayLayer);
world.addChild(camera);
const coverStage = () => terrain.update(-camera.x, -camera.y, app.screen.width, app.screen.height);

// Occlusion demo: a render-only walker patrols the low ground just north of the plateau nearest the
// map centre, and the camera frames it. Behind the plateau the walker sorts under the plateau's
// occluder sprite and its outline shows.
const walker = makeWalker();
coverStage();
function makeWalker() {
  const T = TERRAIN.tile, S = TERRAIN.scale, cell = (x, y) => terrainGrid.level[y * terrainGrid.cols + x];
  const cx = (terrainGrid.cols * T) / 2, cy = (terrainGrid.rows * T) / 2;
  const plateau = terrain.comps.comps
    .filter(c => c.north >= 2 && c.maxX - c.minX >= 2)
    .sort((a, b) => Math.hypot((a.minX + a.maxX + 1) * T / 2 - cx, a.north * T - cy) - Math.hypot((b.minX + b.maxX + 1) * T / 2 - cx, b.north * T - cy))[0];
  if (!plateau) return null;
  camera.position.set(
    Math.round(app.screen.width / 2 - ((plateau.minX + plateau.maxX + 1) * T * S) / 2),
    Math.round(app.screen.height * 0.3 - plateau.north * T * S),
  );
  const row = plateau.north - 1, mid = (plateau.minX + plateau.maxX) >> 1;
  let x0 = mid, x1 = mid;                                   // walkable low-ground run along the row behind it
  while (x0 > plateau.minX - 2 && x0 > 0 && !cell(x0 - 1, row)) x0--;
  while (x1 < plateau.maxX + 2 && x1 < terrainGrid.cols - 1 && !cell(x1 + 1, row)) x1++;
  const canvas = document.createElement('canvas');          // 12x20 pixel figure, 0 bytes
  canvas.width = 12; canvas.height = 20;
  const g = canvas.getContext('2d');
  g.fillStyle = '#d9c7a3'; g.fillRect(3, 0, 6, 6); g.fillRect(2, 6, 8, 9); g.fillRect(2, 15, 3, 5); g.fillRect(7, 15, 3, 5);
  g.fillStyle = '#20262e'; g.fillRect(4, 2, 1, 2); g.fillRect(7, 2, 1, 2);
  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'nearest';
  const sprite = new Sprite({ texture: tex, anchor: { x: 0.5, y: 1 } });
  sprite.scale.set(S);
  actors.addChild(sprite);
  const xray = makeXray(app.renderer, sprite);
  xrayLayer.addChild(xray.sprite);
  return { sprite, xray, y: plateau.north * T - 2, xMin: x0 * T + 6, xMax: (x1 + 1) * T - 6, t: 0 };
}
function updateWalker(dt) {
  if (!walker) return;
  const w = walker, span = w.xMax - w.xMin, speed = 22;     // art px / s
  w.t += dt * speed;
  const p = span > 0 ? w.t % (2 * span) : 0, x = w.xMin + (p < span ? p : 2 * span - p);
  w.sprite.position.set(x * TERRAIN.scale, terrain.screenY(w.y, 0) * TERRAIN.scale);
  w.sprite.zIndex = w.y;
  w.xray.sync(terrain.isOccluded(x, w.y, 0, 12, 20));
}

app.renderer.on('resize', coverStage);


const dot = app.renderer.generateTexture(new Graphics().circle(64, 64, 64).fill(0xffffff));
const target = new Sprite({ texture: dot, anchor: 0.5 });
world.addChild(target);
const center = () => target.position.set(app.screen.width / 2, app.screen.height / 2);
center();
app.renderer.on('resize', center);

const particles = new Particles(app.renderer);
fxLayer.addChild(particles.view);
const shock = new Shockwave(world, app.screen);

// --- DOM HUD ---
const scoreEl = document.querySelector('#hud .score');
const statusEl = document.querySelector('#hud .status');
if (import.meta.env.DEV) {
  const { drawCallCounter } = await import('./debug/drawCalls.js');
  const dc = drawCallCounter(app);
  const dcEl = document.querySelector('#hud .dc');
  dcEl.hidden = false;
  setInterval(() => { dcEl.textContent = `DC ${dc()}  FPS ${app.ticker.FPS.toFixed(0)}`; }, 250);
}

// --- Input (knowledge-base/13): each tap is stamped with PointerEvent.timeStamp and lands on the
// sim tick (+ sub-tick phase) when it physically happened, so frame rate and slow frames change
// nothing. ?offset=<ms> applies a calibrated device latency (bounded, recorded in the upload).
const OFFSET = Math.max(-150, Math.min(150, Number(new URLSearchParams(location.search).get('offset')) || 0));
let clock, taps;
const sfx = new Sfx();                               // knowledge-base/14: synthesised, 0 bytes; M toggles mute
addEventListener('keydown', e => { sfx.unlock(); if (e.key === 'm' || e.key === 'M') sfx.setMuted(!sfx.muted); });
stage.addEventListener('pointerdown', e => {
  sfx.unlock();                                      // audio may only start from a user gesture
  if (rec.phase === 'over') { sfx.play('click'); restart(); return; }
  const r = app.canvas.getBoundingClientRect();
  taps.push(e.timeStamp, { x: e.clientX - r.left, y: e.clientY - r.top });
});

// --- Juice: driven by sim events, never feeds back into sim ---
let freeze = 0, squashTl = null, heardCombo = 0;
function playJuice(ev, at) {
  if (ev.type === 'miss') {                          // only when it breaks a combo, so idling stays quiet
    if (heardCombo > 0) sfx.play('miss', { gain: 0.6 });
    heardCombo = 0;
    return;
  }
  if (ev.type !== 'hit') return;
  heardCombo = ev.combo;
  if (ev.perfect) sfx.play(ev.combo >= 5 ? 'boom' : 'perfect', { pitch: comboPitch(ev.combo) });
  else sfx.play('whiff');
  const kind = ev.combo >= 5 ? 'boss' : ev.perfect ? 'crit' : 'light';
  shake(shakeEl, kind);
  freeze = Math.max(freeze, FEEL.hitStop[kind]);
  particles.burst(at.x, at.y, ev.perfect ? 0x8ff03c : 0xffd23a);
  if (ev.perfect) { flash(); shock.play(at.x, at.y); } else hurt(0.5);

  const { sx, sy, in: tIn, out, outEase } = FEEL.squash;
  squashTl?.kill();
  squashTl = gsap.timeline()
    .to(target.scale, { x: sx, y: sy, duration: tIn, ease: 'power4.out' })
    .to(target.scale, { x: 1, y: 1, duration: out, ease: outEase });

  scoreEl.textContent = rec.sim.score;
  gsap.fromTo(scoreEl, { scale: 1.35 }, { scale: 1, duration: 0.2, ease: 'back.out(3)' });
}

// --- Match: record every input byte; at the end replay it exactly like the server would ---
let rec;
function restart() {
  rec = new Recorder(GAME, SEED);
  clock = new InputClock(performance.now(), OFFSET, TICK_MS);
  taps = new TapQueue(clock);
  rec.meta.inputOffsetMs = OFFSET;
  scoreEl.textContent = '0';
  statusEl.textContent = '';
}
function finish() {
  rec.meta.lateTaps = taps.late;
  const v = verify(GAME, rec.upload());
  statusEl.textContent = `${v.valid ? 'Replay verified ✓' : `Replay FAILED: ${v.reason}`} — tap to retry seed ${SEED}`;
}
restart();

// --- Loop: fixed 60 Hz sim, render at display rate ---
let lastFrame = performance.now();
app.ticker.add(t => {
  const now = performance.now();
  if (now - lastFrame > 250) clock.skip(now - lastFrame - TICK_MS);   // hidden tab / long hitch: pause, don't fast-forward
  lastFrame = now;
  const upTo = clock.targetTick(now);
  while (rec.phase === 'play' && rec.sim.tick <= upTo) {
    const tap = taps.take(rec.sim.tick);
    rec.step(tap ? encodeTap(tap.phase) : 0);                          // bit 0 = tap (Beat Tap's IN_TAP), bits 4..7 = phase
    for (const ev of rec.sim.events) playJuice(ev, tap?.data ?? target.position);
    if (rec.phase === 'over') finish();
  }

  // Cue: fades in as the next beat approaches, green while the perfect window is open.
  const sim = rec.sim, open = windowOpen(sim);
  target.tint = open ? 0x8ff03c : 0x3a8ff0;
  target.alpha = open ? 1 : 0.35 + 0.65 * Math.max(0, 1 - (sim.nextBeat - sim.tick) / 60);

  const dt = t.deltaMS / 1000;
  updateWalker(dt);
  if (freeze > 0) { freeze -= dt; return; }                 // render-only hit-stop; sim kept stepping above
  particles.update(dt);
});

if (import.meta.env.DEV) window.__demo = { app, terrain, walker, camera, sfx, get rec() { return rec; }, get taps() { return taps; } };   // console inspection only
