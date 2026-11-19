# 玩法規格範本（Game Spec）

GDD 說「為什麼」，本規格說「sim 怎麼算」。每一節都對應到程式裡的一個位置，填完就能直接請 AI 產出 `src/sim/sim.js`、`tools/strategies.mjs`、`test/determinism.test.mjs`。存成 `<NewGame>/gdd/05_game_spec.md`。

**規則**：規格裡出現的每個數字都要能在 sim 裡找到同一個常數；改數值先改規格。結果會變的修改一律把 `version` +1（舊重播會被 `verify` 拒絕）。

| 節 | 對應程式 |
|---|---|
| §0 Meta | `GAME.id / version / maxTicks / maxChoices`、`MATCH_TICKS` |
| §1 狀態 | `createSim()` 的欄位 |
| §2 輸入 | `IN_*` 常數、`main.js` 的輸入佇列 |
| §3 隨機 | `makeRng({...})` 的 stream 表 |
| §4 Tick 順序 | `step()` 內的程式順序 |
| §5 規則與事件 | `step()` 分支、`emit()` 的事件型別 |
| §6 計分 | `RULES`、`score()`、`scoreBreakdown()` |
| §7 結束 | `phase()` |
| §8 選擇 | `phase() === 'choice'`、`choose()` |
| §9 比較策略 | `tools/strategies.mjs` |
| §10 公平檢查 | GDD 03 精髓七條 |
| §11 事件 → 演出 | `main.js` 的 `playJuice()`、`fx/feel.js` |
| §12 驗收測試 | `test/determinism.test.mjs` |
| §13 改造對照（改編題才有） | 對應 `knowledge-base/ad-funnel/af-*.md` 的改造清單；`npm run audit` 逐條檢查 |

---

## §0 Meta

| 欄位 | 值 |
|---|---|
| id | `kebab-case`，上線後不改 |
| version | 1 |
| 技巧軸 | 時機 / 瞄準 / 走位 / 規劃 / 資源分配 / …（見 knowledge-base/03） |
| 局長 | __ 秒 = __ tick（60 TPS）；硬上限 `maxTicks`。回合制：__ 步；`maxTicks` = 0、硬上限 `maxChoices` |
| 對戰格式 | 同種子非同步 1v1 / N 人錦標賽 / 單人排行 |
| 世界座標 | 寬 × 高（世界單位）；可見視窗固定 __ × __（公平視野 E3） |
| 定點精度 | 1 世界單位 = `ONE`（256）子像素；或「無連續座標」 |

## §1 狀態（sim 物件）

| 欄位 | 型別 | 初值 | 說明 | 進 stateHash？ |
|---|---|---|---|---|
| `tick` | int | 0 | 回合制改記步數（例如 `moves`） | ✓ |
| `score` | int | 0 | | ✓ |
| … | | | | |

規則：全部是整數或整數陣列；實體陣列依 `id` 遞增；不得存 `Date`、DOM、Pixi 物件、函式。只給 render 用的欄位（`events`、`recordEvents`）不進 hash。

## §2 輸入編碼（每 tick 1 byte）

| bit | 名稱 | 觸控 | 鍵鼠 | 說明 |
|---|---|---|---|---|
| 0–3 | 方向 | 浮動搖桿量化 8 向 | WASD | 0 = 停、1–8 = `DX/DY[code-1]` |
| 4 | `IN_A` | 輕點（< 220 ms 未拖動） | Space | |
| 5 | `IN_B` | 右下按鈕 | E | |

- 連續量（瞄準角度、力道）→ 先量化：角度 0–255（`angleOf`）、力道 0–15，必要時把 log 改成 `Uint16Array` 並在 §0 註明。
- 離散一次性決定（升級卡、出牌）→ 不放進 byte，走 §8 選擇事件。
- 回合制（牌類、盤面、文字／邏輯解謎）→ 本節寫「無（回合制）」：`maxTicks` = 0、`phase()` 一直是 `choice` 直到結束，每一步都是 §8 的選擇事件。
- 輸入在 render 層進佇列，每 tick 取一筆；慢幀不得吞輸入。（純回合制沒有每 tick 輸入，這條不適用。）

## §3 隨機來源

