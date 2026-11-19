# Draw Call 控制與資源管線

## Pixi 8 合批規則

Pixi 8 的 batcher 會把**連續**、**同 blend mode**、**貼圖數不超過硬體上限（通常 16）**的 Sprite / Mesh / Spine 合成一次 draw。以下任何一項都會切斷批次：

| 打斷原因 | 對策 |
|---|---|
| 換 blend mode（如 add 光效夾在 normal 角色之間） | 所有加色效果放在同一個 container、畫在最後 |
| `filters` | 只掛在頂層一個 container，用完 `container.filters = null` |
| `mask` | 用 atlas 內做好遮罩的圖或 shader 代替 |
| Graphics 與 Sprite 交錯 | 靜態 Graphics 先 `renderer.generateTexture()` 轉成貼圖放進合批；或把 Graphics 集中一層 |
| Text 每個字串一張貼圖 | 用 `BitmapText`（字型圖放 atlas）或改 DOM |
| 貼圖超過 16 張 | 打包成 atlas；同場景同時出現的東西放一起 |

固定圖層順序（範例）：`ground → groundFx → actors(Y 排序) → projectiles → additiveFx → overlay`。每層內部同 blend、同 atlas，基礎畫面約 3～5 DC。

## 量測

- 開發期掛 [templates/src/debug/drawCalls.js](../templates/src/debug/drawCalls.js)：包住 `gl.draw*` 計數，每幀顯示上一幀 DC。
- 深入看每個 draw 是什麼：Spector.js 擷取一幀。
- 驗收標準寫兩個數字：**基礎畫面 DC**、**特效全開峰值 DC**。

## 3D（ogl / three）

- 重複物件：three `InstancedMesh(geometry, material, count)`，每幀只改 `instanceMatrix`（`setMatrixAt` 後 `instanceMatrix.needsUpdate = true`）；ogl 用 `geometry.addAttribute('offset', { instanced: 1, ... })`。
- 同類共用一個 material；不同顏色用 instance color attribute，不另開材質。
- 背景、天空、地面能合併成一個 mesh 就合併。
- 透明物件要排序就無法 instancing 時，改用 alpha test / dither。

## 紋理格式決策

| 內容 | 格式 | 原因 |
|---|---|---|
| 像素風 sprite | PNG-8 | 色盤小、無損；KTX2 會糊、檔案更大 |
| UI 圖示、小圖 | WebP / PNG atlas | 檔案小，VRAM 不是瓶頸 |
| 手繪大圖、背景、3D 貼圖 | KTX2（ETC1S；細節要求高用 UASTC） | 省 VRAM、GPU 直接取樣，免主執行緒解 PNG |
| 主視覺、商店圖 | WebP / AVIF | 只在 DOM 顯示 |

KTX2 的價值在**記憶體與解碼**，不是磁碟大小——ETC1S 通常比 PNG 小但比 WebP 大；UASTC 常比 PNG 還大（靠伺服器 Brotli 補）。加 KTX2 前先算 transcoder（≈ 0.9 MB）值不值得。

### Pixi 8 載入 KTX2（自架 transcoder）

```js
import 'pixi.js/ktx2';                       // registers the KTX2 loader extension
import { Assets, setKTXTranscoderPath } from 'pixi.js';

// Pixi defaults to unpinned jsDelivr URLs — always self-host.
// Copy node_modules/pixi.js/transcoders/ktx/* into public/transcoders/ktx/ at build time.
setKTXTranscoderPath({
  jsUrl: './transcoders/ktx/libktx.js',
  wasmUrl: './transcoders/ktx/libktx.wasm',
});

const bg = await Assets.load('./assets/bg.ktx2');
```

`setKTXTranscoderPath` 的實際參數名以安裝版本的 `.d.ts`（`lib/compressed-textures/ktx2/utils/setKTXTranscoderPath.d.ts`）為準。

## glTF

- 匯出流程：`gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress ktx2`（需本機裝 `@gltf-transform/cli` 與 KTX-Software）。
- three：`GLTFLoader` + `setMeshoptDecoder(MeshoptDecoder)`；Draco 用 `DRACOLoader.setDecoderPath('./draco/')` 指本地。
- 動畫多的角色仍優先考慮 Spine 2D；3D 骨骼動畫檔案大。
