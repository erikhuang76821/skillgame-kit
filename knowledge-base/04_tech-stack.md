---
id: KB-tech-stack
kind: principle
topic: [tech]
genre: ["*"]
renderer: ["*"]
reviewedAt: 2026-10-21
---
# 04 技術框架 — 輕量 HTML5 Skill Game

> 權威來源是 repo skill **`lite-skillgame-stack`**（[.claude/skills/lite-skillgame-stack/SKILL.md](../.claude/skills/lite-skillgame-stack/SKILL.md)）；本頁是索引與摘要，數值衝突時以 skill 與專案自己的 `gdd/10_tech_constraints.md` 為準。
> 其他來源：[SwarmDuel/gdd/10_tech_constraints.md](../SwarmDuel/gdd/10_tech_constraints.md)、[SwarmDuel/docs/size_budget.md](../SwarmDuel/docs/size_budget.md)、`SwarmDuel/game/src/sim/{rng,fixed,replay}.js`

## 1. 硬指標
<!-- card: KB-tech-stack.hard-limits; topic=tech,budget; rules=RULE-BUNDLE-SIZE,RULE-DRAWCALL-2D,RULE-DRAWCALL-3D,RULE-NO-RUNTIME-CDN -->

| 指標 | 值 |
|---|---|
| 包體 | 目標 ≤ 8 MB、硬上限 10 MB、首包 ≤ 3 MB；`npm run build && npm run size` 必過 |
| Draw Call | 2D 基礎 ≤ 5、3D ≤ 9；驗收寫「基礎 DC」與「特效全開峰值 DC」兩個數字 |
| 幀率 | 中階機（iPhone 12 / Pixel 6）60 fps；低階 Android 30 fps 自動降級 |
| 執行期 | 不從 CDN 載入任何程式、字型、wasm、transcoder |

## 2. 技術棧白名單（版本鎖確切值，不加 `^`）
<!-- card: KB-tech-stack.whitelist -->

| 用途 | 選擇 | 已驗證版本 |
|---|---|---|
| 2D 渲染 | PixiJS 8 | 8.22.0 |
| 3D 渲染 | ogl 優先；要 glTF 生態才用 three（一專案只一個渲染器） | three r186 |
| 補間 / 打擊回饋 | GSAP 3（只在 render / UI 層） | 3.15.0 |
| 骨骼 | `@esotericsoftware/spine-pixi-v8`（版本 = 編輯器 major.minor） | 4.3.13（只對過型別） |
| 音效 | 原生 Web Audio 合成（0 bytes）；音檔多才加 howler（≈ 28 KB） | 2.2.4 |
| UI | HTML/CSS 疊在 canvas 上 | — |
| 建置 | Vite，`assetsInlineLimit: 0`、資產帶 hash | 8.3.2 |

**禁止**：Unity / Cocos / Babylon / Phaser 等整套引擎；`gsap/all`、ScrollTrigger、PixiPlugin；為小功能引大套件。新依賴先估 gzip 大小並寫進 size budget。

實測大小：Pixi + GSAP + 遊戲程式 ≈ 710 KB（gzip 230 KB）；KTX2 transcoder ≈ 0.9 MB；Draco wasm ≈ 280 KB；Meshopt ≈ 32 KB。

## 3. 分層與迴圈契約
<!-- card: KB-tech-stack.layering; kind=method -->

```
input 佇列 ─▶ sim.step()（固定 1/60 s，可一幀多步）─▶ sim.events
                                                      │
                                render / fx / ui 讀事件播 juice（不回寫 sim）
```

| 層 | 目錄 | 規則 |
|---|---|---|
| Sim | `src/sim/` | 純 JS；禁 DOM / Pixi / GSAP / `Math.random` / `Date` |
| Render | `src/render/` | 讀 sim 狀態畫圖、可插值、可降效 |
| FX | `src/fx/` | 手感數值全在 `feel.js` 的 `FEEL` |
| UI | `src/ui/` | DOM HUD、GSAP 補間 |
| Audio | `src/audio/` | Web Audio 合成 |
| Net | `src/net/` | 上傳 `{seed, inputLog, claimedScore}`（**SwarmDuel 未實作**） |

