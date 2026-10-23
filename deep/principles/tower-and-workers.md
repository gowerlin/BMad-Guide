---
title: 塔台不讀程式碼：塔台／Worker 分工
description: 塔台為什麼不讀程式碼、塔台與 Worker 為什麼分開、Worker 為什麼無狀態，以及有問題時該問誰。
---

# 塔台不讀程式碼：塔台／Worker 分工

<p class="ct-lead">塔台不是不看程式碼，而是不親自看。它派一張工單讓 Worker 去讀、去改，Worker 把結論寫回工單，塔台只讀結論。這樣塔台的 context 才能一直留給全局判斷。</p>

## 問題出在哪

第一次用 CT 的人，很常遇到這一幕：

```text
你   → 塔台：幫我看一下 UserService 的邏輯，再決定怎麼改
塔台 → 你  ：我不能讀程式碼
你         ：？？？那你怎麼分配工作
```

這個疑問很合理。要做對決策，確實需要有人看過程式碼；問題是，那個人不該是塔台自己。正確的流程是：

```text
你   → 塔台：我要改 UserService 的某段邏輯，但不確定影響範圍
塔台       ：產生一張分析工單，請 Worker 執行
Worker     ：讀程式碼、分析，把影響範圍和建議方案寫進回報區
塔台       ：讀回報區的結論，「根據分析結果，建議這樣拆……」
```

差別只在誰去讀。口訣是：**跟塔台說「我要什麼結果」，不要說「幫我看什麼東西」。**

## 三個原因

**原因 1：context window 是有限資源。** 塔台的 context 要留給全局狀態和決策邏輯。讓它讀 500 行程式碼，這 500 行就會一直佔著空間；之後再問 sprint 進度、其他 story 的依賴，它就答不好了。

**原因 2：分開才能撐更多輪。** 塔台的壽命取決於 context 有多乾淨。分開之後，塔台 session 可以撐過一整個 sprint 的 10 到 20 張工單；每張工單則用一個乾淨的 Worker session，做完就丟。

**原因 3：結論比原始碼有價值。** 塔台做決策需要的是「UserService 有 3 個 public method、依賴 Redis 和 MariaDB、被 5 個 Controller 引用」，不是那 500 行程式碼本身。

這三點背後是同一件事：塔台像 kernel，只做排程與資源配置，不做 user space 的事（見 [認知作業系統](/deep/principles/cognitive-os)）。

## Orchestrator／Worker 分離與蜂王模式

CT 的骨架是 Orchestrator／Worker 模式：

- **Orchestrator＝塔台**：一個只負責決策與協調的 AI session。
- **Worker**：在獨立 session 執行具體工作，可以是 Claude Code，也可以是 Codex。
- **通訊橋樑＝工單**：一個 `.md` 檔，解決 AI 的失憶問題。

有個好記的比喻叫「蜂王模式」：蜂王負責決策、規劃、協調、派工；工蜂負責寫程式、測試、debug、讀檔；花蜜靠工單傳遞。**蜂王不會自己去採花蜜，她一去，就看不到整個蜂巢了。**

這條分界線是付過代價才畫出來的。v3.0 把所有指令包在同一個 skill 裡，Worker 執行 `/ct-exec` 時也載入了「塔台不得讀寫程式碼」的禁令，結果 Worker 改不了程式碼。v3.1 把 Worker 指令拆成獨立 skill，從此塔台和 Worker 沒有共用的 context，只靠工單檔案交換。後來的派工、回報、Renew，全都建立在這條邊界上。

## Hard Boundaries：塔台的硬邊界

塔台不能做的事，在 CT 裡叫 **Hard Boundaries**（權威定義：`control-tower/SKILL.md` § Hard Boundaries）：

| # | 邊界 | 為什麼 |
|---|---|---|
| 1 | 不直接寫產品程式碼、不 debug 原始碼、不讀原始 log、不做大範圍程式碼分析，改派工單 | 保住塔台的 context |
| 2 | 不用通用的 agent／task 委派取代工單 | 塔台的協調必須留下檔案、讓使用者看得見 |
| 3 | 不寫已安裝的 skill 定義檔 | 見 [可逆與不可逆的界線](/deep/principles/boundaries) |
| 4 | 沒有明文授權，不 push、不 force-push、不 reset hard、不刪分支、不還原使用者的修改 | 不可逆或對外的動作需要授權 |
| 5 | 保留無關的未提交變更；自己 commit 時只納入目標檔案 | 不誤帶別人的工作 |
| 6 | `_tower-state.md`、`_decision-log.md` 等是塔台私有狀態 | Worker 只有在工單明文授權時才能改 |

第 2 條常被忽略。塔台想「順手」開個背景 agent 查一下，也不行：背景委派不留工單、不留回報，使用者看不到它做了什麼。

唯一的例外是：單一模組內、**不涉及邏輯**的小變動（例如修錯字），塔台可以在安全時直接處理。牽涉邏輯、跨模組，或使用者禁止時，一律派工單。

## Worker 無狀態：模式由派工參數傳入

塔台有狀態，Worker 無狀態：

