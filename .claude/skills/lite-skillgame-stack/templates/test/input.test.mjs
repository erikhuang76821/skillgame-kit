// Input fairness guarantees (knowledge-base/13).
import test from 'node:test';
import assert from 'node:assert/strict';
import { InputClock, TapQueue, calibrate, macroSuspicion, errorSuspicion } from '../src/sim/core/input.js';
import { encodeTap } from '../src/sim/core/timing.js';

const TICK = 1000 / 60;

/** Play the same human taps through a display running at `hz` (events delivered at the next frame). */
function logAt(hz, taps, ticks = 120, hitchAt = -1) {
  const clock = new InputClock(1000), q = new TapQueue(clock), log = new Uint8Array(ticks);
  let tick = 0, pending = [...taps];
  for (let frame = 0; tick < ticks; frame++) {
    let now = 1000 + (frame * 1000) / hz;
    if (frame === hitchAt) now += 90;                               // a 90 ms frame hitch
    while (pending.length && pending[0] <= now) q.push(pending.shift());
    const target = Math.min(ticks - 1, clock.targetTick(now));
    for (; tick <= target; tick++) { const t = q.take(tick); log[tick] = t ? encodeTap(t.phase) : 0; }
  }
  return [...log];
}

test('the same taps give the same input log at 30 / 60 / 120 / 144 Hz and through a frame hitch', () => {
  const taps = [1000 + 123.4, 1000 + 401.9, 1000 + 402.0 + TICK, 1000 + 1500.2];
  const ref = logAt(60, taps);
  for (const hz of [30, 120, 144]) assert.deepEqual(logAt(hz, taps), ref, `${hz} Hz`);
  assert.deepEqual(logAt(60, taps, 120, 20), ref, 'hitch');
  assert.equal(ref.filter(Boolean).length, 4);
});

test('phase resolves ~1 ms inside a 16.7 ms tick', () => {
  const c = new InputClock(0);
  assert.deepEqual(c.at(0), { tick: 0, phase: 0 });
  assert.deepEqual(c.at(TICK * 3 + TICK / 2), { tick: 3, phase: 8 });
  assert.deepEqual(new InputClock(0, 20).at(20), { tick: 0, phase: 0 }, 'offset shifts taps earlier');
});

test('a tap whose tick already ran is delivered now and counted late', () => {
  const c = new InputClock(0), q = new TapQueue(c);
  q.push(TICK * 2 + 1);
  const t = q.take(5);
  assert.equal(t.tick, 5); assert.equal(t.phase, 0); assert.equal(q.late, 1);
});

test('calibration: robust to stray taps, bounded, flags sloppy samples', () => {
  const s = [42, 38, 45, 40, 41, 39, 44, 43, 400, -300];
  const c = calibrate(s);
  assert.ok(c.ok && Math.abs(c.offsetMs - 42) <= 2, JSON.stringify(c));
  assert.equal(calibrate(Array(12).fill(900)).offsetMs, 150, 'clamped');
  assert.equal(calibrate([1, 2]).ok, false, 'too few samples');
  assert.equal(calibrate([0, 90, -80, 60, -70, 100, -95, 85, -60, 75]).ok, false, 'too scattered');
});

test('macro and bot detection', () => {
  const human = Array.from({ length: 40 }, (_, i) => i * 120 + ((i * 37) % 23));
  const macro = Array.from({ length: 40 }, (_, i) => i * 50);
  assert.equal(macroSuspicion(human).suspicious, false);
  assert.equal(macroSuspicion(macro).suspicious, true);
  assert.equal(errorSuspicion(Array.from({ length: 40 }, (_, i) => ((i * 7) % 21) - 10)).suspicious, false);
  assert.equal(errorSuspicion(Array(40).fill(0.5)).suspicious, true);
});
