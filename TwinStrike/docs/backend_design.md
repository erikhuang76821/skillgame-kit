# 喵拳道場 後端設計（路線 A：台灣 F2P 排位）

> 2026-10-21 · 對應 [launch_checklist.md](launch_checklist.md) §2.1–2.6、[knowledge-base/09](../../knowledge-base/09_knowledge-gaps.md) G7–G9。
> 雛形程式在 `TwinStrike/server/`（`TwinStrike/server/README.md`，未收錄）（Node 內建模組，**零執行期依賴**，測試 9 項全過）。
> 路線 A：不發獎金、只賣外觀；後端只做四件事：**每日同題目、伺服器驗分、排行榜、帳號**。

## 0. 結論先講

| 項目 | 決定 |
|---|---|
| 驗分 | 伺服器直接 import `game/src/sim/`（跟用戶端同一份檔案），跑 `core/match.js` 的 `verify()`；不另寫 sim |
| 題目 | 種子 = `HMAC-SHA256(DAILY_SECRET, "twin-strike:daily:<日期>")` 前 4 bytes；**台北 00:00 才能取得** |
| 換日 | Asia/Taipei（UTC+8，無日光節約）；當日 00:00–24:00 開放，**截止後 5 分鐘寬限**收尾的上傳 |
| 版本 | 每天的題目在發出時就**釘住 sim 版本**；換版只在換日生效；伺服器保留所有仍在效期內的舊版 sim |
| 防作弊 | 硬檢查（直接拒絕）→ 軟標記（收下但先不上公開榜）→ 人工複查 → 申訴 |
| 效能 | 滿局 90 s 驗證（重播 + 分析重播）實測 **4–8 ms**（預算 500 ms，餘裕約 60 倍） |
| 儲存 | 雛形：記憶體 + 單一 JSON 檔；正式：Postgres（表設計見 §6），換掉 `src/store.js` 即可 |

## 1. 架構與資料流

```
用戶端（PWA）                                  伺服器（Node）
─────────────                                  ───────────────
GET /daily ──────────────────────────────────► 發當日 {date, seed, version, maxScore}
Recorder(GAME, seed) 打一局
upload = rec.upload() ─ POST /submit ────────► 1. 形狀檢查（型別、大小）
                                               2. game / version / seed / 時間窗
                                               3. score ≤ 理論滿分（不用重播）
                                               4. meta.inputOffsetMs ∈ ±150 ms
                                               5. verify()：重播比對 score + stateHash
                                               6. 分析重播：巨集 / 誤差分布 / 不可能的輸入 → 標記
                                               7. 同一份 log 是否已被別人交過
                                               ─► status = ok（上榜）| review（待審）
GET /leaderboard/:date ◄───────────────────── 每人取當日最佳公開成績排序
```

伺服器只信任「種子 + 輸入 log」，分數一律由重播算出；用戶端送來的 `score` / `hash` 只用來比對。

## 2. API

所有回應都是 JSON。錯誤格式 `{ "error": "<code>", "detail"?: ... }`。需要帳號的端點帶 `Authorization: Bearer <token>`。

### 2.1 每日題目 `GET /daily[?date=YYYY-MM-DD]`

不帶 `date` = 伺服器的「今天」（台北）。

```json
{ "date": "2026-10-21", "game": "twin-strike", "version": 5, "seed": 3709397040, "maxScore": 31125,
  "opensAt": 1792512000000, "closesAt": 1792598400000, "submitUntil": 1792598700000, "serverTime": 1792564938040 }
```

| 情況 | 回應 |
|---|---|
| 今天、過去的日期 | 200（第一次被要求時才發出並寫入 `dailies`，同時釘住 version） |
| 未來日期、不合法日期（`2026-02-31`） | 404 `no_daily`——**明天的種子在台北 00:00 之前不存在於任何回應中** |

`serverTime` 讓用戶端校正倒數（裝置時鐘不可信，只用來顯示）。

### 2.2 上傳成績 `POST /submit`（需帳號）

```json
{ "date": "2026-10-21", "upload": { "game": "twin-strike", "version": 5, "seed": 3709397040, "ticks": 5400,
  "score": 27310, "hash": 601539386, "log": "<RLE base64>", "choices": [], "meta": { "inputOffsetMs": 12, "audioLatencyMs": 40, "lateTaps": 0 } } }
```

`upload` 就是 `Recorder.upload()` 的原樣輸出。成功：

```json
{ "runId": 17, "status": "ok", "score": 27310, "ratePermille": 877, "rank": 3 }
```

