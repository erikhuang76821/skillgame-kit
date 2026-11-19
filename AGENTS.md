# SKILLGAME — 給 Codex / Gemini 等 agent 的入口

內容與 [`CLAUDE.md`](CLAUDE.md) 相同的規範，請先讀它。重點：

1. **規則唯一來源**：[`knowledge-base/index/rules.json`](knowledge-base/index/rules.json)。門檻數字只寫在這裡；把關程式經 [`shared/tools/rules.mjs`](shared/tools/rules.mjs) 取值；遊戲例外寫在 `<Game>/config/rules.overrides.json`（必附理由）。
2. **技術規範**：`.claude/skills/lite-skillgame-stack/SKILL.md` 與 `references/`（隱藏資料夾，搜尋時記得加 `--hidden` 或直接開檔）。
3. **知識庫**：[`knowledge-base/README.md`](knowledge-base/README.md)；架構決策在 [`knowledge-base/decisions/`](knowledge-base/decisions/)。
4. **協作**：多個 agent 同時工作時，改動前先開自己的分支或 worktree，不直接改 `main`。
