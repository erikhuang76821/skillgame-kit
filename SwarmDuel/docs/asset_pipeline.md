# Asset Pipeline — 美術契約、Codex 生圖、打包驗證

- **目的**：讓每張遊戲圖都有固定規格、可追溯來源、可自動驗證
- **來源 skill**：`pokesurvivor-asset-dev`（契約、流程、`sprite_sheet.py`）＋ `codex-image`（生圖）
- **狀態**：v1.0（2026-10-19）— Sasq（Idle 2、Walk 4）與 Greyling（Walk 4）已是正式 8 方向動畫 sheet；其餘動作（Dash、Hurt、Howl）與其他英雄仍待生成

## 1. 契約（沿用 PokéSurvivor，不得私改）

| 項目 | 規格 |
|---|---|
| Sheet 結構 | 欄 = 影格；列 = 8 方向，固定順序 `down, down_right, right, up_right, up, up_left, left, down_left` |
| Metadata | **每個動畫各自一份** `{w,h,n,r,d,ax,ay}`；`d` 以 1/60 s tick 計；不可從另一個動畫推尺寸 |
| 錨點 | `(ax, ay)` = 腳底點；世界座標就是腳底；Pixi pivot = `(ax/w, ay/h)` |
| 縮放 | 美術 1 px = 世界 2 單位；最近鄰；`roundPixels` |
| 深度 | 非平面物件與角色依**腳底 Y** 排序；平面物件在角色下 |
| 繪製順序 | ground → 地面效果/拾取物 → Y 排序物件與角色 → 投射物/空中特效 → 天氣/覆蓋 → HUD |
| 陰影 / 受擊閃光 / 光暈 | **不畫進 sprite**，由程式另外繪製 |

Pixi 實作：`game/src/render/spriteContract.js`（`sliceSheet`、`rowFor`、`Animator`、`makeActor`）。

## 2. 原生尺寸（直版 720 寬世界視窗）

| 資產 | 原生幀 | 螢幕上（×2） | 動畫（正式版） |
|---|---|---|---|
| 英雄 Sasq / Moth / Jack | 32 × 40 | 64 × 80 | **Sasq 已完成 Idle 2、Walk 4**；待做 Dash 2、Hurt 2、Howl 4 |
| Greyling | 28 × 28 | 56 × 56 | **Walk 4 已完成**；待做 Hurt 1（換色做 probe / hulk / boss） |

**生成請求尺寸 ≠ 原生幀**：prompt 寫的是「單一姿勢的角色本體」尺寸；`anim_frames.py` 再把角色縮放到「幀高 − 4」放進原生幀（上留 2 px、腳底在第 h−2 列）。

| 角色 | prompt 請求 | 角色在幀內高度 | 原生幀 |
|---|---|---|---|
| Sasq | 32 × 40 | 36 | 32 × 40 |
| Greyling | 24 × 24 | 24（1:1） | 28 × 28 |

所以 Greyling prompt 的 24×24 與 sheet 的 28×28 一致，不是錯誤；Sasq 請求 40 後縮到 36（0.9 倍）。改尺寸時同步改 `anim_prompts.py` 的 `CHAR.size` 與 `anim_frames.py` 的 `SPEC`。
| 頭目 | 64 × 40、64 × 64 | 128 × 80～128 | Walk 4、Attack 4 |
| 松樹（prop） | 24 × 40 | 48 × 80 | 靜態 |
| 地面、Ecto 球、松果、火焰、熱狗、陰影 | 程式產生 | — | 0 bytes（`render/textures.js`） |
| 主視覺（標題） | 960 寬 WebP | cover 裁切直版 | — |

## 3. Codex CLI 生圖流程（codex-image skill）

```bash
codex exec --skip-git-repo-check --sandbox read-only < art/prompts/hero_bigfoot.txt > gen.log 2>&1
```

