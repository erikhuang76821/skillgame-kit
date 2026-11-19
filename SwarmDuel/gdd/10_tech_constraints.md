# 10 Tech Constraints

- **目的**：引擎、平台、確定性模擬、驗分、渲染契約
- **相關系統**：02、docs/size_budget、docs/asset_pipeline
- **狀態**：Draft

## 設計意圖（Why）

技巧遊戲的技術核心不是畫面，是**「同輸入 → 同分數」**。伺服器要能以玩家上傳的輸入紀錄重跑一遍得到相同分數，才可防外掛、才可支撐現金賽。所以模擬層與渲染層必須完全分離。

## 技術選型

| 項目 | 選擇 | 版本（鎖定） | 理由 |
|---|---|---|---|
| 渲染 | PixiJS | 8.22.0 | WebGL/WebGPU 2D、批次繪製、大量 sprite；可按需 import 減包 |
| UI 動畫 | GSAP | 3.15.0 | 只用於 UI / 結算演出；**不進模擬層** |
| 建置 | Vite | 8.3.2 | ES module、tree-shaking、資產雜湊 |
| 音效 | Web Audio 程式合成 | — | 沿用 PokéSurvivor 作法，SFX 0 bytes |
| 外殼 | PWA（manifest `orientation: portrait`）；必要時 Capacitor（鎖直向） | — | 北美手機為主 |

## 直版 RWD（硬需求：手機直版唯一，不做橫版）

| 項目 | 規格 |
|---|---|
| 邏輯解析度 | 寬固定 **720**；高 = clamp(720 × 螢幕高/寬, **1280, 1600**)（9:16 ～ 9:20） |
| 世界視窗 | **所有裝置固定 720 × 1280**，遮罩後垂直置中。高螢幕多出的高度只放 HUD 與拇指區——**不多看世界**（公平視野，03 E3） |
| 縮放 | 整個 canvas 依 min(寬比, 高比) 等比縮放；像素圖最近鄰 |
| 安全區 | `env(safe-area-inset-*)` 轉邏輯 px，HUD 上下避開瀏海與 Home 條 |
| 電腦 | 同一個直版欄位置中（例：1024×768 視窗 → 432×768），兩側為模糊主視覺；不提供橫版版面 |
| 平板直拿 | 9:16 欄位 + 兩側模糊背景 |
| 手機橫拿 | 全屏「請轉為直向」提示，對局暫停（`(orientation: landscape) and (pointer: coarse)`） |
| HUD 版位 | 上：分數 / 計時 / HP / 種子；下：XP 條、等級、Dash 狀態、Howl 大按鈕（右下拇指區） |
| 觸控目標 | 主要按鈕 ≥ 44 pt；Howl 124 邏輯 px（360 pt 寬手機上 ≈ 62 pt） |

## 分層

| 層 | 目錄 | 規則 |
|---|---|---|
| Sim（模擬） | `game/src/sim/` | 純 JS、無 DOM / Pixi / GSAP / `Math.random` / `Date`；固定 60 Hz tick |
| Render | `game/src/render/` | 讀 Sim 狀態畫圖；可插值；可降效 |
| UI | `game/src/ui/` | GSAP 補間、HUD、選單 |
| Net | `game/src/net/`（未實作） | 上傳 `{seed, inputLog, claimedScore}` |

## 確定性規則（Sim 層）

| 規則 | 原因 |
|---|---|
| 固定步長 1/60 s；渲染只插值 | 幀率不同不影響結果 |
| 隨機只用 `rng(seed, stream, index)` 無狀態雜湊 | 見 02 |
| **不用** `Math.sin/cos/atan2/pow/sqrt` 以外的超越函數做判定；方向用 8 向查表，距離比較用平方 | 各 JS 引擎的超越函數末位可能不同 → 瀏覽器（JSC）與伺服器（V8）重播不一致 |
| 位置以整數「子像素」（1/256 單位）儲存 | 避免浮點累積誤差 |
| 實體以 `id` 遞增序處理；碰撞用空間雜湊並依 id 排序 | 迭代順序固定 |

> 備註：`Math.sqrt` 為 IEEE 754 規定正確捨入，跨引擎一致；`sin/cos` 不保證。Sim 僅用 `sqrt` 與查表。

## 輸入紀錄

- 每 tick 1 byte：`bits0-3` 方向（0=停、1–8=八方向）、`bit4` Dash、`bit5` Howl
- 升級選擇以事件 `{tick, choiceIndex}` 另存
- 180 s × 60 = 10,800 bytes → RLE 後通常 < 2 KB

## 渲染契約（來自 pokesurvivor-asset-dev skill）

| 契約 | Pixi 實作 |
|---|---|
| sheet 列序 `down, down_right, right, up_right, up, up_left, left, down_left` | `Texture` 以 `Rectangle(frame*w, dir*h, w, h)` 切 |
| 腳底錨點 `ax, ay` | `sprite.anchor.set(ax/w, ay/h)` |
| `d[]` 以 1/60 s tick 計 | 動畫器以 Sim tick 推進 |
| 最近鄰縮放 | `TextureSource.defaultOptions.scaleMode = 'nearest'`、`roundPixels: true` |
| 非平面物件依腳底 Y 排序 | 物件層 `sortableChildren`，`zIndex = feetY` |
| 繪製順序 ground → 地面效果/拾取物 → Y 排序物件與角色 → 投射物/空中特效 → 天氣/覆蓋 → HUD | `stage` 下固定 6 個 Container |

## 效能目標

| 裝置 | 目標 |
|---|---|
| iPhone 12 / Pixel 6 等級 | 60 fps，同屏 300 敵 + 200 投射物 + 300 Ecto 球 |
| 低階 Android | 30 fps 自動降級（關粒子、半數 Ecto 球合併顯示） |

## Open Questions

- 伺服器重播成本：實測 Node 單核 60–90 s 對局重播 70–90 ms；滿 180 s、300 敵約 0.3–0.5 s/場（skill-dominance 90 場 61 s），需在正式後端壓測
- WebGPU 預設關閉（相容性），僅 WebGL2
