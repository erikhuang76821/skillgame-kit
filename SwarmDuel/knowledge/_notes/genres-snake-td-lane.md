# 貪食蛇／塔防／左右切換打怪 — 品類研究筆記

> 範圍：使用者指定的三個純技巧品類，市場為台灣＋北美。資料截至 2026-10。未能證實者標「（未證實）」。規則書見 rules/ 下的 `genre-*.md`。
> 共同說明：台灣多數作品沒有公開的下載 / 營收數據，本筆記以「台區 App Store 評分數＋分類排名」（2026-10 擷取）作為相對熱度的代理指標；評分數只反映累積口碑規模，不等於活躍用戶數。

---

## 1. 貪食蛇 / Snake

### 1.1 熱度：台灣 vs 北美

| 指標 | 北美 | 台灣 |
|---|---|---|
| 頭部產品 | Snake.io（美區 47.9 萬評分、策略免費 #22）；slither.io（3.3K 評分、動作免費 #42）；Google Snake（搜尋彩蛋，2025 蛇年 Doodle） | Snake.io（台區名稱就叫「貪食蛇大作戰」，4,631 評分、動作免費 #61）；slither.io 台區僅 13 則評分 |
| 趨勢 | Snake.io 2024 年為 Apple Arcade 下載第 2 名（公司轉述）；Sensor Tower 顯示 2025 在拉美持續成長；slither.io 2025-06 自然搜尋流量約 630 萬（Ahrefs 估） | 無公開趨勢數據；中國微派《贪吃蛇大作战》未在台區上架，台灣玩家口中的「貪食蛇大作戰」多半是 Snake.io（推論） |
| 新興 | Snake Clash!（Supercent）在 2025 多國 Sensor Tower 貪食蛇類前五反覆出現（屬混合養成，非純 io） | 同左（台區排名未證實） |
| 判斷 | 常青品類，io 版是主流；單人經典版靠平台彩蛋存活 | 中等熱度，以 Snake.io 為代表；懷舊（Nokia）＋2025 蛇年題材加分 |

### 1.2 子類型

| 子類型 | 代表 | 核心 | 競技適性 |
|---|---|---|---|
| 單人格子分數賽 | Nokia Snake、Google Snake | 路徑規劃、反應；食物隨機 | ★★★★★（同 seed 後純技巧、可重播驗證） |
| 多人 io 大廳 | slither.io、Snake.io | 切頭、圍殺、加速成本、搶屍 | ★★（大廳制大小蛇不對等、延遲、bot） |
| 限時 / 團戰 io | 《贪吃蛇大作战》限時（約 4–5 分，未證實）、三隊團戰 | 同起點、限時比長度 | ★★★★ |
| 混合 / 超休閒 | Snake vs Block（Voodoo，數字方塊撞擊）、Snake Clash! | 數值判斷＋養成 | ★★（偏選擇 / 養成，非純技巧） |

### 1.3 變現

- slither.io：只有死亡後廣告＋去廣告（US$3.99 / NT$120），刻意不賣加成。
- Snake.io：去廣告 US$1.99–2.99、Premium 月訂 US$4.99、Snake Pass US$2.99、皮膚 US$0.99；另有 Apple Arcade 與 Netflix 通路授權。
- 共通：外觀（皮膚）是主要付費點，**幾乎不賣戰力**——這是 io 類能維持「公平」口碑的關鍵。

### 1.4 主題與美術

- 懷舊單色 LCD 像素（Nokia）；霓虹發光＋深色六角網格（slither.io）；糖果色卡通臉（Snake.io）。
- 台灣：2025 蛇年、Q 版角色蛇、夜市小吃食物皮（雞排、珍奶）可做在地化；避免紅金博弈視覺。
- 北美：聯名 / 節慶皮膚（萬聖、聖誕）、怪獸 Boss 蛇活動。

### 1.5 公平技巧競賽化

1. **單人同 seed 賽**（最推薦）：固定棋盤 × 速度 × 食物數；食物序列 `PRNG(seed, n)`；比分數或填滿用時；伺服器重播輸入驗證。
2. **限時同場 io**：10–20 人同長度同時出生、地圖光點 seed 固定、3–5 分鐘＋縮圈；`分數 = 最終長度 + 擊殺 × K + 存活獎勵`。
3. **非同步 io**：對手改為固定 seed 的 bot 劇本，所有人面對同一群 bot（可重播、可防作弊），但需揭露是 bot。
4. **防 P2W**：皮膚只換外觀；不賣「起始長度」「磁吸」「護盾」等加成；廣告續命在排位禁用。

