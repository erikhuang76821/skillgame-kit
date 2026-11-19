# TwinStrike 玩法規格（Game Spec）v1

> 依 [game-spec-template](../../.claude/skills/lite-skillgame-stack/references/game-spec-template.md) 撰寫。GDD 說「為什麼」，本規格說「sim 怎麼算」。
> 品類：左右切換打怪（OFDP / Timberman 系），規則卡：[OFDP](../../SwarmDuel/knowledge/rules/genre-one-finger-death-punch.md)、[Timberman](../../SwarmDuel/knowledge/rules/genre-timberman.md)。
> 配方：[knowledge-base/12 §1 節奏 / 時機](../../knowledge-base/12_genre-recipes.md)（`core/timing.js` 原樣使用）、[13 輸入公平](../../knowledge-base/13_input-fairness.md)。
> 題材與玩法解耦：本檔只用中性名詞（主角 / 敵人 / 左 / 右），題材見 [01_theme_proposals.md](01_theme_proposals.md)。
> 數值已用 bot 實測回寫（見文末「實測結果與調校紀錄」），真人試玩後再調；改數值先改本檔，再改 `game/src/sim/sim.js` 的同名常數。
> **可對帳格式**：本檔寫成 `` `NAME` = 數值 `` 的常數（`NAME` 是 sim.js 的匯出名，或 `RULES.x`、`WINDOWS.x`、`GAME.x`），`npm run audit`（`RULE-SPEC-CONSTANTS`）會逐一和程式比對，不一致就擋 commit。

**一句話**：主角站在畫面中央，敵人從左右兩側走近；敵人踏進攻擊範圍的那一刻點對應那一側出招。點早了、點錯邊都算空揮，空揮後有硬直；被敵人打到要扣血。

---

## §0 Meta

| 欄位 | 值 |
|---|---|
| id | `twin-strike`（暫定代號；**上線前**可隨正式名稱改，上線後不改） |
| version | `GAME.version` = 6（2026-10-21 Critical Perfect ±20 ms +1 分；v5 4 / 8 小節樂句重排；v4 狸貓頭目、v3 腳本化難度曲線見 07；v2 容錯調整見文末） |
| 技巧軸 | 時機（主）＋ 讀敵 / 克制狂按（副） |
| 局長 | 90 s；`MATCH_TICKS` = 5400 tick（60 TPS）；`GAME.maxTicks` = 5400 |
| 對戰格式 | 同種子非同步：每日挑戰（全服同種子）＋ 6–20 人錦標賽；單人練習可重玩同種子 |
| 世界座標 | 720 × 1280 直版，固定視窗（E3）；長螢幕多出的區域只放 HUD |
| 定點精度 | sim 無連續座標。時間單位是子 tick（`SUB` = 16 份 / tick，約 1.04 ms）；敵人位置由 render 依時間推算 |
| 未來模式（不在 v1） | **Blind**：隱藏重甲的方向標記（高段位賽道），sim 不變，只改 render |

## §1 狀態（sim 物件）

| 欄位 | 型別 | 初值 | 說明 | 進 stateHash？ |
|---|---|---|---|---|
| `seed` | uint32 | 參數 | | —（已由 chart 體現） |
| `tick` | int | 0 | | ✓ |
| `chart` | `{t, lane, kind, group}[]` | `buildChart(seed)` | 依 t 遞增，id = 陣列 index；只依種子 | —（由 seed 決定） |
| `judge` | `createJudge(chart)` | — | `core/timing.js`：`next grade[] combo maxCombo counts[4] score whiffs` | ✓（score、combo、whiffs、grade[]） |
| `hp` | int | `RULES.hpMax` = 6 | | ✓ |
| `guardUntil` | int（tick） | 0 | 扣血後的保護期：`tick < guardUntil` 時漏接不扣血 | ✓ |
| `staggerUntil` | int（tick） | 0 | `tick < staggerUntil` 時處於硬直 | ✓ |
| `lockedTaps` | int | 0 | 硬直中被忽略的點擊數（統計 / 風控用） | ✓ |
| `hurts` | int | 0 | 被打中次數（含無雙段不扣血的） | ✓ |
| `deathTick` | int | −1 | hp 歸零的 tick | ✓ |
| `events` / `recordEvents` | — | — | 只給 render | ✗ |

