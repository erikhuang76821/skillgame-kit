---
id: KB-art-pipeline
kind: method
topic: [art]
genre: ["*"]
reviewedAt: 2026-10-21
---
# 06 美術管線 — AI 生圖到遊戲 sprite

> 來源：[SwarmDuel/docs/asset_pipeline.md](../SwarmDuel/docs/asset_pipeline.md)、`SwarmDuel/tools/*.py|sh`、`SwarmDuel/art/prompts/`、`SwarmDuel/game/src/render/spriteContract.js`
> 外部依賴：`codex-image` skill（`~/.claude/skills/`）、`pokesurvivor-asset-dev` skill（**位於 `~/.codex/skills/`，不在 repo 內**，提供 `sprite_sheet.py`）

## 1. Sprite 契約（8 方向角色）
<!-- card: KB-art-pipeline.sprite-contract; artStyle=pixel -->

| 項目 | 規格 |
|---|---|
| Sheet | 欄 = 影格；列 = 8 方向固定順序 `down, down_right, right, up_right, up, up_left, left, down_left` |
| Metadata | 每個動畫各一份 `{w,h,n,r,d,ax,ay}`；`d` 以 1/60 s tick 計 |
| 錨點 | `(ax, ay)` = 腳底；Pixi `anchor = (ax/w, ay/h)` |
| 縮放 | 美術 1 px = 世界 2 單位；最近鄰；`roundPixels` |
| 深度 | 非平面物件依腳底 Y 排序（`zIndex = feetY`） |
| 繪製順序 | ground → 地面效果/拾取 → Y 排序角色 → 投射物 → 天氣/覆蓋 → HUD |
| 陰影 / 閃光 / 光暈 | 不畫進 sprite，由程式繪製 |

## 2. 生圖流程（v1.0，可重跑）
<!-- card: KB-art-pipeline.generation -->

1. **身分參考圖**：一張圖畫同一角色正 / 側 / 背三姿勢（`art/prompts/hero_*.txt`）。
2. **動畫 prompt 產生**：`python tools/anim_prompts.py` → 每個「角色 × 動作 × 方向」一份；一張圖畫同方向 n 格橫排；附圖 ①身分圖 ②最近姿勢 ③該方向已驗收的 Idle（角色有 Idle 才附）。
3. **生成**：`tools/gen_anim.sh <name> <Anim> <dir> <take>` → `codex exec --sandbox read-only < prompt`，從 log 抓 `session id:`，由 `~/.codex/generated_images/{sid}/` 複製。
4. **版本紀錄**：生成一律走 `tools/gen_anim.sh` / `tools/gen_image.sh`，生成前把 prompt 凍結到 `art/prompts/_history/`；`python tools/prompt_ledger.py` 產生 `art/prompts/PROMPT_LOG.md`（產出 ↔ prompt 快照 ↔ 是否採用 ↔ 現行 prompt 是否已改）。
5. **人工驗收**：身分一致、真 alpha、無文字、方向正確；拒絕而非掩蓋走樣（保留 take 紀錄）。
6. **機械縮圖打包**：`python tools/anim_frames.py` — 依透明欄切格 → 同條同縮放比、共用地面線 → 上半身 alpha 重心對齊 → **Lanczos 縮小 + 硬映射角色共用調色盤**（不抖色）→ alpha 二值化 → 加 1 px 外輪廓 → `sprite_sheet.py pack/validate --require-eight`。
7. 只生 5 方向，`up_left / left / down_left` 水平鏡像。
8. `tools/anim_preview.py` 輸出 6× 總覽做 QA。

**Prompt 風格鎖定段落**（所有資產共用）：16-bit 像素、1 px 深色輪廓、每材質 3 色、左上光源、≤ 16 色、TRUE LOW-RESOLUTION 方塊像素、真透明背景、無文字 / 地面 / 陰影、不得使用既有 IP。

## 3. 踩過的坑
<!-- card: KB-art-pipeline.pitfalls; kind=lesson -->

| 坑 | 解法 |
|---|---|
| prompt 要求 Codex 存檔 → Windows 沙箱靜默失敗 | prompt 只說「生成，不要寫檔」，由 session id 目錄複製 |
| 大身分圖直接縮到 32×40 → 輪廓消失、眼睛糊 | 改「真低解析度」生成 + 縮圖後自動加輪廓 |
| 最近鄰 / 多數決取樣讓 1–2 px 眼睛消失 | Lanczos + 硬映射調色盤 |
| 斜後方向（up_right）容易轉成正背面 | prompt 明寫「看得到背 + 右側、右手臂」 |
| 配件（圍巾）換邊 | prompt 寫「與附圖 3 同側」 |

## 4. 其他資產
<!-- card: KB-art-pipeline.other-assets -->

| 資產 | 做法 | 大小 |
|---|---|---|
| UI 圖示 | 生成 12 張 → 量化 64×64 → 單一 atlas | 44 KB |
| 主視覺 | 16:9 生成，直版 cover 裁切，WebP q78 寬 960 | 113 KB |
| 地面、拾取物、火焰、陰影 | Canvas / Graphics 程式產生 | 0 bytes |
| 字型 | 像素字型 woff2（Pixelify Sans 400/700） | 36 KB |

## 5. 授權
<!-- card: KB-art-pipeline.licensing; topic=art,legal -->

- 不使用不可商用素材（如 PokéSurvivor 原素材為 CC BY-NC），只沿用技術契約。
- AI 生成圖保留 prompt 與原圖可追溯；**商用前需法務確認 AI 生成內容權利與平台政策**。
