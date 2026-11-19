---
id: KB-genre-recipes
kind: recipe
topic: [design, tech]
reviewedAt: 2026-10-21
---
# 12 品類實作配方 — 節奏 / 時機、確定性物理

> 補 [09](09_knowledge-gaps.md) G2。每份配方 = 一個 core 模組（可直接 import）＋一個無畫面的範例遊戲（`GameDef`＋三級 bot＋技巧主導測試）。範例在範本 `templates/examples/`，複製範本時一起帶走；不需要就刪掉該資料夾與 `test/recipes.test.mjs` 對應段落。
> 寫規格時對照 [game-spec-template.md](../.claude/skills/lite-skillgame-stack/references/game-spec-template.md)；輸入時間戳與延遲校正見 [13](13_input-fairness.md)。

## 1. 節奏 / 時機（太鼓、maimai、OFDP、Timberman、Blackout Bingo 塗記）
<!-- card: KB-genre-recipes.rhythm; genre=rhythm; skillAxis=timing -->

**模組**：[`src/sim/core/timing.js`](../.claude/skills/lite-skillgame-stack/templates/src/sim/core/timing.js) **範例**：[`examples/rhythm/`](../.claude/skills/lite-skillgame-stack/templates/examples/rhythm/sim.js)（2 軌、150 BPM、約 50 秒）

| 要素 | 做法 | 為什麼 |
|---|---|---|
| 時間單位 | 「子 tick」：每 tick 分 16 份（≈ 1.04 ms @ 60 TPS） | 60 Hz 的 sim 也能判 ±35 ms 的 Perfect，不受顯示幀率影響 |
| 輸入 byte | bit0 = 點擊（多軌用 bit0/1）、bit4–7 = 子 tick 相位 | 相位由事件時間戳算出（[13](13_input-fairness.md)），重播完全一致 |
| 譜面 | `makeChart(seed, opts)`：每拍依權重選樣式（休止 / 單音 / 二分 / 三連），軌道也由種子決定 | 只依種子 → 同種子玩家拿到同一份譜面（E2）；難度 = 樣式權重表 |
| 判定 | `judgeTap()`：同軌最早一個未判定、且在 Good 窗內的音符；窗口 Perfect 35 / Great 70 / Good 110 ms（半寬） | 窗口數值寫進規格 §6 與結算畫面（E4） |
| 空按 | 窗內沒有音符 = whiff：斷 combo、計次 | 亂按必須有代價，否則狂按打敗精準 |
| 漏接 | `judgeMisses()` 每 tick 把超過晚窗的音符記 Miss | 不按也不會「躲過」判定 |
| 計分 | 基礎 50 / 80 / 100 × (100 + min(combo−1, 50)) / 100 | combo 加成有上限 → 技巧天花板清楚、異常分可偵測 |
| 理論滿分 | `maxScore(chart)` | 上傳分數 > 滿分 = 直接作廢 |

**實測**（30 種子、三級 bot：誤差 σ 75 / 38 / 16 ms）：技巧佔分數變異 **86.9%**，expert 對 intermediate 同種子勝率 100%。

**做新遊戲時要改的**：樣式權重（難度）、BPM（`beatTicks`）、軌數、窗口、combo 上限。音樂與譜面對齊用 `audio` 的時鐘（[14](14_audio.md) §4）。

## 2. 確定性物理（撞球、泡泡龍、冰球、彈珠）
<!-- card: KB-genre-recipes.physics; genre=physics; skillAxis=aim -->

**模組**：[`src/sim/core/physics.js`](../.claude/skills/lite-skillgame-stack/templates/src/sim/core/physics.js) **範例**：[`examples/billiards/`](../.claude/skills/lite-skillgame-stack/templates/examples/billiards/sim.js)（單人清台、種子決定球型、14 顆球 24 桿）

