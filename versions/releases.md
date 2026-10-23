---
title: 更版紀錄
description: BMad Control Tower 近 10 版的更版紀錄（最新 v5.12.2），更早的版本見演進史。
---

<!-- 本頁由 scripts/sync-ct-release.mjs 從 CT CHANGELOG 產生，請勿手改；要改內容請改來源後重跑。 -->

# 更版紀錄

目前版本 **v5.12.2**（2026-10-22）。這裡列出最近 10 版的完整紀錄，最新的在最上面；更早的 47 版（v2.1.1 ～ v5.7.0）請看[演進史](./evolution)。

::: tip 摘要不具權威
本頁照錄 CT 的 CHANGELOG，只拿掉工單、決策、驗收回函等內部編號與出處註記。規則的權威定義在 CT 各 skill 與 references，兩者有出入時以 CT 本體為準。
:::

::: v-pre

## 5.12.2 <small>2026-10-22</small> {#v5-12-2}


> **PATCH：收單回收 exit `0` 的提示改成「約 N 秒後」（文件修正，行為不變）。** `work-order-system.md` § 收單後回收 Worker 分頁 exit `0` 列原本建議在確認區塊加一行
> 「Worker 分頁將於 N 秒後回收」；照 BAT 現行的回收行為，實際關閉可能比 N 秒晚（延遲到期時仍在輸出就等安靜），也可能被放棄，且塔台不會得知。
> exit `0` 的處理仍是「靜默」；其他 exit code 列、收單回收與重派前回收的條件／指令、`worker_close_delay` 的值域與預設不變；BAT 介面不變。

### Fixed

- `work-order-system.md` § 收單後回收 Worker 分頁 exit `0` 列：提示改成「Worker 分頁約 N 秒後回收」，並補一句——延遲到期時分頁仍在輸出，BAT 會等連續安靜 5 s、
  最多再等 60 s，屆時仍在輸出就放棄、保留分頁；helper 已 exit `0`，塔台不會得知，所以提示不得寫成確定的時間或「已關閉」。條件細節引用
  `tower-config.md` § 可用選項 `worker_close_delay`，不重複定義（權威見 BAT 文件）。
- 安裝指南新增 § 2.47。

### Unchanged

- `tower-config.md`、`auto-session.md`、`yolo-mode.md` 與 `work-order-system.md` 的其他列與段落不改；歷史段落（本檔舊版段、`version-governance.md` 版號表舊列、
  安裝指南 § 2.21／§ 2.46）不改。其他檔案沒有把回收寫成確定時間或確定完成的說明。

## 5.12.1 <small>2026-10-22</small> {#v5-12-1}


> **PATCH：`worker_close_delay` 的取消條件對齊 BAT 現行行為（文件修正，行為不變）。** 舊說明寫「延遲期間 Worker 分頁有新輸出或使用者輸入，BAT 會取消回收」，
> 與 BAT 現況不符：延遲期間的輸出**不**取消；只有排程後使用者在 Worker 分頁的輸入會取消（終端自動回應不算）；延遲到期後 BAT 等分頁連續安靜 5 s 才關、最多再等 60 s。
> `worker_close_delay` 值域與預設、`--delay-ms` 換算、收單回收與重派前回收的條件／指令／exit code 不變；BAT 介面不變。

### Fixed

- `tower-config.md` § 可用選項 `worker_close_delay` 列（CT 內唯一權威）：取消條件改照 BAT 權威（BAT 文件）——延遲期間輸出不取消、只有排程後的使用者輸入取消、終端自動回應不算輸入、到期後等連續安靜 5 s、
  最多再等 60 s，仍在輸出就放棄、分頁保留（helper 已 exit `0`，塔台不會得知）。
- 安裝指南 § 13 Config 速查表 `worker_close_delay` 列同步；新增 § 2.46。

### Unchanged

- 歷史段落（本檔 [5.1.0]、`version-governance.md` 版號表舊列、安裝指南 § 2.21）不改；`work-order-system.md` § 重派前回收舊 Worker 分頁 與安裝指南 § 2.45
  的「等安靜 5 s、最多 60 s、使用者輸入取消」原本就與 BAT 一致，不改。

## 5.12.0 <small>2026-10-22</small> {#v5-12-0}


> **MINOR：重派前回收舊 Worker 分頁。** 塔台對同一張工單再派 Worker 之前，先以 `--close-worker … --delay-ms 0`
> 回收舊 Worker 分頁，避免新 Worker `DONE` 後收單回收回 exit `5`（`AMBIGUOUS`）、兩個分頁都要手動關，以及 BAT 把兩個分頁都標 `✓`。
> 不論 exit code 都照常派工。`--skill ct-done` 補救派工不回收、`worker_auto_close: off` 仍回收（使用者決定）。
> BAT 介面不變，最低 BAT 版本不變（`--close-worker` 自 v5.1.0）；無新設定、無新工單欄位。派工命令、`--set-role`、斷點、提問通道（除「收到備援」加一句引用）、
> 隔離派工、合併流程、`worker_question_timeout`、收單回收的條件與指令不變。

