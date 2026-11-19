# 新專案起手

## 0. 開工前必讀（每款新遊戲都要；範本只帶程式，設計知識在知識庫）

依節點讀完再動手，讀過哪些頁寫進 `<NewGame>/README.md`。**只看範本與單一規格書就開工，是 GateLane 漏掉難度曲線、手感與改造的原因**（2026-10-21 檢討）。

下表由節點圖（`shared/loop/nodes.json`）× 知識卡索引產生，不要手改（`index-build --check` 會擋）。節點只宣告 facet 查詢，知識庫新增或改標的段落會自動出現在對應節點。實際做的時候用 `node shared/tools/loop.mjs next <NewGame>`：依本作 profile 篩選，並附段落全文、有效規則與可跑的測試。

<!-- generated:loop-mustread (shared/loop/nodes.json × knowledge-base/index/kb.json; node shared/tools/index-build.mjs) -->
| 節點 | 必讀（知識卡所在頁；`*` profile、節點預算內） | 產出 | 關卡 |
|---|---|---|---|
| **N0-kickoff** 立項 ✋ | [02_market-and-legal](../../../../knowledge-base/02_market-and-legal.md)（7）、[16_ad-funnel-games](../../../../knowledge-base/16_ad-funnel-games.md)（5）、[15_reference-games](../../../../knowledge-base/15_reference-games.md)（1）、[01_skill-integrity](../../../../knowledge-base/01_skill-integrity.md)（3）、[06_art-pipeline](../../../../knowledge-base/06_art-pipeline.md)（1） | `game.profile.json`、`README.md` | `RULE-LEGAL-EXCLUDE-CHANCE` |
| **N1-derandomize** 去隨機化 | [01_skill-integrity](../../../../knowledge-base/01_skill-integrity.md)（5）、[03_design-patterns](../../../../knowledge-base/03_design-patterns.md)（1）、[16_difficulty-curve](../../../../knowledge-base/16_difficulty-curve.md)（1）、[13_input-fairness](../../../../knowledge-base/13_input-fairness.md)（3）、[04_tech-stack](../../../../knowledge-base/04_tech-stack.md)（1） | `gdd/03_skill_integrity.md` | — |
| **N2-spec** 玩法規格（含改編題改造對照） ✋ | [01_skill-integrity](../../../../knowledge-base/01_skill-integrity.md)（6）、[17_design-principles](../../../../knowledge-base/17_design-principles.md)（5）、[16_ad-funnel-games](../../../../knowledge-base/16_ad-funnel-games.md)（5）、[12_genre-recipes](../../../../knowledge-base/12_genre-recipes.md)（4）、[13_input-fairness](../../../../knowledge-base/13_input-fairness.md)（4）、[03_design-patterns](../../../../knowledge-base/03_design-patterns.md)（5）、[16_difficulty-curve](../../../../knowledge-base/16_difficulty-curve.md)（1）、[02_market-and-legal](../../../../knowledge-base/02_market-and-legal.md)（3）、[15_reference-games](../../../../knowledge-base/15_reference-games.md)（1）、[04_tech-stack](../../../../knowledge-base/04_tech-stack.md)（1） | `gdd/05_game_spec.md`、`gdd/10_tech_constraints.md`、`gdd/11_risks_open.md` | `RULE-SPEC-FAIRNESS`、`RULE-AF-ADAPTATION` |
| **N3-scaffold** 起手（複製範本） | [12_genre-recipes](../../../../knowledge-base/12_genre-recipes.md)（4）、[11_terrain-style-kit](../../../../knowledge-base/11_terrain-style-kit.md)（1） | `game/package.json` | `TEST-UNIT` |
| **N4-sim** 確定性 sim、比較策略、golden | [04_tech-stack](../../../../knowledge-base/04_tech-stack.md)（4）、[03_design-patterns](../../../../knowledge-base/03_design-patterns.md)（1）、[16_difficulty-curve](../../../../knowledge-base/16_difficulty-curve.md)（1）、[12_genre-recipes](../../../../knowledge-base/12_genre-recipes.md)（4）、[13_input-fairness](../../../../knowledge-base/13_input-fairness.md)（4）、[01_skill-integrity](../../../../knowledge-base/01_skill-integrity.md)（2） | `game/src/sim/sim.js`、`game/test/determinism.test.mjs`、`game/tools/strategies.mjs` | `RULE-SIM-PURITY`、`RULE-SPEC-CONSTANTS`、`TEST-UNIT` |
| **N5-tune** 技巧證據與難度曲線 | [01_skill-integrity](../../../../knowledge-base/01_skill-integrity.md)（1）、[16_difficulty-curve](../../../../knowledge-base/16_difficulty-curve.md)（7）、[17_design-principles](../../../../knowledge-base/17_design-principles.md)（1） | `docs/skill_evidence_report.md`、`docs/skill_evidence_ledger.json`、`docs/playtest_report.md`（`scriptedProgression` 時）、`gdd/07_difficulty_curve.md`（`scriptedProgression` 時） | `RULE-SKILL-EVIDENCE`、`RULE-SKILL-NOT-LUCK`、`RULE-SKILL-BEATS-SIMPLE`、`RULE-SKILL-DOMINANCE`、`RULE-SKILL-BASELINE`、`RULE-CURVE-*` |
| **N6-art** 美術：生成、審查、登錄 ✋ | [10_asset-library](../../../../knowledge-base/10_asset-library.md)（2）、[06_art-pipeline](../../../../knowledge-base/06_art-pipeline.md)（5）、[05_juice-and-feel](../../../../knowledge-base/05_juice-and-feel.md)（1）、[11_terrain-style-kit](../../../../knowledge-base/11_terrain-style-kit.md)（5）、[07_themes-and-liveops](../../../../knowledge-base/07_themes-and-liveops.md)（3） | `art/`、`game/src/assets/` | `RULE-ASSET-REGISTER`、`RULE-ART-TW-TABOO` |
| **N7-feel** 手感、音效、UI | [05_juice-and-feel](../../../../knowledge-base/05_juice-and-feel.md)（5）、[17_design-principles](../../../../knowledge-base/17_design-principles.md)（4）、[14_audio](../../../../knowledge-base/14_audio.md)（4）、[04_tech-stack](../../../../knowledge-base/04_tech-stack.md)（1）、[15_reference-games](../../../../knowledge-base/15_reference-games.md)（2） | `game/src/fx/feel.js`、`game/src/audio/sfx.js`、`game/src/ui/` | `RULE-FX-FILTER`、`RULE-TEMPLATE-LEFTOVER` |
| **N8-budget** 包體與 Draw Call | [04_tech-stack](../../../../knowledge-base/04_tech-stack.md)（6）、[13_input-fairness](../../../../knowledge-base/13_input-fairness.md)（1）、[01_skill-integrity](../../../../knowledge-base/01_skill-integrity.md)（1） | — | `RULE-BUNDLE-SIZE`、`RULE-NO-RUNTIME-CDN`、`RULE-DRAWCALL-*` |
| **N9-human** 人工試玩（對照 bot） ✋ | [03_design-patterns](../../../../knowledge-base/03_design-patterns.md)（1）、[16_difficulty-curve](../../../../knowledge-base/16_difficulty-curve.md)（6）、[13_input-fairness](../../../../knowledge-base/13_input-fairness.md)（3）、[01_skill-integrity](../../../../knowledge-base/01_skill-integrity.md)（1） | `playtest-data/` | `TEST-HUMAN-PLAYTEST` |
| **N10-release** 發布關卡（全量） ✋ | [01_skill-integrity](../../../../knowledge-base/01_skill-integrity.md)（2）、[02_market-and-legal](../../../../knowledge-base/02_market-and-legal.md)（1）、[04_tech-stack](../../../../knowledge-base/04_tech-stack.md)（4）、[05_juice-and-feel](../../../../knowledge-base/05_juice-and-feel.md)（1）、[10_asset-library](../../../../knowledge-base/10_asset-library.md)（2）、[16_difficulty-curve](../../../../knowledge-base/16_difficulty-curve.md)（1） | — | 全部有效規則、`TEST-UNIT` |
| **N11-feedback** 回饋到三庫 ✋ | — | — | — |

