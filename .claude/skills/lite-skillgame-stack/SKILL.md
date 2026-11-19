---
name: lite-skillgame-stack
description: 輕量化 HTML5 單機 Skill Game 技術規範（包體 5～10 MB、Draw Call 個位數、打擊感以算代貼）。凡在本 repo 初始化新遊戲專案、寫玩法規格或確定性模擬（sim、種子、重播驗分、bot、技巧主導測試）、設計或驗收難度曲線（難度級、自動化試玩、playtest）、寫渲染/動畫/音效/資源載入程式、加特效或打擊感（震動、衝擊波、粒子、hit-stop）、寫 GSAP 補間 / timeline / 緩動、調手感參數、接 Spine 骨骼、處理 Draw Call 或包體超標、選型評估（要不要加某個函式庫）時都要先讀本 skill。觸發詞：「開新遊戲」「初始化專案」「加特效」「打擊感」「畫面震動」「Spine」「GSAP」「緩動」「手感」「Draw Call」「包體」「難度曲線」「難度測試」「KTX2」「3D 物件」「粒子」。
---

# 輕量 Skill Game 技術規範

目標：**包體 ≤ 10 MB（目標 ≤ 8 MB，首包 ≤ 3 MB）**、**2D 基礎 Draw Call ≤ 5 / 3D ≤ 9**、操作回饋靠程式運算而非貼圖。

## 0. 優先序（衝突時誰說了算）

1. **專案自己的技術文件**（如 `SwarmDuel/gdd/10_tech_constraints.md`、`docs/size_budget.md`）已明確決定的事項 > 本 skill。
2. **確定性（Skill Game 的命根）** > 打擊感。模擬層（`sim/`）不得出現 GSAP、Pixi、DOM、`Math.random`、`Date`；所有 juice 只活在 render / UI 層，高低特效玩家同種子結果必須一致。
3. 本 skill 的通則。

動手前先讀當前專案的技術文件；沒有的話照本 skill 建立（見 [references/bootstrap.md](references/bootstrap.md)）。

**開新遊戲**：先照 [bootstrap.md §0](references/bootstrap.md) 讀完 repo `knowledge-base/` 的必讀頁再動手；範本只帶程式，設計知識（技巧完整性、難度曲線、手感、音效、美術、改編題的改造清單）都在知識庫。門檻與必備產出以 `knowledge-base/index/rules.json` 為準，交付前 `npm run audit` 必過。

## 1. 技術棧（白名單）

| 用途 | 選擇 | 備註 |
|---|---|---|
| 2D 渲染 | `pixi.js` 8.x（鎖確切版本） | WebGL2 為預設；WebGPU 視專案開 |
| 3D 渲染 | `ogl` 優先；需要生態（GLTFLoader 等）才用 `three` | **一個專案只選一個渲染器**，不同時載 Pixi + three |
| 補間 / UI 動畫 / 打擊回饋 | `gsap` 3.x | 只在 render / UI 層 |
| 骨骼 | `@esotericsoftware/spine-pixi-v8`（Pixi 8 用這個，不是 `spine-pixi`） | runtime 版本 major.minor 必須等於 Spine 編輯器匯出版本 |
| 音效 | 原生 Web Audio（SFX 程式合成 = 0 bytes）；需要大量音檔管理才加 `howler`（core ≈ 28 KB min） | 音樂用 Opus/WebM，延遲載入 |
| UI | 純 HTML + CSS 疊在 canvas 上 | 計分板、彈窗、選單一律 DOM |
| 建置 | Vite，`assetsInlineLimit: 0`，每個資產帶 hash | 加 `npm run size` 包體檢查並在 CI 擋 |

**禁止**：Unity / Cocos / Babylon / Phaser 等整套引擎；為一個小功能引入大型套件；從 CDN 執行期載入程式碼（含 transcoder，見 §2）。新增任何依賴前先估 gzip 大小並寫進專案 size budget。

細節與實測大小：[references/stack-and-budget.md](references/stack-and-budget.md)

## 2. Draw Call 與資源管線（硬規則）