### Added

- `work-order-system.md` § 回報處理流程 › 重派前回收舊 Worker 分頁（唯一權威）：適用條件（BAT 內派工、同一張工單再派 `ct-exec`、曾在 BAT 派過；不確定時照樣呼叫）；
  涵蓋 yolo 提問備援、`BLOCKED`／`FAILED` 後 Renew 重派、使用者停掉首派後重派、派工 exit `8` 後使用者決定重派；
  不適用 `--skill ct-done` 補救派工（保留現場）、研究單使用者在原分頁重讀工單、`Unknown option '--wait-started'` 去參數重派、首派；
  與 `worker_auto_close` 無關；指令 `--close-worker T#### --notify-id "$BAT_TERMINAL_ID" --delay-ms 0`（隔離工單加 `--worktree keep`）；
  exit `0`／`3` 繼續派工、`5` 一行提示手動關舊分頁、`4`／`1`／其他一行提示，全部照常派工；`1` 與收單回收共用同一個「不支援 `--close-worker`」session 旗標；
  為什麼安全（BAT 在呼叫當下鎖定唯一候選分頁、`--delay-ms 0` 仍等安靜 5 s、使用者輸入會取消）與為什麼要做。

### Changed

- `work-order-system.md` § 回報處理流程：`FAILED`、`BLOCKED` 列補「Renew 重派前先照新小節」；收單回收 exit `1` 列註明與新小節共用 session 旗標；§ 中斷復原「重派原工單」補引用。
- `yolo-mode.md` § Worker 向塔台提問 › 塔台端「收到備援的 `T#### 需要協助`」：派新 Worker 前一句引用（仍不對舊分頁送按鍵）；§ 迴歸測試場景 T9 預期補一句。
- `research-workorder.md` § Renew 機制 › 塔台操作流程：使用者在原分頁重讀工單時不回收；塔台改派新 Worker 時引用新小節。
- `auto-session.md`：命令表「回收 Worker 分頁」列補重派前用途；§ 範圍權杖與分頁角色 第 5 點的 exit code 表引用改為兩張表；
  § worktree 隔離派工「同工單重派沿用 worktree」補 `--worktree keep` 引用；§ Worker 啟動確認 第 4 點「要不要重派由使用者決定」後補引用。
  § 安全規則 `--close-worker` 列不改（`--delay-ms` 已允許 `0`–`300000`）。
- `tower-config.md` § 可用選項 `worker_auto_close` 列補「不影響重派前回收」。
- `merge-workorder.md` § 合併判準「Renew 合併工單重做」補引用。
- `control-tower/SKILL.md` § Status Handling 收單回收摘要之後補重派前回收摘要＋引用。

### Compatibility

- BAT 介面不變，CT 最低 BAT 版本不變；舊 BAT（不支援 `--close-worker`，exit `1`）只多一行提示，照常派工，之後同 session 不再嘗試。
- 塔台與 Worker 請同版安裝（Worker 端行為無變化）。

## 5.11.0 <small>2026-10-20</small> {#v5-11-0}


> **MINOR：Workflow 精簡版——閘門 G2 未通過後只做不花 workflow token 的部分。** 新設定 `workflow_integration`
> （`off`／`ask`／`on`，預設 `on`）；Worker 只有在工單明文授權時才呼叫 Workflow 工具、自發子代理要在回報區記錄（`ct-exec`）；
> 預篩腳本隨 `ct-insights` 發行、修 E4–E6，只做排除守門與按需提示（`*insights workflow`）；另修補幾項先前驗收記下的小問題。
> **不做**：具名 workflow 的派發與執行、`execution`／`workflow_run_id`／`workflow_stats` 等工單欄位（待卡片達 🟡 後再定）。
> BAT 無最低版本需求。派工命令、`--set-role`、斷點、提問通道、隔離派工、合併流程、`worker_auto_close` 與 `ct-exec` 其他執行流程不變。

### Added

- `tower-config.md` § 可用選項：`workflow_integration`（`off` / `ask` / `on`，預設 `on`；有效值與預設的唯一權威），持久化範例補一行。
- `workflow-engine.md` § `workflow_integration` 的行為：三個值對塔台寫 Workflow 授權與工具型 workflow 的影響；`off` 時規則分析、預篩腳本、
  `--workflow` brief 照常；Worker 不讀設定，塔台在工單裡決定；只管 Workflow 工具，不管 Worker 的一般子代理。
- `ct-exec/SKILL.md` § Workflow And Sub-Agents（唯一權威）：工單有「Workflow 使用授權」段落才可以呼叫 Workflow，只做列出的執行，
  重跑、加資料、超過 agent 上限先問塔台；token 超過事後上限 → 記錄、不重跑、下一次授權執行前先問塔台；每次執行記 `runId`／agent／tokens／耗時／`dropped`；
  沒有 Workflow 工具（Codex）不模擬。自發的唯讀子代理不需授權，但回報區 `### 子代理與 Workflow 使用` 要記數量、用途、唯讀與保證方式、約略 tokens（或估算方式）。
  § Phase 4 第 3 步與 Reference Routing 補引用。
