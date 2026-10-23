<script setup lang="ts">
// 落點檢查 C-0 → C-3 的決策樹（§ 4.2 F-6、§ 5.4）。
// 來源：SK/ct-exec § Landing Zone Check（C-0、C-1、C-3、C-2、C-4）。純 SSR；結果一律「符號 + 文字」。
interface Outcome {
  tone: 'stop' | 'warn' | 'pass'
  text: string
}

interface Check {
  id: string
  name: string
  weight: string
  ask: string
  outcomes: Outcome[]
  loadBearing?: boolean
}

const MARK: Record<Outcome['tone'], string> = { stop: '✗', warn: '!', pass: '✓' }
const LABEL: Record<Outcome['tone'], string> = { stop: '停止', warn: '警告', pass: '通過' }

const CHECKS: Check[] = [
  {
    id: 'C-0',
    name: 'repo 身分',
    weight: '承重檢查',
    ask: '工單 frontmatter 的 repo 等於目前 repo 根目錄的名稱嗎？',
    outcomes: [
      { tone: 'stop', text: '不相等 → WRONG_REPO_CONFIRMED，停下來回報兩個值；不准改工單的 repo 欄位讓它通過。' },
      { tone: 'pass', text: '相等 → 通過；之後的 C-3 只記錄、不再單獨叫停。' },
      { tone: 'warn', text: '工單沒有 repo 欄位 → 記警告，改由 C-3 與 C-1 判斷；缺欄位本身不叫停。' }
    ],
    loadBearing: true
  },
  {
    id: 'C-1',
    name: '工單位置',
    weight: '便宜的健全檢查',
    ask: '找到的工單檔在這個 repo 底下嗎？',
    outcomes: [{ tone: 'stop', text: '不在 → 停下來回報；很少觸發，因為找錯地方通常是根本找不到工單。' }]
  },
  {
    id: 'C-3',
    name: 'affects_files 抽查',
    weight: '輔助、啟發式',
    ask: '前 5 個 affects_files，從自己往上找最近存在的上層目錄，找得到嗎？',
    outcomes: [
      { tone: 'stop', text: '全部找不到，而且沒有 repo 欄位 → WRONG_REPO_SUSPECTED，停下來。' },
      { tone: 'warn', text: '全部找不到，但 C-0 已通過或工單宣告 expect_missing → 只記警告。' },
      { tone: 'pass', text: '有找到 → 記錄後繼續。' }
    ]
  },
  {
    id: 'C-2',
    name: '分支比對',
    weight: '只提醒',
    ask: '工單寫的 branch 跟目前分支一樣嗎？',
    outcomes: [{ tone: 'warn', text: '不一樣 → 提醒；刻意換分支是常見情況，所以從不叫停。' }]
  }
]
</script>

<template>
  <figure class="landing-check" aria-label="落點檢查的順序與結果">
    <ol class="lc-steps">
      <li v-for="c in CHECKS" :key="c.id" class="lc-step" :class="{ 'is-load-bearing': c.loadBearing }">
        <span class="lc-id">{{ c.id }}</span>
        <div>
          <p class="lc-name">{{ c.name }}<span class="lc-weight">{{ c.weight }}</span></p>
          <p class="lc-ask">{{ c.ask }}</p>
          <ul class="lc-outcomes">
            <li v-for="o in c.outcomes" :key="o.text" class="lc-outcome" :class="`is-${o.tone}`">
              <span class="lc-mark" aria-hidden="true">{{ MARK[o.tone] }}</span>
              <span><span class="sr-only">{{ LABEL[o.tone] }}：</span>{{ o.text }}</span>
            </li>
          </ul>
        </div>
      </li>
    </ol>
    <p class="lc-foot">
      為什麼 C-0 才是承重檢查：「對的 repo、工單要建立整棵新目錄」和「整個錯的 repo」只看路徑時長得一模一樣，身分只能靠外部信號回答。
      刻意不做 C-4（工作區 id 比對）：工作區 id 會變，釘死在設定裡只會一直誤報。
    </p>
  </figure>
</template>
