# 經典貪食蛇（Classic Snake：Nokia Snake / Google Snake）

- **代號**：genre-snake-classic
- **市場**：台灣＋北美
- **形態**：單人分數挑戰（手機內建 / 瀏覽器小遊戲 / 搜尋引擎彩蛋）；可改造為同種子非同步錦標賽
- **代表產品 / 廠商**：Snake — Nokia（Taneli Armanto 移植設計，1997 首見於 Nokia 6110）；Google Snake — Google（搜尋「snake」即可玩，另有 2025 蛇年 Doodle 版）
- **熱度依據**：
  - **北美**：Google 在 2025-01-29 推出農曆蛇年互動 Doodle 版貪食蛇（可自訂蛇與食物外觀、每日挑戰）；2024-08 英國 Yahoo 新聞專文介紹 Google Snake「每日挑戰」難度。Nokia Snake 隨 3.5–4 億支手機出貨（各來源數字不一），為北美 30–45 歲族群共同記憶。屬「常青、零行銷成本」的品類，但無 2024–2026 單獨營收數據（未證實）。
  - **台灣**：無直接排行或下載數據（未證實）。間接依據：Nokia 3310/6110 世代的懷舊記憶；2025 為農曆蛇年，Google 蛇年 Doodle 全球（含台灣）上線；台灣 App Store 上「貪食蛇」關鍵字頭部是多人 io 版（見 [genre-snake-io.md](genre-snake-io.md)），單人經典版沒有頭部商業產品。
- **技巧 vs 運氣**：技巧主導；唯一隨機是食物出現位置，固定種子後即為純技巧（路徑規劃＋反應）

## 一句話玩法

方格上持續前進的蛇，吃到食物就變長，撞牆或撞自己即結束。

## 規則書

### 勝負條件
- 單人：撞到邊牆（若該模式有牆）或撞到自己身體即結束，以分數 / 長度 / 用時排名。
- 「完美局」：蛇身填滿整個棋盤（Google Snake 社群以此作為最終目標，正式定義未證實）。

### 單局流程
1. 蛇以固定長度（通常 3–4 格，未證實）從棋盤中央附近出發，自動朝一個方向前進。
2. 每一個 tick 前進一格；玩家只能改變方向（不能反向 180°）。
3. 吃到食物：身體 +1 格（部分版本 +多格，未證實），得分；新食物在空格處隨機生成。
4. Nokia 版：等級 1–9 決定速度（等級越高越快）；Google 版：遊戲開始前選速度與棋盤大小，局中速度固定（未證實）。
5. 撞牆（或有牆模式下的障礙）或咬到自己 → 遊戲結束。

### 計分規則
| 項目 | 分數 / 條件 |
|---|---|
| Nokia Snake（Microsoft/Nokia 官方部落格說法） | 得分 ≈ 畫面上方塊數 × 等級，再加過關 100 分獎勵；等級 1 最高 312 分、等級 9 最高 2,008 分（公式描述原文較含糊，換算細節未證實） |
| Google Snake 每顆蘋果 | +1 分（官方未公開，社群普遍以「吃到幾顆」為分數，未證實） |
| Google Snake 速度選項 | 慢 / 普通 / 快（三段） |
| Google Snake 棋盤 | 小 / 標準 / 大；粉絲站稱為 10×9 / 17×15 / 24×21（未證實） |
| Google Snake 同時存在蘋果數 | 1、3、5 顆，另有骰子、炸彈、計數等變體（第三方說法，未證實） |
| Google Snake 模式（部分） | 經典、穿牆傳送門（Portal）、牆壁逐步生成（Walls）、依序吃（Sequence）、每日挑戰等 |

### 操作
- 方向鍵 / WASD（桌機）、滑動（手機）。每個 tick 只處理一次轉向；連按兩次可能被吃掉（輸入緩衝規則依版本而異，未證實）。

