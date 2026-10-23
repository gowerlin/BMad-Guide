<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import type { ThemeConfig } from '../../config.mjs'

// Portal → BAT 站的連結（§ 2.4、§ 8.2）：網址由設定值 batSiteUrl 組成，內文不手寫 BAT 站網址（去識別允許清單只放行設定檔，§ 7.1）。
//   <BatLink path="control-tower#lifecycle">BAT 站：一張工單的一生</BatLink>
// path 是 BAT 站內路徑（不含開頭的 /；空字串 = BAT 首頁），照 BAT 站的 cleanUrls 寫法（不加 .html）。
const props = withDefaults(defineProps<{ path?: string }>(), { path: '' })

const { theme } = useData<ThemeConfig>()
const href = computed(() => theme.value.batSiteUrl + props.path.replace(/^\//, ''))
</script>

<template>
  <a :href="href" target="_blank" rel="noreferrer"><slot>BAT 站</slot></a>
</template>
