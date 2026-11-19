# 04 Content Units — 角色 / 敵人 / 武器 / 敵潮 schema

- **目的**：讓企劃以資料新增內容，不改程式
- **相關系統**：02、docs/asset_pipeline（sprite metadata）
- **狀態**：Draft

## 設計意圖（Why）

排位用標準化配置，內容擴充的主要方向是**外觀、敵種、敵潮腳本、模式**，而非數值角色。所以 schema 把「影響平衡」與「純外觀」欄位分開，方便審核。

## Hero（排位中只允許外觀差異）

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | string | `sasq`、`moth`、`jack` |
| `sprite` | string | sprite registry key（見 asset_pipeline 的 `a[animation]` 結構） |
| `palette` | string? | 調色盤換色 id（外觀變體不需新圖） |
| `adventureStats` | object | 僅 Adventure 模式生效：`hp, speed, might` |
| `ranked` | const | 排位一律套 02 的標準化值 |

| 初始英雄 | 題材 | 狀態 |
|---|---|---|
| Sasq | Bigfoot（紅格紋圍巾） | 身分參考圖已生成 `art/raw/hero_bigfoot_1.png` |
| Moth | Mothman | 待生成 |
| Jack | Jackalope | 待生成 |

## Enemy

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | string | |
| `sprite` | string | sprite key；巨量敵人共用一張 atlas |
| `hp / atk / speed` | int | |
| `points` | int | 擊殺分 |
| `behavior` | enum | `chase` / `dash` / `orbit` / `beam` |
| `radius` | int | 碰撞半徑（世界單位） |

| id | hp | atk | speed | points | behavior | 原生尺寸 |
|---|---|---|---|---|---|---|
| greyling | 10 | 5 | 60 | 1 | chase | 28×28 |
| probe | 6 | 4 | 110 | 2 | dash | 16×16 |
| hulk | 80 | 15 | 35 | 5 | chase | 32×32 |
| abductor | 40 | 0 | 50 | 8 | beam（拉人） | 32×32 |
| saucer_scout | 600 | 20 | 50 | 100 | orbit | 64×40 |
| mother_probe | 1800 | 25 | 45 | 300 | chase + 召喚 | 64×64 |

## Weapon / Passive（升級池）

| id | 類型 | Lv1 | 每級成長 | 上限 |
|---|---|---|---|---|
| pinecone | 投射 | 10 傷 / 0.8 s | +1 發 / +3 傷 | 5 |
| antler | 迴力鏢 | 14 傷 / 1.6 s | +4 傷、+範圍 | 5 |
| campfire | 環繞 | 3 團火 6 傷 | +1 團 | 5 |
| moonbeam | 直線雷射 | 20 傷 / 2.5 s | +寬度 | 5 |
| beartrap | 放置 | 40 傷 | +1 個 | 5 |
| static_fur | 光環 | 4 傷/0.5 s | +半徑 | 5 |
| p_speed / p_might / p_magnet / p_cooldown / p_hp / p_area | 被動 | +10% | +10% | 5 |

背包：武器 4 格、被動 4 格。

## Wave Script

```json
{ "t0": 60, "t1": 120, "enemies": ["greyling","probe","hulk"],
  "rate": [5, 8], "events": [{"at": 80, "type": "ring", "enemy": "greyling", "count": 24}] }
```

## Open Questions

- 外觀換色是否會影響可讀性（例如敵人被換成跟背景同色）→ 外觀需過「對比度檢查」