### 敵人種類（`kind`）

| kind | 名稱 | 預告時間 `APPROACH`（從畫面邊緣走到攻擊範圍） | 擊數 | 說明 |
|---|---|---|---|---|
| 0 | 步兵 | 66 tick（1.10 s） | 1 | 基本 |
| 1 | 疾兵 | 44 tick（0.73 s） | 1 | 預告短，考讀敵 |
| 2 | 重甲 | 78 tick（1.30 s） | 3 | 一隻敵人＝同一 `group` 的 3 個音符；出場時頭上顯示 3 個方向標記 |

> 預告時間 `RULES.approach` = 66, 44, 78 tick（依 kind 0 / 1 / 2）。敵人「出現在畫面」的 tick = `t / SUB − approach[kind]`。這是玩家（和 bot）能看到這個音符的最早時刻。

## §2 輸入編碼（每 tick 1 byte）

| bit | 名稱 | 觸控 | 鍵鼠 | 說明 |
|---|---|---|---|---|
| 0 | `IN_L` | 點螢幕左半 | ← / A / F / 滑鼠左鍵 | 打左邊 |
| 1 | `IN_R` | 點螢幕右半 | → / D / J / 滑鼠右鍵 | 打右邊 |
| 4–7 | phase | 由 `PointerEvent.timeStamp` 算出 | `KeyboardEvent.timeStamp` | 子 tick 相位（[13 §2](../../knowledge-base/13_input-fairness.md)） |

- `encode(lanes, phase) = lanes | (phase << 4)`，與 `examples/rhythm` 相同。
- 同一 tick 同時有左右兩個點擊：先判左、再判右（固定順序）。譜面保證不會出現左右同時（§3 間距規則），所以不影響公平。
- 鍵盤需要補接 `KeyboardEvent`（範本只接了 pointer，[13 §5](../../knowledge-base/13_input-fairness.md)）。
- 延遲校正 `calibrate()` 的結果寫進 `rec.meta.inputOffsetMs`，排位前強制做一次。

## §3 隨機來源（v3）

| stream | id | 用途 | index 意義 | 範圍 / 分布 |
|---|---|---|---|---|
| `pattern` | 1 | 第 bar 小節選同難度級中的哪一句樂句 | 全局小節序號 bar | `rng.int(…, 該級樂句數)` |
| `lane` | 2 | 第 bar 小節的 A 側是左還是右（鏡像） | bar | `rng.int(…, 2)` |
| `kind` | 3 | （v3 起不用，保留編號不重用） | — | — |

規則：只有 `buildChart(seed)` 呼叫 RNG；sim 執行期間不抽任何隨機數。玩家怎麼打都不會改變譜面（E2）。

### 3.1 腳本化難度曲線

v3 起改成固定腳本 + 樂句庫，設計與調校紀錄見 [07_difficulty_curve.md](07_difficulty_curve.md)。

- 12 個段落、49 小節（4 / 8 小節樂句）；拍速 113 → 171 BPM 逐段上升（無雙段 138 / 164）；難度級 L1 → L8，每級只加一個新要素；L9–L11 是狸貓頭目小節（`BOSS_LEVEL` = 9），放在 B、C、D、E 段末。
- 音符時間 = 小節起點 + 第 k 個八分音符 × 拍長 / 2（子 tick 精確）；重甲 = 連續 2–3 個八分音（同一 `group`）。
- 調息段（A2、B2、D2）開始時回 1 血（`heal` 事件），共 3 次。
- 間距規則（`checkSpacing`，1,000 個種子測試）：任兩音符 `RULES.minGap` = 6 tick 以上；同側相鄰 `RULES.minGapSameLane` = 7 tick 以上；八分音在最快 21 tick/拍時為 10.5 tick。
- 第 1 個音符在 tick 120 之後；最後一個不晚於 `RULES.lastNoteTick` = 5280（實測 ≤ 5072）。音符數 206–226 個（1,000 個種子）。

