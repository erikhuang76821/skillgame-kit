# TwinStrike 美術規格 — 喵拳道場

> 題材：[01 方案 A](01_theme_proposals.md)。玩法名詞對照見該頁「各方案的對照名詞」。
> 依據：[06 美術管線](../../knowledge-base/06_art-pipeline.md)、[10 資產庫 §4 prompt 模板](../../knowledge-base/10_asset-library.md)、[15 §2.1 人武分離](../../knowledge-base/15_reference-games.md)、[art-style-glossary #12 Q 版](../../SwarmDuel/knowledge/themes/art-style-glossary.md)、[tw-themes §4–5 禁忌](../../SwarmDuel/knowledge/themes/tw-themes.md)。
> prompt 原文在 `art/prompts/`（`TwinStrike/art/prompts`，未收錄），一個檔案一次生成。

## 1. 風格

| 項目 | 決定 | 理由 |
|---|---|---|
| 風格 | **Q 版貼紙風**：2–2.5 頭身、圓潤、粗深色外框（約 6 px @ 原圖 1024）、平塗 + 一階陰影 | 雙市場共用（glossary #12 + #13）；平塗壓縮率高；小尺寸也讀得清楚 |
| 視角 | **純側視**，角色只畫「面向右」，面向左用水平鏡像 | 左右對打不需要其他方向；資產量減半 |
| 動畫 | **單格姿勢 + 程式補間**（以算代貼）：每個動作 1 張姿勢圖，擠壓、位移、擊飛、旋轉全部用 GSAP | 包體小；手感數值集中在 `FEEL` |
| 光源 | 左上；陰影不畫進圖，由程式畫橢圓 | 06 §1 契約 |
| 背景 | 真透明（alpha），不畫地面、不畫陰影、無文字 | 同上 |

### 色票（`render/palette.js` 與 CSS 共用）

| 名稱 | 色碼 | 用途 |
|---|---|---|
| ink | `#2b1d14` | 外框、文字描邊（暖深棕，不用純黑） |
| paper | `#f6ecd6` | 道場紙門、UI 底 |
| wood | `#c98b4f` / `#9a5f32` | 地板、柱子 |
| tatami | `#c9cf94` | 地板點綴 |
| tabby | `#f29a3c` / `#c96a1c` | 貓師父橘虎斑 |
| dogi | `#fff6e6` | 道服（米白，不用純白） |
| belt | `#d6453d` | 腰帶、Perfect 字 |
| mouse | `#9aa7b8` / `#6d7a8c` | 小老鼠 |
| squirrel | `#c9a27a` + `#7b6cc4` | 飛鼠（紫色披風好辨識） |
| tanuki | `#7a5638` / `#4f3622` | 狸貓妖 |
| catnip | `#7fd36b` | 無雙段「貓薄荷時間」 |
| sky | `#7fd7ff` | Great 字、提示 |

### 台灣在地禁忌（必須遵守）

- **角色頭上不戴綠色帽子 / 綠色頭飾**（綠帽）。狸貓頭上的葉子改成**橘紅楓葉**。
- 不用大面積純白或純黑（喪葬聯想）→ 用米白 `dogi`、深棕 `ink`。
- 不用紅金大面積（娛樂城感）；不出現錢幣、骰子、轉盤、「倍」「爆分」字樣。
- 不做神明、廟宇、招財貓（招財貓 = 財運聯想，和 skill 定位衝突）。
- 數字 4 不當關卡或等級名稱。

## 2. 版面（世界座標 720 × 1280，直版固定視窗）

| 元素 | 位置 / 尺寸 | 說明 |
|---|---|---|
| 地板線 | y = 900 | 所有角色腳底在這條線 |
| 貓師父 | x = 360，顯示高約 230 | 正中央 |
| 攻擊範圍 | x = 360 ± 120（左右各一個） | 敵人在「到點時刻」剛好踏到這裡；地板上畫範圍標記 |
| 敵人出現 | x = −80 / 800（畫面外） | 依 `APPROACH` 線性走到攻擊範圍 |
| 重甲方向標記 | 狸貓頭上，3 個肉球箭頭，間距 44 | 程式繪製 |
| HUD（DOM） | 上方 0–200：分數、combo、血量（肉球心 ×5）、段落名 | 疊在 canvas 上 |
| 安全區 | 下方 900–1280：地板與左右點擊提示 | 長螢幕多出的空間只放 HUD |

## 3. 資產清單

### 3.1 AI 生成（一張原圖 → 切格 → 進 atlas）

| id | 內容 | 格（每格都是「面向右」） | 原圖切出後的格尺寸 | 錨點 | prompt |
|---|---|---|---|---|---|
| `chr.cat` | 貓師父（**已完成**：`game/src/assets/cat.png`，PNG-8 114 KB） | `idle_a` `idle_b` `jab` `kick` `palm` `whiff` `hurt` `win` `ko`（9 格） | **384 × 256**（踢腿、出拳往右伸，256 寬會被切） | 腳底中心 (0.5, 0.95) | hero_cat_identity.txt（`TwinStrike/art/prompts/hero_cat_identity.txt`，未收錄） → hero_cat_poses.txt（`TwinStrike/art/prompts/hero_cat_poses.txt`，未收錄） |
| `enm.mouse` | 小老鼠（步兵）（**已完成**，顯示高 130） | `run_a` `run_b` `hit`（3 格） | 288 × 224（三種敵人共用 `enemies.png`，PNG-8 75 KB，格名 `mouse.run_a` 等） | 同上 | enemy_mouse.txt（`TwinStrike/art/prompts/enemy_mouse.txt`，未收錄） |
| `enm.squirrel` | 飛鼠（疾兵）（**已完成** t2，顯示高 110） | `glide_a` `glide_b` `hit` | 同上 | 同上 | enemy_squirrel.txt（`TwinStrike/art/prompts/enemy_squirrel.txt`，未收錄） |
| `enm.tanuki` | 狸貓妖（重甲，3 擊）（**已完成**，顯示高 190） | `walk_a` `walk_b` `block` `hit` | 同上 | 同上 | enemy_tanuki.txt（`TwinStrike/art/prompts/enemy_tanuki.txt`，未收錄） |
| `fx.sheet` | 肉球拳印、星星、毛球、楓葉、汗滴、暈眩小鳥（**已完成**：`fx.png` PNG-8 25 KB，格名 `fx.paw` 等） | 6 格 | 160 × 160（遊戲內 ×0.4～0.75，見 `FEEL.stamp` / `FEEL.burst`） | 中心 | fx_sheet.txt（`TwinStrike/art/prompts/fx_sheet.txt`，未收錄） |
| `bg.dojo` | 道場內景（紙門、木柱、牌匾留白、窗外夕陽）（**已完成**：`bg_dojo.webp` q80，41 KB） | 1 張 | 720 × 1280；牆地交界在 y 876，角色腳底 y 900 站在交界前 24 px 的地板上 | — | bg_dojo.txt（`TwinStrike/art/prompts/bg_dojo.txt`，未收錄） |
| `key.art` | 主視覺：貓師父被老鼠群左右包夾（**已完成** t2a：上方 25% 留白給 Logo；標題畫面用中央 9:16 裁切 `title_keyart.webp` 720×1280，q80 66 KB） | 1 張 16:9 | 原圖 1672 × 941 | — | key_art.txt（`TwinStrike/art/prompts/key_art.txt`，未收錄） |

### 3.2 程式繪製（0 bytes）

| 物件 | 做法 |
|---|---|
| 腳底陰影 | 橢圓 `ink` α0.25，寬 = 角色寬 × 0.6 |
| 攻擊範圍標記 | 地板上兩個圓角矩形，敵人接近時亮起（α 依距離） |
| 重甲方向標記 | 肉球（大圓 + 3 小圓）+ 三角箭頭，打掉一個就消失一個 |
| 刀光 / 拳風 | Graphics 弧線，0.12 s 淡出 |
| 衝擊環 | sprite 擴散環（不用 filter，沿用 SwarmDuel `vfx.howl_ring` 配方） |
| 受擊白閃 | 載入時預烘白色剪影貼圖（15 §2.1 做法），不用 filter |
| 硬直變灰 | `tint = 0x8a8a8a` 250 ms |
| 判定字 | DOM（Perfect / Great / Good / 破綻），CSS 動畫 |

### 3.3 佔位版（現在就能玩）

AI 圖還沒生成前，`render/placeholderArt.js` 用 Graphics 畫出同尺寸、同錨點、同格名的佔位貼圖。換成正式 atlas 時只改載入，不改 render 邏輯。

## 4. 生圖到 atlas 的流程

1. **身分圖先行**：`hero_cat_identity.txt` 生成 → 人工驗收（比例、顏色、無綠帽、無文字）→ 存 `art/raw/cat_identity_1.png`。
2. **姿勢圖**：`hero_cat_poses.txt` 附身分圖生成 9 格；敵人與特效各一張。
3. **工具**：picanywhere（gpt-image-2，支援透明背景）或 codex-image skill。prompt 一律從檔案讀，生成前把 prompt 凍結到 `art/prompts/_history/`。
風格一致性：敵人生成時附 `art/raw/cat_identity.png`（必要時再附已定版的敵人圖）當風格參考，prompt 要寫明「粗外框、平塗、無漸層」——飛鼠 t1 沒寫，畫成了柔和漸層，t2 補上才和其他角色一致。

4. **切格與縮圖**：`python -I art/tools/pack_atlas.py art/atlas.json`。alpha 遮罩膨脹 10 px 合併同一姿勢的特效 → 連通區塊依重心歸到格子（姿勢可以跨過名義格線）→ 同一張圖共用一個縮放比（以 `idle_a` 高 232 px 為準）→ 腳底貼錨點線、軀幹帶中位數對齊錨點 x（個別格可在 `atlas.json` 用 `dx` 微調）→ premultiplied Lanczos 縮圖 → PNG-8 → `game/src/assets/<name>.png/.json`（Pixi spritesheet，含 anchor）＋ `art/review/<name>_contact.jpg` 對位檢查圖。遊戲依格名覆蓋佔位圖，還沒生成的資產繼續用佔位。
   - 特效 / 圖示：`assign: "nearest"`（K 個最大區塊當格子，碎片依像素距離歸到最近的格子，可處理衝擊線越過等分線）＋ `center: true`（置中）。
   - 生成圖若是「畫出來的棋盤格」（picanywhere 常見），先用 `art/tools/dechecker.py` 去背。
   - 主視覺：`python -I art/tools/bake_keyart.py art/raw/key_art.png --out game/src/assets/title_keyart.webp`（中央 9:16 裁切成直版標題背景）。
   - 背景：`python -I art/tools/bake_bg.py art/raw/bg_dojo.png --contact <原圖牆地交界 y> --target 876 --out game/src/assets/bg_dojo.webp`，等比縮放 + 置中裁切成 720×1280，並輸出對位檢查圖。
5. **格式**：貼紙風平塗 → PNG-8（≤ 256 色）優先；超過 300 KB 改 WebP q85。背景與主視覺用 WebP q80。不用 KTX2。

## 5. 預算

| 項目 | 預估 |
|---|---|
| 角色 + 特效 atlas（1024 × 1024，PNG-8） | ≤ 300 KB |
| 背景 `bg.dojo`（WebP q80） | ≤ 150 KB |
| 主視覺（WebP q78） | ≤ 120 KB |
| 字型（圓體子集 woff2，只含用到的字） | ≤ 60 KB |
| 音效 | 0（Web Audio 合成） |
| **美術合計** | **≤ 0.65 MB**（包體上限 8 MB） |

Draw Call：背景 1 + atlas 角色與特效 1 + Graphics（範圍標記、陰影、標記）1 + 衝擊環 / 刀光 0–1 → **基礎 ≤ 4**。

## 6. 驗收清單（每張生成圖）

- [ ] 原創角色，不像任何既有 IP（Hello Kitty、Pokémon、功夫熊貓、龍貓等）
- [ ] 真透明背景（不是畫出來的棋盤格）
- [ ] 無文字、無地面、無陰影
- [ ] 面向右；與身分圖同色、同比例、同服裝
- [ ] 無綠色頭飾；無錢幣、招財元素
- [ ] 縮到格尺寸後，外框與眼睛仍清楚
