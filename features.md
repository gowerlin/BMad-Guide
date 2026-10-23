---
title: 功能與指令總覽
description: CT 的 8 個 skill 分別做什麼、三軌前綴、15 個塔台 * 內建命令、skill 指令、四級能力與設定，以及每項功能對應的進階篇。
---

<script setup>
const skillRows = [
  ['control-tower', '/control-tower　$control-tower', '塔台', '塔台 session', '對齊需求、開單、派工、收單、記錄決策與學習；不寫程式碼'],
  ['ct-exec', '/ct-exec T####　$ct-exec T####', 'Worker', 'Worker session', '執行一張工單的完整生命週期：落點檢查 → 開工 → 執行 → 驗證 → 反序收尾 → 通知塔台'],
  ['ct-done', '/ct-done T#### [狀態]　$ct-done …', 'Worker（補救）', 'Worker session', 'session 中斷、漏了收尾或要更正狀態時，補完回報與收尾'],
  ['ct-status', '/ct-status [T####|all|sync|active]', '輔助（唯讀）', '任何 session', '查單張或全部工單狀態、frontmatter 與 body 的不一致'],
  ['ct-evolve', '/ct-evolve [--playbook|--skill|--workflow|--status]', '輔助', '任何 session', '從執行紀錄萃取可複用的經驗，晉升成 Playbook 或 skill／Workflow 的 brief'],
  ['ct-insights', '/ct-insights [global]', '輔助', '任何 session', '分析工單歷史與使用模式：好模式、壞模式、原則衝突'],
  ['ct-fieldguide', '/ct-fieldguide <子命令>', 'Worker', 'Worker session', '產生、更新、稽核專案的 FIELDGUIDE 與 DESIGN.md'],
  ['ct-help', '/ct-help [問題]', '輔助', '任何 session', '操作手冊：指令、設定、前綴、BAT 與 yolo 的簡短說明；不建立也不修改工單']
]
const prefixRows = [
  ['*', '塔台內建命令', '只在進行中的塔台 session 裡', '不切換，繼續塔台流程', '*evolve'],
  ['/', 'Claude Code 載入一個獨立 skill', '任何 Claude Code session', '載入該 skill 的角色', '/ct-evolve'],
  ['$', 'Codex 載入一個獨立 skill', '任何 Codex session', '同 /', '$ct-evolve']
]
const towerRows = [
  ['*rescan', '重新做完整掃描，刷新塔台狀態檔的環境快照', '—'],
  ['*config', '檢視或修改塔台設定', '[選項] [值] [--save project|global]、reset'],
  ['*help', '不離開塔台查使用說明', '[主題]：commands、workflow、config、workorder、status、tips'],
  ['*sync', '以工單檔為事實來源，校準塔台記憶、工單與 sprint-status.yaml', '—'],
  ['*pause', '凍結進行中的工單，處理緊急任務', '[原因]'],
  ['*resume', '恢復被暫停的工單', '[工單編號]'],
  ['*bug', '登記 BUG 單（需先啟用）', '[標題]'],
  ['*plan', '登記 PLAN 單（需先啟用）', '[標題]'],
  ['*exp', '登記 EXP 實驗單（需先啟用）', '[描述]'],
  ['*archive', '把最終態的單據移到冷區', '--dry-run、T####、--search <關鍵字>、--restore T####'],
  ['*evolve', '在塔台裡萃取學習', '[主題]、--playbook [名稱]、--skill [名稱]、--status、--workflow [名稱]'],
  ['*insights', '在塔台裡做使用模式分析', 'workflow [T#### …]'],
  ['*fieldguide', 'FIELDGUIDE 與 DESIGN.md 管理（只讀與分析，寫入一律開工單）', 'scan [N]、add [主題]、audit [模組]、init、debt [主題]、design [generate|check]'],
  ['*import', '安全匯入規則、Playbook 或其他專案的設定', 'rule、playbook、--from <檔案>、--check、--fix'],
  ['*onboard', '互動式探索你的工作習慣，產出個人化的本地規則', '—']
]
const configRows = [
  ['auto-session', 'on／ask／off／yolo', 'ask', '派工後要不要自動開 Worker、Worker 做完要不要自動回報'],
  ['experience-level', 'beginner／standard／expert', 'standard', '提示的詳細程度；beginner 啟用塔台內建的新手村教學'],
  ['alignment-rounds', '0–5', '3', '開單前最少問幾輪；0 = 不強制提問'],
  ['enable_bug_tracking 等三項', 'true／false', 'false', '啟用 BUG、PLAN、EXP 單據'],
  ['worker_commit', 'required／recommended／off', 'required', 'Worker 收尾時的 commit 政策'],
  ['worker_question_timeout', '0–120（分鐘）', '30', 'yolo Worker 問塔台後最多等多久；0 = 不等'],
  ['worker_auto_close', 'off／done', 'off', '收單後是否請 BAT 回收 Worker 分頁'],
  ['workflow_integration', 'off／ask／on', 'on', 'Claude Code Workflow 的整合強度']
]
const mapRows = [
  ['工單：編號、粒度、模板欄位、重疊檢查', '工單系統'],
  ['派工：四種模式、終端偵測、BAT、降級鏈', '派工：auto-session 與 BAT'],
  ['yolo 與斷點 A–E', 'yolo 與斷點 A–E'],
  ['Worker 在 yolo 下改問塔台', 'Worker 向塔台提問'],
  ['worktree 隔離與合併工單', 'worktree 隔離與三種合併模式'],
  ['Worker 寫入前確認 repo 身分', '落點檢查'],
  ['*pause／*resume、Renew、ct-done', '中斷、Renew 與補救收尾'],
  ['*bug、*plan、*exp、研究型工單', 'BUG／PLAN／EXP 與研究型工單'],
  ['*evolve、ct-evolve、Playbook、Workflow', '自我學習、Playbook 與 Workflow'],
  ['project-prefix、跨專案與多塔台', '跨塔台與跨專案協作'],
  ['ct-status、ct-insights、ct-fieldguide、*fieldguide', '觀測與改進']
]
</script>

