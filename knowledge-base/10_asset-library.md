---
id: KB-asset-library
kind: method
topic: [art]
genre: ["*"]
rules: [RULE-ASSET-REGISTER]
reviewedAt: 2026-10-22
---
# 10 資產庫 — 圖像、特效、Prompt 與關鍵字索引

- **用途**：下一款遊戲要「找現成圖 / 照同一套 prompt 重生 / 改題材衍生」時查這頁
- **範圍**：SwarmDuel 所有視覺資產（AI 生成圖、程式繪製 0 bytes 資產、特效配方、UI 皮）＋ 生圖 prompt 原文
- **機器可讀版**：[index/assets.json](index/assets.json)（產生物，全部遊戲 85 筆＋`promptBlocks`；路徑以 repo 根為基準），導覽版 [index/INDEX.md](index/INDEX.md)
- **資產來源（2026-10-22 起）**：每款 `<Game>/art/manifest.json`（SwarmDuel（`SwarmDuel/art/manifest.json`，未收錄）、TwinStrike（`TwinStrike/art/manifest.json`，未收錄））與 [shared/recipes/](../shared/recipes/manifest.json)（範本資產、[prompt 模板](../shared/recipes/prompt-blocks.json)）；改完跑 `node shared/tools/index-build.mjs`，commit 時 hook 會檢查索引是否最新。本頁 §2–§5 是 SwarmDuel 的人工導覽（id 為 manifest 的 `legacyId`）；TwinStrike 的 Q 版貼紙資產見 INDEX.md
- **權威來源**：[asset_pipeline.md](../SwarmDuel/docs/asset_pipeline.md)（契約、驗收紀錄）、anim_prompts.py（`SwarmDuel/tools/anim_prompts.py`，未收錄）、anim_frames.py（`SwarmDuel/tools/anim_frames.py`，未收錄）、derive_native.py（`SwarmDuel/tools/derive_native.py`，未收錄）。本頁只是索引
- 盤點日期：2026-10-19

## 1. 怎麼用
<!-- card: KB-asset-library.how-to -->

| 步驟 | 做法 |
|---|---|
| 1. 用關鍵字找 | 在 §5 查中/英關鍵字（例：`bigfoot`、`營火`、`walk`）→ 拿到資產 id |
| 2. 看資產 | §2 依 id 找：類型、尺寸、錨點、檔案、狀態。程式繪製的看 §3 |
| 3. 拿 prompt | §2 的「prompt 檔」欄連到原文；要換角色/題材時用 §4 的模板，換掉 `{佔位符}` |
| 4. 重生 | 靜態圖：`codex exec --skip-git-repo-check --sandbox read-only < art/prompts/xxx.txt`；動畫條：`tools/gen_anim.sh <name> <Anim> <dir> <take>`（附圖：身分圖、最近方向姿勢、Walk 再附同方向 Idle） |
| 5. 縮到遊戲圖 | 動畫：`python tools/anim_frames.py <name>`（切格 → Lanczos → 硬映射調色盤 → 1 px 輪廓 → 打包 → `validate --require-eight`）；圖示 / prop / 主視覺：`python tools/derive_native.py` |
| 6. 衍生（不重生） | 換色＋縮放（敵人變體，見 `enm.*`）、鏡像（left 系方向）、程式繪製（§3 配方改色票即可換題材） |

**狀態定義**：`shipped` 遊戲內使用中｜`raw-only` 只有原圖（參考用）｜`rejected take` 被拒或未採用的生成｜`placeholder` 佔位（舊版或換色）｜`procedural` 程式繪製 0 bytes｜`template` skill 範本（非 SwarmDuel 實作）

## 2. 資產總表
<!-- card: skip; reason=資產資料（SwarmDuel 資產總表），取用改查 index/assets.json -->

契約（全部動畫共用）：8 列方向固定 `down, down_right, right, up_right, up, up_left, left, down_left`；欄 = 影格；`d` 單位 1/60 s；錨點 = 腳底；美術 1 px = 世界 2 單位、最近鄰。只生 5 個方向，`up_left / left / down_left` 為水平鏡像。

### 2.1 生成圖（AI → 機械縮圖）

