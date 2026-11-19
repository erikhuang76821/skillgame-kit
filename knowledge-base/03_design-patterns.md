---
id: KB-design-patterns
kind: method
topic: [design]
genre: ["*"]
reviewedAt: 2026-10-21
---
# 03 玩法規則庫與設計模式

> 來源：[SwarmDuel/knowledge/rules/](../SwarmDuel/knowledge/rules/)（38 張規則卡）、範本 [_TEMPLATE_rules.md](../SwarmDuel/knowledge/_TEMPLATE_rules.md)、[_notes/genres-snake-td-lane.md](../SwarmDuel/knowledge/_notes/genres-snake-td-lane.md)
> 卡片欄位：表頭（市場、形態、代表產品、熱度、技巧 vs 運氣）→ 一句話玩法 → 規則書（勝負、流程、計分、操作、公平機制）→ 技巧要素 → 運氣來源 → 參賽與變現 → 主題美術 → 可借用設計 → 法規風險 → 來源。

## 1. 規則卡索引（依技巧軸）
<!-- card: KB-design-patterns.rule-card-index; kind=research -->

| 技巧軸 | 卡片 | 局長 | 最值得借的設計 |
|---|---|---|---|
| **規劃 / 路線** | [Solitaire Cube](../SwarmDuel/knowledge/rules/na-m-solitaire-cube.md)、[Solitaire Cash](../SwarmDuel/knowledge/rules/na-m-solitaire-cash.md)、[Word Cube 2](../SwarmDuel/knowledge/rules/na-m-word-cube-2.md)、[Yatzy Royale](../SwarmDuel/knowledge/rules/na-m-yatzy-royale.md) | 5 分 | 滿分可算（超出判異常）；第一次操作才計時；骰子改牌堆才能同序重播；輪流制改單人可比較 |
| **策略 + 速度** | [21 Blitz](../SwarmDuel/knowledge/rules/na-m-21-blitz.md) | 3 分 | 連擊表 250→1,250 + 3 次 Bust 出局 |
| **反應 / 塗記** | [Blackout Bingo](../SwarmDuel/knowledge/rules/na-m-blackout-bingo.md)、[Bingo Cash](../SwarmDuel/knowledge/rules/na-m-bingo-cash.md) | 2 分 | 塗記速度計分、技巧充能換道具；**bot 醜聞反面教材** |
| **瞄準 / 物理** | [Bubble Cube 2](../SwarmDuel/knowledge/rules/na-m-bubble-cube-2.md)、[Pool Payday](../SwarmDuel/knowledge/rules/na-m-pool-payday.md)、[撞球](../SwarmDuel/knowledge/rules/tw-billiards.md)、[Big Buck Hunter](../SwarmDuel/knowledge/rules/na-v-big-buck-hunter.md)、[飛鏢](../SwarmDuel/knowledge/rules/tw-darts.md) | 1–5 分 | 距離遞增計分、乘法清色獎勵；Push Out；誤殺懲罰；Rating 分 Flight |
| **力道一致性** | [Golden Tee](../SwarmDuel/knowledge/rules/na-v-golden-tee.md)、[Skee-Ball](../SwarmDuel/knowledge/rules/na-v-skee-ball.md)、[Pop-A-Shot](../SwarmDuel/knowledge/rules/na-v-basketball-pop-a-shot.md)、[台灣投籃機](../SwarmDuel/knowledge/rules/tw-basketball-arcade.md) | 40 秒–18 洞 | 每日統一條件賽；角落高分的風險選擇；最後 10 秒加權；過門檻延長時間 |
| **節奏 / 時機** | [太鼓](../SwarmDuel/knowledge/rules/tw-taiko.md)、[maimai](../SwarmDuel/knowledge/rules/tw-maimai.md)、[CHUNITHM](../SwarmDuel/knowledge/rules/tw-chunithm.md)、[OFDP](../SwarmDuel/knowledge/rules/genre-one-finger-death-punch.md)、[Timberman](../SwarmDuel/knowledge/rules/genre-timberman.md) | 一首歌 / 30–120 秒 | 固定天井分、101% 雙層天花板；空揮硬直；時間條 + 動作補時 |
| **三消 / 手速** | [Diamond Strike](../SwarmDuel/knowledge/rules/na-m-diamond-strike.md) | 1 分 | 補落必須同種子；時間獎勵不吃倍率 |
| **走位** | [Snake 經典](../SwarmDuel/knowledge/rules/genre-snake-classic.md)、[slither.io](../SwarmDuel/knowledge/rules/genre-slither-io.md)、[Snake.io](../SwarmDuel/knowledge/rules/genre-snake-io.md)、[荒野亂鬥](../SwarmDuel/knowledge/rules/tw-brawl-stars.md) | 2–5 分 | 「第 n 顆 → 候選格排序」決定食物；加速有成本；模式分層 |
| **塔防 / 經濟** | [Bloons TD](../SwarmDuel/knowledge/rules/genre-bloons-td.md)、[Kingdom Rush](../SwarmDuel/knowledge/rules/genre-kingdom-rush.md)、[Rush Royale](../SwarmDuel/knowledge/rules/genre-rush-royale.md)、[皇室戰爭](../SwarmDuel/knowledge/rules/tw-clash-royale.md) | 3–10 分 | 固定波次 = 天然同種子；Race 比時間；CHIMPS 禁付費；提前叫波換錢；聖水倍速段落 |
| **完全資訊策略** | [象棋](../SwarmDuel/knowledge/rules/tw-xiangqi.md)、[圍棋](../SwarmDuel/knowledge/rules/tw-go.md)、[連珠](../SwarmDuel/knowledge/rules/tw-gomoku-renju.md)、[暗棋](../SwarmDuel/knowledge/rules/tw-chinese-dark-chess.md) | 5–15 分 | 貼目、禁手、Swap2；棋例自動裁判；同佈局雙局換先 |
| **團隊 / 大型 PvP** | [傳說對決](../SwarmDuel/knowledge/rules/tw-arena-of-valor.md)、[蛋仔派對](../SwarmDuel/knowledge/rules/tw-eggy-party.md)、[跑跑卡丁車](../SwarmDuel/knowledge/rules/tw-kartrider.md) | 3–12 分 | 純技巧軌與道具軌分開；多場累積星數攤平運氣；10 分鐘是手機局長上限 |
| **實體攤位** | [夜市技巧攤](../SwarmDuel/knowledge/rules/tw-night-market-games.md) | 按次 | 距離即價值；規則透明才有信任 |

