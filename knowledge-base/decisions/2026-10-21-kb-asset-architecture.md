# 架構決策：知識庫＋資產的規則索引、資產索引與遷移

| 欄位 | 內容 |
|---|---|
| 狀態 | **已定案，尚未實作**（本文件不搬任何檔案）；§10 待決事項已於 2026-10-21 三方討論決定 |
| 日期 | 2026-10-21 |
| 參與 | 企劃（決策）、Claude Opus 5.5（主持與裁決建議）、Codex gpt-6-astra、Gemini 4 Argon（High），兩次各兩輪的 CLI 圓桌討論 |
| 範圍 | `knowledge-base/`、知識庫資產索引、各遊戲 `art/` 的資產登錄、`.claude/skills/lite-skillgame-stack/`、把關程式（包體、技巧主導、難度曲線） |
| 不在範圍 | 遊戲程式本身；`TwinStrike/art/` 的內容（由主線 session 負責，只能唯讀讀取或協調） |

---

## 1. 背景與問題

盤點日（2026-10-21）的現況：

| # | 問題 | 證據 |
|---|---|---|
| P1 | 頁面依建立時間編號，不依使用流程；平行 session 撞號 | `16_ad-funnel-games.md` 與 `16_difficulty-curve.md` 同時存在 |
| P2 | 範例綁死單一遊戲，遊戲一改知識庫就過時 | 12、16 指向 TwinStrike 檔案；10、11 指向 SwarmDuel |
| P3 | 可重用工具留在遊戲資料夾 | `pack_atlas.py`、`bake_bg.py`、`dechecker.py`、`humanBots.mjs`、`playtest.mjs` 都在 TwinStrike 底下 |
| P4 | 規範與紀錄混在一起 | 16 難度曲線頁同時有 D1–D8 門檻與調校歷程 |
| P5 | 同一條規則寫在多處 | skill、知識庫、各遊戲 gdd，**以及程式常數**：`templates/tools/lib/dominance.mjs` 的 `THRESHOLDS = { skillShare: 0.7, topWinRate: 0.7 }`、`templates/scripts/size-check.mjs` 的 `TARGET = 8 MB, HARD = 10 MB` |
| P6 | 資產索引只涵蓋一款遊戲 | `knowledge-base/assets/asset-index.json` 67 筆全是 SwarmDuel；TwinStrike 的資產只記在 `TwinStrike/art/raw/LOG.md` 與 `art/atlas.json` |
| P7 | 跨遊戲研究放在遊戲資料夾 | `SwarmDuel/knowledge/`（38 張規則卡、markets、themes、_notes） |
| P8 | 技術規範只對 Claude 可見 | `.claude/` 是隱藏資料夾，ripgrep 預設不搜；Codex 讀 `AGENTS.md`，不會自動載入 `.claude/skills/` |
| P9 | 不是 git repo | 無法做分支隔離、固定版本連結、差異審查；平行 session 只能互相覆寫 |

---

## 2. 決策摘要

1. **規則集中一份**：`knowledge-base/index/rules.json` 是所有規則的唯一事實來源；ID 不含數字；把關程式一律經 resolver 取值，不再寫死常數。
2. **覆寫分遊戲存放**：每款遊戲一個 JSON 覆寫檔；gdd 裡的覆寫表由它產生，不從 Markdown 反向擷取。
3. **資產分款維護、集中彙整**：每款遊戲 `art/manifest.json` 是資產來源；`knowledge-base/index/assets.json` 由 `index:build` 產生，禁止手改。
4. **規則與資產各自獨立，用條件互相連結**；給人與 AI 的導覽索引由腳本從兩份 json 產生。
5. **共用內容移到頂層 `shared/`**：技術規範、提詞模板、程式繪製配方、打包工具；`.claude/skills/` 與新增的 `AGENTS.md` 只放薄入口。
6. **知識庫頁面改英文語意檔名、分資料夾**；調校紀錄回到各遊戲 `docs/`；跨遊戲研究移入知識庫。
7. **先 `git init`，再分四階段遷移**，每階段可獨立完成與驗證；第三款遊戲開工時才建 `game:init` 與 `verify`。

