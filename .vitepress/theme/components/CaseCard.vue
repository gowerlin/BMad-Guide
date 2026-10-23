<script setup lang="ts">
import { computed, useSlots } from 'vue'

// /cases 的一個案例（沿用 BAT）。有 before 插槽時用兩欄（左「以前」、右「用 CT」，標籤可改）；
// 沒有時內文放在預設插槽，figure 插槽放在內文旁邊。
// 案例改寫規則：不寫 T 號、D 號、commit SHA，時間只寫到日期。
type CaseFacet = 'ct' | 'bat' | 'both'

const props = withDefaults(
  defineProps<{
    id: string
    title: string
    // 情境標籤：斷電續作、合併衝突……
    tag: string
    facet: CaseFacet
    // 分工標籤：['CT', '重派前回收'] 之類
    roles: Array<[string, string]>
    // 刻意比其他案例短的註腳型案例
    brief?: boolean
    beforeLabel?: string
    afterLabel?: string
  }>(),
  { beforeLabel: '以前', afterLabel: '用 CT' }
)

const FACETS: Record<CaseFacet, string> = {
  ct: 'Control Tower 的做法',
  bat: 'BAT 的功能',
  both: 'BAT 與 Control Tower 搭配'
}

const slots = useSlots()
const facetLabel = computed(() => FACETS[props.facet])
</script>

<template>
  <section class="case-card" :class="{ 'is-brief': brief, 'has-figure': !!slots.figure }" :aria-labelledby="id">
    <h3 :id="id" class="case-title" tabindex="-1">
      {{ title }}
      <a class="header-anchor" :href="`#${id}`" :aria-label="`連到「${title}」`">&#8203;</a>
    </h3>
    <p class="case-meta">
      <span class="case-tag"><span class="sr-only">情境：</span>{{ tag }}</span>
      <span class="case-facet" :class="`is-${facet}`"><span class="sr-only">誰出力：</span>{{ facetLabel }}</span>
    </p>

    <div v-if="slots.before" class="story-pair case-pair">
      <section class="story-card is-before">
        <h4>{{ beforeLabel }}</h4>
        <p><slot name="before" /></p>
      </section>
      <section class="story-card is-after">
        <h4>{{ afterLabel }}</h4>
        <p><slot name="after" /></p>
      </section>
    </div>

    <div v-else class="case-body">
      <div class="case-text"><slot /></div>
      <div v-if="slots.figure" class="case-figure"><slot name="figure" /></div>
    </div>

    <!-- slot 包一層 span：.case-result 是 flex，不包的話文字、code、連結各自成為 flex 項目、排成一列不換行 -->
    <p v-if="slots.result" class="case-result"><b>結果</b><span class="case-result-text"><slot name="result" /></span></p>

    <ul class="story-roles" aria-label="分工">
      <li v-for="[who, what] in roles" :key="who" class="story-role" :class="who === 'CT' ? 'is-ct' : 'is-bat'">
        <b>{{ who }}</b>：{{ what }}
      </li>
    </ul>
  </section>
</template>
