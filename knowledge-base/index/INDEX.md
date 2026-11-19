# 規則 ↔ 知識庫 ↔ 資產 索引（自動產生）

> 產生物，禁止手改：`node shared/tools/index-build.mjs`。規則來源 [rules.json](rules.json)，資產來源各款 `art/manifest.json` 與 `shared/recipes/`，知識卡來源各頁 front-matter，測試卡來源 `shared/tests/registry.json`；機器可讀版 [assets.json](assets.json)、[kb.json](kb.json)、[tests.json](tests.json)。

## 規則（32 條）

| 規則 | 等級 | 把關 | 測試卡 | 為什麼 | 怎麼做 |
|---|---|---|---|---|---|
| `RULE-BUNDLE-SIZE` | must | 程式 | `TEST-SIZE` | [04_tech-stack.md](../../knowledge-base/04_tech-stack.md) | [stack-and-budget.md](../../.claude/skills/lite-skillgame-stack/references/stack-and-budget.md) |
| `RULE-NO-RUNTIME-CDN` | must | 程式 | `TEST-SIZE` | [04_tech-stack.md](../../knowledge-base/04_tech-stack.md) | [SKILL.md](../../.claude/skills/lite-skillgame-stack/SKILL.md) |
| `RULE-DRAWCALL-2D` | must | 人工審查 | `TEST-DRAWCALL-REVIEW` | [04_tech-stack.md](../../knowledge-base/04_tech-stack.md) | [drawcalls-assets.md](../../.claude/skills/lite-skillgame-stack/references/drawcalls-assets.md) |
| `RULE-DRAWCALL-3D` | must | 人工審查 | `TEST-DRAWCALL-REVIEW` | [04_tech-stack.md](../../knowledge-base/04_tech-stack.md) | [drawcalls-assets.md](../../.claude/skills/lite-skillgame-stack/references/drawcalls-assets.md) |
| `RULE-SIM-PURITY` | must | 程式 | `TEST-AUDIT` | [01_skill-integrity.md](../../knowledge-base/01_skill-integrity.md) | [SKILL.md](../../.claude/skills/lite-skillgame-stack/SKILL.md) |
| `RULE-SKILL-DOMINANCE` | should | 程式 | `TEST-SKILL-DOMINANCE` | [01_skill-integrity.md](../../knowledge-base/01_skill-integrity.md) | [12_genre-recipes.md](../../knowledge-base/12_genre-recipes.md) |
| `RULE-SKILL-BASELINE` | should | 程式 | `TEST-SKILL-BASELINE` | [01_skill-integrity.md](../../knowledge-base/01_skill-integrity.md) | [01_skill-integrity.md](../../knowledge-base/01_skill-integrity.md) |
| `RULE-SKILL-EVIDENCE` | must | 程式 | `TEST-SKILL-EVIDENCE` | [01_skill-integrity.md](../../knowledge-base/01_skill-integrity.md) | [2026-11-11-skill-evidence.md](../../knowledge-base/decisions/2026-11-11-skill-evidence.md) |
| `RULE-SKILL-NOT-LUCK` | must | 程式 | `TEST-SKILL-NOT-LUCK` | [01_skill-integrity.md](../../knowledge-base/01_skill-integrity.md) | [2026-11-11-skill-evidence.md](../../knowledge-base/decisions/2026-11-11-skill-evidence.md) |
| `RULE-SKILL-BEATS-SIMPLE` | must | 程式 | `TEST-SKILL-BEATS-SIMPLE` | [01_skill-integrity.md](../../knowledge-base/01_skill-integrity.md) | [2026-11-11-skill-evidence.md](../../knowledge-base/decisions/2026-11-11-skill-evidence.md) |
| `RULE-SKILL-CLOSENESS` | must | 人工審查 | `TEST-SKILL-CLOSENESS-REVIEW` | [01_skill-integrity.md](../../knowledge-base/01_skill-integrity.md) | [2026-11-11-skill-evidence.md](../../knowledge-base/decisions/2026-11-11-skill-evidence.md) |
| `RULE-CURVE-TREND` | must | 程式 | `TEST-CURVE` | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) |
| `RULE-CURVE-LINEARITY` | must | 程式 | `TEST-CURVE` | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) |
| `RULE-CURVE-PEAKS` | must | 程式 | `TEST-CURVE` | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) |
| `RULE-CURVE-CLIFF` | must | 程式 | `TEST-CURVE` | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) |
| `RULE-CURVE-FLOW` | must | 程式 | `TEST-CURVE` | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) |
| `RULE-CURVE-BEATGRID` | must | 程式 | `TEST-CURVE` | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) | [12_genre-recipes.md](../../knowledge-base/12_genre-recipes.md) |
| `RULE-CURVE-PHRASE` | must | 程式 | `TEST-CURVE` | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) |
| `RULE-FX-FILTER` | should | 人工審查 | `TEST-FX-FILTER-REVIEW` | [05_juice-and-feel.md](../../knowledge-base/05_juice-and-feel.md) | [juice.md](../../.claude/skills/lite-skillgame-stack/references/juice.md) |
| `RULE-LEGAL-EXCLUDE-CHANCE` | should | 人工審查 | `TEST-LEGAL-EXCLUDE-REVIEW` | [02_market-and-legal.md](../../knowledge-base/02_market-and-legal.md) | [01_skill-integrity.md](../../knowledge-base/01_skill-integrity.md) |
| `RULE-ART-TW-TABOO` | must | 人工審查 | `TEST-ART-TABOO-REVIEW` | [tw-themes.md](../../SwarmDuel/knowledge/themes/tw-themes.md) | [02_art_spec.md](../../TwinStrike/gdd/02_art_spec.md) |
| `RULE-GAME-DOCS` | must | 程式 | `TEST-AUDIT` | [08_production-workflow.md](../../knowledge-base/08_production-workflow.md) | [bootstrap.md](../../.claude/skills/lite-skillgame-stack/references/bootstrap.md) |
| `RULE-GAME-REPORTS` | must | 程式 | `TEST-AUDIT` | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) | [playtest.mjs](../../.claude/skills/lite-skillgame-stack/templates/tools/playtest.mjs) |
| `RULE-AF-ADAPTATION` | must | 程式 | `TEST-AUDIT` | [16_ad-funnel-games.md](../../knowledge-base/16_ad-funnel-games.md) | [_TEMPLATE_spec.md](../../knowledge-base/ad-funnel/_TEMPLATE_spec.md) |
| `RULE-TEMPLATE-LEFTOVER` | should | 程式 | `TEST-AUDIT` | [05_juice-and-feel.md](../../knowledge-base/05_juice-and-feel.md) | [bootstrap.md](../../.claude/skills/lite-skillgame-stack/references/bootstrap.md) |
| `RULE-REPORT-FRESH` | must | 程式 | `TEST-AUDIT` | [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) | [dominance.mjs](../../.claude/skills/lite-skillgame-stack/templates/tools/lib/dominance.mjs) |
| `RULE-SPEC-CONSTANTS` | must | 程式 | `TEST-AUDIT` | [game-spec-template.md](../../.claude/skills/lite-skillgame-stack/references/game-spec-template.md) | [08_production-workflow.md](../../knowledge-base/08_production-workflow.md) |
| `RULE-SPEC-FAIRNESS` | must | 程式 | `TEST-AUDIT` | [01_skill-integrity.md](../../knowledge-base/01_skill-integrity.md) | [game-spec-template.md](../../.claude/skills/lite-skillgame-stack/references/game-spec-template.md) |
| `RULE-KB-CITED` | should | 程式 | `TEST-AUDIT` | [README.md](../../knowledge-base/README.md) | [bootstrap.md](../../.claude/skills/lite-skillgame-stack/references/bootstrap.md) |
| `RULE-ASSET-REGISTER` | should | 程式 | `TEST-AUDIT` | [2026-10-21-kb-asset-architecture.md](../../knowledge-base/decisions/2026-10-21-kb-asset-architecture.md) | [10_asset-library.md](../../knowledge-base/10_asset-library.md) |
| `RULE-KB-CARDS` | must | 程式 | `TEST-INDEX` | [2026-11-10-libraries-and-loop.md](../../knowledge-base/decisions/2026-11-10-libraries-and-loop.md) | [2026-11-10-libraries-and-loop.md](../../knowledge-base/decisions/2026-11-10-libraries-and-loop.md) |
| `RULE-KB-CARD-SIZE` | should | 程式 | `TEST-INDEX` | [2026-11-10-libraries-and-loop.md](../../knowledge-base/decisions/2026-11-10-libraries-and-loop.md) | [2026-11-10-libraries-and-loop.md](../../knowledge-base/decisions/2026-11-10-libraries-and-loop.md) |