- 輸入進佇列，慢幀不可吞點擊；hit-stop 只停 render，sim 照跑。
- 動畫格以 **sim tick** 推進（暫停 / 選卡時凍結）。

## 4. 確定性規則（跨引擎重播一致）
<!-- card: KB-tech-stack.determinism; kind=method; topic=tech,fairness; rules=RULE-SIM-PURITY -->

| 規則 | 原因 |
|---|---|
| 固定步長 1/60 s；渲染只插值 | 幀率不影響結果 |
| 隨機只用 `rng(seed, stream, index)` 無狀態雜湊（`hash32`，具名 stream） | 呼叫順序不影響序列 |
| 判定不用 `sin/cos/atan2/pow`；方向用查表（Taylor 級數用四則運算建表），距離比平方 | JSC（iOS）與 V8（伺服器）超越函數末位可能不同；`Math.sqrt` IEEE 保證一致 |
| 位置存整數子像素（1/256） | 避免浮點累積 |
| 實體依 id 遞增處理；碰撞空間雜湊後依 id 排序 | 迭代順序固定 |
| 狀態雜湊 `stateHash(sim)` | 重播比對 |

**Skill-core（範本內建，遊戲無關）**：[templates/src/sim/core/](../.claude/skills/lite-skillgame-stack/templates/src/sim/core/) — `rng`（`makeRng` 具名 stream、`int / range / shuffle`、`seedFromString`）、`fixed`（定點、Taylor 查表 SIN/COS、`angleOf` 取代 atan2、8 向 DX/DY）、`hash`（`createHasher`）、`match`（`Recorder`、`replay`、`verify`（含版本檢查）、`encodeLog`、`playMatch`）。遊戲只需在 `sim/sim.js` 匯出符合 GameDef 契約的 `GAME`。

### 輸入紀錄格式

- 每 tick 1 byte（例：bits0-3 方向、bit4/5 動作鍵）；離散選擇另存 `{tick, index}` 事件
- 180 s × 60 = 10,800 bytes → RLE 後 < 2 KB

## 5. Draw Call 與資源管線
<!-- card: KB-tech-stack.drawcalls; kind=method; topic=budget; rules=RULE-DRAWCALL-2D,RULE-DRAWCALL-3D -->

- 同場景一起出現的東西放同一張 atlas（Pixi 8 一批 ≤ 16 張貼圖）。
- 打斷合批：換 blend mode、filter、mask、Graphics 與 Sprite 交錯、Text、RenderTexture → 集中、要少。
- 固定圖層：`ground → groundFx → actors(Y 排序) → projectiles → additiveFx → overlay`。
- 靜態 Graphics 用 `renderer.generateTexture()` 轉貼圖；文字用 `BitmapText` 或 DOM。
- 3D 重複物件一律 instancing；同類共用材質，顏色用 instance attribute。

| 內容 | 格式 |
|---|---|
| 像素風 sprite | PNG-8（≤ 32 色）——KTX2 會糊且更大 |
| UI 圖示 / 小圖 | WebP / PNG atlas |
| 手繪大圖、3D 貼圖 ≥ 512² | KTX2（ETC1S；細節用 UASTC），transcoder 自架並計入包體 |
| 主視覺 | WebP q78 / AVIF（只在 DOM） |
| glTF | Meshopt 優先，Draco 只在模型量大時 |
| 音樂 | Opus 48–64 kbps 單聲道循環，延遲載入 |

量測：`templates/src/debug/drawCalls.js`（包 `gl.draw*` 計數）、Spector.js。

