<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import type { ThemeConfig } from '../../config.mjs'

// 取得方式（取代 BAT 的 DownloadLinks，G0 Q5 (a)）：託管前不放下載連結，只寫「託管後提供」、目前版號與安裝步驟。
// 版號讀 ct-release.json（scripts/sync-ct-release.mjs 產生）。安裝步驟摘要自 MANUAL § 4.1、§ 4.3，詳細步驟在 /install。
// 託管定案（P2）後改成真的連結。
const { theme } = useData<ThemeConfig>()
const release = computed(() => theme.value.ctRelease)
</script>

<template>
  <div class="ct-download">
    <p class="cd-status">
      <span><b>目前版本</b> CT v{{ release.ctVersion }} · CT Guide v{{ release.guideVersion }}（{{ release.releasedAt }}）</span>
      <span><b>取得方式</b>託管後提供</span>
    </p>
    <ul class="cd-files" aria-label="發行檔">
      <li v-if="release.zip">
        <span class="download-item">
          <span class="download-label">BMad Control Tower</span>
          <span class="download-note">{{ release.zip }}</span>
        </span>
      </li>
      <li v-if="release.guideZip">
        <span class="download-item">
          <span class="download-label">CT Guide Skill</span>
          <span class="download-note">{{ release.guideZip }}</span>
        </span>
      </li>
    </ul>
    <p class="cd-steps-title">拿到之後</p>
    <ol class="cd-steps">
      <li>zip 解壓縮後，根層直接是 8 個 skill 目錄（不含 <code>docs/</code>）；發行目錄版則是 <code>skills/</code> 底下 8 個 skill 目錄，另附 <code>docs/</code>。</li>
      <li>Claude Code 放到 <code>~/.claude/skills/&lt;skill&gt;/</code>；Codex 放到 <code>~/.codex/skills/&lt;skill&gt;/</code>。塔台與 Worker 用同一批，一起升級。</li>
      <li>開一個新的 session，輸入 <code>/control-tower</code>（Codex 用 <code>$control-tower</code>）。新版從下一個 session 才生效。</li>
    </ol>
    <p class="cd-more">升級、備份與回退的完整步驟：<a :href="withBase('/install')">安裝</a></p>
  </div>
</template>