`status: "review"` 時 `rank` 為 `null`，**不回傳標記原因**（避免作弊者拿來調參）。同一玩家重送同一份 log → 回原本那筆並帶 `duplicate: true`（冪等，可安全重試）。

| HTTP | `error` | 意義 | 用戶端該做什麼 |
|---|---|---|---|
| 400 | `bad_json` / `bad_upload`（`detail` 指出欄位） | 形狀不對、log 不是 base64、超出大小 | 回報錯誤（不是玩家的錯） |
| 401 | `unauthorized` | 沒帶或帶錯 token | 重新建訪客帳號 / 登入 |
| 404 | `no_daily` | 日期不存在或在未來 | 重新 `GET /daily` |
| 409 | `version_mismatch`（`detail.need`） | 用戶端 sim 版本 ≠ 當日題目版本 | 提示「請更新」，PWA 觸發 SW 更新 |
| 413 | `too_large` | body > 64 KB | — |
| 422 | `wrong_game` / `wrong_seed` / `not_open` / `window_closed` | 不是當日題目、或已過截止 + 寬限 | 換日了：顯示「今日題目已結束」 |
| 422 | `above_max`（`detail.max`） | 分數超過理論滿分 | — （只可能是竄改） |
| 422 | `offset_out_of_range` | `meta.inputOffsetMs` 缺少或超過 ±150 ms | — （官方用戶端已 clamp） |
| 422 | `replay_failed`（`detail` = 重播失敗原因） | 重播後分數或 stateHash 不符、log 長度不符 | 若是正常玩家 → 跨引擎不一致的 bug，要告警（§5.5） |
| 422 | `duplicate_log` | 這份 log 已由另一個帳號交過 | — |

### 2.3 排行榜 `GET /leaderboard/:date[?limit=50]`

```json
{ "date": "2026-10-21", "version": 5, "maxScore": 31125, "players": 1284,
  "top": [{ "rank": 1, "playerId": "p_…", "name": "阿喵", "score": 30410, "ratePermille": 977 }],
  "me": { "rank": 212, "playerId": "p_…", "name": "小虎", "score": 24420, "ratePermille": 784, "underReview": 29000 } }
```

- **每日榜**：同種子比原始分；每人只取當日最佳的公開成績（`ok` / `cleared`）；同分時先交者在前。`limit` ≤ 100。
- 帶 token 時多一個 `me`；自己有待審成績時 `underReview` 只給本人看。
- 正式版要加（雛形未做）：
  - **賽季榜**：跨日不能比原始分（每天滿分不同），用 `ratePermille`（達成率 ‰）取賽季內最佳 N 天平均，或每日百分位的平均。
  - **好友榜**：用好友碼互加（`friends(player_id, friend_id)`）。LINE Login 本身不提供好友名單，不能指望從 LINE 拉。
  - 前 100 名以外只回本人名次與百分位（「前 12%」），配合 checklist 1.5 的低分呈現。

### 2.4 帳號

| 端點 | 雛形 | 說明 |
|---|---|---|
| `POST /account/guest {name?}` | ✅ | 建訪客帳號，回 `{playerId, name, token}`。token 32 bytes 隨機，伺服器只存 SHA-256。名字 1–12 字、去控制字元；空白則給「貓拳手1234」 |
| `POST /account/line {idToken}` | 501 | LINE 登入，見下 |
| `DELETE /account` | — | 個資法：刪除帳號與成績（保留去識別化統計） |

**LINE 登入流程**（台灣主要登入方式，換機保留紀錄）：

1. 用戶端走 LINE Login（Web 版 OAuth / OIDC，或 LIFF），scope 只要 `openid profile`，**不要 email**。
2. 用戶端把 ID token 交給 `POST /account/line`（帶著目前的訪客 token）。
3. 伺服器向 LINE 的 verify 端點驗 ID token（核對 `aud` = 我們的 channel ID、`exp`、`nonce`），取 `sub` 當永久 ID。
4. 合併規則：
   - `sub` 第一次出現 → 綁到目前這個訪客帳號（訪客升級，紀錄不動）。
   - `sub` 已綁過別的帳號（換機）→ 回那個帳號的新 token；目前訪客帳號的成績併過去（同一天取較高者），訪客帳號停用。
5. 正式上線前要跟 LINE 申請 channel、設定 callback 網域；寫進隱私權政策（checklist 4.2）。

### 2.5 營運 / 審核（需 `ADMIN_TOKEN`）

