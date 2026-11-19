// Role-play playtest (SIMULATED, not real people): six player personas follow the human playtest protocol
// (docs/human_playtest_plan.md §4: same seed, 3 runs, learning between runs) and produce records in exactly the
// format the game exports, so tools/human-report.mjs can analyse them like real data. Also prints per-persona
// story metrics (where they fell, how bosses went, mashing) for the qualitative write-up.
// Usage: node tools/persona-playtest.mjs [--out ../playtest-data/simulated]   (seed 1234, 3 runs each)
import { mkdirSync, writeFileSync } from 'node:fs';
import { Recorder } from '../src/sim/core/index.js';
import { GAME, SEGMENTS, KIND, GRADE, SUB, scoreBreakdown } from '../src/sim/sim.js';
import { makeHumanBot } from './humanBots.mjs';
import { FEEL } from '../src/fx/feel.js';              // same coaching thresholds as the game (FEEL.coach)

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const SEED = 1234, RUNS = 3;

const base = { densityK: 0.1, switchK: 0.3, noveltyK: 0.7, runnerK: 0.2, fastK: 0.25, fatigueK: 0.05 };
// learn: per-run multiplier on timing error and mistake rates (1 = no improvement)
export const PERSONAS = [
  { id: 'P1', name: '小美', who: '22 歲大學生，常玩消除類手遊，沒玩過節奏遊戲；外放', device: { touch: 5, w: 390, h: 844 }, latency: { input: 35, audio: 60 }, learn: 0.88,
    p: { ...base, sdMs: 52, reactMs: 300, missPm: 12, wrongPm: 8, switchWrongPm: 50, rushPm: 12 } },
  { id: 'P2', name: '王伯伯', who: '58 歲退休公務員，反應較慢，單手持機；外放', device: { touch: 5, w: 412, h: 915 }, latency: { input: 55, audio: 70 }, learn: 0.95,
    p: { ...base, sdMs: 70, reactMs: 430, missPm: 25, wrongPm: 12, switchWrongPm: 70, rushPm: 4, densityK: 0.18, fatigueK: 0.12 } },
  { id: 'P3', name: '阿凱', who: '25 歲工程師，Cytus / DJMAX 老玩家，追全 Perfect；有線耳機', device: { touch: 5, w: 393, h: 852 }, latency: { input: 28, audio: 25 }, learn: 0.97,
    p: { ...base, sdMs: 15, reactMs: 180, missPm: 1, wrongPm: 0.5, switchWrongPm: 5, rushPm: 0, noveltyK: 0.3 } },
  { id: 'P4', name: '小胖', who: '10 歲國小生，喜歡可愛角色，看到敵人就狂按；外放', device: { touch: 5, w: 360, h: 800 }, latency: { input: 40, audio: 60 }, learn: 0.9,
    p: { ...base, sdMs: 62, reactMs: 320, missPm: 18, wrongPm: 15, switchWrongPm: 60, rushPm: 50, mashPm: 25 } },
  { id: 'P5', name: 'Ken', who: '33 歲上班族，玩過幾款節奏遊戲；戴藍牙耳機、第一局沒做校正、會跟著聲音打', device: { touch: 5, w: 430, h: 932 }, latency: { input: 0, audio: null }, learn: 0.92,
    p: { ...base, sdMs: 34, reactMs: 250, missPm: 6, wrongPm: 4, switchWrongPm: 25, rushPm: 5, biasMs: 75 },
    perRun: run => (run === 1 ? {} : { biasMs: 12 }), latencyAfter: { input: 35, audio: 180 } },                  // calibrates after run 1
  { id: 'P6', name: '琳', who: '28 歲設計師，一般手遊玩家，遇到新東西會緊張（頭目時特別容易手忙腳亂）', device: { touch: 5, w: 390, h: 844 }, latency: { input: 32, audio: 65 }, learn: 0.9,
    p: { ...base, sdMs: 36, reactMs: 260, missPm: 7, wrongPm: 5, switchWrongPm: 30, rushPm: 6, noveltyK: 1.2, bruteK: 0.8, bruteWrongPm: 60 } },
];

