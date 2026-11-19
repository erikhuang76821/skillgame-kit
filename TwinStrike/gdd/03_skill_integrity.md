# 03 Skill Integrity — 喵拳道場的技巧完整性

- **目的**：把「結果由技巧決定」落到本作的每條規則、每份數據、每段程式，並列出還缺的證據
- **相關**：[05 玩法規格](05_game_spec.md)、[07 難度曲線](07_difficulty_curve.md)、[10 技術限制](10_tech_constraints.md)、[11 風險](11_risks_open.md)、報告 [skill_dominance_report](../docs/skill_dominance_report.md) / [playtest_report](../docs/playtest_report.md)
- **依據**：[knowledge-base/01 技巧完整性](../../knowledge-base/01_skill-integrity.md)（精髓七條、去隨機化、證據門檻）、[02 市場與法規](../../knowledge-base/02_market-and-legal.md)（排除標準）、[13 輸入公平](../../knowledge-base/13_input-fairness.md)
- **狀態**：Draft（sim v6；證據全部來自 bot 與模擬，真人試玩待做）

## 設計意圖（Why）

左右打怪（OFDP / Timberman 系）是純時機遊戲：敵人什麼時候到、從哪一邊來，全部由種子決定，玩家能改變的只有「何時點、點哪邊」。所以本作的技巧承諾很直接：**同一份題目，點得越準、越不亂點的人分數越高，而且這件事可以用重播證明。**

立項時依 [02 §4](../../knowledge-base/02_market-and-legal.md) 排除標準檢核：結果不由機率或營運商設定決定、不是博弈形式（`RULE-LEGAL-EXCLUDE-CHANCE`）→ 可做。路線 A（台灣 F2P 排行、無現金獎）不碰付費參賽，法規風險見 [11](11_risks_open.md) R1。

## 精髓七條（本作的落實）

逐條答案也寫在 [05 §10](05_game_spec.md)（`npm run audit` 檢查不得空白）；這裡記「怎麼做到」與「哪裡驗」。

| # | 精髓 | 本作落實 | 驗證 |
|---|---|---|---|
| E1 | 技巧為主導 | 分數只來自判定：Perfect / Great / Good × combo（封頂 +50%）＋ Critical 1 分；存活、時間、血量、回血都不計分 | 技巧佔比 97.5%（下節） |
| E2 | 條件完全相同 | 只有 `buildChart(seed)` 抽 RNG（`pattern`、`lane` 兩個 stream，以小節序號取值）；段落腳本固定；玩家怎麼打都不改變譜面 | 測試「chart depends only on the seed」 |
| E3 | 視野完全相同 | 世界固定 720×1280；敵人出現時間 = 到點 − `RULES.approach`，與螢幕比例無關；演出不得遮住敵人或攻擊範圍（05 §11） | 05 §1、§11 |
| E4 | 規則透明 | 標題卡寫計分公式與判定窗；結算逐項列出 Perfect / Great / Good / Miss / 空揮 / 硬直中點擊 / Critical / 達成率 | `scoreBreakdown()` |
| E5 | 天花板且可練習 | Perfect 率、Critical（±20 ms）、不空揮、讀疾兵（預告短）、頭目箭頭；同種子可重玩；結算給時機偏差建議與延遲校正提示 | expert 達成率 96.9%，同分率因 Critical 下降（docs/persona_playtest §5） |
| E6 | 錢買不到分數 | 只賣外觀（貓種、道服、拳印特效）；sim 不讀任何外觀資料 | sim 沒有外觀輸入（`RULE-SIM-PURITY` 掃描） |
| E7 | 結果可驗證 | 確定性 sim（子 tick 判定、整數狀態）＋上傳輸入 log；伺服器用同一份 sim `verify()` 重播比對分數與狀態雜湊 | `server/` 9 項測試；滿局驗證 p50 ≈ 4.4 ms |

## 隨機與公平化

| 一般節奏 / 打怪遊戲的隨機 | 本作做法 |
|---|---|
| 敵人隨機生成 | 固定段落腳本（12 段、49 小節）＋同難度級樂句庫；種子只選「同級的哪一句」與左右鏡像（07） |
| 暴擊、隨機傷害 | 無；重甲固定 3 擊、頭目箭頭序列由樂句決定 |
| 動態難度 | 無；所有人同一條曲線，容錯靠規則（保護期、調息回血、頭目每場最多扣 1 血） |
| 幀率 / 裝置差異 | 輸入以 `PointerEvent.timeStamp` 定子 tick 相位，30–144 Hz 結果相同（[13](../../knowledge-base/13_input-fairness.md)）；延遲校正 ±150 ms 上限，判定窗不變 |

## 技巧行為與獎勵

| 技巧 | 輸入 | 風險 | 報酬 |
|---|---|---|---|
| 準時出拳 | 點對應那一側 | 早點 / 錯邊 = 空揮，硬直 200 ms | Perfect 100 分、combo 加成 |
| 精準（Critical） | ±20 ms 內 | 無額外風險 | 每下 +1 分：高手之間拉開差距 |
| 克制狂按 | 不在沒敵人時點 | 硬直中到點的敵人會打到你 | 保住 combo 與血量 |
| 讀疾兵 | 預告只有 0.73 s | 反應不及漏接 | combo 不斷 |
| 頭目箭頭 | 依頭上箭頭左右連打 | 錯一下即空揮 | 每場最多扣 1 血；打完給演出 |

## 證據

| 證據 | 結果（sim v6） | 門檻 | 來源 |
|---|---|---|---|
| 技巧主導（30 種子 × 3 級 bot） | 技巧佔比 **97.5%**、種子 1.2%、殘差 1.3%；expert vs intermediate 同種子勝率 **100%** | `RULE-SKILL-DOMINANCE` | [skill_dominance_report](../docs/skill_dominance_report.md) |
| 難度曲線 D1–D8（人性化試玩 bot） | ρ 0.85、R² 0.69、高峰遞增、無斷崖、一般玩家 95–98% | `RULE-CURVE-*` | [playtest_report](../docs/playtest_report.md) |
| 角色扮演模擬（6 位 × 3 局） | 找出 6 個設計問題，前 3 個已修（v6） | — | [persona_playtest](../docs/persona_playtest.md) |
| 真人試玩 | **尚未進行** | ≥ 20 人（launch_checklist 1.1） | [human_playtest_plan](../docs/human_playtest_plan.md) |

## 驗證流程（每局）

```
用戶端打完每日題目 → 上傳 {game, version, seed, ticks, score, hash, log, meta.inputOffsetMs}
伺服器：版本 / 種子 / 時間窗 / 校正範圍 / 理論滿分硬檢查 → verify() 重播 → 分數與 hash 一致才上榜
        macroSuspicion / errorSuspicion 只標記送審，不直接作廢
```

細節：[docs/backend_design.md](../docs/backend_design.md)、server/README.md（`TwinStrike/server/README.md`，未收錄）。

## Open Questions

1. bot 的技巧佔比接近上限（97.5%），真人的種子變異可能更大：真人試玩後重算（11 R2）。
2. 每日題目當天可無限重打、取最佳（[backend_design](../docs/backend_design.md)：人人機會相同，要防的是「提前」知道題目）。錦標賽是否改成「只計第一局」以避開背譜（11 R3），待錦標賽設計時決定。
3. 跨日排行用達成率還是當日百分位（01 §4 建議百分位）。