| 端點 | 雛形 | 說明 |
|---|---|---|
| `GET /admin/review-queue` | ✅ | 待審成績與標記原因（不含 log 本體） |
| `POST /admin/runs/:id/review {decision: clear\|void, note}` | ✅ | `clear` → 上公開榜；`void` → 作廢 |
| `GET /admin/runs/:id/replay` | — | 取 log 給審核用的觀戰模式（用戶端待辦 C5） |
| `POST /appeal {runId, text}` | — | 玩家申訴（§5.4） |

## 3. 每日題目：種子、時區、換日

### 3.1 種子何時公開（防背譜）

| 問題 | 做法 |
|---|---|
| 目前用戶端用裝置日期算 `seedFromString('daily-2026-10-21')`，公式在包裡，任何人都能先算出明天、下週的題目並先練 | 改成伺服器用祕密金鑰 HMAC 產生；**沒有金鑰就算不出任何一天的種子** |
| 何時公開 | 台北 00:00 起 `GET /daily` 才回得到。`dailies` 表在第一次被要求時才寫入 |
| 當天能不能重練？ | 可以。所有人同一天面對同一題、可無限重打、取最佳；這是公平的（每個人機會相同）。要防的是「提前」知道 |
| 背譜的影響有多大 | 有限：難度曲線是固定腳本（[gdd/07](../gdd/07_difficulty_curve.md)），種子只在同等級樂句中挑選與左右鏡像，所以背譜幾乎等於「當天多練幾次」 |
| 金鑰管理 | `DAILY_SECRET` 放在部署平台的 secret 管理；**換金鑰會改變所有尚未發出的日子**（已發出的 `dailies` 已寫入，不受影響）。正式環境未設定時程式拒絕啟動 |

### 3.2 時區與換日

| 規則 | 值 | 理由 |
|---|---|---|
| 時區 | Asia/Taipei，固定 UTC+8（台灣自 1979 年後無日光節約） | 目標市場單一；純算術，不依賴 tz 資料庫 |
| 一天 | 台北 00:00:00.000 – 23:59:59.999 | — |
| 上傳截止 | 隔日 00:00 + **5 分鐘寬限**（`submitUntil`） | 23:59 開打的 90 s 局 + 網路重試 |
| 以誰的時間為準 | **伺服器收到的時間**。裝置時鐘只用來顯示倒數（以 `serverTime` 校正） | 改手機時間沒用 |
| 跨日中的玩家 | 局內不換題；上傳帶 `date`，在寬限內照舊算前一天 | — |
| 排行結算 | `submitUntil` 之後該日榜單凍結；待審成績在審核後才上榜（可能晚於結算） | — |

## 4. sim 版本相容策略

規則：**每天釘一個版本，換版只發生在換日。伺服器同時保留所有仍可能被驗證的舊版。**

| 步驟 | 做什麼 |
|---|---|
| 1. 發題目 | `dailies.version` 在當日第一次被要求時寫入（依 `versions` 排程：`[{from: '2026-11-05', version: 6}]`），之後不再改 |
| 2. 驗分 | 用 `upload.version` 必須 = `dailies.version`；不符回 409 `version_mismatch` + 需要的版本 |
| 3. 要換版（例如 v5 → v6） | ① 把目前的 `game/src/sim/`（純檔案、約 900 行、無依賴）凍結複製到 `server/sims/v5/`，在 `src/sims.js` 加一列；② 部署伺服器（同時有 v5、v6），排程 `from` = 生效日；③ 生效日之前發佈用戶端 v6（PWA 在換日時檢查更新） |
| 4. 舊版保留多久 | 至少：申訴期（30 天）與該賽季結束兩者較晚者。過期後舊成績只保留結果、不再能重播 |
| 5. 防呆 | 伺服器啟動時檢查排程裡每個版本都已載入，否則拒絕啟動（已實作）；每個凍結版本各有一個 golden match 測試 |

為什麼不選「伺服器只保留一版、排行期間禁止更新」：熱修 bug 會被卡到賽季結束；而保留多版的成本只是幾百行純函式。

跨日、跨版本的比較一律用 `ratePermille`（達成率），不用原始分。

## 5. 防作弊流程

路線 A 沒有獎金，作弊誘因只有排名與面子；目標是「讓公開榜可信、誤判可申訴」，不是滴水不漏。

### 5.1 第一層：硬檢查（直接拒絕，不入榜）

