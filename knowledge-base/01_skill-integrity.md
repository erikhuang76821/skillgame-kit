---
id: KB-skill-integrity
kind: principle
topic: [fairness]
genre: ["*"]
reviewedAt: 2026-10-21
---
# 01 Skill Integrity — 技巧遊戲的核心承諾

> 結果主要由玩家技巧決定，**而且可以被證明**。這是所有設計、技術、變現決策的上位原則。
> 來源：[SwarmDuel/gdd/03_skill_integrity.md](../SwarmDuel/gdd/03_skill_integrity.md)、[SwarmDuel/gdd/02_core_gameplay.md](../SwarmDuel/gdd/02_core_gameplay.md)、[SwarmDuel/docs/skill_dominance_report.md](../SwarmDuel/docs/skill_dominance_report.md)

## 1. 每個系統都要回答的三個問題
<!-- card: KB-skill-integrity.three-questions -->

1. 有沒有玩家控制不了、但會影響分數的東西？（運氣）
2. 雙方條件是否完全相同？（公平）
3. 能不能拿出證據？（可驗證）

## 2. 精髓七條（新遊戲直接沿用為檢查表）
<!-- card: KB-skill-integrity.seven-essentials; rules=RULE-SPEC-FAIRNESS -->

| # | 精髓 | 通用落實方式 |
|---|---|---|
| E1 | 技巧為主導因素 | 勝負只看分數；分數只來自玩家行為 |
| E2 | 條件完全相同 | 同種子：同題目、同選項、同掉落；無暴擊、無機率掉落 |
| E3 | 視野完全相同 | 世界視窗固定（例 720×1280）；長螢幕多出的空間只放 HUD |
| E4 | 規則透明 | 標題寫明計分公式；結算逐項列出分數來源 |
| E5 | 技巧有天花板且可練習 | 時機型操作、風險換報酬、可重玩同種子、看自己最佳紀錄 |
| E6 | 錢買不到分數 | 排位只賣外觀；不賣數值、次數、資訊 |
| E7 | 結果可驗證 | 確定性模擬 + 伺服器以輸入紀錄重播比對分數與狀態雜湊 |

違反任一條預設不做；要做必須在 GDD 寫明例外與理由。

## 3. 去隨機化手法（把一般遊戲的隨機改成公平）
<!-- card: KB-skill-integrity.derandomize -->

| 隨機來源 | 一般做法 | Skill Game 做法 |
|---|---|---|
| 生成 / 出題 | 依時間隨機 | 第 *i* 個事件 = `rng(seed, stream, i)`；時間表固定 |
| 選項（升級卡、道具） | 即時抽 | 第 *k* 次 = 以 `rng(seed, "offer", k)` 打亂整池取前 N |
| 掉落 | 機率掉落 | 必掉；第 n 次固定給特殊物 |
| 暴擊 | 機率 | 取消，傷害完全決定性 |
| AI | 隨機偏移 | 只用 `rng(seed, "ai", id)` 決定初始相位 |
| 先手優勢 | 擲骰 | 規則補償（連珠禁手、圍棋貼目、交換開局） |

RNG 必須是**無狀態雜湊**，以「事件序號」而非「呼叫順序」取值（玩家行為不同不會讓序列錯位）。實作見 [04_tech-stack.md §4](04_tech-stack.md)。

## 4. 證據：Skill Dominance 測試（上線門檻）
<!-- card: KB-skill-integrity.dominance-test; kind=method; rules=RULE-SKILL-DOMINANCE,RULE-SKILL-BASELINE,RULE-SKILL-EVIDENCE,RULE-SKILL-NOT-LUCK,RULE-SKILL-BEATS-SIMPLE,RULE-SKILL-CLOSENESS -->

> 新的量法（不限動作遊戲）：強策略、隨機策略、簡單策略在同一批題目上兩兩比較，規則是 `RULE-SKILL-EVIDENCE`、`RULE-SKILL-NOT-LUCK`、`RULE-SKILL-BEATS-SIMPLE`、`RULE-SKILL-CLOSENESS`，做法見 [技巧證據決策](decisions/2026-11-11-skill-evidence.md) §4、§9。本節以下是原本的技巧佔比做法，之後會改寫。

方法（`SwarmDuel/game/tools/skill-dominance.mjs`，可移植）：

1. 寫 3 種技巧等級 bot（novice / intermediate / expert），**只送出與真人相同的輸入**，由確定性 sim 判分。
2. N 個種子（≥ 30）× 3 等級，算各等級分數分布與同種子對戰勝率。
3. 雙因子變異分解：技巧等級 / 種子 / 交互殘差。

| 指標 | 門檻 |
|---|---|
| 分數變異中「技巧等級」佔比 | ≥ 70% |
| 高手 vs 中手同種子勝率 | ≥ 70% |
| 中手 vs 新手勝率 | ≈ 100% |

**學到的教訓（SwarmDuel R9）**：「存活時間」型分數會讓逃跑型玩法與高手打平 → 技巧天花板偏平。解法是**只改計分**：大幅降低存活獎勵、移除秒數分、加重高風險技巧（Perfect Dodge 5→40 分）。原則：計分要獎勵「漂亮地打」而不只是「活著」，但不能加重到單一最優解。

**基準策略（`RULE-SKILL-BASELINE`）**：技巧佔比只比較「各等級 bot 之間」的差距，若新手 bot 只是亂走，佔比會很高，卻看不出遊戲其實只要一條規則就能玩好。所以 `bots.mjs` 另外匯出 `BASELINES`：幾個一句話講得完、不需要精準時機或瞄準就能照做的固定策略（「選數字大的門」「站中間不動」「只追最近的怪」；「時機完美地按」不算，那正是要量的技巧），和技巧等級 bot 跑同一批種子，比較最好的基準策略與最強等級的平均分。比值過高代表技巧天花板太低：機制缺少讓「只看眼前」選錯的取捨（風險換報酬、時機、需要讀取或推估的資訊、會影響後面幾波的路線）。這時要回玩法規格改機制，不是調數字或改門檻。

**學到的教訓（GateLane N2）**：技巧佔比 91.4% 通過，但「只選數字大的門」一條規則就幾乎每局擊倒頭目、拿到高手六成的分數；原因是新手 bot 不看門，被拉開的差距其實是「看不看門」，不是技巧。

跨種子排行（Daily Seed）用**當日百分位**比較，不用原始分。

## 5. 每局驗證流程
<!-- card: KB-skill-integrity.match-verify; kind=method; topic=fairness,tech -->

```
客戶端對局 → 上傳 {seed, inputLog, choices, claimedScore}
           → 伺服器 Node 重播 → 分數與 stateHash 相同 → 計入
                                    不同 → 作廢 + 風控標記
```

原型在結算畫面就跑同一套重播（1 局 20–90 ms），顯示「Replay verified ✓」。

## 6. 計分設計通則（來自規則卡交叉比對）
<!-- card: KB-skill-integrity.scoring; topic=scoring -->

- 基礎分 + 連擊 + 時間獎勵，**各項有上限**（技巧天花板、平衡、異常偵測）
- 失誤要付代價（21 Blitz：3 次爆牌出局）
- 技巧換資源（Blackout Bingo：塗記充能換道具）
- 過關門檻延長時間（台灣籃球機）
- 結算逐項列出、可拆解
