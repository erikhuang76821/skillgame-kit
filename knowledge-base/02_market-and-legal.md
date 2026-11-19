---
id: KB-market-legal
kind: research
topic: [market, legal]
genre: ["*"]
reviewedAt: 2026-10-21
---
# 02 市場與法規（北美 / 台灣）

> 資料截至 2026-10；未證實數值以「（未證實）」標示。**本頁不是法律意見**，任何現金或獎品模式上線前都需法務意見書。
> 來源：[SwarmDuel/knowledge/markets/](../SwarmDuel/knowledge/markets/)、[_notes/](../SwarmDuel/knowledge/_notes/)、[_archive/excluded-chance-gambling/](../SwarmDuel/knowledge/_archive/excluded-chance-gambling/README.md)

## 1. 兩市場一頁對照
<!-- card: KB-market-legal.markets; topic=market -->

| 面向 | 北美 | 台灣 |
|---|---|---|
| 主流形態 | 手機技巧錦標賽（同種子非同步）；酒吧 / FEC 技巧街機 | 手機 PvP（傳說對決、荒野亂鬥、皇室戰爭）；飛鏢、撞球、音遊機台；棋類 |
| 第一大品類 | 接龍、賓果（Skillz 約 70% 營收來自 3 款） | MOBA / 3v3；營收榜頂端是社交博弈（已排除） |
| 現金獎 | 約 35–40 州可行（dominant factor）；18+；地理圍欄 | 無專法；固定報名費 + 依名次給獎 + 不抽頭；機台獎品每次 ≤ NT$1,000 |
| 公平機制 | 同種子非同步、不放隱藏 bot | 標準化排位、公開 Rating、確定性計分（音遊） |
| 局長 | 1–5 分鐘 | 2–5 分鐘 |
| 2026 大事 | Papaya 因未揭露 bot 判賠 7.19 億美元；Skillz 更名 Firy、Tether（51% 營收）終約 | 博弈類遭監察院糾正；牌類虛擬幣研議 18+；機台須正體中文（2025-10-16） |
| 空缺機會 | 公平可驗證的新品類 | 左右切換打怪、去隨機化 PvP 塔防、同種子貪食蛇 |

## 2. 北美法規快查
<!-- card: KB-market-legal.us-law; topic=legal; jurisdiction=US-* -->

| 項目 | 要點 |
|---|---|
| 判準 | 多數州 dominant factor test；部分州 material element（更嚴） |
| 付費錦標賽禁區 | 共識：**AR、DE、LA、SD**；CT 幾乎都禁；常加 AZ、MT、SC、TN、VT、IA、MI；IN、ME 禁牌類 |
| 法定定義優先 | 賓州 2026 判決：一旦落入 skill slot / hybrid slot 定義，技巧占比無關 |
| 裝飾性技巧不算 | 可選、多數人不玩的技巧環節會被視為裝飾 |
| 預揭示不能脫罪 | 只看得到下一步且付費推進序列 = 付費買機會 |
| 外觀即可能違法 | 北卡 entertaining display：老虎機式呈現可直接違法 |
| Sweepstakes 雙幣 | 加州、紐約已禁，IN、ME 2026 跟進 |
| App Store | Guideline 5.3：真錢需地理圍欄與合法依據；Apple 30% 抽成不適用真錢對戰 |
| ESRB | 純技巧無真錢 → 目標 E10+ / T |
| 平台風險 | Skillz 10-K 承認無合規執照；依賴少數開發商 → 自建或多平台 |

## 3. 台灣法規快查
<!-- card: KB-market-legal.tw-law; topic=legal; jurisdiction=TW -->

| 項目 | 要點 |
|---|---|
| 賭博罪 | 刑法 §266/§268：「以偶然事實決定財物得喪」；純技巧且不可兌現即避開 |
| 單向金流 | 只儲值不出金，是與網路賭博的分界；玩家間轉帳 = 開幣商通道 |
| 分級 | 技巧 PvP 多為輔 12；虛擬幣輸贏的牌類 → 輔 15（研議 18+） |
| 機率揭露 | 付費抽卡 / 轉蛋須公布機率（2023 起） |
| 實體機台 | 電子遊戲場業管理條例：益智 / 鋼珠 / 娛樂分類；普通級獎品 ≤ NT$1,000、限制級 ≤ NT$2,000；禁現金、禁買回；加骰子 / 轉盤 / 抽獎元素會被改列 |
| 選物販賣機 | 保夾 ≤ 990 元、不得歸零（2024-10-14） |
| 技巧賽獎金 | 無專法，個案認定 → 先請法務 |

## 4. 排除標準（什麼不算 Skill Game）
<!-- card: KB-market-legal.exclusion; kind=principle; topic=legal; jurisdiction=*; rules=RULE-LEGAL-EXCLUDE-CHANCE -->

符合任一條即排除（14 張卡已歸檔）：

1. 結果主要由機率或營運商設定決定（捕獲機率、爪力、中獎門檻、派彩率、預設結果序列）。
2. 傳統博弈形式（老虎機、撲克、麻將、大老二等牌戲）——即使技巧成分高也排除。

邊界：北美手機現金錦標賽（接龍、賓果、21 Blitz）因同牌序同種子仍保留。

## 5. 新作設計清單
<!-- card: KB-market-legal.checklist; kind=method -->

**北美**：同種子非同步、不放隱藏 bot（AI 填場要明示且不入獎池）→ 技巧決定主要結果且不可跳過 → 1–5 分鐘、計分可拆解有上限 → 失誤有代價 → 6–20 人非同步錦標賽解流動性 → 競賽語彙（Entry fee / Prize / Trophy），不用賭場語彙 → 長線：年度版本、季票、週賽、聯賽。

**台灣**：技巧主導可證明 → 可解釋的實力分級（飛鏢 Rating、音遊段位）→ 運氣放獨立模式 → 先手優勢用規則補償 → 2–5 分鐘 → 不做虛擬幣輸贏 → LINE 登入分享、好友房、校園賽 → 正體中文、在地題材、與娛樂城語言區隔。

## 6. 需追蹤的時效事件（2026-10 之後）
<!-- card: KB-market-legal.watch-events -->

賓州 2027 稅率立法、Skillz v. Tether 審判、Papaya 上訴、Torch 上訴、維吉尼亞 2027 會期、數發部博弈類 18+ 決定、Skillz v. Voodoo。

## 7. 已知資料矛盾（引用前注意）
<!-- card: KB-market-legal.contradictions -->

- Clash 系列屬 AviaGames、Cash 系列屬 Papaya（na-themes 寫錯）。
- 埃及題材：na-themes 列熱門，art-style-glossary 標中高風險——差在「娛樂城版」。
- 各州禁令清單來源不一，只有 AR/DE/LA/SD 為共識。
- 推幣機分類在兩份筆記有出入。
- 過時資料：Skillz 玩家族群（2014）、ESRB loot box 立場（2017）、開發商分成（2020）。