### 優先序（取代現行「專案文件 > skill > 知識庫摘要」）

| 層 | 角色 | 能不能定數字 |
|---|---|---|
| `knowledge-base/index/rules.json` | 規則本身 | ✅ 唯一來源 |
| `<Game>/config/rules.overrides.json` | 單一遊戲的例外 | ✅ 只能改 `overridePolicy` 允許的規則，且必附理由 |
| `shared/stack/`（技術規範） | 做法：怎麼達成規則 | ❌ 只引用規則 ID |
| 知識庫內文 | 理由與方法論 | ❌ 只引用規則 ID |
| 各遊戲 gdd | 該作的設計與規格 | ❌ 覆寫表由 overrides 產生 |

> 變更 `CLAUDE.md` 的優先序段落屬於專案指令，於第 1 階段完成時一併修改。

---

## 3. 分歧與裁決

| # | 議題 | Codex | Gemini | **裁決** | 理由 |
|---|---|---|---|---|---|
| 1 | 規則能否被覆寫 | 8 MB 是內部預算或平台硬限制要先查；法規依管轄區判斷 | 分 `hard_gate`（法規、8 MB 禁覆寫）與 `overridable` | **一條規則可有多個門檻，各自有覆寫政策**：`RULE-BUNDLE-SIZE` 的目標 8 MB 可覆寫（附理由）、硬上限 10 MB 禁止覆寫。法規類規則以 `jurisdiction` 決定適用，不靠覆寫 | 專案本來就是「目標 8 MB、硬上限 10 MB」兩段，兩方顧慮都被涵蓋 |
| 2 | 資產與規則怎麼連 | 能推導就推導，不能推導才在資產標 `applicableRuleIds`；合規證據另存，綁內容雜湊與規則版本 | 規則用 `selector` 在驗收時比對，資產不標規則 | **規則端 `selector` 為主**（資產只記客觀屬性）；**人工審查類規則**（美術禁忌、法規）的結果存成**驗收證據**，綁資產內容雜湊與規則版本 | selector 省維護；證據綁雜湊防止舊審查被誤當新通過 |
| 3 | TwinStrike 納入方式 | 先建中央暫存清單，標明缺漏 | `index:build` 內建唯讀轉接器，直接讀 `atlas.json` 與 `LOG.md` | **唯讀轉接器**；正式 `manifest.json` 由主線 session 建立後移除轉接器 | 不另建檔就沒有雙重來源，也不碰 `TwinStrike/art/` |
| 4 | 遷移順序 | 先做 resolver 與把關程式、確認判定不變，最後才搬文件 | 搬文件與改名可以和轉接器同時做 | **採 Codex**：一次只動一個變數 | 同時改路徑與行為，出錯時無法判斷是哪個造成 |
| 5 | 技術規範位置 | （第 2 輪同意）`shared/stack/`，各入口引用 | 實體移到 `shared/stack/`，`.claude/` 留薄引用、新增 `AGENTS.md` | **同意兩方，但 `.claude/skills/lite-skillgame-stack/SKILL.md` 保留觸發描述與硬規則摘要**（摘要由腳本從 rules.json 產生） | Claude Code 只自動觸發 `.claude/skills/` 底下的 skill；整個搬空會失去自動載入 |
| 6 | 覆寫檔路徑 | `config/rules.overrides.json` | `gdd/overrides.json` | **`<Game>/config/rules.overrides.json`** | 它是程式讀的設定，不是設計文件；gdd 只放產生出來的表格 |
| 7 | 「規則是知識庫與資產的索引」（企劃提案） | 責任太大，兩者應獨立再以 ID 關聯 | 同意分開 | **規則是「要求」的索引；導覽索引另由腳本產生**，同時列出規則、知識庫頁、資產 | 保留企劃想要的「從規則出發找到一切」，又不讓 rules.json 背負導覽職責 |

