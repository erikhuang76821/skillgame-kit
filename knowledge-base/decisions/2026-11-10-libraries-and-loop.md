# 架構提案：三庫分離（知識 / 資產 / 測試）＋ 迴圈工程與動態索引

| 欄位 | 內容 |
|---|---|
| 狀態 | **已定案，A–D 已實作**（2026-11-10 企劃接受 §8 裁決；執行紀錄見 §10，E 未做）；§2–§6 中被裁決修改的地方以 §8 為準；延續 [2026-10-21 規則與資產索引決策](2026-10-21-kb-asset-architecture.md)（其 §2 原則全部保留） |
| 日期 | 2026-11-10 |
| 範圍 | 知識庫、資產庫、**新增測試庫**、**新增迴圈定義與取用器**、各遊戲的 profile / 迴圈狀態 |
| 不在範圍 | 遊戲程式本身；已定案的 rules.json / manifest schema（只加欄位，不改語意） |

---

## 1. 核心主張

1. **三庫不知道迴圈**：知識、資產、測試只描述「自己是什麼、適用於什麼」（facet），不寫「第幾步用我」。
2. **迴圈不擁有內容**：每個節點只宣告「我需要哪些 facet 的東西、產出什麼、用哪些規則把關、失敗退回哪裡」。
3. **兩者之間只有一個接點：動態索引**。節點執行時，取用器（`context.mjs`）以「節點宣告 × 遊戲 profile」對三庫的索引做 selector 比對，產出這次需要的**脈絡包**（context pack），有 token 預算、按需取段落，不整頁塞。
4. **規則是契約層**：規則（`rules.json`）連接三庫——知識解釋為什麼、測試量測是否達成、資產被規則 selector 選中。迴圈的關卡只引用規則 ID。

```
                ┌──────────── 契約層 ────────────┐
                │  knowledge-base/index/rules.json │  (唯一來源，已存在)
                └───▲────────────▲────────────▲────┘
           whyRef   │   selector │  implements │
┌───────────────┐ ┌─┴───────────┐ ┌───────────┴───┐
│ 知識庫 KB      │ │ 資產庫 AL    │ │ 測試庫 TL      │   ← 內容平面：不知道迴圈
│ 頁面＋卡片     │ │ manifest     │ │ registry       │
└──────┬────────┘ └──────┬──────┘ └──────┬────────┘
       │ 產生             │ 產生           │ 產生
┌──────▼──────────────────▼───────────────▼────────┐
│ knowledge-base/index/  kb.json · assets.json ·    │   ← 索引平面（全部由腳本產生）
│                        tests.json · INDEX.md      │
└──────────────────────────▲───────────────────────┘
                           │ selector 查詢
                ┌──────────┴──────────┐
                │ context.mjs 取用器   │  ← 節點宣告 × <Game>/game.profile.json
                └──────────▲──────────┘
                           │ pull / gate / writeback
┌──────────────────────────┴───────────────────────┐
│ 迴圈平面 shared/loop/nodes.json（節點圖）          │
│ 每款遊戲 <Game>/loop/state.json + docs/loop/ 紀錄 │
└───────────────────────────────────────────────────┘
```

---

## 2. 共用語彙：facet

三庫的每張卡片、遊戲 profile、節點宣告都用同一套 facet。詞彙表 `shared/index/facets.json`（新增，唯一來源；index-build 擋未登錄的值）。

| facet | 例值 | 誰會標 |
|---|---|---|
| `topic` | `fairness` `difficulty` `juice` `audio` `art` `tech` `legal` `market` `input` `liveops` `budget` `process` | KB、測試 |
| `genre` | `rhythm` `physics` `sort-puzzle` `lane-shooter` `survivor` `merge` `runner` … | KB、資產、測試、profile |
| `skillAxis` | `timing` `aim` `planning` `reaction` `routing` | KB、profile |
| `renderer` | `2d` `3d` | KB、資產、規則 selector、profile |
| `source` | `original`、`af-gate-lane-shooter` … | KB（af 規格書）、profile |
| `jurisdiction` | `TW` `US-*` | KB、規則、profile |
| `artStyle` | `chibi` `pixel` `sticker` `2.5d` | 資產、profile |
| `kind` | 各庫自己的種類（見 §3） | 各庫 |

**比對語意**（沿用 rules.json `scope.selector`）：每個 key 都要符合；陣列 = 任一符合；卡片沒標該 key = 萬用。值以 `$profile.<key>` 引用遊戲 profile。

### 遊戲 profile：`<Game>/game.profile.json`（新增）

```json
{
  "schemaVersion": 1,
  "game": "GateLane",
  "genre": ["lane-shooter"],
  "skillAxis": ["aim", "planning"],
  "renderer": "2d",
  "source": "af-gate-lane-shooter",
  "jurisdiction": ["TW", "US-*"],
  "artStyle": ["chibi"],
  "loop": { "entry": "N0-brief" }
}
```

profile 由 N0 產生、N2 定稿；之後所有節點的取用都以它為準，改 profile 等於改題目，要回 N0。