| id | 類型 | 名稱 | 姿態/動畫 & 方向 | 原生 / sheet / 格數 / d / 錨點 | 檔案 | prompt 檔 | 狀態 | 關鍵字 |
|---|---|---|---|---|---|---|---|---|
| `chr.sasq.idle` | 角色 | Sasq Idle | Idle（站 → 吸氣下沉 1 px）× 8 方向 | 32×40 / 64×320 / 2 / 36,24 / (16,39)；24 色；19 KB | sasq_idle.png（`SwarmDuel/game/src/assets/sasq_idle.png`，未收錄） · .json（`SwarmDuel/game/src/assets/sasq_idle.json`，未收錄） · frames（`SwarmDuel/art/frames/sasq/Idle`，未收錄） | anim/sasq_Idle_*（`SwarmDuel/art/prompts/anim/sasq_Idle_down.txt`，未收錄）（5 檔） | shipped | bigfoot, cryptid, hero, idle, 8-direction |
| `chr.sasq.walk` | 角色 | Sasq Walk | Walk（接觸/經過/接觸/經過）× 8 方向；Dash 也用此 | 32×40 / 128×320 / 4 / 8,8,8,8 / (16,39)；24 色；35 KB | sasq_walk.png（`SwarmDuel/game/src/assets/sasq_walk.png`，未收錄） · .json（`SwarmDuel/game/src/assets/sasq_walk.json`，未收錄） · frames（`SwarmDuel/art/frames/sasq/Walk`，未收錄） | anim/sasq_Walk_*（`SwarmDuel/art/prompts/anim/sasq_Walk_down.txt`，未收錄）（5 檔） | shipped | bigfoot, walk cycle, dash |
| `chr.sasq.identity` | 角色 | Sasq 真低解析度身分圖 | 正 / 右 / 背 站姿 | 原圖 1942×809；目標 32×40 | native_hero_1.png（`SwarmDuel/art/raw/native_hero_1.png`，未收錄） · ref 切圖 down（`SwarmDuel/art/raw/ref/sasq_down.png`，未收錄） right（`SwarmDuel/art/raw/ref/sasq_right.png`，未收錄） up（`SwarmDuel/art/raw/ref/sasq_up.png`，未收錄） | native_hero.txt（`SwarmDuel/art/prompts/native_hero.txt`，未收錄） | raw-only（動畫附圖 1、2） | identity sheet, reference |
| `chr.sasq.identity_v01` | 角色 | Sasq 身分參考圖 v0.1 | 正 / 右 / 背 | 原圖 1938×811；目標 32×40 | hero_bigfoot_1.png（`SwarmDuel/art/raw/hero_bigfoot_1.png`，未收錄） | hero_bigfoot.txt（`SwarmDuel/art/prompts/hero_bigfoot.txt`，未收錄） | raw-only（已被上列取代） | identity sheet, chibi |
| `chr.sasq.placeholder_v02` | 角色 | Sasq 單格佔位 | 1 格 × 4 方向（left = right 鏡像） | 32×40 / 32×160 / 1 / 60 / (16,39) | sasq.png（`SwarmDuel/art/native/placeholder_v02/sasq.png`，未收錄） · .json（`SwarmDuel/art/native/placeholder_v02/sasq.json`，未收錄） · native/sasq/（`SwarmDuel/art/native/sasq`，未收錄） | native_hero.txt（`SwarmDuel/art/prompts/native_hero.txt`，未收錄） | placeholder | placeholder, 4-direction |
| `enm.greyling.walk` | 敵人 | Greyling Walk | Walk 4 格 × 8 方向；無 Idle（靜止停格、依 id 錯開起始格） | 28×28 / 112×224 / 4 / 9,9,9,9 / (14,27)；20 色；10 KB | greyling_walk.png（`SwarmDuel/game/src/assets/greyling_walk.png`，未收錄） · .json（`SwarmDuel/game/src/assets/greyling_walk.json`，未收錄） · frames（`SwarmDuel/art/frames/greyling/Walk`，未收錄） | anim/greyling_Walk_*（`SwarmDuel/art/prompts/anim/greyling_Walk_down.txt`，未收錄）（5 檔） | shipped | alien, greyling, swarm, walk |
| `enm.greyling.identity` | 敵人 | Greyling 真低解析度身分圖 | 正 / 右 / 背 | 原圖 1881×836；prompt 寫 24×24、實際 28×28 | native_greyling_1.png（`SwarmDuel/art/raw/native_greyling_1.png`，未收錄） · ref down（`SwarmDuel/art/raw/ref/greyling_down.png`，未收錄） right（`SwarmDuel/art/raw/ref/greyling_right.png`，未收錄） up（`SwarmDuel/art/raw/ref/greyling_up.png`，未收錄） | native_greyling.txt（`SwarmDuel/art/prompts/native_greyling.txt`，未收錄） | raw-only（動畫附圖 1、2） | identity sheet, jetpack, antenna |
| `enm.greyling.identity_v01` | 敵人 | Greyling 身分參考圖 v0.1 | 正 / 右 / 背 | 原圖 1801×873 | enemy_greyling_1.png（`SwarmDuel/art/raw/enemy_greyling_1.png`，未收錄） | enemy_greyling.txt（`SwarmDuel/art/prompts/enemy_greyling.txt`，未收錄） | raw-only | grey alien, drone pilot |
| `enm.greyling.placeholder_v02` | 敵人 | Greyling 單格佔位 | 1 格 × 4 方向 | 28×28 / 28×112 / 1 / 60 / (14,27) | greyling.png（`SwarmDuel/art/native/placeholder_v02/greyling.png`，未收錄） · native/greyling/（`SwarmDuel/art/native/greyling`，未收錄） | native_greyling.txt（`SwarmDuel/art/prompts/native_greyling.txt`，未收錄） | placeholder | placeholder |
| `enm.probe` | 敵人 | Probe（換色） | 同 Greyling Walk | scale 1.5、tint `0x9fd8ff` | content.js（`SwarmDuel/game/src/sim/content.js`，未收錄） | — | placeholder（0 B） | probe, dash enemy, palette swap |
| `enm.hulk` | 敵人 | Hulk（換色） | 同上 | scale 3、tint `0xc0a8ff` | 同上 | — | placeholder（0 B） | hulk, tank |
| `enm.saucer_scout` | 敵人 | 頭目 Saucer Scout（換色） | 同上；GDD 規劃 64×40 Walk 4、Attack 4 | scale 5、tint `0xffd36b` | 同上 | — | placeholder（0 B） | boss, ufo |
| `enm.mother_probe` | 敵人 | 頭目 Mother Probe（換色） | 同上；GDD 規劃 64×64 | scale 6、tint `0xff8080` | 同上 | — | placeholder（0 B） | boss, mothership |
| `prp.pine` | 道具 | 太平洋西北松樹 | 靜態；依腳底 Y 排序 | 24×40 / — / 1 / — / (12,39)；12 色；1 KB；原圖 971×1619 | pine.png（`SwarmDuel/game/src/assets/pine.png`，未收錄） · raw（`SwarmDuel/art/raw/prop_pine_1.png`，未收錄） | prop_pine.txt（`SwarmDuel/art/prompts/prop_pine.txt`，未收錄） | shipped | pine, tree, forest, y-sort |
| `key.key_art` | 主視覺 | 夜間營地＋飛碟＋外星人包圍 | 16:9；直版 cover 裁中央；桌機兩側 blur 背景 | 960×540 WebP q78，113 KB；原圖 1672×941 PNG 2.4 MB | key_art.webp（`SwarmDuel/game/src/assets/key_art.webp`，未收錄） · raw（`SwarmDuel/art/raw/key_art_1.png`，未收錄） | key_art.txt（`SwarmDuel/art/prompts/key_art.txt`，未收錄） | shipped | key art, title, night, camp, ufo, rv |
| `icn.*`（12 個） | 圖示 | 見 §2.2 | 靜態 | 64×64 格、4×3 atlas 256×192，44 KB；原圖約 1254² | icons.png（`SwarmDuel/game/src/assets/icons.png`，未收錄） · icons.json（`SwarmDuel/game/src/assets/icons.json`，未收錄） | `icon_*.txt` | shipped | icon, upgrade card |
| `icn.p_speed.alt` | 圖示 | Trail Legs 第 2 張 | 靜態 | 原圖 1374×1145 | icon_p_speed_2.png（`SwarmDuel/art/raw/icon_p_speed_2.png`，未收錄） | icon_p_speed.txt（`SwarmDuel/art/prompts/icon_p_speed.txt`，未收錄） | rejected take（未採用、文件未記錄） | alt take |

### 2.2 圖示 atlas（`icons.json` 順序 = 格位）