# 功能與指令總覽

CT 由 1 個塔台 skill 和 7 個 Worker／輔助 skill 組成。塔台在自己的 session 裡還有 15 個 `*` 內建命令。這一頁是地圖；每個指令的語法與參數見[指令參考大全](/reference/commands)。 {.ct-lead}

## 8 個 skill {#skills}

每個 skill 都有兩個入口：Claude Code 用 `/`，Codex 用 `$`，差別只在宿主工具，行為相同。

<CardTable caption="8 個 skill" :columns="['Skill', '指令', '角色', '在哪用', '做什麼']" :rows="skillRows" :highlight="[0]" />

**為什麼拆成 8 個？** 塔台 skill 帶著「不准寫程式碼」這類嚴格的硬邊界，但 Worker 必須直接讀寫程式碼。拆成獨立的 skill，Worker session 就不會載入塔台的角色限制。塔台啟動時會檢查其他 skill 有沒有裝，缺了會警告。

- **塔台用的**：`control-tower`。在 BAT 裡要從你自己開的一般分頁啟動，不能在被派出來的 Worker 分頁裡。
- **Worker 用的**：`ct-exec`（主力）、`ct-done`（補救收尾）、`ct-fieldguide`（FIELDGUIDE 與 DESIGN.md）。
- **任何 session 都能用的**：`ct-status`、`ct-evolve`、`ct-insights`、`ct-help`。

另外有一個獨立發行、與 CT 同版號的 [CT Guide Skill](/guide/)（`control-tower-guide`），它是教科書，不是 CT 的 8 個 skill 之一。

## 三軌前綴：`*`、`/`、`$` {#prefixes}

<CardTable caption="三軌前綴" :columns="['前綴', '是什麼', '在哪用', '角色切換', '範例']" :rows="prefixRows" />

`*evolve` 和 `/ct-evolve` 的差別不在「精簡版與完整版」，而在**在哪個角色裡執行**：`*` 命令在塔台角色裡就地處理，處理完繼續塔台的工作；獨立 skill 在自己的 session 以自己的角色執行。BAT 派工時由 BAT 依 Worker 用的 Agent 決定送 `/ct-exec` 還是 `$ct-exec`，塔台不寫死。

## 塔台的 15 個內建命令 {#tower-commands}

這些命令只在進行中的塔台 session 裡有意義。

<CardTable caption="塔台內建命令" :columns="['命令', '做什麼', '常用參數與子命令']" :rows="towerRows" />

::: warning 沒有這些命令
- **沒有 `*dispatch`**。派工是開單之後的一個步驟：塔台依 `auto-session` 設定自動派，或給你指令讓你自己開。
- **`*help roles` 已在 v5.0.3 刪除**（職責速查卡）。`*help` 的主題見上表。
:::

