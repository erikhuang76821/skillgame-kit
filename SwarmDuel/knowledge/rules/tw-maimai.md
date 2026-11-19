# maimai DX（maimai でらっくす International ver.）

- **代號**：tw-maimai
- **市場**：台灣
- **形態**：店面技巧機台（音樂節奏機，圓形觸控螢幕；百貨遊樂場、連鎖遊藝場）
- **代表產品 / 廠商**：maimai DX International ver.（英文介面海外版）— SEGA
- **熱度依據**：
  - 官方海外版投放地區明列台灣（另有東南亞、香港、韓國、澳紐、美加），中國另有簡中「舞萌DX」（Wikipedia）。
  - 版本節奏：海外版約落後日本半年，2025-01 PRiSM、2025-07 PRiSM PLUS、2026-01 CiRCLE、2026-07 CiRCLE PLUS；日本 2026-09 推出 MAGiCAL，海外未定。
  - SEGA 2025-03 於 Amusement Expo 稱全球售出超過 6,000 台；2025-09 起美國 Round1 正式出貨。
  - 官方大賽「KING of Performai The 8th」（KOP8th）設 International ver. 部門（maimai DX、CHUNITHM），提供繁體中文特設頁；線上預選 2026-10-29～11-23，決賽 2027-02-14 東京國際論壇 B7（Saiganak）。台灣玩家是否可報名（未證實）。
  - 台灣設機店數、台數：（未證實）；Toy People 形容其圓形螢幕在台灣遊樂場「很容易辨識」。
- **技巧 vs 運氣**：純技巧（固定譜面、判定窗與配分表），無隨機。

## 一句話玩法

在洗衣機造型的圓形觸控螢幕周圍按 8 顆按鈕、滑動與觸碰，依判定累積「達成率」，80% 以上即通關。

## 規則書

### 勝負條件
- **通關**：達成率 ≥ 80.0000%（評價 A 以上）。
- **最高達成率 101.0000%**：基礎 100%（全部音符 PERFECT 以上）＋ BREAK 額外獎勵 1%。
- **對戰 / 合作**：同機或連線的「好友對戰」比達成率；雙人同步（Sync）另有 Full Sync 評價。
- **KOP 預選**：指定曲（例 KOP8th 「ATLAS RUSH」等）在指定店舖演奏，以分數排名。

### 單局流程
1. 投幣（價格、每幣曲數依店家設定（未證實））；刷 Aime / 相容卡登入。
2. 選曲、選難度：BASIC、ADVANCED、EXPERT、MASTER、Re:MASTER（部分曲）；等級 1–15，多數等級有「+」。內部「譜面定數」更精細（例：13.6）。
3. 演奏：音符由中心往外圈 8 個方位移動，到達外框時按對應按鈕或觸碰。
4. 結算：達成率、評價、Combo 成就、DX 分數星數、Rating 變動。
5. 一次投幣通常可玩數首（常見 3 首（未證實））。

### 計分規則
**音符與判定**：判定分 CRITICAL PERFECT / PERFECT / GREAT / GOOD / MISS，並顯示 FAST / LATE。

| 音符（每顆基礎分） | CRITICAL PERFECT | PERFECT | GREAT | GOOD | MISS |
|---|---|---|---|---|---|
| TAP / TOUCH | 500 | 500 | 400 | 250 | 0 |
| HOLD / TOUCH HOLD | 1000 | 1000 | 800 | 500 | 0 |
| SLIDE | 1500 | 1500 | 1200 | 750 | 0 |
| BREAK 基礎分 | 2500 | 2500（高）/ 2500（低） | 2000 / 1500 / 1250（高／中／低） | 1000 | 0 |
| BREAK 額外獎勵分 | 100 | 75（高）/ 50（低） | 40 | 30 | 0 |

- 權重相當於 TAP / TOUCH = 1、HOLD = 2、SLIDE = 3、BREAK = 5。
- **達成率** = （基礎得分 ÷ 基礎滿分）× 100% ＋（BREAK 獎勵分 ÷ BREAK 獎勵滿分）× 1%。
- **EX 音符**：寬鬆判定，觸到即為最高判定（論文稱 auto perfect）。

**評價門檻與 Rating 係數**
| 達成率 ≥ | 評價 | Rating 係數（第 3 代起） |
|---|---|---|
| 100.5% | SSS+ | 22.4 |
| 100.0% | SSS | 21.6 |
| 99.5% | SS+ | 21.1 |
| 99.0% | SS | 20.8 |
| 98.0% | S+ | 20.3 |
| 97.0% | S | 20.0 |
| 94.0% | AAA | 16.8 |
| 90.0% | AA | 15.2 |
| 80.0% | A（通關線） | 13.6 |
| 75.0% | BBB | 12.0 |
| 70.0% | BB | 11.2 |
| 60.0% | B | 9.6 |
| 50.0% | C | 8.0 |
| < 50% | D | 5.0 |

- **單曲 Rating** = 譜面定數 × 係數 × min(達成率, 100.5%)，捨去小數。例：定數 14.4、99.8056% → 14.4 × 0.211 × 99.8056 ≈ 303。
- **總 Rating** = 舊曲最佳 35 首 ＋ 新版本最佳 15 首（第 3 代起；段位不再計入）。
- Rating 顏色：白 <1000、藍、綠、黃、紅、紫、銅 12000+、銀 13000+、金 14000+、白金 14500+、彩 15000+；CiRCLE PLUS 起彩框再細分 1–4★（16000+ 為「極」彩框）。

