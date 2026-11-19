# 10 技術限制

> 技術規範：`lite-skillgame-stack` skill；[04_tech-stack](../../knowledge-base/04_tech-stack.md)。門檻以 `knowledge-base/index/rules.json` 為準，本作**目前無覆寫**（不建 `config/rules.overrides.json`）。
> 上架規範（2026-11-18 使用者提供）的對照見 [docs/store_listing.md](../docs/store_listing.md)。

| 項目 | 做法 |
|---|---|
| 渲染 | PixiJS 8，2D。**真像素**：整個畫面畫在固定的低解析 canvas（近 540×960／中 720×1280／遠 900×1600 美術像素），1 美術像素 = 1 canvas 像素，再以最近鄰放大到螢幕（螢幕許可時用整數倍）。不旋轉、不縮放單張圖；牆是沿圓環擺放的不旋轉方塊。實測基礎畫面 1 DC；`RULE-DRAWCALL-2D` |
| 縮放 | 雙指捏合、滑鼠滾輪、畫面右下 ＋／－。三段縮放改變的是 canvas 能裝多少美術像素，不是縮放圖片，所以像素格永遠一致 |
| 立體感 | 體素式堆疊：牆 4 層、主城 4 層、軍營 3 層、樹 2 層，每層往上 1 美術像素、下層較暗；站立物件腳下有像素橢圓陰影 |
| 美術 | 像素 atlas 共 91 KB，見 [02](02_art_spec.md)、`art/manifest.json`（已登錄共用資產庫） |
| UI | HTML/CSS 疊在 canvas 上：資源列、構築列、選單、三選一卡（像素圖示）、縮放鈕 |
| sim | 固定 60 Hz、定點、無 `Math.random` / `Date` / DOM（`RULE-SIM-PURITY`） |
| 輸入紀錄 | 每 tick 1 byte（core `Recorder`），選卡另記 `choices`；結束時在本機重播驗證 |
| 實體上限 | 敵 400、我方 64 |
| 路線 | 不用流場：怪物在牆外沿圓環一段一段走到最近缺口（`gapDir`），每 tick 最多查 24 段 |
| 單機 | 不連線、不做線上排行榜、不做雲端存檔（上架規範） |
| 包體 | 一般 build 約 811 KB（gzip 273 KB）；上架用單檔 zip 約 265 KB；`RULE-BUNDLE-SIZE` |
| 上架打包 | `npm run build:zip` → `release/lanternhold.zip`：只有一個 `index.html`，程式、樣式、圖片都內嵌，雙擊即可執行（file://），執行時不連任何外部網址 |
| 資源載入 | 全部打包，不從 CDN 載入（`RULE-NO-RUNTIME-CDN`）；Pixi 不用 worker 解碼 |