---

## 4. 目標目錄

```
SKILLGAME/
├─ CLAUDE.md                  Claude 入口：優先序、指向 shared/stack 與 knowledge-base/index
├─ AGENTS.md                  Codex / Gemini 入口（內容同上）
├─ .gitignore                 node_modules、dist、art/raw 中未採用的大圖（另存或 LFS，見 §8）
├─ shared/
│  ├─ stack/                  技術規範本文（現 .claude/skills/lite-skillgame-stack/ 的 references 與 templates）
│  ├─ recipes/                提詞模板（現 asset-index 的 promptBlocks）、程式繪製特效配方
│  └─ tools/                  已證實可跨遊戲共用的工具（resolver、index:build、art:pack…）
├─ .claude/skills/lite-skillgame-stack/SKILL.md   薄入口：觸發描述 + 產生的硬規則摘要 + 連到 shared/stack
├─ knowledge-base/
│  ├─ README.md               依「任務」編排的閱讀路線（人工撰寫）
│  ├─ index/
│  │  ├─ rules.json           規則（唯一來源）
│  │  ├─ assets.json          資產（產生物，禁手改）
│  │  ├─ evidence/            人工審查證據（一案一檔）
│  │  └─ INDEX.md             導覽索引（產生物）：規則 ↔ 知識庫頁 ↔ 資產
│  ├─ foundation/             skill-integrity、market-legal …
│  ├─ design/                 design-patterns、genre-recipes、difficulty-curve、juice-and-feel …
│  ├─ production/             workflow、art-pipeline、audio、terrain-style-kit …
│  ├─ research/               跨遊戲研究（含 SwarmDuel/knowledge 移入的規則卡、市場、題材）、參考遊戲拆解、廣告導流玩法
│  ├─ backlog/                知識缺口，一題一檔 <priority>-<slug>.md
│  └─ decisions/              架構決策（本文件），檔名 YYYY-MM-DD-<slug>.md
└─ <Game>/
   ├─ config/rules.overrides.json
   ├─ art/manifest.json       該作資產的唯一來源
   ├─ gdd/                    覆寫表由 overrides 產生
   └─ docs/                   調校紀錄（一實驗一檔）、自動報告 reports/
```

### 命名規則

- 一律英文語意檔名（kebab-case），不用流水號；閱讀順序由 `README.md` 決定。
- 會一直新增的東西（缺口、決策、實驗、證據）一案一檔，檔名帶日期或短碼，避免平行 session 寫同一個檔。
- 規則 ID：`RULE-<領域>-<主題>`，不含門檻數字。

---

## 5. Schema

### 5.1 `knowledge-base/index/rules.json`

```json
{
  "schemaVersion": 1,
  "rules": [
    {
      "id": "RULE-BUNDLE-SIZE",
      "category": "tech",
      "level": "must",
      "scope": { "selector": { "kind": "game-build" } },
      "constraints": [
        { "name": "target", "op": "<=", "value": 8388608, "unit": "byte", "overridePolicy": "with-reason" },
        { "name": "hard",   "op": "<=", "value": 10485760, "unit": "byte", "overridePolicy": "forbid" }
      ],
      "measurement": "npm run build 後 dist/ 檔案原始大小總和，不計 gzip",
      "enforcement": { "type": "script", "ref": "shared/stack/templates/scripts/size-check.mjs" },
      "whyRef": "knowledge-base/foundation/tech-stack.md#包體預算",
      "howRef": "shared/stack/references/stack-and-budget.md",
      "source": "CLAUDE.md、SwarmDuel/docs/size_budget.md",
      "reviewedAt": "2026-10-21"
    }
  ]
}
```