> 2026-11-11 補充：profile 另有結構欄位 `scriptedProgression`（布林，同一局內是否有可量測的預設段落）。它決定難度曲線規則是否適用，不是檢索用的 facet；沒填時相關的必過規則是「資料待補」，關卡無法驗證。見 [通用化待辦 §10](2026-11-11-generality-backlog.md)。

---

## 3. 三庫

### 3.1 知識庫（KB）— 回答「為什麼、怎麼想」

| 項目 | 設計 |
|---|---|
| 本體 | `knowledge-base/**/*.md`（第 3 階段語意檔名照舊決策進行，本提案不依賴它） |
| 卡片 | 每頁開頭加 YAML front-matter；**以 H2 為取用單位**（段落卡），頁面層 facet 往下繼承、H2 可用 `<!-- facets: … -->` 補充 |
| 索引 | `index/kb.json`（產生物）：`{ id, path, anchor, title, facets, answers[], ruleRefs[], tokens, reviewedAt }` |
| kind | `principle`（原則）/ `method`（方法論）/ `recipe`（品類配方）/ `research`（市場、參考遊戲、af 規格書）/ `lesson`（踩坑）/ `gap`（backlog） |
| 不放 | 數字門檻（在 rules）、階段順序（在迴圈）、單一遊戲的調校紀錄（在 `<Game>/docs/`） |

front-matter 範例：

```yaml
---
id: KB-difficulty-curve
kind: method
topic: [difficulty, fairness]
answers: ["難度曲線怎麼設計", "D1–D8 怎麼驗收", "自動試玩怎麼模擬人"]
rules: [RULE-CURVE-TREND, RULE-CURVE-PEAKS, RULE-CURVE-CLIFF]
reviewedAt: 2026-10-21
---
```

`answers` 是給取用器做關鍵字比對的「這頁回答哪些問題」，也讓節點能用自然語句查詢。

### 3.2 資產庫（AL）— 回答「有什麼可以用、怎麼重生」

已定案（各款 `art/manifest.json` → `index/assets.json`），只加：

| 新增 | 用途 |
|---|---|
| `facets`（`genre`、`artStyle`、`renderer`） | 讓取用器依 profile 找可重用資產與 prompt 模板 |
| `quality`：`{ reviewed: evidenceId \| null }` | 已有證據的才會被推薦為「可直接用」，否則只推薦為「可照 prompt 重生」 |

資產庫的 kind 不變：`sprite-sheet` `background` `fx-sheet` `key-art` `ui` `reference` `procedural` `audio-recipe`，加上 `prompt-block`（目前 `shared/recipes/prompt-blocks.json` 的內容一併入索引）。

### 3.3 測試庫（TL）— 回答「怎麼證明達成」（新增）

現況：檢查散在 `templates/tools/lib/`、`templates/test/`、`shared/tools/game-audit.mjs`、各遊戲 `tools/`、TwinStrike 的 `human-report.mjs` / persona。**先登錄、不搬程式碼**。

```
shared/tests/
├─ registry.json        測試卡登錄（來源，人工維護）
├─ checkers/            （第 B 階段以後）已證實跨遊戲的檢查程式
├─ bots/                技巧分級 bot、人性化失誤模型的範本與參數表
├─ personas/            人工 / 模擬試玩的玩家側寫
├─ fixtures/            固定種子組、golden match、壞例子（給 checker 自測）
└─ protocols/           人工試玩、美術審查、法規審查的操作規程
```

測試卡（`registry.json` 一筆）：

```json
{
  "id": "TEST-SKILL-DOMINANCE",
  "kind": "script",
  "implements": ["RULE-SKILL-DOMINANCE"],
  "facets": { "topic": ["fairness"] },
  "run": "node tools/skill-dominance.mjs 30 --out ../docs/skill_dominance_report.md",
  "cwd": "<Game>/game",
  "template": ".claude/skills/lite-skillgame-stack/templates/tools/skill-dominance.mjs",
  "needs": ["tools/bots.mjs"],
  "produces": "docs/skill_dominance_report.md",
  "cost": "medium",
  "fresh": "GAME.version"
}
```

| 欄位 | 說明 |
|---|---|
| `kind` | `unit`（npm test）/ `script`（自動判定）/ `sim-playtest`（bot 試玩）/ `human-playtest` / `review`（人工，產出 evidence）/ `audit` |
| `implements` | 測試 → 規則（**取代** rules.json 的 `enforcement.ref` 作為主方向；rules 的 enforcement 改由 index-build 反向填） |
| `needs` | 跑之前必須存在的產出物；不存在時取用器回報「還不能跑」，不算失敗 |
| `cost` | `cheap`（< 5 s）/ `medium`（< 2 min）/ `heavy`（背景跑）/ `human`；關卡先跑便宜的，失敗即停 |
| `fresh` | 報告何時過期（sim 版本、內容雜湊）；對應 `RULE-REPORT-FRESH` |

索引 `index/tests.json`（產生物）合併 registry 與各遊戲實例（`<Game>/game/tools/*` 中登記 `instanceOf` 的檔案）。

