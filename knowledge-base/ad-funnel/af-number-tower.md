# 數字塔吞噬（Number Tower / Numbers Dungeon：Hero Wars 地城廣告、Hero Tower War）

- **代號**：af-number-tower
- **類別**：4X / RPG 假玩法小遊戲（戰力比大小 + 吞噬成長）
- **代表作 / 廠商**：Hero Wars — Nexters（近年廣告主力為「數字地城」，Aftermath 2025-10 更新）；Hero Tower War – Merge Puzzle — Gamee（App Store，上線年未證實）；*Those Games* 的「Number Tower」（50 關）與 *Those Games 2* 的「Numbers Dungeon」（25 關）— Monkey Craft / D3 Publisher（2023-07 / 2024-07）
- **投放熱度依據**：
  - Aftermath（2024-01 撰，2025-10-27 更新）：作者觀察 Hero Wars 廣告已由早期機關謎題轉為「角色帶一個數字、吃掉比自己小的怪物數字」的地城廣告，並稱現在看到的主要就是這種（[Aftermath](https://aftermath.site/so-i-dont-totally-hate-those-hero-wars-ads.md)）。
  - SocialPeta 2025-06：Kingshot 曝光最高的實機素材被描述為「數字成長 + roguelike 混合」風格的塔防割草（[SocialPeta](https://socialpeta.com/en/blog/with-2000-ai-creatives-daily-century-games-kingshot-dominates-mobile-charts-in-the-us-japan-and-korea-in-june)）——數字成長視覺仍是 2025 主流元素。
  - SocialPeta 2026-04：Sword x Staff 一支「技能效果 / 戰力比較」素材 36 天約 40 萬曝光（[SocialPeta 2026-04](https://socialpeta.com/en/blog/top-mobile-game-ad-creatives-and-advertising-trends-in-april-2026)；是否屬數字塔格式未證實）。
  - **限制**：未取得此格式 2025–2026 的獨立投放量排名；台灣數據未取得（未證實）。熱度判定：中（長青格式，非新爆款）。
- **廣告真實度**：**假玩法 → 部分真實**。Aftermath 認為數字地城廣告「比早期謎題廣告更接近本體」但仍非實機；粉絲攻略稱 Hero Wars 廣告中的塔遊戲僅對少量玩家測試、不保證上線（[h-w.fun](https://h-w.fun/en/hero-wars-is-different-from-ads/?amp=1)）。
- **技巧 vs 選擇 vs 運氣**：純算術選擇（挑能吃的、依序吃到夠大再打 Boss），零操作技巧、零運氣。

## 一句話玩法

英雄頭頂一個數字，只能吃掉比自己小的怪物並吸收其數值，爬到塔頂打倒 Boss。

## 為什麼廣告有效（Hook）

| 元素 | 說明 |
|---|---|
| 前 3 秒畫面 | 一座分層塔，每格一隻怪，頭頂數字（12、35、8、120…）；英雄數字 10；右上 Boss 999。 |
| 失敗誘導（fail bait） | 示範者衝去打比自己大的怪 → 英雄被吃；或吃錯順序導致剩下的怪都比自己大（卡死）。Aftermath 指地城廣告常以「不幸遭遇」開場、規則還會無預警改變。 |
| 「我來一定行」的錯誤示範 | 比大小 + 加法，任何人都能算；觀眾覺得自己算得出最佳順序。 |
| 爽感 / 解壓點 | 數字滾動暴漲（10→22→57→…）；最後以壓倒性數字秒殺 Boss。Aftermath 作者形容像「舒壓的基礎數學課」。 |

## 遊戲規格

### 核心循環
1. 英雄值 H，塔有 F 層，每層若干格，格內為怪（值 m）或道具（×k、+n、−n、÷k）。
2. 英雄只能移動到「相鄰可達」格（同層或上下樓梯）。
3. 進入怪物格：若 H > m，H ← H + m（吞噬）；否則英雄死亡（失敗）。
4. 道具格直接套用運算。
5. 打倒頂層 Boss = 過關。

### 規則與勝負
- 比較嚴格大於（H > m）；相等 = 失敗（建議，原作未證實）。
- *Those Games* 版 Number Tower 的變體：每塔一種運算（+−×÷），目標是讓數字超過最後一座塔（[Wikipedia](https://en.wikipedia.org/wiki/Those_Games)）。
- 敗：碰到比自己大的；或所有可達格都比自己大（卡死）。

### 操作
- 點擊目標格；英雄自動走過去。

### 關卡結構與難度曲線
| 關卡段 | 新元素 | 難度槓桿 |
|---|---|---|
| 1–10 | 只有怪物，1–2 層 | 順序無關，吃小的就行 |
| 11–30 | ×2 / −n 道具、上鎖樓層 | **先吃小怪再拿 ×2** 才划算（順序開始重要） |
| 31–60 | 必須先吃的「鑰匙怪」、陷阱格 | 卡死陷阱：吃錯會讓剩下全部比你大 |
| 60+ | 多英雄合併、Boss 會成長 | 需要規劃完整路徑 |

### 計分 / 星等 / 獎勵
- 原作：過關給資源；星等以剩餘數值或步數（未證實）。

### 失敗與轉換點（廣告續命、IAP、導流到主遊戲的位置）
- 超休閒版（Hero Tower War）：第三方評論稱「重來看廣告、通關看廣告、解鎖皮膚看廣告」（[game-solver](https://game-solver.com/?p=780201)），App Store 有「去廣告」IAP。
- Hero Wars 版：廣告點進去是 idle RPG 抽英雄，與數字塔無直接關係（假玩法導流）。

## 可玩廣告（Playable Ad）結構

- 1 座 2 層塔、4–5 隻怪 + Boss，15–20 秒；第一步的最大誘惑是「看起來能打」但其實等於或略大的怪。
- 一失敗就 CTA；成功則顯示「Boss 9,999 戰力」的下一關挑逗畫面 + CTA。

## 技巧要素

| 技巧 | 影響 |
|---|---|
| 順序規劃（貪婪 vs 先拿倍率） | 原作唯一深度；屬確定性謎題，可被窮舉 |
| （原作無）操作 | — |

## 隨機 / 選擇噱頭

- 本質是「全資訊、確定性、有唯一或少數最優解」的謎題；一眼看穿後沒有再玩價值。
- 廣告中規則會「無預警改變」（Aftermath）——觀眾無法真正推理，是純噱頭。

## Skill Game 化改造（必做）

> 用這份規格書做遊戲時（含「復刻」），玩法規格 `gdd/05_game_spec.md` §13 要逐條回應下列每一條：採用就寫本作做法，不採用就寫理由與替代做法。「復刻」只復刻玩法結構與操作，不跳過本節（`RULE-AF-ADAPTATION`，`npm run audit` 檢查）。

1. **即時化（Numbers Dungeon → 動作版）**：怪物在格子間**移動**，數字隨時間**緩慢成長**（每秒 +1%，建議）；英雄可自由走位。吃小怪要搶在它長大前；大怪要避開路線 → 走位與時機技巧。
2. **風險換報酬**：「恰好比你大 1–10%」的怪可**用衝刺攻擊**（按住蓄力 0.6 s，命中時以 1.2 倍值結算，建議）→ 精準判斷與時機；失手則扣 30% 數值而非直接死亡（降低一擊定生死的挫折）。
3. **計分公式（建議）**：`Score = 最終數值的 log₂ × 100 + 吞噬次數 × 10 + Boss 擊倒剩餘時間 × 20`；用 log 避免指數爆炸讓分數失去可讀性。
4. **同種子**：塔佈局、怪物值、移動路徑表 = `rng(seed,"tower",i)`；雙方同一座塔，無局外戰力帶入。
5. **出題保證**：生成器用 BFS 驗證「存在可通關路線」，並計算理論最佳分作為 S 級門檻（結算顯示「你達到最佳的 87%」）。
6. **局長**：3 座塔 × 30 秒 ≈ 90 秒。

## HTML5 輕量實作規格

| 項目 | 規格 |
|---|---|
| 畫面 | 直版 720×1280；塔 5 層 × 4 格，每格 160×180 px；或動作版 12×20 格地城 |
| 實體與資料結構 | `cells[]{type,value:int32,pathTable}`；英雄 `{cell, value, chargeTicks}`；怪物值用 **整數**（超過 2³¹ 改用 log 表示或上限 1e9）；成長用整數千分比 |
| 關鍵參數 | 英雄移速 1 格 / 0.25 s；怪物成長 +1%/s（整數 `v += v*10/1000` 每 tick 累加器）；衝刺蓄力 36 tick；衝刺倍率 1.2 |
| 渲染 / Draw Call 估計 | 塔背景 1；角色 + 怪物 + 道具同 atlas 1；數字 BitmapText 1；UI 1 → **3–4 DC**。數字滾動用 GSAP tween 顯示值（只在 render 層），sim 值即時跳 |
| 美術資產清單 | 英雄 4 狀態、怪物 6 種（體型隨數值縮放 3 級）、Boss 1（Spine 或 4 幀）、道具圖示 4、塔層 tileset、數字 BitmapFont |
| 包體估計 | 程式 0.8 MB；atlas 0.4 MB；音效 0.2 MB；BGM 1.5 MB → **≈ 2.9 MB** |

## 主題與美術風格

- 原作：暗黑地城、性感女角被困、骷髏與惡魔（Hero Wars 常見）。
- 改造：換成「水族箱大魚吃小魚」「細胞吞噬」「雪球滾大」；避開美女被困、避開金色數字閃爍（拉霸感）。

## 可借用 / 要避開

- **可借用**：數字比大小的零門檻規則；log 化的成長爽感；生成器驗證可解 + 理論最佳分。
- **要避開**：靜態全資訊謎題直接拿來比賽（可窮舉）；廣告中規則前後不一（Aftermath 批評）；局外戰力帶入。

## 來源

- [Aftermath — So I don't totally hate those Hero Wars ads（2024-01-25，2025-10-27 更新）](https://aftermath.site/so-i-dont-totally-hate-those-hero-wars-ads.md)（存取日期 2026-10）
- [h-w.fun — Is Hero Wars like the ads?](https://h-w.fun/en/hero-wars-is-different-from-ads/?amp=1)（存取日期 2026-10）
- [Wikipedia — Those Games](https://en.wikipedia.org/wiki/Those_Games)（存取日期 2026-10）
- [App Store — Hero Tower War – Merge Puzzle](https://apps.apple.com/app/id1570840391)（存取日期 2026-10）
- [game-solver — Hero Tower War review](https://game-solver.com/?p=780201)（存取日期 2026-10）
- [SocialPeta — Kingshot 2,000 AI creatives daily（2025-06）](https://socialpeta.com/en/blog/with-2000-ai-creatives-daily-century-games-kingshot-dominates-mobile-charts-in-the-us-japan-and-korea-in-june)（存取日期 2026-10）
- [SocialPeta — Top Mobile Game Ad Creatives April 2026](https://socialpeta.com/en/blog/top-mobile-game-ad-creatives-and-advertising-trends-in-april-2026)（存取日期 2026-10）