## §4 Tick 順序

```
1. 清空 events
2. 若 hp == 0 → 不再處理（phase = over）
3. 套用輸入：
   a. tick < staggerUntil → 有點擊就 lockedTaps++、emit 'locked'，不判定
   b. 否則依序處理 IN_L、IN_R：judgeTap(judge, chart, tapTime, lane, WINDOWS)
      - 命中 → emit 'hit'；combo 是 RULES.regenCombo 的倍數且 hp < RULES.hpMax → hp +1、emit 'heal'
      - 空揮 → staggerUntil = tick + RULES.stagger、emit 'whiff'（judgeTap 已把 combo 歸零、whiffs++）
4. judgeMisses(judge, chart, tick * SUB, WINDOWS, onMiss)
      - onMiss：hurts++；不在安全段 → hp--；emit 'hurt'；hp 歸零 → deathTick = tick、emit 'death'
5. 段落切換 → emit 'segment'
6. tick++
```

## §5 規則與事件

| 規則 | 條件（整數） | 效果 | 事件 |
|---|---|---|---|
| 命中 | 點擊那一側在 Good 窗（±135 ms）內有最早一個未判定的音符 | 依誤差給 Perfect / Great / Good，combo +1 | `{type:'hit', note, lane, grade, pts, kind, last}`（`last` = 重甲的最後一擊） |
| 空揮 | 點擊那一側在 Good 窗內沒有音符（點太早、點錯邊、重複點） | combo 歸零、whiffs++、硬直 `RULES.stagger` = 12 tick（200 ms） | `{type:'whiff', lane}` |
| 連擊回血 | 命中後 combo 是 `RULES.regenCombo` = 12 的倍數，且 hp < 6 | hp +1 | `{type:'heal', hp}` |
| 硬直中點擊 | `tick < staggerUntil` | 不判定、不延長硬直 | `{type:'locked'}` |
| 漏接 | 音符的晚窗已過還沒判定 | 記 Miss、combo 歸零；不在安全段 hp −1 | `{type:'hurt', note, lane, hp, safe}` |
| 安全段 | 音符屬於 W（暖身）、F1、F2（無雙） | 漏接不扣血（仍歸零 combo、記 Miss） | — |
| 無雙段 | F1、F2 | 只換演出；**分數不加倍** | `{type:'segment', id, fever}` |
| 死亡 | hp == 0 | 結束；之後的音符不結算 | `{type:'death'}` |

判定窗（半寬，`sim.js` 的 `WINDOWS`，單位子 tick，比 `core/timing.js` 預設 35 / 70 / 110 ms 寬）：`WINDOWS.perfect` = 43（45 ms）、`WINDOWS.great` = 82（85 ms）、`WINDOWS.good` = 130（135 ms）。

保護期：扣血後 `RULES.guard` = 30 tick（0.5 s）內的漏接只歸零 combo、記 Miss，不再扣血（hurt 事件 `safe: true`）。一次空揮常連帶漏掉 1–2 個敵人，保護期讓它只算一次傷害。畫面上的「攻擊範圍」就是 Good 窗。

> 為什麼硬直不延長：連按時，只有第一次空揮會造成硬直，硬直中的點擊不會再延長它，玩家不會被一次失誤鎖死。代價是硬直期間到點的敵人會打到你。

## §6 計分