- `work-order-template.md` § 撰寫 Workflow 使用授權：塔台的授權段落範本，`workflow_integration: off` 時不得寫、只派 Claude Code Worker。
- `ct-insights/scripts/ct-workflow-prefilter.py`（新檔，Python 3 標準函式庫）：既有的預篩腳本隨 skill 發行並修正——E5 X2 加來源
  ④ `intervention_type: decision-requiring`（frontmatter 頂層或 `interaction:` 底下、內文元資料鏡像行）與 ⑤「DP 裁定紀錄」；E6 S1 的 cue 也看 `title`；
  E4 X4(a) 補「逐一＋複製／雜湊／計數」；新增 `--ids` 逐張輸出守門結論與證據位置、摘要加排除守門統計。
- `ct-insights/references/analysis-rules.md` § 預篩腳本：排除守門與按需提示（唯一權威）：只用 X2、X3、X5 守門（X5 提示 Playbook）、X1／X4 只標需人工；
  按需提示只在塔台主動呼叫時列候選與證據位置、不自動標記或修改工單；塔台入口 `*insights workflow [T#### …]`；沒有 Python 3 時改人工判定。
- `workflow-engine.md` § 現況：G2 未通過（refuter 會確認錯誤發現、reader 實測 100–180k／組、成立的扇出多為 Worker 自發）與 § 尚未定案
  （具名 workflow 的派發與執行、frontmatter 欄位與 BAT 契約、預篩升級為自動建議）。
- `data-layer-architecture.md` § Layer 3 附屬：專案 workflow 腳本 補語法檢查做法（`export const meta` 改 `const`、包進 async function 再 `node --check`）。
- `ct-help/SKILL.md` § Claude Code Workflow：整合開關、授權、`*insights workflow`、G2 現況的摘要。

### Changed

- `workflow-engine.md`：前言改為 v5.11.0 精簡版說明並列出兩個例外權威；派工型的狀態、🟡 等級的「可做什麼」、§ 同意治理（落到工單授權，依 `workflow_integration` 決定問不問）、
  § Codex（有授權的工單只派 Claude Code Worker）改寫；R4 加註 Explore 型仍有 Bash／PowerShell，唯讀靠 prompt 明文禁止；成本基準補 reader 實測區間；
  § 本版不做 改為 § 尚未定案。
- `playbook-engine.md`：§ `*evolve` 擴展子命令 新增 `*evolve --workflow [name]` 轉交 `/ct-evolve --workflow`；§ 塔台自動建議 改為「待卡片達 🟡 後再定」並指向 `*insights workflow`。
- `ct-evolve.md` 長版說明新增 § `--workflow [name]`（權威仍在 `ct-evolve/SKILL.md`）。
- `control-tower/SKILL.md` § Built-In Commands 新增 `*evolve --workflow`、`*insights workflow` 兩列（摘要＋引用）；Reference Routing 的 `workflow-engine.md` 說明更新。
- `ct-insights/SKILL.md`：Scope 表、Analysis Flow 第 5 步、Reference Routing 補預篩腳本。`ct-evolve/SKILL.md` brief 的 R3 說明改為「through v5.11.0」。

### Compatibility

- 新設定預設 `on`；沒有新的工單 frontmatter 欄位。既有工單沒有授權段落，Worker 不會呼叫 Workflow——v5.10.0 也沒有這條路徑，行為相同。
- `*insights workflow` 需要 Python 3（標準函式庫即可）；沒有時改依規則人工判定。`ct-insights` 多一個 `scripts/` 目錄，安裝流程照舊整個目錄複製。
- BAT 面板顯示 `execution` 等欄位的功能延後到知識卡達 🟡。
- 塔台與 Worker 請同版安裝。

## 5.10.0 <small>2026-10-20</small> {#v5-10-0}


> **MINOR：Workflow 規則層——CT 開始定義 Claude Code Workflow 在工單裡的位置。** 新增 reference `workflow-engine.md`（Workflow 的唯一權威）、
> `ct-insights` 的「Workflow 適配度」規則組（S1–S6／X1–X5、WFC 候選格式）、`ct-evolve --workflow`（只產 brief 與 🔵 知識卡）與 `[WF-CANDIDATE]` 標記、
> 資料層「Layer 3 附屬：專案 workflow 腳本」。**只有規則層**：派發匹配、工單 frontmatter 欄位（`execution`、`workflow_run_id` 等）、
> `ct-exec` 的 workflow 執行路徑與 Codex 派工檢查在 v5.11.0。BAT 無最低版本需求。派工命令、`--set-role`、斷點、提問通道、隔離派工、合併流程、
> `worker_auto_close` 與 `ct-exec` 執行流程不變。