| stream | id | 用途 | index 意義 | 範圍 / 分布 |
|---|---|---|---|---|
| `spawn` | 1 | 第 i 隻敵人位置 | 生成序號 i | `rng.int(…, 256)` 角度 |
| `offer` | 2 | 第 k 次升級三選一 | 升級次數 k | `rng.shuffle(…, k, POOL)` 取前 3 |

規則：index 必須是「事件序號」，不能是 tick 或呼叫次數（玩家行為不同時序列才不會錯位）；stream id 上線後不改；不存在「玩家可影響的隨機」。

## §4 Tick 順序

```
1. 清空 events
2. 套用輸入（移動、動作）
3. 世界更新（生成 → 移動 → 碰撞，實體依 id 排序）
4. 判定與計分
5. 清除死亡實體、推進計時器
6. tick++
```

## §5 規則與事件

| 規則 | 條件（以 tick / 整數表示） | 效果 | 事件 `emit` |
|---|---|---|---|
| | | | `{ type, … }` |

事件只描述「發生了什麼」，給 render 播演出用；不放位置以外的 render 資訊（顏色、音效名由 render 決定）。

## §6 計分

| 項目 | 公式 | 上限 | 技巧意義 |
|---|---|---|---|
| | | | |

- 理論最高分：__（推導寫在這裡；上傳分數 > 理論值 → 直接判異常）
- 結算明細 = `scoreBreakdown()`，逐項顯示給玩家（E4 規則透明）
- 檢查：只靠「活著 / 拖時間」能拿到的分數佔比要低（SwarmDuel R9 教訓）

## §7 結束條件

| 條件 | phase | 說明 |
|---|---|---|
| `tick >= MATCH_TICKS` | `over` | 即時制 |
| 步數用完／無合法步／達成目標 | `over` | 回合制；步數上限不得超過 `maxChoices` |
| HP ≤ 0 | `over` | 剩餘時間是否計分？ |

## §8 選擇事件（沒有就寫「無」）

| 觸發 | 選項來源 | 合法 index | 選擇期間時間 |
|---|---|---|---|
| 升級 | `offer` stream | 0–2 | 暫停（不計入局長） |

- 有選擇事件就要在 `GAME` 定義 `maxChoices`（一局最多幾次選擇）：錄製端超過就不再接受，伺服器重播時超過就判無效。
- 一步是**一個整數**。一步有多個部分（牌＋目標）時，寫明編碼方式：對「由種子與目前狀態確定性產生的合法動作表」的索引，或拆成連續幾次選擇。拆開時要寫明哪一次才算提交、中途能不能取消。編碼是規則的一部分，改了要 `version`+1。
- 文字輸入不能直接當成一個整數：用有限字表的索引，或逐字選擇加一個「提交」步驟。任意長度的文字目前沒有對應格式，真的需要時先提出再定。
- `choose()` 只能回傳 `true` 或 `false`；回傳 `false` 時不得改動 sim（被拒絕的選擇不進紀錄，改了重播就對不上）。
- 悔棋／撤銷只要會改變 sim 的狀態，就是正式的一步、進紀錄；只是畫面預覽就不進紀錄。

## §9 比較策略（技巧證據）

| 名稱 | 角色 | 能看到什麼（不得多於真人） | 能力限制 / 怎麼選動作 |
|---|---|---|---|
| | strong（恰好一個） | | |
| | random（恰好一個） | | 在哪些合法而且會推進遊戲的動作裡均勻抽；排除了哪些、為什麼 |
| | simple（至少一條，建議兩到三條） | | 新手聽一句話就能照做的規則，不需要精準時機或瞄準 |

規則：只送出真人能送的輸入（即時制是 byte，回合制是合法的選擇）；亂數用 `hash32(seed, salt, 事件序號)`，不用 `Math.random`；同一題每次結果相同。確認用題目跑過之前凍結，之後改了要換下一批。量法見 repo `knowledge-base/decisions/2026-11-11-skill-evidence.md` §9。
分級 bot（novice / intermediate / expert）不再必備；人性化試玩用的失誤模型寫在 `tools/humanBots.mjs`（有腳本進程的遊戲）。

## §10 公平檢查（GDD 03 精髓七條）

| # | 問題 | 本作答案 |
|---|---|---|
| E1 | 分數是否只來自玩家行為？ | |
| E2 | 所有隨機都在 §3 且只依種子？ | |
| E3 | 視野是否固定？ | |
| E4 | 計分公式是否公開、結算可拆解？ | |
| E5 | 天花板：高手比中手多拿分的行為是什麼？ | |
| E6 | 付費是否完全不影響 sim？ | |
| E7 | 是否能用 `verify()` 重播驗分？ | |

