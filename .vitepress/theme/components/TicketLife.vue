<script setup lang="ts">
// 一張工單的一生（CT 視角）：BAT 版每步配 BAT 介面示意；Portal 版改成每步「塔台／Worker 各做什麼、你要做什麼、留下哪個檔案」。
// 來源：GUIDE/references/work-order-lifecycle.md § 核心迴圈、§ 狀態機；SK/ct-exec § Phase 1～4；REF/work-order-system.md § 派發流程。
// 純 SSR，沒有互動。
interface Step {
  name: string
  tower?: string
  worker?: string
  you?: string
  file?: string
}

const STEPS: Step[] = [
  {
    name: '對齊',
    tower: '跟你把需求問清楚：要做什麼、不做什麼、怎樣算完成。還沒有答案的，先記成待決事項。',
    you: '說清楚要什麼。這是整個流程裡最需要你花心思的一步。'
  },
  {
    name: '開單',
    tower: '把工作切成一張張工單：目標、範圍、會動到的檔案（affects_files）、驗收條件、不准碰的東西。',
    file: '_ct-workorders/T####-<slug>.md（status: PENDING）'
  },
  {
    name: '派發前檢查',
    tower: '查過去的學習紀錄有沒有相關經驗；比對進行中工單的 affects_files，有重疊就擋下或提醒。',
    file: '_ct-workorders/_learnings.md'
  },
  {
    name: '派工',
    tower: '依 auto-session 設定：在 BAT 開 Worker 分頁、開新終端分頁、複製到剪貼簿，或給你一行指令。',
    you: 'off／ask 模式下，由你決定怎麼開、何時開。'
  },
  {
    name: '執行',
    worker: '先做落點檢查，確認自己在對的 repo；把工單標成 IN_PROGRESS，只照工單範圍動手，跑工單寫的驗收。',
    file: 'status: IN_PROGRESS、started_at'
  },
  {
    name: '回報',
    worker: '反序收尾：先 commit 產品改動，再寫回報區（證據、commit、偏差），最後才改狀態，然後通知塔台。',
    file: '工單的「回報區」與 status: DONE／PARTIAL／BLOCKED／FAILED'
  },
  {
    name: '收單',
    tower: '不直接採信 Worker 的 PASS：逐項核對驗收條件與證據，必要時自己複驗；沒過就補充說明再派一輪，或另開工單。',
    you: '結果需要你判斷時，塔台會停下來問你。'
  },
  {
    name: '記下來',
    tower: '把這次的決定寫進決策日誌，把值得記住的做法寫進學習紀錄；下一張工單派發前會再讀到。',
    file: '_ct-workorders/_decision-log.md、_learnings.md'
  }
]
</script>

<template>
  <ol class="ticket-life">
    <li v-for="(step, i) in STEPS" :key="step.name" class="tl-step">
      <span class="tl-marker" aria-hidden="true">{{ i + 1 }}</span>
      <div class="tl-body">
        <h3 class="tl-name"><span class="sr-only">第 {{ i + 1 }} 步：</span>{{ step.name }}</h3>
        <dl class="tl-roles">
          <div v-if="step.tower" class="tl-role is-tower">
            <dt>塔台</dt>
            <dd>{{ step.tower }}</dd>
          </div>
          <div v-if="step.worker" class="tl-role is-worker">
            <dt>Worker</dt>
            <dd>{{ step.worker }}</dd>
          </div>
          <div v-if="step.you" class="tl-role is-you">
            <dt>你</dt>
            <dd>{{ step.you }}</dd>
          </div>
        </dl>
        <p v-if="step.file" class="tl-file"><span aria-hidden="true">▤ </span>留在檔案：<code>{{ step.file }}</code></p>
      </div>
    </li>
  </ol>
</template>