### Added

- `control-tower/references/workflow-engine.md`（唯一權威）：定位（Workflow 是 Worker 在單張工單內的執行方式，不是 CT 的編排層）；
  Skill／Playbook／Workflow 三分法與分界三提醒；工具型（分析作業用，例：語料挖掘）與派工型（工單用，例：多來源唯讀核對；派發待 v5.11.0）；
  設計規則 R1 回傳 schema 映射報告區段、R2 有界覆蓋一律 `log()` 略過項、R3 不用內建 `isolation: 'worktree'`、只做唯讀或分析形狀、
  R4 子 agent 只用唯讀 tool、R5 不用 `Date.now()`／`Math.random()`；知識卡格式（`_ct-workorders/_workflows/<name>.md`，全局卡在 Layer 2）；
  成熟度 🔵 brief → 🟡 回測（召回 ≥ 80%、誤報 ≤ 20%；無已知發現的研究型改 1 次實戰＋使用者認可）→ 🟢 → ⭐，
  每次回測或試跑前列規模經使用者同意；指標降級（只限 Workflow：連續 2 次推翻率 > 30%，或單位成本超過卡片上限 50% → 降一級；
  累積 ≥ 5 次執行後再評估是否推廣）；成本與規模（沒有 token 預算參數、只能限制 agent／子任務數並事後記帳；1.9 bytes/token、每個 agent 固定開銷約 31k、
  `resumeFromRunId` 可能沒命中快取；尊重 session 規模準則）；同意治理原則（⭐ 前一律先問使用者，機制在 v5.11.0）；Codex 不支援；知識卡寫入路徑檢查。
- `ct-insights/references/analysis-rules.md` 新增 § Workflow 適配度（唯一權威偵測規則）：判定流程（扇出軌 S1＋S6、驗證軌 S3）、
  S1–S6／X1–X5 表與偵測細節（X2 三個來源、X4 不以時間排除、「名稱含 batch ≠ 適合 workflow」、共用狀態是 S6 反條件）、
  輔助訊號「Worker 自發扇出」（不單獨成立）、分級（🔵／邊界／排除，不用 0–100 分數）、WFC 候選輸出格式與 Playbook／邊界清單。
- `ct-evolve/SKILL.md`：`--workflow [name]` 模式（只產 brief 並寫成 🔵 知識卡；不寫 `.claude/workflows/`、不寫腳本、不執行 Workflow；
  腳本由另一張工單在使用者確認 brief 後撰寫，比照 `--skill`）；§ Workflow Bridge `[WF-CANDIDATE]` 標記（比照 `[FG-CANDIDATE]`，條件引用規則組）；
  寫入邊界與 `--status` 同步。
- `data-layer-architecture.md` § 寫入規則 新增「Layer 3 附屬：專案 workflow 腳本」：`<project>/.claude/workflows/*.js` 不屬於 Layer 1、必須進 git、
  只由 Worker 依工單 `affects_files` 寫入、brief 先經使用者確認、不使用 `~/.claude/workflows/`、不自動同步到其他專案；架構總覽補 `workflows/`、`_workflows/`。

### Changed

- `doctrine.md` 前言：在「CT 不是 workflow 工具」之後補一段定位，指向 `workflow-engine.md`。
- `playbook-engine.md`：管線總覽補 Workflow 分支；§ 塔台自動建議 註明 Workflow 匹配在 v5.11.0；§ 寫入路徑安全檢查 註明知識卡改走 `workflow-engine.md` 的檢查。
- `self-learning-core.md`：§ 置信度系統 一句指向 Workflow 指標降級（本表規則不變）；§ 寫入路徑安全檢查 註明 `_workflows/` 不是不明路徑、專案腳本不是學習寫入。
- `control-tower/SKILL.md` Reference Routing、`ct-insights/SKILL.md` Analysis Flow 與 Reference Routing：補摘要與引用。

### Compatibility

- 沒有新的工單欄位、設定或命令參數；舊工單與 v5.9.0 行為相同。BAT 無最低版本需求（Workflow 是 Claude Code 原生能力）。
- `ct-evolve --workflow` 與 `[WF-CANDIDATE]` 只在 v5.10.0 以上的 `ct-evolve` 可用；塔台的 `*evolve` 子命令不變。
- 塔台與 Worker 請同版安裝。

## 5.9.0 <small>2026-10-18</small> {#v5-9-0}


> **MINOR：接 BAT 新介面——跨 session 傳訊時辨識塔台與 Worker。** 新增「跨 session 選收件人」規則；
> MCP `bat_whoami`／`bat_list_terminals`／`bat_get_state` 多 `claudeSessionName`／`claudeSessionId`，`bat_list_terminals` 的 `scope` 多 `towers`；
> 塔台面板多一行 session 名稱提示。BAT 介面以 BAT 的「介面契約總表」為準，需 BAT `>= 0.7.1-pre.1`；
> 舊 BAT（≤ `0.7.0-pre.9`）或非 BAT 維持 v5.8.1 的做法（回覆稿寫在自己 repo、請使用者轉交）。派工命令、`--set-role` 流程、斷點 D、提問通道、
> 隔離派工、合併流程與 `worker_question_timeout` 不變。

