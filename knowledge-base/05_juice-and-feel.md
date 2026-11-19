---
id: KB-juice-feel
kind: method
topic: [juice]
genre: ["*"]
reviewedAt: 2026-10-21
---
# 05 打擊感與手感（以算代貼）

> 權威來源：[references/juice.md](../.claude/skills/lite-skillgame-stack/references/juice.md)、[references/gsap.md](../.claude/skills/lite-skillgame-stack/references/gsap.md)、[references/spine.md](../.claude/skills/lite-skillgame-stack/references/spine.md)、範本 [templates/src/fx/](../.claude/skills/lite-skillgame-stack/templates/src/fx/)
> 設計原則（為什麼這樣做、手感弱時先查什麼）：[17 §6–§9](17_design-principles.md)。
> 鐵則：juice 只活在 render / UI 層，由 sim 事件驅動；高低特效的玩家同種子結果必須一致。

## 1. 效果做法與成本
<!-- card: KB-juice-feel.effects-cost; rules=RULE-FX-FILTER -->

| 效果 | 做法 | DC 成本 |
|---|---|---|
| 畫面震動 | GSAP 抖動包住 canvas 的 `#stage-shake`（transform）；HUD 放外面不跟晃 | 0 |
| 受傷泛紅 / 暗角 / 閃白 | CSS overlay（`radial-gradient` + opacity 補間） | 0 |
| 衝擊波 / 扭曲 / 色差 | GLSL Filter，只在播放期間掛在一個頂層 container | +1～2 pass |
| 粒子 | Pixi 8 `ParticleContainer` + 固定容量物件池（例 512），共用一個白點貼圖 + tint | 1 |
| Hit-stop | render 凍結 2～4 幀（停插值、`spine.autoUpdate = false`），sim 照跑 | 0 |
| 受擊閃白 | Sprite `tint` / Spine `skeleton.color` | 0 |
| 擠壓伸展 | 補 `scale.x/y`：0.08 s 進、0.15 s `elastic.out` 回 | 0 |
| 跳字 | `BitmapText` 物件池或 DOM | 0～1 |
| 音效 | Web Audio oscillator + 包絡 + noise；±5% playbackRate | 0 bytes |
| 手機震動 | `navigator.vibrate?.(15)`（iOS 無效） | 0 |

> **專案覆寫範例**：SwarmDuel 為像素風，**不使用任何 filter**（衝擊波改 sprite 擴散環）、不做通用粒子系統。新專案在 `gdd/10` 寫明自己的覆寫。

## 2. GSAP 必設參數
<!-- card: KB-juice-feel.gsap -->

```js
gsap.defaults({ duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
gsap.config({ force3D: true, nullTargetWarn: import.meta.env.DEV });
gsap.ticker.lagSmoothing(500, 33);
```

| 情境 | Ease |
|---|---|
| 打擊瞬間 | `power4.out` / `expo.out` |
| 彈性回復 | `elastic.out(1, 0.35)` |
| 按鈕 / 卡片彈出 | `back.out(1.7)` |
| 離場 | `power2.in` / `back.in(1.4)`（出比進快） |
| 震動 | `'none'` 或 `CustomWiggle` |
| 數字滾動 | `power1.out` + `snap` |
| 像素風逐格 | `steps(4)` |

| 類型 | 進 | 出 / 回復 |
|---|---|---|
| 閃白、tint | 0 | 0.08～0.12 s |
| 擠壓伸展 | 0.05～0.08 s | 0.15～0.25 s |
| 震動 | — | 小 0.12 / 暴擊 0.25 / 頭目 0.4 s（4 / 8 / 14 px） |
| 跳字 | 0.4～0.7 s | — |
| UI 面板 | 0.2～0.35 s | 0.12～0.2 s |
| 結算演出 | 0.6～1.2 s，可點擊跳過 | — |

其他規則：序列用 timeline + position（`'<'`、`'>-0.1'`、標籤），不串 `delay`；每幀跟隨用 `gsap.quickTo`；場景用 `gsap.context()` 包、離開 `revert()`；物件池回收前 `killTweensOf`；降級用 `gsap.matchMedia()` 寫入 `FEEL`。

> 實作參考：[15 §4.1](15_reference-games.md) 的「震動護眼上限」（≤ 4.2 px、180 ms 不疊加、正弦衰減、閃光 ≤ 0.14）與 Cut-In 刷幕版型（進場 0.16 s、出場 0.14 s、總長約 1 s）；本作規則是演出不得改變 sim 時序、且可跳過。

## 3. 降級與無障礙
<!-- card: KB-juice-feel.fallback-a11y; topic=juice,ux -->

| 項目 | HIGH | LOW / `prefers-reduced-motion` |
|---|---|---|
| UI 進場動畫 | 淡入位移 | 直接出現 |
| 衝擊波 | 擴散 | 短靜態環 |
| 震動、漂浮、晃動 | 有 | 無 |

原則：低特效只拿掉「動態」，**不拿掉「資訊」**（血條、警示圈、倒數照常）；特效不得遮擋判定物件；傷害數字只是裝飾，分數以結算明細為準。

## 4. Spine 要點（4.3）
<!-- card: KB-juice-feel.spine; topic=juice,art -->

- `defaultMix = 0.2`；Track 0 = 基礎循環、Track 1+ = 疊加動作（只 key 上半身），播完 `addEmptyAnimation(1, 0.2, 0)`。
- 換裝 `setSkin` / `new Skin()+addSkin()` 後 `setupPoseSlots()`，不重建物件。
- 4.3 API 變更：`setSkinByName` private、`setSlotsToSetupPose → setupPoseSlots`、無 `getCurrent`（用 `state.tracks[i]`）。
- 判定時間寫在 sim 的 tick 表，動畫對齊它，不能反過來。
- 同場 > 50 隻同角色時小兵改序列幀，Spine 留主角與頭目。
- 匯出：二進位 `.skel` + PMA atlas、頁 ≤ 2048；需 Spine 編輯器授權。

## 5. 調手感流程
<!-- card: KB-juice-feel.tuning -->

1. 所有數值放 `fx/feel.js` 的 `FEEL`，dev 掛 `window.FEEL` 即時改。
2. 長演出用 GSDevTools（只 dev 動態載入）。
3. 定案值寫回 `FEEL`，不寫死在效果函式。
