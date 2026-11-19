---
id: KB-ad-funnel-games
kind: research
topic: [market, design]
genre: ["*"]
reviewedAt: 2026-10-21
---
# 16 廣告導流玩法 — 2025–2026 熱門素材的規格書

> 調查 2025–2026 在台灣、北美買量廣告中最紅的玩法，每款一份遊戲說明／規格書，含「怎麼改成 skill game」與 HTML5 輕量實作估算。
> 規格書：[ad-funnel/](ad-funnel/)（17 份，範本 [_TEMPLATE_spec.md](ad-funnel/_TEMPLATE_spec.md)）；趨勢筆記：[_notes-sort-jam.md](ad-funnel/_notes-sort-jam.md)、[_notes-runner-fake-ads.md](ad-funnel/_notes-runner-fake-ads.md)。營收／下載均為第三方估算；原作沒查到的數值標「（未證實）」，我們自己提的設計值標「建議值」。

## 0. 一眼結論
<!-- card: KB-ad-funnel-games.summary -->

| # | 結論 |
|---|---|
| 1 | 兩大波：**解謎排序（jam / sort）**——Block Blast 2025 全球下載第 1、Arrows 2026-05 下載第 1、Pixel Flow 一年 IAP 破 1.25 億美元；**4X 導流小遊戲**——Last War（2025 Q2 全球 IAP 第 1）、Kingshot、Whiteout Survival 用過門射擊、割草守城、過橋跑酷當開場。 |
| 2 | 解謎排序類的共同核心是「**有限暫存區被塞滿就輸**」（螺絲 5 孔、Pixel Flow 5 格、三消 7 槽）。盤面大多已是確定性 → 改成 skill game 成本最低。 |
| 3 | 跑酷／假玩法類多半是「**選擇噱頭**」（選大的門、吃小的怪），一眼可解，不能直接當競技核心；必須加入連續控制量（走位、時機、瞄準、流量、分配比例）。 |
| 4 | 監管方向一致：**廣告要代表核心體驗**，免責字樣無效（英國 ASA 2020 Playrix、2024 Evony 案；Apple 2.3.1(a)）。我們的遊戲本身就是廣告裡的那個小遊戲 → 可當賣點（參考 *Real War (Not Fake)*）。 |
| 5 | 台灣（港澳台）每廣告主月素材量與北美並列全球最高；台灣偏好 roguelite 割草（Capybara Go! 約 80% 營收來自台日韓）與 SLG；北美偏 4X、gate、名人。 |
| 6 | 17 款全部可在 **2–6 DC、≈ 2.4–4.6 MB** 內實作，符合 [04 技術框架](04_tech-stack.md) 的預算。 |

## 1. 規格書索引
<!-- card: KB-ad-funnel-games.spec-index -->

### 1.1 解謎排序（jam / sort）

| 規格書 | 代表作 | 熱度 | 廣告真實度 | 技巧型態 | DC / 包體 |
|---|---|---|---|---|---|
| [方塊擺放消行](ad-funnel/af-block-blast.md) | Block Blast! | 2024、2025 全球下載第 1 | 部分真實（大量無關開場） | 規劃；原作出塊隨機＋疑似 DDA | 2–3 / 2.7 MB |
| [箭頭依序脫出](ad-funnel/af-arrows-escape.md) | Arrows – Puzzle Escape | 2026-05 全球下載第 1 | 推定實機 | 純選擇、無計時 | 3 / 2.4 MB（去 BGM < 1 MB） |
| [輸送帶射色清圖](ad-funnel/af-pixel-flow.md) | Pixel Flow! | 一年 IAP > 1.25 億美元；美國 75% 曝光來自可玩廣告 | 真實為主 | 排序＋連點手速（少見雙技巧） | 3 / 2.9 MB |
| [色塊滑門](ad-funnel/af-color-block-jam.md) | Color Block Jam | 2025 連三季混合休閒收入第 1 | 真實 | 路徑規劃＋倒數 | 2–3 / 2.9 MB |
| [拆螺絲分色](ad-funnel/af-screw-jam.md) | Screw Jam / Screwdom | 累計 1.2 億美元；子類降溫中 | 真實為主 | 順序選擇 | 2–3 / — |
| [公車排隊上車](ad-funnel/af-bus-jam.md) | Bus Jam / Crowd Express | 美國 2025 Q4 公車類第 1：Crowd Express | 真實為主 | 順序規劃；走路時間帶手速 | 2–3 / 2.9 MB |
| [倒水分色](ad-funnel/af-magic-sort.md) | Magic Sort!（含 Hexa / Coin Sort） | 30 天占排序前 10 IAP 的 43% | 未證實 | 純選擇；可程序生成 | 2 / 2.6 MB |
| [3D 三消收集](ad-funnel/af-match-factory.md) | Match Factory! | 占 2025 H1 Match-3D 子類 56% | 部分真實 | 視覺搜尋＋槽位管理；原作物理堆疊有隨機 | 2–3 / 3.3 MB |