1. Prompt 存在 `art/prompts/`（**風格鎖定段落共用**：16-bit、1 px 深色輪廓、每材質 3 色、左上光源、真透明背景、不得使用既有 IP）
2. 從 log 抓 `session id:`，由 `~/.codex/generated_images/{sid}/` 複製 PNG（不綁檔名樣式）到 `art/raw/`
3. **prompt 不得要求 codex 存檔**（Windows 沙箱會靜默失敗）
4. 用 Read 開圖人工驗收：身分一致、真 alpha、無文字
5. **一律用腳本生成**：靜態圖 `tools/gen_image.sh <prompt 檔名> <take> [-i 參考圖 …]`、動畫 `tools/gen_anim.sh`。兩者生成前把 prompt 原文凍結到 `art/prompts/_history/`，同一 take 號不得重用；同 session 多張圖存成 `_<take>`、`_<take>b`…

已生成（2026-10-19）：

| 檔案 | 用途 | 尺寸 | Alpha |
|---|---|---|---|
| `art/raw/hero_bigfoot_1.png` | 英雄身分參考（正 / 側 / 背） | 1938×811 | ✓ |
| `art/raw/enemy_greyling_1.png` | 敵人身分參考 | 1801×873 | ✓ |
| `art/raw/prop_pine_1.png` | 松樹 | 971×1619 | ✓ |
| `art/raw/key_art_1.png` | 主視覺 16:9（直版 cover 裁切中央） | 1672×941 | — |
| `art/raw/anim/*.png` | 動畫條原圖（15 個採用 + 5 個重生 / 被拒的 take），見 §4 v1.0 | 約 2000×700 | ✓ |

## 4. 從身分圖到遊戲圖

### v1.0：正式 8 方向動畫（目前遊戲內使用）

| 遊戲檔 | 動畫 | 原生幀 | sheet | `d`（1/60 s） | 錨點 | 大小 |
|---|---|---|---|---|---|---|
| `game/src/assets/sasq_idle.png/.json` | Idle 2 格（站姿 → 吸氣下沉 1 px） | 32×40 | 64×320 | 36, 24 | 16, 39 | 19 KB |
| `game/src/assets/sasq_walk.png/.json` | Walk 4 格（接觸 / 經過 / 接觸 / 經過） | 32×40 | 128×320 | 8, 8, 8, 8 | 16, 39 | 35 KB |
| `game/src/assets/greyling_walk.png/.json` | Walk 4 格 | 28×28 | 112×224 | 9, 9, 9, 9 | 14, 27 | 10 KB |

全部 8 列、無 `dirs` 欄位，`sprite_sheet.py validate --require-eight` 通過；每格 PNG 在 `art/frames/{name}/{Anim}/{direction}/{i}.png`（共 80 格）。

**流程（可重跑）**

1. `python tools/anim_prompts.py` → 每個「角色 × 動作 × 方向」一份 prompt：`art/prompts/anim/{name}_{Anim}_{dir}.txt`。沿用 `native_*.txt` 的「TRUE LOW-RESOLUTION、square pixel blocks、1 px 深色輪廓、≤16 色、真透明」段落；一張圖畫同一方向的 n 格橫排。同時把身分圖切成 `art/raw/ref/{name}_{down,right,up}.png`。
2. `tools/gen_anim.sh <name> <Anim> <dir> <take>` → codex-image 流程（prompt 由 stdin 餵入、`--sandbox read-only`、從 log 抓 `session id:`、由 `~/.codex/generated_images/{sid}/` 複製）。附圖：①身分圖 `art/raw/native_*_1.png` ②最接近的身分姿勢 ③（Walk）該方向已驗收的 Idle 條。原圖存 `art/raw/anim/{name}_{Anim}_{dir}_t{take}.png`，log 在 `art/raw/anim/logs/`。
3. 人工驗收，採用的那張複製成 `art/raw/anim/{name}_{Anim}_{dir}.png`。
4. `python tools/anim_frames.py [name]` → 機械縮圖 + 打包 + 驗證：依透明欄切出 n 格；同一條所有格用**同一個縮放比**（條高 → 框高 −4）並共用地面線（腳底固定在第 h−2 列、輪廓在 h−1）；以上半身 alpha 重心水平對齊（擺腿不會讓身體抖）；Lanczos 縮小後**硬映射**到該角色共用調色盤（Sasq 24 色、Greyling 20 色，其中 6 色保留給圍巾紅 / 天線綠等強調色，不抖色）；alpha 二值化；`derive_native.outline()` 加 1 px 外輪廓。
5. 只生 5 個方向（down、down_right、right、up_right、up）；`up_left / left / down_left` 為 `up_right / right / down_right` 的水平鏡像（圍巾尾巴會跟著換邊，32 px 下可接受，且比另生三方向更不會走樣）。
6. `tools/anim_preview.py <out.png>` 輸出 6× 放大的總覽圖做人工 QA。