| | 塔台 | Worker |
|---|---|---|
| 持有什麼 | 進度、決策、編號、派工紀錄 | 只有手上這張工單 |
| 模式從哪來 | 自己的設定（session ＞ project ＞ global ＞ 預設） | **派工時由塔台傳入** |
| 讀設定檔 | 可以 | 只能讀重試上限、commit 政策這類調整值，不得用來決定執行模式 |

塔台派工時用旗標傳遞模式：`--mode` 傳成環境變數 `CT_MODE`（`yolo`／`ask`／`off`／`on`），`--interactive`／`--no-interactive` 傳成 `CT_INTERACTIVE`。`CT_MODE` 沒設或值不合法時，Worker 一律當成 `ask`。權威定義：`auto-session.md` § Mode 與互動旗標協定（v4.3.0+）。

為什麼不讓 Worker 自己讀設定檔？因為設定檔是磁碟上的共享狀態。塔台改了設定，或 Worker 落在另一個專案目錄，Worker 讀到的就不是塔台派工時的意圖。把模式搬進派工參數之後，同一張工單、同一組參數，在哪個 session 執行都得到相同的行為。這條原則在 v4.3.0 落地，之後的新機制也照它走，例如 Worker 能不能用 Workflow 工具，是塔台寫在工單裡的授權決定的，Worker 不讀設定。

## 塔台違憲與問題路由：問題該問誰

社群常把塔台越界叫「違憲」：塔台的回覆裡出現程式碼片段、說「我看了某個檔案第 47 行」、說「我幫你改成……」，或者自己跑了測試。

違憲通常有兩個原因。一是 **context 被污染**：前面的對話貼過程式碼，或讓塔台讀過檔案，它「學會」可以這樣做。二是 AI 天生想**表現得有用**：你問它問題，它最直接的解法就是去讀程式碼。發現時先叫它停；它還在辯解「需要看」，代表 context 已經救不回來，就收工、清空 context、重新啟動塔台，從 `_tower-state.md` 恢復，再用 `*sync` 以工單檔案為準修正差異。

更隱蔽的是「被教壞」：使用者老是嫌流程麻煩、跳過工單直接在塔台裡做，塔台就會慢慢不再派工、不再堅持品質閘門，變成「聽話但沒用的秘書」。一個簡單的檢查：**塔台最近有沒有對你說過「不」？**

至於有問題該問誰，口訣是：**「做什麼」問塔台，「怎麼做」問 Worker。**

| 問題類型 | 問誰 |
|---|---|
| 策略、優先順序、要不要做 | 塔台 |
| 技術細節、實作方法、程式碼 | Worker session（工單進行中，用 `/btw` 問，不打斷工單） |
| 與工單無關的一般知識 | 哪裡問都可以 |

在 yolo 模式下，方向反過來也成立：Worker 遇到工單範圍內、自己無法決定的選擇時，不問使用者，改問塔台，由塔台代為決定。見 [Worker 向塔台提問](/deep/features/worker-questions)。

## 「這樣不是更浪費 token 嗎？」

直覺上，多開 session、多寫工單，好像比較花 token。實際比較：

| 情境 | 一個 session 做到底 | 塔台＋Worker 分開 |
|---|---|---|
| context 被污染後重開 | 每次重開都要重建背景 | 塔台保持乾淨，Worker 本來就是一次性的 |
| AI 繞圈，同一個錯修 5 次 | 每次重試都在污染的 context 上，越修越歪 | 開新 session，乾淨重來 |
| 忘了全局進度 | 要花 token 提醒 AI「我們在做什麼」 | 塔台記得，工單就是紀錄 |

真正浪費 token 的是：在污染的 context 裡反覆修同一個 bug、重開 session 後從頭解釋背景，以及讓塔台讀了程式碼，之後每一個決策品質都下降。

Worker 端也一樣要保持衛生。全新任務、改 A 壞 B、AI 在繞圈、同一個問題修了 3 次以上、審查類工單，都該開新 session，換一個乾淨的 context（`context-hygiene.md` § Session 建議規則）。

## 延伸閱讀

- `docs/Control Tower 實戰補充/CT實戰補充（一-A）為什麼塔台不讀程式碼.md` § 問題出在哪、§ 為什麼要這樣設計、§ 「這樣不是更浪費 token 嗎？」
- `docs/Control Tower 實戰補充/CT實戰補充（五）塔台違憲與問題路由.md` § 一、塔台違憲了、§ 二、問問題該問誰、§ 六、塔台被我教壞了怎麼辦
- `control-tower-guide/references/concepts.md` § Orchestrator/Worker 分離模式、§ 蜂王模式（Queen Bee Model）、§ Hard Boundaries（塔台硬邊界）、§ Context 衛生原則
- `control-tower/SKILL.md` § Hard Boundaries
- `control-tower/references/auto-session.md` § Mode 與互動旗標協定（v4.3.0+）
- `control-tower/references/context-hygiene.md` § Session 建議規則
- 演進史 § 塔台和 Worker 分開跑（見 [演進史](/versions/evolution)）

<p class="ct-note">Portal 是摘要，不具權威。內容與 CT reference 有出入時，以 reference 為準。</p>