### 1.2 跑酷 / 4X 導流 / 假玩法

| 規格書 | 代表作 | 熱度 | 廣告真實度 | 技巧型態 | DC / 包體 |
|---|---|---|---|---|---|
| [群體加乘門跑酷](ad-funnel/af-gate-runner.md) | Mob Control、Count Masters | Mob Control 約 3 億下載；業界稱過門是最有效素材格式 | 原作真實；被 4X 借用時部分真實 | 算術選擇為主 | 3–4 / 3 MB |
| [加乘門射擊跑道](ad-funnel/af-gate-lane-shooter.md) | Last War、Evony 數字桶 | Last War 2025 Q2 全球 IAP 第 1 | 部分真實；Evony 被 ASA 判違規 | 選門＋輕度閃避 | 4–5 / 3.6 MB |
| [疊磚過橋＋合成](ad-funnel/af-bridge-run-merge.md) | Last War 2026 素材 | 2026 年 6–7 月抽樣 157 支中 ≥ 30 支 | 部分真實 | 原型有走位搶磚；代理版低 | 3（3D 5）/ 3 MB |
| [英雄守城割草](ad-funnel/af-horde-defense.md) | Kingshot | 單日素材 > 2,000；最高曝光是實機 | 真實～部分真實 | 英雄走位＋建塔選擇 | 4（3D 6）/ 3.9–4.6 MB |
| [倖存者割草＋三選一](ad-funnel/af-survivor-skill-pick.md) | Survivor.io、Archero 2、Capybara Go! | **台灣證據最強** | 真實為主 | 走位＋選卡；原作技能隨機 | 4 / 3.8 MB |
| [末日求救＋搬運經營](ad-funnel/af-distress-idle-arcade.md) | Whiteout Survival、Dark War、Last Asylum | Whiteout 2026-06 素材 −37%（降溫）；Last Asylum +19% | 部分真實 | 輕度路線；後期數值 | 4 / 3.5 MB |
| [拉針救援](ad-funnel/af-pull-the-pin.md) | Hero Wars、Royal Match 救國王 | 小遊戲素材仍是點擊率最高形式 | 假 → 部分真實 | 純順序選擇 | 3 / 2.9 MB |
| [數字塔吞噬](ad-funnel/af-number-tower.md) | Hero Wars 地城廣告 | 證據偏弱 | 假 → 部分真實 | 純算術選擇 | 3–4 / 2.9 MB |
| [畫線護主](ad-funnel/af-draw-to-protect.md) | Save the Doge | 無近年熱度證據 | 真實 | 畫線形狀＋長度（真技巧） | 4 / 2.9 MB |

## 2. 改成 skill game 的難易排序
<!-- card: KB-ad-funnel-games.adaptation-ranking -->

依「原作已有多少真技巧、要補多少」排序（越前面越容易）：