### 1.6 設計教訓

1. **攻擊＝讓對手撞你**：一個方向輸入就同時完成攻與守，是 io 類最優雅的設計。
2. **加速必須有成本，且成本化為地上資源**：每次加速都是風險投資，也給對手回收機會。
3. **越大越笨重**（轉向半徑隨長度增加）：內建追趕機制，讓小蛇有逆轉手段。
4. **大廳制不適合有獎競賽**：需要改成同起點、限時、配對的場次。
5. **命名撞名風險**：slither.io 對 Snake.io 的商標訴訟（2025–26）提醒 Logo 與名稱要明確區隔。

---

## 2. 塔防 / Tower Defense

### 2.1 熱度：台灣 vs 北美

| 指標 | 北美 | 台灣 |
|---|---|---|
| 付費單機 | BTD6 美區 34.9 萬評分、策略付費 #1；KR5 美區 1.4 萬評分、動作付費 #44 | BTD6 台區 1,564 評分（NT$220）、策略付費 #38；KR5 台區 1,189 評分（NT$220）、策略付費 #30 |
| F2P PvP 合成 | Rush Royale 美區 9.6 萬評分（2022 年營收 1.02 億美元、5,000 萬下載） | **Random Dice（隨機骰子）約 5 萬評分**、策略免費 #102——本品類在台最大眾；Rush Royale（進擊的皇室）4,867 評分 |
| 營收頭部（Sensor Tower 週資料） | 2025 Q1 美區跨平台：Kingdom Guard 週營收高峰約 52.8 萬、Watcher of Realms 約 60.5 萬、Arknights 約 44.9 萬美元；iOS：BTD6 約 14.7 萬 | 台灣塔防類營收榜未取得（未證實）；2024 台灣手遊營收前十由博弈類《星城Online》居首（非塔防） |
| PC / 主機 | BTD6 Steam 2025 月高峰同時在線 27,674；Plants vs. Zombies: Replanted（EA，2025-10-23 上市，第三方估 Steam 約 16–17.5 萬套）；PvZ3 自 2024 秋宣布重製後無確定上市日 | 未證實 |
| 判斷 | 大品類，付費單機（BTD6、KR）與 F2P 混合（Kingdom Guard 等 4X 塔防）並存 | 中等；韓式隨機合成 PvP（Random Dice）口碑規模最大；付費單機小眾但評價極高 |

### 2.2 子類型

| 子類型 | 代表 | 隨機程度 | 競技適性 |
|---|---|---|---|
| 經典路線塔防（自由放塔） | Bloons TD 6 | 低（回合腳本固定） | ★★★★★（Race / CHIMPS 已是現成競技格式） |
| 固定塔位＋兵營 | Kingdom Rush | 低 | ★★★★（需抹平付費英雄 / 塔） |
| 1v1 送兵 PvP | Bloons TD Battles 2 | 低（不確定性來自對手決策） | ★★★★（第 40 回合判生命＋驟死保證結束；外觀付費） |
| 合成隨機 PvP | Rush Royale、Random Dice | **高**（召喚、合成結果、Boss 皆隨機）＋卡牌等級付費 | ★（原版不合格；需去隨機化） |
| 車道 / 植物塔防 | Plants vs. Zombies | 低–中 | ★★★ |
| 角色塔防（輕度） | Arknights | 低（關卡固定），角色抽卡＝戰力 | ★★（需固定角色池） |
| 4X / 混合塔防 | Kingdom Guard、Clash 式推塔 | 中 | ★（養成主導） |

**Random Dice 的隨機在哪**：(1) 每次召喚的骰子種類與落點隨機；(2) 兩顆同種同點數合成後，新骰子點數 +1 但種類隨機重抽；(3) 局外「職業等級」等永久成長提高數值（是否可付費加速，未證實細節）。Funovus 分析甚至把 Rush Royale / Random Dice 形容為「單人拉霸」，因為雙方除送怪外幾乎無直接互動。

### 2.3 變現