| 項目 | 公式 | 上限 | 技巧意義 |
|---|---|---|---|
| 單擊 | `POINTS[grade] × (100 + min(combo − 1, 50)) / 100`，取整；POINTS = Good 50 / Great 80 / Perfect 100 | 每擊 150 | 時機準度 |
| combo 加成 | 已含在上式，最多 +50% | 第 51 連之後封頂 | 穩定度；有上限，避免放大運氣 |
| 空揮 | 0 分；combo 歸零＋硬直 | — | 克制狂按 |
| 漏接 | 0 分；combo 歸零＋扣血 | — | |
| 存活 / 剩餘時間 / 剩餘血量 / 回血 | **不計分** | — | 避免「活著就有分」（SwarmDuel R9 教訓） |

- **Critical Perfect（v6）**：Perfect 且誤差在 `CRITICAL` = 19 子 tick（±20 ms）以內，每下再加 `RULES.critBonus` = 1 分；只當同分時的區分，像 maimai 的 101%。理論最高分因此 = 下式 + 音符數。
- **理論最高分** = `maxScore(sim)` = 前 50 個音符 `Σ(100 + c)` = 6,225，第 51 個起每個 150，再加每個音符的 Critical 1 分 → `6,225 + 150 × (N − 50) + N`。N = 220 時為 31,945。上傳分數超過 → 判異常。
- **達成率** = `score / maxScore(chart)`：跨種子比較（段位、賽季）用達成率，同種子排行用原始分數。
- 結算明細 `scoreBreakdown()`：Perfect / Great / Good / Miss 數、空揮數、硬直中點擊數、最大 combo、被打中次數、達成率，逐項顯示（E4）。
- 沒有連殺倍率、沒有重甲擊破獎勵：撞球配方證明非線性加成會放大運氣（[12 §2](../../knowledge-base/12_genre-recipes.md)）。實測後若技巧佔比有餘裕，才考慮加。

## §7 結束條件

| 條件 | phase | 說明 |
|---|---|---|
| `tick >= 5400` | `over` | 正常結束 |
| `hp == 0` | `over` | 提前結束；剩下的音符不給分，剩餘時間不計分 |

## §8 選擇事件

無。v1 沒有局內升級或選卡，所有人整局條件完全相同。

## §9 Bot（技巧分級）

沿用 `examples/rhythm/bots.mjs` 的 `timingBot`，另加兩條限制：

1. **可見性**：音符要到出現 tick（`t/SUB − APPROACH[kind]`）之後才能被 bot 看到。
2. **反應下限**：從出現到出手至少 `REACT` 毫秒（novice 280、intermediate 200、expert 160）；疾兵預告短，反應慢的 bot 會被拖垮，這正是要測的技巧差。

| 等級 | 可見資訊（不多於真人） | 時機誤差 σ | 疾兵誤差倍率 | 反應下限 | 漏按 | 點錯邊 | 急躁早點（提前 150–250 ms） |
|---|---|---|---|---|---|---|---|
| novice | 已出現的敵人、種類、重甲標記 | 75 ms | ×1.5 | 280 ms | 4% | 3% | 3% |
| intermediate | 同上 | 38 ms | ×1.25 | 200 ms | 1% | 0.8% | 0.8% |
| expert | 同上 | 16 ms | ×1.1 | 160 ms | 0.2% | 0.1% | 0% |

> 預告時間（≥ 600 ms）都比反應下限長，所以疾兵的難度用「誤差倍率」表現：預告越短，讀得越不準。

誤差、漏按、點錯邊全部用 `hash32(seed, salt, 音符 id)`，不用 `Math.random`。bot 只送真人也能送的輸入 byte。

## §10 公平檢查（GDD 03 精髓七條）

