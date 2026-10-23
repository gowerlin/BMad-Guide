<script setup lang="ts">
import { computed, ref } from 'vue'

// 自主程度（沿用 BAT，文案對齊 REF/auto-session.md § 派發後行為）。
// SSR 輸出預設選 yolo；Artifact 預覽沒有 client JS 時不能切換，所以四種模式的一句話也都列在按鈕上。
type Mode = 'off' | 'ask' | 'on' | 'yolo'

interface ModeInfo {
  id: Mode
  short: string
  tower: string
  you: string
}

const MODES: ModeInfo[] = [
  {
    id: 'off',
    short: '只給你指令',
    tower: '寫好工單，顯示要在新 session 執行的指令。',
    you: '自己開 session、貼指令；Worker 做完，回塔台輸入「T#### 完成」。'
  },
  {
    id: 'ask',
    short: '每次先問你',
    tower: '每次派工前先問：開新分頁執行、複製指令，還是你自己來。',
    you: '逐張決定；看得最清楚，也最常被打斷。'
  },
  {
    id: 'on',
    short: '自動派工',
    tower: '直接開新分頁、預載 Worker 指令；開不了就降級成剪貼簿或文字提示。',
    you: 'Worker 做完，看一眼回報再送回塔台。'
  },
  {
    id: 'yolo',
    short: '自主推進',
    tower: 'on 的超集：Worker 自動送回報，塔台自己決定下一張；Worker 的範圍內提問也由塔台代決。',
    you: '只在斷點（A–E）出現時回來做決定。'
  }
]

const selected = ref<Mode>('yolo')
const current = computed(() => MODES.find((m) => m.id === selected.value) as ModeInfo)
const index = computed(() => MODES.findIndex((m) => m.id === selected.value))
</script>

<template>
  <div class="autonomy" :style="{ '--autonomy-index': index }">
    <div class="autonomy-track" role="group" aria-label="自主程度">
      <button
        v-for="mode in MODES"
        :key="mode.id"
        type="button"
        class="autonomy-stop"
        :class="{ 'is-selected': mode.id === selected }"
        :aria-pressed="mode.id === selected"
        @click="selected = mode.id"
      >
        <span class="autonomy-mode">{{ mode.id }}</span>
        <span class="autonomy-short">{{ mode.short }}</span>
      </button>
    </div>
    <div class="autonomy-detail" aria-live="polite">
      <p><b>塔台</b>{{ current.tower }}</p>
      <p><b>你</b>{{ current.you }}</p>
    </div>
  </div>
</template>