| 模式 | 代表 | 內容 |
|---|---|---|
| 買斷＋輕內購＋DLC | BTD6（US$6.99 / NT$220）、KR5（同價） | 道具 / 英雄 / 塔 / 戰役 DLC（KR5 DLC 各 US$8.99、英雄 US$6.99、全塔 US$19.99） |
| F2P 外觀＋賽季 | BTDB2 | Steam 頁描述付費內容為外觀 |
| F2P 卡牌升級＋通行證 | Rush Royale（Premium Pass US$11.99 / NT$430、水晶最高 US$99.99 / NT$3,590） | 升級＝戰力，P2W 疑慮 |
| 訂閱通路 | BTD6+、KR5+（Apple Arcade）、BTD6 Netflix | 無內購版本 |

### 2.4 主題與美術

- 卡通全年齡：猴子 × 氣球（BTD）、Q 版奇幻王國（KR）、植物 × 殭屍（PvZ）——高飽和、無血腥。
- 極簡符號：Random Dice 的扁平骰子，可讀性第一。
- 台灣偏好：Q 版角色、三國題材（《塔防三國志》自稱 300 萬下載）、日系二次元（Arknights）。
- 北美偏好：幽默卡通、奇幻、流行文化彩蛋。

### 2.5 公平技巧競賽化

1. **固定回合腳本**：TD 天生同種子；所有參賽者面對同一波次。
2. **統一配置**：比賽用公版英雄 / 塔 / 等級（參考 BTD6 CHIMPS 明列禁用：續關、生命補充、額外收入、猴子知識、道具、賣塔）。
3. **計分公式範例**：
   - 競速：最快通關時間（BTD6 Race：可提前送波、禁用道具）。
   - 生存：`存活波數 × 1000 + 剩餘生命 × 300 + 剩餘金錢`。
   - KR 式：`剩餘生命 × 1000 + 提前呼叫總秒數 × 10`。
4. **合成類去隨機化**：召喚 / 合成結果同 seed，或顯示「下 3 次召喚」把運氣變規劃。
5. **PvP 結束保證**：BTDB2 的「第 40 回合比生命＋驟死 10 回合＋第 51 回合平手」。
6. **防作弊**：輸入（時間戳＋指令）可完整重播；理論最高分可算。

### 2.6 設計教訓

1. **固定腳本是 TD 做競技的最大優勢**——不要為了「新鮮感」加入隨機波次，用多地圖 / 多規則取代。
2. **付費必須和戰力脫鉤才能競技**：BTD6 用 CHIMPS / Race 隔離，Rush Royale 鏡像對決只統一牌組沒統一等級，被批 P2W。
3. **經濟＝攻擊**（BTDB2 送兵影響 eco）：讓 PvP 塔防有真正的互動，而不是各玩各的。
4. **有限格子 / 固定塔位**提高每個決策的重量，適合手機短局。
5. **給 PvP 一個保證結束的時間點**（回合上限＋驟死），避免後期拖延與效能問題。

---

## 3. 左右切換打怪 / Lane Brawler（單鍵雙向攻擊）

### 3.1 最熱門的作品是誰

| 作品 | 類型 | 熱度證據 | 技巧 or 選擇噱頭 |
|---|---|---|---|
| **Mob Control**（Voodoo） | 超休閒「人群穿門」＋砲台瞄準 | 第三方（Udonis 引 AppMagic）：累計 3.02 億安裝、2025 年 8,160 萬下載、2026-04 月活 2,640 萬；累計營收 7,750 萬美元、2024 年 2,440 萬；美國貢獻約 58% 營收 | **半技巧**：瞄準與射擊時機有技巧，但「選 ×2 還是 ×3 門」是一眼可判的算術選擇 |
| **Count Masters**（FreePlay） | 跑酷「左右選門」人數倍增 | 2024-01 累計 2.5 億下載（公司聲明）；Google Play 1 億+ | **選擇噱頭為主**：門上數字公開，最佳選擇幾乎固定，操作只有左右拖曳 |
| **Timberman**（Digital Melody） | 左右點擊躲樹枝 | 2014 現象級（250 萬下載 / 20+ 國前五）；宣稱 2,000–3,000 萬玩家；現為長尾 | **純技巧**（反應＋節奏＋時間條管理） |
| **One Finger Death Punch**（Silver Dollar） | 兩鍵左右功夫格鬥 | OFDP2 Steam 約 96% 好評；2025–26 同時在線個位數 | **純技巧**（距離判斷＋空揮懲罰＋序列） |
| **Muse Dash**（PeroPeroGames） | 兩鍵節奏＋打怪（上 / 下兩軌） | 全平台累計 1,000 萬套（日期未證實）；2026-05 披露續作含多人 | **純技巧**（譜面固定＝天然同 seed） |
| Kung Fu Z / Kung Fu Zombie（Trophy Games）、Fatal Fight 等仿作 | OFDP 式殭屍 / 功夫 | 無可信熱度數據（未證實） | 技巧 |