| 格 | id | 遊戲用途 | prompt 主體（原文） | 原圖 |
|---|---|---|---|---|
| 0 | `icn.pinecone` | 武器 Pinecone Toss | a brown pinecone mid-throw with two small motion lines | png（`SwarmDuel/art/raw/icon_pinecone_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_pinecone.txt`，未收錄） |
| 1 | `icn.campfire` | 武器 Campfire Ring | a small ring of three orange flames orbiting in a circle | png（`SwarmDuel/art/raw/icon_campfire_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_campfire.txt`，未收錄） |
| 2 | `icn.static_fur` | 武器 Static Fur | a tuft of brown fur crackling with cyan electric sparks | png（`SwarmDuel/art/raw/icon_static_fur_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_static_fur.txt`，未收錄） |
| 3 | `icn.p_speed` | +10% 移速；結算 dodges | a big furry brown foot with a green speed swoosh | png（`SwarmDuel/art/raw/icon_p_speed_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_p_speed.txt`，未收錄） |
| 4 | `icn.p_might` | +10% 傷害 | a clenched big furry brown fist with a white impact star | png（`SwarmDuel/art/raw/icon_p_might_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_p_might.txt`，未收錄） |
| 5 | `icn.p_magnet` | +25% 拾取半徑 | a glowing lime-green ectoplasm orb being pulled by a horseshoe magnet | png（`SwarmDuel/art/raw/icon_p_magnet_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_p_magnet.txt`，未收錄） |
| 6 | `icn.p_cooldown` | −8% 冷卻；結算 survival | a silver camping stopwatch with a lime-green arrow circling it | png（`SwarmDuel/art/raw/icon_p_cooldown_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_p_cooldown.txt`，未收錄） |
| 7 | `icn.p_hp` | +20 HP | a red heart made of thick shaggy fur | png（`SwarmDuel/art/raw/icon_p_hp_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_p_hp.txt`，未收錄） |
| 8 | `icn.snack` | 補 30 HP | a grilled hot dog with mustard on a stick | png（`SwarmDuel/art/raw/icon_snack_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_snack.txt`，未收錄） |
| 9 | `icn.bounty` | +100 分；每日卡、結算 bonus | a gold sheriff star badge with a shine | png（`SwarmDuel/art/raw/icon_bounty_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_bounty.txt`，未收錄） |
| 10 | `icn.skull` | HUD 擊殺數；結算 kills | a small grey alien skull with big black eye sockets | png（`SwarmDuel/art/raw/icon_skull_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_skull.txt`，未收錄） |
| 11 | `icn.ecto` | Ecto；結算 ecto | a single glowing lime-green ectoplasm droplet orb | png（`SwarmDuel/art/raw/icon_ecto_1.png`，未收錄） · txt（`SwarmDuel/art/prompts/icon_ecto.txt`，未收錄） |

處理：`icon_atlas()` 依 alpha bbox 裁切 → `to_native(64, 64, pad=2, colors=32)` → 置中貼入 4×3 atlas（derive_native.py（`SwarmDuel/tools/derive_native.py`，未收錄））。

### 2.3 動畫條生成紀錄（`art/raw/anim/`，35 張）

已採用的 15 張 = 同方向某個 `_t{n}` 的複本（MD5 相同）。log 在 logs/（`SwarmDuel/art/raw/anim/logs`，未收錄）。原圖約 1774–2172 × 724–887，RGBA。

| 角色 × 動作 | down | down_right | right | up_right | up |
|---|---|---|---|---|---|
| sasq Idle | t1 ✓ | t1 ✓ | t1 ✓ | t1 ✗ · **t2 ✓** · t3 未用 | t1 ✓ |
| sasq Walk | t1 ✓ | t1 ✓ | t1 ✓ | t1 未用 · **t2 ✓** · t3 未用 | t1 ✓ |
| greyling Walk | t1 ✓ | t1 ✓ | t1 ✓ | t1 ✗ · **t2 ✓** | t1 ✓ |

| 未採用的 take | 原因（[asset_pipeline §4](../SwarmDuel/docs/asset_pipeline.md)） |
|---|---|
| sasq_Idle_up_right_t1（`SwarmDuel/art/raw/anim/sasq_Idle_up_right_t1.png`，未收錄） | 拒絕：第 2 格轉成正背面且縮小 → 改寫 up_right 方向描述 |
| sasq_Idle_up_right_t3（`SwarmDuel/art/raw/anim/sasq_Idle_up_right_t3.png`，未收錄） | 未採用；文件沒記錄 |
| sasq_Walk_up_right_t1（`SwarmDuel/art/raw/anim/sasq_Walk_up_right_t1.png`，未收錄） | 懷疑圍巾換邊（複查其實同側）→ prompt 加「圍巾尾巴同側」 |
| sasq_Walk_up_right_t3（`SwarmDuel/art/raw/anim/sasq_Walk_up_right_t3.png`，未收錄） | 未採用；取步幅最清楚的 t2 |
| greyling_Walk_up_right_t1（`SwarmDuel/art/raw/anim/greyling_Walk_up_right_t1.png`，未收錄） | 拒絕：與 up 幾乎相同（只有天線偏右） |

## 3. 程式繪製資產與特效配方（0 bytes）
<!-- card: skip; reason=資產資料（程式繪製資產與特效配方，manifest 中 kind=procedural），取用改查 index/assets.json -->

全部只在 render / UI 層，由 sim 事件驅動；`rich` = 高特效且未開減少動態。SwarmDuel **不用 filter、不做通用粒子系統**。

### 3.1 紋理（textures.js（`SwarmDuel/game/src/render/textures.js`，未收錄），canvas 1 px `fillRect`，最近鄰）

| id | 類型 | 名稱 | 尺寸 | 配方 / 參數 | 位置 |
|---|---|---|---|---|---|
| `prc.ground.grass` | 場景 | 夜間草地 tile | 64×64 | 底色 `#1d3a30`＋260 點（`hash32(91,6,i)` 定位、1–2 px），色票 `GRASS` 5 色；TilingSprite `tileScale 2` | L44（`SwarmDuel/game/src/render/textures.js`，未收錄） |
| `prc.decor.*` | 場景 | 草叢 9×6、石 11×8、藍花 5×5、紅蘑菇 6×6、原木 22×8、泥地 28×14 | — | 手點像素；`scatterDecor()` 撒 360 個（`hash32(4242,6,i)`）、隨機左右翻 | L22（`SwarmDuel/game/src/render/textures.js`，未收錄） · world L110（`SwarmDuel/game/src/render/world.js`，未收錄） |
| `prc.campfire` | 道具 | 營火 2 格 | 24×22 | 木柴＋3 石＋三階火焰；f=1 時偏 1 px；rich 每 8 幀換格 | L85（`SwarmDuel/game/src/render/textures.js`，未收錄） |
| `prc.tent` | 道具 | 帳篷 | 30×22 | 逐列三角、雙藍 `#2f6b8f/#23506b`、門口暖光 `#f2b45a` | L92（`SwarmDuel/game/src/render/textures.js`，未收錄） |
| `prc.orb` | 道具 | Ecto 經驗球 | 7×7 | 暗綠邊 `#1f5410`、萊姆 `#7fe63a`、高光 `#d9ffb0`；v≥20 tint 金 `0xffd36b`＋放大；rich 上下 bob 2 px | L52（`SwarmDuel/game/src/render/textures.js`，未收錄） |
| `prc.pinecone_shot` | 特效 | 松果投射物 | 6×7 | rich 每 tick 轉 0.35 rad | L56（`SwarmDuel/game/src/render/textures.js`，未收錄） |
| `prc.flame` | 特效 | 營火環火焰 | 7×9 | 三階火（`#ff6a1a/#ffd04a/#fff4c2`）；rich 每 12 tick `scale.y +0.5` | L60（`SwarmDuel/game/src/render/textures.js`，未收錄） |
| `prc.hotdog` | 道具 | 熱狗拾取物 | 12×7 | 麵包＋香腸＋3 點芥末 | L64（`SwarmDuel/game/src/render/textures.js`，未收錄） |
| `prc.shadow` | 特效 | 腳底陰影 | 14×5 | `rgba(0,6,4,0.45)` 兩矩形拼橢圓；英雄 ×3、敵人 ×scale×0.9 | L68（`SwarmDuel/game/src/render/textures.js`，未收錄） |
| `prc.spark` | 特效 | 碎片 / 火花 | 3×3 | 白十字，`tint` 上色 | L69（`SwarmDuel/game/src/render/textures.js`，未收錄） |
| `prc.darkness` | 特效 | 夜色光圈暗角 | 256×256 → 3200 | radial：0–7% 透明、20% α0.45、40% α0.66、100% α0.74（`rgba(3,6,16)`）；linear；跟隨英雄 | L71（`SwarmDuel/game/src/render/textures.js`，未收錄） |
| `prc.glow` | 特效 | 營火暖光 | 128×128 | radial 橘 α0.85→0.3→0；×3.2、`blendMode add`；rich α 0.85±0.15 sin | L80（`SwarmDuel/game/src/render/textures.js`，未收錄） |
| `prc.flash_sheet` | 特效 | 受擊白剪影 sheet | 同 sheet | `drawImage` → `source-in` 填白（Pixi tint 只能變暗）；英雄 invuln>24、敵人 flash>3 換用 | L105（`SwarmDuel/game/src/render/textures.js`，未收錄） |