✋ = 人工檢查點。括號內是取到的段落數。本作實際要讀的段落（依 profile、含全文）：`node shared/tools/loop.mjs next <Game>`。
<!-- /generated:loop-mustread -->

- **來源是廣告玩法或既有遊戲（「復刻」「改編」）**：N2 會取對應 `ad-funnel/af-*.md` 的全部段落，尤其「Skill Game 化改造（必做）」；`gdd/05_game_spec.md` §13 要逐條回應。
- 玩法規格照 [game-spec-template.md](game-spec-template.md) 填 §0–§12。
- **「復刻」只復刻玩法結構與操作**：規格書的改造清單照做，或在 gdd/05 §13 逐條寫不採用的理由；名稱、美術、音效全部原創。
- **完成條件**：`npm test`、`npm run size`、`npm run evidence:confirm`（策略凍結後由人跑一次）、`npm run playtest`、`npm run audit` 全過。難度曲線的檢查、`gdd/07` 與試玩報告只對有腳本進程的遊戲要求（`game.profile.json` 的 `scriptedProgression` 為 false 的遊戲不適用）。`audit`（`shared/tools/game-audit.mjs`）不只看檔案在不在，也拿文件對照程式（規則全在 `knowledge-base/index/rules.json`）：
  - 必要：`RULE-GAME-DOCS`（gdd 齊全、規格 §0–§12）、`RULE-GAME-REPORTS`（報告無未通過項）、`RULE-REPORT-FRESH`（報告的 sim 版本 = `GAME.version`）、`RULE-SPEC-CONSTANTS`（規格寫成 `` `NAME` = 數值 `` 的常數與 sim 同名匯出一致）、`RULE-SPEC-FAIRNESS`（§10 精髓七條都有答案）、`RULE-AF-ADAPTATION`、`RULE-SIM-PURITY`（sim/ 程式碼沒有 DOM / 時鐘 / 未播種亂數）
  - 警告：`RULE-TEMPLATE-LEFTOVER`、`RULE-KB-CITED`（README / gdd 每階段連到知識庫）、`RULE-ASSET-REGISTER`（遊戲內圖檔 / 音檔都登錄在本作 `art/manifest.json`，改完跑 `node shared/tools/index-build.mjs`；動手前先查[中央資產索引](../../../../knowledge-base/index/INDEX.md)與 [10 資產庫](../../../../knowledge-base/10_asset-library.md)，有沒有可重用、可照 prompt 重生、或標 `reusable` 的配方）