第一批登錄（全部已存在，只寫卡）：`TEST-UNIT`、`TEST-SIZE`、`TEST-CDN`、`TEST-SIM-PURITY`、`TEST-SKILL-DOMINANCE`、`TEST-CURVE`（D1–D8 一張卡，`implements` 列七條 RULE-CURVE-*）、`TEST-AUDIT-DOCS` 等 audit 子項、`TEST-ASSET-INDEX`（index-build --check）、`TEST-DRAWCALL`（review）、`TEST-ART-TABOO`（review）、`TEST-HUMAN-PLAYTEST`（human，TwinStrike 的 human-report）。

---

## 4. 迴圈平面

### 4.1 四層迴圈

| 層 | 週期 | 誰驅動 | 結束條件 |
|---|---|---|---|
| **微迴圈** | 秒～分：改 → `cheap` 測試 | AI | 單元測試綠 |
| **節點迴圈** | 小時：拉脈絡 → 做 → 關卡 → 紀錄 → 路由 | AI（人在檢查點核准） | 節點關卡全過，或達 `maxIterations` 升級給人 |
| **專案迴圈** | 天～週：N0 → N11 | 企劃 + AI | N10 發布關卡過 |
| **作品集迴圈** | 跨遊戲：N11 回饋 → 三庫成長 | 企劃 | 晉升條件（§4.5） |

### 4.2 節點圖（`shared/loop/nodes.json`）

| 節點 | 做什麼 | 拉取（摘要） | 產出 | 關卡（規則） | 失敗退回 | 人工檢查點 |
|---|---|---|---|---|---|---|
| **N0 立項** | 定題、定 profile | KB `topic: market, legal`、`kind: research`；af 規格書（`source`）；資產 `reusePolicy: reusable` 概況 | `game.profile.json`、`gdd/brief.md` | `RULE-LEGAL-EXCLUDE-CHANCE` | — | ✅ 題目核准 |
| **N1 去隨機化** | 隨機來源 → 公平化 | KB `topic: fairness`、`kind: principle` | `gdd/03_skill_integrity.md` | `RULE-SPEC-FAIRNESS`（預檢） | N0 | |
| **N2 規格** | 填規格、§13 改造對照 | KB `kind: recipe` × `$profile.genre`、`topic: input`；af 規格書整份 | `gdd/05_game_spec.md`、`gdd/10`、`gdd/11` | `RULE-GAME-DOCS`、`RULE-AF-ADAPTATION` | N1 | ✅ 規格核准 |
| **N3 起手** | 複製範本 | 測試庫：範本實例清單 | `game/` | `TEST-UNIT`（範本原樣通過） | — | |
| **N4 確定性 sim** | 寫 sim、bots、golden | KB `topic: tech`（確定性段落）、`kind: recipe` | `sim/`、`test/`、`tools/bots.mjs` | `RULE-SIM-PURITY`、`RULE-SPEC-CONSTANTS`、`TEST-UNIT` | N2（規格與 sim 對不上時改規格要 `GAME.version`+1） | |
| **N5 調校** | 技巧主導＋難度曲線 | KB `topic: difficulty, fairness`；測試庫 `implements: RULE-SKILL-*, RULE-CURVE-*`；bots / personas | `docs/*_report.md`、`gdd/07` | `RULE-SKILL-DOMINANCE`、`RULE-CURVE-*` | 參數 → N4；結構 → N2 | |
| **N6 美術** | 生成 → 審 → 登錄 | 資產 `$profile.artStyle`、`kind: prompt-block`、`reference`；KB `topic: art` | `art/`、`art/manifest.json`、evidence | `RULE-ASSET-REGISTER`、`RULE-ART-TW-TABOO`（review） | N6 自身（重生） | ✅ 美術審查 |
| **N7 手感 / 音效 / UI** | FEEL、sfx、HUD | KB `topic: juice, audio`；資產 `kind: procedural, audio-recipe` | `fx/feel.js`、`audio/sfx.js`、`ui/` | `RULE-FX-FILTER`、`RULE-TEMPLATE-LEFTOVER` | — | |
| **N8 預算** | 包體、DC | KB `topic: budget, tech` | size / DC 紀錄 | `RULE-BUNDLE-SIZE`、`RULE-NO-RUNTIME-CDN`、`RULE-DRAWCALL-*` | 圖太大 → N6；DC → N7 | |
| **N9 人工試玩** | 真人對照 bot | 測試庫 `kind: human-playtest`、`protocols/` | `playtest-data/`、人工報告 | （提案）`RULE-HUMAN-BOT-AGREEMENT`，`level: hypothesis` | 與 bot 不一致 → 校正 humanBots（測試庫）→ N5 | ✅ 試玩結論 |
| **N10 發布關卡** | 全量把關 | 有效規則全集 | 審核報告 | `npm run audit` 全部 must | 依失敗規則對應的節點 | ✅ 上線核准 |
| **N11 回饋** | 把這款學到的東西送回三庫 | 本款 `docs/loop/` 全部紀錄 | 晉升提案（§4.5） | — | — | ✅ 晉升核准 |

N6 / N7 可在 N4 之後與 N5 並行（不同檔案）；N8 在 N6、N7 每輪結束都跑一次 `cheap` 部分。

節點宣告範例（N5）：