**Combo 成就**
| 成就 | 條件 |
|---|---|
| FC（Full Combo） | 全部 GOOD 以上 |
| FC+ | 全部 GREAT 以上 |
| AP（All Perfect） | 全部 PERFECT 以上 |
| AP+ | 全部 CRITICAL PERFECT（論文寫法為「全部 PERFECT 以上且 BREAK 全為 CRITICAL」，定義差異（未證實）） |

**DX 分數（純精準度指標）**：CRITICAL PERFECT 3、PERFECT 2、GREAT 1、GOOD / MISS 0。星數：≥85% ★1、≥90% ★2、≥93% ★3、≥95% ★4、≥97% ★5（以滿分 DX 分數百分比計）。

### 操作
- 圓形觸控螢幕＋外圈 8 顆實體按鈕；TAP 按鈕或觸碰外圈、HOLD 長按、SLIDE 沿星形路徑滑動、TOUCH 觸碰螢幕內區塊、BREAK 為高配分特殊音符、同時出現的「雙押」音符顯示黃色。
- 兩台並排，可雙人同步遊玩；玩家常戴手套降低摩擦。

### 公平機制（同種子、同牌序、配對、防作弊）
- **完全確定性**：同譜面、同判定、同配分；全球海外版統一版本。
- **譜面定數**：用隱藏小數定數取代粗略等級計算 Rating，避免「水曲」灌分。
- **Rating 上限 100.5%**：超過 SSS+ 的微小差距不再加 Rating，減少邊際刷分。
- **新舊曲分池（35＋15）**：新版本曲有獨立名額，維持新內容誘因又不讓老玩家優勢無限擴大。
- **卡片綁定 + 官方網（maimai DX NET）**：紀錄集中於伺服器；大會指定曲與指定店舖。

## 技巧要素

| 技巧 | 影響 |
|---|---|
| 時機精準度 | CRITICAL PERFECT 比例、DX 分數 |
| BREAK 處理 | 高權重（5 倍）＋額外 1%，決定 100.5% 以上 |
| 讀譜（星形滑動路徑） | 避免手部交叉卡住 |
| 手部配置 / 雙手交替 | 高等級譜面必要 |
| 選曲策略 | 依譜面定數選擇最有效的 Rating 曲 |

## 隨機 / 運氣來源

- 無遊戲內隨機；機台螢幕感度、按鈕回饋等維護差異。

## 參賽與變現

- 投幣按次；Aime 卡；官方網路服務（付費會員方案（未證實））。
- 每半年大版本更新＋季節活動；聯名曲（VOCALOID、動畫、東方、遊戲音樂）。
- KOP 全國／國際大賽（線上預選＋現場決賽）。

## 主題與美術風格

- 洗衣機造型白色筐體、圓形螢幕；明亮粉彩、可愛角色（でらっくま、ちほー地圖）；選曲以 J-POP、VOCALOID、東方 Project、遊戲曲、SEGA 原創曲為主。

## 可借用的設計點

- **101% 制**：100% 基礎＋1% 「完美加分」，讓高手有額外天花板、新手仍有清楚 100%。
- **加權音符**：用權重（1/2/3/5）表達音符難度，而非單純數量。
- **雙指標：達成率（含權重）＋DX 分數（純準確度）**：給不同類型玩家不同的追求目標。
- **隱藏定數 Rating + 新舊曲分池**：長線、可量化的技巧成長曲線。
- **圓形 8 方位操作**：身體性強、圍觀性強，適合實體機台差異化。

## 法規 / 風險備註

- 屬益智類電子遊戲機，設於普通級電子遊戲場；2025-10 修正法規要求機台介面正體中文（益智類簡體介面 2028-09-30 後不得營業）——maimai 海外版為英文介面，是否需另行在地化（未證實）。
- 大會若發獎金，須注意以名次給獎、固定報名費之競賽形式。

## 來源

- [Maimai (video game series)（Wikipedia）](https://en.wikipedia.org/wiki/Maimai_(video_game_series))（存取日期 2026-10）
- [maimai DX:Rating（RemyWiki）](https://silentblue.remywiki.com/maimai_DX:Rating)（存取日期 2026-10）
- [maimai DX 計分數學分析（ITB 離散數學論文 2023）](https://informatika.stei.itb.ac.id/~rinaldi.munir/Matdis/2023-2024/Makalah2023/Makalah-Matdis-2023%20(99).pdf)（存取日期 2026-10）
- [Maimai DX（萌娘百科）](https://mzh.moegirl.org.cn/Maimai_DX)（存取日期 2026-10）
- [KING of Performai The 8th 線上預賽（Saiganak 繁中）](https://saiganak.com/zh/event/sega-kop8th-announcement/)（存取日期 2026-10）
- [SEGA maimai DX at Amusement Expo（SEGA Arcade）](https://segaarcade.com/news/sega-amusements-ignites-us-rhythm-game-scene-with-maimai-dx-at-amusement-expo)（存取日期 2026-10）
- [maimai DX starts shipping across USA（Arcade Heroes 2025-09-22）](https://arcadeheroes.com/2025/09/22/segas-maimai-dx-starts-shipping-out-across-usa/)（存取日期 2026-10）
- [maimai 在台灣（Toy People）](https://www.toy-people.com/?p=91817)（存取日期 2026-10）