### Added

- `cross-project-coordination.md` 新增 § 跨 session 選收件人（唯一權威）：Claude Code 塔台用 ListAgents／SendMessage 通知另一個專案的塔台時，
  依序 ① ListAgents 有 `<目標工作區> · Tower` → 送它（同名多列附 `[ref]` 或改用 ②）；② 自己在 BAT 內且已宣告塔台 → MCP `bat_list_terminals scope=towers`，
  以 `workspaceName` 找目標塔台、取 `claudeSessionName` 對 ListAgents 名稱（`null`、`INVALID_ARGS`、`NOT_OWNER`、對不出 → 找不到）；③ 都找不到 →
  回覆稿寫在自己 repo、請使用者轉交。名稱含 ` · Worker · T####` 的 session 一律不是塔台；不得只靠目錄名、`<工作區> · <短 ID>` 或 idle／busy 推定。
  訊息首行仍請收件者確認身分；跨 session 訊息只是通知，`_handover-*.md`／`_reply-*.md` 仍是正式紀錄。§ 命名與落點慣例 加一句連過去。
- `auto-session.md` § BAT MCP 唯讀 tool：`claudeSessionName`／`claudeSessionId` 說明（`string | null`；鍵不存在 = 舊 BAT，不當 `null`；
  `claudeSessionId: null` 不代表沒有 session）與 `scope: towers` 說明（只給已宣告塔台、跨工作區、欄位白名單、仍 `NOT_OWNER`、舊 BAT `INVALID_ARGS`、
  BAT 重開後要重新宣告）；「目前沒有任何 CT 規則必須使用 MCP」一點補上這兩項也不是必要條件。
- `auto-session.md` § 依賴的 BAT 基礎設施：新增 BAT `>= 0.7.1-pre.1` 一列。
- `memory-protocol.md` § 塔台狀態面板：新增「塔台 session 名稱提示」（提示行，不是欄位）——BAT 內、`--set-role` 已處理、`bat_whoami` 有
  `claudeSessionName` 鍵且值不以 ` · Tower` 結尾 → 提示用 BAT「以塔台開啟 Claude」開塔台；鍵不存在、MCP 不可用、非 BAT → 不顯示、不報錯、不另查。

### Changed

- `auto-session.md` § BAT MCP 唯讀 tool 表：`bat_whoami`、`bat_list_terminals`、`bat_get_state` 三列補新欄位與 `towers`。
- `auto-session.md` § 對使用者描述分頁：補一句分頁標題不是 ListAgents 的 session 名稱，BAT 派出的 claude Worker 名稱為 `<工作區> · Worker · T####`（由 BAT 加）。
- `control-tower/SKILL.md`：Startup Protocol 第 6 步、BAT MCP 摘要句各補一句，新增跨 session 選收件人摘要句（只摘要、引用權威）。

### Compatibility

- BAT ≤ `0.7.0-pre.9` 或非 BAT：ListAgents 沒有這些名稱、MCP 沒有這兩個鍵、`scope: towers` 回 `INVALID_ARGS` → 選收件人走第 ③ 步、面板不顯示提示，
  與 v5.8.1 相同。
- Codex 塔台沒有 ListAgents／SendMessage，不適用本規則；codex 塔台之間的傳訊不在本版範圍。
- 規則只涉及塔台；Worker 行為不變。塔台與 Worker 請同版安裝。

## 5.8.1 <small>2026-10-18</small> {#v5-8-1}


> **PATCH：BAT `v0.7.0-pre.9` 已發佈——v5.8.0 的 BAT 版本占位字串換成 `>= 0.7.0-pre.9`；yolo 提問的「提問時間」取自系統、收尾自檢不改已送出的題目；
> 塔台答覆行由 Worker 的工單 commit 帶入，註明為預期行為。** 來自 BAT 實機驗收回函與 BAT `v0.7.0-pre.9` 發佈。
> BAT 介面不變。非 yolo 的 Worker／塔台行為、派工命令、斷點 D 判準、`--wait-started`、隔離派工、合併流程、提問通道流程與 `worker_question_timeout` 不變。

### Changed

- BAT 版本：v5.8.0 文中 codex OSC 7501 所需 BAT 版本的占位字串（`control-tower/SKILL.md`、`auto-session.md`、`yolo-mode.md`、`version-governance.md`、
  本檔 [5.8.0]、安裝指南）全部換成 BAT `>= 0.7.0-pre.9`（BAT README 版本對照：BAT `>= 0.7.0-pre.9`、CT `>= v5.8.0`、codex `>= 0.163.0`）。
