// Pre-commit checks, scoped to what is staged (installed by `git config core.hooksPath .githooks`).
//   <Game>/… outside art/           -> that game's `npm test` + game-audit (must-level failures block the commit)
//   <Game>/game.profile.json         -> the above, plus the shared/tools tests (they validate every profile)
//   templates/ of lite-skillgame-stack -> the template's `npm test` (includes the D-gate playtest on 8 seeds)
//   shared/tools/, shared/loop/ or rules.json -> the shared/tools tests; every game's audit is printed for information only
//   art/, game/src/assets/, shared/recipes/, shared/index/, shared/tests/, shared/loop/, knowledge-base/, bootstrap.md
//                                    -> index-build --check (asset / knowledge-card / test indexes and the bootstrap §0 table are fresh)
//   <Game>/docs/loop/ (loop events) count as that game's files like any other doc
// Manual run on chosen paths: node shared/tools/precommit.mjs --files TwinStrike/README.md …
// Slow gates (`npm run build && npm run size`, `npm run playtest` on 30 seeds) stay manual / CI (knowledge-base/08).
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditGame, printResults } from './game-audit.mjs';
import { findRoot } from './rules.mjs';

const TEMPLATE = '.claude/skills/lite-skillgame-stack/templates/';
const isProfile = p => /^[^/]+\/game\.profile\.json$/.test(p);

/**
 * The games whose `npm test` and audit must pass for these staged paths (forward slashes).
 * Art-only changes (manifest, raw images, prompts) cannot affect gdd or sim, so they only get the central-index check.
 * The profile is not exempt: its flags decide which documents and tests the game owes (RULE-GAME-DOCS reads
 * scriptedProgression), so a profile-only commit is checked like any other change to the game.
 */
export function stagedGames(staged, hasGame) {
  return [...new Set(staged.filter(p => p.split('/')[1] !== 'art').map(p => p.split('/')[0]))].filter(g => !g.startsWith('.') && hasGame(g));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/').endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const root = findRoot(process.cwd());
  const fi = process.argv.indexOf('--files');
  const staged = (fi >= 0 ? process.argv.slice(fi + 1).join('\n')
    : execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMRD'], { cwd: root, encoding: 'utf8' }))
    .split('\n').map(s => s.trim().replace(/\\/g, '/')).filter(Boolean);
  if (!staged.length) process.exit(0);

  const games = stagedGames(staged, g => existsSync(join(root, g, 'game')));
  const touches = prefix => staged.some(p => p.startsWith(prefix));
  const failures = [];
  const run = (label, cmd, args, cwd) => {
    console.log(`\n▶ ${label}`);
    const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: cmd === 'npm' && process.platform === 'win32' });   // npm is npm.cmd on Windows
    if (r.status !== 0) failures.push(label);
  };

  if (touches('shared/tools/') || touches('shared/loop/') || touches('knowledge-base/index/rules.json') || staged.some(isProfile)) {   // context.test.mjs validates every profile
    const tests = readdirSync(join(root, 'shared', 'tools')).filter(f => f.endsWith('.test.mjs')).map(f => `shared/tools/${f}`);
    run('shared/tools 測試（game-audit 規則）', process.execPath, ['--test', ...tests], root);
    console.log('\n（規則有改：以下各遊戲 audit 只供參考，不擋這次 commit）');
    for (const g of readdirSync(root).filter(d => !d.startsWith('.') && existsSync(join(root, d, 'game')))) printResults(g, await auditGame(root, g));
  }
  // Asset manifests, shipped media, recipes, facets, test registry, knowledge pages or rules changed -> the generated indexes must be rebuilt in the same commit
  if (staged.some(p => /\/art\/|\/game\/src\/assets\/|^shared\/recipes\/|^shared\/index\/|^shared\/tests\/|^shared\/loop\/|^knowledge-base\/|references\/bootstrap\.md$/.test(p)))
    run('中央索引：資產＋知識卡＋測試卡（index-build --check）', process.execPath, ['shared/tools/index-build.mjs', '--check'], root);
  if (touches(TEMPLATE)) run('範本 npm test', 'npm', ['test'], join(root, TEMPLATE));
  for (const g of games) {
    run(`${g} npm test`, 'npm', ['test'], join(root, g, 'game'));
    console.log(`\n▶ ${g} audit`);
    if (!printResults(g, await auditGame(root, g))) failures.push(`${g} audit`);
  }

  if (failures.length) {
    console.error(`\n✘ pre-commit 未通過：${failures.join('、')}。修好再 commit；規則與門檻見 knowledge-base/index/rules.json。`);
    process.exit(1);
  }
  console.log('\n✔ pre-commit 通過');
}