```json
{
  "id": "N5-tune",
  "name": "技巧主導與難度曲線",
  "after": ["N4-sim"],
  "requires": ["game/src/sim/sim.js", "game/tools/bots.mjs"],
  "pull": {
    "kb":     { "topic": ["difficulty", "fairness"], "genre": "$profile.genre", "kind": ["method", "recipe", "lesson"] },
    "rules":  { "category": ["balance"] },
    "tests":  { "implements": "$pulled.rules" },
    "assets": null
  },
  "budget": { "kbTokens": 6000 },
  "produces": ["docs/skill_dominance_report.md", "docs/playtest_report.md", "gdd/07_difficulty_curve.md"],
  "gate": { "must": ["RULE-SKILL-DOMINANCE", "RULE-CURVE-*"] },
  "onFail": [
    { "rule": "RULE-SKILL-DOMINANCE", "goto": "N4-sim", "hint": "先調 sim 參數，不動門檻" },
    { "when": "spec-change", "goto": "N2-spec", "hint": "改規格要 GAME.version+1" }
  ],
  "maxIterations": 5,
  "checkpoint": null
}
```

**節點只寫 facet 查詢，不寫檔名**。現行 bootstrap.md §0 的「階段 → 必讀頁」表改由 nodes.json × kb.json 產生，不再手寫（解除迴圈與知識庫的耦合）。

### 4.3 節點迴圈協定（每一輪都一樣）

```
1 讀狀態   <Game>/loop/state.json：目前節點、第幾輪、上一輪關卡結果
2 拉脈絡   node shared/tools/context.mjs <Game> [--node N5-tune]
           → 規則（合併覆寫後的有效值）＋ KB 段落（依預算排序）＋ 資產 ＋ 可跑 / 不能跑的測試
3 做事     只改本節點 produces 的範圍
4 關卡     依 cost 由便宜到貴跑 gate 的測試；第一個 must 失敗就停
5 記錄     <Game>/docs/loop/<YYYY-MM-DD>-<node>-<n>.md：假設、改了什麼、關卡差異、下一步
6 路由     全過 → 下一節點；失敗 → onFail 對應節點或本節點下一輪；
           達 maxIterations → 停下來交給人（附最後三輪紀錄），不得自行改門檻
```

硬規則：

- **迴圈不能改門檻**。要例外只能走 `rules.overrides.json`（附理由、resolver 擋 `forbid`），且屬人工檢查點。
- **報告過期就等於沒過**（`fresh` 欄位）；回退到早期節點後，後面節點的狀態自動標成「需重驗」。
- 每輪紀錄一案一檔，平行 session 不寫同一個檔。

### 4.4 取用器：`shared/tools/context.mjs`

| 功能 | 說明 |
|---|---|
| 輸入 | 遊戲、節點（預設讀 state.json）、選用的自由文字問題 |
| 解析 | `$profile.*` 代入；`$pulled.rules` 先解析規則再查測試 |
| 規則 | 經 `rules.mjs` 取**有效值**（已套覆寫），附 whyRef |
| KB | selector 過濾 → 依（facet 命中數、`answers` 關鍵字、`reviewedAt` 新舊、`kind` 權重）排序 → 依 token 預算截斷，**輸出段落內容而非整頁** |
| 資產 | selector 過濾；分「可直接用（有證據）」/「可照 prompt 重生」/「僅參考」 |
| 測試 | 依 `needs` 判斷能不能跑；列出 run 指令與 cost |
| 輸出 | Markdown（給 AI 讀）＋ `--json`（給工具）；檔頭列出查詢條件與命中數，查不到的 facet 明白寫「無」 |
| 缺口 | 某 facet 在 KB 命中 0 段 → 輸出「知識缺口」並建議在 `backlog/` 開一題（不自動寫） |

脈絡包範例（節錄）：

```
# Context pack — GateLane @ N5-tune (iteration 2/5)
profile: genre=lane-shooter, skillAxis=aim,planning, renderer=2d
## 有效規則（5）
- RULE-SKILL-DOMINANCE  skillShare ≥ 0.7 …   why: KB-skill-integrity#技巧主導驗證
## 知識（4 段，5,820 / 6,000 tokens）
- KB-difficulty-curve#驗收門檻-d1-d8  (method, topic×2)
- KB-genre-recipes#其他品類對應      (recipe, genre 無精確命中 → 萬用段落)
## 測試（3 可跑，1 不能跑）
- TEST-CURVE  medium  npm run playtest      needs ✓
- TEST-HUMAN-PLAYTEST  human               needs ✗ playtest-data/
## 知識缺口
- genre=lane-shooter 在 topic=difficulty 下 0 段 → 建議 backlog/p1-lane-shooter-difficulty.md
```

### 4.5 回饋與晉升（N11 → 三庫）