- `yolo-mode.md` § Worker 向塔台提問 › § Worker 端 第 2 點：題目範本的「提問時間」寫明取值指令（bash `date "+%Y-%m-%dT%H:%M:%S%z"`、
  PowerShell `Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"`），範本下補一句：先執行指令再貼上輸出，不得推估或補整數秒。
  `ct-exec/SKILL.md` 提問前檢查與 `work-order-template.md` 提問範本只引用該處。
- `ct-exec/SKILL.md` § Phase 4 第 4 點自檢：(a) 不合格時不改已送出的題目（塔台可能已依原文答覆），只在 `### 遭遇問題` 記下哪一題、哪裡不合格；
  (b)(c) 照舊修正後繼續。自檢項目不變，仍只檢查「有沒有」。
- `yolo-mode.md` § 塔台端 第 3 點 **工單答覆**：註明塔台寫答覆行後不另 commit，Worker 之後以工單檔為單位 commit 時一併帶入屬預期行為，
  Worker 不改動答覆行、可在回報區註明；§ Worker 端 3-B 的等待例外處引用。不新增「塔台寫完答覆行就 commit」的規則。

### Compatibility

- BAT ≤ `0.7.0-pre.8` 或 codex 低於 `0.163.0`：行為與 v5.8.0 相同（`blockedDetection: none`、`agentStarted: null`、`started: unknown`）。
- 規則變更只涉及 yolo Worker 的題目寫法與收尾自檢；塔台與 Worker 請同版安裝。

## 5.8.0 <small>2026-10-18</small> {#v5-8-0}


> **MINOR：接 BAT 新介面——codex 分頁的 OSC 7501 信號。** 斷點 D 接受 `blockedDetection: osc`／`blockedReason: input`；
> codex `>= 0.163.0` 的 `--wait-started`／`agentStarted` 生效；`blockedDetection` 值域加 `osc`、`blockedReason` 加 `input`。
> BAT 介面以 BAT 的「介面契約」為準，需 BAT `>= 0.7.0-pre.9`；舊 BAT（≤ `0.7.0-pre.8`）或較舊 codex
> 維持 `blockedDetection: none`／`agentStarted: null`／`started: unknown`，行為同 v5.7.2。非 yolo 的 Worker／塔台行為、派工命令、隔離派工、合併流程、
> 提問通道（§ Worker 向塔台提問）與 `worker_question_timeout` 不變。

### Added

- `yolo-mode.md` § 斷點 D：判準新增 `blockedReason: input`（`source: 'osc'`，`blockedDetection: osc` 的 codex Worker）——與 hook 的三種 reason 合稱
  「等使用者的 reason」，處理相同（只以分頁標題告知、不代答、不送按鍵、不暫停其他流程、同一個 `blockedSince` 只告知一次）；啟用條件新增 `osc` 一列；
  `input` 的清除規則（codex 自己送轉換、PTY 結束、recovery；**使用者輸入不清除**，所以使用者處理後仍可能讀到同一次 `input`，不重複催促）；
  已知限制新增第 6 點（`input` 不分種類、啟動前畫面不送序列、OSC 7501 未公開、遠端未實測）。
- `yolo-mode.md` § BAT／Worker 版本相容：新增 codex OSC 7501 列（BAT 版本寫 `>= 0.7.0-pre.9`）；T10 新增情境 2（codex `input`、與 `tower` 的優先序、舊 BAT）。
- `auto-session.md` § BAT MCP 唯讀 tool：新增 `blockedDetection: osc` / `blockedReason: input` 說明（判準只引用 `yolo-mode.md` § 斷點 D）。
- `auto-session.md` § 依賴的 BAT 基礎設施：新增 codex OSC 7501 列。

### Changed

- `yolo-mode.md` § 斷點 D：優先序改為 `exited` > hook 的三種 reason／`input` > `tower` > `working` / `idle`；`blockedDetection: none` 改為也不會回 `input`；
  已知限制第 1 點「codex Worker 一律 `blockedDetection: none`」改寫為依 codex 與 BAT 版本：codex `>= 0.163.0` 且 BAT 支援 OSC 7501 → `osc`，
  更舊的 codex、BAT 確認不到版本、或舊 BAT → `none`（現行降級不變），`hook` 分頁不會變 `osc`；第 5 點補 codex replay 補掃。
- `auto-session.md` § BAT MCP 唯讀 tool：`bat_get_state` / `bat_wait` 的 `blockedDetection` 值域加 `osc`、`blockedReason` 加 `input`；`agentStarted` 說明加 `osc` 分頁
  （第一個 OSC 7501 → `true`，之前 `false`）。
- `auto-session.md` § Worker 啟動確認：codex `>= 0.163.0` 的 Worker 以第一個 OSC 7501 為啟動信號，與 claude 相同；`started: unknown` 列的「codex」改為
  「codex 低於 0.163.0 或版本確認不到」（BAT 對這些 codex 絕不回 `unconfirmed`）；exit `8` 處理不變，補 codex 最常見原因（「Trust this folder?」
  「Hooks need review」等啟動畫面）；說明 BAT 派 codex Worker 時自己加 `-c check_for_update_on_startup=false`，CT 派工命令不變；已知限制改寫。