### 3.2 VFX（world.js（`SwarmDuel/game/src/render/world.js`，未收錄））

| id | 名稱 | 觸發 | 配方 / 參數 | 低特效 | 位置 |
|---|---|---|---|---|---|
| `vfx.howl_ring` | Howl 衝擊波環（取代 shockwave filter） | `howl` 事件 | Graphics 圓 r160、fill α0.12、stroke 8 px α0.95（doubled 金 `0xffd36b`，否則 `0xe8f6ff`）；scale 0.2→1 0.35 s `power2.out`＋alpha→0 0.3 s delay 0.15；shake 8 | 靜態 0.12 s | L290（`SwarmDuel/game/src/render/world.js`，未收錄） |
| `vfx.graze_star` | Perfect Dodge 金星 | `graze` | star 4 角 外 16 / 內 6、`0xffd36b`、描邊 2 px `0x3a2508`；上飄 28、alpha→0、轉 1.2，0.4 s | 靜態 0.15 s | L280（`SwarmDuel/game/src/render/world.js`，未收錄） |
| `vfx.damage_number` | 傷害數字 | `hit` | BitmapText Pixelify 22 px 白、4 px 墨描邊；上限 32；每幀 y−1.1、life 26、末 8 幀淡出；x 抖 ±6 | 關閉 | L246（`SwarmDuel/game/src/render/world.js`，未收錄） |
| `vfx.kill_burst` | 擊殺碎片 | `kill` | `burst()`：一般 5 顆 速 2.2 綠/灰/白；頭目 40 顆 速 4.5 金/白/綠＋shake 18；重力 0.12/幀、life 18–27；池上限 140 | 關閉 | L235（`SwarmDuel/game/src/render/world.js`，未收錄） · L275（`SwarmDuel/game/src/render/world.js`，未收錄） |
| `vfx.hurt_burst` | 英雄受傷 | `hurt` | shake 10＋8 顆紅白碎片；白閃（invuln>24）後閃爍 α0.45 | 只留閃爍 | L271（`SwarmDuel/game/src/render/world.js`，未收錄） |
| `vfx.screen_shake` | 鏡頭震動 | 上述事件 | 幀數遞減；offset `((n*7)%5−2, (n*3)%5−2)×2` px，確定性 | — | L230（`SwarmDuel/game/src/render/world.js`，未收錄） |
| `vfx.static_aura` | 靜電毛光環 | 武器等級 | 圓 r=武器半徑，fill `0x7fd7ff` α0.1、stroke 2 px `0x9fe4ff` α0.55 | 同 | L200（`SwarmDuel/game/src/render/world.js`，未收錄） |
| `vfx.beam_warning` | 光束預警 / 光束 | `beams` 事件 | 預警紅圈 α0.15＋3 px 閃爍描邊；發射萊姆柱 1.2r×900 α0.35＋落點圓 α0.6 | 同（資訊不可拿掉） | L209（`SwarmDuel/game/src/render/world.js`，未收錄） |
| `vfx.hp_bar` | 腳下血條 | 每幀 | 52×8 底＋48×4 填；>50% `0x5fe05a`、>25% `0xffc23a`、否則 `0xff4a3a` | 同 | L80（`SwarmDuel/game/src/render/world.js`，未收錄） · L159（`SwarmDuel/game/src/render/world.js`，未收錄） |
| `vfx.enemy_hover` | 敵人懸浮 / 錯開 | 每幀 | y += round(sin((t+id·7)/9)·1.5)；起始格 = id % n | 不懸浮 | L164（`SwarmDuel/game/src/render/world.js`，未收錄） |

### 3.3 UI 皮（Graphics，無圖片、無 filter）

| id | 名稱 | 配方 | 位置 |
|---|---|---|---|
| `ui.panel` | 斜角面板 | roundRect：4 px 下移陰影 α0.55 → 邊 `0x0a1018` → 本體 `0x16222e` → 頂亮條 α0.6 | theme.js L24（`SwarmDuel/game/src/ui/theme.js`，未收錄） |
| `ui.button` | 3D 膠囊按鈕（primary 綠 / secondary 藍 / gold） | 底層深色 y+6、面層＋3 px 墨線、亮條 h×0.28；按下下沉 5 px | theme.js L35（`SwarmDuel/game/src/ui/theme.js`，未收錄） |
| `ui.pips` | 等級點 | 16×10、間距 22 | theme.js L77（`SwarmDuel/game/src/ui/theme.js`，未收錄） |
| `ui.banner` | 緞帶標題 | 燕尾 poly＋540×80 本體＋白亮條 α0.28；46 px 字 8 px 描邊 | panels.js L30（`SwarmDuel/game/src/ui/panels.js`，未收錄） |
| `ui.logo` | SWARM / DUEL 文字 Logo | Pixelify 118 px、`0xffe9a8/0xffc23a`、14 px `0x2a1408` 描邊、8 px 硬陰影 | panels.js L41（`SwarmDuel/game/src/ui/panels.js`，未收錄） |
| `ui.hud` | HUD | 經驗條 688×24＋萊姆填＋亮條、金色等級圓 r30、計時膠囊、骷髏擊殺、連擊、Dash 膠囊、Howl 按鈕、搖桿 | hud.js L19（`SwarmDuel/game/src/ui/hud.js`，未收錄） |
| `ui.font.pixelify` | Pixelify Sans 400/700 | `@fontsource`，約 16 KB（唯一非 0 B 的 UI 資產） | main.js L13（`SwarmDuel/game/src/main.js`，未收錄） |
| 色票 `C` | ink `0x05080c`、panel `0x16222e`、lime `0x8ff03c`、gold `0xffd36b`、red `0xff5a4a`、sky `0x7fd7ff` | — | theme.js L6（`SwarmDuel/game/src/ui/theme.js`，未收錄） |

