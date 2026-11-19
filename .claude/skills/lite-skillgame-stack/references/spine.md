# Spine 骨骼動畫（spine-pixi-v8 4.3）

## 版本

- Pixi 8 → `@esotericsoftware/spine-pixi-v8`；Pixi 7 才是 `@esotericsoftware/spine-pixi`。
- runtime 的 major.minor（例 4.3）必須等於編輯器匯出版本，否則讀檔失敗或行為怪異。
- 使用 Spine runtime 需持有 Spine 編輯器授權（Esoteric 授權條款）。

## 4.3 API 差異（寫程式前必看）

| 舊寫法（4.1/4.2 教學常見） | 4.3 |
|---|---|
| `skeleton.setSkinByName(n)` | `skeleton.setSkin(n)`（`setSkinByName` 已 private） |
| `skeleton.setSlotsToSetupPose()` | `skeleton.setupPoseSlots()` |
| `skeleton.setToSetupPose()` | `skeleton.setupPose()` |
| `state.getCurrent(i)` | `state.tracks[i]` |

不確定時：`grep` `node_modules/@esotericsoftware/spine-core/dist/{Skeleton,AnimationState}.d.ts`。

## 匯出規範（給美術）

- 二進位 `.skel`（比 JSON 小、解析快）+ `.atlas` + 頁面圖；atlas 頁尺寸 ≤ 2048，盡量 1 頁。
- 勾 Premultiplied alpha，檔名帶 `-pma`，runtime 自動辨識。
- 動畫命名：`idle`、`run` 給 Track 0；`atk_*`、`cast_*`、`hit` 給 Track 1+，**只 key 上半身骨骼**（不 key 腿與 root），否則會蓋掉 Track 0 的跑步。
- 換裝：每個部位一個 slot，各件裝備做成同 slot 下不同 attachment 或不同 skin；裝備 skin 只含自己的部位，方便組合。
- 加色光效 slot 會切 blend mode；集中在少數 slot、畫序放最上。

## 用法

```js
import { Assets } from 'pixi.js';
import { Spine, Skin } from '@esotericsoftware/spine-pixi-v8';

Assets.add({ alias: 'hero-data', src: './assets/hero.skel' });
Assets.add({ alias: 'hero-atlas', src: './assets/hero-pma.atlas' });
await Assets.load(['hero-data', 'hero-atlas']);

const hero = Spine.from({ skeleton: 'hero-data', atlas: 'hero-atlas', scale: 0.5 });
hero.state.data.defaultMix = 0.2;               // smooth cross-fade for every pair
hero.state.data.setMix('run', 'idle', 0.1);     // override specific pairs when 0.2 feels slow

hero.state.setAnimation(0, 'run', true);        // track 0: legs / base loop
hero.state.setAnimation(1, 'atk_slash', false); // track 1: upper-body one-shot
hero.state.addEmptyAnimation(1, 0.2, 0);        // then fade track 1 back out

// Outfit: combine part skins, never rebuild the Spine object.
const outfit = new Skin('outfit');
outfit.addSkin(hero.skeleton.data.findSkin('body/base'));
outfit.addSkin(hero.skeleton.data.findSkin('weapon/axe'));
hero.skeleton.setSkin(outfit);
hero.skeleton.setupPoseSlots();

// Single part swap.
hero.skeleton.setAttachment('weapon', 'sword');
```

封裝好的版本見 [templates/src/render/spineActor.js](../templates/src/render/spineActor.js)。

## 與確定性模擬的關係

- Spine 只在 render 層；動畫時間**不能**反過來決定判定（例如「攻擊動畫第 0.3 秒造成傷害」要寫在 sim 的 tick 表，再讓動畫對齊它）。
- Hit-stop：`spine.autoUpdate = false` 暫停幾幀後恢復，或 `state.timeScale` 補間；sim 不受影響。
- 同場大量同角色：Spine 每個實例都要 CPU 算骨骼；> 50 隻同時在場時，小兵改用 atlas 序列幀，Spine 留給主角與頭目。
