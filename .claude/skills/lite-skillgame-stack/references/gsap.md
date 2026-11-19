# GSAP 細緻化設定（3.15）

GSAP 的三個強項——**精準控制**（時間軸、緩動、互動）、**即時修改**（改參數馬上看）、**複雜動畫**（拖曳、物理、路徑）——在本規範下的對應做法。寫任何 GSAP 程式前，逐項確認下面標 ⚙ 的參數有沒有刻意設定，而不是吃預設值。

> 鐵則：GSAP 只在 render / UI 層。影響判定的位移（擊退、閃避距離）由 sim 計算，GSAP 只能在上面疊視覺偏移。

## 1. 全域設定（`main.js` 開機一次）

```js
gsap.defaults({ duration: 0.25, ease: 'power2.out', overwrite: 'auto' }); // ⚙ project-wide feel
gsap.config({ force3D: true, nullTargetWarn: import.meta.env.DEV });       // ⚙ GPU layers for DOM; warn only in dev
gsap.ticker.lagSmoothing(500, 33);                                          // ⚙ after a >500 ms hitch, advance only 33 ms
```

| 參數 | 建議 | 為什麼 |
|---|---|---|
| ⚙ `defaults.overwrite` | `'auto'` | 同屬性被新補間接手時自動砍舊的，連打不會互搶；預設 `false` 會疊加抖動 |
| ⚙ `defaults.ease` | `'power2.out'` | GSAP 預設 `power1.out` 偏軟，遊戲回饋要更俐落 |
| ⚙ `lagSmoothing` | `(500, 33)` | 切背景回來不會一次跳完所有動畫；設 `0` 會關閉（不要） |
| `gsap.ticker.fps()` | 不設 | 鎖幀交給瀏覽器；低階機降級由 render 層決定 |

## 2. 每個補間都要想過的參數

| 參數 | 用途 / 建議值 | 常見坑 |
|---|---|---|
| ⚙ `duration` | 見 §4 時長表 | 會擋操作的動畫 ≤ 0.3 s |
| ⚙ `ease` | 見 §3 | 震動用 `'none'`，不要用預設 |
| `delay` | 序列請改用 timeline position | 一堆 `delay` 難維護 |
| `repeat` / `yoyo` / `repeatDelay` | 呼吸燈 `repeat: -1, yoyo: true` | `-1` 的補間場景結束必須 kill（見 §7） |
| ⚙ `stagger` | 物件形式：`{ each: 0.04, from: 'start' \| 'center' \| 'edges' \| 'random', grid: 'auto', ease }` | 用 `amount` 時總長固定、`each` 時每個固定，二擇一 |
| ⚙ `immediateRender` | `from()` / `fromTo()` 預設 `true` | 放進 timeline 後段的 `from()` 會在開頭就閃一下 → 設 `false` |
| `transformOrigin` | DOM：`'50% 100%'` 腳底擠壓 | Pixi 物件改用 `pivot` / `anchor` |
| `onComplete` / `onInterrupt` | 收尾、回收物件池 | 被 `overwrite` 砍掉時只觸發 `onInterrupt` |
| `paused` + `.play()` | 預建 timeline 重複播放 | 比每次 `new` 便宜 |
| `id` | dev 時給 GSDevTools 辨識 | — |

## 3. Ease 選擇（依手感）

| 情境 | Ease | 參數意義 |
|---|---|---|
| 打擊瞬間（進） | `'power4.out'` / `'expo.out'` | 越高次方前段越猛 |
| 彈性回復（擠壓伸展回原狀） | `'elastic.out(1, 0.35)'` | (amplitude, period)：period 越小回彈越快越多次 |
| 按鈕 / 卡片彈出 | `'back.out(1.7)'` | overshoot：1.2 微彈、1.7 標準、2.5 誇張 |
| 落地 | `'bounce.out'` | — |
| 蓄力 / 離場 | `'power2.in'` / `'back.in(1.4)'` | 離場比進場快 |
| 震動、跟隨抖動 | `'none'` | 每段隨機目標點，曲線交給隨機 |
| 數字滾動 | `'power1.out'` | 搭 `snap: { val: 1 }` 取整 |
| 像素風逐格 | `'steps(4)'` | 保持像素感 |
| 自訂曲線 | `CustomEase.create('hit', 'M0,0 C0.1,1.4 0.3,1 1,1')` | 曲線在 GSAP 官網 Ease Visualizer 拉好再貼 |
| 自訂震動 | `CustomWiggle.create('shake', { wiggles: 8, type: 'easeOut' })` | 單一補間做衰減震動，取代多段 timeline |

## 4. 時長表（起手值，進 `FEEL` 再調）

| 類型 | 進 | 出 / 回復 |
|---|---|---|
| 打擊閃白、tint | 0 | 0.08～0.12 s |
| 擠壓伸展 | 0.05～0.08 s | 0.15～0.25 s |
| 畫面震動 | — | 小 0.12 / 暴擊 0.25 / 頭目 0.4 s |
| 跳字 | 0.4～0.7 s（上飄 + 淡出） | — |
| UI 面板 | 0.2～0.35 s | 0.12～0.2 s（出比進快） |
| 結算演出 | 0.6～1.2 s 總長，可點擊跳過 | — |

## 5. Timeline：精準控制

