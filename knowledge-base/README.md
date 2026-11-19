# SKILLGAME 知識庫

把 repo 內**遊戲以外**的調查與技術框架整理成一處，給「快速生成下一款 HTML5 Skill Game」用。各頁是摘要與索引，細節連回原始檔；原始檔仍是權威來源，本庫不取代它們。

盤點日期：2026-10-19。外部參考：兩款公開 HTML5 網頁遊戲的拆解（第 15 頁）。來源範圍：`.claude/skills/lite-skillgame-stack/`、`SwarmDuel/knowledge/`（38 張規則卡、6 份研究筆記、4 份題材、14 張排除卡）、`SwarmDuel/docs/`、`SwarmDuel/gdd/03 · 07 · 10 · 11`、`SwarmDuel/tools/`、`SwarmDuel/game/src/sim/` 的通用模組。

## 架構決策

| 日期 | 決策 | 狀態 |
|---|---|---|
| 2026-10-21 | [知識庫＋資產的規則索引、資產索引與遷移](decisions/2026-10-21-kb-asset-architecture.md)：規則集中於 `index/rules.json`、資產分款登錄後彙整、語意檔名、四階段遷移 | 第 0、1 階段已完成（`index/rules.json`、`shared/tools/rules.mjs`、把關程式改讀規則）；第 2、3 階段未做 |
| 2026-11-10 | [三庫分離（知識 / 資產 / 測試）＋迴圈工程與動態索引](decisions/2026-11-10-libraries-and-loop.md)：共用 facet、測試庫登錄、節點圖 N0–N11、`context.mjs` 依節點×遊戲 profile 取脈絡包 | 已定案；A–D 已實作（GateLane 切片：卡片、測試登錄、`context.mjs`、節點圖＋`loop.mjs`），E 未做 |
| 2026-11-11 | [紙上試跑：限時接龍](decisions/2026-11-11-paper-pilot-solitaire.md)：用非動作類題目走一遍迴圈，找出三庫對既有三款的擬合；含接龍技巧佔比量測 | 紀錄（未據此修改） |
| 2026-11-11 | [紙上試跑（二）：撞球與拼字](decisions/2026-11-11-paper-pilot-pool-word.md)：三次試跑比較；取用器幾乎不分辨遊戲（卡片重疊 83–100%）；結構欄位的候選 | 紀錄（未據此修改） |
| 2026-11-11 | [技巧證據的規則重構](decisions/2026-11-11-skill-evidence.md)：結果表、排除純運氣、勝過簡單策略、接近程度人工判定；舊技巧佔比只留給現有三款當回歸警報 | 已定案，尚未實作 |
| 2026-11-11 | [通用化：現況、待決與待辦](decisions/2026-11-11-generality-backlog.md)：三庫與迴圈對既有三款的擬合盤點、待企劃決定的三件事、有共識未定案的項目、建議順序 | 進行中的清單 |

## 開新遊戲：必讀路徑

照 [bootstrap.md §0](../.claude/skills/lite-skillgame-stack/references/bootstrap.md) 的表依階段讀（立項 01 / 02 → 改編題的 `ad-funnel/af-*.md` 改造清單 → 規格 03 / 12 / 13 → 難度曲線 16 → 手感音效 05 / 14 / 15 / 17 → 美術 06 / 07 / 10 / 11 → 技術 04），流程與驗收見 [08](08_production-workflow.md)。交付前 `npm run audit`（[shared/tools/game-audit.mjs](../shared/tools/game-audit.mjs)）檢查產出是否齊全。

## 目錄