| 檢查 | 實作 | 擋什麼 |
|---|---|---|
| 形狀與大小 | body ≤ 64 KB；log ≤ 14.4 KB（5400 tick 的 RLE 上限）；choices ≤ 64；meta ≤ 1 KB | 塞爆、畸形資料 |
| game / version / seed / 時間窗 | §2.2 | 別天的題目、舊用戶端、隔夜補交 |
| **理論滿分** `score > dailies.maxScore` | `sim.maxScore(createSim(seed))`（全 Perfect、滿連擊），發題時算一次存起來 | 直接改分數；不用重播就能擋 |
| 延遲校正範圍 | `meta.inputOffsetMs` 必須是數字且 \|x\| ≤ 150（knowledge-base/13 §3） | 改大 offset 拿時間優勢 |
| **重播驗證** | `verify()`：重播比對 score 與 stateHash、log 長度與局長一致 | 改分、改 log、偽造結果 |
| 重複 log | `sha256(seed + log)` 若已被**另一個帳號**交過 → 拒絕 | 直接拿別人的紀錄來交 |

### 5.2 第二層：軟標記（收下、`status = review`、先不上公開榜）

| 標記 | 來源 | 預設門檻（待真人數據重訂） |
|---|---|---|
| `macro` | `core/input.js` `macroSuspicion()`，**每一側分開算**（單一手指不可能 < 45 ms 連點；兩手交替可以，合併算會誤判） | 間隔 < 45 ms 或間隔標準差 < 3 ms（≥ 20 次） |
| `error_sd` | `errorSuspicion()`，誤差 = 點擊時間 − 音符時間（分析重播時從 `hit` 事件取得） | 誤差標準差 < 2.5 ms（≥ 30 次命中） |
| `top_score` | 達成率 ≥ 98 % | 頂尖成績一律人工看過才公開 |
| `non_client_input` | log 裡有官方用戶端做不出的 byte（同一 tick 左右同時、bit 2–3） | 1 個就標 |
| `late_taps` | `meta.lateTaps` / 點擊數 > 25 % | 嚴重卡頓或改過時鐘 |
| `repeat_rejects` | 同帳號同日 `replay_failed` + `above_max` + `duplicate_log` ≥ 3 次 → 之後的成績都送審 | 在試探驗證的人 |

標記原因只給審核者，不回傳用戶端。

### 5.3 第三層：人工複查

1. 審核佇列依「名次影響」排序（會進前 100 的先看）。
2. 審核者看：標記原因、各段命中率對照 bot 模型（`tools/human-report.mjs` 的 profile 可直接重用）、點擊間隔與誤差的直方圖、**用觀戰模式重播整局**（用戶端待辦 C5）。
3. 決定：`clear`（上榜）或 `void`（作廢）。同帳號累計 2 次 `void` → 停權排位（仍可單機玩、外觀不受影響）。
4. 目標時效：前 100 名 24 小時內處理；其餘一週內。

### 5.4 申訴

- 玩家在自己的成績列看到「審核中 / 已作廢」，可在 30 天內申訴一次（`POST /appeal`，文字 ≤ 500 字）。
- 由**另一位**審核者複查；裁決依據就是上傳的輸入紀錄重播（確定性：同 log 必得同分，爭議只剩「這是不是人打的」）。
- 申訴期內保留完整 log 與當時的 sim 版本（§4 第 4 點）。
- 誤判率目標：真人局被標記 < 0.5 %、被作廢 < 0.01 %。上線前用 checklist 1.1 的 20 人資料跑一次標記率，超標就放寬門檻。

### 5.5 已知限制（誠實列出）

| 攻擊 | 現況 | 緩解 |
|---|---|---|
| 離線求解器 + 加人工雜訊（例如誤差 sd 15 ms 的 bot） | **擋不住**：sim 在用戶端包裡，題目當天公開，產生「像人」的 log 不難 | `top_score` 全審；跨日行為統計（分數突然跳級、每天都在同百分位極端值）；路線 A 無獎金，風險可接受。路線 B 前必須再加強（G9） |
| 拿別人的 log 小改一兩個 byte 再交 | 精確重複擋得掉，改過的擋不掉 | **當日結束前不公開任何人的 log / 觀戰**；進階：判定序列（每個音符的 grade）高度相似時標記 |
| 跨引擎不一致（Safari JSC vs Node V8） | sim 只用 32-bit 整數運算，理論上一致；但尚未有 CI（G8） | 監控 `replay_failed` 比例依 User-Agent 分組，> 0.1 % 告警；checklist 1.4 的跨引擎 golden CI |
| 無限開訪客帳號洗榜 | — | 訪客帳號每 IP 每小時 ≤ 20 個；公開榜可選「只顯示 LINE 綁定帳號」 |
| 暴力試探 | — | 每帳號每小時上傳 ≤ 60 次（一局 90 s，正常人到不了）；超過回 429 |

