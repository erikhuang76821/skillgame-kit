# 群體加乘門跑酷（Crowd Gate Runner：Count Masters / Mob Control）

- **代號**：af-gate-runner
- **類別**：跑酷軍團（群體人數加乘）
- **代表作 / 廠商**：Mob Control — Voodoo（上線年 2021，未證實）；Count Masters: Crowd Runner 3D — Freeplay（2021，未證實）；Clash 3D（Singular 2025 文中舉例，廠商未證實）；Last War: Survival、Evony: The King's Return 等 4X 在廣告與新手段借用同一格式（見 [af-gate-lane-shooter](af-gate-lane-shooter.md)）
- **投放熱度依據**：
  - 2025-04 Singular Growth Masterminds 訪談中，Geeklab 共同創辦人稱「過門」（gated）素材是當下最有效的廣告格式，並指出 4X、idle merge、塔防都在用（北美 UA 圈觀點，[Singular 2025-04-07](https://www.singular.net/blog/mobile-game-ad-creative/)）。
  - Mob Control：Voodoo 2025 年報把 Mob Control 列為公司轉向 casual franchise 的代表作（[Voodoo 2026-03-11](https://voodoo.io/news/2025-a-year-of-growth-and-transformation-for-voodoo)）；Udonis 引 AppMagic：累計下載約 3.02 億、累計營收約 7,750 萬美元、美國占終身營收約 58%、印度下載第一、D30 留存 4.7%，廣告主打「人群穿門倍增、塞滿螢幕、攻破基地」（[Udonis 2026-07-02](https://www.blog.udonis.co/mobile-marketing/mobile-games/mob-control)）。
  - 台灣：未找到 2025–2026 台灣市場此格式獨立投放數據（未證實）。
- **廣告真實度**：Mob Control / Count Masters 為**真實玩法**（廣告即本體）；被 4X 借用時為**部分真實～假玩法**（見 gate-lane-shooter）。
- **技巧 vs 選擇 vs 運氣**：原作以「選左門或右門」的算術選擇為主，技巧只有少量走位/瞄準；運氣低但技巧天花板也低。

## 一句話玩法

左右拖曳帶領人群穿過「+N / ×N」門，以人海攻破終點敵陣。

## 為什麼廣告有效（Hook）

| 元素 | 說明 |
|---|---|
| 前 3 秒畫面 | 一個小人 → 穿過 ×5 門瞬間變一群；畫面被藍色人海塞滿，數字在頭頂暴漲（Udonis 描述的「crowds filling the screen」）。 |
| 失敗誘導（fail bait） | 示範者刻意選「−20」或「÷2」門，人數掉到個位數撞上紅色大軍全滅；觀眾立刻看出「應該選右邊」。Udonis 指出 Mob Control 素材常用「can you beat this level?」式失敗鉤子。 |
| 「我來一定行」的錯誤示範 | 門上的數字一目了然，算術判斷門檻極低，觀眾產生「我一定選得對」的優越感 → 下載。 |
| 爽感 / 解壓點 | 數字指數成長、人群淹沒敵方、終點基地崩塌；聲音是連續「啵啵啵」計數音。 |

## 遊戲規格

> 以下「建議值」為本工作室改造用的規格提案；原作實際數值未取得者標註（未證實）。

### 核心循環
1. 起點人群 N₀（建議 1–10）。
2. 自動前進，玩家左右拖曳控制群體中心 x。
3. 每段路有 1 組門（2–3 扇並列），穿過的門對**穿過的那部分人**生效（Count Masters 是整群穿同一扇；Mob Control 是砲台逐個射出、每個單位各自穿門 — 兩種模型差異大）。
4. 中途障礙：鋸片、擺錘、敵小隊（一換一抵消）。
5. 終點：與敵方人群 / 塔 / 基地對撞，人數相減，剩餘人數 > 0 即勝；有時剩餘人數換金幣或爬「階梯倍率」。

### 規則與勝負
- 門運算：`+a`、`−a`、`×k`、`÷k`（取整規則需明定，建議向下取整，最少 0）。
- 敵我接觸：1 換 1 抵消（Count Masters 型），或 HP 制（Mob Control 冠軍單位有 HP，未證實）。
- 勝：終點時己方 > 0；敗：人數歸 0。

### 操作
- 單指左右拖曳（Count Masters）；或按住連射、拖曳移動砲口（Mob Control）。

### 關卡結構與難度曲線
| 關卡段 | 新元素 | 難度槓桿 |
|---|---|---|
| 1–5 | 只有 + / × 門 | 兩門差距大、無障礙 |
| 6–20 | − / ÷ 門、側滾障礙 | 好門被障礙擋住，需繞行 |
| 21–50 | 移動門、會旋轉的門、敵方攔截小隊 | 門寬縮小、門會左右移動 |
| 50+ | Boss 塔、冠軍單位（Mob Control） | 終點敵數門檻上升 |

### 計分 / 星等 / 獎勵
- 原作：剩餘人數 × 倍率階梯 → 金幣；金幣升級起始人數 / 砲台射速（**付費影響結果**，Skill Game 必須移除）。

### 失敗與轉換點（廣告續命、IAP、導流到主遊戲的位置）
- Mob Control：收入約一半廣告一半 IAP；Season Pass 為最大 IAP 品項（約 20%），去廣告商品與激勵影片合計 18%+（Udonis 2026）。
- 失敗後「看廣告保留進度 / 多 +50 人」；勝利後「看廣告 ×3 金幣」。
- 4X 借用時：跑完 3–5 關即切入主城建造（見 gate-lane-shooter）。

## 可玩廣告（Playable Ad）結構

- 約 15–30 秒（Reforged Labs × SocialPeta 統計影片素材最常見長度 15–30 秒占 43.1%；playable 長度未證實）。
- 互動 2–3 步：拖曳選門 ×2 → 終點對撞。
- 第一門故意設「兩門都好但一個更好」，第二門設陷阱（−門在中間、×門在邊緣障礙後）。
- 失敗或成功都在 ~10 秒內結束，跳出 CTA「Play Now」，結束畫面是巨大人群特寫。

## 技巧要素

| 技巧 | 影響 |
|---|---|
| 讀門（算術最優） | 原作主要決策，但一眼可解，深度低 |
| 走位繞障礙 | 人群寬度隨人數變大，越多人越難穿窄縫 → 真技巧 |
| 拆群（Mob Control 逐個射） | 掃射角度決定多少單位穿哪扇門 → 瞄準技巧 |
| 時機（移動門） | 抓門的相位 |

## 隨機 / 選擇噱頭

- 門的數字通常固定，**沒有隨機**，但也沒有真正的抉擇：最優解永遠是「選數字最大的」。
- 真正左右勝負的是局外升級（起始人數、射速）——這是付費槓桿。

## Skill Game 化改造（必做）

> 用這份規格書做遊戲時（含「復刻」），玩法規格 `gdd/05_game_spec.md` §13 要逐條回應下列每一條：採用就寫本作做法，不採用就寫理由與替代做法。「復刻」只復刻玩法結構與操作，不跳過本節（`RULE-AF-ADAPTATION`，`npm run audit` 檢查）。

1. **把「選門」改成「分配」**：人群是連續寬度（每個單位一個 x），門的寬度有限；玩家用拖曳把人群切過兩扇門，比例由走位精度決定（例：30% 走 +40、70% 走 ×2）。最優比例需心算 + 精確操作。
2. **Mob Control 式掃射**：砲口按住連射（固定射速 10 發/s，建議），每發一個單位；掃射角度決定落在哪扇門 → 瞄準技巧。單位數上限讓「全部塞 ×門」不可行（×門有容量 cap，超過的單位被彈回）。
3. **障礙與人群寬度**：人群半徑 r = c·√N（建議 c=6 px），人越多越難穿縫；鋸片每接觸 1 tick 損失 1 人 → 走位精度直接換分數。
4. **同種子**：關卡序列由 `rng(seed,"course",i)` 生成，對戰雙方同一條賽道；無局外升級、無看廣告 +人。
5. **計分公式（建議）**：`Score = 終點剩餘人數 × 10 + 擊破敵數 × 5 + 無傷段數 × 50 − 用時(秒) × 2`。全部項目結算逐列顯示（E4）。
6. **局長**：60–90 秒一條賽道（4–6 組門 + 終點）；非同步同種子 PvP 或排行榜。
7. **反選擇噱頭**：門值設計成「最大數字不一定最優」——例如 ×3 門後緊接窄縫鋸片，人多反而虧；或 +60 門位於移動障礙後，需要時機。

## HTML5 輕量實作規格

| 項目 | 規格 |
|---|---|
| 畫面 | 直版 9:16，邏輯解析度 720×1280（世界視窗固定，見 04_tech-stack §7）；俯視 45° 偽 3D 或純 2D 俯視 |
| 實體與資料結構 | `units: Int32Array`（x,y 子像素 1/256、alive）SoA，上限 500；`gates[]{x,w,op,val,cap}`；`hazards[]`；`enemies` 同 SoA；群體以 boids 簡化：目標點 = 玩家 x，單位只做「朝目標 + 鄰居分離」，鄰居查詢用空間雜湊依 id 排序 |
| 關鍵參數 | 前進速度 320 px/s；拖曳靈敏度 1:1；人群半徑 c·√N（c=6）；門寬 200 px；×門容量 cap 150；終點敵數由種子決定 |
| 渲染 / Draw Call 估計 | 單位全部用同一 atlas 的 Sprite（或 Pixi 8 `ParticleContainer`）→ 同材質合批 **1 DC**（500 個也是 1）；地面/賽道 1；門 + 障礙 + 敵（同 atlas）1；人數數字用 BitmapText 1；合計 **3–4 DC**。禁用 filter；人群陰影用 sprite 內建。若做 3D 版：小人 instancing 1 DC + 地面 1 + 門 1 ≈ 3–5 DC |
| 美術資產清單 | 小人 2 色 × 跑步 4 幀（各 32×32）、門框 2 款、數字字型 BitmapFont、鋸片/擺錘 3 款、終點塔 1、碎裂特效以 sprite 擴散環代替粒子系統 |
| 包體估計 | 程式 + Pixi ≈ 0.9 MB；atlas ≈ 0.3 MB；音效 0.2 MB；BGM 1 首 1.5 MB → **≈ 3 MB** |

## 主題與美術風格

- 原作：極簡低多邊形、藍 vs 紅、白底跑道；辨識度來自「數字 + 顏色」。
- 改造建議：避開博弈視覺（不用金幣噴發、老虎機式倍率滾動）；可換成「螞蟻搬家」「蜂群」「雪人軍團」等自有 IP。

## 可借用 / 要避開

- **可借用**：人數數字暴漲的視覺回饋；人群寬度與窄縫的物理張力；終點對撞的一次性結算。
- **要避開**：局外升級（起始人數、射速）——錢買分數；「看廣告 +人」；「÷門」取整規則不透明；門值一眼可解的假抉擇。

## 來源

- [Singular — mobile game ad creative（2025-04-07）](https://www.singular.net/blog/mobile-game-ad-creative/)（存取日期 2026-10）
- [Udonis — Mob Control（2026-07-02，引 AppMagic）](https://www.blog.udonis.co/mobile-marketing/mobile-games/mob-control)（存取日期 2026-10）
- [Voodoo — 2025: a year of growth and transformation（2026-03-11）](https://voodoo.io/news/2025-a-year-of-growth-and-transformation-for-voodoo)（存取日期 2026-10）
- [GameDevReports — SocialPeta × Reforged Labs: Mobile Game Creative Trends in 2025（2026-01-02）](https://gamedevreports.substack.com/p/socialpeta-and-reforged-labs-mobile)（存取日期 2026-10）
