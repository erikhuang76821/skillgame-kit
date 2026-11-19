---
id: KB-themes-liveops
kind: research
topic: [theme]
genre: ["*"]
reviewedAt: 2026-10-21
---
# 07 題材、美術風格與活動檔期

> 來源：[SwarmDuel/knowledge/themes/](../SwarmDuel/knowledge/themes/)（na-themes、tw-themes、art-style-glossary、event-calendar）

## 1. 選皮流程
<!-- card: KB-themes-liveops.skin-selection; kind=method -->

1. 依目標市場，從 [na-themes](../SwarmDuel/knowledge/themes/na-themes.md) / [tw-themes](../SwarmDuel/knowledge/themes/tw-themes.md) 挑題材（已排除博弈題材）。
2. 從 [art-style-glossary](../SwarmDuel/knowledge/themes/art-style-glossary.md) 選風格（22 種，附 NA/TW 適配 ◎○△✕、Skill 定位風險、英文 prompt 關鍵詞）：
   - NA 現金賽：3D Toon、Cozy、Pixel、可愛恐怖
   - TW：Q 版、LINE 貼圖風、Anime
   - 兩地共用：3D Toon、Clay、Q 版、Cozy
3. 用「Skill 定位風險」與共用負面提示（no slot machine / chips / dice / jackpot text）排除賭場感。
4. 主角、場景、道具做成可換皮，依 [event-calendar](../SwarmDuel/knowledge/themes/event-calendar.md) 套節慶皮。

## 2. 題材重點
<!-- card: KB-themes-liveops.theme-notes -->

| 市場 | 熱門 | 趨勢 / 尖峰 | 避開 |
|---|---|---|---|
| 北美 | 牌桌 / 賓果休閒、Cozy、像素 survivor、Americana、運動、可愛恐怖、季節活動 | Cozy 上升最快（Steam 高營收作品占比 0.4% → 3.1%）；大 IP 聯名是營收尖峰 | 老虎機視覺、原住民意象、文化挪用、NFL / March Madness 商標 |
| 台灣 | Q 版 / LINE 角色、日系、三國、仙俠、廟會 / 媽祖、夜市、台灣妖怪 | 日系 IP 聯名、台語配音加分 | 娛樂城視覺（財神、紅金、藝人代言）、簡體 / 支語、白黑大面積、數字 4、綠帽；神明只能當祝福角色 |

高風險風格：Vegas Luxe、財神；中高：埃及（娛樂城版）；中：國潮、骰子桌遊、Synthwave。

## 3. 活動檔期（2026 Q4–2027）
<!-- card: KB-themes-liveops.calendar; topic=liveops -->

| 市場 | 三大檔 | 雙市場共用 |
|---|---|---|
| 北美 | 萬聖、感恩節 + 黑五、聖誕 | 情人節、母親節、萬聖、聖誕、跨年 |
| 台灣 | 春節（2027-02-06）、中秋（2027-09-15）、雙 11 | 同上 |

規則：宗教節日低調處理；避免「抽獎、轉盤、爆分」語彙。農曆節日（元宵、七夕、中元、媽祖誕辰）日期未證實，上線前對人事總處公告。

## 4. 本地化成本（SwarmDuel 的經驗）
<!-- card: KB-themes-liveops.localization; kind=lesson; topic=theme,liveops -->

換市場時只換：`art/`、`src/i18n/`、`gdd/06 經濟`、`gdd/07 變現`；玩法、技術、直版規格不變。所以**玩法與題材要在架構上解耦**。