雛形未做：速率限制、`run token`（開局時領取，上傳時檢查「經過的真實時間 ≥ 局長」，讓離線求解至少要花真實時間）。兩者都列在 §8。

## 6. 資料表（正式版：Postgres）

雛形的 `src/store.js` 用同樣的欄位存在一個 JSON 檔。

| 表 | 主要欄位 | 索引 / 備註 |
|---|---|---|
| `players` | `id` PK, `name`, `created_at`, `status`(active / banned_ranked / deleted), `merged_into` | — |
| `auth_tokens` | `token_hash` PK (SHA-256), `player_id` FK, `created_at`, `last_used_at`, `revoked_at` | `player_id`；token 原文不落地 |
| `line_identities` | `sub` PK, `player_id` FK unique, `linked_at` | 只存 `sub`，不存 email / 頭像 |
| `dailies` | `date` PK, `game`, `version`, `seed`, `max_score`, `opens_at`, `closes_at`, `issued_at` | 發出後不可修改 |
| `runs` | `id` PK, `player_id`, `date`, `version`, `score`, `hash`, `ticks`, `rate_permille`, `breakdown` jsonb, `status`(ok / review / cleared / void), `flags` jsonb, `verify_ms`, `log_digest`, `client` jsonb(UA、裝置), `created_at` | `(date, status, score DESC, created_at)`；unique `(date, log_digest)` |
| `run_logs` | `run_id` PK, `log` text, `choices` jsonb, `meta` jsonb | 與 `runs` 分開（大欄位）；保留期見 §4 |
| `daily_best` | `(date, player_id)` PK, `run_id`, `score`, `created_at` | 公開成績變動時更新；排行查詢走這張 `(date, score DESC, created_at)` |
| `rejections` | `(date, player_id, code)` PK, `count`, `last_at` | 計 `repeat_rejects`；也是告警來源 |
| `reviews` | `id`, `run_id`, `reviewer`, `decision`, `note`, `created_at` | 稽核軌跡 |
| `appeals` | `id`, `run_id`, `player_id`, `text`, `status`, `decided_by`, `decided_at` | 每筆成績限一次 |
| `friends` | `(player_id, friend_id)` PK | 好友榜 |

規模估算：1 萬 DAU × 每人 5 局 = 每天 5 萬筆 runs，log 平均 < 2 KB → 每天約 100 MB（含索引）。`run_logs` 超過保留期後只留 `runs`。

## 7. 效能預算

**預算：一份滿局（90 s、5400 tick）上傳的完整驗證 < 500 ms。** 實測遠低於此。

`npm run bench`（`server/bench/replay-bench.mjs`，Node 24.14、Intel i5-12500 單執行緒，各 50 局）。計時範圍 = `verify()` 重播 + 分析重播（兩次完整重播）：

| bot | 平均局長 | p50 | p99 | 最大 |
|---|---|---|---|---|
| novice（常中途倒下） | 40 s | 2.4 ms | 5.9 ms | 5.9 ms |
| intermediate | 90 s | 4.4 ms | 6.7 ms | 6.7 ms |
| expert | 90 s | 4.3 ms | 7.7 ms | 7.7 ms |

| 推論 | 數字 |
|---|---|
| 單核吞吐 | 約 150–200 次驗證 / 秒 |
| 1 萬 DAU 尖峰（每天 5 萬局，尖峰 10 倍平均） | 約 6 次 / 秒 → 單核 < 5 % |
| 雲端小機器（共享 vCPU，估計慢 3–5 倍） | p99 仍 < 50 ms |
| 何時要搬到 `worker_threads` | p99 > 50 ms 或 > 50 次 / 秒時（驗證是同步 CPU 工作，會擋住 event loop） |

`node --test` 裡有一項「滿局驗證 < 500 ms」，CI 上若被拖慢會直接失敗。

## 8. 部署與營運

