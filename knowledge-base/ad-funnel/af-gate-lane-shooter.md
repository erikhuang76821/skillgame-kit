---
id: KB-af-gate-lane-shooter
kind: research
topic: [design, market]
genre: [lane-shooter]
skillAxis: [aim, planning]
source: [af-gate-lane-shooter]
reviewedAt: 2026-10-21
---
# 加乘門射擊跑道（Gate Lane Shooter：Last War: Survival / Evony 數字桶）

- **代號**：af-gate-lane-shooter
- **類別**：4X 假玩法小遊戲（跑道射擊 + 加乘門）
- **代表作 / 廠商**：Last War: Survival — FirstFun（Google Play 2023-06、App Store 2023-08）；Evony: The King's Return — Top Games（廣告中的「射數字桶」）；Top War 等同類 4X（未逐一證實）；反向致敬作 *Real War (Not Fake)* — Dan Lespect（2025-11，iOS / Android）；*Those Games 2* 的「Spellbinding Scroll」模式 — Monkey Craft / D3 Publisher（2024-07）
- **投放熱度依據**：
  - SocialPeta 2025 H1 iOS 投放量前 10 名含 Last War: Survival（北美為主的全球榜；[Mobilegamer.biz 2025-08-20](https://mobilegamer.biz/data-digest-appsflyers-rumoured-4bn-exit-top-ad-spenders-market-data-plus-company-financials-and-investment-news/)）；同文引 Sensor Tower：2025 Q2 IAP 營收第 1 名。
  - Insightrackr（2026-04 更新）：素材 92.35% 影片、3.95% playable；投放地區前列為日 4.50%、美 4.10%、韓 3.30%，台灣/中國併列 3.43% 被歸為高成長市場（[Insightrackr](https://blog.insightrackr.com/en/docs/LastWarIntelligence)）。
  - AppGrowing 2026-06-16～07-16 抽樣 157+ 支素材，至少 30 支為「過橋 / 跑酷式代理玩法」（見 [af-bridge-run-merge](af-bridge-run-merge.md)），80+ 支為 UGC / TikTok 風格（[AppGrowing 2026-07-16](https://appgrowing.net/blog/en/how-last-war-uses-proxy-minigames-to-package-strategy-gameplay/)）。
  - 台灣：PTT C_Chat 2026-01 討論 Last War 營收排行時，多位鄉民直指「左右閃 +1 ×2 小遊戲廣告只是騙進去當分母」（玩家意見，非數據；[PTT](https://www.ptt.cc/bbs/C_Chat/M.1767321519.A.2EB.html)）。
- **廣告真實度**：**部分真實**。Last War 開場確實有門型射擊小遊戲，之後逐步轉為 4X 主城；小遊戲保留為支線（[Lancaric 2025-11](https://lancaric.substack.com/p/the-rise-of-sophisticated-onboarding)、[Gamigion](https://www.gamigion.com/?p=24490)）。Evony 的射數字桶廣告被英國 ASA 判定誤導（2024-04-03，見下）。
- **技巧 vs 選擇 vs 運氣**：廣告版幾乎全是「選門」；本體小遊戲加入左右閃避與自動射擊，技巧成分低（未證實實際深度）。

## 一句話玩法
<!-- card: KB-af-gate-lane-shooter.pitch -->

小隊沿跑道自動射擊，左右移動吃加乘門、射爆數字桶，擋住殭屍潮。

## 為什麼廣告有效（Hook）
<!-- card: KB-af-gate-lane-shooter.hook; topic=market -->

| 元素 | 說明 |
|---|---|
| 前 3 秒畫面 | 一名士兵站在碼頭 / 跑道上，前方是一整片紅色殭屍潮（App Store 截圖文案「Pick Your Lane」「Grow Your Forces」，[spark.mwm.ai 商店頁轉錄](https://spark.mwm.ai/en/apps/last-warsurvival/6448786147)）。 |
| 失敗誘導（fail bait） | 示範者走進「−」門或錯過「×」門，火力不足被淹沒；Royal Match、MONOPOLY GO! 等同期常態是「廣告幾乎都以失敗收尾」（SocialPeta × Reforged Labs 2026-01）。 |
| 「我來一定行」的錯誤示範 | 門上算式簡單到小學生都懂，觀眾認定示範者是笨蛋。 |
| 爽感 / 解壓點 | 士兵數 / 火力數字跳升、子彈海、殭屍成片倒下、Boss 爆炸。 |

## 遊戲規格
<!-- card: KB-af-gate-lane-shooter.spec; topic=design,difficulty -->

> 「建議值」為本工作室規格；原作數值未取得者標（未證實）。

### 核心循環
1. 小隊（初始 1–5 人）在 3 線 / 自由橫移跑道上自動前進並自動向前射擊。
2. 前方依序出現：加乘門（+N 兵 / ×k 兵 / +火力 / −兵）、**數字桶**（頭頂 HP 數字，射爆後給武器或 +兵；Evony 廣告元素）、殭屍群、障礙。
3. 終點 Boss：在時間內打掉 HP，否則被推過底線。
4. 結算 → 原作接主城建造（4X 導流點）。

### 規則與勝負
- 每名士兵每秒射擊 r 發，每發傷害 d；小隊 DPS = 人數 × r × d。
- 殭屍碰到小隊：一換一（扣一名士兵）。
- 數字桶：HP 歸零才給獎勵；**沒打爆而撞上 = 扣兵**（這是 Real War (Not Fake) 強化的「射擊時機」核心）。
- 勝：擊敗 Boss 或撐到終點；敗：士兵歸 0 或殭屍越過底線。

### 操作
- 單指左右拖曳；射擊自動。（*Real War (Not Fake)* 版本改成手動抓時機開火，Notebookcheck 2025-12 報導）

### 關卡結構與難度曲線
| 關卡段 | 新元素 | 難度槓桿 |
|---|---|---|
| 1–3（新手 / 廣告） | 只有 +/× 門、稀疏殭屍 | 幾乎不會輸 |
| 4–10 | − 門、數字桶、側邊殭屍 | 好門擺在殭屍群後面（要先清怪才能吃） |
| 11–30 | 移動門、裝甲殭屍（高 HP）、輪胎/負面區障礙 | 火力門 vs 人數門的取捨 |
| 30+ | 多 Boss、時間壓力 | 原作改由主城科技數值決定（數值牆 → 付費） |

### 計分 / 星等 / 獎勵
- 原作：通關給資源（主城用）；星等未證實。

### 失敗與轉換點（廣告續命、IAP、導流到主遊戲的位置）
- 小遊戲數關後鎖住，需主城等級解鎖 → 迫使玩家進入 4X 建造（Lancaric、Gamigion 描述的漸進轉換）。
- Gamigion 稱 FirstFun 量測「廣告玩法」與「核心玩法」的留存曲線並調整節奏（作者推測，未證實）。
- 4X 主體 IAP 為主（DataEye 2025-03：出海 SLG 的 IAP 占比長期 > 80%，[百鯨](https://www.baijing.cn/article/52113)）。

## 可玩廣告（Playable Ad）結構
<!-- card: KB-af-gate-lane-shooter.playable-ad; topic=market -->

- Last War 素材中 playable 只占 3.95%（Insightrackr），主力是影片；playable 長度未證實。
- 典型影片節奏（觀察歸納，非實測）：0–2 s 殭屍潮壓境 → 2–10 s 錯誤選門示範 → 10–15 s 小隊被淹 / 字幕「只有 1% 的人過得了」類挑釁（未證實具體文案）→ CTA。
- Playable 建議：2 組門 + 1 組數字桶 + Boss，20 秒內；第 2 組門把 × 門放在殭屍後方逼玩家先清怪。

## 技巧要素
<!-- card: KB-af-gate-lane-shooter.skill-elements; topic=fairness,design -->

| 技巧 | 影響 |
|---|---|
| 讀門 | 原作主要決策，淺 |
| 清怪路線 | 好門在怪後面時，要先橫移到能打穿的位置 |
| 射爆時機（手動開火版） | 數字桶 HP 與小隊 DPS 對比，算準距離才不撞上 |
| 閃避 | 輪胎 / 負面區 / 側邊衝鋒殭屍 |

## 隨機 / 選擇噱頭
<!-- card: KB-af-gate-lane-shooter.randomness; topic=fairness -->

- 廣告版：門值固定、一眼可解 → 假抉擇。
- 本體：小遊戲難度在後段由主城戰力決定 → 數值 / 付費決定勝負，不是技巧。

## Skill Game 化改造（必做）
<!-- card: KB-af-gate-lane-shooter.adaptation; kind=method; topic=fairness,design; rules=RULE-AF-ADAPTATION -->

> 用這份規格書做遊戲時（含「復刻」），玩法規格 `gdd/05_game_spec.md` §13 要逐條回應下列每一條：採用就寫本作做法，不採用就寫理由與替代做法。「復刻」只復刻玩法結構與操作，不跳過本節（`RULE-AF-ADAPTATION`，`npm run audit` 檢查）。

1. **手動射擊 + 子彈經濟**：學 *Real War (Not Fake)*：按住射擊、彈匣 30 發、換彈 0.8 s（建議）。開火時機與換彈節奏成為技巧；不開火時移動速度 +30%（風險換報酬）。
2. **門是「取捨」不是「最大值」**：+兵 增加 DPS 但加寬隊形（更容易被側邊殭屍咬）；+火力 不加寬但單點；× 門只有在隊伍 ≥ 某數才划算。讓最優解依當下局面變動。
3. **數字桶 = 瞄準題**：桶在不同線，HP 不同；打爆給的獎勵寫在桶上。玩家要在有限 DPS 下決定先打哪個 → 路線規劃。
4. **同種子**：殭屍波次、門、桶全部 `rng(seed,"wave",i)`；雙方同一條跑道；無主城數值帶入、無看廣告復活。
5. **計分公式（建議）**：`Score = 擊殺數 × 2 + 打爆桶數 × 20 + Boss 剩餘時間(秒) × 10 + 存活士兵 × 5`；被淹沒時 Score 保留當下值（不歸零，避免一擊定生死的挫折）。
6. **局長**：75–120 秒；1 條跑道 + 1 Boss。

## HTML5 輕量實作規格
<!-- card: KB-af-gate-lane-shooter.html5-spec; kind=method; topic=tech,budget -->

| 項目 | 規格 |
|---|---|
| 畫面 | 直版 720×1280；俯視 2D 或 2.5D 斜俯視；跑道寬 600 px |
| 實體與資料結構 | 士兵 SoA ≤ 200；子彈 SoA ≤ 600（物件池）；殭屍 SoA ≤ 400；`gates[]`、`barrels[]{x,y,hp,reward}`；碰撞用網格空間雜湊（cell 32 px），依 id 排序 |
| 關鍵參數 | 前進 240 px/s；士兵射速 4 發/s；子彈 900 px/s；殭屍 HP 3、移速 120 px/s；Boss HP 依種子 3,000–8,000；隊形半徑 c·√N（c=7） |
| 渲染 / Draw Call 估計 | 士兵 + 殭屍 + 桶 + 門同 atlas → 1 DC；子彈單獨 atlas（加色混合）1；地面 1；數字 BitmapText 1；Boss 若 Spine 1 → **4–5 DC**。子彈 600 顆、殭屍 400 隻在 Pixi 8 同 texture 合批仍為 1 DC；超過 1,000 實體改 `ParticleContainer`（只更新 position）。命中閃白用 tint，不用 filter |
| 美術資產清單 | 士兵 / 殭屍 各 4 幀 × 2 方向（48×48）、裝甲殭屍、Boss（Spine 或 6 幀）、門框、數字桶 3 種、子彈 2 種、爆炸 sprite 環 |
| 包體估計 | 程式 1.0 MB；atlas 0.6 MB；Spine Boss 0.2 MB；音效 0.3 MB；BGM 1.5 MB → **≈ 3.6 MB** |

## 主題與美術風格
<!-- card: KB-af-gate-lane-shooter.theme-art; topic=theme,art -->

- 原作：寫實軍事 + 殭屍、藍我方 / 紅敵方。
- 改造：殭屍血腥度降到卡通；避免「金幣 ×10」「頭獎」字樣；可改「病毒 vs 白血球」「雪球 vs 雪怪」。

## 可借用 / 要避開
<!-- card: KB-af-gate-lane-shooter.borrow-avoid; kind=lesson -->

- **可借用**：自動前進 + 單指橫移的零學習門檻；數字桶「打不爆就撞」的張力；Boss 倒數。
- **要避開**：廣告不做（或做出與本體不同）的玩法 → ASA 先例：Evony 射數字桶廣告被判違反 CAP Code 3.1，因核心是城建（[ASA ruling 2024-04-03](https://asa.org.uk/rulings/top-games-inc-a23-1213924-top-games-inc.html)）；中國 CADPA 2025-02-06 起也禁止廣告展示遊戲中不存在的玩法（[WN Hub](https://wnhub.io/news/marketing/item-47009)）。我們的廣告必須就是實機畫面。

## 來源
<!-- card: KB-af-gate-lane-shooter.sources -->

- [AppGrowing — How Last War uses proxy minigames（2026-07-16）](https://appgrowing.net/blog/en/how-last-war-uses-proxy-minigames-to-package-strategy-gameplay/)（存取日期 2026-10）
- [Insightrackr — Last War Intelligence（2026-04-07 更新）](https://blog.insightrackr.com/en/docs/LastWarIntelligence)（存取日期 2026-10）
- [Mobilegamer.biz — Data digest, SocialPeta H1 2025（2025-08-20）](https://mobilegamer.biz/data-digest-appsflyers-rumoured-4bn-exit-top-ad-spenders-market-data-plus-company-financials-and-investment-news/)（存取日期 2026-10）
- [Matej Lancaric — The Rise of Sophisticated Onboarding（2025-11）](https://lancaric.substack.com/p/the-rise-of-sophisticated-onboarding)（存取日期 2026-10）
- [Gamigion — Last War 分析](https://www.gamigion.com/?p=24490)（存取日期 2026-10）
- [ASA ruling — Top Games Inc（Evony，2024-04-03）](https://asa.org.uk/rulings/top-games-inc-a23-1213924-top-games-inc.html)（存取日期 2026-10）
- [Notebookcheck — Real War (Not Fake)（2025-12）](https://www.notebookcheck.com/Jemand-hat-tatsaechlich-eines-dieser-Fake-Werbespiele-gemacht-und-es-ist-ueberraschend-gut.1188721.0.html)（存取日期 2026-10）
- [Wikipedia — Those Games（Those Games 2 模式列表）](https://en.wikipedia.org/wiki/Those_Games)（存取日期 2026-10）
- [WN Hub — China CADPA game ad standards（2025-02）](https://wnhub.io/news/marketing/item-47009)（存取日期 2026-10）
- [PTT C_Chat — Last War 營收討論（2026-01-02）](https://www.ptt.cc/bbs/C_Chat/M.1767321519.A.2EB.html)（存取日期 2026-10）
- [百鯨 / DataEye — 出海 SLG 素材（2025-03-24）](https://www.baijing.cn/article/52113)（存取日期 2026-10）