- **2D**：同場景會一起出現的角色 / 特效 / 粒子 / 道具放同一張 atlas（或同一批 ≤ 16 張以內，Pixi 8 會多貼圖合批）。打斷合批的東西——**切 blend mode、filter、mask、Graphics 與 Sprite 交錯、RenderTexture**——要集中、要少。基礎畫面 ≤ 5 DC。
- **3D**：重複物件（子彈、障礙、背景件、特效片）一律 `InstancedMesh`（three）或 instanced attribute（ogl），同類共用一個材質。≤ 9 DC。
- **紋理格式依內容選，不是一律 KTX2**：
  - 像素風 / 小圖 / UI → PNG-8 或 WebP（KTX2 會糊、檔案不會更小）
  - 大張手繪貼圖、3D 貼圖（≥ 512²，VRAM 吃緊時）→ KTX2（ETC1S 為主、UASTC 給需要細節的）
  - 用 KTX2 時 transcoder（Pixi 的 `libktx` ≈ 0.9 MB、basis ≈ 0.5 MB）**必須自架並計入包體**；Pixi 預設會去 jsDelivr 抓未鎖版本的檔，一律用 `setKTXTranscoderPath` 指回本地
- **3D 模型**：glTF + **Meshopt 優先**（decoder ≈ 32 KB）；Draco decoder ≈ 280 KB wasm，只在模型總量大到值得時才用。解碼在 worker / 非同步。
- 每次加資產後跑 `npm run build && npm run size`；開發期掛 Draw Call 計數器（[templates/src/debug/drawCalls.js](templates/src/debug/drawCalls.js)）。

細節：[references/drawcalls-assets.md](references/drawcalls-assets.md)

## 3. Spine 骨骼

- `state.data.defaultMix = 0.2`；特定組合用 `state.data.setMix(a, b, t)` 覆寫。
- **Track 0 = 下半身 / 基礎循環**（idle、run）；**Track 1+ = 疊加動作**（攻擊、施法、受擊），播完 `addEmptyAnimation(track, 0.2, 0)` 淡回。疊加動畫在編輯器只 key 上半身骨骼——這是美術契約，不是程式能補的。
- **換裝不重建物件**：整套換用 `skeleton.setSkin(name)` 或組合 `new Skin()` + `addSkin()`，之後 `skeleton.setupPoseSlots()`；單件換用 `skeleton.setAttachment(slot, name)`。
- Spine 4.3 API 已變：`setSkinByName` 是 private、`setSlotsToSetupPose` → `setupPoseSlots`、沒有 `getCurrent`（用 `state.tracks[i]`）。**寫之前查已安裝版本的 `.d.ts`。**
- Spine 的 atlas 頁也算貼圖；加色（additive）slot 會切 blend mode 打斷合批。

範例與檢查清單：[references/spine.md](references/spine.md)、[templates/src/render/spineActor.js](templates/src/render/spineActor.js)

## 4. 打擊感（以算代貼）

| 效果 | 做法 | DC 成本 |
|---|---|---|
| 畫面震動 | GSAP 抖動包住 canvas 的 `<div>`（`transform`，合成層處理） | 0 |
| 受傷泛紅 / 暗角 / 閃白 | **CSS overlay**（`radial-gradient` + opacity 補間） | 0 |
| 衝擊波 / 扭曲 / 色差 | GLSL Filter，**只在作用期間掛上、結束就拿掉**，只掛在一個頂層 container | +1～2 pass |
| 粒子 | Pixi 8 `ParticleContainer` + `Particle`，貼圖用 atlas 內一個小點或 `generateTexture` 產生 | 1 |
| Hit-stop | 只停 render 層插值與 Spine `autoUpdate`；模擬照跑或由 sim 決定性地處理 | 0 |
| 數字跳字 | Pixi `BitmapText`（同 atlas）或 DOM，量大時用前者 | 0～1 |

規則：所有 juice 都要尊重 `prefers-reduced-motion` 與遊戲內「降低特效」開關；震動目標是 canvas 外框而不是 HUD（HUD 放在震動容器外）。

程式：[references/juice.md](references/juice.md)、[templates/src/fx/](templates/src/fx/)

## 5. GSAP 參數（寫任何補間前必過）

完整說明：[references/gsap.md](references/gsap.md)。最少要確認：