**結論**：按「下載量」論，Mob Control / Count Masters 等「左右選門」最大，但其核心是**公開數字的選擇題**（以及廣告中常見的、實際遊戲不存在的假玩法），不是反應技巧；按「左右雙向打擊的純技巧」論，代表作是 OFDP（機制定義者）與 Timberman（手機普及者），節奏化分支為 Muse Dash。

### 3.2 熱度：台灣 vs 北美

| 指標 | 北美 | 台灣 |
|---|---|---|
| 純技巧左右打擊 | OFDP 在核心 PC 玩家口碑極佳但規模小；Timberman 美區 523 評分（長尾） | Timberman 台區僅 7 評分；OFDP 繁中圈稱「一指死神」，Steam 無繁中；無排行數據（未證實） |
| 選門超休閒 | Mob Control 美國占營收 58%，為北美最大市場 | 台灣排名未證實 |
| 節奏兩鍵 | Muse Dash 北美有一定群眾（數據未證實） | Muse Dash 音樂製作人包含台灣創作者；二次元＋音遊在台受歡迎（推論，未證實排名） |
| 判斷 | 純技巧左右打擊屬「機制好、市場空」——頭部缺位 | 同左；台灣街機音遊文化（見 tw-basketball-arcade.md）可作為接受度依據 |

### 3.3 子類型

| 子類型 | 輸入 | 核心技巧 | 失誤懲罰 |
|---|---|---|---|
| 左右格鬥（OFDP） | 左 / 右 | 範圍判斷、序列、克制 | 空揮硬直→挨打 |
| 左右躲避（Timberman） | 左 / 右（移動＋攻擊合一） | 預讀障礙、維持速度 | 撞樹枝即死；慢了時間條歸零 |
| 節奏打擊（Muse Dash） | 上 / 下兩鍵 | 節拍準度 | Miss 扣血、斷連擊 |
| 選門跑酷（Count Masters） | 左右拖曳 | 幾乎只有選擇 | 選錯門人數少（可預見） |
| 選門＋瞄準（Mob Control） | 拖曳瞄準＋射擊 | 瞄準、時機 | 兵力不足攻不下基地 |

### 3.4 變現

- Timberman：插頁廣告＋去廣告 US$0.99＋角色 / 金幣包（外觀）。
- OFDP：PC 買斷（OFDP2 US$7.99）；手機 F2P 加體力與雙貨幣。
- Mob Control：約一半廣告、一半內購；季票約占內購 20%、聯名（Transformers 季）拉升約 10%。
- 共通：外觀角色是最安全的付費點；體力制與數值養成會破壞競技。

### 3.5 主題與美術

- 功夫電影火柴人（OFDP）、8-bit 伐木工（Timberman）、可愛二次元少女＋怪物（Muse Dash）、藍紅兩軍人群（Mob Control）。
- 台灣可行題材：廟會 / 八家將「左右陣頭」、夜市打地鼠、武俠；北美：功夫電影、殭屍、拳擊、伐木（Americana）。

### 3.6 公平技巧競賽化

1. **同 seed 敵人 / 障礙序列**：方向、類型、間隔、序列全部由 seed 決定。
2. **計分**：`擊殺 × 100 × 連擊倍率 − 空揮 × 200`（倍率每 10 連 +0.1，上限 ×3，失誤歸零）；或 Timberman 式「砍數＋時間條生存」。
3. **空揮懲罰必備**：沒有懲罰的兩鍵遊戲會被狂按 / 巨集破解。
4. **防巨集**：輸入時間戳重播；間隔標準差過小或持續 < 80ms 精準命中列為可疑。
5. **選門類若要競技**：把門數值隱藏 / 動態（移動門、需瞄準才能穿過），否則只是算術選擇，不符合技巧定位。

