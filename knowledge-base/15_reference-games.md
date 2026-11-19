---
id: KB-reference-games
kind: research
topic: [market, tech, art]
genre: ["*"]
reviewedAt: 2026-10-21
---
# 15 參考遊戲拆解 — 三國奇兵 / 9527 星際遠征

> 拆解兩款公開的 HTML5 網頁遊戲，補強**物件規範、音效、過場演出**的實作參考。只描述與量測，不複製程式或美術原檔。
> 來源：GitHub [`johnwu0626/johnwu`](https://github.com/johnwu0626/johnwu) master `203716ec8e`（2026-10-18），以及線上版實玩（2026-10-19，內建瀏覽器模擬 375×812、DPR 2）。行號都對應這個 commit。
> 縮寫：**TK** = `three-kingdoms-survivor/index.html`（單檔，CSS L14–1201、DOM L1201–1471、JS L1471–9061）；**95** = `9527/`（`game.js` / `catalog.js` / `audio.js` / `style.css`）。
> 量測原始資料：[assets/ref-games/asset-measurements.json](assets/ref-games/asset-measurements.json)（104 檔：尺寸、編碼、bpp、音檔長度）。截圖都在 [assets/ref-games/](assets/ref-games/)。

## 0. 一眼結論
<!-- card: KB-reference-games.summary; topic=market -->

| | 無雙割草：三國奇兵（TK） | 9527 星際遠征（95） |
|---|---|---|
| 品類 | 單指虛擬搖桿的 survivor-like，波次加中場鍛造商店（Brotato 式 6 槽合成）、100 陣 | 直版彈幕射擊，12 關、3 機體、10 段火力 |
| 線上網址 | [three-kingdoms-survivor/](https://johnwu0626.github.io/johnwu/three-kingdoms-survivor/) | [9527/](https://johnwu0626.github.io/johnwu/9527/) |
| 來歷 | AI 協作原型，美術用 PicAnywhere 生成（`DECISIONS.md` #3、#5、#13） | 同事原版是 Godot 4 Web；本版從 `.pck` 解包美術和音樂後**重寫成 Web**（`README.md` L3、`DECISIONS.md` D-001） |
| 最值得借 | 2.5D 人武分離、Cut-In 刷幕、地圖程序化、全合成國風 BGM、震動護眼上限 | 首屏分兩階段預載、WAV 加合成音雙層混音與 compressor、Boss 雙層血條、Reduced Motion 開關 |
| 最該避開 | 全部資源一次預載（8 MB）、canvas 沒乘 DPR、廣告復活和局外養成影響戰力 | 包體 13.3 MB、lossless WebP、BGM 整首解碼成 PCM、分數乘局外加成 |
| 對 skill game 三原則 | 全部違反（`Math.random`、可變 dt、錢和養成都能換戰力） | 全部違反（同左，而且 `bounty` 直接乘分數） |

（圖：TK 戰鬥，未收錄） （圖：95 戰鬥，未收錄）

---

## 1. 技術棧與包體
<!-- card: KB-reference-games.tech-bundle; topic=tech,budget -->

| 項目 | TK | 95 | 出處 |
|---|---|---|---|
| 渲染 | 純 Canvas 2D，一個 IIFE，沒有第三方 JS | 純 Canvas 2D，原生 ES module（3 檔），沒有第三方 JS | TK L1472、L3098；95 `index.html` L240 |
| UI | DOM/CSS 疊在 canvas 上（HUD、商店、結算全是 DOM） | 同左 | 兩者 index.html |
| 主迴圈 | rAF 寫在 `loop()` 第一行；可變 dt，clamp 0.001–0.05；update 和 render 各包 try/catch | rAF，可變 dt 上限 0.05；hit-stop 期間只跳過 update | TK L8127–8140；95 `game.js` L1566–1582 |
| DPR | **沒乘**：`canvas.width = innerWidth`，DPR 2 手機上 backing 只有 375×812，畫面糊 | 乘 DPR（上限 2），backing 750×1624 | TK L3195–3198；95 L324–331；實測 |
| 邏輯解析度 | 沒有。用 `getCameraZoom` 依短邊縮放：<480 → 0.72、<720 → 0.84 | 沒有。場地直接用 CSS px，Boss 半徑上限 `w*0.19` | TK L6592；95 L1343 |
| 隨機 | `Math.random` 51 處，沒有種子；只有地圖用 sin-hash `tileHash` | `Math.random` 33 處，沒有種子 | grep；TK L6602 |
| 存檔 | `tk_survivor_save_v1` / `_best_wave_v1` / `_meta_v1` | `9527_expedition_save_v1` / `9527_meta_v1` | TK L3022–3024；95 L144–145 |
| 字型 | Google Fonts CDN：Noto Serif TC、Noto Sans TC、JetBrains Mono（CSS 本身 208 KB） | Google Fonts CDN：Orbitron、Chakra Petch、Noto Sans TC、JetBrains Mono（CSS 139 KB） | 實測 network |
| 廣告 | `window.TK_AD_BRIDGE.showRewardedAd(placement, cb)`；網頁版直接發獎勵 | `window.GAME9527_AD_BRIDGE`；呼叫端傳物件、bridge 要函式，**網頁版獎勵永遠不會發** | TK L3079–3093；95 L133–142 對照 L2618 |

### 包體與載入（實測）

| | TK | 95 |
|---|---|---|
| repo 遊戲資料夾 | **7.77 MB**（48 張 webp = 7.58 MB、HTML 361 KB） | **13.31 MB**（sprites 8.64 MB、audio 3.28 MB、store 圖 1.53 MB、JS 129 KB） |
| 首屏載入 | 全部 48 張在進標題時一次載完：49 個請求、**約 8.0 MB**，load 3.8 s | 先載 critical 6 張（約 1.5 MB）就能進機庫，接著 0.5 s 後 lazy 載入其餘 27 張；第一次點擊後再 fetch 16 個 WAV 和第 1 關 BGM。進戰鬥時累計 **約 10.0 MB** |
| 圖片編碼 | 全部是 **VP8L lossless WebP**，7–15 bpp | 全部是 VP8L lossless，2–11 bpp |
| 背景大圖 | `title_banner` 1280×720 = 1.25 MB；`arena_floor` 1040×693 = 0.98 MB（遊戲中只用 10–14% alpha 當紋理） | 8 張 1280×720，每張 0.24–0.93 MB（12 關共用 8 張） |
| 音訊 | 0 bytes（全合成） | 16 個 WAV：mono 24 kHz 16-bit、0.10–1.38 s、5–66 KB；4 首 BGM：MP3 80 kbps stereo，68–77 s，約 700 KB/首 |

> 對照我們的規範：TK 剛好貼著 8 MB，95 超過 10 MB 硬上限。兩者若改用 lossy WebP q80 或 KTX2，圖檔估計可以降到 1/5～1/8（lossless 的 bpp 是 lossy 一般值約 1 bpp 的 7 倍以上，推估，未實測）。

### 每幀繪製量（實測 1 秒取平均，30 fps 環境）

| | TK（第 1 陣，敵少） | 95（第 1 關中段） |
|---|---|---|
| drawImage / 幀 | 約 38 | 約 10 |
| fill / 幀 | 約 93 | 約 115 |
| fillRect / 幀 | 約 9 | 約 124 |
| save+restore / 幀 | 約 77 | 約 115 |
| shadowBlur>0 / 幀 | 0（手機寬度關閉） | 約 36 |

> 量測方法：在頁面上包裝 `CanvasRenderingContext2D.prototype` 計數 1 秒。Canvas 2D 沒有 Draw Call 的概念，換算成 WebGL 的話每個物件約 1 個 DC，和我們「2D ≤ 5」的合批模型差了兩個數量級；它們能跑是因為物件少、沒有 filter。

---

## 2. 物件製作規範
<!-- card: KB-reference-games.object-production; topic=art -->

### 2.1 TK — 2.5D 人武分離（對標《噠噠特攻》）

| 部件 | 做法 | 參數 | 出處 |
|---|---|---|---|
| 上半身 body | 貼圖 `body_*.webp`，**沒有腿、不拿武器**的二頭身 Q 版，去背 | 12 張，高 384（呂布 448），寬 266–416；繪製高 `size*0.92` | TK L5755；量測 |
| 雙靴 | **canvas path** 畫，左右交替 | 跨距 `size*0.14`、抬腳 `size*0.11` | L5710–5745 |
| 披風 | canvas path，擺動 | 5 px（BOSS 10 px）；`#111` 描邊，線寬 2.2–3.4 | 同上 |
| 身體起伏/前傾 | transform | 上下 2.2 px（BOSS 4.5）；前傾 0.065 rad（衝刺 0.16） | 同上 |
| 步伐週期 | `walkPhase += 16/s`，約 0.39 s 一步；待機 +3/s；BOSS 12.5 | — | L6051 |
| 手持武器 | 貼圖 `rig_*.webp`（寬固定 384，高 56–378 依形狀） | pivot 在武器長度 28% 處；擺動 ±0.28 rad（衝刺 0.65） | L5765–5781 |
| 浮動神兵 | 6 槽掛點環繞主角，各自自動瞄準最近敵人 | 轉向 lerp 0.22；長度 `44+tier*3.4`；朝左時 y 翻轉 | L4732–4743、L5838–5896 |
| 陰影 | canvas 橢圓 `rgba(0,0,0,.55)` | `size*0.36 × size*0.14` | L5694–5697 |
| 錨點 | 腳底中心 | — | L5755–5758 |
| 方向 | 只有左右 2 向，`ctx.scale(facing,1)` | — | L5749 |
| 受擊白閃 | 載入時預先算好白色剪影（`source-in`），受擊時換圖 0.12 s | **不用 filter**，可借用 | L1543–1611、L4412 |
| 圖層 | 地圖 → 地面區域 → 道具 → 翠玉 → 粒子 → 衝擊環 → 刀光 → **y-sort 實體** → 投射物 → 敵彈 → 落雷 → 天氣 → 浮字 → 螢幕空間（暈影、刷幕、搖桿） | 每幀重建 renderList 再 sort（會產生 GC） | L6910–7398、L7153 |

**尺寸表**

| 物件 | drawSize（px） | 碰撞半徑 | 與主角比 | 出處 |
|---|---|---|---|---|
| 主角 | 68 | 24 | 1.0 | L7221、L3137 |
| 小兵 | 52–58（大型 70/80） | 18–30 | 0.8–1.2 | L4057–4244 |
| 騎兵 | 62 | — | 0.9 | L3950 |
| 先鋒 BOSS（每章第 5 陣） | 196 | 68 | **2.9** | L4310 |
| 鎮關 BOSS（每章第 10 陣） | 256 | 92 | **3.8** | L4310 |

**素材重用**：20 位 BOSS 加 9 名將只用 12 張 body。例如 `body_xiahoudun`、`body_shield` 各被引用 20 次，差異靠尺寸、武器、法陣和名字撐出來。

**程式繪製 vs 貼圖**：貼圖只有 body、武器（rig/wpn）、頭像、翠玉、地板紋理、標題；靴子、披風、陰影、BOSS 法陣、血條、投射物（槍和環刃以外）、粒子、刀光、衝擊環、天氣全部用 canvas path。依物件種類算，大約 1/3 是貼圖、2/3 是程式繪製。

**色盤**：CSS `:root` 約 18 個變數，以金（`#f7d779` / `#d4a84f`）、朱紅 `#c83e31`、翠玉 `#3ca370`、暗鐵 `#090807` 為主（L15–34）。品質色階 `TIER_COLORS` 10 階：灰 → 藍 → 紫 → 橘 → 紅 → 青 → 金 → 粉 → 綠 → 白（L3008–3020）。

**地圖程序化**：tile 1120×800。整個視窗先填一次底色，再只畫可見範圍的 tile：地板圖 10% alpha（奇數格鏡射）＋ 3 個 `tileHash` 明暗橢圓 ＋ 依 20 種 `mapStyle` 用漸層畫古道或河道和點綴物（L6607–6876）。等於用 1 張紋理撐出 20 種地貌，可以和 [11 地表設定集](11_terrain-style-kit.md) 對照。

### 2.2 95 — 寫實貼圖加程式特效

| 物件 | 做法 | 參數 | 出處 |
|---|---|---|---|
| 三機體 | 1 張 900×900 atlas，**依寬度比例 0.318 / 0.684 切成三塊**（沒有 atlas JSON） | 繪製高度固定 70 px；判定半徑 19；敵彈判定 `r*0.6+5.5`（小於視覺） | 95 L34–38、L2429、L1006、L1900 |
| 執行期去背 | `extractCleanRegion`：左上角像素是白色才啟動；lum>236 且 sat<26 → 透明，lum>215 且 sat<35 → 漸變；再以 alpha>18 求 bbox，加 4 px 邊距裁切 | 只用在機體 atlas，其他圖離線處理 | L72–126 |
| 敵機 ×9 | 單張貼圖，190–320 px | 繪製 `radius*2.3`（radius 25–42）；非旋轉型轉 π 朝下 | L2343–2346、`catalog.js` L144–260 |
| Boss ×12 | 單張貼圖，143–480 px | 繪製 `radius*2.4`（radius 84–98） | L2383 |
| Banking | 拖曳時 `dx*0.018`，限制 ±0.28 rad；放手每幀 ×0.85 回正（依幀率） | — | L468、L1735 |
| 受擊白閃 | `ctx.filter='brightness(2.3~2.5)'` | 敵 0.08 s、Boss 0.09 s、玩家 0.25 s；舊版 iOS Safari 不支援、也慢 | L2345、L2385、L2428 |
| 尾焰 | 程式繪製：兩支三角形加 linearGradient | 長 `20+sin(t*45)*6`；漸層每幀重建 | L2411–2424 |
| 子彈 | 100% 程式繪製：lance 雙矩形、prism 菱形、cannon roundRect、seeker 圓 | `shadowBlur` 10；敵彈半徑 5.5 圓加 45% 白芯 | L2299–2334、L2463–2479 |
| 粒子 | 圓點陣列，速度 ×0.96 阻尼，alpha 隨壽命遞減 | **沒有數量上限**；Boss 擊破一次 330 顆 | L1943–1950、L1403–1417 |
| 背景 | 背景大圖 alpha 0.6、cover ×1.06，只做 `sin(t*0.2)*14` 浮動（**不捲動**）；95 顆星 22–117 px/s，速度 >75 的拉成流星條 | 2 層 | L310–322、L2176–2202 |
| Boss 雙層血條 | DOM，外殼（SHELL）和核心（CORE）兩條百分比 | 外殼歸零時溢出傷害丟掉 | `index.html` L87–106、L1386 |
| 缺圖退路 | 背景填底色、敵機畫圓 | — | L2178、L2349 |

**catalog 欄位（可直接當資料表範本）**：

| 表 | 欄位 |
|---|---|
| `SHIPS` | `speed` 440/395/350、`fireInterval` 0.12–0.175、`shotDamage`、`pattern`（twin/spread/heavy）、`bombDamage`、`shotSound`、`atlasIndex`、`stats`、10 段 `levelDescriptions` |
| `ENEMY_TYPES` | `sprite`、`hp` 115–640、`radius`、`score`、`speed`、`fireInterval`、`bulletSpeed`、`pattern`（single/aimed_double/fan3/fan5/ring8/rotating_cross）、`hoverY`、`rotates`、`guaranteedDrop` |
| `STAGES` | `bgSprite`、`bgTheme`、`bgm`、`bossTime` 42–55 s、`enemyPool`、`hazards`、`boss{shellHp, coreHp, radius, patterns}` |

**程式繪製 vs 貼圖**：貼圖只有機體、敵機、Boss、背景（30 張）；子彈、粒子、尾焰、護盾環、僚機、道具（P/B/H）、hazard、著陸平台、Boss 光環、血條都是程式繪製。canvas 內的顏色是寫死的 hex，沒有共用 CSS 變數（`style.css` L4–18）。

---

## 3. 音效應用
<!-- card: KB-reference-games.audio; topic=audio -->

| 項目 | TK | 95 |
|---|---|---|
| 來源 | **100% Web Audio 合成**，0 bytes：oscillator 加 0.5 s 白噪 buffer；共用三個元件：`_playPluck`（主波 + 八度 sine）、`_playTaiko`（sine 下滑到 32 Hz）、`_playPercNoise`（highpass 噪音） | **檔案加合成雙層**：16 個 WAV，每次 `playSfx` 都再疊一層合成音（增益 vol×0.36）；`shell_break`、`ui_click`、`beacon` 只有合成音 |
| BGM | 程序化：`setInterval` 每 115 ms 跑一個 16 分音符（約 130 BPM）；以 D3 為根的五聲/多利安 11 音音階；title、battle、boss 3 種模式；依章節套 10 種移調比 | 4 首 MP3（12 關共用），fetch + `decodeAudioData` 解成整首 AudioBuffer 循環播放，淡入 0.6 s，換曲直接停、不 crossfade |
| 匯流排 | **沒有**：每個 gain 都直接接 `ctx.destination` | bgm 0.55 / sfx 0.75 → master → **DynamicsCompressor**（threshold -14、knee 18、ratio 6、attack 0.004、release 0.16）→ 輸出 |
| 節流 | `_throttle`：揮擊 45 ms、重擊 55 ms、拾取 32 ms | 每個 key 各自限制：射擊 48 ms、含 hit 的 38 ms、其他 25 ms；音高隨機 0.96–1.04 |
| 空間感 | 無 | 只有射擊音有 stereo pan：`(x/w-0.5)*1.4`，限制在 ±0.85 |
| 靜音 | 只翻 `enabled` 旗標，ctx 不 suspend | master 設 0 |
| 解鎖 | 6 種首次互動事件都呼叫 `init()`：resume、播 1 frame 靜音 buffer、啟動 BGM | 第一次 pointerdown/keydown 時 `unlock()`，同時才開始預載 SFX（buffer 還沒好之前只播合成音） |
| 背景 | 切到背景時 `suspendAudio`；**一般暫停不停 BGM** | visibilitychange、pagehide、blur 都會 suspend；靜音中不 resume |
| 出處 | TK L1626–1996、L8798–8829 | 95 `audio.js` L14–281、`game.js` L336–366 |

**觸發時機對照**

| 事件 | TK | 95 |
|---|---|---|
| 攻擊 | `playSlash`：saw 680→115 Hz、0.11 s 加噪音；`playArrow`：tri 1120→280 Hz、0.07 s | `shot_a/b/c`（0.10–0.18 s，音量 0.68）＋ pan |
| 命中 | `playHeavyImpact`：taiko 155 加噪音 | `enemy_hit` 0.42 / `boss_hit` 0.48 |
| 擊殺 | **沒有專屬音**（靠爆炸 `playFireBurst`） | `enemy_destroy` 0.72 |
| 拾取 | `playGemPickup`：五聲音階 C5→C7，0.38 s 內連續撿取會一路升音 ← **可借** | `power_pickup`（依等級改變音高）/ `bomb_pickup` |
| 升級、合成 | `playMergeClang`：3 音琶音，覺醒時 6 音 | 科技升級共用 `power_pickup` |
| 受傷、死亡 | `playHurt`：taiko 90 加噪音 | `player_hit` / `player_explosion` |
| 大招 | `playCutInFanfare`：三連鼓加 6 音和弦 | `bomb_a/b/c`，音量 1.0，1.2–1.4 s |
| BOSS | 出場 `playWarDrum`；擊破 `playBossSlainFanfare`：四鼓加 7 音和弦 | `boss_warning` 0.95；`shell_break`；`boss_destroy` |
| UI | 無 | `ui_click`（合成） |

> 和 [14 音效](14_audio.md) 對照：TK 證明「全合成」也能撐出有題材感的 BGM 和 SFX（0 bytes），但沒有 master bus 和 compressor，大量同時發聲時容易爆音；95 的 bus 加 compressor 結構值得照抄，BGM 用整首解碼則要避開。

---

## 4. 過場與演出
<!-- card: KB-reference-games.cutscenes; topic=ux,juice -->

兩款都**沒有用 GSAP**，全部是 canvas 手寫 tween，DOM 面板只用 `display` 切換。

### 4.1 TK

| 演出 | 做法 | 時長 | 可跳過 | 出處 |
|---|---|---|---|---|
| 開戰橫幅 | canvas 條幅：陣名、地圖、駐守軍團、敵軍強度倍率 | 3.2 s（淡入 0.4、淡出 0.25） | 否（不擋操作） | L3820、L7443–7471 |
| 連斬印章 | 30 / 60 / 之後每 50 斬，斜切 -0.18 rad 的條幅 | 滑入 0.18 s，停 2.1 s | 不擋操作 | L4529–4548、L7474–7512 |
| **無雙 / BOSS 大招刷幕**（Cut-In） | 凍結 update；36 條集中線；條幅傾斜 ±0.11 rad、高 `clamp(210, ch*0.4, 310)`；巨大浮水印字；頭像圓章加 body 加武器；書法大字 30–56 px；台詞條 | 英雄 **1.06 s**、BOSS **1.02 s**；進場 0.16 s ease-out cubic，出場 0.14 s | **否** | L7515–7754、L5156、L5379 |
| BOSS 出場 | 距主角 340 px 生成，0.36 s 突進，2 s 內減傷 75%；戰鼓、震動、衝擊環 | 約 2.4 s | — | L4286–4345 |
| BOSS 二階段 | 血量 ≤52% 時狂暴：速度 ×1.38、傷害 ×1.25，並立刻接大招刷幕 | — | — | L6301–6314 |
| **BOSS 擊破刷幕** | 左邊英雄立繪，右邊 BOSS 被一刀兩斷錯位（最多 18 px）；0.15 s 後蓋「討伐・斬」朱印；剩餘小兵全部轉成翠玉 | 進場 0.18 s；0.38 s 後才接受點擊、空白鍵、Enter | 點擊才繼續（防誤觸 0.38 s） | L7756–8124、L4617–4730 |
| 商店、結算、暫停 | DOM overlay，`backdrop-filter: blur(8px)`，沒有轉場 | 0 | — | L487–501 |
| 震動 | 幅度 `min(4.2, mag*0.26)` px，持續 ≤0.26 s，180 ms 內不疊加；以 `*0.025^dt` 衰減，<0.08 歸零；**正弦波而不是隨機抖動**；玩家自己的爆炸不震 | — | — | L5622–5632、L5938–5947、L6918–6924 |
| screenFlash | 透明度上限 0.14 | — | — | L7434–7440 |
| 減震開關 | `reduceMotion`：關震動、閃光、天氣，並減少粒子；預設關、不讀 `prefers-reduced-motion` | — | — | L3104、L9045 |

> **護眼上限**（震動 ≤4.2 px、180 ms 節流、正弦波、flash ≤0.14）是使用者反映「畫面很晃」之後調出來的（`DECISIONS.md` #22），可以直接當成 [05 打擊感](05_juice-and-feel.md) 的上限參考值。

### 4.2 95

| 演出 | 做法 | 時長 | 出處 |
|---|---|---|---|
| 機庫 | 220×220 spotlight 小 canvas：旋轉虛線環、尾焰、僚機預覽；START 鈕有 CSS `pulseStartBtn` | — | L594–662、`style.css` L396 |
| 出擊 | **沒有演出**：launch 音效加 2 s 無敵 | — | L869、L1014 |
| 關卡開始 | canvas 中央浮字（22 px）加 DOM toast | 浮字 2 s；toast 4.2 s，淡出 0.45 s | L940、L965 |
| Boss 警告 | DOM 紅色 banner；Boss 從 y=-130 以 `dt*3.2` lerp 滑入，進場期間不吃傷害 | banner 2.3 s；第一發攻擊在 1.5 s 後 | L1360、L1865–1873 |
| 破殼 | 震動 12 / 0.45 s、hit-stop 0.06 s、30 顆粒子、浮字；之後攻擊加快（間隔 1.6→1.2 s，彈速 240→290） | — | L1387–1395 |
| Boss 擊破 | 震動 18 / 0.85 s、hit-stop 0.09 s、55 次爆炸 ×6 顆；清空敵彈 | **結算 modal 立刻跳出**，爆炸凍結在 modal 後面 ← 避開 | L1403–1417 |
| 炸彈 | 全畫面色閃 0.75 s（alpha ≤0.25）、震動 14 / 0.55 s、38 顆粒子、無敵 2.6 s | — | L1215–1258 |
| 訊號短斷（第 5 關） | CSS 掃描線 overlay，opacity 漸變 0.15 s | 每次 1 s，間隔 7.5–11.5 s | L1611–1621、`style.css` L75–93 |
| 第 12 關終局 | 著陸 6 s：中央廊道、降落平台下移，期間停火、停止生怪 | 不能跳過，也沒有失敗判定 | L1446–1456、L2239–2273 |
| 震動 | 每幀隨機 translate，**沒有衰減**，時間到直接停 ← 避開 | — | L2147–2151 |
| Reduced Motion | 暫停選單裡的開關：關震動、hit-stop、炸彈色閃；爆炸粒子降到 40%。不存檔，也不讀媒體查詢 | — | L2029、L2053、L2147 |

> 文件和程式不一致：95 的 README 說破殼有「慢動作與閃光」，程式碼裡沒有（L1387–1395）。

---

## 5. UI/UX
<!-- card: KB-reference-games.ui-ux; topic=ux -->

| 項目 | TK | 95 |
|---|---|---|
| 方向 | 直橫都可；`@media (max-width:720px)` 時 HUD 折行、無雙鈕 84→68 px | 直版優先（打包時鎖 portrait）；整份 CSS 沒有 media query |
| HUD 版位 | 頂列：頭像、HP、翠玉、陣名加倒數，再一列暫停/樂音/減震/存檔/說明；底部左邊是 6 槽武器架，右下是無雙圓鈕 | 頂列：品牌、💎、靜音、選單；左上 pilot-card（`min(195px,48vw)`）有 HP 加 bomb pips；右上分數加倍率；右下 76 px 必殺鈕（沒彈時 opacity 0.38） |
| 操控 | 浮動虛擬搖桿：canvas 任意處按下就是原點；只認第一根手指（鎖 `pointerId`）；死區 4 px，滿速半徑 45 px；無雙是獨立 DOM 鈕，多點觸控互不干擾 | 單指**相對位移**，倍率 1.18（飛機不在手指底下，不會被擋）；一律自動連射；canvas 上連點 <260 ms 放炸彈（沒檢查距離，閃避時容易誤觸 ← 避開） |
| safe-area | `viewport-fit=cover` 加 `max(10px, env(safe-area-inset-*))` | `viewport-fit=cover` 加 `env()` 套在 top-bar、HUD、必殺鈕 |
| 返回鍵 | `history.pushState` 加 `popstate` → 暫停 | 同左，另外展示室按返回會回機庫 |
| 背景 | visibilitychange、pagehide、blur → 存檔、暫停、靜音 | 同左（桌機 window 失焦也會暫停） |
| 字型 | 標題用 Noto Serif TC 900（書法感），內文 Noto Sans TC；canvas 用 800/900 但 Sans 只載到 700，瀏覽器會用合成粗體 | 標題和數字用 Orbitron、Chakra Petch，數字也用 JetBrains Mono，內文 Noto Sans TC |
| 截圖 | 標題、局外養成（`knowledge-base/assets/ref-games/tk_title-meta_188x407.jpg`，未收錄）、鍛造營帳（`knowledge-base/assets/ref-games/tk_forge-camp_375x812.jpg`，未收錄）、戰敗（`knowledge-base/assets/ref-games/tk_defeat-ad-revive_375x812.jpg`，未收錄） | 機庫（`knowledge-base/assets/ref-games/9527_hangar_375x812.jpg`，未收錄）、任務中止（`knowledge-base/assets/ref-games/9527_defeat-ad-revive_225x487.jpg`，未收錄） |

**實玩觀察**（2026-10-19）

- TK 第 1 陣 18 s 結束後直接進鍛造營帳。第 2 陣沒有操作時，HP 從 115 掉到 6 只花了約 7 s，難度曲線很陡，初期非常依賴局外養成。
- TK 戰敗畫面上，最顯眼的是「華佗顯靈・原地滿血復活」廣告鈕，「重整再戰」排在它下面。95 的任務中止畫面也一樣：廣告復活和雙倍晶體排在「重試」上面。

---

## 6. 可借用 / 要避開
<!-- card: KB-reference-games.borrow-avoid; kind=lesson -->

### 6.1 可借用（照我們的技術棧改寫）

| # | 做法 | 來源 | 在我們的棧怎麼落地 |
|---|---|---|---|
| 1 | **2.5D 人武分離**：只生成無腿上半身和獨立武器，腳、披風、陰影交給程式；12 張 body 撐 29 個角色 | TK §2.1 | body 和武器打進同一張 atlas；腳和披風用 Pixi `Graphics`，或預烘 2–4 幀的小 sprite；走路參數放進 `FEEL` |
| 2 | **Cut-In 刷幕版型**：集中線、斜條幅、立繪、書法大字、朱印；進場 0.16 s、出場 0.14 s，總長約 1 s | TK §4.1 | 用 DOM/CSS 疊層加 GSAP timeline（不佔 DC）；**只停 render、sim 照跑**，或在 sim 定義為確定性的「施放前搖」 |
| 3 | **震動護眼上限**：≤4.2 px、180 ms 不疊加、正弦波、指數衰減歸零、flash ≤0.14、自己的爆炸不震 | TK §4.1 | 寫進 `FEEL.shake`，和 [05](05_juice-and-feel.md) 的 GSAP 震動合併 |
| 4 | **一張紋理加程序化地貌**：tile 用 hash 撒點，加漸層畫道路和河道，撐出 20 種地圖 | TK §2.1 | 以 sim 種子驅動 hash，可以和 [11](11_terrain-style-kit.md) 的地表生成合用 |
| 5 | **拾取連擊升音**：五聲音階，0.38 s 內連續撿取一路升音 | TK §3 | 直接加進 `sfx.js`，0 bytes |
| 6 | **首屏兩階段預載**：critical（機庫加第 1 關）先 await，其餘延後 | 95 §1 | 對應我們的 boot / lazy bundle；記得加同時下載數上限 |
| 7 | **音訊 bus 加 compressor**：bgm/sfx 分軌 → master → compressor；每個 key 各自節流，音高 ±4%；第一次互動才預載 SFX | 95 §3 | 照抄參數（-14 / 18 / 6 / 0.004 / 0.16） |
| 8 | **Boss 雙層血條**（外殼 → 核心）加破殼節點（hit-stop 0.06 s、攻擊加速） | 95 §2.2、§4.2 | 破殼是天然的 sim 事件，正好拿來驅動 juice |
| 9 | **判定小於視覺**：機體判定 `r*0.6+5.5` | 95 §2.2 | 彈幕類標配；判定半徑寫在 sim，渲染不影響判定 |
| 10 | **相對位移操控**（倍率 1.18），手指不擋飛機 | 95 §5 | 搭配 [13 輸入公平性](13_input-fairness.md) 用時間戳輸入 |

### 6.2 要避開

| 問題 | 出現在 | 我們的規則 |
|---|---|---|
| 全部資源一次預載、lossless WebP 7–15 bpp | 兩者 | lossy WebP 或 KTX2；首包只放首屏需要的 |
| 包體 13.3 MB（含 1.5 MB 商店圖） | 95 | ≤8 MB；商店素材不要放進 web 包 |
| canvas 不乘 DPR（高 DPI 糊） | TK | resolution = min(DPR, 2) |
| BGM 整首解碼成 PCM（每首約 23 MB 常駐） | 95 | 用 `<audio>` / MediaElementSource 串流，或程序化 BGM |
| BGM 用 `setInterval` 排程（會抖），暫停不停 | TK | 用 audio clock 做 lookahead 排程 |
| 沒有 master bus 和 compressor | TK | 照 6.1 #7 |
| 每顆子彈和粒子各自 `save/restore` 加 `shadowBlur`；`ctx.filter` 閃白；粒子沒有上限 | 95 | 物件池、固定容量；tint 閃白；沒有 filter |
| 每幀重建 renderList、DOM `innerHTML` | TK、95 | 固定陣列；HUD 只在數值變動時寫入 |
| 震動沒有衰減、隨機抖動 | 95 | 照 6.1 #3 |
| Boss 擊破後結算 modal 立刻跳出 | 95 | 擊破演出要演完（可跳過）再出結算 |
| 刷幕凍結 1 s 且不能跳過，而且是凍結 sim | TK | 演出不得改變 sim 時序；可以跳過 |
| 雙擊放大招沒檢查距離 | 95 | 大招一律用獨立按鈕 |
| `try/catch` 包住整個 update，錯誤被吞掉 | TK | dev 模式直接拋錯；只在 prod 降級 |
| 測試後門（「+500 / 全解鎖」）留在正式 UI | 兩者 | build flag 排除 |
| 字型從 CDN 執行期載入 | 兩者 | 打包時子集化進包內 |
| Reduced Motion 預設關、不讀媒體查詢、不存檔 | 兩者 | 讀 `prefers-reduced-motion`，存檔 |

---

## 7. 對照 skill game 公平性原則
<!-- card: KB-reference-games.fairness-check; topic=fairness -->

| 原則 | TK | 95 | 我們 |
|---|---|---|---|
| 同種子、可重播 | ✗ `Math.random` 遍布 sim（暴擊、生怪、商店、BOSS 出生角） | ✗ 同左（生怪、掉落、hazard） | 種子 PRNG，sim 禁用 `Math.random` |
| 確定性時間 | ✗ 可變 dt 直接積分（上限 50 ms），阻尼依幀率 | ✗ 同左；場地大小隨螢幕 px 改變 | fixed step；固定邏輯解析度 |
| 固定難度 | ✗ BOSS 血量和小兵倍率依玩家 DPS 動態調整（`getEffectiveMobScale`，L3765、L4279）：打得越好敵人越硬 | △ 固定倍率 `1+stageIdx*0.16` | 所有人同一套數值 |
| 錢和養成買不到分數 | ✗ 6 項局外天賦，每項 10 級（傷害 +8%/級、暴擊 +2.5%/級）；名將可用將魂提前招募 | ✗ 6 項永久升級；**`bounty` 直接乘在分數上**（L1419、L1844） | 排位只賣外觀 |
| 廣告不影響勝負 | ✗ 原地滿血復活加 3.8 s 無敵、免費重鑄、雙倍將魂 | ✗ 原地復活（滿血、清彈、+1 炸彈）、空投（Lv+2）、雙倍晶體 | 不提供 |
| 公平輸入 | △ 浮動搖桿，但移動依可變 dt | △ 相對位移，但依幀率 | [13](13_input-fairness.md) 時間戳輸入 |

> 結論：兩款都是「F2P 手遊型 survivor/shmup」，養成和廣告是核心循環，不能直接當 skill game 的規則參考；**表現層**（物件、音效、演出、UI）可以借。

---

## 8. 拿不到 / 未驗證
<!-- card: KB-reference-games.unverified; kind=gap -->

| 項目 | 狀況 |
|---|---|
| 混淆或壓縮 | **兩款都沒有**：原始碼完整公開，有中文註解；TK 是單檔 HTML，95 是 ES module，沒有 bundler |
| 9527 原版 Godot 程式 | 只有美術和音樂被解包沿用，原版 `.pck` 邏輯沒看 |
| 美術生成 prompt | TK 只知道是 PicAnywhere 生成（`DECISIONS.md`），prompt 原文沒有公開 |
| 刷幕實際畫面 | 實玩時無雙氣還沒集滿就陣亡，沒截到；描述來自程式碼 |
| 真機效能 | 只在內建瀏覽器模擬手機（約 30 fps，背景頁節流），沒有真機 fps 和記憶體數據 |
| 素材授權 | 95 的美術和音樂解包自同事的原版，TK 是 AI 生成；兩者都沒有標示授權，**只能參考做法，不能取用素材** |
| 文件和程式不一致 | 95：README 寫破殼有慢動作和閃光、HANDOFF 寫 BGM 用 `<audio>` 和 0.9 s 廣告模擬，程式碼都不是這樣；永久升級描述寫 15%，程式碼實際是 10%（L153）。95 另有存檔欄位不一致的 bug（L1485–1497 和 L575、L888 對不上）。TK：戰敗鈕寫「無敵 3.5 秒」，程式碼實際是 3.8 秒（L8596）。以上都以程式碼為準 |
| Lossy 壓縮後的包體 | §1 說「可降到 1/5～1/8」是推估，沒有實際轉檔驗證 |