| 從遊戲 | 晉升到 | 條件 |
|---|---|---|
| 調校教訓（`docs/loop/` 中重複出現的失敗原因） | KB `kind: lesson` | 企劃核准；附來源紀錄連結 |
| 本作 checker（`<Game>/game/tools/*`） | `shared/tests/checkers/` + registry | **第二款遊戲也需要**時才搬（沿用「不預建空殼」原則） |
| 新門檻（觀察到的經驗值） | rules.json `level: hypothesis` | 寫明量測；兩款遊戲都成立才升 `should` / `must` |
| 資產 | `reusePolicy: reusable` | 有審查證據＋manifest 寫理由 |
| 取用器回報的知識缺口 | `backlog/` 一題一檔 | — |

---

## 5. 目錄增量（只列新增）

```
SKILLGAME/
├─ shared/
│  ├─ index/facets.json          facet 詞彙（唯一來源）
│  ├─ tests/                     測試庫（§3.3）
│  ├─ loop/nodes.json            節點圖（§4.2）
│  └─ tools/
│     ├─ index-build.mjs         擴充：+ kb.json、tests.json、bootstrap 必讀表
│     ├─ context.mjs             取用器（§4.4）
│     └─ loop.mjs                status / next / gate / log 四個子指令
├─ knowledge-base/index/
│  ├─ kb.json                    產生物
│  └─ tests.json                 產生物
└─ <Game>/
   ├─ game.profile.json
   ├─ loop/state.json            快取，不進 git（§8 第 3 項；.gitignore）
   └─ docs/loop/                 每輪紀錄
```

---

## 6. 分階段落地（一次只動一個變數）

| 階段 | 內容 | 完成條件 | 試點 |
|---|---|---|---|
| **A 語彙＋KB 卡片** | `facets.json`；現有 17 頁加 front-matter（不改檔名）；index-build 產生 `kb.json` | 每頁都有 `kind`、`topic`；未登錄 facet 值會被擋；`--check` 穩定 | — |
| **B 測試登錄** | `shared/tests/registry.json` 登錄現有檢查（不搬程式）；`tests.json`；rules 的 enforcement 由反向產生並與現值比對 | 25 條規則中 `type: script` 的每條至少一張測試卡；`implements` 與現行 enforcement 一致 | — |
| **C 取用器** | `context.mjs`；`game.profile.json` 補給三款遊戲 | 對 GateLane 依現行 bootstrap §0 各階段跑一次，命中頁面 ⊇ 手寫表 | GateLane |
| **D 節點圖＋狀態** | `nodes.json`（從 08 §1 與 bootstrap §0 轉出）；`loop.mjs status/next/gate/log`；bootstrap 必讀表改為產生物 | GateLane 從目前位置走完一個節點迴圈，紀錄檔自動產生 | GateLane |
| **E 回饋** | N11 晉升提案指令；pre-commit 依「本次動到的節點」只跑該節點關卡 | 第一筆晉升（lesson 或 checker）走完核准 | 第四款遊戲 |

C 以前不改任何現有流程；D 才讓 bootstrap §0 從手寫變產生物。

---

## 7. 不採用

| 做法 | 理由 |
|---|---|
| KB 頁面標「第幾階段讀」 | 正是要解除的耦合；同一段落可能被多個節點取用 |
| 每個節點寫死要讀的檔名 | 新增知識不會自動被取用；檔名一改就斷 |
| 向量資料庫 / 嵌入檢索 | 規模約數百段，facet + `answers` 關鍵字已足夠、可解釋、可在 CI 驗證；超過約 2,000 段再評估 |
| 測試程式先全部搬到 `shared/tests/` | 同時改行為與路徑（違反 2026-10-21 裁決 #4）；先登錄、第二款需要才搬 |
| 迴圈自動放寬門檻以求收斂 | 讓「通過」失去意義；只能升級給人 |

## 8. 待決事項（已收斂，2026-11-10）

企劃先選定初步方案，再由 Claude（主持）、Codex gpt-6-astra、Gemini 4 Argon（High）兩輪圓桌討論。下表「裁決」欄覆蓋 §2–§6 的對應內容。

| 事項 | 企劃初選 | Codex | Gemini | **裁決** |
|---|---|---|---|---|
| 1 段落卡粒度 | H2，超長自動切 H3 | 修改：自動切會切掉前提；H3 顯式啟用；ID 要獨立，不能用標題 slug | 修改：自動切讓 ID 漂移；超標 lint 由作者拆 | **固定 H2，卡片 ID 顯式寫在標題下（`<!-- card: KB-… -->`），不從標題產生；卡內不截斷**。超過門檻只出 lint 警告，由作者拆段；需要 H3 時顯式標記，取用時自動帶母 H2 標題與導言。**前置條件**：資產頁的 Prompt 庫、資產總表先移到資產索引 |
| 2 `answers` | AI 初稿＋人工抽審 | 第 2 輪修改：A 不全面填，C 試點比較有無的效果再決定 | 反對：節點 pull 是 facet 查詢，沒有自然語言查詢端；鋪初稿是預建空殼 | **A 階段不定義、不填 `answers`**，排序只用 facet＋標題路徑＋`rules[]`。C 試點記錄漏抓個案，必要時再加顯式別名欄位。取「不預建空殼」原則 |
| 3 迴圈狀態 | `state.json` 不進 git | 兩者相容：state 只能當快取；換 runId 不能讓重試歸零 | 兩者相容：重試次數、人工核准、回退事件非存不可；平行節點產出不重疊可自動合流 | **維持 `state.json` 不進 git（列 `.gitignore`），只當可隨時重建的快取**。事實來源是 `docs/loop/*.md`（進 git、只新增）的 YAML 事件欄位：`eventId`、`parent`、`node`、`inputHash`（上游產出雜湊）、`gate` 結果、`approval`（綁內容雜湊）、`rollback`。重試次數依 `(node, inputHash)` 累計，不依 session / runId；換機或遺失時 `loop.mjs status --rebuild` 重建。合併時：產出不重疊的節點（N5∥N6∥N7）自動合流；同一節點的競爭結果由人選定；合併後核准逐筆重核雜湊 |
| 4 N9 人機一致性 | 先 `hypothesis` | 同意；兩款有資料只觸發升級審查；反對新增 log 的 must（無資料會變隱性擋發布） | 同意門檻留 hypothesis；另設 must 強制結構化 log | **差距門檻 `hypothesis`，不擋上線；升級需人工審查預測力，不依遊戲數自動升級**。試玩 log schema 放測試庫 `protocols/`，**只在 `playtest-data/` 有真人資料時才驗格式**（有條件的 must），兼顧兩方 |