### 3.7 設計教訓

1. **「一個輸入＝移動＋攻擊」**（Timberman）讓兩顆鍵就形成完整決策迴圈。
2. **「快＝活更久」的時間條**把速度直接變成資源，不需額外計分系統。
3. **空揮必須有代價**（OFDP）——這是兩鍵遊戲深度的來源。
4. **拿掉 UI 提示就是高段位**（OFDP Blind 模式）：同一內容零成本擴充賽道。
5. **選擇噱頭 ≠ 技巧**：Mob Control / Count Masters 的下載量來自廣告素材，而非技巧深度；若借用「左右門」視覺，必須補上真正的時機 / 瞄準技巧，並避免假廣告（業界報告指真實廣告的次日留存約 32%、假玩法廣告約 14%，二手來源，未證實）。

---

## 4. 跨品類對照

| 面向 | 貪食蛇 | 塔防 | 左右打怪 |
|---|---|---|---|
| 天生同種子程度 | 中（食物隨機，可 seed） | 高（回合腳本固定） | 中（敵人序列可 seed） |
| 單局長度 | 1–5 分 | 10–40 分（競技需縮短） | 30 秒–3 分 |
| 最大公平風險 | 大廳制大小蛇、bot | 付費英雄 / 塔 / 卡牌等級；合成隨機 | 巨集、體力制 |
| 台灣代表 | Snake.io（貪食蛇大作戰） | Random Dice（隨機骰子） | 無頭部（機會） |
| 北美代表 | Snake.io、slither.io | BTD6、Kingdom Rush、Rush Royale | Mob Control（選門）、OFDP（技巧） |
| 最適合的競賽格式 | 同 seed 單人分數賽 / 限時 io | 同腳本競速（BTD6 Race 式） | 同 seed 1v1 分屏、每日挑戰 |

## 來源

