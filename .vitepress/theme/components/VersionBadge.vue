<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import type { ThemeConfig } from '../../config.mjs'
import bmadGuide from '../../../data/bmad-guide.json'

// 目前版本（§ 5.4、§ 6.1）：讀 ct-release.json（scripts/sync-ct-release.mjs 產生，CT 與 Guide 版號一致才會寫入）。
// BMad Guide 的版號跟 BMad-Method 走，另讀 data/bmad-guide.json（LR-003，D217）。
// inline：一行徽章，可放在頁首或段落裡；block：/versions/ 用的明細。
withDefaults(defineProps<{ variant?: 'inline' | 'block' }>(), { variant: 'inline' })

const { theme } = useData<ThemeConfig>()
const release = computed(() => theme.value.ctRelease)
</script>

<template>
  <span v-if="variant === 'inline'" class="version-badge">
    <span class="vb-mark" aria-hidden="true">●</span>
    <span>CT v{{ release.ctVersion }}</span>
    <span class="vb-sep" aria-hidden="true">·</span>
    <span>Guide v{{ release.guideVersion }}</span>
    <span class="vb-sep" aria-hidden="true">·</span>
    <span>{{ release.releasedAt }}</span>
    <span class="vb-sep" aria-hidden="true">·</span>
    <span>BMad Guide v{{ bmadGuide.version }}</span>
  </span>
  <dl v-else class="version-block">
    <dt>BMad Control Tower</dt>
    <dd>v{{ release.ctVersion }}</dd>
    <dt>CT Guide Skill</dt>
    <dd>v{{ release.guideVersion }}（與 CT 同版號）</dd>
    <dt>發布日</dt>
    <dd>{{ release.releasedAt }}</dd>
    <dt>BMad Guide Skill</dt>
    <dd>v{{ bmadGuide.version }}（跟 BMad-Method 同版號，{{ bmadGuide.releasedAt }} 發布）</dd>
    <dt v-if="release.zip">發行檔</dt>
    <dd v-if="release.zip">{{ release.zip }}<template v-if="release.guideZip">、{{ release.guideZip }}</template><template v-if="bmadGuide.zip">、{{ bmadGuide.zip }}</template></dd>
    <dt>已發布版本</dt>
    <dd>{{ release.changelogEntries }} 版（依 CHANGELOG）</dd>
  </dl>
</template>
