<script setup lang="ts">
// 直接合併判準 → 三種合併模式（§ 4.2 F-5、§ 5.4）。
// 來源：REF/merge-workorder.md § 三種模式、§ 塔台直接合併判準、§ 斷點 E。純 SSR。
const CRITERIA = [
  'main 沒有前進，或只在 _ct-workorders/ 底下前進',
  'Worker 驗證時的 SHA 等於分支目前的 SHA',
  '沒有改到工單 affects_files 以外的檔案，也沒有動到 _ct-workorders/',
  '跟 main 沒有衝突',
  'worktree 與主 checkout 都沒有相關的未提交變更'
]

interface Mode {
  key: string
  when: string
  name: string
  code: string
  who: string
  yolo: string
  direct?: boolean
}

const MODES: Mode[] = [
  {
    key: '①',
    when: '五條全部成立',
    name: '機械合併',
    code: 'mechanical',
    who: '塔台直接合併，不派合併工單。',
    yolo: 'ff 前再確認一次判準仍成立就自動 --ff-only；非 yolo 先停下來確認（斷點 E）。',
    direct: true
  },
  {
    key: '②',
    when: '有一條不成立，git merge 解衝突就能完成',
    name: '衝突解決',
    code: 'conflict',
    who: '派合併工單：Worker 在整合 worktree 以 --no-ff 合併、解衝突、跑完整驗收，逐檔說明雙方意圖與解法。',
    yolo: '驗收全綠且沒有範圍外檔案才自動 ff；否則停下來（斷點 E）。'
  },
  {
    key: '③',
    when: '分支太舊、程式碼已重構，git merge 不適合',
    name: '等價移植',
    code: 'port',
    who: '派合併工單：Worker 以原工單的目標與驗收條件為規格，從目前的 main 重新實作，附「原改動 → 新位置」對照表。',
    yolo: '一律停下來等你確認（斷點 E）。'
  }
]
</script>

<template>
  <figure class="merge-modes" aria-label="直接合併判準與三種合併模式">
    <div class="mm-gate">
      <p class="mm-gate-title">塔台先查直接合併的五條判準</p>
      <ol class="mm-criteria">
        <li v-for="c in CRITERIA" :key="c">{{ c }}</li>
      </ol>
    </div>
    <ul class="mm-modes">
      <li v-for="m in MODES" :key="m.code" class="mm-mode" :class="{ 'is-direct': m.direct }">
        <p class="mm-when"><span aria-hidden="true">→ </span>{{ m.when }}</p>
        <p class="mm-name">{{ m.key }} {{ m.name }} <code>{{ m.code }}</code></p>
        <p class="mm-who"><b>誰做</b>{{ m.who }}</p>
        <p class="mm-yolo"><b>合併進 main</b>{{ m.yolo }}</p>
      </li>
    </ul>
  </figure>
</template>
