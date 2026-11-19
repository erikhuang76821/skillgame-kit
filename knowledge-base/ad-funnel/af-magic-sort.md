# 倒水分色（Magic Sort! / Water Sort；變體 Hexa Sort、Coin Sort）

- **代號**：af-magic-sort
- **類別**：解謎排序 → 容器分色（Water / Ball Sort；堆疊合併變體 Hexa / Coin Sort）
- **代表作 / 廠商**：Magic Sort! — Grand Games（伊斯坦堡，創辦人出自 Good Job Games 的 Zen Match 團隊）；Water Sort Puzzle、Ball Sort Puzzle（舊世代、低製作、廣告變現）；變體 Hexa Sort — Lion Studios / AppLovin（2023-07 Android、2023-11 iOS）；Coin Sort — Lion Studios
- **投放熱度依據**：
  - **Magic Sort**：2025-01 日收約 $80–100K（Gamigion，經搜尋摘要）、2025-03 約 $120K / 日，為 IAP 最高的排序遊戲（[Algoryte 2025-03-22](https://algoryte.substack.com/p/the-ultimate-sorting-game-face-off)）；某 30 天（文 2025-05-30）總收 $4.15M（IAP $3.3M、廣告 $1M）、DAU 478K，拿下排序前 10 名 43% 的 IAP、但只占其 DAU 的 3.4%（[Felix Braberg](https://felixbraberg.substack.com/p/the-monetization-engine-behind-magic)）。Grand Games 2025-01 完成 $30M A 輪（[Naavik](https://naavik.co/digest/why-peak-games-investors-backed-grand-games/)）。美國 App Store 評分 4.7（69.4 萬則）。
  - **Hexa Sort**：同一 30 天總收 $13.7M，但其中 $12.3M 是廣告、DAU 3.2M（Braberg）；Gamigion 記 2025 Q1 App Store 淨收 $9.5M、下載 8.7M；月流水一度近 $4M、2025 年中約 $1.25M（白鯨出海引點點數據，[Baijing](https://www.baijing.cn/article/53581)）。
  - **Coin Sort**：2025 Q3 混合休閒第 8（$5.4M / 4.8M 安裝），把水排序加上 2048 式合併與「發牌」按鈕（[AppMagic Q3](https://appmagic.rocks/blog/q3hybrid2025)）。
  - **子類趨勢**：排序是 2024 年成長最快的益智子類（YoY ×5.6），2026 年初被 Pixel Flow 推過 Blast 成為益智 IAP 第三大子類（[AppMagic](https://appmagic.rocks/blog/new-puzzle-order-sort-block-screw)）；鳳凰網引點點數據稱 2026 H1 排序解謎 IAP 收入同比 +335%（[ifeng 2026-10-15](https://hebei.ifeng.com/c/8xElKTEIz9z)，商業資訊稿）。
  - **台灣**：未取得台灣排名或投放數據（知識缺口）。
- **廣告真實度**：未取得 Magic Sort 素材逐支分析（未證實）；Naavik 記錄其投放管道為 AppLovin 與 Meta。舊世代水排序廣告常見「真實倒水畫面」，屬真實玩法（未證實）。
- **技巧 vs 選擇 vs 運氣**：完全資訊、無隨機的純邏輯謎題（隱藏層變體除外）；原作無時間壓力 → **純選擇**。Hexa / Coin Sort 的出貨有隨機成分。

## 一句話玩法

在瓶子之間倒色水，讓每瓶只剩單一顏色。

## 為什麼廣告有效（Hook）

| 元素 | 說明 |
|---|---|
| 前 3 秒畫面 | 一排玻璃瓶裝著分層的彩色液體，一倒就看到顏色疊起來；Magic Sort 用接近 Royal Match 等級的精緻魔法題材包裝（Naavik）。 |
| 失敗誘導（fail bait） | 示範者把顏色倒進唯一的空瓶，所有瓶子都卡住，無路可走。 |
| 「我來一定行」的錯誤示範 | 觀眾一眼看到「先把那瓶的藍色倒到另一瓶藍色上」。 |
| 爽感 / 解壓點 | 液體傾倒的流動、瓶子集滿單色時的完成閃光、整排排好的秩序感。 |

## 遊戲規格

### 核心循環
1. 點一瓶拿起 → 點另一瓶倒入。
2. 只能倒到「頂層同色」或「空瓶」，而且對方要有空間（App Store 描述）。
3. 倒出時，頂端連續同色的部分盡量全倒（以空間為限，水排序通則，未證實為 Magic Sort 細節）。
4. 所有瓶子都是單色滿瓶或空瓶 = 過關。

### 規則與勝負
- 瓶容量：品類通則為 4 層（Magic Sort 未明寫，未證實）。
- 典型配置：N 種顏色 + 2 個空瓶（通則，未證實）。
- 失敗：沒有任何合法移動（Magic Sort 會偵測「無解狀態」並跳出 +1 瓶販售，Braberg）。
- 工具：Undo、Shuffle（App Store 描述）；額外空瓶（Naavik）。
- 難度調節：第 26 關失敗後會拿掉一種顏色讓重試變簡單（Naavik）——即 DDA。

### 操作
- 兩次點擊（選來源、選目標）。

### 關卡結構與難度曲線
| 關卡段 | 新元素 | 難度槓桿 |
|---|---|---|
| 入門 | 3–4 色、2 空瓶 | 色數少 |
| 中期 | 6–10 色、關卡阻擋物（Naavik 提到 level blockers，細節未取得） | 色數、空瓶數、初始混亂度 |
| 後期 | 隱藏層（問號）、更多瓶（未證實） | 搜尋深度 |
| 每日 | 每日謎題 + 每週 / 國家 / 全球排行（Naavik） | — |

### 計分 / 星等 / 獎勵
- 過關給金幣；每日挑戰追蹤器；約每兩個月一個新 LiveOps 活動（Naavik）。

### 失敗與轉換點（廣告續命、IAP、導流到主遊戲的位置）
- **+1 Bottle**：卡死當下跳出、用金幣買（金幣可賺可買）→ Braberg 認為這是在玩家「最願意付錢」的時刻收費。
- 「為了保住連勝而付費續關」是 IAP 最大來源（Naavik）。
- IAP（美國 App Store）：Starter Bundle $0.99、1000 Coins $1.99、Apprentice Bundle $4.99、Endless Portal $5.99、5000 Coins $7.99、Magician Bundle $9.99、10000 Coins $14.99、Sorcerer Bundle $19.99。
- 變現口徑分歧：AppMagic 稱 Magic Sort 為純 IAP、歸類 Casual 而非 Hybridcasual；Braberg 估其 30 天有 $1M 廣告收入。兩者矛盾，未證實。
- 對照：Hexa Sort 約 90% 收入來自廣告（Braberg 30 天口徑）。

## 可玩廣告（Playable Ad）結構

- 推測（未證實）：0–2 秒 4 瓶 3 色 + 手指提示 → 2–3 次正確倒水 → 第 4 步只剩一個陷阱選項 → 卡死畫面 → CTA。

## 技巧要素

| 技巧 | 影響 |
|---|---|
| 空瓶管理 | 主技巧：空瓶是唯一的「暫存區」 |
| 前瞻搜尋 | 看 3–5 步之後的狀態 |
| 移動效率 | 原作不計步，不影響成績 |
| 速度 | 原作不計時，不影響成績 |

## 隨機 / 選擇噱頭

- Water Sort 本體零隨機，但原作有 DDA（失敗後減色）→ 每個玩家其實玩的不是同一題。
- Hexa Sort / Coin Sort 的「發新堆」有隨機（Coin Sort 的 deal 按鈕發隨機硬幣組，AppMagic），運氣影響較大。

## Skill Game 化改造（必做）

> 用這份規格書做遊戲時（含「復刻」），玩法規格 `gdd/05_game_spec.md` §13 要逐條回應下列每一條：採用就寫本作做法，不採用就寫理由與替代做法。「復刻」只復刻玩法結構與操作，不跳過本節（`RULE-AF-ADAPTATION`，`npm run audit` 檢查）。

1. **把純選擇變成「速度 + 效率」**：同一題大家都解得出來，比的是**多快、多少步**。
2. **同種子**：關卡由種子程序生成：從「已排好」狀態做 K 步合法反向打亂（`rng(seed,"shuffle")`），保證有解；生成後以 BFS / A* 求最短步數 `par`（4 瓶容量、≤ 12 瓶時可行；超出則用 beam search 近似並標記）。
3. **計分公式**（建議，每題）：
   - 完成：+500
   - 步數效率：`300 × par / max(par, moves)`
   - 速度：剩餘秒數 × 10（每題 40 秒）
   - Undo：每次 −15（不禁止，但有成本）
   - 未完成：每個完成的單色瓶 +60
4. **局制**：一局 5 題、色數 4 → 8 遞增，約 3 分鐘；非同步同種子排行。
5. **移除付費影響**：無 +1 瓶、無 Shuffle、無 DDA；所有人同題同條件。
6. **變體（Hexa Sort 風）**：若做堆疊合併版，發堆序列必須同種子且預告下 2 堆，否則運氣過高。

## HTML5 輕量實作規格

| 項目 | 規格 |
|---|---|
| 畫面 | 直版 720×1280；瓶子 2 排 × 最多 7 瓶，每瓶 80×260 px |
| 實體與資料結構 | `tubes: Uint8Array(T*CAP)`（每瓶 CAP=4 層，0 空、1–12 色）；`top[T]`；`pour(a,b)` 純函式回傳新狀態與倒出量；`par` 與種子一同存於題目；`history[]` 供 Undo；`events[]`（pick / pour(n) / tubeDone / solved） |
| 關鍵參數 | 容量 4；空瓶 2；色數 4–8；每題 40 s；倒水動畫 350 ms（sim 立即結算，動畫期間仍可輸入下一步，以佇列處理） |
| 渲染 / Draw Call 估計 | 瓶身、液體色塊（灰階 tint 矩形）、瓶口高光共用 1 atlas：1 DC；倒水流柱用同 atlas 細長 sprite 拉伸；分數 BitmapText 1 DC → **約 2 DC**；液面波動用頂點位移或 2 幀 sprite，不用 filter |
| 美術資產清單 | 瓶身（前 / 後兩層，夾住液體）、液體塊 1（tint）、液面頂 1、流柱 1、完成星光 1、背景 1 |
| 包體估計 | 程式 0.8 MB（含求解器 < 10 KB）；atlas 0.12 MB；題目全程序生成、不需關卡檔；音效 0.2 MB；BGM 1.5 MB → **≈ 2.6 MB** |

## 主題與美術風格

- 原作：魔法藥水、煉金鍋（Magic Sort 用「攪拌大釜」包裝道具）、精緻 3D 渲染（安裝包 600 MB 級，我們不可能也不需要）。
- 改造：手搖飲料分層、顏料試管、沙畫瓶；台灣在地可做「珍奶分層」。避免酒類（法規與年齡分級）。

## 可借用 / 要避開

- **可借用**：零學習成本的倒水規則；反向打亂保證有解的程序生成（零關卡檔）；求解器算 par 做效率分。
- **要避開**：DDA（失敗後減色）——破壞同題公平；卡死當下賣 +1 瓶；隱藏層造成資訊不對等；Hexa 式隨機發堆。

## 來源

- [Naavik — Why Peak Games investors backed Grand Games（2025-01-19）](https://naavik.co/digest/why-peak-games-investors-backed-grand-games/)（存取日期 2026-10）
- [Felix Braberg — The monetization engine behind Magic Sort（2025-05-30）](https://felixbraberg.substack.com/p/the-monetization-engine-behind-magic)（存取日期 2026-10）
- [Algoryte — The ultimate sorting game face-off（2025-03-22）](https://algoryte.substack.com/p/the-ultimate-sorting-game-face-off)（存取日期 2026-10）
- [App Store — Magic Sort!](https://apps.apple.com/us/app/magic-sort/id6499209744)（存取日期 2026-10）
- [Gamigion — Magic Sort](https://www.gamigion.com/magic/)（存取日期 2026-10）
- [Gamigion — 2025 Hybridcasual Market Overview](https://www.gamigion.com/2025-hybridcasual-market-overview-with-real-data/)（存取日期 2026-10）
- [白鯨出海 — Lion Studios / Hexa Sort（2025-08-01）](https://www.baijing.cn/article/53581)（存取日期 2026-10）
- [AppMagic — Top 10 Hybridcasual Games in Q3 2025](https://appmagic.rocks/blog/q3hybrid2025)（存取日期 2026-10）
- [AppMagic — New Puzzle Order: Sort, Block, Screw](https://appmagic.rocks/blog/new-puzzle-order-sort-block-screw)（存取日期 2026-10）
- [鳳凰網 — 2026 年海外混合休閒品類機會（2026-10-15）](https://hebei.ifeng.com/c/8xElKTEIz9z)（存取日期 2026-10）
- [mobilegamer.biz — Hexa Sort creators Cheer Games raise $4.5m](https://mobilegamer.biz/hexa-sort-creators-cheer-games-raise-4-5m/)（存取日期 2026-10）
