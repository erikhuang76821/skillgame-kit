# 實驗：紙上試跑（接龍、撞球、拼字）與技巧指標試算（2026-11-11）

這個資料夾是**一次性實驗的可重跑紀錄**，不是產品程式，也不受遊戲規則（`RULE-SIM-PURITY` 等）約束。它支撐這幾份文件：

- [紙上試跑（二）：撞球與拼字](../../../knowledge-base/decisions/2026-11-11-paper-pilot-pool-word.md)
- [紙上試跑：限時接龍](../../../knowledge-base/decisions/2026-11-11-paper-pilot-solitaire.md)
- [技巧證據的規則重構](../../../knowledge-base/decisions/2026-11-11-skill-evidence.md)

| 檔案 | 作用 | 重跑 |
|---|---|---|
| `walk-nodes.mjs` | 用假想的 profile（`solitaire`、`pool`、`word`）對 N0–N11 每個節點呼叫取用器，列出發出的規則、測試、知識卡、資產 | `node shared/experiments/2026-11-11-paper-pilots/walk-nodes.mjs pool`（逐節點全文寫到 `out/<題目>/`，不進 git） |
| `walk-nodes.<題目>.summary.json` | 2026-11-11 當時的輸出摘要。知識庫或節點改了之後重跑會不同，這幾份是當時的證據 | — |
| `klondike.mjs` | 最小的限時接龍模擬（抽 3 張、仿 Solitaire Cube 計分、300 秒）＋三級策略＋固定規則；算技巧佔比、種子佔比、同種子勝率 | `node shared/experiments/2026-11-11-paper-pilots/klondike.mjs 300` |
| `metrics.mjs` | 同一張（種子 × 等級）分數表上的幾種候選指標 | `node …/metrics.mjs klondike`、`node …/metrics.mjs TwinStrike`、`node …/metrics.mjs GateLane` |
| `results.klondike.txt`、`results.metrics.txt` | 2026-11-11 的輸出 | — |

## 讀結果前要知道的

- **接龍的 expert 很弱**：只解完約 5% 的牌局。數字只能說明舊指標不通用，不能用來訂新門檻。
- **假設值**：每步秒數（2.5／1.5／0.9）、未解完時的時間獎勵折算（依上基礎堆的張數比例）。官方公式未公開。
- **模擬不是 tick 制**：以「步」為單位、用每步秒數換算時間，和範本的 `sim` 契約不同。
- `metrics.mjs` 的信賴下界是單側 95% Wilson 下界，平手算半勝，只作描述；決策要求的是嚴格勝率或配對重抽。
- `metrics.mjs GateLane` 需要 `GateLane/game`（目前未進 git）。
- 種子：`hash32(2026, 7, i)`，與 `dominance.mjs` 相同的序列定義，但雜湊實作是本資料夾自帶的，數值與遊戲的種子不同。
- 2026-11-11 之後（[通用化待辦 §10](../../../knowledge-base/decisions/2026-11-11-generality-backlog.md) 步驟 1）：`walk-nodes.mjs` 的代理 profile 沒有填 `scriptedProgression`，現在重跑會看到五條難度曲線規則是「資料待補」，不再出現在適用規則裡。保存的 `walk-nodes.*.summary.json` 是修正前的輸出。
