// Paper-pilot measurement: a minimal timed Klondike (draw-3, Solitaire-Cube-like scoring) with tiered policies.
// Not a product sim: moves, not ticks; time is modelled as seconds per action. Policies only read face-up cards.
// usage: node klondike.mjs [seeds=300]

// --- seeded RNG (stateless hash, like core/rng.js) ---
function hash32(a, b, c) { let h = (a ^ 0x9e3779b9) >>> 0; for (const v of [b, c]) { h = Math.imul(h ^ (v >>> 0), 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; } return h >>> 0; }
const rank = c => (c >> 2) + 1, suit = c => c & 3, red = c => (c & 3) < 2;
const PTS = [0, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 10, 10, 10];   // foundation points by rank
const LIMIT = 300, RECYCLE_FREE = 3;

export function deal(seed) {
  const d = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 51; i > 0; i--) { const j = hash32(seed, 1, i) % (i + 1); [d[i], d[j]] = [d[j], d[i]]; }
  const t = [];
  for (let i = 0; i < 7; i++) { const cards = d.splice(0, i + 1); t.push({ down: cards.slice(0, i), up: cards.slice(i) }); }
  return { seed, t, stock: d, waste: [], f: [0, 0, 0, 0], score: 0, time: 0, recycles: 0, moves: 0, sinceProgress: 0, done: false };
}
const canFound = (s, c) => s.f[suit(c)] === rank(c) - 1;
const canStack = (c, onto) => (onto === undefined ? rank(c) === 13 : red(c) !== red(onto) && rank(c) === rank(onto) - 1);
const top = p => p.up[p.up.length - 1];

/** All legal actions from face-up information. */
export function actions(s) {
  const a = [];
  const w = s.waste[s.waste.length - 1];
  if (w !== undefined) {
    if (canFound(s, w)) a.push({ k: 'WF' });
    for (let j = 0; j < 7; j++) if (canStack(w, top(s.t[j]))) a.push({ k: 'WT', j });
  }
  for (let i = 0; i < 7; i++) {
    const p = s.t[i];
    if (!p.up.length) continue;
    if (canFound(s, top(p))) a.push({ k: 'TF', i });
    for (let from = 0; from < p.up.length; from++) for (let j = 0; j < 7; j++) {
      if (j === i || !canStack(p.up[from], top(s.t[j]))) continue;
      if (from === 0 && !p.down.length && !s.t[j].up.length) continue;   // king run from a bare column to an empty one: no-op
      a.push({ k: 'TT', i, j, from });
    }
  }
  if (s.stock.length || s.waste.length) a.push({ k: 'D' });
  return a;
}
function flip(s, p) { if (!p.up.length && p.down.length) { p.up.push(p.down.pop()); s.score += 20; return true; } return false; }
export function apply(s, m) {
  let progress = true;
  if (m.k === 'D') {
    progress = false;
    if (!s.stock.length) { s.stock = s.waste.reverse(); s.waste = []; if (++s.recycles > RECYCLE_FREE) s.score = Math.max(0, s.score - 20); }
    else for (let n = 0; n < 3 && s.stock.length; n++) s.waste.push(s.stock.pop());
  } else if (m.k === 'WF') { const c = s.waste.pop(); s.f[suit(c)]++; s.score += 20 + PTS[rank(c)]; }
  else if (m.k === 'WT') { s.t[m.j].up.push(s.waste.pop()); s.score += 20; }
  else if (m.k === 'TF') { const p = s.t[m.i], c = p.up.pop(); s.f[suit(c)]++; s.score += PTS[rank(c)]; flip(s, p); }
  else { const p = s.t[m.i], run = p.up.splice(m.from); s.t[m.j].up.push(...run); if (!flip(s, p) && m.from > 0) progress = false; }
  s.moves++;
  s.sinceProgress = progress ? 0 : s.sinceProgress + 1;
  if (s.f[0] + s.f[1] + s.f[2] + s.f[3] === 52) s.done = true;
}
const onFoundation = s => s.f[0] + s.f[1] + s.f[2] + s.f[3];

