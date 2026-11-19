# 方塊擺放消行（Block Blast!）

- **代號**：af-block-blast
- **類別**：解謎排序 → 方塊擺放（Block Puzzle，無盡高分制 + 關卡制）
- **代表作 / 廠商**：Block Blast! — Hungry Studio（2022-04-03 上線，公司 2021 年成立；Udonis 整理）。同類：Woodoku、Block Jam 3D（後者已轉成「板面 + 有限暫存區」的 sort 混種）
- **投放熱度依據**：
  - **全球下載**：AppMagic 估 2025 年 368M 次下載，全球手遊第 1，領先第 2 名 Roblox 7,000 萬以上（[mobilegamer.biz](https://mobilegamer.biz/the-top-mobile-game-downloads-of-2025/)）；PocketGamer.biz 以截至 2025-12-22 的 AppMagic 資料算為 356.2M，同樣第 1（[PocketGamer.biz](https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025)）。Udonis 引 AppMagic：2023 年 138M、2024 年 240M、2025 年 363M，2024、2025 連兩年全球下載第 1（[Udonis](https://www.blog.udonis.co/statistics/block-blast)）。
  - **北美**：Apple 公布 2025 美國 Top Free iPhone Games 第 1、iPad 第 2（[GamesBeat](https://gamesbeat.com/apple-unveils-most-downloaded-games-and-apps-of-2025/)）。
  - **台灣**：2023 年 App Store 台灣 iPhone 熱門免費遊戲第 1（[MrMad](https://mrmad.com.tw/?p=140621)）；App Store 台灣「2025 免費遊戲排行」頁（iPad 版頁面）列第 3（[App Store TW](https://apps.apple.com/tw/ipad/room/6756372270)）。但據蘋果仁轉述的 2025 台灣 iPhone 免費遊戲前 10 名單並無 Block Blast!（原文 403 無法直接存取，僅經搜尋摘要得知，未證實）。
  - **廣告活躍度**：SocialPeta × Reforged Labs 2025 年報把它列為 iOS 素材活躍度前 3 名（[GameDevReports](https://gamedevreports.substack.com/p/socialpeta-and-reforged-labs-mobile)）。
  - **變現規模**：幾乎全靠廣告。Udonis 整理：IAP 終身約 $66K、2025 年不到 $10K；廣告收入估約每日 $584K（月約 $17.5M），2025 黑五單日約 $1.8M（第三方估算，未證實）。另有轉述 Sensor Tower 稱 2026-01～05 廣告收入約 $127M、為該期間廣告收入最高手遊（二手轉述，未證實）。
  - **2026 動態**：2026 年 5 月全球下載被 Arrows – Puzzle Escape 超越，退居第 2（Sensor Tower，[mobilegamer.biz](https://mobilegamer.biz/data-digest-pixel-flow-hits-100m-mays-top-games-neverness-to-everness-pokemon-go-more/)）。
- **廣告真實度**：**部分真實**。素材中有真實盤面（塞滿的盤面 + 一條空隙、分數跳動、Combo 字樣），但大量素材用與玩法無關的開場：龍捲風片段、實體方塊燈、調顏料、「只有 1% 的人能清空盤面」挑戰字卡、假「新版本無廣告」對話框、甚至拿 Fortnite 做比較（[Insightrackr](https://blog.insightrackr.com/en/docs/Block-Blast-Intelligence)、[AdMapix 2026-09](https://www.admapix.com/blog/ad-intelligence/block-blast-ad-strategy-2026)）。
- **技巧 vs 選擇 vs 運氣**：擺放規劃是真技巧，但出塊隨機且原作疑似有動態難度（DDA），**運氣占比高**；無盡模式的高分很大一部分取決於出塊序列。

## 一句話玩法

把三塊不可旋轉的形狀拖進 8×8 盤面，填滿整行或整列就消除，放不下就結束。

## 為什麼廣告有效（Hook）

| 元素 | 說明 |
|---|---|
| 前 3 秒畫面 | 幾乎全滿的彩色盤面，只剩一條 1 格寬的縫；或非遊戲畫面（龍捲風、實體方塊燈）製造好奇，再切真實盤面（Insightrackr、AdMapix）。 |
| 失敗誘導（fail bait） | 「只有 1% 的人清得掉」挑戰字卡；盤面擠到只差一塊、示範者遲遲不放對位置。素材分析未直接記錄到「示範者輸掉」的鏡頭（AdMapix 明言沒看到失敗畫面），屬推測。 |
| 「我來一定行」的錯誤示範 | 觀眾一眼看到「那條長條放進縫裡就能同時消 2–3 行」，產生搶手指衝動。 |
| 爽感 / 解壓點 | 多行同時消除的連鎖光效、Combo 字樣與數字飆升、震動與觸覺回饋（Raijinn 拆解提到讚美字串、畫面震動、haptics、粒子）。 |

## 遊戲規格

### 核心循環
1. 盤面 8×8 空格；下方托盤一次發 3 塊。
2. 拖曳任一塊到盤面合法位置（全部格子都要空）。
3. 放下後檢查所有滿行、滿列，同時消除。
4. 三塊都放完才發下一組 3 塊。
5. 托盤剩下的塊沒有任何一塊放得下 → 結束（經典模式）。

### 規則與勝負
- 盤面 8×8；托盤 3 塊；形狀約 30 種：1×1 到 3×3 方塊、直條、L、T、角形等（[Raijinn Studio](https://raijinnstudio.com/blog/how-to-develop-game-like-block-blast)）。
- 不能旋轉（拆解文未明寫，未證實；實際體驗普遍如此）。
- 行與列可同時消除。
- 經典模式：沒有勝利，只有高分；冒險模式（Adventure）：同一引擎的目標關卡（目標細節未取得，未證實）；另有每日挑戰盤面與季節活動。

### 操作
- 單指拖曳；放手時吸附到最近格位，合法則落下，不合法則彈回托盤。
- 拖曳中顯示落點預覽（陰影），以及「會消掉哪幾行」的高亮。

### 關卡結構與難度曲線
| 關卡段 | 新元素 | 難度槓桿 |
|---|---|---|
| 經典模式開局 | 只有基本形狀 | 盤面空、塊小 → 很快進入連消節奏 |
| 經典中盤 | 3×3、長條 1×5 變多（未證實） | 出塊序列難度；疑似 DDA 依玩家狀態調整（Two & a Half Gamers 談到 DDA 與大量 A/B 測試，細節未公開） |
| 冒險模式 | 目標（收集特定色塊 / 分數門檻，未證實） | 起始盤面預填、目標數量 |

### 計分 / 星等 / 獎勵
- 每放 1 格得分；多行同消有倍率；連續幾次放置都有消行 → streak 加成（Raijinn 拆解，具體數值未公開）。
- 廣告畫面見過「Combo 66」與分數由 3315 跳到 3615（AdMapix 關鍵影格）。

### 失敗與轉換點（廣告續命、IAP、導流到主遊戲的位置）
- 收入幾乎全來自插頁廣告（局與局之間）與少量 rewarded 廣告；IAP 可忽略（Udonis、Raijinn）。
- 續命機制：拆解文沒寫有付費續命（未證實）。
- 留存：AppMagic 估 D1 26.1%、D7 4.1%、D30 1.1%；平均單次 12 分鐘、每日 2.7 次（Udonis 轉述）。→ **極低留存、極高量**，是純廣告變現的大水漫灌模型。

## 可玩廣告（Playable Ad）結構

- 開場 0–2 秒：塞滿的盤面 + 一條縫 + 手指提示。
- 互動 1–3 步：托盤給一塊「剛好卡進縫」的長條 → 同時消 2–3 行 → 大字讚美 + 分數飆升。
- 第 2 組刻意給難放的塊，讓玩家卡住或盤面變危險 → CTA 跳出。
- 素材格式比：影片約 78%、圖片約 16%、可玩約 7%（Insightrackr）；投放網路以 AppLovin、Unity、AdMob 為大宗。

## 技巧要素

| 技巧 | 影響 |
|---|---|
| 預留空間（給 3×3、1×5 留位） | 決定能活多久，是最主要的技巧 |
| 三塊的放置順序 | 先放哪塊會改變後兩塊能不能放；同組內的排列組合規劃 |
| 製造多行同消 | 決定分數上限（倍率 + streak） |
| 讀盤速度 | 原作不限時，速度不影響分數 |

## 隨機 / 選擇噱頭

- 出塊完全隨機（玩家看不到下一組），加上疑似 DDA → 同樣技術水準的兩局差距很大。
- 「只有 1% 能清空」是行銷話術，不是實際統計。

## Skill Game 化改造（必做）

> 用這份規格書做遊戲時（含「復刻」），玩法規格 `gdd/05_game_spec.md` §13 要逐條回應下列每一條：採用就寫本作做法，不採用就寫理由與替代做法。「復刻」只復刻玩法結構與操作，不跳過本節（`RULE-AF-ADAPTATION`，`npm run audit` 檢查）。

1. **同種子出塊**：`rng(seed,"tray",n)` 產生第 n 組 3 塊；所有玩家同序列。移除 DDA。
2. **資訊對等 + 提高技巧天花板**：托盤旁顯示「下一組 3 塊」預覽；可加 1 格 Hold（每組最多換 1 次）。
3. **固定局長**：一局固定發 20 組（60 塊）或 120 秒，取先到者；盤面放不下 = 提前結束，剩餘塊不計分。這樣「活下去」和「消得漂亮」都有分。
4. **計分公式**（建議）：
   - 放置：每格 +1
   - 同次消 k 條（行 + 列合計）：`+10 × k × (k + 1) / 2`（1 條 10、2 條 30、3 條 60、4 條 100）
   - streak：連續 s 次放置都有消除，該次消行分 × `(1 + 0.25 × min(s, 8))`
   - 清空全盤：+300
   - 局末未用時間：若 60 塊提前放完，剩餘秒數 × 2
5. **移除付費影響**：不賣續命、不賣「換一組」、不賣 Hold；外觀（方塊皮）只賣外觀。
6. **對戰形式**：非同步同種子排行（每日一種子）或 1v1 同種子比分；60–120 秒一局。
7. **技巧主導驗證**：bot 三級（隨機合法放置 / 貪婪最大消行 / 2 層搜尋考慮下一組），30 種子以上跑 `skill-dominance`，目標高手 vs 中手同種子勝率 ≥ 70%。

## HTML5 輕量實作規格

| 項目 | 規格 |
|---|---|
| 畫面 | 直版 9:16，邏輯解析度 720×1280；盤面 8×8，每格 80 px → 640×640，置中偏上；托盤區 3 格各 200×200 |
| 實體與資料結構 | `board: Uint8Array(64)`（0 空、1–7 色）；滿行偵測用 `rowMask[8]`、`colMask[8]`（各 8-bit）；`PIECES[]`：每種形狀存成相對座標陣列 + 8×8 bitmask 預算；`tray[3]{pieceId, color, used}`；`rngState`；事件串 `events[]`（place / clear(k) / streak / gameover）給渲染層 |
| 關鍵參數 | 托盤 3 塊、局長 20 組或 120 s、Hold 1 格、streak 上限 8、消行動畫 250 ms（不阻擋輸入，分數在 sim 立即結算） |
| 渲染 / Draw Call 估計 | 格子方塊 + 托盤塊 + 預覽陰影 共用 1 張 atlas → 1 DC；消行碎塊用 sprite 池（同 atlas，不另開）；分數 BitmapText 1 DC；UI 用 HTML/CSS → **約 2–3 DC**；不用 filter，光暈用預烘 sprite |
| 美術資產清單 | 方塊 7 色 × 1（帶高光邊）、空格底、盤面框、預覽陰影、碎塊 4 片、讚美字卡 4 張（Good / Great / Excellent / Unbelievable 自訂文字）、背景 1 |
| 包體估計 | 程式（Pixi 8 + GSAP + sim）≈ 0.8 MB；atlas 0.2 MB；音效 0.2 MB；BGM 1.5 MB → **≈ 2.7 MB** |

## 主題與美術風格

- 原作：木紋 / 糖果色方塊、淡色背景，畫面極簡；消除時強烈閃光與字卡。
- 改造建議：寶石 / 積木 / 像素地磚皆可；**避免 Tetris 名稱與方塊配色的直接聯想**（Raijinn 指出 Hungry Studio 素材常拿 Tetris 比較，屬商標風險）。

## 可借用 / 要避開

- **可借用**：8×8 + 3 塊托盤的極簡規則（零教學成本）；多行同消的倍率爽感；「盤面塞滿 + 一條縫」作為我們自家導流素材的開場（真實玩法，不違反廣告真實性）。
- **要避開**：隨機出塊 + DDA（直接破壞公平）；與玩法無關的開場（龍捲風、假「無廣告新版本」對話框）；拿其他遊戲品牌做比較（Fortnite、Tetris）；把極低留存的純廣告模型當成我們的變現範本。

## 來源

- [mobilegamer.biz — 2025's top mobile game downloads](https://mobilegamer.biz/the-top-mobile-game-downloads-of-2025/)（存取日期 2026-10）
- [PocketGamer.biz — The most downloaded mobile games of 2025](https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025)（存取日期 2026-10）
- [Udonis — Block Blast Revenue, Downloads & User Statistics（2026-06-09）](https://www.blog.udonis.co/statistics/block-blast)（存取日期 2026-10）
- [GamesBeat — Apple unveils most downloaded games and apps of 2025](https://gamesbeat.com/apple-unveils-most-downloaded-games-and-apps-of-2025/)（存取日期 2026-10）
- [App Store 台灣 — 2025 免費遊戲排行](https://apps.apple.com/tw/ipad/room/6756372270)（存取日期 2026-10）
- [MrMad — 2023 App Store 台灣熱門遊戲排行](https://mrmad.com.tw/?p=140621)（存取日期 2026-10）
- [蘋果仁 — 2025 台灣 App 與遊戲排行](https://applealmond.com/posts/299597)（403，僅經搜尋摘要；存取日期 2026-10）
- [GameDevReports — SocialPeta × Reforged Labs 2025 creative trends（2026-01-02）](https://gamedevreports.substack.com/p/socialpeta-and-reforged-labs-mobile)（存取日期 2026-10）
- [Insightrackr — Block Blast Intelligence](https://blog.insightrackr.com/en/docs/Block-Blast-Intelligence)（存取日期 2026-10）
- [AdMapix — Block Blast ad strategy 2026](https://www.admapix.com/blog/ad-intelligence/block-blast-ad-strategy-2026)（存取日期 2026-10）
- [Raijinn Studio — How to develop a game like Block Blast](https://raijinnstudio.com/blog/how-to-develop-game-like-block-blast)（存取日期 2026-10）
- [Two & a Half Gamers — Block Blast Review（2025-01-20）](https://felixbraberg.substack.com/p/block-blast-review-what-is-behind-b38)（存取日期 2026-10）
- [mobilegamer.biz — Data digest: Pixel Flow hits $100m, May's top games](https://mobilegamer.biz/data-digest-pixel-flow-hits-100m-mays-top-games-neverness-to-everness-pokemon-go-more/)（存取日期 2026-10）