### 3.4 skill 範本特效（[templates/src/fx](../.claude/skills/lite-skillgame-stack/templates/src/fx)、[juice.md](../.claude/skills/lite-skillgame-stack/references/juice.md)）

| id | 檔 | 做法 | 參數（`FEEL`） | SwarmDuel |
|---|---|---|---|---|
| `tpl.fx.shake` | [shake.js](../.claude/skills/lite-skillgame-stack/templates/src/fx/shake.js) | GSAP timeline 抖 `#stage-shake` DOM（合成層、0 DC） | light 4 px/0.12 s、crit 8/0.25、boss 14/0.4；step 0.032 s；rotPerPx 0.05° | 自寫確定性版（`vfx.screen_shake`） |
| `tpl.fx.overlay` | [overlay.js](../.claude/skills/lite-skillgame-stack/templates/src/fx/overlay.js) | CSS `#fx-vignette` radial 55% → `rgba(200,0,0,.65)`；`#fx-flash` 白 screen | flash α0.6 / 0.12 s；hurt 0.6 s `power2.out` | 未用 |
| `tpl.fx.shockwave` | [shockwave.js](../.claude/skills/lite-skillgame-stack/templates/src/fx/shockwave.js) | GLSL 位移環 filter，只在播放期間掛 | radius 260、width 40、amp 18、0.45 s `power2.out` | **禁用**（無 filter）→ `vfx.howl_ring` |
| `tpl.fx.particles` | [particles.js](../.claude/skills/lite-skillgame-stack/templates/src/fx/particles.js) | ParticleContainer 1 DC、4 px 白點、add 混色、固定池 | burst 24、speed 420、life 0.5 s、gravity 900、max 512 | 未用（改 `burst()` sprite 池） |
| `tpl.terrain.dust` | [dust.png](../.claude/skills/lite-skillgame-stack/templates/src/assets/terrain/dust.png) · [prompt](../.claude/skills/lite-skillgame-stack/templates/src/assets/terrain/dust.prompt.txt) | AI 生成無縫地表 tile（[11](11_terrain-style-kit.md) ② v2 提詞）＋ `tile_prep.py` 後處理 | `terrainConfig.js` 的 `src`；載入失敗退回 `noiseTile()` | 範本示範用；新遊戲換題材重生並登錄到自己的 `art/manifest.json` |
| — | [feel.js](../.claude/skills/lite-skillgame-stack/templates/src/fx/feel.js) | 其他：hitStop 0.03/0.06/0.1 s、squash 1.25×0.8 `elastic.out(1,0.35)`、popup rise 40 / 0.6 s、UI in 0.25 `back.out(1.7)` | — | — |

## 4. Prompt 庫（原文，`{…}` 為佔位符）
<!-- card: skip; reason=資產資料（prompt 原文），取用改查 index/assets.json 的 promptBlocks -->

所有 prompt 由 stdin 餵給 Codex CLI；**不得要求 codex 存檔**（Windows 沙箱會靜默失敗），PNG 從 `~/.codex/generated_images/{sid}/` 複製。模板字串也在 JSON 的 `promptBlocks`。

### 4.1 共用開頭與風格鎖（hero / enemy / prop 三檔逐字相同）

```text
Generate one image with your image generation tool. Do not write any files.
```

```text
Style lock (shared by every asset in this game): original 16-bit pixel art for a top-down 3/4 overhead action game, chunky clean pixel clusters, 1-pixel dark contour, limited palette with 3 tones per material (shadow / mid / highlight), light from the upper-left, bold saturated Saturday-morning-cartoon colors aimed at a North American audience. Original design only: no Pokemon, no existing franchise characters. Actual transparent background (alpha), NOT a painted checkerboard. No text, no labels, no ground plane, no cast shadow, no gradients, no smooth airbrush shading, no blur.
```

### 4.2 身分參考圖（v0.1，`hero_bigfoot.txt` / `enemy_greyling.txt`）

```text
Create a character identity reference sheet for an original {ROLE: game hero | swarm enemy}: "{NAME}", {CHARACTER_DESC}.
Show exactly three full-body poses of the SAME character side by side, same scale, evenly spaced{, standing idle}: (1) facing the camera / down, (2) facing right, (3) facing away / up.
Target native game frame after processing: about {W}x{H} pixels per pose with feet at bottom-center{, so draw with big readable pixel blocks}.
{STYLE_LOCK}
```

`{CHARACTER_DESC}` 實例：Sasq = `a friendly but tough young Bigfoot cryptid. Shaggy chestnut-brown fur, lighter tan face and palms, big expressive eyes, a red-and-black plaid camp scarf, a small leather satchel strap across the chest, oversized feet. Stocky chibi proportions (head about 40% of height) so it reads at small game scale`；Greyling = `a small mischievous grey alien drone-pilot. … Very compact rounded silhouette that reads at tiny size; designed to appear in groups of 50+`（全文見 prompt 檔）。

### 4.3 真低解析度身分圖（v0.2，`native_hero.txt` / `native_greyling.txt`，**動畫用的身分附圖**）

```text
Create a sprite reference sheet for an original {ROLE: top-down 3/4 action game hero | swarm enemy}: "{NAME}", {CHARACTER_DESC}. Show exactly three {standing idle }poses side by side with wide transparent gaps: (1) facing the camera, (2) facing right, (3) facing away.
Draw it as TRUE LOW-RESOLUTION pixel art: each pose is exactly {W}x{H} art pixels, and the whole image is upscaled with nearest-neighbour so every art pixel is a clean, equal, hard-edged square block (about 16x16 screen pixels per art pixel). No sub-pixel detail, no anti-aliasing, no gradients, no smooth curves. 1-art-pixel dark outline around the whole silhouette. Limited palette (max 16 colors). Light from upper-left. Actual transparent background (alpha). No text, labels, ground, or shadow.
```

### 4.4 動畫條（`tools/anim_prompts.py` 產生，一張 = 一動作 × 一方向 × n 格）

```text
Draw an animation strip for the original game character {CHARACTER_DESC}.
Attached image 1 is the accepted identity sheet (front, right side, back): copy its exact species, proportions, face, colors, accessories, outline and pixel-art style. Attached image 2 is the identity pose closest to the requested facing.{IF_WALK_AND_HAS_IDLE: Attached image 3 is the accepted Idle frame for this exact facing: keep its camera, size and proportions.}

Action: {ANIM}. Facing: {FACING}. Every frame faces the same direction.
Show exactly {N} frames of the SAME character in ONE horizontal row, left to right, same scale, feet on the same ground line, separated by wide transparent gaps:
{BEATS}
Only the limbs/body described change between frames; head size, colors, scarf/suit details and outline stay identical.{IF_SASQ_WALK_AND_HAS_IDLE: The hanging scarf tail stays on the same side of the body as in attached image 3.}

Draw it as TRUE LOW-RESOLUTION pixel art: each frame is exactly {W}x{H} art pixels, and the whole image is upscaled with nearest-neighbour so every art pixel is a clean, equal, hard-edged square block (about 16x16 screen pixels per art pixel). No sub-pixel detail, no anti-aliasing, no gradients, no smooth curves. 1-art-pixel dark outline around the whole silhouette. Limited palette (max 16 colors). Light from upper-left. Actual transparent background (alpha). No text, labels, frame numbers, grid, ground, or shadow.
```