- **pre-commit**：`git config core.hooksPath .githooks` 後，commit 時自動跑碰到的遊戲的 `npm test` 與 audit。
- 完整流程與每步驗收：[08 生產流程](../../../../knowledge-base/08_production-workflow.md)。

## 1. 複製範本

```bash
cp -r .claude/skills/lite-skillgame-stack/templates <NewGame>/game
cd <NewGame>/game && npm install && npm run dev
```

範本已驗證（2026-10-19，pixi.js 8.22.0 / gsap 3.15.0 / vite 8.3.2）：`npm test` 42/42、`npm run build` 637 KB（brotli 190 KB，含 21 KB 生成的地表 tile）；瀏覽器實測基礎 DC 1、衝擊波期間 2～3、結束回 1，60 FPS，無 WebGL 錯誤。Spine 封裝（`spineActor.js`）只對過 4.3.13 的型別定義，未接實際骨骼檔跑過。

背景是種子產生的示範地形（3 種材質 + 一層高台，0 bytes 圖片、基礎 DC 仍為 1）；鏡頭對準一座高台，一個示範角色在它後方來回走，被擋住時顯示輪廓。開發模式下 `window.__demo` 可在 console 檢查。示範玩法 Beat Tap（30 秒）：拍點依種子出現，圓漸亮、變綠時點 = perfect（分數 + 連擊、閃白、衝擊波、粒子、震動、hit-stop）；其他時間點 = whiff（扣分、紅暗角、小震動）。結束時在裝置上用 `verify()` 重播驗分並顯示「Replay verified ✓」，點擊重來；網址 `?seed=N` 換種子。

換成正式玩法：

1. 讀完 §0，填 [game-spec-template.md](game-spec-template.md)（存成 `<NewGame>/gdd/05_game_spec.md`；改編題加 §13）。
2. 依規格改寫 `src/sim/sim.js`（匯出 `GAME`，難度用固定腳本）、`tools/strategies.mjs`（強、隨機、簡單三種比較策略）、`tools/humanBots.mjs`（人性化失誤模型）、`tools/playtest.mjs`（本作的單位與難度指數 DI）、`test/determinism.test.mjs`、`main.js` 的 `playJuice`、`fx/feel.js`、`audio/sfx.js`。
3. **不要改** `src/sim/core/`、`test/core.test.mjs`、`tools/lib/`（遊戲無關，跨專案共用）。
4. `npm test` + `npm run evidence` + `npm run playtest`（有腳本進程的遊戲）過門檻後，更新 golden match 的值；策略凍結後由人跑一次 `npm run evidence:confirm`（N5 關卡只重跑已記錄的確認批次）；最後 `npm run audit`。

## 2. 目錄結構

