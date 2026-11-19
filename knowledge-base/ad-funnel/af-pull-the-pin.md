# 拉針救援（Pull the Pin：Hero Wars / Homescapes / Royal Match「Save the King」）

- **代號**：af-pull-the-pin
- **類別**：假玩法小遊戲 → 已內建化的救援解謎（物理流體 + 順序判斷）
- **代表作 / 廠商**：Hero Wars — Nexters（2019 年起把拉針類謎題放進遊戲，YouTuber Hero Wars Central 說法）；Evony — Top Games（2019 導入，PocketGamer.biz）；Homescapes / Gardenscapes — Playrix；Lily's Garden — Tactile（2023 年後加入）；Angry Birds Dream Blast — Rovio；Pull The Pin — Popcore（獨立超休閒作）；救援變體：Royal Match「Save the King / King's Nightmare」— Dream Games
- **投放熱度依據**：
  - PocketGamer.biz 2025-01-03 專欄（Matej Lančarič）：拉針從 Hero Wars 廣告起家，Hero Wars、Evony 至今仍在用，並稱此類廣告讓 CPI「大幅下降」（無數字佐證）（[PocketGamer.biz](http://www.pocketgamer.biz/the-evolution-of-pull-the-pin-why-is-this-a-good-thing-for-the-games-industry/)）。
  - SocialPeta × Reforged Labs（資料 2024-01～2025-10，發表 2026-01-02）：小遊戲素材「仍是點擊率最高的素材形式」；Royal Match 累計 99.4K 支素材、85.2% 影片，「Save the King」系列幾乎都以失敗收尾（[GameDevReports](https://gamedevreports.substack.com/p/socialpeta-and-reforged-labs-mobile)）。
  - 台灣：未取得台灣市場此格式獨立投放數；SocialPeta 同報告指港澳台每位廣告主每月素材數 117，與北美並列最高（市場競爭強度，非此格式專屬）。
- **廣告真實度**：從**假玩法**演變為**部分真實**。2020 年英國 ASA 禁 Playrix 兩支拉針廣告：Playrix 承認只有約 0.03% 用戶到得了含小遊戲的關卡（[Marketing-Interactive 2020-10-14](https://www.marketing-interactive.com/popular-mobile-games-gardenscapes-and-homescapes-called-out-for-misrepresentation-of-game-in-ads)）；之後 Playrix 把拉針關移到前期（Lancaric 2025-11）。Hero Wars 本體有拉針但非核心（粉絲攻略 [h-w.fun](https://h-w.fun/en/hero-wars-is-different-from-ads/?amp=1)）。Royal Match 有「King's Nightmare」特殊關，稀有出現（粉絲部落格 [oldcynic](https://oldcynic.com/royal-match-save-the-king-levels-kings-nightmare)）。
- **技巧 vs 選擇 vs 運氣**：純「順序選擇」的確定性謎題，零運氣、零操作技巧；一關一解，看過就會。

## 一句話玩法

依正確順序拔掉插銷，讓水澆熄岩漿、讓寶物落到英雄身邊而不落到怪物頭上。

## 為什麼廣告有效（Hook）

| 元素 | 說明 |
|---|---|
| 前 3 秒畫面 | 英雄（或國王）被困在格子底部，上方是岩漿 / 毒液 / 怪物，中間 2–4 根插銷；危機一目了然。 |
| 失敗誘導（fail bait） | 示範者先拔錯的那根，岩漿淋到英雄或寶箱掉進怪物區；Royal Match 救國王系列幾乎永遠失敗（SocialPeta × Reforged Labs）。 |
| 「我來一定行」的錯誤示範 | 解法只有 2–3 步，觀眾一眼看出順序 → 強烈的「讓我來」衝動。Aftermath 作者也承認這類謎題廣告「越氣人越有效」（[Aftermath 2024-01，2025-10 更新](https://aftermath.site/so-i-dont-totally-hate-those-hero-wars-ads.md)）。 |
| 爽感 / 解壓點 | 液體流動、水遇岩漿變石頭的嘶聲、金幣嘩啦落下。 |

## 遊戲規格

### 核心循環
1. 讀圖：辨識每個隔間內容（水、岩漿、毒氣、金幣、炸彈、怪物、英雄）。
2. 依序點擊插銷拔出（插銷只能往固定方向抽出）。
3. 物理模擬：顆粒 / 流體下落並互相反應。
4. 判定：英雄存活且碰到寶物 = 過關。

### 規則與勝負
- 元素反應表（建議，與原作大致相符但細節未證實）：
  - 水 + 岩漿 → 石頭（不可通過但可承重）
  - 岩漿 + 英雄 / 怪物 → 死亡
  - 金幣 + 岩漿 → 熔毀（失去）
  - 炸彈 + 怪物 → 怪物死亡；炸彈 + 英雄 → 失敗
  - 毒氣（上升）+ 英雄 → 死亡
- 勝：英雄取得 ≥ 1 份寶物且存活；Royal Match 變體多一個倒數或步數限制。
- 敗：英雄死亡、寶物全毀、或步數用完。

### 操作
- 點擊 / 滑動插銷（單點即可）。

### 關卡結構與難度曲線
| 關卡段 | 新元素 | 難度槓桿 |
|---|---|---|
| 1–10 | 水、岩漿、金幣 | 2 根插銷，1 個依賴 |
| 11–40 | 怪物、炸彈 | 3–4 根，順序依賴 2 層 |
| 41–100 | 毒氣（上升）、移動平台、會被石頭擋住的通道 | 「先製造石頭當地板」的間接解 |
| 100+ | 多英雄、多寶物要全拿 | 解空間變大但仍確定 |

（*Those Games* 的 Pin Pull 模式做了 100 關、*Those Games 2* 又做 50 關，A.V. Club 評論認為拉針是該合輯唯一撐得起一整個遊戲的模式，[Wikipedia](https://en.wikipedia.org/wiki/Those_Games)）

### 計分 / 星等 / 獎勵
- 原作多為「過 / 不過」；Hero Wars 給資源。拿到的金幣量可作為星等。

### 失敗與轉換點（廣告續命、IAP、導流到主遊戲的位置）
- Playrix：拉針作為 match-3 之間的獎勵關；失敗直接回主線。
- Hero Wars：拉針是附加功能，想重玩需另開帳號（粉絲攻略）；導向 idle RPG 抽卡。
- Royal Match：King's Nightmare 可跳過，失敗 = 用掉生命（match-3 生命制）。

## 可玩廣告（Playable Ad）結構

- 1 關、2–3 根插銷、10–20 秒；第一根插銷做成「最顯眼但錯誤」（顏色最亮、離手指最近）。
- 錯誤 → 立即失敗動畫 → 「再試一次」或直接 CTA；正確 → 寶物落下 → 下一畫面是主遊戲（花園 / 主城）預告 + CTA。

## 技巧要素

| 技巧 | 影響 |
|---|---|
| 因果推理 | 唯一的技巧；屬一次性解謎，重玩價值≈0 |
| （原作無）時機 | — |

## 隨機 / 選擇噱頭

- 沒有隨機，但是**純選擇**：每關有唯一正解序列，一旦知道就 100% 通過 → 不適合直接當競技。
- 廣告的「失敗」完全靠示範者故意犯錯。

## Skill Game 化改造（必做）

> 用這份規格書做遊戲時（含「復刻」），玩法規格 `gdd/05_game_spec.md` §13 要逐條回應下列每一條：採用就寫本作做法，不採用就寫理由與替代做法。「復刻」只復刻玩法結構與操作，不跳過本節（`RULE-AF-ADAPTATION`，`npm run audit` 檢查）。

1. **加入時機**：插銷「拔出」改為**按住拉、放開停**；流體以固定速度流動，玩家可**半開**插銷控制流量（例：只放 40% 的水剛好填平岩漿，剩下的水留著沖金幣）。從「選順序」變成「控流量 + 抓時機」。
2. **連續計分而非過/不過**：`Score = 救到的金幣顆數 × 1 + 英雄剩餘 HP × 50 + (時限 − 用時) × 5 − 浪費的水顆數 × 0.5`；同一關可以越玩越高 → 有練習天花板（E5）。
3. **移動威脅**：怪物會巡邏、岩漿池會週期性冒泡溢出 → 拔針時機要對上相位。
4. **同種子**：局內 5 關由 `rng(seed,"level",i)` 從手工關卡池（≥ 200 關）挑選並鏡像；雙方同題。不可重試同一題（防背答案），但練習模式可重玩舊種子。
5. **確定性流體**：用**顆粒格子模擬**（cellular automata，每 tick 依 id 順序更新），全整數，跨裝置一致；不用 Box2D 浮點流體。
6. **局長**：5 關 × 20 秒 = ~100 秒；非同步同種子 PvP。

## HTML5 輕量實作規格

| 項目 | 規格 |
|---|---|
| 畫面 | 直版 720×1280；關卡區 640×960，格子 8×8 px → 80×120 格 |
| 實體與資料結構 | `grid: Uint8Array(80*120)`（0 空、1 牆、2 水、3 岩漿、4 石、5 金幣、6 毒氣…）；`pins[]{cells[], dir, openRatio}`；`actors[]{type,x,y,hp}`；每 tick 自下而上掃描（毒氣自上而下）更新，交錯方向由 tick 奇偶決定（確定性） |
| 關鍵參數 | sim 60 Hz；流體每 tick 下落 1 格、側流 1 格；拔針速度 6 格/tick（按住）；關卡時限 20 s |
| 渲染 / Draw Call 估計 | 格子畫到一張 80×120 `Uint8Array` → 每 tick 上傳為 1 張小 texture（`BufferImageSource`），以 nearest 放大 8 倍：**1 DC**；牆 / 插銷 / 角色 同 atlas 1 DC；UI 數字 BitmapText 1 → **3 DC**。不用 filter；液體光澤用調色盤 |
| 美術資產清單 | 英雄 / 國王 3 狀態、怪物 3 種、插銷 2 款、牆面 tileset 1、寶箱、元素調色盤（每元素 2–3 色）|
| 包體估計 | 程式 0.8 MB；atlas 0.25 MB；關卡 JSON 200 關 ≈ 0.15 MB（gzip）；音效 0.2 MB；BGM 1.5 MB → **≈ 2.9 MB** |

## 主題與美術風格

- 原作：卡通騎士 / 國王 / 美女被困、寶箱金幣（Hero Wars 素材常帶性暗示，Aftermath 有批評）。
- 改造：避開寶箱金幣噴發（博弈聯想）→ 換「澆花救小動物」「把顏料導進調色盤」；不使用性暗示人物。

## 可借用 / 要避開

- **可借用**：一眼看懂的危機構圖；流體反應的爽感；手工關卡池 + 種子挑選。
- **要避開**：只有唯一解的關卡做競技（可背答案）；廣告展示遊戲裡極晚才出現的關（Playrix 0.03% 案例）；「Not all images represent actual gameplay」免責字樣無效（[ASA/CAP 2021-02-26](https://www.asa.org.uk/news/punch-out-any-issues-with-your-video-game-advertising.html)）。

## 來源

- [PocketGamer.biz — The evolution of pull the pin（2025-01-03）](http://www.pocketgamer.biz/the-evolution-of-pull-the-pin-why-is-this-a-good-thing-for-the-games-industry/)（存取日期 2026-10）
- [GameDevReports — SocialPeta × Reforged Labs 2025 creative trends（2026-01-02）](https://gamedevreports.substack.com/p/socialpeta-and-reforged-labs-mobile)（存取日期 2026-10）
- [Marketing-Interactive — Gardenscapes / Homescapes ASA（2020-10-14）](https://www.marketing-interactive.com/popular-mobile-games-gardenscapes-and-homescapes-called-out-for-misrepresentation-of-game-in-ads)（存取日期 2026-10）
- [Matej Lancaric — The Rise of Sophisticated Onboarding（2025-11）](https://lancaric.substack.com/p/the-rise-of-sophisticated-onboarding)（存取日期 2026-10）
- [Aftermath — So I don't totally hate those Hero Wars ads（2024-01-25，2025-10-27 更新）](https://aftermath.site/so-i-dont-totally-hate-those-hero-wars-ads.md)（存取日期 2026-10）
- [h-w.fun — Is Hero Wars like the ads?](https://h-w.fun/en/hero-wars-is-different-from-ads/?amp=1)（存取日期 2026-10）
- [oldcynic — Royal Match Save the King levels](https://oldcynic.com/royal-match-save-the-king-levels-kings-nightmare)（存取日期 2026-10）
- [Wikipedia — Those Games](https://en.wikipedia.org/wiki/Those_Games)（存取日期 2026-10）
- [Communication Today — Fake-Vertising and Mobile Games: Pull the Pin Ads（Mago, 2020）](https://communicationtoday.fmk.ucm.sk/index.php/ct/article/view/131)（存取日期 2026-10）
- [ASA/CAP — Punch-out any issues with your video game advertising（2021-02-26）](https://www.asa.org.uk/news/punch-out-any-issues-with-your-video-game-advertising.html)（存取日期 2026-10）
