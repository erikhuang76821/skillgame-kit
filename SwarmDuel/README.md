# Swarm Duel: Cryptid Camp（工作代號）

同種子（Same-Seed）對戰的 survivor-like **技巧型遊戲（skill game）**。

| 項目 | 決定 |
|---|---|
| 市場 | **北美**（擇一；理由見下） |
| 畫面 | **手機直版唯一**（硬需求）：9:16～9:20 RWD；不做橫版；電腦上是同一個直版欄位；手機橫拿時暫停並提示轉直 |
| 框架 | PixiJS 8.22.0 + GSAP 3.15.0（Vite 8 建置） |
| 包體 | 目標 ≤ 8 MB（硬上限 10 MB）；原型實測 922 KB（brotli 405 KB） |

## Skill game 的精髓 → 本作怎麼做到

| 精髓 | 做法 |
|---|---|
| 技巧主導 | 分數只來自玩家行為；Perfect Dodge、Howl 時機、走位、選卡 |
| 條件相同 | 同種子 = 同敵潮、同升級卡、同掉落；無暴擊、無機率掉落 |
| 視野相同 | 所有裝置的世界視窗固定 720×1280，高螢幕不多看 |
| 規則透明 | 標題寫明計分公式；結算逐項列出分數來源 |
| 錢買不到分數 | 排位只賣外觀 |
| 可驗證 | 確定性模擬 + 輸入紀錄重播驗分（結算畫面即時顯示 ✓） |
| 有證據 | `tools/skill-dominance.mjs`：技巧等級解釋 71% 分數變異；⚠ 技巧天花板偏平（R9），見 [gdd/03](gdd/03_skill_integrity.md) |

## 目錄

| 路徑 | 內容 |
|---|---|
| [gdd/](gdd/) | Lean 模組化 GDD：00 定位、01 循環、02 玩法、**03 技巧完整性**、04 內容、06 經濟、07 變現、08 進度、10 技術（含直版規格）、11 風險 |
| [docs/asset_pipeline.md](docs/asset_pipeline.md) | 美術契約（PokéSurvivor 八方向 sprite）、Codex CLI 生圖、打包驗證、壓縮 |
| [docs/size_budget.md](docs/size_budget.md) | 包體預算、壓縮、降動態效果規則 |
| [docs/skill_dominance_report.md](docs/skill_dominance_report.md) | 自動產生的技巧 vs 運氣報告 |
| [docs/ux_gap_analysis.md](docs/ux_gap_analysis.md) | 對照 Survivor.io / Vampire Survivors / 20MTD 的畫面與 UI/UX 落差與改善 |
| art/（`SwarmDuel/art`，未收錄） | `prompts/` 生圖 prompt、`raw/` Codex 原始輸出、`native/` 原生尺寸佔位幀 |
| tools/derive_native.py（`SwarmDuel/tools/derive_native.py`，未收錄） | 身分圖 → 原生尺寸佔位 sprite（機械處理） |
| game/（`SwarmDuel/game`，未收錄） | 可玩原型 |

## 套用的 skill

- **pokesurvivor-asset-dev**：八方向 sheet 列序、逐動畫 `{w,h,n,r,d,ax,ay}`、腳底錨點、Y 排序、繪製順序、`sprite_sheet.py` 驗證。原 skill 為 Canvas 2D，依其指示移植為 Pixi adapter（`game/src/render/spriteContract.js`）
- **gdd-framework**：`gdd/` 結構與三段式寫法
- **codex-image**：`codex exec` 生圖 → 依 session id 複製

## 市場擇一：為何北美

| 面向 | 北美 | 台灣 |
|---|---|---|
| Skill game 品類 | 有技巧競賽平台與付費參賽生態（依州法） | 現金技巧賽受限，實質只能做 F2P |
| 品類熱度 | survivor-like 與像素風受眾大 | 有受眾，付費偏抽卡 |
| 美術 | 16-bit 像素 + 美式卡通 + 美國都市傳說 | 需改題材 |

改台灣時只換：`art/`、`game/src/i18n/`、`gdd/06`、`gdd/07`。玩法、技術、直版規格不變。

## 指令

```bash
cd game && npm install && npm run dev
```

```bash
cd game && npm test
```

```bash
cd game && npm run build && npm run size
```

```bash
cd game && node tools/skill-dominance.mjs 30
```

原型操作 — 手機：拖曳任意處移動、輕點 Dash、右下按鈕 Howl。電腦：WASD / 滑鼠拖曳、Space / 單擊 Dash、E Howl、Q 切換特效。網址加 `?seed=XXXXXXXX&score=N` 可分享同種子挑戰。