/** Play one deal. policy(s, acts, ctx) -> action | null (null = press Finish). secs = seconds per action. */
export function play(seed, policy, secs, { timeBonus = true } = {}) {
  const s = deal(seed), ctx = { salt: 0 };
  while (!s.done && s.time + secs <= LIMIT) {
    const acts = actions(s);
    const m = acts.length ? policy(s, acts, ctx) : null;
    if (!m) break;
    apply(s, m);
    s.time += secs;
  }
  // Time bonus: 4 per remaining second, scaled by the share of cards on the foundation (the real discount formula is unpublished).
  const bonus = timeBonus ? Math.trunc(((LIMIT - s.time) * 4 * onFoundation(s)) / 52) : 0;
  return { score: s.score + Math.max(0, bonus), solved: s.done ? 1 : 0, found: onFoundation(s), secs: s.time };
}

// --- policies ---
const passLen = s => Math.ceil((s.stock.length + s.waste.length) / 3) + 2;   // draws in one full pass of the stock
const stuck = s => s.sinceProgress > passLen(s) + 1;
const exposes = (s, m) => m.k === 'TT' && m.from === 0 && s.t[m.i].down.length > 0;

/** Novice: any legal action at random (it does see the legal moves, it just cannot rank them). */
export const novice = (s, acts, ctx) => (stuck(s) && acts.every(a => a.k === 'D' || a.k === 'TT') && s.sinceProgress > 60 ? null : acts[hash32(s.seed, 7, ctx.salt++) % acts.length]);

/** Intermediate: fixed priority — foundation, then uncover a face-down card, then play the waste card, then draw. */
export function intermediate(s, acts) {
  const pick = f => acts.find(f);
  const m = pick(a => a.k === 'TF' || a.k === 'WF') ?? pick(a => exposes(s, a)) ?? pick(a => a.k === 'WT');
  if (m) return m;
  return stuck(s) ? null : pick(a => a.k === 'D') ?? null;
}

/** Expert: keeps low cards available for building, uncovers the deepest pile first, frees foundation plays, never empties a column without a king. */
export function expert(s, acts) {
  const minOpp = c => (red(c) ? Math.min(s.f[2], s.f[3]) : Math.min(s.f[0], s.f[1]));
  const safe = c => rank(c) <= 2 || rank(c) <= minOpp(c) + 2;
  const w = s.waste[s.waste.length - 1];
  const kingWaiting = (w !== undefined && rank(w) === 13) || s.t.some(p => p.down.length && p.up.length && rank(p.up[0]) === 13);
  const cand = [];
  for (const a of acts) {
    if (a.k === 'TF') { const p = s.t[a.i], c = top(p); const uncovers = p.up.length === 1 && p.down.length > 0; if (safe(c) || uncovers) cand.push([900 + (uncovers ? 50 : 0), a]); else cand.push([120, a]); }
    else if (a.k === 'WF') cand.push([safe(w) ? 880 : 300, a]);
    else if (a.k === 'TT') {
      const p = s.t[a.i];
      if (a.from === 0 && p.down.length) cand.push([700 + p.down.length * 10 + (s.t[a.j].up.length ? 5 : 0), a]);         // uncover, deepest pile first
      else if (a.from === 0 && !p.down.length) { if (kingWaiting && s.t[a.j].up.length) cand.push([400, a]); }            // clear a column only for a waiting king
      else if (canFound(s, p.up[a.from - 1])) cand.push([650, a]);                                                        // split a run to free a foundation card
    } else if (a.k === 'WT') cand.push([rank(w) === 13 ? 600 : 500, a]);
  }
  cand.sort((x, y) => y[0] - x[0]);
  const best = cand[0];
  if (best && best[0] >= 400) return best[1];
  if (!stuck(s)) return acts.find(a => a.k === 'D') ?? (best ? best[1] : null);
  return best && s.sinceProgress < 3 * passLen(s) ? best[1] : null;   // stuck: take the unsafe foundation plays, then finish
}

// One-sentence baselines (RULE-SKILL-BASELINE style): no timing or aiming needed.
export const BASELINES = {
  '能上基礎堆就上，不然就翻牌堆': (s, acts) => acts.find(a => a.k === 'TF' || a.k === 'WF') ?? (stuck(s) ? null : acts.find(a => a.k === 'D') ?? null),
  '只翻牌堆、能出就出到牌列': (s, acts) => acts.find(a => a.k === 'WT') ?? (stuck(s) ? null : acts.find(a => a.k === 'D') ?? null),
  '照固定順序：基礎堆 → 翻開蓋牌 → 出廢牌 → 翻牌堆': intermediate,
};