| 項目 | 建議 |
|---|---|
| 托管 | 單一 Node 行程 + Postgres（台灣區或東京區）；靜態遊戲包走 CDN（checklist 3.2） |
| 設定 | `DAILY_SECRET`（必填）、`ADMIN_TOKEN`、`CORS_ORIGIN`（正式只開遊戲網域）、`PORT`、`DATABASE_URL` |
| 速率限制 | 每帳號每小時上傳 ≤ 60；每 IP 每小時建訪客 ≤ 20；回 429 |
| 監控 | `replay_failed` 率（依 UA）、`verify_ms` p99、標記率、審核佇列長度、`version_mismatch` 率（用戶端更新卡住） |
| 備份 | Postgres 每日快照；`dailies` 與 `DAILY_SECRET` 遺失會導致當天以後的題目改變 |
| 個資 | 只收：LINE `sub`、暱稱、成績、輸入 log、裝置大略資訊；IP 只用於速率限制、保留 30 天；隱私權政策列出（checklist 4.2） |

## 9. 用戶端待辦（`game/` 需要配合的地方）

> 2026-10-21 進度（分支 `twinstrike/net-client`，`game/src/net/api.js`）：✅ C1 每日種子（離線 / 舊版 → 練習模式、`?seed=` → 指定題目，兩者都不上傳）· ✅ C2 上傳 + 失敗排隊重送 + 排行榜前 5 名與自己 · ⚠️ C3 版本不符顯示「請重新整理」（PWA 更新待 3.1）· ⚠️ C4 自動建立訪客帳號（LINE 與暱稱編輯未做）· ✅ C6 · ✅ C7 倒數用 `serverTime` 校正 · ❌ C5 觀戰 / 重播 · ❌ C8 run token。端到端實測：上傳、伺服器重播、排名、排行榜正確；離線排隊、竄改分數 422、舊版本 409、重送冪等都正確。

| # | 項目 | 位置 | 說明 |
|---|---|---|---|
| C1 | 每日種子改由伺服器發 | `src/main.js` 第 39–40 行 | 現在用裝置日期 + `seedFromString`。改成開場 `GET /daily` 取 `seed`、`date`、`version`；離線或失敗時只能玩「練習模式」（隨機種子、不上傳）。`?seed=` 保留給開發 |
| C2 | 結束時上傳 | `finish()` | `POST /submit {date, upload: rec.upload()}`；失敗存 localStorage 佇列、下次開啟重送（伺服器端冪等）。顯示 `status`：`ok` 給名次、`review` 顯示「成績審核中」 |
| C3 | 版本不符處理 | — | 409 `version_mismatch` → 「有新版本」並觸發 PWA service worker 更新；422 `window_closed` → 「今日題目已結束」 |
| C4 | 帳號 | 新 UI | 第一次開啟自動 `POST /account/guest` 並存 token；設定頁「綁定 LINE」；暱稱編輯 |
| C5 | 觀戰 / 重播模式 | `src/main.js` | `?replay=<runId>`：取 log 用 `Recorder` 逐 tick 重放並渲染。審核與申訴都靠它；也可當「看頂尖玩家怎麼打」（只在當日結束後開放，§5.5） |
| C6 | 確保 `meta.inputOffsetMs` 一定有值 | `start()` | 伺服器要求必填；未校正時填 0 |
| C7 | 倒數與換日 | 標題畫面 | 用 `serverTime` 校正本地時鐘，顯示「今日題目剩 hh:mm」 |
| C8 | （第二階段）run token | — | 開局 `POST /run` 取 token，上傳時帶回；伺服器檢查經過時間 ≥ `ticks / 60` 秒 |

## 10. 雛形現況與下一步

| | 雛形（`server/`） | 正式版還缺 |
|---|---|---|
| §2.1 每日題目 | ✅ HMAC 種子、台北換日、未來日期 404、寬限 5 分鐘 | — |
| §2.2 驗分 | ✅ 直接 import 遊戲 sim、`verify()` + 分析重播、滿局 < 10 ms | worker_threads（量大時） |
| §2.3 版本 | ✅ 每日釘版本、409 回需要的版本、排程啟動檢查 | 第一次換版時建立 `server/sims/v5/` 與其 golden 測試 |
| §2.4 排行 | ✅ 每日榜、本人名次、待審只給本人看 | 賽季榜、好友榜、百分位 |
| §2.5 帳號 | ⚠️ 訪客帳號 + token | LINE 登入、合併、刪除帳號 |
| §2.6 防作弊 | ✅ 硬檢查 6 項、軟標記 6 種、審核佇列與裁決 | 速率限制、申訴端點、觀戰模式（C5）、門檻用真人數據重訂 |
| 儲存 | 記憶體 + JSON 檔 | Postgres（§6） |