- `control-tower/SKILL.md`：Worker 啟動確認與斷點 D 摘要句各補一句 codex（只摘要、引用權威）。

### Compatibility

- 本版發佈時 BAT 尚未發佈支援 OSC 7501 的版本，BAT 版本處原寫固定占位字串；BAT 發佈 `v0.7.0-pre.9` 後，v5.8.1 已一次換成 `>= 0.7.0-pre.9`。
- 舊 BAT（≤ `0.7.0-pre.8`）：codex 分頁維持 `blockedDetection: none`、`agentStarted: null`、`--wait-started` 回 `started: unknown`，CT 行為與 v5.7.2 相同。
- claude-cli Worker（`blockedDetection: hook`）的斷點 D 與啟動確認不變。

## 5.7.2 <small>2026-10-18</small> {#v5-7-2}


> **PATCH：晚退回的題也加 `通道` 標記，塔台不再依賴 BAT 已結束題目的保留期。** 來自上一版驗收記下的表外問題與 BAT 塔台回覆的保留規則。
> `--ask` 成功後才改走工單的題（`lost`、`cancelled`，含 Worker 自己取消），Worker 也加標記、commit、送一次一般 `提問`；
> 塔台判斷表的列表狀態拿掉 `lost`（BAT 列表不會出現），已知限制寫明 BAT 保留規則。BAT 介面不變，BAT 最低版本仍 `>= 0.7.0-pre.7`。
> 非 yolo 的 Worker／塔台行為、派工命令、`--wait-started`、隔離派工、合併流程、`--ask` 失敗流程、`expired` 備援與 `worker_question_timeout = 0` 不變。

### Changed

- `yolo-mode.md` § Worker 向塔台提問 › § Worker 端 3-A：新增第 6 步「晚退回的標記」——`--ask` 已成功的題因第 4 步 `lost`／`cancelled`、或第 5 步
  （`--cancel-question` 的 `status:` 為 `cancelled worker`／`cancelled <其他原因>`／`lost`，或取消本身失敗；含等待工具都不能用）改走 3-B 時，在 `#### Q-n`
  最後加 `- **通道**：工單` → commit 工單 → 送一次一般 `T#### 提問` → 剩餘時間照 3-B。同一時間多題退回只 commit 一次、只送一則。`--cancel-question` 回
  `answered`（照已答）或 `expired`（備援）不加標記。這是等待期間「只讀不寫」的唯一例外（只限標記行、一次 commit、一則通知）。推翻 v5.7.1 第 2 步
  「標記只在這一步加、之後退回不加標記也不另送通知」；第 3、4、5 步與 3-B 的「只讀不寫」說明同步引用第 6 步。
- 同節 § 塔台端 第 1 點：判斷表「列表有、`cancelled` / `lost`」改為「列表有、`cancelled`」，註明 `lost` 只出現在單題回傳（`--answer` exit `3`、
  `bat_wait_question`），不會出現在列表；「`--ask` 成功後又取消」的降級說明改寫為「晚退回的題 Worker 會加標記並送一般 `提問`，塔台不依賴保留期」，列表 `cancelled` 列與
  第 3 點 exit `9` `cancelled` 規則保留給「標記寫入前就處理到原本那則通知」；寫明塔台依 `cancelled` 寫了工單答覆行後再收到 Worker 的 `提問` →
  該題已答、不動作（同一題不會兩個通道都答）。
- 同節 § BAT 通道 › 已知限制：新增 BAT 已結束題目保留規則（10 分鐘從結束時間算、存取時才清；全 BAT 最多 64 筆；BAT 重開全清；`lost` 不在列表；
  出處 BAT 文件），並寫明 v5.7.2 起 CT 的正確性不依賴保留期；
  `--cancel-question` 也失敗那條補 v5.7.2 標記的效果。版本判定與降級表「Worker 等待」列與表下說明引用第 6 步；§ 備援「通知送不出去」含第 6 步的通知。
- `yolo-mode.md` § BAT／Worker 版本相容：新增 `ct-exec`（晚退回也加 `通道` 標記）v5.7.2 列；T9 迴歸場景的「等待中 `lost`／`cancelled`」對齊。
- `ct-exec/SKILL.md` § Questions For Tower：晚退回標記的摘要（取代「之後退回不加標記、不另送通知」）。
- `work-order-template.md` § 回報區 › 待塔台決策 範本：標記說明涵蓋晚退回（第 2、6 步）。

### Compatibility

- v5.7.1 以前的 `ct-exec` 不寫晚退回標記：搭配 v5.7.2 塔台時，塔台仍可依列表 `cancelled` 或 `--answer` exit `9` 改工單答覆；超過 BAT 保留期或 BAT 重開，
  就要等 Worker 逾時走備援、塔台在 Renew 區段答覆（不會答錯，只會慢）。CT 兩端同版安裝即不受影響。
