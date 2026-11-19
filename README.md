# skillgame-kit

做**輕量化 HTML5 單機 Skill Game**（技巧主導、同種子可重播驗分、包體 ≤ 10 MB、Draw Call 個位數）所需的知識庫、規則、AI agent skill、程式範本與把關工具。

這是從原作品集抽出的精簡版：**只收「做下一款遊戲需要的知識」，不收遊戲成品**。四款範例遊戲只留文字規格（README、`game.profile.json`、gdd、報告），遊戲程式與美術原檔沒有收錄；文件裡指向它們的連結已改成「（未收錄）」註記。

## 內容

| 路徑 | 是什麼 |
|---|---|
| [`knowledge-base/`](knowledge-base/README.md) | 知識庫：skill game 判定與公平性、市場與法規、玩法規則卡、技術棧、手感與音效、美術管線、難度曲線、廣告玩法改造、設計原則；每頁切成知識卡供 agent 依階段取用 |
| [`knowledge-base/index/rules.json`](knowledge-base/index/rules.json) | **規則唯一來源**：每條門檻有 ID、值、量測方法、把關程式 |
| [`.claude/skills/lite-skillgame-stack/`](.claude/skills/lite-skillgame-stack/SKILL.md) | Claude Code skill：技術規範（PixiJS 8 / GSAP 3 / Spine / Web Audio）＋ `templates/` 起手範本（確定性 sim 核心、bot、技巧證據、自動試玩、手感 `FEEL`、程式合成音效、節奏 / 撞球範例） |
| [`shared/`](shared/) | 把關與迴圈工具：規則解析、知識卡索引、依節點取脈絡（`context.mjs`）、迴圈驅動（`loop.mjs`）、交付稽核（`game-audit.mjs`）、pre-commit |
| `SwarmDuel/knowledge/` | 市場研究原始資料：規則卡、題材、研究筆記、排除卡（機率型 / 博弈類為何排除） |
| `SwarmDuel/` `TwinStrike/` `LanternHold/` `GateLane/` | 範例遊戲的文字規格（僅供參考寫法） |

## 怎麼用

1. 先讀 [`CLAUDE.md`](CLAUDE.md)（agent 規範）與 [`knowledge-base/README.md`](knowledge-base/README.md)。
2. 開新遊戲：照 [`bootstrap.md` §0](.claude/skills/lite-skillgame-stack/references/bootstrap.md) 依節點讀知識卡，複製 `templates/` 到 `<NewGame>/game`，用 `node shared/tools/loop.mjs next <NewGame>` 一關一關做。
3. 工具自檢（Node 20+，無外部依賴）：

```bash
node shared/tools/index-build.mjs --check
```

```bash
node --test shared/tools/*.test.mjs
```

需要完整遊戲程式的 6 個整合測試在本精簡版會顯示為略過（skipped）。

## 注意

- 市場與法規頁是調查整理，**不是法律意見**；上線前請法務確認。標「（未證實）」的數值未經查證。
- [`knowledge-base/17_design-principles.md`](knowledge-base/17_design-principles.md) 是對 [kociden/sakurai-skill](https://github.com/kociden/sakurai-skill)（非官方，整理自「桜井政博のゲーム作るには」）的改寫摘要，與桜井政博氏及有限会社ソラ無關。
- 文中提到的商業遊戲名稱僅作研究引用，權利屬各自所有者。