| 欄位 | 必要 | 說明 |
|---|---|---|
| `id` | ✅ | 穩定、不含數字 |
| `category` | ✅ | `tech` / `fairness` / `balance` / `art` / `legal` / `process` |
| `level` | ✅ | `must`（不過不能上線）/ `should`（要說明理由）/ `hypothesis`（待驗證，不擋上線） |
| `scope.selector` | ✅ | 規則套用到什麼：`{ "kind": "sprite" }`、`{ "kind": "game-build" }`、`{ "genre": "rhythm" }` |
| `constraints[]` | ✅ | 可量測者寫 `op` / `value` / `unit`；不可量測者寫 `check`（判定條件文字）；每項各自有 `overridePolicy`：`forbid` / `with-reason` |
| `measurement` | ✅ | 怎麼量（種子組、壓縮方式、資產範圍等），沒有它就不能一致驗收 |
| `enforcement` | ✅ | `{ "type": "script", "ref": … }` 或 `{ "type": "review", "checklist": … }` |
| `whyRef` / `howRef` | ✅ | 知識庫理由、技術規範做法的連結 |
| `jurisdiction` | 法規必填 | 例如 `["US-*", "TW"]`；不適用的地區不檢查 |
| `source` / `reviewedAt` | ✅ | 出處與**實際複核**的日期（內容沒變也要更新）。到期只是提醒重看，不代表資料失效：法規 180 天、市場研究 90 天，其他類別不設天數、改動時複核（§10 已決） |

**第一批收錄**（自現有文件轉入，數值不變）：

| ID | 現在的出處 | 把關 |
|---|---|---|
| `RULE-BUNDLE-SIZE` | CLAUDE.md、size-check.mjs | script |
| `RULE-DRAWCALL-2D` / `RULE-DRAWCALL-3D` | CLAUDE.md | review（開發計數器截圖） |
| `RULE-SIM-PURITY` | CLAUDE.md（sim 禁 DOM / Pixi / GSAP / Math.random / Date） | script（grep） |
| `RULE-SKILL-DOMINANCE` | 01 §4、dominance.mjs | script |
| `RULE-CURVE-RHO`、`-R2`、`-PEAKS`、`-CLIFF`、`-FLOW`、`-BEATGRID`、`-PHRASE` | 16 難度曲線 D2–D8 | script（playtest） |
| `RULE-NO-RUNTIME-CDN` | CLAUDE.md | script |
| `RULE-FX-FILTER`（預設允許） | SwarmDuel 覆寫為禁用 | review |
| `RULE-LEGAL-EXCLUDE-CHANCE` | 02 §4 排除標準 | review，附 jurisdiction |
| `RULE-ART-TW-TABOO` | TwinStrike gdd/02 台灣禁忌 | review |

### 5.2 `<Game>/config/rules.overrides.json`

```json
{
  "schemaVersion": 1,
  "game": "SwarmDuel",
  "overrides": [
    { "rule": "RULE-FX-FILTER", "constraint": "allowed", "value": false,
      "reason": "像素風；衝擊波改 sprite 擴散環", "ref": "SwarmDuel/gdd/10_tech_constraints.md" }
  ]
}
```

- resolver 拒絕覆寫 `overridePolicy: "forbid"` 的門檻，並在報告中列出；**不得靜默忽略無效覆寫**。
- gdd 頂端的覆寫表由 `rules:render` 產生，手改會在下次產生時被覆蓋。

### 5.3 `<Game>/art/manifest.json`（資產唯一來源）

```json
{
  "schemaVersion": 1,
  "game": "TwinStrike",
  "pathBase": "TwinStrike/",
  "assets": [
    {
      "id": "twinstrike.chr.cat",
      "kind": "sprite-sheet",
      "status": "shipped",
      "files": { "raw": ["art/raw/cat_poses_t1.png"], "prompt": ["art/prompts/_history/hero_cat_poses_t1.txt"], "shipped": ["game/src/assets/cat.png"] },
      "technical": { "cell": [384, 256], "frames": 9, "format": "png8", "bytes": 117210 },
      "styleTags": ["chibi", "sticker", "side-view"],
      "provenance": { "tool": "codex-lobster", "job": "job_mvgbbqz209fc61063393a2ac", "reference": ["twinstrike.chr.cat.identity"] },
      "reusePolicy": "game-only",
      "derivedFrom": "twinstrike.chr.cat.identity",
      "recipeRef": null,
      "contentHash": "sha256:…"
    }
  ]
}
```

