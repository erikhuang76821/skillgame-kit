# 08 Progression — 新手曲線、段位、Adventure

- **目的**：讓新手不被高手碾壓，讓高手有天花板
- **相關系統**：01、02、06
- **狀態**：Draft

## 設計意圖（Why）

同種子對戰的落差非常直接（看得到對手分數），新手被連續碾壓會流失。用「技巧評分配對」+「新手保護」+「Adventure 作為無壓力練習場」三層緩衝。

## 新手曲線

| 場次 | 內容 | 解鎖 |
|---|---|---|
| 0 | 60 秒教學局（移動 → 撿球升級 → Dash → Howl） | Practice |
| 1–3 | 對手為**歷史錄影**（同種子低分段真人重播），保證勝率 ≈ 60% | Duel |
| 4–10 | 隱藏 MMR 配對，僅與新手池 | Daily Seed、Adventure |
| 10+ | 正式段位 | 錦標賽 |

## 段位

| 段位 | 分段 | MMR 參考 | 賽季重置 |
|---|---|---|---|
| Camper | I–III | < 1000 | 不降 |
| Ranger | I–III | 1000–1400 | -1 段 |
| Tracker | I–III | 1400–1800 | -1 段 |
| Cryptid | I–III | 1800–2200 | -2 段 |
| Legend | 排行 Top 500 | > 2200 | 回 Cryptid I |

MMR 使用 Glicko-2（非同步對戰天然適合 RD 機制）。

## Adventure（PvE 留存）

- 隨機種子、可帶永久強化（Trail Token 購買）、多地圖（Campground → Desert Area 51 → Swamp）
- 用途：新手練手感、休閒玩家長線、可放獎勵廣告
- 永久強化**永不**進入排位

## Open Questions

- 錄影對手需揭露「這是錄影」嗎？→ 建議揭露（「vs. ghost run」），北美玩家對假人敏感