**節拍 `{BEATS}`（`ANIM`）與時長（`SPEC`）**

| 動作 | 格 | 節拍原文 | d（1/60 s） |
|---|---|---|---|
| Idle | 2 | `frame 1: relaxed standing pose, arms down` / `frame 2: the same standing pose breathing in: head and shoulders exactly 1 art pixel lower, arms 1 art pixel further from the body; feet do not move` | Sasq 36, 24 |
| Walk | 4 | `frame 1: contact pose, left foot forward and right foot back, arms swinging opposite to the legs` / `frame 2: passing pose, legs together under the body, body 1 art pixel higher` / `frame 3: contact pose, right foot forward and left foot back (mirror of the frame 1 leg/arm positions)` / `frame 4: passing pose, legs together under the body, body 1 art pixel higher` | Sasq 8×4；Greyling 9×4 |

**方向 `{FACING}`（`FACING`）與附圖 2（`NEAREST_REF`）**

| 方向 | 原文 | 附圖 2 |
|---|---|---|
| down | `facing the camera (front view, viewer sees the face)` | down |
| down_right | `three-quarter FRONT view turned toward the viewer's right (face visible, body angled 45 degrees to the right, toward the bottom-right of the screen)` | down |
| right | `side profile facing the viewer's right` | right |
| up_right | `three-quarter BACK view: the character walks away toward the top-right of the screen, body rotated 45 degrees, so we see its back AND its right side (right arm and right shoulder fully visible, left arm mostly hidden behind the body, face hidden). Every frame keeps exactly this rotation and size` | up |
| up | `facing away from the camera (back view, face not visible)` | up |
| up_left / left / down_left | 不生成，水平鏡像 up_right / right / down_right | — |

**縮圖參數（`SPEC`）**：Sasq 框 32×40、24 色；Greyling 框 28×28、20 色；各留 6 色給強調色（圍巾紅 `r−max(g,b)>110`、天線綠 `max−min>90`）；條高 → 框高 −4、腳底第 h−2 列、輪廓第 h−1 列；錨點 `(w/2, h−1)`。

### 4.5 圖示（12 檔共用尾段）

```text
Create one isolated pixel-art game icon: {ICON_SUBJECT}
Chunky 16-bit pixel art game UI icon in the style of mobile roguelite survivor games (bold, saturated, high contrast), 2-pixel dark outline, 3 tones per material, upper-left light, readable at 48x48 pixels. Single centered object with generous transparent padding. Actual transparent background (alpha), not a checkerboard. No text, no letters, no numbers, no frame, no background shape.
```

`{ICON_SUBJECT}` 見 §2.2。

### 4.6 道具（`prop_pine.txt`）

```text
Create one isolated 2D game prop: {PROP_DESC}. Single object only, centered, bottom-center foot anchor at the base of the {BASE_PART}, full object inside the frame with safe transparent padding.
Target native art frame after processing: {W}x{H} pixels.
{STYLE_LOCK}
```

實例：`{PROP_DESC}` = `a Pacific Northwest pine tree for a forest campground, layered dark-green needle tiers, short reddish-brown trunk, a little snow-free natural look`；`{BASE_PART}` = `trunk`；24×40。

### 4.7 主視覺（`key_art.txt`）

```text
Create a 16:9 pixel-art key art scene for an original {GENRE} set in {SETTING}: {HERO_DESC} stands center, surrounded by {ENEMY_SWARM_DESC}, {SCENE_PROPS}. Same 16-bit pixel art style: chunky pixel clusters, 1-pixel dark contours, limited palette, {LIGHTING}, bold Saturday-morning-cartoon colors for a North American audience. Leave empty dark sky space at the top for a logo to be added later. No text, no letters, no logo, no UI.
```

實例：`arcade survival game` / `a night-time Pacific Northwest campground under a giant flying saucer` / `a young Bigfoot hero with a red plaid scarf` / `a swarm of dozens of tiny grey alien drones closing in from all sides` / `glowing lime-green energy orbs on the ground, pine trees, a campfire, a beat-up RV` / `upper-left moonlight plus warm campfire rim light`。

### 4.8 共用尾綴與負面提示（[art-style-glossary §3](../SwarmDuel/knowledge/themes/art-style-glossary.md)）

| 用途 | 尾綴 |
|---|---|
| 手遊 UI 資產 | `game UI asset, isolated on transparent background, centered, high readability at small size` |
| 角色立繪 | `full body character design, front view, clean silhouette, consistent style sheet` |
| 避免賭場感（負面） | `no slot machine, no casino chips, no playing-card suits, no dice, no jackpot text` |
| 避免文字亂碼 | `no text` |
| repo prompt 已用的負面（擷取） | `no Pokemon, no existing franchise characters` · `NOT a painted checkerboard` · `no ground plane, no cast shadow, no gradients, no smooth airbrush shading, no blur` · `no frame, no background shape` · `no anti-aliasing` · `No text, labels, frame numbers, grid` |

### 4.9 22 種風格關鍵字（[art-style-glossary §1](../SwarmDuel/knowledge/themes/art-style-glossary.md)；◎ 很適合 ○ 可用 △ 需調整 ✕ 不建議）