function botFor(persona, run) {
  const k = persona.learn ** (run - 1), p = { ...persona.p, ...(persona.perRun?.(run) ?? {}) };
  for (const key of ['sdMs', 'missPm', 'wrongPm', 'switchWrongPm', 'rushPm', 'mashPm', 'bruteWrongPm']) if (p[key]) p[key] *= k;
  return makeHumanBot(5000 + persona.id.charCodeAt(1) * 100 + run, p);
}

function story(sim, hurtsBySeg) {
  const bosses = new Map();
  sim.chart.forEach((n, i) => { if (n.kind === KIND.BRUTE) (bosses.get(n.group) ?? bosses.set(n.group, []).get(n.group)).push(sim.judge.grade[i]); });
  const bossRows = [...bosses.values()].filter(g => g.some(x => x >= 0));
  const deathSeg = sim.deathTick < 0 ? null : SEGMENTS.find(s => sim.deathTick >= s.from && sim.deathTick < s.to)?.name;
  return {
    deathSec: sim.deathTick < 0 ? null : Math.round(sim.deathTick / 60), deathSeg,
    bossClean: bossRows.filter(g => g.every(x => x > GRADE.MISS)).length, bossSeen: bossRows.length,
    worstSeg: Object.entries(hurtsBySeg).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—',
  };
}

const out = [];
const recordsByPersona = {};
for (const persona of PERSONAS) {
  const list = [];
  for (let run = 1; run <= RUNS; run++) {
    const rec = new Recorder(GAME, SEED), bot = botFor(persona, run);
    const hurts = {}, errs = [];
    while (rec.phase !== 'over') {
      rec.step(bot.input(rec.sim));
      for (const e of rec.sim.events) if (e.type === 'hit') errs.push((e.dt / SUB) * (1000 / 60));
      for (const e of rec.sim.events) if (e.type === 'hurt' && !e.safe) { const n = SEGMENTS[rec.sim.chart[e.note].seg].name; hurts[n] = (hurts[n] ?? 0) + 1; }
    }
    const latency = run === 1 ? persona.latency : persona.latencyAfter ?? persona.latency;
    rec.meta.inputOffsetMs = latency.input; rec.meta.audioLatencyMs = latency.audio; rec.meta.simulated = true;
    const b = scoreBreakdown(rec.sim);
    list.push({ v: 1, tester: `${persona.id}-${persona.name}`, at: new Date(2026, 9, 21, 14, persona.id.charCodeAt(1) * 3 + run).toISOString(), run,
      upload: rec.upload(), summary: { ...b, hp: rec.sim.hp, deathTick: rec.sim.deathTick, verified: true },
      latency, device: { ua: `simulated persona ${persona.id}`, dpr: 3, lang: 'zh-TW', ...persona.device } });
    const med = errs.length ? [...errs].sort((x, y) => x - y)[errs.length >> 1] : 0;
    out.push({ persona: persona.id, name: persona.name, run, score: rec.sim.judge.score, rate: b.ratePermille / 10, crit: b.critical, med: Math.round(med), advise: errs.length >= FEEL.coach.minHits && Math.abs(med) >= FEEL.coach.biasMs, perfect: b.perfect, miss: b.miss, whiffs: b.whiffs, locked: b.locked, maxCombo: b.maxCombo, ...story(rec.sim, hurts) });
  }
  recordsByPersona[persona.id] = list;
}

if (outIdx >= 0) {
  const dir = args[outIdx + 1];
  mkdirSync(dir, { recursive: true });
  for (const p of PERSONAS) writeFileSync(`${dir}/twinstrike-playtest-${p.id}-${p.name}.json`, JSON.stringify(recordsByPersona[p.id], null, 1));
}
console.log('| 角色 | 局 | 分數 | 達成率 | Critical | Perfect | 漏接 | 空揮 | 硬直中點擊 | 最大連擊 | 誤差中位數 | 建議校正 | 倒下 | 扣血最多的段落 | 頭目全打中 |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of out) console.log(`| ${r.persona} ${r.name} | ${r.run} | ${r.score} | ${r.rate.toFixed(1)}% | ${r.crit} | ${r.perfect} | ${r.miss} | ${r.whiffs} | ${r.locked} | ${r.maxCombo} | ${r.med > 0 ? '+' : ''}${r.med} ms | ${r.advise ? '✔' : ''} | ${r.deathSec == null ? '打完' : `${r.deathSec} s（${r.deathSeg}）`} | ${r.worstSeg} | ${r.bossClean} / ${r.bossSeen} |`);
