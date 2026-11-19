---
id: KB-production-workflow
kind: method
topic: [process]
genre: ["*"]
reviewedAt: 2026-10-22
---
# 08 生產流程與工具 — 從點子到可玩原型

> 把 SwarmDuel 實際走過的流程抽象成新遊戲可重用的步驟。每一步列出現有的知識、工具、驗收標準。

## 1. 流程總覽
<!-- card: KB-production-workflow.overview -->

| # | 階段 | 輸入 / 知識 | 工具 / skill | 產出 | 驗收 |
|---|---|---|---|---|---|
| 1 | 選市場與品類 | [02](02_market-and-legal.md)、[03](03_design-patterns.md) | — | 一頁定位 | 不落入排除標準；有空缺或差異化 |
| 2 | 去隨機化設計 | [01](01_skill-integrity.md) §3 | — | 隨機來源清單 + 公平化做法 | 精髓七條全過 |
| 3 | GDD + 玩法規格 | 規則卡範本、[01](01_skill-integrity.md) | `gdd-framework`（`~/.claude/skills/`）、[game-spec-template.md](../.claude/skills/lite-skillgame-stack/references/game-spec-template.md) | `gdd/00–11`、`gdd/05_game_spec.md` | 03 技巧完整性、10 技術、11 風險必寫；規格 §0–§12 填完 |
| 4 | 專案起手 | [04](04_tech-stack.md) | `lite-skillgame-stack` templates | 可跑骨架 | `npm run dev` 基礎 DC 1 |
| 5 | 確定性 sim + 測試 | [04](04_tech-stack.md) §4、規格 | 範本 `sim/core/`（不改）；依規格改寫 `sim/sim.js`、`test/determinism.test.mjs`（可用規格裡的 AI 提示詞） | `sim/`、`test/` | `npm test` 全過、golden match 更新 |
| 6 | 技巧證據 | [01](01_skill-integrity.md) §4、[技巧證據決策](decisions/2026-11-11-skill-evidence.md) §9 | 依規格 §9 寫 `tools/strategies.mjs`；調校用 `npm run evidence`，策略凍結後由人跑 `npm run evidence:confirm` | `docs/skill_evidence_report.md`、`docs/skill_evidence_ledger.json` | `RULE-SKILL-EVIDENCE`、`RULE-SKILL-NOT-LUCK`、`RULE-SKILL-BEATS-SIMPLE` 通過；接近程度由人判定（`RULE-SKILL-CLOSENESS`）。現有三款另有舊的技巧佔比警告（`RULE-SKILL-DOMINANCE`） |
| 6b | 難度曲線 | [16](16_difficulty-curve.md) | 腳本（難度級 + 段落表）寫進 sim；範本的 `tools/humanBots.mjs` + `tools/playtest.mjs`（依品類改寫單位與 DI）→ `npm run playtest` | `gdd/07_difficulty_curve.md`、`docs/playtest_report.md/.html` | D1–D8 全過（失敗 exit 1）；調校紀錄寫進 gdd/07。只適用有腳本進程的遊戲（`game.profile.json` 的 `scriptedProgression` 為 false 的遊戲不適用） |
| 7 | 美術 | [06](06_art-pipeline.md)、[07](07_themes-and-liveops.md) | `codex-image`、`pokesurvivor-asset-dev`（`~/.codex/skills/`） | atlas + metadata、`art/manifest.json`（每張圖的 prompt、job、參考圖、採用與否） | 身分一致、真 alpha、validate 通過；`node shared/tools/index-build.mjs` 無錯誤 |
| 8 | 打擊感 / UI | [05](05_juice-and-feel.md) | `FEEL`、GSAP | juice、DOM HUD、結算 | LOW 模式資訊不丟 |
| 9 | 包體 / 效能 | [04](04_tech-stack.md) §5–6 | `npm run size`、drawCalls.js、Spector.js | size budget 實測 | ≤ 8 MB、DC ≤ 5 |
| 10 | 交付自檢 | [04](04_tech-stack.md) §9 | — | — | 清單全勾 |
| 11 | 完整度把關 | `rules.json` 的 `RULE-GAME-*`、`RULE-AF-ADAPTATION` | `npm run audit`（[shared/tools/game-audit.mjs](../shared/tools/game-audit.mjs)）；commit 時由 pre-commit hook 自動跑（`git config core.hooksPath .githooks`） | — | 必要項目全過（含報告版本、規格常數對帳、§10 答案、sim 純度）；警告項有處理或寫明理由 |