- **全域**：`gsap.defaults({ duration: 0.25, ease: 'power2.out', overwrite: 'auto' })`、`gsap.config({ force3D: true })`、`gsap.ticker.lagSmoothing(500, 33)`。
- **每個補間**：`duration`（擋操作的 ≤ 0.3 s；出場比進場快）、`ease`（打擊 `power4.out`、回彈 `elastic.out(1, 0.35)`、彈出 `back.out(1.7)`、震動 `'none'`）、`overwrite`、`stagger` 物件形式、timeline 後段的 `from()` 設 `immediateRender: false`。
- **序列**用 timeline + position 參數（`'<'`、`'>-0.1'`、標籤），不要串 `delay`；子補間共用值放 `timeline({ defaults })`。
- **Pixi 物件**：補間 `sprite.scale` 本身、`rotation` 是弧度；不用 PixiPlugin（破壞 tree-shaking、filter 類屬性打斷合批）。
- **每幀跟隨**用 `gsap.quickTo`，禁止在 ticker 內 `gsap.to()`；場景用 `gsap.context()` 包、離開時 `revert()`；物件池回收前 `killTweensOf`。
- **降級**用 `gsap.matchMedia()` 寫入 `FEEL`，效果函式只讀 `FEEL`。
- **即時調參**：手感數值全在 [templates/src/fx/feel.js](templates/src/fx/feel.js)，dev 掛 `window.FEEL`；長演出用 GSDevTools（只 dev 動態載入）。
- **外掛**逐一 import：推薦 CustomEase、CustomWiggle、Physics2DPlugin；不要 `gsap/all`、ScrollTrigger、PixiPlugin。

## 6. 新專案起手

照 [references/bootstrap.md](references/bootstrap.md)：目錄結構、迴圈契約、啟動提示詞。範本在 [templates/](templates/)（pixi 8.22 / gsap 3.15 / vite 8.3 實際 build + 瀏覽器跑過；Spine 封裝只對過型別）。

