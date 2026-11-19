# 打擊感（Juice）——以算代貼

全部只在 render / UI 層；全部要有 LOW / `prefers-reduced-motion` 降級。

## 1. 畫面震動：抖 DOM 容器

[templates/src/fx/shake.js](../templates/src/fx/shake.js)

- 目標是包住 canvas 的 `#stage-shake`；HUD 是它的兄弟節點（不跟著晃），想讓 HUD 一起晃才放進去。
- 用 `transform`（GSAP 的 `x / y / rotation`），瀏覽器在合成層處理，不觸發 layout，也不碰 WebGL。
- 晃動時 canvas 邊緣會露出底色：父層 `overflow: hidden` 並讓容器略大（`inset: -12px`），或背景用同色。
- 連續觸發時 `kill` 前一個 timeline，強度取較大者，不要疊加。
- 力度分級在 `FEEL.shake`：`light` 4 px / 0.12 s、`crit` 8 px / 0.25 s、`boss` 14 px / 0.4 s；`step` 控制抖動頻率、`rotPerPx` 控制旋轉量。
- 想用單一補間：`CustomWiggle.create('shake', { wiggles: 8, type: 'easeOut' })` 後 `gsap.fromTo(el, { x: 0 }, { x: px, ease: 'shake', duration })`（見 [gsap.md](gsap.md) §3）。

## 2. 受傷泛紅 / 暗角 / 閃白：CSS overlay（0 DC）

[templates/src/fx/overlay.js](../templates/src/fx/overlay.js)

```css
#fx-vignette { position: absolute; inset: 0; pointer-events: none; opacity: 0;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(200, 0, 0, .65) 100%); }
#fx-flash { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: #fff; mix-blend-mode: screen; }
```

GSAP 補 opacity 即可。比 GLSL vignette 便宜（不增加 render pass），效果相同。

## 3. 衝擊波 / 扭曲 / 色差：GLSL Filter（只在作用期間掛）

[templates/src/fx/shockwave.js](../templates/src/fx/shockwave.js)——自寫 fragment shader，不用貼圖。

- 片段 shader 開頭必須 `precision highp float;`：`uInputSize` 與預設頂點 shader 共用，精度不一致會 link 失敗（Pixi 只報 `Could not initialize shader`）。
- 實測：基礎 1 DC → 衝擊波期間 2～3 DC → 結束拿掉 filter 後回 1。
- Filter 會讓目標 container 多一次 render-to-texture pass；**只在播放期間**掛到 `world` container，結束 `filters = null`。
- 同時只允許一個全螢幕 filter；多個效果合併到同一支 shader 的 uniforms。
- `pixi-filters` 已有 `ShockwaveFilter`（v6 對應 Pixi 8），要用時**只 import 單一 filter 路徑**，不 import 整包。
- 時間變慢模糊：優先用「降 timeScale + CSS `filter: blur()` 疊在 canvas 上」；真的要 shader 模糊再用 filter。

## 4. 粒子：ParticleContainer（1 DC）

[templates/src/fx/particles.js](../templates/src/fx/particles.js)

- Pixi 8 `ParticleContainer` + `Particle`：所有粒子必須共用同一張貼圖來源（atlas 內一個 4×4 白點，用 `tint` 上色）。
- 「0 KB 圖片」實際做法：atlas 裡放一個白點，或開機時用 `Graphics` → `renderer.generateTexture()` 產生一次。
- 固定容量物件池（例 512），超量直接丟棄最舊的；不要每幀 `new`。
- 預設只動 `position`；要改 `scale / rotation / color` 時在 `dynamicProperties` 打開對應項（越多越慢）。
- LOW 模式數量減半或關閉。

## 5. 其他不占包體的手段

| 手段 | 做法 |
|---|---|
| Hit-stop | render 層凍結 2～4 幀（停插值、`spine.autoUpdate = false`）；sim 照跑 |
| 受擊閃白 | Sprite `tint` 切白再補回；Spine 用 `skeleton.color` |
| 擠壓伸展 | GSAP 補 `scale.x / scale.y`（0.08 s 進、0.15 s `elastic.out` 回） |
| 跳字 | `BitmapText` 物件池 + GSAP 上飄淡出 |
| 音效 | Web Audio：oscillator + 包絡 + noise buffer；同一音效隨機 ±5% playbackRate |
| 手機震動 | `navigator.vibrate?.(15)`（iOS Safari 無作用，視為加分項） |

## GSAP 與 Pixi 共用時鐘

兩者各自跑 `requestAnimationFrame`，同一幀內都會執行，一般不需處理。需要嚴格同步（例如 hit-stop 同時停兩者）時：

```js
app.ticker.stop();
gsap.ticker.add(() => app.ticker.update());   // one RAF drives both
gsap.ticker.lagSmoothing(500, 33);
```
