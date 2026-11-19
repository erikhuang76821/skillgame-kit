# 公車排隊上車（Bus Jam / Crowd Express / Bus Escape）

- **代號**：af-bus-jam
- **類別**：解謎排序 → 乘客分色上車（Parking Jam 後裔：挪車 × 排序）
- **代表作 / 廠商**：Bus Jam — Rollic（iOS id6450176534，商店標示版權 2024）；Crowd Express: Boarding Puzzle — Rollic（挪車 + 上車混合）；Bus Escape: Traffic Jam — ABI Global（越南，2024-09-21 上線）；Bus Out — Zego Global（iKame 系）；Bus Frenzy — CrazyLabs；Bubble Bus、Bus Fever 等
- **投放熱度依據**：
  - **北美營收**：Sensor Tower 美國 2025 Q4 公車類前 5（週營收，季末）：Crowd Express 約 $203K、Bus Escape 約 $112K、Bubble Bus 約 $20K、Bus Fever 約 $10K、Bus Out 約 $8K（[Sensor Tower Q4 2025](https://sensortower.com/blog/2025-q4-unified-top-5-bus-games-revenue-us-60326d74241bc16eb8da0eed)）。Bus Escape 2025 Q1 週營收由約 $101K 升到 $230K、Q2 約 $208K → $248K（Sensor Tower 季報摘要）。
  - **混合休閒榜**：Crowd Express 2025 Q3 混合休閒第 10（$4.5M / 3M 安裝）（[AppMagic Q3](https://appmagic.rocks/blog/q3hybrid2025)）；Bus Escape 名列 Q1 2025 混合休閒前 10（[AppMagic Q1](https://appmagic.rocks/blog/hybridcasual-q1-2025/?hl=en)）。
  - **廣告變現型**：Bus Out 30 天總收 $4.1M，其中廣告 $3.7M、DAU 2.1M（[Felix Braberg 2025-05-30](https://felixbraberg.substack.com/p/the-monetization-engine-behind-magic)）。
  - **衰退案例**：Bus Frenzy（CrazyLabs）2025 Q1 美國週下載由約 162K 掉到 6K、週營收 $42K → $21K（[Sensor Tower Q1 2025](https://sensortower.com/blog/2025-q1-unified-top-5-bus%20games-revenue-us-60326d74241bc16eb8da0eed)）。
  - **台灣**：未取得台灣排名或投放數據（知識缺口）。
- **廣告真實度**：**真實玩法為主**（素材就是火柴人排隊上車；未取得逐支素材分析，未證實）。
- **技巧 vs 選擇 vs 運氣**：關卡固定、資訊大多可見（有隱藏乘客障礙）；純順序規劃，原作無計時（Crowd Express 後期有發車計時）。

## 一句話玩法

點選能走出人群的乘客上同色公車，等候格塞滿就輸。

## 為什麼廣告有效（Hook）

| 元素 | 說明 |
|---|---|
| 前 3 秒畫面 | 擁擠的彩色火柴人方陣，上方停著一輛紅色公車，下方一排空的等候格。 |
| 失敗誘導（fail bait） | 示範者點了一堆不對色的乘客，等候格被塞滿最後 1 格 → 失敗。 |
| 「我來一定行」的錯誤示範 | 觀眾看到紅色乘客就在角落、只要先移開前面兩個藍的就出得來。 |
| 爽感 / 解壓點 | 乘客小跑步上車、公車坐滿開走、下一輛滑進來的節奏；整個方陣被清空。 |

## 遊戲規格

### 核心循環
1. 盤面：格子上站滿各色乘客（部分格為牆 / 障礙）。
2. 上方：公車佇列，最前一輛是當前可上車的顏色。
3. 點擊乘客：只有**有通路可走到出口**的乘客可點（被包在人群中的不行，推定規則，Rollic 說明未明寫，未證實）。
4. 顏色符合 → 上車；不符 → 走到等候格站著。
5. 公車坐滿 → 開走 → 下一輛進站；等候格內同色乘客自動上車。
6. 所有乘客上車 = 過關；**沒有空的等候格** = 失敗（Rollic 官方）。

### 規則與勝負
- 等候格數：Rollic 官方未給固定數（常見 5–7 格，未證實）；同類 Bus Stop Jam 網頁版另給 5 個「額外座位」當緩衝（第三方描述）。
- 公車容量：官方未給（常見 3 人，未證實）；另一同類作描述公車 8 人、月台 64 人、每批 12 人進站（第三方，非 Rollic）。
- 每關各色乘客數不同，必須全部上車（官方）。
- 生命：失敗扣 1 命（官方）。
- 障礙（官方 FAQ 有「Obstacles」條目，內容未取得；同類作見：隱藏乘客、隧道持續吐人、冰凍格，未證實）。
- Crowd Express 變體：先挪開車輛清出路徑，再讓乘客上同色車；後期加入「定時發車」——就算座位滿了也要等到發車時間（App Store 更新說明）。

### 操作
- 單點乘客。Crowd Express / Bus Escape 另需點車輛使其沿車頭方向駛離（車頭方向箭頭限制行進）。

### 關卡結構與難度曲線
| 關卡段 | 新元素 | 難度槓桿 |
|---|---|---|
| 入門 | 2–3 色、開放方陣 | 等候格寬裕、公車順序友善 |
| 中期 | 牆、窄通道、隱藏乘客 | 可達性（誰出得來）與公車順序錯位 |
| 後期 | Hard / Super Hard 標記關 | 玩家評論稱約第 199、397 關不用道具很難過（App Store 評論，未證實） |

### 計分 / 星等 / 獎勵
- 過關給金幣；看廣告可把金幣加倍（官方）。

### 失敗與轉換點（廣告續命、IAP、導流到主遊戲的位置）
- 道具（Rollic 官方）：**Undo**（撤銷上一步）、**Extra Tile**（多 1 格等候格，乘客上車後該格消失）、**Color Picker**（從任何位置抓一個符合當前公車顏色的乘客直接上車）、**Extra Bus**（可往後一輛車上人，後車在前車開走後才走）。
- 金幣買道具、額外格、外觀（官方）。
- IAP 價目（美國 App Store）：Coin Pack 550 $1.99、No Ads $3.99、Starter Bundle $4.99、Coin Pack 2750 $7.99、Unlimited Lives And Coins $9.99、Mega Bundle $19.99 等（[App Store](https://apps.apple.com/us/app/bus-jam/id6450176534)）。
- Crowd Express：每日挑戰、Battle Pass 等 LiveOps 從早期關卡逐步解鎖（AppMagic Q3）。

## 可玩廣告（Playable Ad）結構

- 推測（未取得實際可玩，未證實）：0–2 秒 5×5 小方陣 + 紅公車 + 手指提示點邊緣紅人 → 3–6 次點擊送走 2 輛車 → 第 3 輛車的顏色全被包在中間、等候格剩 1 → CTA。

## 技巧要素

| 技巧 | 影響 |
|---|---|
| 可達性判讀（先挖路） | 主技巧：先移開會擋路的人 |
| 公車順序對齊 | 盡量讓等候格的人能接上下一輛車 |
| 等候格水位 | 失敗條件 |
| 挪車順序（Crowd Express） | 多一層依賴 |

## 隨機 / 選擇噱頭

- 原作無隨機；困難感來自「公車順序」與「人群中顏色分布」的錯位設計。
- Color Picker、Extra Tile 直接用錢解掉錯位 → 付費點。

## Skill Game 化改造（必做）

> 用這份規格書做遊戲時（含「復刻」），玩法規格 `gdd/05_game_spec.md` §13 要逐條回應下列每一條：採用就寫本作做法，不採用就寫理由與替代做法。「復刻」只復刻玩法結構與操作，不跳過本節（`RULE-AF-ADAPTATION`，`npm run audit` 檢查）。

1. **同種子**：從手工關卡池抽 5 關；可鏡像、顏色置換。
2. **資訊對等**：公車佇列顯示當前 + 後 3 輛；隱藏乘客改成「可見但不可點」的上鎖狀態。
3. **加入時間**：每關 45 秒；時間到不判死，以已上車人數計分。
4. **計分公式**（建議）：
   - 乘客直接上車 +10；經等候格再上車 +5
   - 公車滿載開走 +30
   - 清關 +300 + 剩餘秒數 × 10 + 剩餘空等候格 × 20
   - 等候格全滿：該關結束、保留分數
5. **操作技巧（可選）**：乘客走路需時間，點擊可排隊（輸入佇列），連點節奏影響完成時間 → 時間分形成技巧天花板。
6. **確定性**：可達性每 tick 以 BFS 從出口反向擴散計算（格數 ≤ 120，成本低）；走路以格為單位、固定速度；所有判定在 sim，GSAP 只做跑步動畫。
7. **移除付費影響**：無 Undo / Extra Tile / Color Picker / Extra Bus 購買；若保留 Undo，每局固定 2 次且使用扣 20 分。
8. **對戰形式**：非同步同種子 5 關 ≈ 4 分鐘；排行榜或 1v1 比分。

## HTML5 輕量實作規格

| 項目 | 規格 |
|---|---|
| 畫面 | 直版 720×1280；上方公車道（當前車 + 預覽 3 輛）；中段等候格 1 列；下方方陣 6×8～10×12 格（原作尺寸未證實），每格 56–80 px |
| 實體與資料結構 | `grid: Uint8Array(W*H)`（0 空、1 牆、2 乘客）；`riders[]{id, color, cell, state: idle/walking/waiting/boarded, locked}`；`reach: Uint8Array`（BFS 結果，1 = 可點）；`buses: Queue<{color, cap, seated}>`；`bench[N]`；`events[]` |
| 關鍵參數 | sim 60 Hz；走速 1 格 / 6 tick；等候格 5（未證實，可調 5–7）；公車容量 3（未證實）；每關 45 s；換車動畫 400 ms（sim 中為固定 24 tick 鎖定期） |
| 渲染 / Draw Call 估計 | 火柴人（3 幀跑步，灰階 tint）、公車、等候格、地磚共用 1 atlas：1 DC；分數 BitmapText 1 DC → **約 2–3 DC**；乘客最多約 120 個 sprite，batch 無壓力 |
| 美術資產清單 | 火柴人 idle 1 + run 3 幀、公車（車身灰階 tint + 窗）、地磚 2、牆 1、等候格 1、鎖頭 1、背景 1 |
| 包體估計 | 程式 0.8 MB；atlas 0.2 MB；關卡 JSON 300 關 ≈ 0.15 MB；音效 0.2 MB；BGM 1.5 MB → **≈ 2.9 MB** |

## 主題與美術風格

- 原作：低多邊形火柴人、卡通公車、亮色地磚。
- 改造：「小雞回同色雞窩」「乘客搭纜車 / 遊樂設施」皆可；台灣在地可做「捷運排隊上車」（注意捷運公司商標與配色）。

## 可借用 / 要避開

- **可借用**：BFS 可達性帶來的「挖路」規劃；公車佇列 × 等候格雙壓力；乘客小跑步的生命感（便宜又討喜）。
- **要避開**：只靠道具才能過的 Super Hard 關；生命制與「無限生命 + 金幣」付費包；Bus Frenzy 式的純換皮快速衰退。

## 來源

- [Rollic Help Center — How to play Bus Jam](https://rollic.helpshift.com/hc/en/13-bus-jam/faq/331-how-to-play-bus-jam/)（存取日期 2026-10）
- [Rollic Help Center — Bus Jam Boosters](https://rollic.helpshift.com/hc/en/13-bus-jam/faq/333-what-are-the-boosters-how-can-i-use-them/?p=all)（存取日期 2026-10）
- [Rollic Help Center — Bus Jam Gameplay section](https://rollic.helpshift.com/hc/en/13-bus-jam/section/123-gameplay/)（存取日期 2026-10）
- [App Store — Bus Jam（Rollic）](https://apps.apple.com/us/app/bus-jam/id6450176534)（存取日期 2026-10）
- [Sensor Tower — Top 5 Bus Games revenue US Q4 2025](https://sensortower.com/blog/2025-q4-unified-top-5-bus-games-revenue-us-60326d74241bc16eb8da0eed)（存取日期 2026-10）
- [Sensor Tower — Top 5 Bus Games revenue US Q1 2025](https://sensortower.com/blog/2025-q1-unified-top-5-bus%20games-revenue-us-60326d74241bc16eb8da0eed)（存取日期 2026-10）
- [AppMagic — Top 10 Hybridcasual Games in Q3 2025](https://appmagic.rocks/blog/q3hybrid2025)（存取日期 2026-10）
- [AppMagic — Top 10 Hybridcasual Games in Q1 2025](https://appmagic.rocks/blog/hybridcasual-q1-2025/?hl=en)（存取日期 2026-10）
- [Felix Braberg — The monetization engine behind Magic Sort（2025-05-30）](https://felixbraberg.substack.com/p/the-monetization-engine-behind-magic)（存取日期 2026-10）
- [AppGoblin — Bus Escape: Traffic Jam](https://www.appgoblin.info/apps/6689516366)（存取日期 2026-10）
- [App Store — Crowd Express: Boarding Puzzle](https://apps.apple.com/DE/app/id6477849277)（存取日期 2026-10）
- [App Store — Bus Station Jam: 3D Parking（同類規則參考）](https://apps.apple.com/us/app/crazy-bus-%EC%A3%BC%EC%B0%A8-%ED%98%BC%EC%9E%A1%EC%9D%98-%EC%A3%BC%EC%B0%A8%EA%B2%8C%EC%9E%84/id6683297723?l=ru)（存取日期 2026-10）