| # | 問題 | 本作答案 |
|---|---|---|
| E1 | 分數是否只來自玩家行為？ | 是。每一分都來自一次判定；不計存活、時間、血量 |
| E2 | 所有隨機都在 §3 且只依種子？ | 是。只有 `buildChart(seed)` 抽 RNG；段落表固定 |
| E3 | 視野是否固定？ | 720×1280 固定視窗；敵人從畫面邊緣出現的時間由 `APPROACH` 決定，不因螢幕比例改變 |
| E4 | 計分公式是否公開、結算可拆解？ | 標題頁寫公式與判定窗；結算逐項列出 |
| E5 | 天花板：高手比中手多拿分的行為是什麼？ | Perfect 率、不空揮、讀疾兵、無雙段的高密度；combo 封頂後仍靠 Perfect 拉開差距 |
| E6 | 付費是否完全不影響 sim？ | 只賣外觀（角色皮、刀光色、背景）；sim 不讀任何外觀資料 |
| E7 | 是否能用 `verify()` 重播驗分？ | 是。輸入 log + seed + version → 重播比對 score 與 stateHash；`meta.inputOffsetMs` 範圍 ±150 ms 由伺服器檢查 |

額外風控：`macroSuspicion`（最短點擊間隔 < 45 ms 或間隔 σ < 3 ms）、`errorSuspicion`（命中誤差 σ < 2.5 ms）只做標記，不直接作廢。

## §11 事件 → 演出

全部在 render / UI 層，由事件驅動；數值放 `fx/feel.js` 的 `FEEL`。**演出不得遮住敵人或攻擊範圍**（資訊公平）。

| 事件 | 演出（render 層） | FEEL 鍵 | LOW 模式 |
|---|---|---|---|
| `hit` Perfect | 敵人被擊飛（拋物線＋旋轉）、刀光、閃白、hit-stop 50 ms（只停 render）、粒子 | `hitStop.light`、`flash`、`particles` | 保留擊飛與判定字，拿掉 hit-stop、閃白、粒子 |
| `hit` Great / Good | 較輕的擊飛、判定字 | `popup` | 只留判定字 |
| `hit` 重甲最後一擊 | 震動、衝擊環（sprite 擴散環，不用 filter） | `shake.crit` | 不震動 |
| `whiff` | 空揮動作、主角變灰 250 ms（**長度必須等於 sim 的 STAGGER**）、「破綻」字樣 | `squash` | 保留變灰 |
| `locked` | 主角輕微抖動，提示「還在硬直」 | — | 無 |
| `hurt` | 紅暗角（CSS overlay）、血量格閃爍、小震動（≤ 4.2 px，參考 [15 §4.1](../../knowledge-base/15_reference-games.md) 護眼上限） | `hurt`、`shake.light` | 只留血量格閃爍 |
| `heal` | 血量格補回一格＋貓咪呼嚕音 | `popup` | 只留血量格 |
| `segment`（進入無雙段） | 頂部 Cut-In 橫幅 ≤ 1.0 s，**只占畫面上方 20%、不暫停 sim**；背景換色；打擊音改成高音版 | `ui` | 只留文字橫幅 |
| `death` | 慢動作 0.5 s（render）→ 結算 | — | 直接結算 |
| combo 10 / 25 / 50 | 側邊連斬印章（不擋中線） | `ui` | 只留數字 |

連擊越高的加速感（場景脈動、速度線、里程碑橫幅、分層 BGM、五聲音階命中音）見 [06_combo_feel.md](06_combo_feel.md)。

音效：Web Audio 合成（[14](../../knowledge-base/14_audio.md)）。BGM 用程序化打擊樂，**照譜面的拍長由音訊時鐘排程**（[14 §4](../../knowledge-base/14_audio.md)），0 bytes，且和敵人到點的時間天然對齊。

## §12 驗收測試