## 知識卡（112 張，18 頁；未分卡 27 頁）

| 頁 | id | kind | topic | 卡片 | 略過 |
|---|---|---|---|---|---|
| [01_skill-integrity.md](../../knowledge-base/01_skill-integrity.md) | `KB-skill-integrity` | principle | fairness | 6 | 0 |
| [02_market-and-legal.md](../../knowledge-base/02_market-and-legal.md) | `KB-market-legal` | research | market, legal | 7 | 0 |
| [03_design-patterns.md](../../knowledge-base/03_design-patterns.md) | `KB-design-patterns` | method | design | 6 | 0 |
| [04_tech-stack.md](../../knowledge-base/04_tech-stack.md) | `KB-tech-stack` | principle | tech | 9 | 0 |
| [05_juice-and-feel.md](../../knowledge-base/05_juice-and-feel.md) | `KB-juice-feel` | method | juice | 5 | 0 |
| [06_art-pipeline.md](../../knowledge-base/06_art-pipeline.md) | `KB-art-pipeline` | method | art | 5 | 0 |
| [07_themes-and-liveops.md](../../knowledge-base/07_themes-and-liveops.md) | `KB-themes-liveops` | research | theme | 4 | 0 |
| [08_production-workflow.md](../../knowledge-base/08_production-workflow.md) | `KB-production-workflow` | method | process | 4 | 0 |
| [10_asset-library.md](../../knowledge-base/10_asset-library.md) | `KB-asset-library` | method | art | 2 | 4 |
| [11_terrain-style-kit.md](../../knowledge-base/11_terrain-style-kit.md) | `KB-terrain-style-kit` | recipe | art | 8 | 0 |
| [12_genre-recipes.md](../../knowledge-base/12_genre-recipes.md) | `KB-genre-recipes` | recipe | design, tech | 4 | 0 |
| [13_input-fairness.md](../../knowledge-base/13_input-fairness.md) | `KB-input-fairness` | method | input, fairness | 5 | 0 |
| [14_audio.md](../../knowledge-base/14_audio.md) | `KB-audio` | method | audio | 5 | 0 |
| [15_reference-games.md](../../knowledge-base/15_reference-games.md) | `KB-reference-games` | research | market, tech, art | 9 | 0 |
| [16_ad-funnel-games.md](../../knowledge-base/16_ad-funnel-games.md) | `KB-ad-funnel-games` | research | market, design | 6 | 0 |
| [16_difficulty-curve.md](../../knowledge-base/16_difficulty-curve.md) | `KB-difficulty-curve` | method | difficulty | 7 | 0 |
| [17_design-principles.md](../../knowledge-base/17_design-principles.md) | `KB-design-principles` | principle | design | 9 | 1 |
| [af-gate-lane-shooter.md](../../knowledge-base/ad-funnel/af-gate-lane-shooter.md) | `KB-af-gate-lane-shooter` | research | design, market | 11 | 0 |

## 資產（5 筆）

依遊戲：shared 5　依狀態：template 5

### shared

| id | 類型 | 狀態 | 名稱 | 檔案 | 重用 |
|---|---|---|---|---|---|
| `shared.tpl.fx.shake` | fx-sheet | template | skill 範本 shake.js | [shake.js](../../.claude/skills/lite-skillgame-stack/templates/src/fx/shake.js) | template |
| `shared.tpl.fx.overlay` | fx-sheet | template | skill 範本 overlay.js | [overlay.js](../../.claude/skills/lite-skillgame-stack/templates/src/fx/overlay.js) | template |
| `shared.tpl.fx.shockwave` | fx-sheet | template | skill 範本 shockwave.js | [shockwave.js](../../.claude/skills/lite-skillgame-stack/templates/src/fx/shockwave.js) | template |
| `shared.tpl.fx.particles` | fx-sheet | template | skill 範本 particles.js | [particles.js](../../.claude/skills/lite-skillgame-stack/templates/src/fx/particles.js) | template |
| `shared.tpl.terrain.dust` | background | template | skill 範本地表材質 dust（AI 生成 tile） | [dust.png](../../.claude/skills/lite-skillgame-stack/templates/src/assets/terrain/dust.png) | template |