- [Slither.io — Wikipedia](https://en.wikipedia.org/wiki/Slither.io)（存取日期 2026-10）
- [Snake.io — App Store（美區）](https://apps.apple.com/us/app/snake-io-fun-online-snake/id1104692136)、[（台灣區）](https://apps.apple.com/tw/app/id1104692136)（存取日期 2026-10）
- [Snake.io blog — Arcade](https://snake.io/blog/category/arcade/)（存取日期 2026-10）
- [2025 Q4 Android Top 5 Snake Games (Turkey) — Sensor Tower](https://sensortower.com/blog/2025-q4-android-top-5-snake-games-units-tr-609ef9a128293296045b75b4)（存取日期 2026-10）
- [2025 Q4 Android Top 5 Snake Games (Latin America) — Sensor Tower](https://sensortower.com/blog/2025-q4-android-top-5-snake-games-units-latin-am-609ef9a128293296045b75b4)（存取日期 2026-10）
- [slither.io — Ahrefs](https://ahrefs.com/websites/slither.io)（存取日期 2026-10）
- [Google marks Lunar New Year with playable Snake Game — ABS-CBN](https://www.abs-cbn.com/news/technology/2025/1/28/google-marks-lunar-new-year-with-playable-snake-game-2111)（存取日期 2026-10）
- [Bloons TD 6 — Wikipedia](https://en.wikipedia.org/wiki/Bloons_TD_6)（存取日期 2026-10）
- [Bloons TD 6 — App Store（美區）](https://apps.apple.com/us/app/id1118115766)、[（台灣區）](https://apps.apple.com/tw/app/id1118115766)（存取日期 2026-10）
- [Bloons TD Battles 2 — Steam](https://store.steampowered.com/app/1276390/)（存取日期 2026-10）
- [Kingdom Rush 5 — App Store（美區）](https://apps.apple.com/us/app/kingdom-rush-5-alliance-td/id1622869542)、[（台灣區）](https://apps.apple.com/tw/app/id1622869542)（存取日期 2026-10）
- [Rush Royale — Wikipedia](https://en.wikipedia.org/wiki/Rush_Royale)（存取日期 2026-10）
- [Rush Royale — App Store（美區）](https://apps.apple.com/us/app/id1526121033)、[進擊的皇室（台灣區）](https://apps.apple.com/tw/app/id1526121033)（存取日期 2026-10）
- [隨機骰子：塔防 — App Store（台灣區）](https://apps.apple.com/tw/app/id1462877149)（存取日期 2026-10）
- [Rush Royale: What Genre is it really? — Funovus](https://funovus.com/blogs/rush-royale)（存取日期 2026-10）
- [Rush Royale Mirror Match Review — Old Cynic](https://oldcynic.com/rush-royale-mirror-match-review-guide-tips)（存取日期 2026-10）
- [2025 Q1 Unified Top 5 Tower Defense Games Revenue US — Sensor Tower](https://sensortower.com/blog/2025-q1-unified-top-5-tower%20defense%20games-revenue-us-6012932d241bc16eb85e0db8)（存取日期 2026-10）
- [2025 Q1 iOS Top 5 Tower Defense Games Revenue US — Sensor Tower](https://sensortower.com/blog/2025-q1-ios-top-5-tower%20defense%20games-revenue-us-6012932d241bc16eb85e0db8)（存取日期 2026-10）
- [Plants vs Zombies Replanted — Raijin](https://raijin.gg/app/3654560/Plants_vs_Zombies_Replanted)（存取日期 2026-10）
- [Plants vs Zombies Replanted — SteamPulse](https://steampulse.org/game/3654560)（存取日期 2026-10）
- [2024 台灣手遊營收（星城Online 居首）— 自由時報](https://ec.ltn.com.tw/amp/article/paper/1715891)（存取日期 2026-10）
- [塔防三國志 — App Store](https://apps.apple.com/app/id1223965045)（存取日期 2026-10）
- [Mob Control — Udonis（AppMagic 數據）](https://www.blog.udonis.co/mobile-marketing/mobile-games/mob-control)（存取日期 2026-10）
- [Voodoo Reports 20% Growth in 2024 — Voodoo](https://voodoo.io/news/voodoo-reports-20-growth-and-strong-profitability-in-2024)（存取日期 2026-10）
- [2025: a year of growth and transformation for Voodoo — Voodoo](https://voodoo.io/news/2025-a-year-of-growth-and-transformation-for-voodoo)（存取日期 2026-10）
- [Count Masters 2.5 億下載 — WN Hub](https://wnhub.io/zh/news/other/item-43176)（存取日期 2026-10）
- [Count Masters — Google Play 活動頁](https://play.google.com/store/apps/eventdetails/4829840062490296838)（存取日期 2026-10）
- [Fake Ads & Mobile Gaming — Segwise](https://segwise.ai/blog/fake-ads-and-mobile-gaming-how-studios-balance-clickbait-gameplay-integrity-and-profitability-cm7j2hc9s00bvip0l0r4k59lw)（存取日期 2026-10）
- [Five ways fake mobile games fail to meet advertised expectations — Penn State](https://psu.edu/news/research/story/five-ways-fake-mobile-games-fail-meet-advertised-expectations)（存取日期 2026-10）
- [One Finger Death Punch — Wikipedia](https://en.wikipedia.org/wiki/One_Finger_Death_Punch)（存取日期 2026-10）
- [One Finger Death Punch 2 — Steambase](https://steambase.io/apps/980300)（存取日期 2026-10）
- [Timberman — TechCrunch (2014)](https://techcrunch.com/?p=1028998)（存取日期 2026-10）
- [Timberman — App Store（美區）](https://apps.apple.com/us/app/id871809581)、[（台灣區）](https://apps.apple.com/tw/app/id871809581)（存取日期 2026-10）
- [Muse Dash hits 10 million sold worldwide — GoNintendo](https://gonintendo.com/contents/24456-muse-dash-hits-10-million-sold-worldwide)（存取日期 2026-10）
- [Muse Dash 2 披露 — AUTOMATON (2026-05)](https://automaton-media.com/articles/newsjp/20260501-440897/)（存取日期 2026-10）
- [Muse Dash 開發背景 — 機核 GCORES](https://www.gcores.com/articles/95309)（存取日期 2026-10）
- [Kung Fu Zombie — App Store](https://apps.apple.com/us/app/-/id1380910604)（存取日期 2026-10）
- [Fatal Fight（OFDP 仿作）— TouchArcade](https://toucharcade.com/?p=169635)（存取日期 2026-10）
