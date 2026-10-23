<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import type { ThemeConfig } from '../../config.mjs'

// 首頁數字（沿用 BAT，數字來源改成 CT）：版本數讀 ct-release.json（sync 腳本從 CHANGELOG 算出）；
// skill 數與塔台指令數取自 control-tower/SKILL.md § Built-In Commands（15 個基本指令，不含子旗標）、世代數取自演進史。
const { theme } = useData<ThemeConfig>()

interface Stat {
  value: number
  label: string
}

const STATS = computed<Stat[]>(() => [
  { value: theme.value.ctRelease.changelogEntries, label: '個版本' },
  { value: 8, label: '個 skill' },
  { value: 15, label: '個塔台指令' },
  { value: 8, label: '個世代' }
])

const DURATION_MS = 1200

// SSR 與 reduced motion 都直接顯示最終數字；只有捲進畫面時從 0 數到最終值一次
const shown = ref(STATS.value.map((s) => s.value))
const root = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let frame = 0

function format(n: number) {
  return n.toLocaleString('en-US')
}

function run() {
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION_MS)
    const eased = 1 - Math.pow(1 - t, 3)
    shown.value = STATS.value.map((s) => Math.round(s.value * eased))
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !root.value) return
  const rect = root.value.getBoundingClientRect()
  // 已經在畫面上就不重數，避免數字在使用者眼前歸零
  if (rect.top < window.innerHeight && rect.bottom > 0) return
  shown.value = STATS.value.map(() => 0)
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer?.disconnect()
        run()
      }
    },
    { threshold: 0.4 }
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})
</script>

<template>
  <dl ref="root" class="stats">
    <div v-for="(stat, i) in STATS" :key="stat.label" class="stat">
      <dt class="stat-label">{{ stat.label }}</dt>
      <dd class="stat-value">
        <span aria-hidden="true">{{ format(shown[i]) }}</span>
        <span class="sr-only">{{ format(stat.value) }}</span>
      </dd>
    </div>
  </dl>
</template>
