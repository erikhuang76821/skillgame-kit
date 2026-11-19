# 10 Tech Constraints — 喵拳道場

- **目的**：技術選型、分層、確定性、輸入與驗分、渲染 / 包體預算，以及本作對 skill 通則的覆寫
- **相關**：[03](03_skill_integrity.md)、[05](05_game_spec.md)、[02 美術規格](02_art_spec.md)、[docs/backend_design.md](../docs/backend_design.md)、server/（`TwinStrike/server/README.md`，未收錄）
- **依據**：[knowledge-base/04 技術框架](../../knowledge-base/04_tech-stack.md)、[12 品類配方 §1 節奏](../../knowledge-base/12_genre-recipes.md)、[13 輸入公平](../../knowledge-base/13_input-fairness.md)、[14 音效](../../knowledge-base/14_audio.md)、[05 打擊感](../../knowledge-base/05_juice-and-feel.md)；門檻數字一律以 [rules.json](../../knowledge-base/index/rules.json) 為準
- **狀態**：Draft（2026-10-22，sim v6）

## 設計意圖（Why）

節奏打怪的公平性取決於毫秒：同一下點擊，在 60 Hz 手機和 144 Hz 手機、在用戶端和伺服器上，都必須判成同一個等級。所以判定全部在 sim 的子 tick 時間軸上做，畫面、音效、手感只讀 sim 事件，不回寫。

## 技術選型

| 項目 | 選擇 | 版本（鎖定） | 備註 |
|---|---|---|---|
| 渲染 | PixiJS | 8.22.0 | `preference: 'webgl'`（不開 WebGPU）、`resolution` ≤ 2 |
| 動畫 / 手感 | GSAP | 3.15.0 | 只在 render / UI；參數集中 `fx/feel.js` 的 `FEEL` |
| 建置 | Vite | 8.3.2 | 資產帶 hash |
| 音效 / BGM | Web Audio 程式合成 | — | 0 bytes；keysound 跟 BGM 和弦、音訊時鐘排程（[14 §4](../../knowledge-base/14_audio.md)） |
| 後端 | Node（無相依套件） | Node 24 | `server/` 直接 import 用戶端同一份 sim 驗分 |

不引入其他函式庫；不從 CDN 載入任何程式（`RULE-NO-RUNTIME-CDN`）。

## 分層

| 層 | 目錄 | 規則 |
|---|---|---|
| Sim | `game/src/sim/` | 純函式、整數狀態；禁 DOM / Pixi / GSAP / `Math.random` / `Date`（`RULE-SIM-PURITY`，audit 掃描）；只 import `core/` |
| Render | `game/src/render/` | 敵人位置是時間的純函式（`view.js`），可插值；讀 sim 事件播演出 |
| FX / Audio | `game/src/fx/`、`game/src/audio/` | 打擊感、連擊節奏感、keysound；hit-stop 只停 render |
| UI | `game/src/ui/`、`index.html` | HUD、結算、延遲校正，全部 HTML/CSS 疊在 canvas 上 |
| Net | `game/src/net/api.js` | 每日題目、訪客帳號、上傳、排行、離線排隊；失敗一律退回可玩 |

## 確定性規則

| 規則 | 原因 |
|---|---|
| 固定 60 TPS；時間單位子 tick（`SUB` = 16 份 / tick ≈ 1.04 ms） | 判定精度與幀率無關 |
| 判定窗、間距、預告全部是整數 tick / 子 tick（05 §1、§5） | 跨引擎一致 |
| 隨機只用無狀態雜湊 `makeRng`，以小節序號取值 | 玩家行為不改變譜面（03 E2） |
| 不用超越函數做判定 | 跨引擎末位差異 |
| 改了影響結果的規則：`GAME.version` +1、更新 golden、重產報告 | `verify()` 拒絕舊版本；audit 檢查報告版本（`RULE-REPORT-FRESH`） |

## 輸入與驗分

- 每 tick 1 byte：bit0 左、bit1 右、bit4–7 子 tick 相位（05 §2）。相位由 `PointerEvent.timeStamp` / `KeyboardEvent.timeStamp` 算出（`InputClock`，[13 §2](../../knowledge-base/13_input-fairness.md)）。
- 延遲校正：聽拍 + 看閃光各 8 下，`meta.inputOffsetMs` 上限 ±150 ms；只平移點擊時間，不放寬判定窗。
- 上傳 `{game, version, seed, ticks, score, hash, log, meta}`；伺服器硬檢查後 `verify()` 重播。實測滿局 p50 ≈ 4.4 ms、p99 ≈ 7.7 ms（i5-12500，`server/` bench）。
- 風控：`macroSuspicion`、`errorSuspicion` 只標記送審。

## 畫面與 RWD

| 項目 | 規格 |
|---|---|
| 世界視窗 | 720×1280 直版固定（03 E3）：`main.js` 的 `fit()` 等比縮放（contain）並置中，任何螢幕比例都不會多看到世界 |
| HUD | `#hud` 套用與世界相同的框；演出不得遮住敵人與攻擊範圍（05 §11） |
| 橫拿 / 電腦 | 同一個 contain 規則：直版畫面置中、兩側留白；沒有橫版版面 |

## 預算（實測）

| 項目 | 預算 | 實測 | 規則 |
|---|---|---|---|
| 包體 | 目標 8 MB、硬上限 10 MB | 約 1.1 MB（`dist/`） | `RULE-BUNDLE-SIZE`（`npm run size`） |
| Draw Call（2D 基礎） | ≤ 5 | 設計 ≤ 4（背景 1 + atlas 1 + Graphics 1 + 衝擊環 / 刀光 0–1，[02](02_art_spec.md)）；開發計數器基礎 1 | `RULE-DRAWCALL-2D` |
| 美術 | sprite PNG-8 atlas、背景 / 主視覺 WebP | `art/tools/pack_atlas.py`、`bake_bg.py`、`bake_keyart.py` | [06 美術管線](../../knowledge-base/06_art-pipeline.md) |

## 對 skill 通則的覆寫

無。`config/rules.overrides.json` 不存在，所有門檻用 rules.json 預設值。

## Open Questions

1. 跨引擎確定性：golden 只在 Node（V8）跑過，Safari（JSC）、Firefox 尚未驗證（11 R4、launch_checklist 1.4）。
2. 低階機 FPS 與自動降級門檻未實測（launch_checklist 1.3）。
3. PWA / service worker 離線快取尚未做（launch_checklist 3.1）。
