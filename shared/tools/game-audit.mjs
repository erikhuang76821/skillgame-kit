// Game completeness audit: is a game folder done the way knowledge-base/08 says, not just "tests pass"?
// Must: RULE-GAME-DOCS, RULE-GAME-REPORTS, RULE-REPORT-FRESH, RULE-SPEC-CONSTANTS, RULE-SPEC-FAIRNESS,
//       RULE-AF-ADAPTATION, RULE-SIM-PURITY.  Should (warnings): RULE-TEMPLATE-LEFTOVER, RULE-KB-CITED, RULE-ASSET-REGISTER.
// Everything it requires comes from knowledge-base/index/rules.json via rules.mjs; never list files or names here.
//
//   node shared/tools/game-audit.mjs <Game> [<Game>…]   one or more game folders
//   node shared/tools/game-audit.mjs --all              every folder with a game/ subfolder
//   cd <Game>/game && npm run audit                     the game this folder belongs to
// Exit 1 when a must-level check fails; should-level findings are printed as warnings.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadRules } from './rules.mjs';
import { fileHash, loadManifests } from './index-build.mjs';

const TEMPLATES = join('.claude', 'skills', 'lite-skillgame-stack', 'templates');
const FAIL_MARK = /❌|✘|\*\*未通過\*\*|\bFAIL\b/;
const PLACEHOLDER = /^(|—|-|待補|待定|TODO|TBD|\?)$/i;

const read = p => (existsSync(p) ? readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : null);
const nonEmpty = p => existsSync(p) && statSync(p).isFile() && statSync(p).size > 0;
const walk = d => (existsSync(d) ? readdirSync(d, { withFileTypes: true }).flatMap(e =>
  (e.name === 'node_modules' || e.name === 'dist' ? [] : e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)])) : []);
const cells = l => l.split('|').map(c => c.trim());
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Lines of a markdown section: from the heading matching `re` to the next heading of the same or higher level. */
function section(text, re) {
  const lines = text.split('\n'), at = lines.findIndex(l => re.test(l));
  if (at < 0) return null;
  const level = lines[at].match(/^#+/)[0].length, out = [];
  for (let i = at + 1; i < lines.length; i++) {
    const h = lines[i].match(/^(#+)\s/);
    if (h && h[1].length <= level) break;
    out.push(lines[i]);
  }
  return out;
}

/** Numbers written in a spec cell: "1,000" is one thousand, "10, 12, 14" is a list. */
const numbers = seg => [...seg.matchAll(/-?\d{1,3}(?:,\d{3})+(?:\.\d+)?|-?\d+(?:\.\d+)?/g)].map(m => Number(m[0].replace(/,/g, '')));

/** `NAME` = value, or a table row "… `NAME` | value |": [{ name, seg, line }] */
function specConstants(spec) {
  const out = [];
  spec.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/`([A-Za-z_][\w.]*)`\s*=\s*([^|；;（(\n]+)/g)) out.push({ name: m[1], seg: m[2], line: i + 1 });
    if (l.trim().startsWith('|')) {
      const c = cells(l);
      for (let j = 1; j + 1 < c.length; j++) {
        const names = [...c[j].matchAll(/`([A-Za-z_][\w.]*)`/g)];
        if (names.length && /^-?\d/.test(c[j + 1])) out.push({ name: names.at(-1)[1], seg: c[j + 1], line: i + 1 });
      }
    }
  });
  return out;
}

/** The sim's value for a spec name: an export, a dotted path, or a GAME / RULES field. Numbers and number arrays only. */
function resolve(mod, name) {
  const v = name.includes('.') ? name.split('.').reduce((o, k) => (o == null ? undefined : o[k]), mod)
    : mod[name] ?? mod.GAME?.[name] ?? mod.RULES?.[name];
  if (typeof v === 'number' || (Array.isArray(v) && v.length && v.every(x => typeof x === 'number'))) return v;
  return undefined;
}