| 要素 | 做法 | 為什麼 |
|---|---|---|
| 狀態 | 位置 / 速度存整數子像素（1/256 px） | 可精確雜湊、序列化；狀態雜湊比對重播 |
| 運算 | 碰撞反應用 double，但**只用 + − × ÷ 與 `Math.sqrt`** | IEEE-754 保證這些在每個引擎結果相同；`sin/cos/atan2/pow` 不保證 |
| 瞄準 | 4096 方向表（0.088°/格），Taylor 級數建表、夾在 ±1 | 不用 `Math.sin`；精度足夠撞球薄切 |
| 出桿 | 一桿 = 一個選擇事件 `index = aim × 32 + (power − 1)` | 不佔每 tick 輸入；伺服器重播時逐桿驗證 |
| 防穿透 | 每 tick 依最快球速拆子步，每子步移動 ≤ r/2；並把碰撞法線**回溯到剛接觸那一刻** | 否則高速球穿球、或陷入深度讓反彈角偏掉，瞄準不再精確 |
| 摩擦 | 比例阻力 + 固定滾動損失 + 停止閾值 | 只有比例阻力時，慢速球的整數速度永遠不會歸零 |
| 球袋 | 先判進袋、再判反彈 | 否則球會在袋口被彈走 |
| 順序 | 球依陣列順序、配對 i < j | 迭代順序固定 |
| 題目公平 | 種子擺球時只接受「自己有一條無遮擋進袋線、且不擋死已擺好的球」的位置（整數幾何、無除法） | 不讓某些種子發出靠運氣才打得進的球型 |

**實測與教訓**（30 種子、三級 bot：瞄準誤差 σ 6° / 1.6° / 0.35°）：

| 版本 | 技巧佔比 | expert vs intermediate | 改了什麼 |
|---|---|---|---|
| v1 | 6% | 53% | 慢速球不停 → 每桿都跑到時間上限 |
| v2 | 45% | 83% | 加滾動損失、bot 依距離算力道 |
| v3 | 62% | 92% | 接觸法線回溯、先判進袋、瞄袋口、bot 檢查擋球 |
| v4（8 桿，取消連進加成） | 71% | 92% | **連進倍率會放大球型運氣**——拿掉後 +10 pt |
| v5（16 桿、11 球） | 80% / 72% / 69%（三組種子） | 95% / 95% / 85% | 桿數越多，單局運氣越被平均掉 |
| v6（+ 進袋線保證） | 71% / 70% / 70% / 72% | 88% / 88% / 85% / 94% | 各組種子差距縮小，但仍貼著門檻 |
| **v7（24 桿、14 球，現行）** | **81% / 75% / 76% / 75%**（四組種子） | **100% / 94% / 91% / 96%** | 球數也要跟著加：24 桿只配 11 球時高手常提早清台，分數被天花板壓平（降到 63–66%） |

**結論**：撞球類天生比節奏類更吃球型（交互項大）。三個槓桿依效果排序：① 拿掉非線性加成（計分）② 加長單局並同步加球數（平均掉運氣，但別讓高手碰到滿分天花板）③ 限制種子產生的球型（題目公平）。v7 在四組種子都過 70%，測試會在兩組種子上檢查（`test/recipes.test.mjs`）。

## 3. 共通做法（兩份配方都適用）
<!-- card: KB-genre-recipes.common; genre=* -->

1. 先寫規格 §2 輸入、§3 隨機、§6 計分，再寫 sim。
2. 範例 bot 只讀「真人看得到的資訊」，誤差用 `hash32` 產生的近似常態分布（4 個均勻分布相加）。
3. 每次改規則跑 `node tools/skill-dominance.mjs 30`，再用另一組種子（`runDominance(GAME, BOTS, 60, 777)`）確認不是剛好過關。
4. **非線性加成（連擊倍率、連進倍率）先關掉測一次**：SwarmDuel 的存活獎勵、撞球的連進倍率都證明它們會放大運氣。

## 4. 其他品類的對應
<!-- card: KB-genre-recipes.other-genres; genre=* -->

| 品類（規則卡） | 用哪份配方 | 另外要做 |
|---|---|---|
| OFDP、Timberman（左右切換） | 節奏：每個敵人 / 樹枝 = 音符，左右 = 兩軌 | 空揮硬直（whiff 後 N tick 不接受輸入）、計時條 |
| Blackout Bingo、Solitaire（反應 + 規劃） | 節奏的判定窗用於「塗記速度」計分 | 盤面 / 牌序由種子決定（core/rng.js `shuffle`） |
| 泡泡龍（Bubble Cube 2） | 物理：發射 = 選擇事件、牆面反彈 | 六角格吸附、同色消除用整數格 |
| Skee-Ball、投籃機、Golden Tee | 物理：力道 + 角度 = 選擇事件 | 風況 / 球道參數全部來自種子 |
| 三消（Diamond Strike） | 都不用：純格子規則 | 補落用 `rng(seed, 'refill', 第 n 次補落)` 才能同種子 |
| 塔防（Bloons、Kingdom Rush） | 都不用：固定波次腳本 | 參考 SwarmDuel 的生成時間表與 `fixed.js` |