**縮圖方法的取捨**：最近鄰與「多數決」取樣都會讓 1–2 px 的眼睛消失（Codex 畫的像素格不是原生框的整數倍）；Lanczos + 硬映射調色盤在兩個角色上都保住雙眼與嘴，是目前選擇。

**Prompt 版本紀錄**：`python tools/prompt_ledger.py` 產生 art/prompts/PROMPT_LOG.md（`SwarmDuel/art/prompts/PROMPT_LOG.md`，未收錄），列出每張原始產出、產生它的 prompt 快照與 sha、是否採用、現行 prompt 是否已改。2026-10-19 以前的 take 由 Codex log 回填（log 保留了送出的原文）；`hero_bigfoot`、`enemy_greyling`、`prop_pine`、`key_art` 四張的 prompt 檔在產出後被改過，生成當時的原文無法取得。

**驗收紀錄（拒絕而非掩蓋走樣）**

| 條 | 結果 | 原因 |
|---|---|---|
| sasq Idle down / down_right / right / up | take 1 採用 | — |
| sasq Idle up_right | take 1 **拒絕**、take 2 採用、take 3 未採用 | take 1 第 2 格轉成正背面且縮小；改寫 up_right 方向描述（看得到背 + 右側、右手臂）後以同一 prompt 重生 take 2、3，採用 take 2（取捨原因當時未記錄） |
| sasq Walk down / down_right / right / up | take 1 採用 | — |
| sasq Walk up_right | take 1 未採用、take 2 採用、take 3 未採用 | 懷疑 take 1 圍巾換邊（複查後其實同側）；prompt 加上「圍巾尾巴與附圖 3 同側」後重生 take 2、3，取步幅最清楚的 take 2 |
| greyling Walk down / down_right / right / up | take 1 採用 | up 的腿部擺動偏小，可接受 |
| greyling Walk up_right | take 1 **拒絕**、take 2 採用 | take 1 與 up 幾乎相同（只有天線偏右） |

**2026-10-19 修正**：Greyling Walk 的 prompt 原本寫「附圖 3 是已驗收的 Idle」，但 Greyling 沒有 Idle，`gen_anim.sh` 只附兩張圖。已改 `anim_prompts.py`：只有該角色有 Idle 時才提附圖 3（及圍巾同側句）。採用中的 Greyling take 是用舊 prompt 產生的，原文在 `_history/anim/`。

**遊戲端**：`main.js` 每個動畫各載一張 sheet + JSON；`render/world.js` 用 `spriteContract.js` 的 `Animator`：英雄移動或衝刺時 Walk、否則 Idle（切換時重置影格並重設錨點），敵人每隻一個 `Animator`、以 id 錯開起始格、靜止時停格。動畫以**模擬 tick** 推進（暫停 / 升級選卡時凍結），不碰模擬本身（`npm test` 9/9）。原本程式做的「走路上下彈 + 擠壓」已移除，改由 Walk 格本身表現。

