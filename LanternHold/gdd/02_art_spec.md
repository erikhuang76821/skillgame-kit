# 02 美術與資產設定（像素版）

> 管線：[06_art-pipeline](../../knowledge-base/06_art-pipeline.md)、[10_asset-library](../../knowledge-base/10_asset-library.md)。台灣禁忌：`RULE-ART-TW-TABOO`（每張圖人工驗收）。登錄：`RULE-ASSET-REGISTER`。
> 包體與 Draw Call 門檻見 `RULE-BUNDLE-SIZE`、`RULE-DRAWCALL-2D`，本頁只列實測與預估。
> **v3（2026-11-18）**：由手繪平塗改為像素風。舊版的牧場、礦場、工人工作動作、英雄、3 向角色都已拿掉。

## 1. 風格

| 項目 | 設定 |
|---|---|
| 名稱 | 暖燈夜林像素（原創） |
| 視角 | 俯視 3/4；角色只畫朝右，朝左在程式水平鏡像 |
| 筆觸 | 16-bit 像素，大方塊、無反鋸齒、無漸層；1 px 深靛外框（不用純黑） |
| 色彩 | 深靛／青夜色為底；焦點是暖橘燈光；敵人冷紫＋亮紫邊；友軍暖色、輪廓清楚 |
| 可讀性 | 燈光內亮、燈光外暗；敵人永遠有亮紫邊，暗處也看得到 |
| 要避開 | 雪地、暖爐、寒冷末日（參考作品的識別元素）；錢幣（金幣一律畫金塊或皮袋）、骰子、轉盤、紅金大面積、「倍」字；神明、宗教符號、招財貓；大面積純黑／純白 |

### 1.1 調色盤（共用 32 色，`game/src/assets/pixel/palette.json`）

固定 token（生成 prompt 與量化都鎖這 7 色），其餘 25 色由 `art/tools/build.py` 對全部幀做 median cut＋k-means 得出：

| token | 值 | 用途 |
|---|---|---|
| `outline` | #1b1530 | 外框（調色盤第 0 格） |
| `lamp` | #ffb64a | 燈光核心、主城光束 |
| `foe-rim` | #c6a8ff | 敵人亮邊 |
| `ally` | #6fd3c4 | 友軍旗色、治療者長袍、冰系 |
| `steel-hi` / `steel` / `steel-lo` | #c4c8d6 / #848aa0 / #54586e | 金屬、石材（沒有這三格時灰色會被吸到紫色） |

程式繪製的光暈、選取圈、血條等沿用：`night-0` #141a33、`night-1` #1f2a4a、`night-2` #2f3b5e、`lamp-soft` #ff8a3d（低透明度）、`danger` #ff5a5a。

## 2. 像素契約

| 項目 | 規格 |
|---|---|
| 比例 | **1 art px = 2 world px**；`scaleMode: 'nearest'`、`roundPixels` |
| 世界 | 720×1280，鏡頭縮到約 0.62，所以 1 art px ≈ 1.24 螢幕 px |
| 錨點 | 角色、建築、樹：腳底（底部中央，外框列之上）；城牆、瓦礫、特效、圖示：中心；寶箱：底部中央。每格的 anchor 寫在 atlas JSON（Pixi v8 讀 `frames[*].anchor`） |
| 方向 | 角色只朝右；`scale.x = -1` 得到朝左 |
| 同一角色 | 所有動畫共用同一畫布大小，腳底與上半身重心對齊，換動畫不會跳 |
| Alpha | 二值（PNG-8 單一透明索引），沒有半透明像素 |
| 不畫進圖 | 陰影、受擊閃白、燈光半徑、血條、選取圈：由程式處理 |

## 3. 尺寸（art px，含 1 px 外框）

| 物件 | 尺寸 | 動畫 |
|---|---|---|
| 工人／弓箭手／盾兵／治療者 | 28×23、24×22、32×23、30×25（攻擊幀伸出武器，主體約 18×20） | idle 2、walk 4、attack 3 |
| 影鼠／甲蟲／飛蛾 | 18×10、20×13、24×18 | walk 4（飛蛾 fly 4） |
| 爆菇 | 16×14 | walk 4、swell 2 |
| 攻城蝸牛／鐵甲狼／暗影弓手 | 32×21、34×17、20×17 | walk 4、attack 2 |
| Boss 永夜之喉 | 主體約 56×52，畫布 134×53（attack 第 3 格吐霧） | walk 4、attack 3 |
| 主城 | 52×74 | 靜態 |
| 軍營 Lv1／2／3 | 36×32、40×32、40×35（帳篷 → 木屋 → 石屋） | 靜態 |
| 城牆（木柵／石／鐵）× 完好／龜裂／殘破 | 約 32×10，水平繪製，程式繞環旋轉 | 靜態 |
| 瓦礫、樹 3 種、石頭 2、燈柱 2 | 32×15、22–32×30、16–18×10–13、14×21 | 靜態 |
| 地表 tile（林地、道路） | 64×64 無縫 | — |
| 特效 | 爆炸／冰爆／火／蒸汽 16 左右 × 4 格；火花 3、升級閃光 4；箭 12×4；光束 24×8；閃電 24×7；金塊 8×7；寶箱 20×16 / 22×17 | — |
| UI 圖示 | 24×24：卡片 18、進化 4、資源 3（金塊、人口、守望星） | DOM 以 CSS 放大（`image-rendering: pixelated`） |