- 沒有晚退回的情況（`--ask` 成功並等到 `answered`、`--ask` 失敗、`expired`）流程與 v5.7.1 相同。

## 5.7.1 <small>2026-10-18</small> {#v5-7-1}


> **PATCH：yolo 提問通道補洞六項。** 來自 CT v5.7.0 實機驗收（BAT 回函）的三項發現，以及先前驗收記下的三項表外問題。
> 一次問多題時，塔台依「BAT 列表狀態＋工單 `通道` 標記」逐題判斷，題目還在 `--ask` 路上就先不答、等下一則通知（使用者選「塔台等齊，只改 CT」）；
> Worker 先送完所有 `--ask`，退回的題加標記並 commit 後才送一則一般 `提問`。BAT 介面不變，BAT 最低版本仍 `>= 0.7.0-pre.7`。
> 非 yolo 的 Worker／塔台行為、派工命令、`--wait-started`、隔離派工與合併流程不變。

### Changed

- `yolo-mode.md` § Worker 向塔台提問 › § 塔台端 第 1 點：讀題改呼叫 `bat_list_questions(status: all)`，每一題未答的 Q-n 依表判斷——
  工單有 `- **通道**：工單` 標記 → 工單答覆；列表 `pending` → BAT 答覆；`answered` → 不動作；`cancelled`／`lost` → 工單答覆；`expired` → 等 `需要協助`；
  列表沒有又沒標記 → 這一則通知先不答。🔴 不得以「列表目前沒有 `pending` 題」推論 Worker 已送完（塔台剛答完一題時列表會暫時為空）。
  同一題只能有一個生效的答覆（`--answer` exit `0` 與工單答覆行不得都做）。只有「`--ask` 成功後又取消」時的降級寫成同表 `cancelled` 列與
  第 3 點 exit `9` 規則的說明，不另立規則；一直沒有後續通知時最壞是 Worker 逾時走備援、塔台在 Renew 區段答覆。
- 同節 § Worker 端 3-A 第 1、2 步：多題先送完所有 `--ask` 才開始等待（從第一題成功起 120 s 內）；`--ask` 失敗的題在 `#### Q-n` 最後加
  `- **通道**：工單`，有任何一題退回 → commit 工單 → 最後送一次一般 `T#### 提問`；沒有退回 → 不加標記、不送一般通知。之後才改 3-B 的題
  （`lost`、`cancelled`）不加標記、不另送通知。
- 同節 § Worker 端 3-B：`awk` 區段比對略過 `` ``` `` 圍起來的 fenced code block（區塊內的標題行與答覆行都不算；保留 `Q-10` 前綴防誤命中與 `[*]` 寫法）；
  註明 `通道` 標記不是答覆行。
- 同節 § BAT 通道：版本判定與降級表「Worker 提問」「塔台讀取」兩列對齊上述的逐題判斷（列表能用但找不到該題 → 照 § 塔台端 第 1 點的表）；已知限制
  （`--ask` 本身逾時）補「v5.7.1 起標記優先，只剩塔台在標記寫入前已以 BAT 答覆時才會發生」。
- `yolo-mode.md` § BAT／Worker 版本相容：新增 `ct-exec`（多題等齊，`通道` 標記）v5.7.1 列；T9 迴歸場景的降級與多題情境對齊。
- `ct-exec/SKILL.md` § Questions For Tower：多題提問順序與標記的摘要；答覆行比對註明略過 fenced code block；送 `提問` 前檢查補「`#### Q-n：` 標題帶問題、
  後接提問時間」。§ Phase 4 第 4 步後新增 notify 前自檢三項（Q-n 標題與提問時間、無範本佔位文字、`### 互動紀錄` 只有一段；只檢查、不改格式）。
- `control-tower/SKILL.md` YOLO questions 摘要：塔台逐題判斷與「列表沒有又沒標記先不答」。
- `tower-config.md` `worker_question_timeout` 列：走 BAT 通道時同一個值也是 `--ask --expires-min` 的值（引用 `yolo-mode.md`）。
- `work-order-template.md` § 回報區 › 待塔台決策 範本：補 `通道` 標記說明。

### Compatibility

- v5.7.0 以前的 `ct-exec` 不加 `通道` 標記：搭配 v5.7.1 塔台時，改走工單的題要等 Worker 逾時走備援、塔台在 Renew 區段答覆。CT 兩端同版安裝即不受影響。
- 單題提問：`--ask` 成功時流程與 v5.7.0 相同；`--ask` 失敗時多一行 `通道` 標記與一次 commit，塔台照標記走工單答覆（結果同 v5.7.0）。

:::

## 延伸閱讀 {#further-reading}

- CT `CHANGELOG.md`（共 57 個版本；本頁列最近 10 版）
- CT `version-governance.md` § 歷史版號表
- [演進史](./evolution)：更早的 47 版與八個世代

Portal 是摘要，不具權威；與 CT reference 有出入時，以 reference 為準。
