# 色塊滑門（Color Block Jam）

- **代號**：af-color-block-jam
- **類別**：解謎排序 → 滑塊出門（Block Puzzle × Parking Jam 混種）
- **代表作 / 廠商**：Color Block Jam — Rollic（Take-Two 旗下；2024 Q4 才起量，該季 IAP 僅約 $175K，推定 2024 年底上線，確切日期未證實）。同類：Car Jam、Gecko Out、Coffee Mania（CrazyLabs，把 CBJ 方塊玩法接上排序）
- **投放熱度依據**：
  - **混合休閒收入第 1（2025 全年連續三季）**：AppMagic Q1 2025 IAP $25M（[AppMagic Q1](https://appmagic.rocks/blog/hybridcasual-q1-2025/?hl=en)）、Q2 $42M / 安裝 21.8M（[GameDevReports](https://gamedevreports.substack.com/p/appmagic-top-10-hybrid-casual-games)）、Q3 $33M / 18.6M（[AppMagic Q3](https://appmagic.rocks/blog/q3hybrid2025)）。另一口徑（Gamigion，App Store 淨收）Q1 2025 $43.6M、下載 30.4M，占混合休閒 16%（[Gamigion](https://www.gamigion.com/2025-hybridcasual-market-overview-with-real-data/)）。
  - **累計**：混合休閒益智中第一個破 $100M IAP，約 2026 年中累計 $148M（[mobilegamer.biz](https://mobilegamer.biz/data-digest-pixel-flow-hits-100m-mays-top-games-neverness-to-everness-pokemon-go-more/)）。
  - **投放方式**：高預算買量，並靠玩法片段在歐美與獨聯體社群病毒擴散（騰訊新聞轉述 AppMagic Q1 2025，[QQ](https://news.qq.com/rain/a/20250616A09NNC00)）。白鯨出海引 GameAnalytics 稱月流水接近人民幣上億（[Baijing 2025-08](https://www.baijing.cn/article/53581)）。
  - **台灣**：未取得台灣排名或投放數據（知識缺口）。
- **廣告真實度**：**真實玩法**為主（社群病毒片段即實機畫面；Q1 報告稱關卡為固定設計）。素材細節未取得逐支分析（未證實）。
- **技巧 vs 選擇 vs 運氣**：關卡固定、無隨機；技巧 = 路徑規劃 + 倒數下的操作速度。屬「選擇 + 速度」型。

## 一句話玩法

在倒數內把各色積木方塊滑到同色門口送出，清空整盤。

## 為什麼廣告有效（Hook）

| 元素 | 說明 |
|---|---|
| 前 3 秒畫面 | 樂高感的彩色積木塞滿一個方框，四周邊上是不同顏色的「門」；手指拖一塊直接滑出門、被絞碎，規則 1 秒看懂。 |
| 失敗誘導（fail bait） | 倒數只剩幾秒、最後一塊被另一塊卡住；Friendly GameDev 評測指出計時器常在「快完成時」歸零，促使重試。 |
| 「我來一定行」的錯誤示範 | 示範者先移錯塊、把出口堵死，觀眾看得出「先把藍的推開就好」。 |
| 爽感 / 解壓點 | 方塊進門被「碎紙機」式吃掉的動畫；Color Vacuum 道具一次吸走整色的大場面（評測特別稱讚其動畫）。 |

## 遊戲規格

### 核心循環
1. 開局看盤：方格盤內有多塊不同形狀（多格骨牌）、不同顏色的積木；盤邊有各色門段。
2. 拖曳積木在空格中滑動（被其他積木、牆擋住）。
3. 積木碰到同色門且能通過 → 被送出（碎掉）。
4. 全部送出 = 過關；倒數歸零 = 失敗、扣 1 命。

### 規則與勝負
- 門只收一種顏色（官方 FAQ / 粉絲站整理）。
- 倒數：粉絲攻略稱第 1–8 關 5 分鐘、9–10 關 3 分鐘、11 關後約 1:30–2:30（非官方，未證實）。
- 失敗：時間到；或某塊再也沒有可通過的同色門。
- 門寬與積木寬的關係（是否需積木寬 ≤ 門寬）：未證實。
- 障礙 / 特殊塊（粉絲站整理 14 種，非官方）：單向箭頭塊、多層外殼（逐層剝）、冰凍（清掉 N 塊後解凍）、連體塊、星形門專用塊、鎖鏈 + 鑰匙塊、炸彈（倒數前要送出）、開闔門、繩子 + 同色剪刀、同色專用通道、冰封門、會移動的門鎖、箱子（藏內容物）、不可移除的移動障礙。

### 操作
- 單指拖曳；積木沿格子滑動，會被阻擋。

### 關卡結構與難度曲線
| 關卡段 | 新元素 | 難度槓桿 |
|---|---|---|
| 1–8 | 單格 / 小塊、2–3 色 | 時間寬鬆（約 5 分鐘，未證實） |
| 9–20 | 大型骨牌、門變窄 | 時間縮短；首個道具約第 6–8 關解鎖（來源互相矛盾） |
| 20–100 | 冰凍、多層、箭頭、鎖鏈 | 依賴順序變深 |
| 100+ | 炸彈、移動門鎖、箱子 | 「看似不可能」的高壓關；評測說「每次重試都更接近」 |

### 計分 / 星等 / 獎勵
- 過關給金幣；rewarded 廣告可把過關金幣加倍（評測）。

### 失敗與轉換點（廣告續命、IAP、導流到主遊戲的位置）
- 生命：上限 5，失敗扣 1；可用金幣補滿、看廣告換 1 命、或等待回復；也可直接買。
- 失敗時：可用金幣買加時（官方 FAQ 稱 Time Freeze 停表並 +10 秒）。
- 道具：Time Freeze、Hammer（敲掉 1 塊或障礙 −1）、Color Vacuum（清除一整色）。
- 廣告：前 15 關無廣告（評測）／前 20 關無廣告（QQ 轉述），之後插頁 + 橫幅；有「失敗關卡禮包」（fail-level pack）、限時促銷。
- 「No Timer」山寨版的出現與評論「廣告說沒有計時器是騙人的」顯示**計時器是最大的付費壓力點**，也是玩家最大抱怨。

## 可玩廣告（Playable Ad）結構

- 推測（未取得實際可玩檔，未證實）：0–2 秒 3×3 小盤 + 手指提示拖第一塊 → 2–4 次拖曳送出大部分 → 最後一塊被卡、倒數紅閃 → CTA。
- 結束畫面：「Level 2 is harder!」類挑戰字句 + 下載鈕（推測）。

## 技巧要素

| 技巧 | 影響 |
|---|---|
| 依賴順序判讀（誰擋誰） | 主技巧 |
| 路徑規劃（繞過障礙的走法） | 多種解法中選最短 |
| 操作速度與準度 | 倒數下的實際限制 |
| 障礙機制理解（冰、鎖、炸彈倒數） | 中後期關卡門檻 |

## 隨機 / 選擇噱頭

- 原作無隨機，關卡固定；但難度靠「時間不夠」而不是「解不出來」→ 付費壓力來自時鐘。
- 部分平台描述「每關都能不靠道具過關」（粉絲站轉述），未證實。

## Skill Game 化改造（必做）

> 用這份規格書做遊戲時（含「復刻」），玩法規格 `gdd/05_game_spec.md` §13 要逐條回應下列每一條：採用就寫本作做法，不採用就寫理由與替代做法。「復刻」只復刻玩法結構與操作，不跳過本節（`RULE-AF-ADAPTATION`，`npm run audit` 檢查）。

1. **同種子**：從手工關卡池抽 4 關（`rng(seed,"lvl",i)`）；盤面可左右鏡像、顏色置換。
2. **計時改成分數，不是生死**：每關 60 秒；時間到不判死，改以「已送出格數」計分，未清完照樣進下一關。
3. **計分公式**（建議）：
   - 送出積木：每格面積 +10
   - 清盤：+400 + 剩餘秒數 × 15
   - 移動效率：每關 `par` 步數（由求解器預算最短拖曳次數）；`(par / 實際拖曳次數)` × 200（上限 200）
   - 連送：2 秒內連續送出，第 2 塊起每塊 +25
4. **移除付費影響**：沒有生命、沒有加時、沒有道具購買。若保留 Hammer 等道具，每人每局同一組（例：Hammer × 1），用了會在效率分中扣 par 差。
5. **確定性滑動**：積木以「格」為單位移動，拖曳時每 tick 朝手指所在格前進最多 1 格（4 鄰域、碰撞即停），sim 只吃格座標輸入 → 跨裝置一致；渲染層插值平滑。
6. **對戰形式**：非同步同種子 4 關 × 60 秒 = 4 分鐘；或每日挑戰盤排行。

## HTML5 輕量實作規格

| 項目 | 規格 |
|---|---|
| 畫面 | 直版 720×1280；盤面 6×6～8×10 格（原作確切尺寸未證實），每格 72–96 px；門畫在盤框外緣 |
| 實體與資料結構 | `grid: Int16Array(W*H)`（−1 牆、0 空、>0 為 blockId）；`blocks[]{id, color, cells`knowledge-base/ad-funnel/相對座標`（未收錄）, x, y, layers, frozenUntil, arrowDir}`；`doors[]{side, from, to, color, state}`；拖曳時算 `canMove(block, dx, dy)`；送出判定：積木所有格的投影完全落在同色門段範圍內且路徑無阻 |
| 關鍵參數 | sim 60 Hz；拖曳速度上限 1 格 / 3 tick；每關 60 s；連送窗 2 s；障礙參數存關卡 JSON |
| 渲染 / Draw Call 估計 | 積木由「單格方塊 + 凸點」sprite 拼成，與門、障礙共用 1 atlas：1 DC；碎屑粒子同 atlas；分數 BitmapText 1 DC；UI HTML → **約 2–3 DC** |
| 美術資產清單 | 單格方塊（灰階 + tint）1、凸點 1、門段 3 種（直 / 角 / 端）、冰、鎖、繩、炸彈、箱子各 1、碎屑 3、盤框 9-slice |
| 包體估計 | 程式 0.8 MB；atlas 0.2 MB；關卡 JSON 300 關 ≈ 0.15 MB；音效 0.2 MB；BGM 1.5 MB → **≈ 2.9 MB** |

## 主題與美術風格

- 原作：樂高感塑膠積木、高飽和色、乾淨淺色底；碎紙機吃塊的動畫。
- 改造：可換成「行李箱過安檢門」「顏料管擠進同色調色格」等自有題材；避免樂高商標造型（凸點數 / 字樣）。

## 可借用 / 要避開

- **可借用**：一眼懂的「同色進同色門」規則；豐富的障礙清單作為長期關卡內容池；求解器算 par 做效率分。
- **要避開**：用計時器當收費閘門（玩家最大抱怨）；廣告宣稱「無計時」卻有；把關卡難度設計成只差幾秒、誘導買加時。

## 來源

- [AppMagic — Top 10 Hybridcasual Games in Q1 2025](https://appmagic.rocks/blog/hybridcasual-q1-2025/?hl=en)（存取日期 2026-10）
- [GameDevReports — AppMagic Top-10 Hybrid-Casual Q2'25](https://gamedevreports.substack.com/p/appmagic-top-10-hybrid-casual-games)（存取日期 2026-10）
- [AppMagic — Top 10 Hybridcasual Games in Q3 2025](https://appmagic.rocks/blog/q3hybrid2025)（存取日期 2026-10）
- [Gamigion — 2025 Hybridcasual Market Overview with Real Data](https://www.gamigion.com/2025-hybridcasual-market-overview-with-real-data/)（存取日期 2026-10）
- [騰訊新聞 — 2025 年 Q1 混合休閒爆款盤點](https://news.qq.com/rain/a/20250616A09NNC00)（存取日期 2026-10）
- [白鯨出海 — Hexa Sort / Lion Studios 分析（2025-08-01）](https://www.baijing.cn/article/53581)（存取日期 2026-10）
- [mobilegamer.biz — Data digest: Pixel Flow hits $100m](https://mobilegamer.biz/data-digest-pixel-flow-hits-100m-mays-top-games-neverness-to-everness-pokemon-go-more/)（存取日期 2026-10）
- [Friendly GameDev — Color Block Jam review](https://friendlygamedev.com/game-reviews/color-block-jam/)（存取日期 2026-10）
- [colorblockjam.net — Gameplay FAQ（非官方粉絲站）](https://colorblockjam.net/faqs/gameplay/)（存取日期 2026-10）
- [AppMagic — New Puzzle Order: Sort, Block, Screw](https://appmagic.rocks/blog/new-puzzle-order-sort-block-screw)（存取日期 2026-10）
