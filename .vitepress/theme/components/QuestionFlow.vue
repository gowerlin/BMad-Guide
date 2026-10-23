<template>
  <!-- Worker 問塔台的流程（沿用 BAT，文案對齊 REF/yolo-mode.md § Worker 向塔台提問）：塔台代答或轉給你；BAT 通道用不了時改走工單 -->
  <figure class="question-flow" aria-label="Worker 問塔台的流程">
    <ol class="qf-main">
      <li class="qf-box is-worker">
        <p class="qf-who">Worker · T####（yolo）</p>
        <p class="qf-text">金額四捨五入還是無條件捨去？</p>
        <p class="qf-state"><span aria-hidden="true">?</span> 在等塔台答覆</p>
      </li>
      <li class="qf-box is-tower">
        <p class="qf-who">塔台</p>
        <p class="qf-text">這在工單範圍內嗎？決策日誌或專案慣例有答案嗎？</p>
      </li>
    </ol>
    <ul class="qf-branches">
      <li class="qf-branch is-tower">
        <p class="qf-when">範圍內的選擇</p>
        <p class="qf-text">塔台代決，答覆寫進工單，並記下理由。</p>
        <p class="qf-then">Worker 收到答覆，記進互動紀錄後接著做。</p>
      </li>
      <li class="qf-branch is-you">
        <p class="qf-when">需要你決定的事</p>
        <p class="qf-text">商業規則、範圍變更、你的偏好：塔台停下來問你。</p>
        <p class="qf-then">你回答後，塔台把答覆交給 Worker。</p>
      </li>
    </ul>
    <p class="qf-fallback">
      <b>BAT 的提問通道用不了時</b>（BAT 版本太舊、BAT 重開讓問題消失），題目本來就寫在工單裡，Worker 改在工單上等塔台的答覆行。等超過 <code>worker_question_timeout</code> 還沒有答案，Worker 把工單標成 BLOCKED 交回塔台，塔台補充說明後重派。
    </p>
  </figure>
</template>