| 頁 | 回答什麼 |
|---|---|
| [01 Skill Integrity](01_skill-integrity.md) | 什麼才算 skill game、精髓七條、去隨機化手法、技巧主導驗證門檻 |
| [02 市場與法規](02_market-and-legal.md) | 北美 / 台灣現況、法規快查、排除標準、時效事件、已知矛盾 |
| [03 玩法規則庫與設計模式](03_design-patterns.md) | 38 張規則卡依技巧軸索引、公平模式、計分慣例、局長、變現 |
| [04 技術框架](04_tech-stack.md) | 技術棧、分層、確定性規則、DC / 資源、包體預算、直版 RWD、範本、自檢 |
| [05 打擊感與手感](05_juice-and-feel.md) | 以算代貼的效果做法、GSAP 參數、降級、Spine |
| [06 美術管線](06_art-pipeline.md) | sprite 契約、Codex 生圖到 atlas、踩過的坑、授權 |
| [07 題材與活動](07_themes-and-liveops.md) | 選皮流程、題材與禁忌、節慶檔期 |
| [08 生產流程](08_production-workflow.md) | 從點子到原型的 10 步、指令、skill 所在位置 |
| [09 知識缺口](09_knowledge-gaps.md) | 快速生成還缺什麼（P0 / P1 / P2）與補齊順序 |
| [10 資產庫](10_asset-library.md) | 68 筆視覺資產（生成圖、程式繪製、特效配方、UI 皮）、生圖 prompt 原文模板、中英關鍵字索引；機器可讀版 [index/assets.json](index/assets.json)（由各款 `art/manifest.json` 產生，全部遊戲 85 筆）、導覽 [index/INDEX.md](index/INDEX.md) |
| [11 地表設定集](11_terrain-style-kit.md) | 共用美術規則＋地表生成＋地形整合提詞（v1 原文 / v2 修訂）、各遊戲參數表、平面 / 2.5D / 等角 / 3D 變體、驗收清單 |
| [12 品類實作配方](12_genre-recipes.md) | 節奏 / 時機（子 tick 判定、種子譜面）與確定性物理（撞球）兩份配方、範例遊戲、技巧主導實測與調校教訓、其他品類對應 |
| [13 輸入公平性](13_input-fairness.md) | 時間戳輸入（幀率無關）、延遲校正規則、防巨集 / 防腳本統計 |
| [14 音效](14_audio.md) | Web Audio 程式合成配方、混音原則、節奏遊戲的音訊時鐘對齊 |
| [15 參考遊戲拆解](15_reference-games.md) | 《無雙割草：三國奇兵》與《9527 星際遠征》的技術棧與包體、物件製作規範（2.5D 人武分離、寫實貼圖 + 程式特效）、音效（全合成 vs 檔案 + 合成雙層）、過場演出（Cut-In 刷幕、Boss 雙層血條）、UI/UX、可借用 / 要避開、公平性對照 |
| [16 難度曲線設計與驗收](16_difficulty-curve.md) | 腳本化曲線（難度級、上升鋸齒、調息、頭目）、容錯參數、人性化自動試玩（失誤原因模型、逐單位量測）、**驗收門檻 D1–D8**、調校流程與實例、套用到其他品類 |
| [17 遊戲設計原則](17_design-principles.md) | 風險與報酬、重試與節奏、誇獎與分數呈現、導入；頓幀、動作、特效、音效優先序的原則與「手感弱／拖沓」審查順序；**不適用於技巧賽的原則排除清單**（來源：sakurai-skill 改寫，附影片集數） |
| [16 廣告導流玩法](16_ad-funnel-games.md) | 2025–2026 台灣 / 北美買量廣告最紅的 17 種玩法規格書（解謎排序、加乘門、割草、4X 導流小遊戲）、改成 skill game 的難易排序與做法、DC / 包體估算、假廣告法規；規格書在 [ad-funnel/](ad-funnel/) |

## 三條不可違反的原則

1. **技巧主導且可證明**：同種子、確定性 sim、重播驗分、skill-dominance ≥ 70%；難度曲線用腳本設計、以自動化試玩驗收（[16](16_difficulty-curve.md) D1–D8）。
2. **輕量**：≤ 8 MB、2D DC ≤ 5、打擊感以算代貼、不從 CDN 載入。
3. **錢買不到分數**：排位只賣外觀；不賣數值、次數、資訊；不用賭場語彙與視覺。

## 優先序

門檻數字：[`index/rules.json`](index/rules.json)（唯一來源）> 各遊戲 `config/rules.overrides.json`（只能改允許的規則，必附理由）。做法：專案自己的技術文件 > `lite-skillgame-stack` skill > 本知識庫摘要（skill 與本庫只引用規則 ID，不另寫數字）。

## 維護

- 原始資料更新後，同步修改對應頁的摘要。
- 有 front-matter 的頁是**知識卡**（[index/kb.json](index/kb.json)）：新增 H2 時在標題下加 `<!-- card: <頁 id>.<slug> -->`（或 `<!-- card: skip; reason=… -->`），facet 值只能用 [shared/index/facets.json](../shared/index/facets.json)；改完跑 `node shared/tools/index-build.mjs`。規則：`RULE-KB-CARDS`、`RULE-KB-CARD-SIZE`。
- 未證實的數值保留「（未證實）」標記。
- 缺口補上後，到 [09](09_knowledge-gaps.md) 劃掉並連到新文件。