```js
const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.3 }, paused: true });
tl.from(panel, { y: 40, autoAlpha: 0 })
  .addLabel('items')
  .from(items, { scale: 0.6, autoAlpha: 0, stagger: { each: 0.04 }, ease: 'back.out(1.7)' }, 'items')
  .from(scoreEl, { textContent: 0, snap: { textContent: 1 }, duration: 0.8 }, '<0.1')
  .to(button, { autoAlpha: 1 }, '>-0.1');
tl.play(0);
```

| position 參數 | 意思 |
|---|---|
| `'<'` / `'>'` | 前一段開始 / 結束時 |
| `'<0.1'` / `'>-0.1'` | 前一段開始後 0.1 s / 結束前 0.1 s |
| `'+=0.2'` / `'-=0.2'` | 時間軸尾端之後 / 之前 |
| `'items'` / `'items+=0.1'` | 標籤位置 |

- ⚙ `timeline.defaults`：子補間共用參數，不要每段重寫。
- ⚙ `tl.timeScale(n)`：整段加速 / 慢動作；「可跳過」= `tl.progress(1)`。
- DOM 淡入淡出用 `autoAlpha`（同時切 `visibility`，隱藏後不吃點擊）。

## 6. Pixi 物件補間

| 項目 | 做法 | 坑 |
|---|---|---|
| 位置 / 透明度 | `gsap.to(sprite, { x, y, alpha })` | — |
| 縮放 | `gsap.to(sprite.scale, { x: 1.2, y: 0.8 })` | `scale` 是 ObservablePoint，要補間它本身 |
| 旋轉 | `gsap.to(sprite, { rotation: Math.PI / 2 })` | Pixi 用**弧度** |
| tint | 補間代理物件 `{ t: 0 }` 在 `onUpdate` 寫回 `sprite.tint` | — |
| PixiPlugin（gzip ≈ 2.9 KB） | **預設不用** | 需要 `registerPIXI(PIXI)` 傳整個命名空間，`import * as PIXI` 會破壞 tree-shaking；其 `blur / saturation / colorize` 會建立 filter，打斷合批 |

## 7. 高頻更新、衝突與清理

- **每幀跟隨**（準星、鏡頭、血條追值）：`const xTo = gsap.quickTo(obj, 'x', { duration: 0.15, ease: 'power3' })`，每幀呼叫 `xTo(v)`；直接寫值用 `gsap.quickSetter`。**禁止在 ticker 裡每幀 `gsap.to()`**。
- **衝突**：同目標同屬性靠 `overwrite: 'auto'`；整個物件重來用 `gsap.killTweensOf(target)`。
- **場景生命週期**：場景內所有補間包在 `const ctx = gsap.context(() => { ... })`，離開場景 `ctx.revert()`（還原 inline style 並砍掉 `repeat: -1`）。
- **物件池**：回收前 `gsap.killTweensOf(obj)` 並重設屬性，否則舊補間會繼續改到下一個使用者。

## 8. 降級與無障礙

```js
const mm = gsap.matchMedia();
mm.add({ full: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, ctx => {
  const { reduce } = ctx.conditions;
  FEEL.shake.enabled = !reduce;        // ⚙ every juice reads FEEL, never media queries directly
  FEEL.ui.in = reduce ? 0 : 0.25;
});
```

遊戲內「降低特效」開關也寫入同一個 `FEEL`，效果函式只讀 `FEEL`。

## 9. 即時修改（調手感流程）

1. 所有手感數值集中在 [templates/src/fx/feel.js](../templates/src/fx/feel.js) 的 `FEEL`，效果函式只讀它，不寫死數字。
2. dev 模式把 `FEEL` 掛到 `window.FEEL`，在 DevTools console 直接改、立刻觸發看效果。
3. 長演出（結算、開場）用 GSDevTools 拖拉時間軸——只在 dev 動態載入，不進正式包：

```js
if (import.meta.env.DEV) {
  const { GSDevTools } = await import('gsap/GSDevTools');
  gsap.registerPlugin(GSDevTools);
  GSDevTools.create({ animation: resultTl, id: 'result' });
}
```

4. 調好的值寫回 `feel.js`，commit 訊息註明調了什麼。

## 10. 外掛取捨（gzip 實測，GSAP 自 2025 起全部免費）

| 外掛 | gzip | 本類遊戲用途 | 建議 |
|---|---|---|---|
| core | ≈ 28 KB | 必要 | ✅ |
| CustomEase | ≈ 3.7 KB | 招牌打擊曲線 | ✅ 推薦 |
| CustomWiggle | ≈ 1.2 KB（需 CustomEase） | 衰減震動 ease | ✅ 推薦 |
| Physics2DPlugin | ≈ 1.2 KB | 金幣 / 碎片拋物線（純視覺） | ✅ |
| MotionPathPlugin | ≈ 10 KB | 掉落物飛向 HUD 的弧線 | 需要時 |
| SplitText | ≈ 3.7 KB | 標題、結算逐字 | 需要時 |
| Flip | ≈ 10 KB | DOM 版面切換（背包、排行） | 需要時 |
| Draggable + InertiaPlugin | ≈ 13.5 + 3.3 KB | UI 拖曳 / 甩動清單 | 只用於 UI，不做遊戲操作輸入 |
| PixiPlugin | ≈ 2.9 KB | — | ❌ 見 §6 |
| GSDevTools | ≈ 23 KB | 調時間軸 | 只 dev 動態載入 |
| ScrollTrigger / ScrollSmoother | — | 遊戲沒有捲動頁 | ❌ |

用到的外掛逐一 `import { CustomEase } from 'gsap/CustomEase'` 並 `gsap.registerPlugin(...)`，不要 `import 'gsap/all'`。