### 公平機制（同種子、同牌序、配對、防作弊）
- 原版無競技機制，只有本機最高分。
- **同種子競技版設計**：
  1. 固定棋盤大小 × 速度 × 蘋果數為一個「賽制」，不同賽制分開排行（第三方指南也指出不同設定的分數不能直接比較）。
  2. 食物生成用 seed：`next_food = PRNG(seed, 吃到的第 n 顆)` 從剩餘空格中挑；所有參賽者在同樣條件下拿到同樣序列（注意：空格集合依玩家路徑不同，所以要用「第 n 顆食物 → 候選格排序 → 取第一個空格」這類確定規則）。
  3. 計分：`分數 = 吃到數 × 100 + 存活秒數獎勵（上限）`，或比「填滿棋盤用時」。
  4. 防作弊：伺服器重播輸入序列（每 tick 一個方向），重算分數；超出理論上限（棋盤格數）即判異常。

## 技巧要素

| 技巧 | 影響 |
|---|---|
| 路徑規劃（之字形 / 漢米爾頓迴路） | 後期蛇身長，必須預留回頭空間；完美局需要近乎漢米爾頓路徑 |
| 反應與輸入時機 | 快速設定下每格只有幾十毫秒 |
| 風險取捨（捷徑 vs 安全繞路） | 捷徑省時但可能把自己封死 |
| 模式專屬技巧 | Portal 需記住出入口、Walls 需預判可用空間縮小 |

## 隨機 / 運氣來源

- 食物生成位置（固定 seed 可消除）。
- Google 骰子 / 炸彈等變體蘋果帶入額外隨機（競技版應排除或固定）。

## 參賽與變現

- 原版免費、無變現（手機內建 / 搜尋彩蛋）。
- 商業化可行路徑：每日挑戰（同 seed、全服排行）、季票外觀（蛇皮、食物皮）、廣告換復活（競技模式需禁用）。

## 主題與美術風格

- Nokia 單色 LCD 像素（綠底黑點）＝最強懷舊識別。
- Google 版：圓角扁平、明亮蘋果、藍綠棋盤格；蛇年 Doodle 加入節慶外觀。
- 台灣：2025 蛇年、農曆新年紅金配色可用，但避免「紅金＋金幣」博弈視覺（見 themes/tw-themes.md）。

## 可借用的設計點

- 「速度 × 棋盤 × 食物數」三軸賽制：用少量參數生出大量可分開排行的賽道。
- 每日挑戰小棋盤＋障礙：每天一個固定 seed 謎題，天然適合全服同題。
- 完美局（填滿）作為頂級目標，給高手明確的天花板。
- 輸入可重播＝伺服器可驗證，成本極低。

## 法規 / 風險備註

- 「Snake」玩法本身無專利問題，但 Nokia / Google 的名稱、圖示不能使用。
- 若加入現金或兌換獎勵，須依北美各州技巧遊戲規定與台灣相關法規另行評估。

## 來源

- [Snake charmed: 10 fascinating facts about the world's most popular game — Windows Blog (2012)](https://blogs.windows.com/devices/2012/02/02/snake-charmed-10-fascinating-facts-about-the-worlds-most-popular-game/)（存取日期 2026-10）
- [History of Nokia part 2: Snake — Windows Blog (2009)](https://blogs.windows.com/devices/2009/01/20/history-of-nokia-part-2-snake/)（存取日期 2026-10）
- [Finnish mobile game industry part 1 — PocketGamer.biz](https://www.pocketgamer.biz/feature/61825/finnish-mobile-game-industry-part-1/)（存取日期 2026-10）
- [Google marks Lunar New Year with playable Snake Game — ABS-CBN (2025-01)](https://www.abs-cbn.com/news/technology/2025/1/28/google-marks-lunar-new-year-with-playable-snake-game-2111)（存取日期 2026-10）
- [Google's Snake game has a daily challenge that's deceptively tough — Yahoo UK (2024-08)](https://uk.news.yahoo.com/googles-snake-game-daily-challenge-170139115.html)（存取日期 2026-10）
- [How to Play the Google Snake Game — snakegame.net（粉絲站，棋盤尺寸來源）](https://www.snakegame.net/how-to-play-google-snake)（存取日期 2026-10）
- [Google Snake : dominez le jeu du serpent — Next Stage (2026-05)](https://www.next-stage.fr/2026/05/google-snake-dominez-jeu-serpent.html)（存取日期 2026-10）
