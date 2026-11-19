# TwinStrike（暫定代號）

左右切換打怪的 HTML5 單機 Skill Game（OFDP / Timberman 系）。同種子非同步對戰、確定性 sim、重播驗分。

| 文件 | 內容 |
|---|---|
| [gdd/01_theme_proposals.md](gdd/01_theme_proposals.md) | 題材方案：**已選 A 喵拳道場** |
| [gdd/03_skill_integrity.md](gdd/03_skill_integrity.md) | 技巧完整性：精髓七條落實、去隨機化、證據與缺口 |
| [gdd/05_game_spec.md](gdd/05_game_spec.md) | 玩法規格（sim v6；關鍵數值寫成 `NAME` = 值，`npm run audit` 與 sim 對帳） |
| [gdd/10_tech_constraints.md](gdd/10_tech_constraints.md) | 技術限制：選型、分層、確定性、輸入與驗分、預算 |
| [gdd/11_risks_open.md](gdd/11_risks_open.md) | 風險與未解問題 |
| [gdd/02_art_spec.md](gdd/02_art_spec.md) | 美術規格（Q 版貼紙風、色票、禁忌、資產清單、預算）；prompt 在 art/prompts/（`TwinStrike/art/prompts`，未收錄）；資產登錄 art/manifest.json（`TwinStrike/art/manifest.json`，未收錄）（17 筆，進中央索引） |
| [gdd/07_difficulty_curve.md](gdd/07_difficulty_curve.md) | 腳本化難度曲線（樂句庫、12 段腳本、人性化試玩）；報告 [docs/difficulty_curve.md](docs/difficulty_curve.md) |
| [gdd/06_combo_feel.md](gdd/06_combo_feel.md) | 連擊節奏感：5 個連擊階段的場景動效、文字動態、對拍分層 BGM |
| [docs/persona_playtest.md](docs/persona_playtest.md) | **角色扮演模擬試玩**（6 位虛擬玩家 × 3 局，標示為模擬）與 6 個設計問題；`node tools/persona-playtest.mjs --out ../playtest-data/simulated` |
| [docs/human_playtest_plan.md](docs/human_playtest_plan.md) | **真人試玩計畫**（路線 A 第 1 階段）：假設與通過標準、招募、流程、問卷、`npm run human-report` 分析 |
| [docs/launch_checklist.md](docs/launch_checklist.md) | **上線前清單**：路線選擇、真人驗證、後端、封裝、法規、營運與建議順序 |
| docs/playtest_report.html（`TwinStrike/docs/playtest_report.html`，未收錄） | **全面自動化試玩**（難度、節奏、旋律、曲線線性、心流帶；`npm run playtest`） |
| [docs/skill_dominance_report.md](docs/skill_dominance_report.md) | 技巧主導實測報告（自動產生） |

技術規範：repo skill `lite-skillgame-stack`。`game/` 從範本複製而來：

| 部分 | 狀態 |
|---|---|
| `game/src/sim/sim.js` | 照規格完成（譜面、判定、硬直、扣血、回血） |
| `game/tools/bots.mjs` | 三級 bot 完成 |
| `game/test/determinism.test.mjs` | 18 項規格測試；`npm test` 共 51 項全過（sim v6：Critical Perfect） |
| `game/src/main.js`、`render/`、HUD | 可玩：佔位美術（Canvas 程式繪製 atlas，0 bytes）、標題 / 結算畫面、觸控左右半邊 + 鍵盤、重播驗證；基礎 DC 1、包體 1.0 MB（8 MB 的 12%） |
| 正式美術 | 貓師父、老鼠、飛鼠、狸貓（`art/tools/pack_atlas.py` + `art/atlas.json`）、道場背景（`art/tools/bake_bg.py`）已進遊戲；特效貼紙、主視覺（標題畫面）都已進遊戲；**美術全部完成** |
| 落拍打擊感 | keysound（音高跟 BGM 和弦）＋按下即預判、拍點吸附（`audio/keysound.js`、`main.js` `predictHit`） |
| 連擊節奏感 | 完成（`fx/comboFeel.js`、`audio/bgm.js`、`view.js` 脈動 / 速度線 / 暖光）；BGM 為程序化合成，尚未實際聽感調校 |
| 連線（路線 A） | `game/src/net/api.js`：每日題目、自動訪客帳號、上傳驗分、排行榜、離線排隊；後端雛形在 `server/`（`npm start`，預設 http://localhost:8787；遊戲可用 `?api=` 指定） |
| 延遲校正畫面 | 完成（`ui/calibration.js`：聽拍 + 看閃光各 8 下 → 觸控 offset 與音訊延遲，存在裝置上） |

```
cd game
npm run dev            # 或 .claude/launch.json 的 twin-strike（port 5174）；?seed=1234、開發模式 ?bot=expert 自動打
npm test
node tools/skill-dominance.mjs 30 --out ../docs/skill_dominance_report.md
node tools/difficulty-curve.mjs 30 --out ../docs/difficulty_curve.md   # 人性化試玩，有斷崖時 exit 1
npm run playtest       # 全面試玩報告 docs/playtest_report.md / .html，任一檢查失敗 exit 1
```