| 欄位 | 說明 |
|---|---|
| `id` | 跨遊戲唯一：`<game>.<kind>.<name>` |
| `kind` | `sprite-sheet` / `background` / `fx-sheet` / `key-art` / `ui` / `reference`（身分參考圖，2026-10-22 加入）/ `procedural` / `audio-recipe` |
| `status` | 沿用現行：`shipped` / `raw-only` / `rejected-take` / `placeholder` / `procedural` / `template` |
| `files` | 相對於 `pathBase` |
| `provenance` | 生成工具、job、參考圖；AI 生成的商用權利追溯 |
| `reusePolicy` | `game-only` / `reusable` / `template` |
| `contentHash` | 驗收證據綁定用 |

**不在資產上標它滿足哪些規則**；規則端 `selector` 比對（裁決 #2）。

### 5.4 `knowledge-base/index/assets.json`（產生物）

`index:build` 依序讀取各款 `art/manifest.json`、`shared/recipes/`，以及第 2 階段的 TwinStrike 唯讀轉接器，合併成單一陣列，並加上 `game`、`builtAt`。檔頭標註 `"generated": true`；CI 比對重建結果與現存檔，不一致就失敗。

### 5.5 `knowledge-base/index/evidence/<date>-<assetId>-<ruleId>.json`

```json
{ "rule": "RULE-ART-TW-TABOO", "ruleReviewedAt": "2026-10-21", "asset": "twinstrike.chr.tanuki",
  "contentHash": "sha256:…", "result": "pass", "reviewer": "企劃", "note": "楓葉為橘紅，無綠色頭飾", "date": "2026-10-21" }
```

資產內容雜湊或規則複核日期改變後，舊證據自動失效；**人工未審的項目在報告中顯示「待審」，不得顯示為通過**。

---

## 6. 第三款遊戲的流程（目標狀態）

| 步驟 | 誰 | 查什麼 | 執行 | 寫回哪裡 |
|---|---|---|---|---|
| 1. 選品類 | 企劃 + AI | `knowledge-base/research/`、`design/genre-recipes`、`index/assets.json`（`reusePolicy: reusable`） | — | `Game3/gdd/brief.md` |
| 2. 規格 | AI | `index/rules.json`（依 selector 找出適用規則） | `npm run game:init -- Game3` | `Game3/config/rules.overrides.json`（空）、`Game3/gdd/` 檢核表、從 `shared/stack/templates/` 複製的 `Game3/game/` |
| 3. 美術生成 | AI | `shared/recipes/` 提詞模板、風格參考資產 | 生圖工具 | `Game3/art/raw/`、`art/prompts/_history/`、`art/manifest.json` |
| 4. 打包 | AI | `Game3/art/atlas.json`（打包設定） | `npm run art:pack -- Game3`，接著 `npm run index:build` | `Game3/game/src/assets/`、中央 `index/assets.json` |
| 5. 驗收 | AI + 企劃 | resolver 合併後的有效規則 | `npm run verify -- Game3`（包體、sim 純度、技巧主導、D1–D8、待審清單） | `Game3/docs/reports/`、`knowledge-base/index/evidence/` |
| 6. 回饋 | AI | 新的通用做法 | — | 知識庫對應頁、`shared/recipes/`；新缺口寫 `backlog/` 一題一檔 |

---

## 7. 分階段遷移