舊的 4 列佔位圖（v0.2）移到 `art/native/placeholder_v02/`，`derive_native.py` 不再產生角色圖。`art/native/{sasq,greyling}/{down,left,right,up}.png` 是同一版佔位的單格中間檔（Sasq 32×40、Greyling 28×28），遊戲與工具都不再讀取，留作對照。

### v0.2（已淘汰）：「真低解析度」生成 + 自動輪廓

Prompt 要求 Codex 以「每個美術像素 = 等大方塊」的方式畫低解析度圖（`art/prompts/native_*.txt`），再用最近鄰取樣縮到原生框，最後自動加 1 px 深色外輪廓（`outline()`）。結果比 v0.1 清楚很多，但仍是「靜態單格」，正式動畫見下方。

UI 圖示：`art/prompts/icon_*.txt` 生成 12 張 → `icon_atlas()` 量化成 64×64 並打包成單一 `icons.png`（44 KB）＋ `icons.json`。`art/raw/icon_p_speed_2.png` 是同一 session 產出的第 2 張，未採用（atlas 只讀 `_1`）。

### v0.1（已淘汰）：身分圖直接縮小

機械處理、不重畫：依透明欄切出三個姿勢 → BOX 降採樣到原生框 → alpha 二值化 → 調色盤量化（角色 24 色、prop 12 色）→ 腳底置中 → 4 列 sheet（`left` = `right` 水平鏡像）。Metadata 帶 `dirs` 與 `placeholder: true`；斜向由 `rowFor()` 退回左右。

**驗收發現**：1900 px 的身分圖直接縮到 32×40 會失去 1 px 輪廓、眼睛糊掉（Greyling 尤其明顯）。所以這只能當佔位。

### 新增動作的做法（依 skill 流程，v1.0 已用於 Idle / Walk）

1. 以已驗收身分圖為參考，**一次只生一個動作 × 一個方向**（同方向 n 格同一張），prompt 寫明原生框與腳底錨點；在 `tools/anim_prompts.py` 的 `ANIM` 加節拍描述、在 `tools/anim_frames.py` 的 `SPEC` 加 `d`
2. 縮圖後若需要，可在原生解析度手修（輪廓、眼睛），存成 `art/frames/{name}/{Anim}/{direction}/{i}.png`
3. 打包與驗證（skill 腳本，不會縮放或補圖；`anim_frames.py` 會自動呼叫）：

```bash
python sprite_sheet.py pack --frames frames/Walk --output Walk.png --metadata Walk.json --width 32 --height 40 --durations 8,8,8,8 --anchor 16,39
```

```bash
python sprite_sheet.py validate --sheet Walk.png --metadata Walk.json --require-eight
```

4. 在遊戲內檢查 Idle→Dash→Idle 腳底不跳動、與松樹的 Y 排序

## 5. 壓縮

| 類型 | 做法 | 理由 |
|---|---|---|
| 像素 sprite | PNG-8 索引色（量化 ≤ 32 色）+ 無損最佳化 | 像素圖用 GPU 壓縮（Basis/KTX2）會糊邊，反而變大 |
| 主視覺 | WebP q78，寬 960 | 2.4 MB PNG → 113 KB |
| 程式繪製資產 | Canvas 產生紋理 | 0 bytes |
| 音效 | Web Audio 程式合成（沿用 PokéSurvivor） | 0 bytes |
| 音樂（未做） | Opus 48–64 kbps 單聲道循環 ×2 | 每首 ~0.5–0.7 MB |

## 6. 授權

- **不使用** PokéSurvivor 原始 Pokémon 素材（CC BY-NC，不可商用）；只沿用其**技術契約**
- 新圖為 Codex（GPT image）生成之原創設計，prompt 與原圖存於 `art/`，可追溯；商用前需法務確認 AI 生成內容之權利與平台政策
