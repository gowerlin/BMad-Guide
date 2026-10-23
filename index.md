---
layout: home
markdownStyles: false
title: BMad Control Tower
description: 檔案驅動的工單編排 skill 組：一個塔台指揮整隊 Agent，每個決定都留在檔案裡。在 Claude Code 或 Codex 上執行。
---

<main class="home">

<section class="home-hero">
<div class="home-wrap home-hero-grid">
<div class="home-hero-copy">
<h1 class="home-hero-title"><span>一個塔台，</span><span>指揮整隊 Agent</span></h1>
<p class="home-hero-tagline"><span class="phrase">每個決定都留在檔案裡。</span><span class="phrase">BMad Control Tower（CT）是一組檔案驅動的工單編排 skill：</span><span class="phrase">塔台跟你對齊需求、開單、派工、收單，</span><span class="phrase">Worker 一次只做一張工單。</span></p>
<div class="home-hero-actions">
<a class="home-btn is-primary" href="./install">安裝</a>
<a class="home-btn is-secondary" href="./lifecycle">一張工單的一生</a>
</div>
<div class="home-hero-support">
<ul aria-label="可執行的 Agent CLI"><li>Claude Code（<code>/</code> 指令）</li><li>Codex（<code>$</code> 指令）</li></ul>
<ul aria-label="可選的搭配"><li>BAT：自動派工與回報（可選）</li><li>bmad-guide：BMad 流程路由（可選）</li></ul>
</div>
</div>
<HeroTower />
</div>
</section>

<section class="home-section">
<div class="home-wrap">
<h2 class="home-title"><span class="phrase">AI 協作開發的</span> <span class="phrase">四個痛點</span></h2>
<p class="home-lead">對話越聊越長、換個 session 就失憶、好幾個 Agent 互相踩檔案、同一段背景講了又講。CT 把這些事移到檔案裡處理。</p>
<FeatureGrid set="pains" />
<div class="home-more">

[為什麼需要 CT](./why)

</div>
</div>
</section>

<section class="home-section">
<div class="home-wrap">
<h2 class="home-title"><span class="phrase">塔台管全局，</span><span class="phrase">Worker 管細節</span></h2>
<p class="home-lead">塔台是一個只做決策與協調的 session，刻意不讀程式碼；Worker 是另開的 session，每次只帶一張工單的脈絡上工。兩邊只透過工單檔交接。</p>
<dl class="home-guard-points">
<div>
<dt>塔台（<code>/control-tower</code>）</dt>
<dd>跟你對齊需求，把工作切成工單；派工前比對每張工單會動到的檔案；收單時逐項核對證據，再決定下一步。進度、決策與學到的經驗都寫進 <code>_ct-workorders/</code> 底下的檔案。</dd>
</div>
<div>
<dt>Worker（<code>/ct-exec T####</code>）</dt>
<dd>讀工單、先確認自己在對的 repo，才把狀態改成 <code>IN_PROGRESS</code>；只動工單允許的檔案，跑工單寫的驗收，最後先寫回報、再改狀態，通知塔台。</dd>
</div>
<div>
<dt>工單（<code>T####-*.md</code>）</dt>
<dd>目標、範圍、會動到的檔案、驗收條件、不准碰的東西，以及 Worker 填寫的回報區。它是 repo 裡的 Markdown 檔，和程式碼一起進版控。</dd>
</div>
</dl>
<div class="home-more">

[看一張工單從開單到收單](./lifecycle)

</div>
</div>
</section>

<section class="home-section">
<div class="home-wrap">
<h2 class="home-title"><span class="phrase">不裝任何東西</span><span class="phrase">也能用</span></h2>
<p class="home-lead">核心只靠 repo 裡的檔案。其他三項是可選的增強，偵測到才啟用，缺了就安靜降級，可以任意組合。</p>
<CapabilityLevels />
<div class="home-more">

[看 BMad-Method、CT、BAT 和兩個 Guide skill 怎麼疊成一套](./guide/#stack)

</div>
</div>
</section>

<section class="home-section">
<div class="home-wrap">
<h2 class="home-title">自動，但不失控</h2>
<p class="home-lead">派工後要不要自動開 Worker、做完要不要自動回報，用 <code>*config auto-session</code> 選。即使全自動，該你決定的事也會回到你手上。</p>
<div class="home-guard-grid">
<div>
<h3 class="home-subtitle">自主程度</h3>
<AutonomyDial />
</div>
<div>
<h3 class="home-subtitle">yolo 一定會停下來的時候（斷點）</h3>
<ul class="home-guard-list">
<li>A：Worker 送回的訊息不是約定的回報字串（例如 <code>T0042 完成</code>）</li>
<li>B：同一張工單 Renew 太多次，或連續失敗</li>
<li>C：Worker 建議做的事超出這次規劃的範圍</li>
<li>D：有 Worker 停在畫面上等你回答</li>
<li>E：隔離分支要合併回主線之前</li>
</ul>
<p>你隨時可以在塔台輸入 <code>停</code>、<code>stop</code> 或 <code>abort</code> 中斷自動派工。</p>
</div>
</div>
<div class="home-more">

[看自主程度與斷點的細節](./deep/features/yolo)

</div>
</div>
</section>

<section class="home-section">
<div class="home-wrap">
<h2 class="home-title">它自己就是這樣長大的</h2>
<p class="home-lead">CT 的每一版都由塔台開單、Worker 實作、塔台驗收。以下是目前發行版的數字。</p>
<StatsCounter />
<p class="home-stats-note">版本數依 CHANGELOG；塔台指令數是 15 個基本 <code>*</code> 指令，不含子旗標；世代數依演進史。</p>
<div class="home-more">

[看全部指令](./reference/commands)

</div>
</div>
</section>

<section class="home-section">
<div class="home-wrap">
<h2 class="home-title">接下來往哪走</h2>
<p class="home-lead">想系統性學、想知道規則背後的理由，或想看一個完整專案怎麼做完。</p>
<FeatureGrid set="routes" />
</div>
</section>

<section id="download" class="home-section home-download">
<div class="home-wrap">
<h2 class="home-title">取得 CT</h2>
<CtDownload />

<p>CT 只負責編排。開分頁、派工、通知與狀態偵測這些執行環境的事，由 <BatLink>Better Agent Terminal（BAT）</BatLink> 負責；沒有 BAT 也能用，塔台會改給你剪貼簿或一行指令。</p>

<p><strong>延伸閱讀</strong>：本頁內容摘要自 CT 安裝與使用指南 § 1. 這是什麼、§ 5. 四級能力等級；<code>control-tower/SKILL.md</code> § Built-In Commands；<code>control-tower/references/auto-session.md</code> § 派發後行為；<code>control-tower/references/yolo-mode.md</code> § 斷點判準、§ 使用者中斷；CT Guide <code>references/concepts.md</code> § Control Tower 解決的四個 AI 協作痛點、§ Orchestrator/Worker 分離模式；演進史 § 八個世代。</p>

<p>Portal 是摘要，不具權威；與 CT 發行版的 reference 有出入時，以 reference 為準。各頁頁尾的「延伸閱讀」列出權威出處。</p>

</div>
</section>

</main>
