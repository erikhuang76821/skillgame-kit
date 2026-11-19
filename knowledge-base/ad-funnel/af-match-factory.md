# 3D 三消收集（Match Factory! / Triple Match 3D；變體 Goods Sort、Tile Match）

- **代號**：af-match-factory
- **類別**：解謎排序 → Match-3D / 三選一收集槽（Triple Tile）
- **代表作 / 廠商**：Match Factory! — Peak（Zynga / Take-Two，2023-11 全球上線、先 iOS 獨占）；Triple Match 3D — BoomBox Games（Miniclip，2022-04-13）；Triple Match City — Radiant Cat Studio；Tile 變體：Tile Explorer、Vita Mahjong、Tile Club；貨架變體：Goods Puzzle: Sort Challenge、Perfect Tidy
- **投放熱度依據**：
  - **子類規模**：AppMagic 2025 H1 Match-3D 子類收入 $193M（YoY −12%）、安裝 49M（YoY −34%）；Match Factory 占 56%、月收創子類紀錄 $19M；Triple Match 3D 占 22%（[GameDevReports 摘 AppMagic H1'25](https://gamedevreports.substack.com/p/appmagic-mobile-casual-games-in-h125?open=false)，經搜尋摘要）。
  - **Match Factory**：上線 100 天 3M 下載、$13.8M、美國 iOS D1 45%（Triple Match 3D 為 27%），全無廣告（[Naavik](https://naavik.co/digest/match-factory-pays-off/)）；Udonis 引 AppMagic：累計 4,300 萬下載、約 $308M、月收 $15–17M（[Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/match-factory)）。
  - **Triple Match 3D**：2023 年商店收入 $138M、2023-12 全球手遊收入第 10（Sensor Tower，[Wikipedia](https://en.wikipedia.org/wiki/Triple_Match_3D)）。
  - **Tile / 貨架變體（下載面）**：Tile Explorer 2025 年 96M 下載排第 19、Vita Mahjong 第 7（[mobilegamer.biz](https://mobilegamer.biz/the-top-mobile-game-downloads-of-2025/)）；Apple 2025 美國 iPad 免費遊戲：Perfect Tidy 第 4、Goods Puzzle: Sort Challenge 第 7（[GamesBeat](https://gamesbeat.com/apple-unveils-most-downloaded-games-and-apps-of-2025/)）；Vita Mahjong、Tile Explorer 是 2025 Android 素材量前 2 名（SocialPeta，[GameDevReports](https://gamedevreports.substack.com/p/socialpeta-and-reforged-labs-mobile)）。
  - **台灣**：App Store 台灣「2025 免費遊戲排行」頁（iPad）：Perfect Tidy 第 6、《物品分類：連連看3消除遊戲》第 11（[App Store TW](https://apps.apple.com/tw/ipad/room/6756372270)）。Match Factory 本身的台灣數據未取得。
- **廣告真實度**：**部分真實**。Match Factory 主力素材仿 Royal Match 格式（角色遇險、牆塌下，玩家解題救人），但題目本身是 3D 三消；另有直接展示實機配對的素材（Udonis）。59% 曝光在 Meta、美國占 44%。
- **技巧 vs 選擇 vs 運氣**：原作物件堆是**物理模擬**、每次掉落位置不同 → 有隨機性；技巧 = 視覺搜尋速度 + 收集槽管理。

## 一句話玩法

從一堆 3D 物件中找出三個一樣的點進收集槽消掉，在倒數內清完目標。

## 為什麼廣告有效（Hook）

| 元素 | 說明 |
|---|---|
| 前 3 秒畫面 | 一大堆可愛 3D 物件（水果、玩具、甜點）堆成小山；或 Royal Match 式「角色被困、牆在逼近」。 |
| 失敗誘導（fail bait） | 收集槽剩 1 格、示範者點了第 3 種落單物件 → 槽滿失敗；倒數紅閃。 |
| 「我來一定行」的錯誤示範 | 觀眾明明看到第三顆草莓就在角落，示範者卻點別的。 |
| 爽感 / 解壓點 | 三個一樣的物件吸在一起「啵」地消失；物件堆被挖空、翻動的物理感。 |

## 遊戲規格

### 核心循環
1. 開局：關卡目標（例：收集 6 個甜甜圈 + 9 個雞腿）+ 倒數。
2. 點物件 → 飛進下方收集槽。
3. 槽中有 3 個相同 → 消除（目標物則計入目標）。
4. 清完目標 = 過關；收集槽滿且無三消 = 失敗；倒數到 0 = 失敗。

### 規則與勝負
- 收集槽：滿了就失敗（Triple Match 3D，Wikipedia）；槽位數未見官方數字（同類 Tiledom、Mahjong Match 為 7 格；Match Factory 未證實）。
- 有些物件被壓在下面，要先清上層才點得到（Wikipedia）。
- 每關有獨立倒數（Match Factory 商店描述）。
- 後期加入障礙與計時目標（Udonis）。

### 操作
- 單點；可能需要掃視、輕推（物件堆會滾動）。

### 關卡結構與難度曲線
| 關卡段 | 新元素 | 難度槓桿 |
|---|---|---|
| 入門 | 少量物件、大尺寸 | 時間寬鬆 |
| 中期 | 物件種類變多、尺寸差異大 | 視覺搜尋負擔 |
| 約 200–250 關 | 「差一點就輸」的設計密集出現 | Udonis：此段玩家使用道具量約為前期 1.5 倍 |
| 全程 | 失敗後下一次略為簡單 | 自適應難度（Udonis） |

### 計分 / 星等 / 獎勵
- 過關給金幣；活動（Helmet Rush、Mine Dash）與月排行是金幣出口（Udonis）。

### 失敗與轉換點（廣告續命、IAP、導流到主遊戲的位置）
- 道具：洗牌、清除難搞物件、凍結時間（Match Factory，Udonis）；Triple Match 3D：開局 Super Lightning / Extra Time，局內 Magnet / Undo / Fan / Freeze Time（Wikipedia）。
- 失敗時付約 $2 續玩（Naavik 描述 Match Factory 與 Triple Match 3D 皆是，Match Factory 的確切形式未證實）。
- Match Factory 無廣告；Triple Match 3D 約半數收入來自廣告（Naavik）。

## 可玩廣告（Playable Ad）結構

- 推測（未證實）：0–2 秒一小堆 12–18 個物件 + 槽 7 格 + 手指提示 → 3–5 次點擊完成 1–2 組三消 → 槽漸滿、剩下物件被壓住 → 失敗 → CTA。
- Royal Match 式外框：角色遇險畫面包住三消題目，失敗則角色被壓（Udonis）。

## 技巧要素

| 技巧 | 影響 |
|---|---|
| 視覺搜尋速度 | 主技巧（倒數壓力） |
| 收集槽管理（不讓單件塞滿） | 失敗條件 |
| 優先清目標物 vs 清障礙 | 次要規劃 |
| 挖掘順序（先清上層） | 看到被壓住的物件 |

## 隨機 / 選擇噱頭

- **物理堆疊不確定**：同一關每次物件位置不同 → 不能做同種子公平比賽。
- 自適應難度：失敗後變簡單 → 每人難度不同。

## Skill Game 化改造（必做）

> 用這份規格書做遊戲時（含「復刻」），玩法規格 `gdd/05_game_spec.md` §13 要逐條回應下列每一條：採用就寫本作做法，不採用就寫理由與替代做法。「復刻」只復刻玩法結構與操作，不跳過本節（`RULE-AF-ADAPTATION`，`npm run audit` 檢查）。

1. **去物理化**：改為 **2.5D 分層磚**（Tile Explorer 式）——物件放在固定座標與固定層，遮擋由幾何預算；完全確定，跨裝置一致。保留「3D 小物件」的視覺，用預渲染 sprite 表現。
2. **同種子生成**：`rng(seed)` 決定物件種類分配與層疊佈局；生成時保證**每種物件總數為 3 的倍數**且至少有一條不爆槽的完成序列（以貪婪 + 回溯驗證）。
3. **收集槽 7 格**（可調），槽滿 = 該輪結束；有 60 秒總時限。
4. **計分公式**（建議）：
   - 每組三消 +30
   - 連消：前一次三消後 1.5 秒內再三消，倍率 +0.2（上限 ×2.0）
   - 清空全盤：+300 + 剩餘秒數 × 10
   - 槽滿結束：保留已得分；槽內剩餘物件每件 −5
5. **移除付費影響**：無續玩、無道具、無自適應難度；所有人同盤。
6. **對戰形式**：每日種子排行；或 1v1 同盤同時開打、顯示對手進度條，60 秒一局。
7. **防作弊 / 公平**：物件 sprite 尺寸與對比度統一（避免某些物件天生難找）；色弱模式用形狀區分，不影響分數。

## HTML5 輕量實作規格

| 項目 | 規格 |
|---|---|
| 畫面 | 直版 720×1280；物件區 680×860（3–5 層、每層 30–50 件）；下方收集槽 7 格 × 90 px |
| 實體與資料結構 | `tiles[]{id, kind, layer, x, y, w, h, alive}`；`coveredBy: Uint16Array[]`（每件被哪些上層件覆蓋，載入時預算）；`free(t) = coveredBy[t] 全部 !alive`；`tray: Uint8Array(7)`（保持同類相鄰插入）；`events[]`（pick / triple / comboStep / trayFull / clear） |
| 關鍵參數 | 物件種類 12–20 / 局；總件數 90–150；槽 7；局長 60 s；連消窗 1.5 s；飛入槽動畫 180 ms |
| 渲染 / Draw Call 估計 | 所有物件圖示 + 磚底 + 陰影 共用 1 張 2048² atlas：1 DC（被覆蓋件用 tint 變暗，不用 filter）；收集槽同 atlas；分數 BitmapText 1 DC → **約 2–3 DC** |
| 美術資產清單 | 物件圖示 40 種（3D 預渲染 128×128，可用生圖管線出圖再統一打光）、磚底 1、槽 1、消除閃光 2、背景 1 |
| 包體估計 | 程式 0.8 MB；圖示 atlas（WebP 2048²）≈ 0.8 MB；音效 0.2 MB；BGM 1.5 MB → **≈ 3.3 MB** |

## 主題與美術風格

- 原作：工廠 / 甜點 / 玩具題材，3D 可愛物件、強物理感；Match Factory 安裝包大、製作精緻。
- 改造：台灣夜市小吃、文具、節慶物件（中秋、農曆年）皆適合三消；**避免麻將牌**（Vita Mahjong 系的麻將 tile match 在台灣有賭博聯想風險，違反「不使用賭博視覺」原則）。

## 可借用 / 要避開

- **可借用**：三消 + 7 格槽的極簡規則；連消倍率給速度玩家天花板；台灣市場已驗證的貨架 / 物品分類題材（App Store 台灣 2025 榜可見）。
- **要避開**：物理堆疊（不確定）；自適應難度；麻將牌題材；Royal Match 式「角色遇險但遊戲中罕見」的素材（與本體落差，參考 af-pull-the-pin 的 ASA 案例）。

## 來源

- [Naavik — Match Factory pays off](https://naavik.co/digest/match-factory-pays-off/)（存取日期 2026-10）
- [Udonis — Match Factory](https://www.blog.udonis.co/mobile-marketing/mobile-games/match-factory)（存取日期 2026-10）
- [GameDevReports — AppMagic Mobile Casual Games in H1'25](https://gamedevreports.substack.com/p/appmagic-mobile-casual-games-in-h125?open=false)（經搜尋摘要；存取日期 2026-10）
- [Wikipedia — Triple Match 3D](https://en.wikipedia.org/wiki/Triple_Match_3D)（存取日期 2026-10）
- [mobilegamer.biz — 2025's top mobile game downloads](https://mobilegamer.biz/the-top-mobile-game-downloads-of-2025/)（存取日期 2026-10）
- [GamesBeat — Apple unveils most downloaded games and apps of 2025](https://gamesbeat.com/apple-unveils-most-downloaded-games-and-apps-of-2025/)（存取日期 2026-10）
- [GameDevReports — SocialPeta × Reforged Labs 2025 creative trends](https://gamedevreports.substack.com/p/socialpeta-and-reforged-labs-mobile)（存取日期 2026-10）
- [App Store 台灣 — 2025 免費遊戲排行](https://apps.apple.com/tw/ipad/room/6756372270)（存取日期 2026-10）
- [Playgama — Mahjong Match（7 格槽同類規則參考）](https://playgama.com/export/game/mahjong-match)（存取日期 2026-10）
- [AppFollow — Tiledom（7 格槽同類規則參考）](https://apps.appfollow.io/ios/tiledom-match-puzzle-game/1477300089?country=ie)（存取日期 2026-10）
