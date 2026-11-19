# 守望之戰 LanternHold

360° 塔防 × 倖存者式三選一，真像素美術。

- **資源**：怪從八方不斷湧來，打怪得**金幣**和**守望值**。
  - 金幣：蓋、升級軍營（Lv2 解鎖盾兵、Lv3 解鎖牧師），買兵，蓋、升級城牆，主城出工人自動修牆。
  - 守望值：升級時三選一張卡。卡片有兵種類型（可忽略、可鎖定）和屬性標籤；湊齊觸發**羈絆**，不同元素互相**反應**，特定兩張湊滿會**進化**。
- **城牆路線**：城牆留**缺口**可以引導會繞路的怪。
- **兵種**：弓箭手站樁、盾兵迎敵後回撤、牧師詠唱治療。
- **關卡**：五個主題關（5／8／10／12／15 分），首領會掉寶箱。
- **操作**：拖曳布陣、雙指或滾輪縮放。

狀態：**原型 v7**（2026-11-18）。
- 開發：`cd game && npm run dev`。
- 上架用單檔 zip：`npm run build:zip` → `release/lanternhold.zip`。
- 上架資料與規範對照：[docs/store_listing.md](docs/store_listing.md)。

## 文件

| 文件 | 內容 |
|---|---|
| [gdd/01_concept.md](gdd/01_concept.md) | 企劃總覽：節奏、系統、建築、城牆、資源、英雄、敵人、事件、操作 |
| [gdd/04_combat.md](gdd/04_combat.md) | 攻防係數：傷害公式、3×3 剋制表、單位數值、守備距離 |
| [gdd/06_cards.md](gdd/06_cards.md) | 卡片成長：三選一、兵種類型（忽略／鎖定）、羈絆、反應、進化、寶箱 |
| [docs/playtest_report.md](docs/playtest_report.md) | 自動試玩報告（難度曲線 D2–D6） |
| [docs/store_listing.md](docs/store_listing.md) | 上架資料（名稱、理念、說明）與規範對照 |
| [gdd/02_art_spec.md](gdd/02_art_spec.md) | 像素美術規格、資產清單、atlas、生成風格鎖；手感與音效見 [knowledge-base/05_juice-and-feel](../knowledge-base/05_juice-and-feel.md)、[14_audio](../knowledge-base/14_audio.md) |
| [gdd/03_skill_integrity.md](gdd/03_skill_integrity.md) | 技巧完整性、去隨機化 |
| [gdd/05_game_spec.md](gdd/05_game_spec.md) | 玩法規格 §0–§13（數值草案） |
| [gdd/07_difficulty_curve.md](gdd/07_difficulty_curve.md) | 關卡表、腳本產生器、時間軸、試玩紀錄 |
| [gdd/10_tech_constraints.md](gdd/10_tech_constraints.md) | 技術限制 |
| [gdd/11_risks_open.md](gdd/11_risks_open.md) | 風險、待決事項 |

## 改編來源

- [af-horde-defense](../knowledge-base/ad-funnel/af-horde-defense.md)：英雄守城割草
- [af-survivor-skill-pick](../knowledge-base/ad-funnel/af-survivor-skill-pick.md)：倖存者割草＋三選一（同種子改造，見 gdd/05 §13、gdd/06）

兩份的改造清單在 [gdd/05 §13](gdd/05_game_spec.md) 逐條回應。只借玩法結構，名稱、美術、音效全部原創。

## 已讀知識庫（N0–N2）

[02 市場與法規](../knowledge-base/02_market-and-legal.md) §4–5、[01 技巧完整性](../knowledge-base/01_skill-integrity.md) §1–3、[06 美術管線](../knowledge-base/06_art-pipeline.md)、[16 廣告玩法](../knowledge-base/16_ad-funnel-games.md)（af-horde-defense、af-survivor-skill-pick）、規格範本。N3 起依 `node shared/tools/loop.mjs next LanternHold` 補讀。

## 排除標準檢核（N0）

依 `RULE-LEGAL-EXCLUDE-CHANCE`（[02 §4](../knowledge-base/02_market-and-legal.md)）。非法律意見。

| # | 排除條件 | 判斷 | 依據 |
|---|---|---|---|
| 1 | 結果主要由機率決定 | 不落入 | 時間表固定；方向、卡片選項、寶箱張數由種子以序號取值，同種子人人相同；無暴擊、無機率掉落（[05 §3](gdd/05_game_spec.md)、[06 §7](gdd/06_cards.md)） |
| 2 | 結果由營運商設定決定 | 不落入 | 分數只來自擊殺、事件、Boss、主城耐久（[05 §6](gdd/05_game_spec.md)） |
| 3 | 傳統博弈形式 | 不落入 | 塔防動作 |
| 4 | 付費影響勝負 | 不落入 | 無局外養成、無看廣告復活 |
| 5 | 隨機獎勵 | 不落入 | 英雄固定四選一；小兵升級只看經驗；金幣固定掉落 |

## 下一步

1. 確認 [gdd/11](gdd/11_risks_open.md) 待決事項。
2. N3：複製範本到 `game/`，原型第一階段（主城＋小弓箭手＋軍營＋拖曳調防＋底流＋城牆耐久），程式繪製圖形。