偏薄的卡（數值多未證實）：Diamond Strike、Pool Payday、Bingo Cash、Pop-A-Shot、Skee-Ball、台灣投籃機、傳說對決、Word Cube 2。Rush Royale 原版運氣主導，只當去隨機化練習題。

## 2. 公平 / 去運氣模式
<!-- card: KB-design-patterns.fairness-patterns; topic=fairness,design -->

| 問題 | 模式 | 來源 |
|---|---|---|
| 每局條件不同 | 同種子（牌序、彈匣、叫號、字母、波次、食物、bot 劇本） | 現金手遊、genre 卡 |
| 開局不對稱 | 玩家自己抵銷（Swap2、Push Out）/ 輪替（敗方先攻、CORK）/ 分差補償（貼目、後手勝局計分） | 棋類、撞球、飛鏢 |
| 養成破壞公平 | 排位等級上限、CHIMPS 禁付費加成、技能只影響通關不影響分數、只賣外觀 | 皇室、BTD、CHUNITHM、io |
| 實力差距大 | 技術分配對、Rating + Flight、限制強者參加、駕照門檻 | 飛鏢、圍棋、跑跑 |
| 單局變異 | 搶 N 局、多場累積、取最佳成績 | 撞球、蛋仔、BBH |
| 作弊 | 理論滿分上限、伺服器重播、反應下限 / 間隔標準差判巨集（< 80 ms 或 σ 過小）、關閉觀戰資訊、實名綁卡 | 綜合 |
| 計時爭議 | 第一次操作才計時、暫停不停表 | Solitaire Cube、Word Cube |

## 3. 計分公式慣例
<!-- card: KB-design-patterns.scoring; topic=scoring -->

- 剩餘時間獎勵按秒計且有上限（+4/s 上限 1,200；+10/s 上限 1,800）
- 遞增連擊表；乘法型獎勵（清色、倍率）
- 時段加權（最後 10 秒）
- 失誤扣分 / 空揮硬直 / 有限命數
- 精準型：固定天井分 + 101% 上限
- 星等用門檻劃分

## 4. 局長基準
<!-- card: KB-design-patterns.session-length; topic=scoring,design -->

| 形態 | 局長 |
|---|---|
| 現金手遊 | 1 分（三消）/ 2 分（賓果）/ 3 分（21 點、泡泡）/ 5 分（接龍、拼字） |
| 機台 | 40–55 秒、9 球、一首歌 |
| PvP 手遊 | 2–3 分；MOBA 約 10 分為上限 |
| 棋類 | 5–15 分 |

## 5. 變現模式
<!-- card: KB-design-patterns.monetization; topic=monetization -->

| 模式 | 要點 |
|---|---|
| 北美現金賽（Skillz 型） | 現金 + 不可提領 Bonus Cash 入場；入場費 $0.60–$5；6 人取前 3；18+、地理圍欄 |
| 店面 | 按次付費 + 票券兌換；獎品價值上限 |
| 實體賽 | 固定報名費 + 名次獎金 |
| F2P | 通行證、外觀；台灣轉蛋須揭露機率；Clash Royale 移除寶箱計時器後營收回升 |
| **不賣**（Skill 遊戲共通） | 排位數值、復活、次數票、loot box、對手資料 / 種子預覽 |

## 6. 跨市場可借用規則（knowledge/README 精選）
<!-- card: KB-design-patterns.borrowable-rules; kind=research -->

同種子非同步對戰 · 基礎分 + 連擊 + 時間獎勵（有上限）· 失誤有代價 · 技巧換道具 · 過關門檻延長時間 · 透明保底不歸零 · 卡片存檔 + 全國排行 · 公開評級 · 禁手 + 開局交換 · 固定波次腳本 · 一鍵雙向攻守 · 年度版本 + 聯賽 + 世錦賽
