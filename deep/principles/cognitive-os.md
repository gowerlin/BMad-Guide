---
title: 認知作業系統：Memory Hierarchy 同構
description: CT 為什麼是 Cognitive OS 而不是 workflow 工具：磁碟、RAM、無狀態 process 與 IPC 在 CT 裡各對應到什麼。
---

# 認知作業系統：Memory Hierarchy 同構

<p class="ct-lead">CT 不是 workflow 工具，是一套小型的認知作業系統。它的設計幾乎都能從一個對應關係推導出來：檔案是磁碟，context window 是 RAM，每次 LLM 呼叫是一個無狀態的 process。</p>

## CT 是 Cognitive OS，不是 workflow 工具

第一次用 CT 的人，常會問幾個看起來很合理的問題：工單為什麼要寫成 `.md` 檔，不直接在對話裡交代？為什麼要維護 `_tower-state.md`，掃 git log 不行嗎？塔台為什麼連一段程式碼都不肯讀？

這些問題的答案，`SKILL.md` 裡找不到。`SKILL.md` 教的是「怎麼用」，「為什麼這樣設計」散落在各個 reference 的背景段、決策日誌與 `*evolve` 累積的學習紀錄裡。CT 後來寫了一份 `doctrine.md`，把這些論述收在一起，核心只有一句：**CT 不是 workflow 工具，是一套小型的認知作業系統（Cognitive OS）。**

「workflow 工具」關心的是步驟怎麼串起來。「作業系統」關心的是有限的資源怎麼分配：記憶體放什麼、什麼要寫回磁碟、多個 process 搶同一份資源時怎麼協調。CT 要管的正是後者，只是資源換成了 LLM 的 context window 和使用者的注意力。

v5.10.0 之後，Claude Code 多了一個 Workflow 工具，可以在一支腳本裡平行派出多個子 agent。這沒有改變上面那句話：Workflow 是 Worker 在**單張工單之內**的執行方式，不是 CT 的編排層。派工、跨 session、人工把關，仍然由檔案驅動的工單和 Playbook 負責（權威定義：`workflow-engine.md` § 定位）。

## 對應表：磁碟、RAM、process、IPC

`doctrine.md` 把這個對應叫做「Memory Hierarchy 同構」：

| 傳統作業系統 | CT 對應物 |
|---|---|
| Disk（磁碟） | 檔案系統：工單、learnings、fieldguide |
| RAM | Context window |
| Stateless process | 每一次 LLM 呼叫 |
| IPC pipe | Worker 之間透過產出檔傳遞資料 |
| Memory hierarchy（L1／L2／L3 cache） | 工單、learnings、FIELDGUIDE 三層知識存取 |

`doctrine.md` 特別強調這不是比喻，是**同構**：兩邊受同樣的結構約束。

1. **容量和速度要取捨。** Context window 有上限，RAM 也有。放在 context 裡的資料拿得快，放在磁碟上的拿得慢，但可以放很多。
2. **執行單元無狀態，狀態要外部化。** 每次 LLM 呼叫都是一個獨立的 process，session 一結束，裡面的東西就沒了。要跨 session 留下任何狀態，只能靠磁碟上的檔案。
3. **共享資源有協調成本。** 多個 process 搶同一份資源會產生鎖和衝突；多個 Worker 同時改同一區檔案也一樣。

既然約束相同，作業系統幾十年累積的解法，大多也能直接搬過來用。

::: tip 兩種「三層」不要混在一起
表格最後一列的三層是**知識存取**的三層：工單（L3，像硬碟）、蒸餾後的 `_learnings.md`（L2）、FIELDGUIDE（L1，熱區）。CT 另外還有一組**資料歸屬**的三層：Core Skills／Global／Project，回答的是「誰擁有、升級時會不會被覆蓋」。後者見 [三層資料與記憶](/deep/principles/data-layers)。
:::

## 從同構推出來的設計決策

同構的價值，在於它讓 CT 一些「看起來很怪」的規定，變成幾乎沒有別的選擇：

| CT 的設計 | 同構的解讀 |
|---|---|
| Worker 無狀態、塔台有狀態 | 無狀態 process 加上一個持久的排程者 |
| 工單用 `.md` 檔，不靠對話 | 磁碟上的檔案，是跨 process 唯一可靠的共享介面 |
| `_tower-state.md` 持久化 | 事件記憶必須外部化，否則 RAM 一清空就沒了 |
| 塔台不改程式碼、只派工 | kernel 不做 user space 的事，只負責排程與資源配置 |
| Worker 回塔台只帶結構化摘要 | syscall 回傳結果碼，不回傳整個 process 的記憶體傾印 |

權威定義：`doctrine.md` § 第一原則：Memory Hierarchy 同構 › 設計決策對應表。

再舉一個從同構推出來的決定：塔台為什麼不直接看 git log？git log 記的是「程式碼什麼時候改了什麼」，粒度很細、沒有因果整理，相當於最底層的原始資料。用它取代 `_tower-state.md`，等於放棄快取、每次都從硬碟讀全部資料，context 很快就被事件紀錄塞滿。