/** opts.profile replaces <Game>/game.profile.json (tests). */
export async function auditGame(root, game, opts = {}) {
  const rules = loadRules({ from: join(root, game, 'game'), game });
  const dir = join(root, game), results = [];
  let profile = opts.profile ?? null;
  if (!profile) try { profile = JSON.parse(read(join(dir, 'game.profile.json'))); } catch { profile = null; }
  const add = (rule, level, ok, item, detail = '') => results.push({ rule, level, ok, item, detail });
  const spec = read(join(dir, 'gdd', '05_game_spec.md'));
  let mod = null, modErr = '';
  try { mod = await import(pathToFileURL(join(dir, 'game', 'src', 'sim', 'sim.js')).href); } catch (e) { modErr = e.message.split('\n')[0]; }

  // RULE-GAME-DOCS
  // The difficulty document and the playtest report exist only for games with scripted progression (profile flag).
  // true: required; false: not asked for; unanswered: the audit cannot tell, which is a failure, never a silent default.
  const scripted = profile?.scriptedProgression, scriptedDocs = rules.value('RULE-GAME-DOCS', 'requiredIfScriptedProgression');
  const required = [...rules.value('RULE-GAME-DOCS', 'required'), ...(scripted === true ? scriptedDocs : [])];
  for (const f of required) add('RULE-GAME-DOCS', 'must', nonEmpty(join(dir, f)), f, nonEmpty(join(dir, f)) ? '' : '缺檔或空檔');
  if (typeof scripted !== 'boolean') add('RULE-GAME-DOCS', 'must', false, 'game.profile.json 的 scriptedProgression',
    `資料待補：${profile ? '沒填 true / false' : '缺 game.profile.json 或讀不了'}，無法判斷是否要 ${scriptedDocs.join('、')}`);
  if (spec) {
    const heads = new Map(spec.split('\n').map(l => l.match(/^##\s*(§\d+)\s*(.*)$/)).filter(Boolean).map(m => [m[1], m[2]]));
    const missing = rules.value('RULE-GAME-DOCS', 'specSections').filter(s => !heads.has(s));
    add('RULE-GAME-DOCS', 'must', !missing.length, 'gdd/05 涵蓋規格範本每一節', missing.length ? `缺 ${missing.join('、')}` : '');
    if (heads.has('§10')) add('RULE-GAME-DOCS', 'must', heads.get('§10').includes('公平'), 'gdd/05 §10 是公平檢查', heads.get('§10').includes('公平') ? '' : `§10 標題是「${heads.get('§10')}」`);
  }

  // RULE-GAME-REPORTS + RULE-REPORT-FRESH
  const game_ = mod?.GAME;
  // Every tool-made report, checked when it exists. Which ones a game must have: RULE-GAME-DOCS and the loop's produces.
  // The legacy dominance report belongs to a should-level rule kept for three games: its failures only warn.
  for (const f of ['docs/skill_evidence_report.md', 'docs/skill_dominance_report.md', 'docs/playtest_report.md']) {
    const t = read(join(dir, f));
    if (!t) continue;
    const level = f === 'docs/skill_dominance_report.md' ? 'should' : 'must';
    add('RULE-GAME-REPORTS', level, !FAIL_MARK.test(t), `${f} 全部通過`, FAIL_MARK.test(t) ? '報告內有未通過項目' : '');
    const head = t.split('\n').slice(0, 6).join('\n');
    const stamp = head.match(/—\s*([\w-]+)\s+v(\d+)（自動產生）/) ?? head.match(/\bsim v(\d+)/);
    const ver = stamp ? Number(stamp[2] ?? stamp[1]) : null, id = stamp?.[2] ? stamp[1] : null;
    let ok = false, detail;
    if (!game_) detail = mod ? 'sim.js 沒有匯出 GAME（範本前的舊結構），無法比對版本' : `無法載入 sim.js：${modErr}`;
    else if (ver === null) detail = '報告開頭沒有版本標記，請用目前的工具重新產生';
    else if (ver !== game_.version) detail = `報告是 v${ver}，sim 是 v${game_.version}：規則改過但報告沒重跑`;
    else if (id && id !== game_.id) detail = `報告的遊戲 id 是 ${id}，sim 是 ${game_.id}`;
    else { ok = true; detail = `v${ver}`; }
    add('RULE-REPORT-FRESH', level, ok, `${f} 與 sim 版本一致`, detail);
  }

  // RULE-SPEC-CONSTANTS: numbers in gdd/05 that name a sim constant must equal it
  if (spec && mod) {
    const seen = new Set(), bad = [];
    for (const c of specConstants(spec)) {
      const actual = resolve(mod, c.name);
      if (actual === undefined || seen.has(`${c.name}@${c.line}`)) continue;
      seen.add(`${c.name}@${c.line}`);
      const nums = numbers(c.seg);
      // an array matches when the listed numbers appear in it as one consecutive run (e.g. a 1-based table padded with 0)
      const ok = Array.isArray(actual)
        ? nums.length > 0 && actual.some((_, k) => nums.every((v, j) => v === actual[k + j]))
        : nums.some(v => Math.abs(v - actual) < 1e-9);
      if (!ok) bad.push(`第 ${c.line} 行 \`${c.name}\`：規格 ${c.seg.trim().slice(0, 30)}，sim ${Array.isArray(actual) ? actual.join(', ') : actual}`);
    }
    const min = rules.value('RULE-SPEC-CONSTANTS', 'minMatched');
    add('RULE-SPEC-CONSTANTS', 'must', !bad.length && seen.size >= min, `gdd/05 數值與 sim 常數一致（比對 ${seen.size} 個）`,
      bad.length ? bad.join('；') : seen.size < min ? `規格裡找不到可對帳的常數（請寫成 \`NAME\` = 數值）` : '');
  } else if (spec) add('RULE-SPEC-CONSTANTS', 'must', false, 'gdd/05 數值與 sim 常數一致', `無法載入 sim.js：${modErr}`);

  // RULE-SPEC-FAIRNESS: §10 answers every essential (knowledge-base/01 §2)
  if (spec) {
    const s10 = section(spec, /^##\s*§10\b/) ?? [];
    const rows = new Map(s10.map(cells).filter(c => /^E\d+$/.test(c[1] ?? '')).map(c => [c[1], c[3] ?? '']));
    const empty = rules.value('RULE-SPEC-FAIRNESS', 'answers').filter(e => PLACEHOLDER.test(rows.get(e) ?? ''));
    add('RULE-SPEC-FAIRNESS', 'must', !empty.length, 'gdd/05 §10 精髓七條都有答案', empty.length ? `${empty.join('、')} 沒有答案` : '');
  }

  // RULE-AF-ADAPTATION: every adaptation item of each ad-funnel spec the game cites has a row in gdd/05 §13
  const cites = new Set([...`${spec ?? ''}\n${read(join(dir, 'README.md')) ?? ''}`.matchAll(/ad-funnel\/(af-[\w-]+)\.md/g)].map(m => m[1]));
  const s13 = spec ? section(spec, /^##\s*§13\b/) : null;
  const rows13 = new Map((s13 ?? []).map(cells).filter(c => /^\d+$/.test(c[1] ?? '')).map(c => [Number(c[1]), c]));
  for (const af of cites) {
    const doc = read(join(root, 'knowledge-base', 'ad-funnel', `${af}.md`));
    const items = doc ? (section(doc, /^## Skill Game 化改造/) ?? []).filter(l => /^\d+\.\s/.test(l)).length : 0;
    if (!s13) { add('RULE-AF-ADAPTATION', 'must', false, `${af}：gdd/05 §13 改造對照`, `缺 §13（規格書有 ${items} 條改造）`); continue; }
    const bad = [];
    for (let n = 1; n <= items; n++) { const c = rows13.get(n); if (!c || PLACEHOLDER.test(c[3] ?? '') || PLACEHOLDER.test(c[4] ?? '')) bad.push(n); }
    add('RULE-AF-ADAPTATION', 'must', !bad.length, `${af}：${items} 條改造逐條回應`, bad.length ? `第 ${bad.join('、')} 條沒有「採用 / 不採用＋做法或理由」` : '');
  }

  // RULE-SIM-PURITY: forbidden identifiers in sim/ code (comments do not count)
  const forbidden = rules.value('RULE-SIM-PURITY', 'forbidden');
  const re = new RegExp(`(?<![\\w.$])(${forbidden.map(escapeRe).join('|')})(?![\\w$])`, 'g');
  const hits = [];
  for (const f of walk(join(dir, 'game', 'src', 'sim')).filter(f => /\.m?js$/.test(f))) {
    stripComments(read(f)).split('\n').forEach((l, i) => { for (const m of l.matchAll(re)) hits.push(`${relative(join(dir, 'game'), f).replace(/\\/g, '/')}:${i + 1} ${m[1]}`); });
  }
  add('RULE-SIM-PURITY', 'must', !hits.length, 'sim/ 沒有 DOM / 渲染 / 時鐘 / 未播種亂數', hits.slice(0, 6).join('；') + (hits.length > 6 ? `…共 ${hits.length} 處` : ''));

  // RULE-TEMPLATE-LEFTOVER (should): files that must become this game's own
  for (const f of rules.value('RULE-TEMPLATE-LEFTOVER', 'rewrite')) {
    const mine = read(join(dir, 'game', f)), tpl = read(join(root, TEMPLATES, f));
    if (mine === null) add('RULE-TEMPLATE-LEFTOVER', 'should', false, `game/${f}`, '缺檔（範本有提供）');
    else if (tpl !== null && mine === tpl) add('RULE-TEMPLATE-LEFTOVER', 'should', false, `game/${f}`, '與範本相同：仍是示範遊戲的內容');
  }

  // RULE-KB-CITED (should): README / gdd link at least one knowledge-base page per must-read stage
  const docs = [read(join(dir, 'README.md')) ?? '', ...walk(join(dir, 'gdd')).filter(f => f.endsWith('.md')).map(read)].join('\n');
  for (const { stage, pages } of rules.value('RULE-KB-CITED', 'stages')) {
    const ok = pages.some(p => docs.includes(`knowledge-base/${p}`));
    if (!ok) add('RULE-KB-CITED', 'should', false, `知識庫引用：${stage}`, `README / gdd 沒有連到 ${pages.map(p => `knowledge-base/${p}`).join(' 或 ')}`);
  }

  // RULE-ASSET-REGISTER (should): shipped media is registered in an art/manifest.json (this game's, or shared/recipes/
  // for an unchanged template copy: same content hash counts). knowledge-base/index/assets.json is built from them.
  const exts = rules.value('RULE-ASSET-REGISTER', 'registered');
  const { manifests } = loadManifests(root);
  const paths = new Set(), hashes = new Set();
  for (const { m } of manifests) for (const a of m.assets) {
    for (const f of Object.values(a.files).flat()) paths.add(m.pathBase + f.split('#')[0]);
    if (a.contentHash) hashes.add(a.contentHash);
  }
  const media = [...walk(join(dir, 'game', 'src', 'assets')), ...walk(join(dir, 'game', 'public'))].filter(f => exts.includes(extname(f).toLowerCase()));
  const unregistered = media.filter(f => !paths.has(relative(root, f).replace(/\\/g, '/')) && !hashes.has(fileHash(f)));
  if (unregistered.length) add('RULE-ASSET-REGISTER', 'should', false, `資產登錄（${media.length - unregistered.length}/${media.length}）`,
    `未登錄：${unregistered.slice(0, 5).map(f => relative(join(dir, 'game'), f).replace(/\\/g, '/')).join('、')}${unregistered.length > 5 ? '…' : ''}（寫進 ${game}/art/manifest.json 後跑 node shared/tools/index-build.mjs，見 knowledge-base/10_asset-library.md）`);
  return results;
}

/** Print one game's results as a markdown table; returns true when every must-level check passed. */
export function printResults(game, r) {
  const bad = r.filter(x => x.level === 'must' && !x.ok), warn = r.filter(x => x.level === 'should' && !x.ok);
  console.log(`\n## ${game} — ${bad.length ? `❌ ${bad.length} 項未通過` : '✅ 必要項目全部通過'}${warn.length ? `，⚠️ ${warn.length} 項警告` : ''}\n`);
  console.log('| 規則 | 項目 | 結果 | 說明 |\n|---|---|---|---|');
  for (const x of r) console.log(`| ${x.rule} | ${x.item} | ${x.ok ? '✅' : x.level === 'must' ? '❌' : '⚠️'} | ${x.detail} |`);
  return !bad.length;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const args = process.argv.slice(2);
  const here = loadRules({ from: process.cwd() });
  const root = here.root;
  const games = args.includes('--all')
    ? readdirSync(root).filter(d => !d.startsWith('.') && existsSync(join(root, d, 'game')))
    : args.length ? args : here.game ? [here.game] : [];
  if (!games.length) { console.error('用法：node shared/tools/game-audit.mjs <Game> | --all（或在 <Game>/game 內 npm run audit）'); process.exit(2); }
  let failed = false;
  for (const g of games) {
    if (!existsSync(join(root, g, 'game'))) { console.error(`${g}：找不到 ${g}/game/`); failed = true; continue; }
    if (!printResults(g, await auditGame(root, g))) failed = true;
  }
  process.exitCode = failed ? 1 : 0;
}