## 6. 包體預算範本（≤ 8 MB）
<!-- card: KB-tech-stack.bundle-budget; kind=method; topic=budget; rules=RULE-BUNDLE-SIZE -->

| 類別 | 上限 |
|---|---|
| 引擎 + 程式（含 Spine runtime） | 1.2 MB |
| 角色 / 敵人 atlas | 1.0 MB |
| 場景 / 3D 模型 | 1.0 MB |
| UI 圖示、字型 | 0.4 MB |
| 主視覺 / 商店圖 | 0.4 MB |
| 音樂（首包 1 首） | 2.0 MB |
| 音效 | 0～0.3 MB |
| 預留 | ≥ 1.5 MB |

參考實績：SwarmDuel 原型 978 KB（brotli 460 KB），完整版預算 5.4 MB。

## 7. 手機直版 RWD 規格（SwarmDuel 實作，可沿用）
<!-- card: KB-tech-stack.portrait-rwd; kind=method; topic=ux -->

| 項目 | 規格 |
|---|---|
| 邏輯解析度 | 寬 720；高 = clamp(720 × 高/寬, 1280, 1600) |
| 世界視窗 | 所有裝置固定 720×1280（公平視野 E3） |
| 縮放 | canvas 依 min(寬比, 高比) 等比；像素圖最近鄰 + `roundPixels` |
| 安全區 | `env(safe-area-inset-*)` 轉邏輯 px |
| 電腦 / 平板 | 同一直版欄位置中，兩側模糊主視覺 |
| 手機橫拿 | 全屏轉向提示並暫停 |
| 觸控 | 主要按鈕 ≥ 44 pt；浮動搖桿（任意處拖曳）、輕點 < 220 ms = 動作 |
| 外殼 | PWA（`orientation: portrait`），必要時 Capacitor |

## 8. 範本與起手
<!-- card: KB-tech-stack.template; kind=method; topic=process -->

```bash
cp -r .claude/skills/lite-skillgame-stack/templates <NewGame>/game
```

範本內容：`index.html`（`#stage > #stage-shake > canvas`，`#fx`、`#hud` 為兄弟節點）、`main.js`（GSAP 全域設定 + 固定步長迴圈 + 結束時 `verify` 重播驗分）、`sim/core/`、`sim/sim.js`（示範 Beat Tap）、`test/{core,determinism}.test.mjs`、`tools/{bots,skill-dominance}.mjs`、地形模組（`render/terrain*.js`、`tools/tile_check.py`，見 [11 §7](11_terrain-style-kit.md)）、`fx/{feel,shake,overlay,shockwave,particles}.js`、`render/spineActor.js`、`debug/drawCalls.js`、`scripts/size-check.mjs`。已驗證 `npm test` 41/41、build 637 KB（brotli 190 KB）、含地形背景與遮擋示範基礎 DC 1；另含品類配方範例、時間戳輸入、合成音效（見 [12](12_genre-recipes.md)～[14](14_audio.md)）。玩法規格範本：[game-spec-template.md](../.claude/skills/lite-skillgame-stack/references/game-spec-template.md)。目錄結構見 skill 的 [references/bootstrap.md](../.claude/skills/lite-skillgame-stack/references/bootstrap.md)。

## 9. 交付前自檢
<!-- card: KB-tech-stack.delivery-check; kind=method; topic=process -->

- [ ] `npm run build && npm run size` 通過
- [ ] 基礎 DC ≤ 5（2D）/ ≤ 9（3D），寫明峰值
- [ ] `sim/` 內 grep 不到 `gsap|pixi|document|Math.random|Date`
- [ ] 無執行期 CDN 依賴
- [ ] reduced-motion / LOW 下所有 juice 有降級
- [ ] 手感數值都在 `FEEL`
- [ ] 自寫 fragment shader 開頭有 `precision highp float;`
- [ ] `npm test`：同種子同輸入 → 同分數、同 stateHash