| 測試 | 門檻 |
|---|---|
| 同種子同輸入 → 同結果 | 相同 |
| golden match（固定種子 + expert bot 的 result） | 每個目標引擎相同 |
| 上傳後 `verify` 通過；竄改分數 / 版本不通過 | — |
| 譜面只依種子（換 bot，`chart` 逐筆相同） | 相同 |
| `buildChart` 間距規則（§3.1）對 1,000 個種子都成立 | 全過 |
| 理論最高分：全 Perfect 輸入的分數 == `maxScore(chart)` | 相等 |
| 硬直：空揮後 STAGGER tick 內的點擊不判定、不延長硬直 | — |
| 安全段漏接不扣血、其他段扣血；hp 0 後 phase = over | — |
| 連擊回血到 HP_MAX 為止 | — |
| `node tools/skill-dominance.mjs 30` | 技巧佔比 ≥ 70%、expert vs intermediate ≥ 70% |
| 另一組種子 `runDominance(GAME, BOTS, 60, 777)` | 同上 |
| 滿局重播耗時 | < 500 ms |

## 實測結果與調校紀錄（2026-10-19，bot 實測，尚無真人資料）

報告：[docs/skill_dominance_report.md](../docs/skill_dominance_report.md)。指令 `node tools/skill-dominance.mjs 30`，另兩組種子各 60 個。

| 版本 | 改了什麼 | 技巧佔比 | expert vs intermediate | novice / intermediate 平均存活 | 問題 |
|---|---|---|---|---|---|
| v1a | 初版：HP 5、硬直 300 ms、無回血、只有無雙段不扣血 | 90.3% | 100% | 11 s / 56 s | 新手 11 秒就死；中手分數 sd 9,866，分數主要由「死多早」決定 |
| v1b | + 每 20 連擊回 1 血 | 88.3% | 100% | 11 s / 69 s | 新手仍在 S1 就死 |
| v1c | + S1 改成暖身安全段 | 91.5% | 100% | 24 s / 76 s | |
| v1 | 回血改每 15 連擊、硬直改 250 ms | **94.8%**（種子組 777：91.9%、31337：94.0%） | **100%**（777：98.3%） | **24 s / 85 s** | 中手多半打完全場；新手撐到 S2 開始後幾秒 |
| **v2（現行，2026-10-21）** | 試玩回饋「難度有點高」：判定窗 45 / 85 / 135 ms、硬直 200 ms、HP 6、每 12 連擊回血、預告時間 +6～8 tick、疾兵比例下調、扣血後 0.5 s 保護期 | **98.2%**（777：98.5%、31337：98.0%） | **100%** | **33 s / 90 s** | 中手全部打完；新手多撐約 9 秒 |

v2 的技巧佔比反而上升：容錯放寬後中手不再中途倒下，分數差距回到「準不準」本身，而不是「死多早」。

各等級平均（v2，30 個種子）：expert 45,357 分（達成率 97.2%）、intermediate 36,341 分（77.9%）、novice 5,984 分（12.8%）。

**還要調的旋鈕**（等真人試玩資料）：

1. 新手一出暖身段就死（24 s）：要有練習模式，或在 S2 開頭再加一小段過渡。
2. `STAGGER` 與 `REGEN_COMBO`：bot 實測對技巧佔比影響不大（88–95%），主要影響「死多早」，要用真人手感決定。
3. 段落的 `beatTicks` 與樣式權重（難度曲線）、疾兵比例與 `APPROACH`。
4. 判定窗：最後才動，動了要同步改結算畫面。

---

## 給 AI 的生成提示詞

> 依 `TwinStrike/gdd/05_game_spec.md` 與 `.claude/skills/lite-skillgame-stack/SKILL.md`，從範本複製出 `TwinStrike/game/`，改寫 `src/sim/sim.js`（匯出 `GAME`，只 import `./core/index.js` 與 `./core/timing.js`）、`tools/bots.mjs`（§9 三級 bot）、`test/determinism.test.mjs`（§12，保留測試名稱）。不要修改 `src/sim/core/` 與 `test/core.test.mjs`。完成後跑 `npm test` 與 `node tools/skill-dominance.mjs 30`，未達門檻就回報哪一項、不要改門檻。最後更新 golden match 的值。