| 階段 | 內容 | 完成條件 | 不做 |
|---|---|---|---|
| **0** | 建立 git 基準（步驟見下方） | 基準 commit 涵蓋全部原始碼、`art/`、知識庫與 lock 檔；沒有 node_modules、dist、機密 | 不搬檔、不改程式；發現的既有問題只記錄不修 |
| **1** | 建 `index/rules.json`（第一批規則）與 resolver；`size-check.mjs`、`dominance.mjs`、`playtest.mjs` 改經 resolver 取值；SwarmDuel 建 `config/rules.overrides.json`；更新 CLAUDE.md 優先序、新增 `AGENTS.md` | 所有把關程式的判定結果與改動前**逐項相同**；grep 找不到寫死的 0.7 / 8 MB | 不改文件路徑 |
| **2** | SwarmDuel 建 `art/manifest.json`（由現 `asset-index.json` 轉出）；`index:build` 加 TwinStrike 唯讀轉接器；產生 `index/assets.json` 與 `INDEX.md` | 中央索引筆數 = SwarmDuel 67 筆 + TwinStrike 轉接筆數；重建結果穩定 | 不寫入 `TwinStrike/art/`；請主線建立正式 manifest |
| **3** | 知識庫改語意檔名、分資料夾；解雙 16；`SwarmDuel/knowledge/` 跨遊戲研究移入 `research/`；16 難度曲線的調校實例移回 `TwinStrike/docs/`；`09` 拆成 `backlog/`；建舊新路徑對照表與斷鏈檢查 | 斷鏈檢查 0 錯；README 閱讀路線更新 | 不保留舊路徑導向頁（直接改引用） |
| **4** | 第三款遊戲開工時：`game:init`、`verify`、`art:pack` 共用化（含與主線協調後移出的 `pack_atlas.py` 等） | 第三款走完 §6 全流程 | 不在沒有實際使用者前預先建空殼工具 |

### 第 0 階段步驟（三方共識，2026-10-21）

1. 寫 `.gitignore`：`**/node_modules/`、`**/dist/`、`.env*`（保留 `.env.example`）、`*.log`、`Thumbs.db`、`.DS_Store`、`.vscode/`、`.idea/`、`.claude/settings.local.json`。
2. 兩款遊戲各跑一次 `npm ci && npm test && npm run build && npm run size`，把結果記下來（壞的只記不修）。
3. `git init`，用 `git add -A --dry-run` 檢查：沒有 node_modules、dist、機密；兩款的 `package-lock.json`、`art/`、`knowledge-base/` 都在。
4. 提交基準 commit，並打 tag `baseline-0`。

盤點（2026-10-21）：`art/` 合計約 80 MB（SwarmDuel 45、TwinStrike 35）；沒有超過 20 MB 的單檔；沒有 `.env` 或金鑰檔；兩款都有 `test`、`build`、`size` 指令與 lock 檔。

### 第 3 階段的舊新路徑對照（預定）

| 現在 | 目標 |
|---|---|
| `01_skill-integrity.md` | `foundation/skill-integrity.md` |
| `02_market-and-legal.md` | `foundation/market-and-legal.md` |
| `03_design-patterns.md` | `design/design-patterns.md` |
| `04_tech-stack.md` | `foundation/tech-stack.md`（硬規則改為引用 rules.json） |
| `05_juice-and-feel.md` | `design/juice-and-feel.md` |
| `06_art-pipeline.md` | `production/art-pipeline.md` |
| `07_themes-and-liveops.md` | `research/themes-and-liveops.md` |
| `08_production-workflow.md` | `production/workflow.md` |
| `09_knowledge-gaps.md` | `backlog/`（一題一檔） |
| `10_asset-library.md` | 改寫為 `production/asset-library.md`（說明怎麼查 `index/assets.json`）；資料本體由索引產生 |
| `11_terrain-style-kit.md` | `production/terrain-style-kit.md` |
| `12_genre-recipes.md` | `design/genre-recipes.md`（範例改為固定版本連結） |
| `13_input-fairness.md` | `design/input-fairness.md` |
| `14_audio.md` | `production/audio.md` |
| `15_reference-games.md` | `research/reference-games.md` |
| `16_ad-funnel-games.md`、`ad-funnel/` | `research/ad-funnel-games.md`、`research/ad-funnel/` |
| `16_difficulty-curve.md` | `design/difficulty-curve.md`（只留方法與 D1–D8 對應的規則 ID；調校實例移到 `TwinStrike/docs/`） |
| `assets/asset-index.json` | 轉成 `SwarmDuel/art/manifest.json`；中央改由 `index/assets.json` 產生 |
| `assets/ref-games/` | `research/reference-games/` |