// --- measurement: same two-way decomposition as templates/tools/lib/dominance.mjs ---
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
export function measure(tiers, n, opts) {
  const names = Object.keys(tiers);
  const rows = Array.from({ length: n }, (_, i) => { const seed = hash32(2026, 7, i); return Object.fromEntries(names.map(t => [t, play(seed, tiers[t].policy, tiers[t].secs, opts)])); });
  const sc = t => rows.map(r => r[t].score);
  const all = rows.flatMap(r => names.map(t => r[t].score)), g = mean(all);
  const ssT = all.reduce((x, v) => x + (v - g) ** 2, 0) || 1;
  const ssTier = names.reduce((x, t) => x + n * (mean(sc(t)) - g) ** 2, 0);
  const ssSeed = rows.reduce((x, r) => x + names.length * (mean(names.map(t => r[t].score)) - g) ** 2, 0);
  const win = (a, b) => mean(rows.map(r => (r[a].score > r[b].score ? 1 : r[a].score === r[b].score ? 0.5 : 0)));
  return {
    n, stats: Object.fromEntries(names.map(t => [t, { mean: Math.round(mean(sc(t))), solved: mean(rows.map(r => r[t].solved)), found: mean(rows.map(r => r[t].found)), secs: Math.round(mean(rows.map(r => r[t].secs))) }])),
    skill: ssTier / ssT, seed: ssSeed / ssT, rest: 1 - (ssTier + ssSeed) / ssT,
    topVsNext: win(names.at(-1), names.at(-2)), midVsLow: win(names.at(-2), names[0]), rows,
  };
}

if (process.argv[1]?.endsWith('klondike.mjs')) {
  const N = Number(process.argv[2]) || 300, pct = v => `${(v * 100).toFixed(1)}%`;
  const SPEED = { novice: 2.5, intermediate: 1.5, expert: 0.9 };   // seconds per action: an assumption, not measured
  const variants = {
    '只比決策（三級同速 1.2 秒／步，無時間獎勵）': [{ novice: { policy: novice, secs: 1.2 }, intermediate: { policy: intermediate, secs: 1.2 }, expert: { policy: expert, secs: 1.2 } }, { timeBonus: false }],
    '決策＋速度（2.5／1.5／0.9 秒／步，含時間獎勵）': [{ novice: { policy: novice, secs: SPEED.novice }, intermediate: { policy: intermediate, secs: SPEED.intermediate }, expert: { policy: expert, secs: SPEED.expert } }, { timeBonus: true }],
    '只比速度（三級都用 expert 決策，含時間獎勵）': [{ novice: { policy: expert, secs: SPEED.novice }, intermediate: { policy: expert, secs: SPEED.intermediate }, expert: { policy: expert, secs: SPEED.expert } }, { timeBonus: true }],
  };
  for (const [name, [tiers, opts]] of Object.entries(variants)) {
    console.log(`\n## ${name}`);
    for (const n of [30, N]) {
      const r = measure(tiers, n, opts);
      console.log(`n=${n}: 技巧 ${pct(r.skill)}｜種子 ${pct(r.seed)}｜殘差 ${pct(r.rest)}｜最強 vs 次強 ${pct(r.topVsNext)}｜次強 vs 最弱 ${pct(r.midVsLow)}`);
      if (n === N) for (const [t, s] of Object.entries(r.stats)) console.log(`  ${t}: 平均 ${s.mean} 分，解完 ${pct(s.solved)}，平均上基礎堆 ${s.found.toFixed(1)} 張，用時 ${s.secs}s`);
    }
  }
  // Baselines vs expert (decision + speed variant; baselines play at the intermediate speed).
  const ex = mean(Array.from({ length: N }, (_, i) => play(hash32(2026, 7, i), expert, SPEED.expert).score));
  console.log(`\n## 一句話規則 ÷ expert（n=${N}，規則以 1.5 秒／步執行）`);
  for (const [name, p] of Object.entries(BASELINES)) { const m = mean(Array.from({ length: N }, (_, i) => play(hash32(2026, 7, i), p, 1.5).score)); console.log(`  ${name}: ${Math.round(m)}（${pct(m / ex)}）`); }
}