| # | 風格 | Prompt 關鍵字（EN） | NA | TW | 賭博感風險 |
|---|---|---|---|---|---|
| 1 | Pixel 16-bit | `16-bit pixel art, SNES era, limited palette, crisp pixels, sprite sheet, dark background, glowing projectiles` | ◎ | ○ | 低 |
| 2 | HD-2D | `HD-2D, pixel sprites in 3D diorama, tilt-shift depth of field, bloom lighting` | ○ | ◎ | 低 |
| 3 | Cartoon Americana 30s | `1930s rubber hose cartoon, vintage Americana, pie-cut eyes, white gloves, film grain, sepia` | ◎ | ○ | 低 |
| 4 | 50s Diner / Route 66 | `1950s American diner, chrome, checkerboard floor, neon sign, pastel teal and pink, retro roadside` | ◎ | ○ | 低 |
| 5 | Vegas Luxe | `Las Vegas luxury, gold trim, red velvet, diamonds, spotlight, neon marquee, glossy` | ○ | ○ | **高** |
| 6 | 古文明神話 | `ancient Egypt, gold and lapis lazuli, hieroglyphs, scarab, marble columns, dramatic lighting` | ◎ | ○ | 中高 |
| 7 | Cozy 粉彩 | `cozy, soft pastel palette, warm ambient light, wooden furniture, potted plants, gentle, hand-painted` | ◎ | ◎ | 低 |
| 8 | 3D Toon | `stylized 3D toon, glossy, chunky shapes, saturated jewel tones, mobile game asset, clean silhouette` | ◎ | ◎ | 低 |
| 9 | 塑膠玩具 / 桌遊 3D | `toy-like 3D, plastic material, board game pieces, bright primary colors, tabletop diorama` | ◎ | ○ | 中 |
| 10 | 3D Clay | `claymation style, plasticine texture, soft shadows, handmade, stop-motion look` | ◎ | ◎ | 低 |
| 11 | Anime 賽璐璐 | `anime cel-shaded, clean lineart, vibrant, character key visual, Japanese mobile gacha style` | ○ | ◎ | 低 |
| 12 | Q 版 / Chibi | `chibi, kawaii, 2-head-tall proportions, round shapes, pastel, big sparkling eyes, sticker-like` | ○ | ◎ | 低 |
| 13 | LINE 貼圖風 | `flat vector sticker, thick outline, simple shapes, exaggerated expression, white border, meme reaction` | △ | ◎ | 低 |
| 14 | 國潮 / 新中式 | `neo-Chinese style, red and gold, ink wash, auspicious clouds, traditional patterns, modern graphic design` | △ | △ | 中 |
| 15 | 仙俠水墨 | `xianxia, ink wash landscape, flying sword, flowing robes, calligraphy, misty mountains` | △ | ◎ | 低 |
| 16 | 台式廟宇 | `Taiwanese temple, jiannian ceramic mosaic, koji pottery, ornate roof ridge dragons, red lanterns, incense smoke` | △ | ◎ | 低 |
| 17 | 台式復古 / 夜市 | `Taiwanese night market, retro neon signage, food stalls, patterned floor tiles, terrazzo, warm tungsten light, 1980s Taiwan nostalgia` | △ | ◎ | 低 |
| 18 | 財神 / 開運 | `God of Wealth, gold ingots, coin shower, koi, red envelope, festive, prosperity` | ✕ | ○ | **高** |
| 19 | Cryptidcore / 70s | `cryptidcore, 1970s faded film photo, earthy tones, campfire, pine forest, blurry Bigfoot sighting, motel sign` | ○ | △ | 低 |
| 20 | Synthwave | `synthwave, neon grid horizon, magenta and cyan, retro-futuristic, glow` | ○ | ○ | 中 |
| 21 | 可愛恐怖 | `spooky cute, Halloween, pumpkin orange and purple, round friendly ghosts, candy` | ◎ | ○ | 低 |
| 22 | 手繪繪本 | `storybook illustration, watercolor, paper texture, soft edges, whimsical` | ○ | ○ | 低 |

換題材時：把 §4.1 風格鎖的第一句換成上表關鍵字，保留透明背景、無文字、無既有 IP 等限制句。題材關鍵字另見 [na-themes](../SwarmDuel/knowledge/themes/na-themes.md)、[tw-themes](../SwarmDuel/knowledge/themes/tw-themes.md)；NA 避免原住民服飾 / 神聖物件，現金賽避免轉輪、7 / BAR、Jackpot 等老虎機元素。

## 5. 關鍵字索引
<!-- card: skip; reason=資產關鍵字，取用改查 index/assets.json 各資產的 keywords -->

### 5.1 題材 / 角色

| 關鍵字 | 資產 id |
|---|---|
| bigfoot / sasquatch / 大腳怪 / sasq / cryptid | `chr.sasq.idle` `chr.sasq.walk` `chr.sasq.identity` `chr.sasq.identity_v01` `chr.sasq.placeholder_v02` `key.key_art` |
| hero / 英雄 / chibi / plaid scarf / 紅格紋圍巾 | `chr.sasq.*` |
| alien / 外星人 / grey alien / greyling / drone pilot / jetpack / antenna | `enm.greyling.*` `enm.probe` `enm.hulk` `icn.skull` |
| swarm / 蟲群 | `enm.greyling.walk` `key.key_art` |
| boss / 頭目 / ufo / saucer / 飛碟 / mothership | `enm.saucer_scout` `enm.mother_probe` `key.key_art` `vfx.beam_warning` |
| palette swap / 換色 / tint variant | `enm.probe` `enm.hulk` `enm.saucer_scout` `enm.mother_probe` |
| camp / campground / 營地 / pacific northwest | `key.key_art` `prp.pine` `prc.campfire` `prc.tent` |
| campfire / 營火 / fire / flame / 火 | `prc.campfire` `prc.flame` `prc.glow` `icn.campfire` `key.key_art` |
| pine / 松樹 / tree / forest / 森林 | `prp.pine` `key.key_art` |
| night / 夜晚 / moonlight / lighting / 光照 | `prc.darkness` `prc.glow` `prc.ground.grass` `key.key_art` |
| rv / 露營車 / tent / 帳篷 | `key.key_art` `prc.tent` |
| ecto / ectoplasm / orb / 經驗球 / xp / lime | `prc.orb` `icn.ecto` `icn.p_magnet` |
| pinecone / 松果 / projectile / 投射物 | `prc.pinecone_shot` `icn.pinecone` |
| hot dog / 熱狗 / snack / heal / 補血 | `prc.hotdog` `icn.snack` |
| static / electric / 靜電 / aura / 光環 | `icn.static_fur` `vfx.static_aura` |
| ground / 地面 / grass / 草地 / decor / 裝飾 / rock / flower / mushroom / log / dirt | `prc.ground.grass` `prc.decor.*` |

### 5.2 形式 / 技術

| 關鍵字 | 資產 id |
|---|---|
| idle / 待機 / breathing / 呼吸 | `chr.sasq.idle` |
| walk / 走路 / walk cycle / dash | `chr.sasq.walk` `enm.greyling.walk` |
| 8-direction / 8 方向 / sprite sheet / animation / 動畫 | `chr.sasq.idle` `chr.sasq.walk` `enm.greyling.walk` |
| 4-direction / placeholder / 佔位 / static | `chr.sasq.placeholder_v02` `enm.greyling.placeholder_v02` |
| identity sheet / 身分圖 / reference / 3-pose | `chr.sasq.identity` `chr.sasq.identity_v01` `enm.greyling.identity` `enm.greyling.identity_v01` |
| pixel / 16-bit / true low-res / 低解析度 | 全部生成圖（§2.1） |
| icon / 圖示 / upgrade card / 升級卡 / atlas | `icn.*` |
| weapon / 武器 | `icn.pinecone` `icn.campfire` `icn.static_fur` `prc.pinecone_shot` `prc.flame` `vfx.static_aura` |
| passive / 被動 / speed / damage / magnet / cooldown / hp | `icn.p_speed` `icn.p_might` `icn.p_magnet` `icn.p_cooldown` `icn.p_hp` |
| score / 分數 / bounty / sheriff star / kills / skull | `icn.bounty` `icn.skull` |
| key art / 主視覺 / title / 標題 / 16:9 | `key.key_art` `ui.logo` |
| prop / 道具 / y-sort | `prp.pine` `prc.campfire` `prc.tent` |
| alt take / rejected | `icn.p_speed.alt`、§2.3 |

### 5.3 特效 / UI