## §11 事件 → 演出

| 事件 | 演出（render 層） | FEEL 鍵 | LOW 模式 |
|---|---|---|---|
| | | | 保留資訊、拿掉動態 |

## §12 驗收測試

| 測試 | 門檻 |
|---|---|
| 同種子同輸入 → 同結果 | 相同 |
| golden match（固定種子 + expert bot 的 result） | 每個目標引擎相同 |
| 上傳後 `verify` 通過；竄改分數 / 版本不通過 | — |
| 挑戰內容只依種子（換玩家行為，§3 序列不變） | 相同 |
| `npm run evidence:confirm` | 強策略在確認用題目上勝過隨機策略與每一條簡單策略（`RULE-SKILL-EVIDENCE`、`RULE-SKILL-NOT-LUCK`、`RULE-SKILL-BEATS-SIMPLE`，數值見 rules.json）；策略寫在 `tools/strategies.mjs`，各寫明能看到什麼與能力限制。接近程度由人判定（`RULE-SKILL-CLOSENESS`） |
| 滿局重播耗時 | < 500 ms（伺服器預算） |
| `npm run playtest`（`game.profile.json` 的 `scriptedProgression` 為 false 的遊戲不適用） | 難度曲線 D1–D8 全過（RULE-CURVE-*） |

## §13 改造對照（題目來自廣告玩法或既有遊戲時必填）

來源：`knowledge-base/ad-funnel/af-*.md`（連結寫在本規格開頭）。該規格書「Skill Game 化改造（必做）」的每一條各一列，編號照原文；不採用要寫理由與替代做法（RULE-AF-ADAPTATION）。

| # | 改造項目 | 採用？ | 本作做法 / 不採用理由 | 對應程式 |
|---|---|---|---|---|
| 1 | | 採用 / 不採用 | | `sim.js` … |

---

## 給 AI 的生成提示詞

> 依 `gdd/05_game_spec.md` 與 `.claude/skills/lite-skillgame-stack/SKILL.md`，改寫 `game/src/sim/sim.js`（匯出 `GAME`，只 import `./core/index.js`）、`game/tools/strategies.mjs`（§9 比較策略）、`game/test/determinism.test.mjs`（§12，保留測試名稱）。不要修改 `src/sim/core/` 與 `test/core.test.mjs`。完成後跑 `npm test` 與 `npm run evidence`，未達門檻就回報哪一項、不要改門檻（門檻只在 rules.json）。確認用題目（`npm run evidence:confirm`）留給人在策略凍結後跑。最後更新 golden match 的值。

---

## 範例：範本內建的 Beat Tap（對照 `templates/src/sim/sim.js`）

| 節 | 內容 |
|---|---|
| §0 | id `beat-tap`、version 1、技巧軸「時機」、30 s = 1800 tick、單人同種子；無連續座標 |
| §1 | `tick score combo best beat nextBeat hitBeat perfects whiffs misses`，全進 hash |
| §2 | bit0 `IN_TAP`（點任意處 / 任意鍵）；點擊位置只留在 render |
| §3 | `beat` (1)：第 k 拍與下一拍的間隔 `rng.range(seed,'beat',k,36,84)` tick |
| §4 | 清 events → 判定點擊 → 窗口最後一 tick 結算 miss 並排下一拍 → tick++ |
| §5 | 窗口內首次點擊 = perfect；窗口外或同拍第二次 = whiff；窗口過了沒點 = miss |
| §6 | perfect `10 + 2 × min(combo, 10)`；whiff −5（最低 0）；理論最高 ≈ 拍數 × 30 |
| §7 | `tick >= 1800` → over |
| §8 | 無 |
| §9 | 讀「下一拍何時開」（畫面提示可見），誤差 ±20 / ±8 / ±5 tick；novice 另有 0.8% 亂按 |
| §10 | 拍點只依種子；無付費；結算可重播驗證 |
| §11 | perfect → 閃白 + 衝擊波 + 粒子 + 震動；whiff → 紅暗角 + 小震動；combo ≥ 5 → boss 級震動 |
| §12 | 15 項測試全過；技巧佔比 87.1%、expert vs intermediate 100% |