- **Skill-core**（[templates/src/sim/core/](templates/src/sim/core/)）：無狀態 RNG、定點與查表三角、stateHash、Recorder / replay / verify、輸入 log 編碼。每款遊戲原樣複製、不修改；遊戲規則只寫在 `sim/sim.js` 並匯出 `GAME`。
- **玩法規格**：寫 sim 前先填 [references/game-spec-template.md](references/game-spec-template.md)，每節對應一段程式。
- **地形**（平面 / 2.5D 高低差）：`core/grid.js`（種子地形格、圓角形狀 `smoothCellAt`，sim 碰撞與畫面共用）＋ `render/terrainBake.js`（邊界擾動、碎粒、崖面、側緣）＋ `render/terrain.js`（區塊預烘快取、2.5D 投影、高台遮擋片與 `isOccluded()`）＋ `render/xray.js`（被遮擋角色的輪廓）＋ `render/terrainConfig.js`（各遊戲數值）。角色放進 y 排序容器、`zIndex` = 世界腳底 y；高台遮擋片自動插入同一容器。提詞與規格見 repo `knowledge-base/11_terrain-style-kit.md`；生成的材質 tile 用 `python tools/tile_check.py` 驗接縫與色域。
- **品類配方**（`knowledge-base/12`）：`core/timing.js`（子 tick 判定、種子譜面、capped combo）、`core/physics.js`（確定性圓形物理、球袋、防穿透），範例 `examples/rhythm`、`examples/billiards`（各含三級 bot）。
- **輸入公平**（`knowledge-base/13`）：`core/input.js` 的 `InputClock` / `TapQueue` 以事件時間戳決定 tick 與子 tick 相位（幀率無關），`calibrate()` 延遲校正寫進 `rec.meta`；範本 `main.js` 已接上。
- **音效**（`knowledge-base/14`）：`src/audio/sfx.js` Web Audio 合成配方，首次手勢 `unlock()`。
- **技巧證據（結果表）**：`tools/strategies.mjs`（強、隨機、簡單三種角色的策略，各寫明能看到什麼與能力限制）+ `npm run evidence`（調校用題目）／`npm run evidence:confirm`（確認用題目，寫入 `docs/skill_evidence_ledger.json`），同題配對的勝平敗、精確符號檢定、簡單策略的接近程度；適用於由種子抽題、每題一局、分數越高越好的遊戲（回合制與即時制皆可），回合制範例 `examples/ends`。量法見 repo `knowledge-base/decisions/2026-11-11-skill-evidence.md` §9。規則：`RULE-SKILL-EVIDENCE`、`RULE-SKILL-NOT-LUCK`、`RULE-SKILL-BEATS-SIMPLE`（必過）與 `RULE-SKILL-CLOSENESS`（人工判定）；門檻只在 rules.json，指令列不能自訂。第一次確認要在策略凍結後由人下指令（關卡跑的是 `--require-recorded`：只重跑已記錄的批次，沒有紀錄就拒絕，不會自動開批）；確認用題目用過就只能原樣重跑，改過策略或規則要換下一批（`--generation`）。N4 產出策略檔，N5 由這三條必過規則擋關（三張測試卡各對應一條）；接近程度的人工核准在 N5 接上前（泛用化步驟 4d）先在 N10 生效。
- **技巧佔比（舊配方，只用於現有三款）**：`tools/bots.mjs`（≥ 3 級）+ `node tools/skill-dominance.mjs 30`。`RULE-SKILL-DOMINANCE`、`RULE-SKILL-BASELINE` 只套用到 SwarmDuel、TwinStrike、GateLane，而且只是警告；新遊戲不需要分級 bot。新遊戲刪掉 `bots.mjs` 與 `skill-dominance.mjs` 即可：範本的測試、試玩與技巧證據都改用 `tools/strategies.mjs`，只有舊指標的示範測試會自動略過。
- **難度曲線**（repo `knowledge-base/16_difficulty-curve.md`）：曲線用固定腳本設計（難度級每級只加一件事、上升鋸齒、調息、段末頭目），種子只換同級內容；以人性化試玩 bot 逐單位驗收 D1–D8（門檻見 rules.json `RULE-CURVE-*`）。範本已附 `tools/humanBots.mjs`、`tools/playtest.mjs`（示範遊戲的單位與 DI，每款改寫）與通用的 `tools/lib/curve.mjs`；`npm run playtest` 產生 `docs/playtest_report.md`。節奏類完整範例（含圖表）：`TwinStrike/game/tools/playtest.mjs`。

## 7. 交付前自檢

- [ ] `npm run build && npm run size` 通過預算
- [ ] 開發計數器顯示基礎畫面 DC ≤ 5（2D）/ ≤ 9（3D），特效全開時寫明峰值
- [ ] `sim/` 內 grep 不到 `gsap|pixi|document|Math.random|Date`
- [ ] `npm test` 全過（core + determinism，含 golden match 與調校題目上的技巧證據）
- [ ] `npm run evidence:confirm` 通過（`RULE-SKILL-EVIDENCE`、`RULE-SKILL-NOT-LUCK`、`RULE-SKILL-BEATS-SIMPLE`），報告的「簡單策略的接近程度」有人看過並寫下理由（`RULE-SKILL-CLOSENESS`）
- [ ] 改了會影響結果的規則 → `GAME.version` +1、golden match 已更新
- [ ] 有腳本進程的遊戲：難度曲線自動試玩（`npm run playtest`）D1–D8 全過，調校紀錄寫進 `gdd/07`（knowledge-base/16）（`game.profile.json` 的 `scriptedProgression` 為 false 的遊戲不適用）
- [ ] `npm run audit` 必要項目全過（gdd 03 / 05 / 10 / 11，有腳本進程的遊戲另加 07 與試玩報告；報告無未通過項；改編題 gdd/05 §13 逐條回應改造）；警告項（沿用範本的 `feel.js` / `sfx.js`）有處理或寫明理由
- [ ] 沒有執行期 CDN 依賴（transcoder、字型、wasm 全部本地）
- [ ] reduced-motion / LOW 特效下所有 juice 有降級
- [ ] 手感數值沒有寫死在效果函式裡（都在 `FEEL`）
- [ ] 自寫 GLSL 片段 shader 開頭有 `precision highp float;`（與頂點 shader 共用 uniform，精度不一致會 link 失敗）
