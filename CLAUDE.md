# SKILLGAME

輕量化 HTML5 單機 Skill Game 的知識與工具包（skillgame-kit）。新遊戲各自一個資料夾；`SwarmDuel/`、`TwinStrike/`、`LanternHold/`、`GateLane/` 只收文字規格當範例，程式與美術未收錄（見 [README](README.md)）。

跨遊戲的調查與技術框架彙整在 [`knowledge-base/`](knowledge-base/README.md)（市場法規、規則卡索引、技術棧、美術管線、生產流程、知識缺口）。開新遊戲前先讀。

## 規則（唯一來源）

所有門檻與規範寫在 [`knowledge-base/index/rules.json`](knowledge-base/index/rules.json)，每條有 ID、值、量測方法、把關程式。把關程式（`size-check`、`skill-dominance`、`playtest`）經 [`shared/tools/rules.mjs`](shared/tools/rules.mjs) 取值，**不得在程式或文件裡另寫數字**。架構說明：[`knowledge-base/decisions/2026-10-21-kb-asset-architecture.md`](knowledge-base/decisions/2026-10-21-kb-asset-architecture.md)。

## 技術規範（必讀）

寫任何遊戲程式（渲染、動畫、GSAP、特效、Spine、資源載入、選型）前先載入 repo skill **`lite-skillgame-stack`**（`.claude/skills/lite-skillgame-stack/`）。硬規則摘要（數值以 rules.json 為準）：

- 包體：`RULE-BUNDLE-SIZE`（目標 8 MB、硬上限 10 MB），`npm run build && npm run size` 必過
- Draw Call：`RULE-DRAWCALL-2D`（≤ 5）、`RULE-DRAWCALL-3D`（≤ 9）；UI 一律 HTML/CSS 疊在 canvas 上
- 技術棧白名單：PixiJS 8 / GSAP 3 / spine-pixi-v8 / Web Audio（Howler、ogl、three 視需要），版本鎖確切值，不引入整套引擎
- 模擬層確定性：`RULE-SIM-PURITY`（`sim/` 禁 DOM / Pixi / GSAP / `Math.random` / `Date`）；打擊感只在 render / UI 層，由 sim 事件驅動
- 技巧主導：`RULE-SKILL-DOMINANCE`；難度曲線：`RULE-CURVE-*`（knowledge-base/16_difficulty-curve.md）
- 手感數值集中在 `fx/feel.js` 的 `FEEL`，GSAP 參數照 skill 的 `references/gsap.md`
- 不從 CDN 執行期載入任何程式或 wasm：`RULE-NO-RUNTIME-CDN`

## 優先序

| 層 | 角色 | 能不能定數字 |
|---|---|---|
| `knowledge-base/index/rules.json` | 規則本身 | ✅ 唯一來源 |
| `<Game>/config/rules.overrides.json` | 單一遊戲的例外 | ✅ 只能改 `overridePolicy` 允許的規則，且必附理由（resolver 會擋） |
| skill（`lite-skillgame-stack`） | 做法 | ❌ 只引用規則 ID |
| 知識庫內文 | 理由與方法論 | ❌ 只引用規則 ID |
| 各遊戲 gdd | 設計與規格 | ❌ |

已知覆寫：

| 專案 | 覆寫 | 出處 |
|---|---|---|
| SwarmDuel | `RULE-FX-FILTER` = 不使用任何 filter（衝擊波改用 sprite 擴散環），見 `SwarmDuel/config/rules.overrides.json`。尚未建規則、仍以文件為準：sprite 不用 KTX2；不做通用粒子系統；WebGPU 關閉 | `SwarmDuel/gdd/10_tech_constraints.md`、`SwarmDuel/docs/size_budget.md` |

新遊戲用 `.claude/skills/lite-skillgame-stack/templates/` 起手。開工前照 [`bootstrap.md` §0](.claude/skills/lite-skillgame-stack/references/bootstrap.md) 讀完知識庫必讀頁（題目來自廣告玩法或既有遊戲時，對應 `af-*.md` 的改造清單要在 gdd/05 §13 逐條回應，「復刻」不例外）；交付前 `npm run audit` 必過（`RULE-GAME-*`、`RULE-REPORT-FRESH`、`RULE-SPEC-*`、`RULE-AF-ADAPTATION`、`RULE-SIM-PURITY`）。本機 pre-commit hook 每個 clone 啟用一次：`git config core.hooksPath .githooks`（只跑這次 commit 碰到的遊戲的 `npm test` 與 audit，必要項目未過就擋下）。