| 順位 | 規格書 | 主要改造 |
|---|---|---|
| 1 | [畫線護主](ad-funnel/af-draw-to-protect.md) | 確定性 PBD 物理；比墨水量與存活 |
| 2 | [輸送帶射色清圖](ad-funnel/af-pixel-flow.md) | 已無隨機；保留連點手速、比時間 |
| 3 | [倒水分色](ad-funnel/af-magic-sort.md)、[箭頭脫出](ad-funnel/af-arrows-escape.md) | 反向打亂／反向放置程序生成保證有解；求解器算 par，比步數＋時間 |
| 4 | [倖存者割草＋三選一](ad-funnel/af-survivor-skill-pick.md) | 技能依「第 k 次升級」同種子取值（SwarmDuel 已驗證此路線） |
| 5 | [方塊擺放消行](ad-funnel/af-block-blast.md) | 種子出塊、移除 DDA |
| 6 | [色塊滑門](ad-funnel/af-color-block-jam.md)、[公車](ad-funnel/af-bus-jam.md)、[螺絲](ad-funnel/af-screw-jam.md)、[3D 三消](ad-funnel/af-match-factory.md) | 需手工關卡池；去除隱藏層與物理隨機；加時間維度 |
| 7 | [英雄守城](ad-funnel/af-horde-defense.md)、[加乘門射擊](ad-funnel/af-gate-lane-shooter.md)、[過橋](ad-funnel/af-bridge-run-merge.md) | 移除局外養成；手動射擊／彈匣；門改成取捨題 |
| 8 | [群體加乘門](ad-funnel/af-gate-runner.md)、[拉針](ad-funnel/af-pull-the-pin.md) | 選門改成「走位切分人群比例」；插銷改半開控制流量 |
| 9 | [數字塔](ad-funnel/af-number-tower.md)、[求救經營](ad-funnel/af-distress-idle-arcade.md) | 需整個即時化才成立 |

## 3. 共通規則（給新專案）
<!-- card: KB-ad-funnel-games.common-rules; kind=principle; rules=RULE-AF-ADAPTATION -->

> **改造是必做，不是建議。** 原作多半是「選擇噱頭」，照原作復刻做不出技巧主導（GateLane 2026-10-21：照原作自動射擊、只留加乘門 → 技巧佔比僅 71%、高手兩秒打倒頭目）。規格書的「Skill Game 化改造（必做）」每一條都要在 `gdd/05_game_spec.md` §13 回應（`RULE-AF-ADAPTATION`）；開工必讀清單見 [bootstrap.md §0](../.claude/skills/lite-skillgame-stack/references/bootstrap.md)。

| 原作做法 | Skill game 版本 | 對應原則 |
|---|---|---|
| 付費 +1 暫存格、續關、無限生命 | 固定容量；失敗即結算，保留已得分 | 錢買不到分數（[01](01_skill-integrity.md)） |
| 動態難度（DDA）、自適應出塊 | 同種子、所有人同題 | 條件相同 |
| 過 / 不過 | 連續分數：基礎分＋效率（步數 vs par）＋時間獎勵；指數成長的數字取 log 或封頂 | 技巧天花板、規則透明 |
| 純選擇謎題 | 加連續控制量：手速、時機、瞄準、流量、分配比例；輸入走時間戳佇列（[13](13_input-fairness.md)） | skill-dominance ≥ 70% |
| 3D 物理堆疊 | 2.5D 分層＋預渲染 sprite | DC / 包體預算 |
| 局外養成、看廣告復活 | 全刪；成長只在局內且由種子決定 | 條件相同 |
| 假玩法素材 | 用確定性重播自動產出實機素材；HTML5 本體直接當可玩廣告 | 法規安全 |

## 4. 投放與法規快查
<!-- card: KB-ad-funnel-games.ads-legal; topic=market,legal -->

| 項目 | 要點 |
|---|---|
| 素材趨勢 | 2026 從「買流量」轉向「拼素材」（策略類素材月增 53%）；可玩廣告轉換約為非可玩的 16 倍（二手） |
| 跟風窗口 | 仿作 2–3 個月內湧入；Bus Frenzy 一季下載掉 96%、螺絲類因山寨過多降溫 → 差異化要在機制，不在皮 |
| 英國 ASA | 廣告須代表核心體驗；「Not all images represent actual gameplay」無效；「遊戲裡有這個小遊戲」不足以抗辯 |
| Apple | 2.3.1(a) App Store 內外誤導行銷可下架；2.3.4 預覽只能用實機 |
| 中國 CADPA | 2025-02-06 起禁展示不存在的玩法（協會標準） |
| 台灣 | 公平法第 21 條虛偽不實廣告；遊戲處分集中在機率不實，未查到「玩法不符」處分案 |

## 5. 缺口
<!-- card: KB-ad-funnel-games.gaps; kind=gap -->

- 台灣「依格式拆分」的投放量、多數解謎排序作品的台灣下載／營收：需 Sensor Tower、AppGrowing、SocialPeta、廣大大付費報表。
- 可玩廣告的實際結構多為推定；原作精確數值（暫存格數、倒數秒數、公車容量）需實機量測。