圓桌額外提出、一併裁決的問題：

| 問題 | 提出者 | **裁決** |
|---|---|---|
| implements 反向產生 enforcement 會反寫唯一來源、漏標即靜默失去把關 | 兩方 | **撤回 §3.3 的「反向產生 enforcement」**。`rules.json` 保留 enforcement，index-build 不回寫；另產覆蓋索引（`tests.json`），`--check` 擋：must 規則既無 script 測試卡也無 review 規程、測試卡引用不存在的規則 |
| 「未標＝萬用」會誤取（尤其 jurisdiction） | 兩方 | **改為顯式 `"*"` 才是萬用**；未標＝未知，排在後段並在脈絡包標「未分類」；jurisdiction 未標永不命中 |
| token 預算會擠掉關鍵內容 | 兩方 | **保底區**：節點 gate 引用的規則及其 whyRef / howRef 段落不受排序與截斷，保底超預算直接報錯；其餘依序截斷並列出被排除清單。C 的驗收改為「最終脈絡包涵蓋手寫必讀表且列出誤取」，不只比候選集合 |
| 首敗即停會掩蓋上游結構錯誤 | Gemini（Codex 修正：昂貴度不等於診斷價值） | **cheap 測試全跑，medium / heavy 首敗即停；多個失敗時退到它們 onFail 目標中最上游的節點**；沒跑的測試標「未跑」，不得視為通過。回退依產出依賴（雜湊）判定哪些下游需重驗，含並行的 N6 / N7 |
| pre-commit 跑太重 | Gemini | **pre-commit 只跑 cheap**；發布關卡 N10 一律全量，不看本機狀態 |
| 先改整個 36 萬字 KB 風險大 | 兩方 | **落地改為 GateLane 垂直切片**：A 只為 GateLane 會用到的頁加卡片 → B → C 驗證後才擴到全庫，D 前先定事件與失效模型 |

## 9. 討論紀錄

- 2026-11-10 第 1 次執行：Gemini 嘗試在無頭模式執行指令被拒、無輸出；Codex 第 1 輪結論與重跑一致。
- 重跑兩輪（題目註明不使用工具）完成。最終立場：
  - Codex：有條件採納三庫與迴圈，以 GateLane 小型試點驗證取用、事件重建與依賴路由，保留規則來源權威後再擴展。
  - Gemini：先以 GateLane 跑 A→C 切片，廢隱式萬用與 answers 空殼、禁回寫 rules.json、由 git 紀錄推算平行狀態，並強制 N9 schema 與最上游回退。
- 企劃初選被修改的兩項：段落粒度（自動切 H3 → 固定 H2＋顯式 H3）、answers（AI 初稿 → A 階段不做）。2026-11-10 企劃接受全部裁決。

## 10. 執行紀錄

### A 階段（2026-11-10，分支 `kb/libraries-and-loop`）

| 項目 | 結果 |
|---|---|
| 詞彙 | `shared/index/facets.json`：topic 17、genre 11、skillAxis 5、renderer 2、jurisdiction 4、artStyle 6、source（original＋af-*.md 檔名自動加入）、kbKinds 6 |
| 規則 | 新增 `RULE-KB-CARDS`（must：front-matter 必填欄位、頁 id 格式、每個 H2 都有卡片或 skip、facet / kind / rules 合法、id 唯一）、`RULE-KB-CARD-SIZE`（should：每卡估計 ≤ 2,000 tokens，超過只警告） |
| 程式 | `shared/tools/kb-index.mjs`（解析與驗證）；`index-build.mjs` 產生 `knowledge-base/index/kb.json`，`--check` 一併比對，INDEX.md 加「知識卡」表；pre-commit 在 `knowledge-base/`、`shared/index/` 有變動時跑 `--check` |
| 卡片 | GateLane 會用到的 17 頁（bootstrap §0 必讀頁＋`af-gate-lane-shooter`）：103 張卡、4 段略過；最大卡約 1,786 tokens，無警告。其餘 23 頁未分卡（列在 kb.json 的 `unindexed`） |
| 與裁決的差異 | `10_asset-library` 的 §2–§5（資產總表、程式繪製資產、Prompt 庫、關鍵字索引）**沒有搬檔**，而是標 `card: skip` 並註明改查 `index/assets.json`：這些資料已在各款 manifest（keywords、procedural）與 `promptBlocks` 中；頁面改寫留到舊決策的第 3 階段，避免同時改路徑與內容 |
| reviewedAt | 取各頁 git 最後改動日（2026-10-21 / 22），不是逐頁重新複核的日期 |
| 測試 | `shared/tools/kb-index.test.mjs` 9 項；shared/tools 全部 22 項通過；三款遊戲 audit 結果與改動前相同（SwarmDuel 的 4 項 must 失敗是既有的舊結構問題） |

