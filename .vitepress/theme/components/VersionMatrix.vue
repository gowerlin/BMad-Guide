<script setup lang="ts">
import { computed } from 'vue'
import CardTable from './CardTable.vue'
import compat from '../../../data/compat.json'

// 相容版本對照：讀 data/compat.json，桌面是表格、窄螢幕是卡片（交給 CardTable）。
// 資料由 B4 補（每一列都要有出處）；資料檔改了不用動元件。
interface CompatRow {
  feature: string
  ct: string
  bat?: string
  codex?: string
  note?: string
  source: string
}

interface CompatData {
  ctVersion: string
  rows: CompatRow[]
}

const data = compat as CompatData

const COLUMNS = ['功能', 'CT 起始版本', 'BAT 最低版本', 'codex', '說明', '出處']

const rows = computed(() =>
  data.rows.map((r) => [r.feature, r.ct, r.bat || '—', r.codex || '—', r.note || '', r.source])
)
</script>

<template>
  <div class="version-matrix">
    <CardTable v-if="rows.length" :columns="COLUMNS" :rows="rows" caption="相容版本對照" />
    <p v-else class="version-matrix-empty">相容版本資料整理中（<code>data/compat.json</code> 還沒有資料列）。</p>
    <p class="version-matrix-meta">資料對應 CT v{{ data.ctVersion }}；「—」表示不需要。</p>
  </div>
</template>