## 4. Atlas 與 Draw Call

| 檔案 | 內容 | 實測 |
|---|---|---|
| `units.png/json` | 友軍 4 種 × 3 動畫 | 256×122 |
| `foes.png/json` | 敵人 7 種＋Boss | 256×446 |
| `buildings.png/json` | 主城、軍營 3 級、城牆 9、瓦礫、樹、石頭、燈柱 | 256×116 |
| `fx.png/json` | 投射物、爆炸類、火花、金塊、寶箱 | 256×32 |
| `icons.png/json` | 25 個圖示 | 256×74 |
| `ground.png/json`、`ground_forest.png`、`ground_path.png` | 兩張 64×64 tile（單檔版給 TilingSprite） | 130×64 |

所有 atlas 都在 `game/src/assets/pixel/`，加總遠小於 1 張 2048²，可視需要在 build 時合併成一張世界 atlas（units＋foes＋buildings＋fx）把世界層壓到 1 個 Draw Call。圖層預估：地表 1 ＋ 世界 1–4（未合併時每張 atlas 各 1）＋ 數字 1 ＋ UI 0，合併後總計 3，未合併時最多 6，接線時要合併或分層以守 `RULE-DRAWCALL-2D`。

## 5. 包體

| 項目 | 實測／預估 |
|---|---|
| 像素資產（6 組 atlas＋JSON＋調色盤） | **實測約 93 KB** |
| 程式（Pixi + GSAP + 遊戲） | 預估 1.1 MB |
| 字型 | 預估 0.2 MB |
| BGM（分層） | 預估 1.8 MB |
| **合計** | **預估約 3.2 MB** |

## 6. 生成用風格鎖（英文，所有資產共用）

原文唯一來源：`art/tools/prompts.py` 的 `STYLE_LOCK`；每份 prompt 原文在 `art/prompts/*.txt`。

```
Style lock (LanternHold pixel set, shared by every asset): original 16-bit pixel art for a top-down 3/4 view
night-forest tower-defense game. TRUE LOW-RESOLUTION pixel art: every art pixel is a large crisp square block of
equal size, chunky clean clusters, no anti-aliasing, no gradients, no blur, no dithering noise. 1-pixel dark outline
in deep indigo (#1b1530), never pure black. Small shared palette: deep indigo and teal night tones, warm lamp orange
#ffb64a as the key light, light comes from the upper-left. Enemies are cool violet shadow creatures with a bright
lilac rim highlight (#c6a8ff); allies are warm readable silhouettes in amber, brown and teal (#6fd3c4). No large
areas of pure black or pure white. No coins, no religious symbols, no deities. Original design only, no existing
franchise or game. Background: perfectly flat solid pure green #00FF00 chroma-key filling the whole canvas, no
checkerboard, no ground plane, no cast shadow, no text, no letters, no numbers, no grid lines, no frames.
```

每種資產再接：物件描述 → 版面（列 = 動畫、格 = 影格，朝右、同一基線、格間留寬綠色空隙）→ 目標 art px 尺寸。

## 7. 管線與驗收

1. `python LanternHold/art/tools/prompts.py` 寫出 prompt；picanywhere 一次批次生成（一張 = 一個角色的全部動畫列，或一組物件）。
2. 原圖放 `art/raw/<name>_t<n>.png`，紀錄寫 `art/raw/LOG.md`。
3. `python LanternHold/art/tools/build.py`：綠幕去背 → 依空隙切格 → 預乘 BOX 縮到目標尺寸 → 每個角色先局部量化（去雜點）→ 硬映射共用 32 色（不抖色）→ 二值 alpha → 1 px 外框（暗邊直接改外框色，亮邊外補一圈）→ 排版打包 → `art/preview/*_x6.png`。
4. 每張驗收：同系列一致、去背乾淨、無文字、朝右、台灣禁忌、放在 `night-1` 底色上看得清楚（看 6 倍預覽）。
5. `python LanternHold/art/tools/manifest.py` → `node shared/tools/index-build.mjs --update-hashes` → `--check`（`RULE-ASSET-REGISTER`）。整組標 `reusable`，其他夜間／奇幻題材可直接取用。