### B 階段（2026-11-10，同分支）

| 項目 | 結果 |
|---|---|
| 登錄 | `shared/tests/registry.json` 12 張測試卡，只登錄、沒搬程式：`TEST-UNIT`、`TEST-SIZE`、`TEST-SKILL-DOMINANCE`、`TEST-CURVE`（D1–D8 七條）、`TEST-PERSONA-PLAYTEST`、`TEST-HUMAN-PLAYTEST`、`TEST-AUDIT`（十條 audit 規則）、`TEST-INDEX`（repo 層級索引檢查），以及 4 張 review 卡（DC、filter、法規排除、台灣美術禁忌） |
| 覆蓋 | 依 §8 裁決**不回寫 rules.json**：`shared/tools/tests-index.mjs` 只核對兩邊。script 規則要有非 review 卡、review 規則要有 review 卡；must 缺卡是錯誤、should 缺卡是警告。現況 27/27 條規則都有對應卡 |
| review 卡 | 不寫 run，也不另寫檢核內容；tests.json 從規則的 `enforcement.checklist` 帶入，避免第二份文字 |
| 產生物 | `knowledge-base/index/tests.json`（測試卡＋逐條覆蓋）；INDEX.md 規則表加「測試卡」欄；`--check` 與 pre-commit 一併涵蓋 `shared/tests/` |
| 未做 | 各遊戲實例（哪款能跑哪張卡）留給 C 階段的 `context.mjs` 依 `needs` 判斷；`TEST-PERSONA-PLAYTEST`、`TEST-HUMAN-PLAYTEST` 的程式只在 TwinStrike，第二款需要時再共用化；N9 人機一致性規則尚未建立，`TEST-HUMAN-PLAYTEST` 暫不 implements 任何規則 |
| 測試 | `shared/tools/tests-index.test.mjs` 6 項；shared/tools 全部 28 項通過 |

### C 階段（2026-11-10，同分支）

| 項目 | 結果 |
|---|---|
| profile | `GateLane`、`TwinStrike`、`SwarmDuel` 各一份 `game.profile.json`（genre / skillAxis / renderer / source / jurisdiction / artStyle），由 facets.json 驗證 |
| 取用器 | `shared/tools/context.mjs <Game> --pull <steps.json> --step <id> [--json]`：有效規則（套用覆寫、依 profile 排除不適用者）、保底卡片＋排序截斷、卡片原文（與 kb-index 同一解析器，雜湊不符即警告 kb.json 過期）、測試卡（依 `needs` 判斷能不能跑、由便宜到貴）、資產分類、知識缺口 |
| 語意補充 | ① `pull.kb` 可以是選擇器陣列（聯集）：法規要用 jurisdiction 篩、其他內容不能被它擋掉，只能分開寫。② **所有 key 都未知的卡片不算命中**：否則 `{ source }` 這種單一 key 選擇器會把全部沒標 source 的卡拉進來（試點第一版改編階段因此有 77 段落在預算外）。③ 缺口分兩級：`none`（完全沒有卡片涵蓋，建議開 backlog）與 `generic-only`（只有 `"*"` 通用卡，只提示） |
| kb.json | 卡片加 `end`（最後一個非空行），供取用器定位 |
| 試點 | `shared/tools/fixtures/context-pilot.json` 把 bootstrap §0 七個階段寫成取用宣告。GateLane 七個階段的最終脈絡包**全部涵蓋手寫必讀頁**，預算內、無截斷；不適用規則正確排除（`RULE-CURVE-BEATGRID` / `-PHRASE`、`RULE-DRAWCALL-3D`），TwinStrike 則納入節奏規則 |
| 手寫表以外的卡片（供人工判斷是否誤取） | 立項：廣告玩法頁 9 段（本作是改編題，合理）＋參考遊戲摘要；改編：設計模式 2、市場法規 3、參考遊戲摘要；規格：skill-integrity 6、`tech-stack.determinism`、`difficulty-curve.humanized-playtest`、af 改造、廣告共通規則；難度：`skill-integrity.dominance-test`（保底）；手感：`tech-stack.portrait-rwd`；美術：`juice-feel.spine`、`reference-games.borrow-avoid`；技術：af `html5-spec`、`input-fairness.usage`、`skill-integrity.match-verify`。目前看來都與該階段相關，未見明顯誤取 |
| 發現的知識缺口 | `artStyle=procedural`（none）：GateLane 美術全程式繪製，但沒有卡片標這個風格；相關內容在 `10_asset-library` §3（已標 skip，屬資產資料）與範本特效。`genre=lane-shooter` 在難度、手感只有通用卡（generic-only） |
| pre-commit | 只改 `<Game>/game.profile.json` 時，比照只改 `art/`：不跑該遊戲的 test + audit（profile 不影響 gdd / sim），改跑 shared/tools 測試（其中驗證所有 profile）。起因：提交 SwarmDuel 的 profile 會觸發 SwarmDuel audit，而它有 4 項既有的 must 失敗（範本前的舊結構） |
| 未做 | 資產還沒有 facet（只能依 game / kind / status / reusePolicy 篩）；evidence 目錄尚不存在，所以沒有資產會被列為「可直接用」；節點圖與 `loop.mjs` 屬 D 階段 |
| 測試 | `shared/tools/context.test.mjs` 13 項（含七個試點階段各一項）；shared/tools 全部 41 項通過 |