---

## 8. 風險與對策

| 風險 | 對策 |
|---|---|
| 索引漂移（產生物被手改、manifest 與實檔不符） | `index:build` 重建比對納入 CI；檔頭標 `generated` |
| 過期的合規證據被當成通過 | 證據綁 `contentHash` 與 `ruleReviewedAt`，任一改變即失效 |
| 無效覆寫被靜默忽略 | resolver 對 `forbid` 門檻的覆寫直接報錯 |
| 誤判資產可重用 | `reusePolicy` 預設 `game-only`；改成 `reusable` 需在 manifest 寫理由 |
| 大圖讓 git 變肥 | 目前全部約 80 MB，**原圖（含未採用版本）直接進 git**，不用 LFS、不另存；是否採用由 manifest 的 `status` 標註。未來若單檔或總量明顯變大再重新評估 |
| 平行 session 互相覆寫 | 每個 session 用獨立分支 / worktree；一案一檔；共用索引只由腳本產生 |
| 一次改太多無法回溯 | 每階段單獨 commit；先行為、後路徑 |
| 法規摘要被當成法律保證 | 法規規則 `level` 最高只到 `should`，並標「非法律意見」；上線前另需法務 |

---

## 9. 不採用的做法

| 做法 | 不採用的理由 |
|---|---|
| 規則全放在 `.claude/skills/` | Codex / Gemini 不會自動讀；隱藏資料夾不被搜尋 |
| 規則寫在 rules.json，也寫在 gdd / 知識庫 | 正是要消除的重複（P5） |
| 從 gdd Markdown 擷取覆寫 | Markdown 格式不穩，會成為第二套設定 |
| 資產上手標它滿足的規則 | 雙向維護必然漂移（裁決 #2） |
| 抽出 `packages/sim-core` 共用依賴 | 改底層會影響已完成的遊戲；維持「從範本複製」 |
| 保留舊編號導向頁 | 規模小，導向頁反而干擾 AI 搜尋 |
| 一次重寫全部文件 | 無法回溯、行為與路徑同時變動 |

---

## 10. 待決事項（已決，2026-10-21 三方共識）

Claude（claude-opus-5-5）、Codex（gpt-6-astra）、Gemini 4 Argon（High）兩輪討論後收斂：

| 事項 | 決定 | 說明 |
|---|---|---|
| 未採用原圖怎麼保存 | **直接進 git**，不用 LFS、不另存 | 總量約 80 MB，一般 git 足以負荷。Claude 第 1 輪主張移到 git 外，第 2 輪改為同意：在基準前搬檔等於先動了檔案，違反「一次只動一個變數」 |
| `reviewedAt` 過期天數 | 法規 180 天、市場研究 90 天，其他類別不設 | 到期只提醒重看；`reviewedAt` 記實際複核日，內容沒變也更新 |
| `shared/stack/` 搬移時機 | **第 3 階段** | 先改行為、後改路徑；搬完要確認 Claude Code 仍能自動載入 skill、各 agent 入口能讀到 |
| 第 0 階段步驟 | 見 §7「第 0 階段步驟」 | 不搬檔、不改程式；既有問題只記錄 |

---

## 11. 執行紀錄

### 第 0 階段（2026-10-21）

