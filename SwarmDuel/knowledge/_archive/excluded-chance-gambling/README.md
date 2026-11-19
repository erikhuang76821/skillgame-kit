# 已排除：機率 / 博弈相關玩法

這些規則書不屬於本素材庫的範圍，移到這裡封存，不再列入索引與市場總覽。

## 排除標準

符合任一條就排除：

1. **結果主要由機率或營運商設定決定**：每發子彈是否捕獲、爪力、中獎門檻、派彩率、預設結果序列。
2. **傳統博弈形式**：老虎機、撲克、麻將等牌戲，線上版以虛擬幣輸贏結算，在台灣屬輔15的「牌類」。

## 清單

| 檔案 | 排除原因 |
|---|---|
| na-v-pennsylvania-skill | 機台預設結果，法院判定為老虎機 |
| na-v-georgia-coam | 類老虎機轉軸，技巧權重小 |
| na-v-no-chance-preveal | 預設結果序列，法院判定為賭博設備 |
| na-v-fish-table-ocean-king | 機率捕獲 |
| na-v-online-fish-sweepstakes | 機率捕獲、線上 sweepstakes |
| na-v-stacker-key-master | 營運商設定中獎門檻 |
| na-v-claw-crane | 營運商設定爪力／派彩率 |
| tw-claw-machine | 爪力設定＋保夾 |
| tw-fishing-arcade | 機率捕獲 |
| tw-coin-pusher | 運氣主導 |
| tw-social-casino-slots | 老虎機純機率 |
| tw-taiwan-16-mahjong | 博弈牌戲、台數結算 |
| tw-texas-holdem-tournament | 撲克 |
| tw-big-two | 牌類、剩牌倍數結算、娛樂城常見 |

## 保留但屬邊界的項目

北美手機現金錦標賽（含賓果、21 Blitz、接龍）仍保留在 `rules/`：這些遊戲雙方同牌序、同種子，勝負由操作與決策決定，且是北美 skill game 的主體。要一併排除時，把 `na-m-*` 移過來即可。
