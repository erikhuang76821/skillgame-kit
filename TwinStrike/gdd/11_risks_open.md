# 11 Risks & Open Questions — 喵拳道場

- **目的**：集中列出未解的風險與問題；刻意保留，不假裝已解
- **相關**：全部；上線順序見 [docs/launch_checklist.md](../docs/launch_checklist.md)
- **依據**：[knowledge-base/02 市場與法規](../../knowledge-base/02_market-and-legal.md)、[09 知識缺口](../../knowledge-base/09_knowledge-gaps.md)、[16 難度曲線](../../knowledge-base/16_difficulty-curve.md)、[06 美術管線](../../knowledge-base/06_art-pipeline.md)
- **狀態**：Draft（2026-10-22，持續更新）

## 風險表

| # | 風險 | 影響 | 可能性 | 緩解 / 現況 | 負責 |
|---|---|---|---|---|---|
| R1 | 法規：路線 A 為 F2P 排行、無現金獎；若日後改付費參賽（路線 B）要各州 / 地區法律意見 | 無法上線或需地理圍欄 | 低（A）/ 高（B） | 維持路線 A；B 前先取得法律意見書（launch_checklist 4.7） | 法務 |
| R2 | **證據只有 bot**：技巧佔比 97.5%、難度曲線 D1–D8 都是模擬 | 真人手感與曲線可能不同；論述被質疑 | 高 | 真人試玩 ≥ 20 人（[human_playtest_plan](../docs/human_playtest_plan.md)），用真人命中率校正 `humanBots.mjs` 後重跑 | 企劃 |
| R3 | 同種子被背譜：每日題目可無限重打 | 排行變記憶比賽 | 中 | 每日題目當日才由伺服器發放（`GET /daily`）；錦標賽考慮只計第一局（03 Open Q2） | 企劃 |
| R4 | 跨引擎確定性未驗：golden 只在 Node 跑 | 正常玩家被判驗分失敗 | 中 | 子 tick 整數判定、無超越函數（10）；待在 Safari / Chrome / Firefox 跑 golden 並納入 CI（launch_checklist 1.4、3.3） | 程式 |
| R5 | 藍牙耳機與觸控延遲：未校正的玩家系統性偏晚 | 分數不公平、挫折 | 中 | 延遲校正畫面（±150 ms）；結算偵測中位數偏差 ≥ 35 ms 時建議校正（v6）；真實延遲分布待收集（launch_checklist 1.2） | 程式 / UX |
| R6 | 狂按型玩家不懂自己為何輸（模擬：P4 小胖 27 秒倒下） | 新手流失 | 中 | v6 已加第一次空揮提示、暈眩提示、結算建議；效果要真人確認（persona_playtest §5） | 企劃 |
| R7 | 反應慢的玩家卡在同一道牆（模擬：P2 約 55 秒倒下、三局沒進步） | 中高齡玩家流失 | 中 | 維持現行曲線（新手中位數 58 秒倒下已接受）；候選：練習模式（同題目、無扣血、可選段落） | 企劃 |
| R8 | 頭目是容易緊張玩家的固定挫折點（模擬：P6 0/4） | 體驗落差 | 中 | 每場頭目最多扣 1 血；候選：第一場頭目前加預告停頓、擊破演出加強 | 企劃 |
| R9 | AI 生成美術的權利與平台政策 | 商用受限 | 中 | prompt 與原圖可追溯（`art/raw/LOG.md`、`art/prompts/_history`）；上線前法務確認（[06](../../knowledge-base/06_art-pipeline.md)、launch_checklist 4.3） | 美術 / 法務 |
| R10 | 名稱與商標：「喵拳道場」、代號 `twin-strike` | 上線後改名成本高 | 中 | 上線前商標檢索；正式 id 上線後不改（launch_checklist 4.4） | 營運 |
| R11 | 分級與隱私：台灣分級自評、個資法、未成年 | 無法上架 | 中 | 預估保護級（可愛角色打鬥、無傷亡）需確認；只收必要資料（launch_checklist 4.1、4.2） | 法務 |
| R12 | iOS Safari 音訊：靜音鍵、首次手勢解鎖、背景切換 | 沒有聲音 = 節奏遊戲失效 | 中 | 首次手勢 `unlock()`；機型測試待做（launch_checklist 1.3） | 程式 |
| R13 | 伺服器版本相容：換版後舊版上傳被拒 | 排行期內換版造成爭議 | 低 | 版本不符回 409、用戶端提示重新整理；舊版 sim 凍結到 `server/sims/v<N>/`（server/README（`TwinStrike/server/README.md`，未收錄）） | 程式 |

## Open Questions

1. 真人試玩何時招募、在哪裡辦（R2 是上線的第一個阻擋項）。
2. 練習模式是否要做、放在主選單還是結算後（R7）。
3. 賽季榜用達成率最佳 N 天平均，還是每日百分位平均（[backend_design](../docs/backend_design.md)）。
4. 外觀商店的第一批內容與上線時機（launch_checklist 5.1）。