## 2. 常用指令
<!-- card: KB-production-workflow.commands -->

```bash
cp -r .claude/skills/lite-skillgame-stack/templates <NewGame>/game
```

```bash
npm run build && npm run size
```

```bash
npm test
```

```bash
npm run evidence
```

```bash
npm run playtest
```

```bash
npm run audit
```

```bash
codex exec --skip-git-repo-check --sandbox read-only < art/prompts/<asset>.txt
```

## 3. Skill / 工具所在位置
<!-- card: KB-production-workflow.tool-locations -->

| 名稱 | 位置 | 用途 | 風險 |
|---|---|---|---|
| `lite-skillgame-stack` | repo `.claude/skills/` | 技術規範 + 範本 | — |
| `gdd-framework` | `~/.claude/skills/` | GDD 結構 | 不在 repo，換機要另裝 |
| `codex-image` | `~/.claude/skills/` | Codex CLI 生圖 | 同上 |
| `pokesurvivor-asset-dev` | `~/.codex/skills/` | sprite 契約、`sprite_sheet.py` pack / validate | 不在 repo；`anim_frames.py` 寫死此路徑 |
| `skill-evidence.mjs`、`lib/evidence.mjs`、`strategies.mjs` | 範本 `tools/` | 技巧證據報告與確認紀錄（通用統計 + 本作策略） | `strategies.mjs` 每款要依規格 §9 重寫；`lib/evidence.mjs` 不改 |
| `skill-dominance.mjs`、`lib/dominance.mjs`、`bots.mjs` | 範本 `tools/` | 舊的技巧佔比報告（只用於現有三款） | 新遊戲刪掉 `bots.mjs`、`skill-dominance.mjs`；`lib/dominance.mjs` 在保留 `examples/` 時留著 |
| `humanBots.mjs`、`playtest.mjs`、`lib/curve.mjs` | 範本 `tools/`（2026-10-21 抽入）；節奏類完整版在 `TwinStrike/game/tools/` | 人性化試玩、難度曲線驗收（[16](16_difficulty-curve.md)） | `humanBots` / `playtest` 的單位、負荷模型與 DI 每款改寫；`lib/curve.mjs` 不改 |
| `index-build.mjs` | repo `shared/tools/` | 從各款 `art/manifest.json` 與 `shared/recipes/` 產生 `knowledge-base/index/assets.json`、`INDEX.md`；驗證檔案存在、id 唯一、參照、內容雜湊 | `--update-hashes` 重算雜湊；`--check` 由 pre-commit 執行 |
| `game-audit.mjs`、`precommit.mjs` | repo `shared/tools/`、`.githooks/` | 完整度把關（gdd、報告版本、規格對帳、§10、sim 純度、改造對照、範本殘留、知識庫引用、資產登錄）；pre-commit 只跑碰到的遊戲 | 要求清單在 `rules.json`；把關本身的測試 `node --test shared/tools/*.test.mjs`（`fixtures/audit-bad` 故意違反每條規則） |
| `anim_prompts.py / gen_anim.sh / anim_frames.py / anim_preview.py` | `SwarmDuel/tools/` | 8 方向像素動畫管線 | 只適用像素俯視角色 |
| `.claude/launch.json` | repo | dev server 預覽（swarm-duel :5173） | 新遊戲要加一筆 |

## 4. 給其他 AI 的啟動提示詞
<!-- card: KB-production-workflow.bootstrap-prompt -->

見 [bootstrap.md §4](../.claude/skills/lite-skillgame-stack/references/bootstrap.md)。