| 項目 | 結果 |
|---|---|
| `.gitignore` | 依 §7 建立 |
| 依賴 | 兩款 `npm ls --depth=0` 與 lock 檔一致。**未跑 `npm ci`**：它會先刪除 node_modules，可能中斷其他 session 正在跑的 dev server |
| SwarmDuel | `npm test` 9/9 通過；build 成功；size 977.7 KB（目標 8 MB 內） |
| TwinStrike | `npm test` 50/50 通過；build 成功；size 1,023.9 KB（目標 8 MB 內） |
| 既有問題 | 無 |
| 基準 | git 初始化、基準 commit、tag `baseline-0` |

### 第 1 階段（2026-10-21，分支 `kb/phase-1`）

| 項目 | 結果 |
|---|---|
| `knowledge-base/index/rules.json` | 16 條規則（第一批，數值與原文件 / 程式常數相同） |
| `shared/tools/rules.mjs` | resolver：依呼叫檔案路徑判斷遊戲、套用 `<Game>/config/rules.overrides.json`；拒絕禁止覆寫、缺理由、目標超過硬上限的覆寫（三種都已實測擋下） |
| 改讀規則的把關程式 | `size-check.mjs`（範本、SwarmDuel、TwinStrike）、`lib/dominance.mjs`（範本、TwinStrike）、TwinStrike `playtest.mjs`、`difficulty-curve.mjs` |
| 覆寫 | `SwarmDuel/config/rules.overrides.json`：`RULE-FX-FILTER` = false |
| 入口 | `CLAUDE.md` 改新優先序並標規則 ID；新增 `AGENTS.md` |
| 判定一致性 | 兩款遊戲 test、size、技巧主導、playtest D1–D8 的輸出與改動前**逐行相同**（耗時欄位除外） |
| 寫死常數 | 上述程式中 grep 不到 0.7、8 MB、12 pp、0.6、0.5、90–99%、4 的倍數 |
| 未做 | SwarmDuel 的技巧主導腳本本來就只出報告、不判定，未改；KTX2、通用粒子、WebGPU 三項 SwarmDuel 覆寫尚未建規則，仍以文件為準 |

### 第 2 階段（2026-10-22，分支 `kb/asset-manifest`）

- `SwarmDuel/art/manifest.json`（63 筆）、`shared/recipes/manifest.json`（範本 5 筆）、`shared/recipes/prompt-blocks.json` 由舊 `knowledge-base/assets/asset-index.json` 機械轉出（舊 id 保留為 `legacyId`），舊檔刪除。
- TwinStrike 由主線直接建立正式 `TwinStrike/art/manifest.json`（17 筆：身分圖、9 格姿勢、三種敵人、背景、特效、主視覺、未採用版本、佔位美術、3 份音效配方），**不需要唯讀轉接器**；`art/raw/LOG.md` 保留為敘述版生成紀錄。
- `shared/tools/index-build.mjs` 產生 `knowledge-base/index/assets.json`（85 筆）與 `INDEX.md`（規則 ↔ 知識庫頁 ↔ 資產）。驗證：id 唯一且以遊戲名開頭、kind / status / reusePolicy 合法、檔案存在、`derivedFrom` / `provenance.reference` 可解析、`contentHash` 與主檔一致（文字檔以 LF 計算）。
- 與 §5.4 的差異：不寫 `builtAt` 時間戳，改記各來源 manifest 的 sha256，重建結果逐位元組相同，`--check` 才能當 commit 關卡；pre-commit 在 `art/`、`game/src/assets/`、`shared/recipes/`、`knowledge-base/index/` 有變動時執行。
- `game-audit` 的 `RULE-ASSET-REGISTER` 改讀 manifest（範本複本以內容雜湊比對），移除 LOG.md / atlas.json 的過渡判斷。測試：`shared/tools/index-build.test.mjs`（4 項）。
- GateLane 尚無 manifest（目前只有範本複本 `dust.png`，以雜湊視為已登錄）；正式美術進來時由 GateLane 主線建立。