### D 階段（2026-11-10，同分支）

| 項目 | 結果 |
|---|---|
| 節點圖 | `shared/loop/nodes.json`：N0–N11 十二個節點，取用宣告由 C 試點的七個 step 轉入（立項 → N0＋N1、改編＋規格 → N2、難度 → N5、手感 → N7、美術 → N6、技術 → N4＋N8）。欄位：after、produces、requires、pull、budget、gate（must 規則＋tests 測試卡）、onFail（rule 自動路由；when 只是提示）、maxIterations、checkpoint。index-build 驗證（規則、測試卡、facet、路由目標、循環），錯誤擋 `--check` |
| `loop.mjs` | `status` / `next` / `gate` / `log`。狀態每次由 `<Game>/docs/loop/*.md` 重建（`key: <JSON>` 一行一欄，合法 YAML），`<Game>/loop/state.json` 只是快取並列入 `.gitignore`。inputHash ＝ 上游（遞移）produces ＋ requires 的內容雜湊，outputHash ＝ 本節點 produces；雜湊不符即「需重驗」。重試依 (node, inputHash) 計；核准綁 inputHash＋outputHash |
| 關卡 | cheap 全跑；medium / heavy / human 首敗即停，其餘標「未跑」（不算通過）。`TEST-AUDIT` 在程序內呼叫 `auditGame`，**只取本節點 gate 規則的結果**（其他規則的失敗不會擋這個節點）。review 規則與 checkpoint → 關卡 pass 但「等核准」，由人跑 `log --approve <名字>`；沒有真人資料的 N9 可 `--approve … --waive --note 理由` |
| 路由 | 失敗規則對到 onFail.rule → goto；對不到 → 最上游把該規則列在 gate 的節點（排除 N10 的 `"*"`），都沒有就本節點；多個失敗取最上游。失敗回退寫 `rollback`，被退回的節點標「被退回」直到重跑關卡。同一輸入失敗達 maxIterations → 交給人並附最後三輪 |
| 取用語意補充 | **source / genre / renderer 是「本作是什麼」的 facet**：卡片標了具體值、而本作 profile 沒有這個值時，即使選擇器沒問這個 key 也排除。起因：TwinStrike 的 N1（只篩 topic=fairness）會拿到 af-gate-lane-shooter 的段落。GateLane 試點七個階段仍全部涵蓋 |
| bootstrap §0 | 手寫「階段 → 必讀頁」表改為產生物：index-build 依 nodes.json × kb.json 寫進 `bootstrap.md` 的 `generated:loop-mustread` 標記之間，`--check` 比對；通用 profile 為每個 facet `"*"`、source = original（改編題的 af 段落由 N2 依本作 profile 取得，表下註明）。pre-commit 在 `shared/loop/` 或 bootstrap.md 有變動時也跑 `--check` 與 shared/tools 測試 |
| 試點 | GateLane 沒有任何紀錄，所以目前位置是 N0。`loop.mjs gate GateLane` 跑完 N0：`RULE-LEGAL-EXCLUDE-CHANCE` 屬 review → 關卡 pass、等企劃核准，自動寫出 `GateLane/docs/loop/2026-11-10-N0-kickoff-1.md`，路由 → N1。另以 `--dry` 試跑 N4：`RULE-SIM-PURITY`、`RULE-SPEC-CONSTANTS`、`TEST-UNIT` 全過（上游未核准，只供參考）。GateLane 資料夾本身尚未進 git，紀錄檔也一樣留在工作區 |
| 未做 | `RULE-KB-CITED` 的 stages 仍是 rules.json 裡手寫的階段 → 頁對照，尚未改成從節點圖推得；N9 人機一致性規則與試玩 log schema 尚未建立；E 階段（N11 晉升指令、pre-commit 依節點跑關卡） |
| 測試 | `shared/tools/loop.test.mjs` 9 項（節點圖驗證、試點對照、profile 篩選、事件格式、狀態推導、關卡順序、路由、bootstrap 表）；shared/tools 全部 50 項通過 |
