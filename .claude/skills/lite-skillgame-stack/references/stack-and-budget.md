# 技術棧與包體預算

## 實測大小（2026-10-19，npm 安裝後量測未壓縮檔）

| 套件 / 檔案 | 版本 | 大小 | 進包體條件 |
|---|---|---|---|
| pixi.js（遊戲常用子集，tree-shake 後） | 8.22.0 | 連同遊戲程式 + GSAP ≈ 710 KB / gzip ≈ 230 KB（SwarmDuel 實測） | 一定 |
| gsap core | 3.15.0 | 含在上列 | 一定 |
| @esotericsoftware/spine-pixi-v8（iife min） | 4.3.13 | ≈ 228 KB | 有用 Spine 才加 |
| howler.core.min.js | 2.2.4 | ≈ 28 KB | 只在音檔多到需要管理時 |
| Pixi KTX2 transcoder `libktx.js + .wasm` | 8.22.0 | ≈ 212 KB + 700 KB | 用 KTX2 才加，延遲載入 |
| Pixi Basis transcoder `basis_transcoder.js + .wasm` | 8.22.0 | ≈ 84 KB + 440 KB | 用 `.basis` 才加 |
| three Draco decoder wasm | r186 | ≈ 280 KB | glTF 用 Draco 才加 |
| three Meshopt decoder | r186 | ≈ 32 KB | glTF 用 Meshopt 才加 |
| three basis transcoder wasm | r186 | ≈ 516 KB | three 用 KTX2 才加 |

數字會隨版本變動；**以 `npm run build && npm run size` 實測為準**，新增依賴時把實測值寫進專案的 size budget。

## 預算範本（≤ 8 MB）

| 類別 | 建議上限 |
|---|---|
| 引擎 + 程式（含 Spine runtime） | 1.2 MB |
| 角色 / 敵人 atlas | 1.0 MB |
| 場景 / 3D 模型 | 1.0 MB |
| UI 圖示、字型 | 0.4 MB |
| 主視覺 / 商店圖 | 0.4 MB |
| 音樂（Opus 循環，首包 1 首） | 2.0 MB |
| 音效 | 0（Web Audio 合成）～ 0.3 MB |
| transcoder / decoder | 只算實際用到的 |
| 預留 | ≥ 1.5 MB |

## 選型判斷

- **2D 還是 3D**：Skill game 多數 2D 就夠。真的要 3D 時整個專案改用 ogl（或 three），不要 Pixi 上疊一個 3D canvas——兩個 WebGL context、兩份 runtime、DC 與記憶體都翻倍。
- **ogl vs three**：ogl 小、API 接近原生 WebGL，自己寫 instancing 與 shader；three 生態完整（GLTFLoader、KTX2Loader、InstancedMesh）但 tree-shake 效果有限。要載 glTF + 壓縮貼圖又不想自己寫 loader → three。
- **Howler vs 原生**：SFX 盡量用 Web Audio oscillator / noise 合成；只有大量錄音素材、需要 sprite 音檔、iOS 解鎖等雜事想省事時才加 Howler。
- **GSAP**：自 2025 起全部外掛免費；只 import 用到的外掛（如 `CustomEase`），不要整包。
- **版本**：`package.json` 寫確切版本（不加 `^`），升級時一次一個、重跑 size 與 DC 檢查。