```
<NewGame>/
├─ README.md            定位、指令、套用的 skill
├─ gdd/                 gdd-framework 產出；必備 03 / 05 / 10 / 11，有腳本進程的遊戲另加 07（RULE-GAME-DOCS）；10_tech_constraints.md 寫本專案對本 skill 的覆寫
├─ docs/               size_budget.md、skill_evidence_report.md + skill_evidence_ledger.json、playtest_report.md（工具產生）
├─ art/                 生圖 prompt、原始輸出、最終 atlas 來源
└─ game/
   ├─ index.html        #stage > #stage-shake > canvas；#fx、#hud 為兄弟節點
   ├─ vite.config.js
   ├─ scripts/size-check.mjs
   ├─ public/           transcoders/、音樂等不經打包的檔案
   ├─ test/             core.test.mjs（核心保證，不改）、determinism.test.mjs（本作規則、golden match、調校題目上的技巧證據）、evidence.test.mjs（技巧證據工具，不改）、evidence-game.test.mjs（本作策略與指令列，數值依本作改寫）、terrain.test.mjs（地形保證）
   ├─ tools/            strategies.mjs（比較策略）+ skill-evidence.mjs、bots.mjs + skill-dominance.mjs（舊配方，新遊戲刪掉；`lib/dominance.mjs` 在保留 `examples/` 時留著）、humanBots.mjs + playtest.mjs（難度曲線 D1–D8）、
   │                    lib/evidence.mjs + lib/dominance.mjs + lib/curve.mjs（通用統計，不改）、tile_check.py / tile_prep.py（材質 tile 驗收與後處理，需 Pillow）
   ├─ examples/         rhythm/、billiards/：配方範例 GameDef + bots（不需要就刪，連同 test/recipes.test.mjs）
   └─ src/
      ├─ main.js        開機、GSAP 全域設定、固定步長迴圈
      ├─ sim/           純邏輯，禁 DOM / Pixi / GSAP / Math.random / Date
      │  ├─ core/       遊戲無關：rng（無狀態雜湊、具名 stream、shuffle）、fixed（定點、查表三角、angleOf）、
      │  │              hash（stateHash）、match（Recorder、replay、verify、encodeLog、playMatch）、
      │  │              grid（valueNoise、makeTerrain、smoothCellAt、cornerMask、terrainHash）、
      │  │              timing（節奏判定）、physics（確定性物理）、input（時間戳輸入、校正、防巨集）
      │  └─ sim.js      本作規則，匯出 GAME（GameDef 契約見 core/match.js 開頭）
      ├─ render/        Pixi 圖層、spineActor.js、terrain.js / terrainBake.js / terrainConfig.js（地形）、xray.js（遮擋輪廓）
      ├─ fx/            feel.js（所有手感數值）、shake / overlay / shockwave / particles
      ├─ ui/            DOM HUD、面板（GSAP 補間）
      ├─ audio/         sfx.js：Web Audio 合成配方
      └─ debug/         drawCalls.js（只在 DEV 動態載入）
```

## 3. 迴圈契約

```
input 佇列 ─▶ Recorder.step(byte)（固定 1/60 s，可一幀多步）─▶ sim.events
                │                                          │
           記錄 input log                 render / fx 讀事件播 juice（不回寫 sim）
                │
      結束 ─▶ upload {game, version, seed, ticks, score, hash, log, choices} ─▶ verify()（客戶端顯示 / 伺服器判分）
```

- sim 只吃每 tick 1 byte 的輸入（位元配置寫在規格 §2）；點擊座標等只給演出用的資料留在 render 層。
- 規則改變結果時 `GAME.version` +1，`verify()` 會拒絕舊版本的上傳。

- 輸入進佇列，每 tick 取一筆；慢幀時不可吞掉點擊。
- hit-stop 只停 render（粒子、插值、Spine），sim 照跑。
- 加 Spine：`npm i @esotericsoftware/spine-pixi-v8@<編輯器 major.minor>`，在 `render/` 用 `SpineActor`，在 `playJuice` 裡呼叫 `actor.overlay('hit')`。

## 4. 啟動提示詞（給其他 AI 工具用）

> 請依 `.claude/skills/lite-skillgame-stack/SKILL.md` 初始化一個 HTML5 單機 Skill Game 專案：包體 ≤ 8 MB（硬上限 10 MB）、基礎 Draw Call ≤ 5。
> 0. 先照 `references/bootstrap.md` §0 讀完知識庫必讀頁；題目來自廣告玩法或既有遊戲時，對應 `af-*.md` 的改造清單逐條採用或寫理由（gdd/05 §13）。
> 1. 2D 用 PixiJS 8（鎖確切版本），動畫與打擊回饋全用 GSAP，GSAP 全域設定照 `references/gsap.md` §1。
> 2. 計分板、升級彈窗等介面用純 HTML/CSS 疊在 canvas 上。
> 3. 模擬層固定 60 Hz、確定性（禁 `Math.random` / `Date` / DOM / GSAP），只 import `src/sim/core/`，匯出 `GAME`；render 只讀 sim 事件播特效。玩法依 `gdd/05_game_spec.md`（範本 `references/game-spec-template.md`）。
> 4. Spine 用 `@esotericsoftware/spine-pixi-v8`：Track 0 基礎動作、Track 1 疊加動作、`defaultMix = 0.2`、換裝用 `setSkin` + `setupPoseSlots`（4.3 API）。
> 5. 畫面震動用 GSAP 抖動包住 canvas 的外層 `<div>`；所有手感數值集中在 `fx/feel.js`。
> 先給目錄結構，再給 `index.html`、`main.js`、`sim/sim.js`、`fx/shake.js` 骨架。完成前跑 `npm run playtest`（有腳本進程的遊戲）與 `npm run audit`，未過就回報哪一項，不要改門檻。