旗標的確切拼法與每個子命令的行為，見[指令參考大全 › 塔台內建命令](/reference/commands#tower)。

## skill 指令 {#skill-commands}

| 指令 | 什麼時候用 |
|---|---|
| `/control-tower [一句話需求]` | 開始或恢復塔台。可以直接帶需求，例如 `/control-tower 接手這個專案，前手只留了 README` |
| `/ct-exec T####` | 在新的 session 執行一張工單；中斷後也用它接著做 |
| `/ct-done T#### [DONE\|FIXED\|PARTIAL\|BLOCKED\|FAILED]` | 工作做完了但沒收好尾，或要更正狀態 |
| `/ct-status`、`/ct-status T####`、`/ct-status sync`、`/ct-status active` | 查狀態；`sync` 比對工單與 `sprint-status.yaml` |
| `/ct-evolve`、`--playbook`、`--skill`、`--workflow`、`--status` | 萃取經驗、看知識成熟度 |
| `/ct-insights`、`/ct-insights global` | 本專案或跨專案的使用模式分析 |
| `/ct-fieldguide init\|update\|audit\|extract\|merge\|promote\|design` | FIELDGUIDE 與 DESIGN.md |
| `/ct-help [問題]` | 不知道該輸入什麼時 |

以上 Codex 都把 `/` 換成 `$`。完整參數見[指令參考大全 › skill 指令](/reference/commands#skills)。

## 四級能力 {#levels}

CT 的功能隨可選元件遞增。每項偵測各自獨立，可以任意組合（例如只有第 0 級加 bmad-guide 也完全合法）；缺了任何一個都安靜降級，不會報錯。

<CapabilityLevels />

- **第 0 級已經完全可用**。工單、進度、Debug、中斷處理、多塔台與自我學習都只靠檔案。
- **bmad-guide 是外部依賴**。CT 不內嵌 BMad-Method 內容；沒有它時，工作流程欄位改由你手動指定。
- **mem0 目前只單向寫出**。經驗會同步出去，塔台不會反過來查詢它。

## 設定 {#config}

塔台的行為用 `*config` 調整：

```text
*config                                      列出所有設定與來源
*config auto-session yolo                    只改這個 session
*config auto-session yolo --save project     寫進 _ct-workorders/_tower-config.yaml
*config auto-session yolo --save global      寫進全域設定
*config reset [選項]                          重設（只影響 session）
```

設定分四層，上面的蓋過下面的：**session（`*config` 即時修改）> 專案（`_ct-workorders/_tower-config.yaml`）> 全域（`~/.claude/control-tower-data/config.yaml`）> 預設值**。

常用的幾項：

<CardTable caption="常用設定" :columns="['選項', '值', '預設', '影響什麼']" :rows="configRows" :highlight="[0]" />

全部 23 個選項與值域見[指令參考大全 › `*config`](/reference/commands#config)。

::: tip Worker 不讀設定檔決定模式
設定屬於塔台。塔台派工時把模式透過環境變數 `CT_MODE`、`CT_INTERACTIVE` 傳給 Worker；Worker 只從設定讀重試上限、commit 政策這類調諧參數（`worker_*` 與 `experience-level`），不用設定檔決定要不要自動回報。這樣同一張工單、同一組參數，在哪個 session 執行都會得到相同的行為。
:::

## 每項功能在進階區的哪一篇 {#deep-map}

<CardTable caption="功能與進階篇對照" :columns="['功能', '進階篇']" :rows="mapRows" />

進階篇的入口在[進階：功能深入](/deep/#features)；為什麼這樣設計，見[設計理念](/deep/#principles)。

## 延伸閱讀 {#further}

- `control-tower/SKILL.md` § Built-In Commands、§ Hard Boundaries
- `ct-help/SKILL.md` § Command Families
- CT 安裝與使用指南 § 4.3 Skill 架構（v5.12.2）、§ 5. 四級能力等級、§ 13. Config 速查表（v5.12.2）、§ 14. 命令速查表（v5.12.2）
- CT Guide `references/ecosystem.md` § 八個 Skill 元件、§ 三軌前綴：`*`、`/`、`$`、§ 能力等級（Level 0-3）
- `control-tower/references/tower-config.md` § `*config` 命令、§ 可用選項、§ 作用域與持久化

Portal 是摘要，不具權威；與 reference 有出入時，以 reference 為準。