| 關鍵字 | 資產 id |
|---|---|
| shockwave / 衝擊波 / ring / 擴散環 / howl / skill / aoe | `vfx.howl_ring` `tpl.fx.shockwave` |
| screen shake / 震屏 | `vfx.screen_shake` `vfx.hurt_burst` `tpl.fx.shake` |
| particle / 粒子 / burst / debris / 碎片 / spark | `vfx.kill_burst` `vfx.hurt_burst` `prc.spark` `tpl.fx.particles` |
| hit flash / 閃白 / 受擊 | `prc.flash_sheet` `tpl.fx.overlay` |
| vignette / 暗角 | `prc.darkness` `tpl.fx.overlay` |
| glow / additive / 光暈 | `prc.glow` |
| shadow / 陰影 | `prc.shadow` |
| dodge / graze / perfect dodge / star | `vfx.graze_star` |
| damage number / 傷害數字 / popup | `vfx.damage_number` |
| beam / 光束 / warning / 預警 / telegraph | `vfx.beam_warning` |
| hover / bob / desync | `vfx.enemy_hover` `prc.orb` |
| hp bar / 血條 | `vfx.hp_bar` |
| panel / button / pips / banner / ribbon / 緞帶 | `ui.panel` `ui.button` `ui.pips` `ui.banner` |
| hud / xp bar / 經驗條 / timer / combo / joystick | `ui.hud` |
| font / 字型 / logo | `ui.font.pixelify` `ui.logo` |

JSON 版有完整 314 個關鍵字（每筆資產 `keywords`）。

## 6. 缺口與生成教訓
<!-- card: KB-asset-library.gaps-lessons; kind=lesson -->

### 6.1 尚未存在的資產

| 類別 | 缺什麼 | 規格 / 來源 | 備註 |
|---|---|---|---|
| 角色動作 | Sasq Dash 2、Hurt 2、Howl 4 | 32×40，[asset_pipeline §2](../SwarmDuel/docs/asset_pipeline.md) | 加 `ANIM` 節拍＋`SPEC` d 後走同流程 |
| 敵人動作 | Greyling Hurt 1、Idle | 28×28 | Walk prompt 的「附圖 3 = Idle」對 Greyling 無效（見 6.3） |
| 敵人種類 | Probe、Hulk 專屬圖 | ux_gap #2，估 ~200 KB | 目前換色 |
| 頭目 | Saucer Scout 64×40、Mother Probe 64×64（Walk 4、Attack 4） | [gdd/04](../SwarmDuel/gdd/04_content_units.md) | 目前 Greyling ×5 / ×6 換色 |
| 其他英雄 | Moth（Mothman）、Jack（Jackalope） | 32×40，gdd/04 | 待生成 |
| 場景 | 背景 / tileset / 地圖邊界 | — | 目前全部程式繪製（§3.1）；RV、飛碟只在主視覺 |
| 技能特效 sheet | 松果拖尾、營火環粒子、靜電閃爍、寶箱開箱 | ux_gap #4、#5 | SwarmDuel 規定程式繪製、不做粒子系統 |
| UI 皮 | 大廳、角色選擇、商店、通行證、寶箱 | ux_gap #6，~150 KB | 目前純 Graphics |
| 主視覺變體 | 直版原生主視覺、logo 圖、商店截圖、icon（App 圖示） | — | 目前 16:9 裁切 |
| 音訊 | SFX（Web Audio 合成 0 B）、BGM Opus 1 首 | ux_gap #3，~600 KB | 皆未做 |

### 6.2 生成教訓

| 教訓 | 依據 |
|---|---|
| 大身分圖直接縮到 32×40 會掉輪廓、糊眼 → 用「TRUE LOW-RESOLUTION、每美術像素 = 等大方塊」prompt 再縮 | v0.1 → v0.2 |
| 縮圖用 Lanczos＋硬映射角色調色盤；最近鄰與多數決會吃掉 1–2 px 眼睛 | anim_frames.py `to_palette` |
| 強調色（圍巾紅、天線綠）要保留專用調色盤格位，否則被主色擠掉 | `ACCENTS = 6` |
| 一張只生「一動作 × 一方向」；Walk 附上同方向已驗收 Idle 鎖定鏡頭與比例 | gen_anim.sh |
| 斜後方（up_right）最容易失敗：轉成正背面或與 up 幾乎相同 → 方向描述要寫「看得到背＋右側、右手臂完整、左手臂被擋、臉不可見、每格保持旋轉」 | §2.3 兩次拒絕 |
| 不對稱配件（圍巾尾巴）要寫明「與附圖 3 同側」；鏡像方向會換邊，32 px 下可接受 | sasq Walk up_right |
| 只生 5 方向、其餘鏡像，比生 8 方向更穩 | asset_pipeline §4 |
| prompt 不要求 codex 存檔；從 log 抓 session id 再複製 | Windows 沙箱 |
| 拒絕走樣的 take、不手修掩蓋；驗收結果寫進文件 | asset_pipeline 驗收紀錄 |
| 主視覺 PNG 2.4 MB → WebP q78 寬 960 = 113 KB；像素 sprite 用 PNG-8，不用 KTX2 | asset_pipeline §5 |

### 6.3 盤點時發現的不一致（2026-10-19 已處理）

| # | 問題 | 處理 |
|---|---|---|
| 1 | `native_greyling.txt`、`enemy_greyling.txt` 寫 24×24，`SPEC` 與遊戲用 28×28 | **不是錯誤**：prompt 寫角色本體尺寸，`anim_frames.py` 把角色縮到「幀高 − 4」放進原生幀，Greyling 24 = 28 − 4。已在 `anim_prompts.py` 註解與 [asset_pipeline §2](../SwarmDuel/docs/asset_pipeline.md) 加對照表（Sasq 請求 40、放進幀內為 36） |
| 2 | 5 個 `greyling_Walk_*.txt` 寫「附圖 3 是 Idle」，但 Greyling 沒有 Idle | **已修**：`anim_prompts.py` 只在角色有 Idle 時提附圖 3；5 個 prompt 已重寫，舊版原文保存在 `_history/anim/` |
| 3 | `sasq_Idle_up_right_t3`、`sasq_Walk_up_right_t3`、`icon_p_speed_2` 沒有記錄 | **已記錄**：asset_pipeline 驗收表與 PROMPT_LOG（`SwarmDuel/art/prompts/PROMPT_LOG.md`，未收錄） |
| 4 | prompt 改寫後舊版沒保存 | **已建版本紀錄**：`tools/prompt_ledger.py` 從 Codex log 回填 20 個動畫 take 與 15 張靜態圖的 prompt 原文到 `art/prompts/_history/`；`gen_anim.sh` 與新的 `gen_image.sh` 生成前自動凍結 prompt。**無法回復**：`hero_bigfoot`、`enemy_greyling`、`prop_pine`、`key_art` 四張（prompt 檔在產出後被改、當時沒有 log） |
| 5 | `art/raw/ref/*.png`（6 張）沒有 prompt | 正常，由 `anim_prompts.py` 從 `native_*_1.png` 切出 |
| 6 | `art/native/{sasq,greyling}/*.png` 沒有記錄 | **已記錄**：v0.2 佔位的單格中間檔，不再被讀取 |