CT 自己的演進也印證了這張表。v4.3.0 把 Worker 的執行模式從「讀設定檔」改成「派工時用旗標傳入」，本質上是把模式從磁碟（設定檔）搬到 process 參數（argv）。這樣 Worker 才真正無狀態：同一張工單、同一組參數，在哪個 session 執行都得到同樣的行為。細節見 [塔台不讀程式碼](/deep/principles/tower-and-workers)。

反序寫入也是一例：Worker 收尾時先把回報寫完，最後才改狀態。這不是個人習慣，而是「把檔案當成 IPC」時一定要有的先後保證，見 [檔案即真相來源](/deep/principles/files-as-truth)。

## 外部框架校準：CLT 六步與 CT 的對照

CT 的很多設計，一開始是憑工程直覺做出來的。v4.3 之後，有一篇用認知負荷理論（Cognitive Load Theory，CLT）談多 agent 編排的長文，提出六個步驟。拿它來對照 CT，發現既有架構大多對得上，也照出了幾個還沒寫成規則的地方。v4.4.0 的新功能，幾乎都來自這次對照。

CLT 的核心觀念是：工作記憶是一個總量固定的池子。花在追蹤 agent 內部細節的每一分注意力，都是從架構判斷那邊扣掉的。所以重點不是「同時管幾個 agent」，而是**在哪個層級切換**：在審查和決策層切換很便宜，在實作細節層切換很貴。

| CLT 步驟 | 核心主張 | CT 的落地 |
|---|---|---|
| 1. Agent 分類 | 用「對協調者的介入成本」取代「agent 的內部能力」來分類 | 工單欄位 `intervention_type` |
| 2. 三種認知負荷 | 切在審查層，不切在實作層 | 整套 Cognitive OS 框架，成為 `doctrine.md` 的底層語言 |
| 3. Element Interactivity | 寧可抽象、不要碎片化，一個 agent 對一個邊界清楚的範圍 | `affects_files` 與派發前的靜態重疊檢查 |
| 4. Spec 三層 | spec 停在架構邊界層 | 派發前的「規格層級自問」 |
| 5. Memory 四類 | Strategic memory 是蒸餾過的因果 | `_learnings.md` 拆成 Strategic／Tactical／Episodic |
| 6. Double-loop | 質疑設計假設本身 | `doctrine.md` 與 `*evolve` 正式化 |

第二步沒有對應單一功能，而是變成一個審計問句：**「負擔去哪了？」** 落到使用者的工作記憶就扣分，落到檔案系統就加分，落到 skill 或模板加更多分，因為一次設計、之後每次都受益。有了這個問句，設計決策就能被別人挑戰，也能被自己檢討，不再只是「這樣用起來比較順」。

這次對照也示範了一種採用外部框架的方式：不拿外部框架整個替換掉自己的做法，那樣會丟掉實作累積下來的經驗；也不在事後宣稱自己一直都是對的，那樣會錯過補強的機會。而是把它當成一面稽核用的鏡子，先照出既有架構的強弱，再用它提供的概念，把隱性但關鍵的部分寫成明文。

## 開放問題

`doctrine.md` 的最後一節，公開列出 CT 自己還沒有答案的問題：

1. **`_tower-state.md` 的格式，在高頻更新時撐得住嗎？** 如果一天有幾十次狀態變化，純文字 diff 的成本可能比結構化儲存還高。
2. **全部是 fire-and-forget 的工單串，還需要塔台中轉嗎？** yolo 模式已經往「工單自動接下一張」的方向走，但還沒有完全放棄塔台。
3. **有些既有專案，是不是根本不適合工單制？** 高度耦合的舊程式、需要跨模組反覆探索的逆向工程，硬走工單制反而增加負擔。CT 目前沒有「退出工單制」的正式協定。
4. **語意上的依賴，能自動化到什麼程度？** `affects_files` 只看得到檔案層的重疊；「API 介面的設計會影響前端流程」這種依賴，目前完全靠人工標記。

把這些問題寫在官方設計文件裡，是刻意的，詳見 [會學習的系統](/deep/principles/learning)。

## 延伸閱讀

- `control-tower/references/doctrine.md` § 前言：為什麼需要這份文件？
- `control-tower/references/doctrine.md` § 第一原則：Memory Hierarchy 同構（含 § 設計決策對應表）
- `control-tower/references/doctrine.md` § 開放問題
- `control-tower/references/workflow-engine.md` § 定位
- `control-tower-guide/references/concepts.md` § 第一原則：Memory Hierarchy 同構
- `control-tower-guide/references/three-layer-arch.md` § 三層與 Memory Hierarchy 同構
- 文章《從代碼創作者到編排策展人》§ 第二部分：CT v4.4 對 CLT 六步的精確落地、§ 第三部分：三個對照過程中浮現的理論升級
- 規劃文件《Cognitive Load × Agent Orchestration：深度拆解與 Control Tower 對照》§ 綜合對照表：文章六步 × Control Tower 現狀

<p class="ct-note">Portal 是摘要，不具權威。內容與 CT reference 有出入時，以 reference 為準。</p>
