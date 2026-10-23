/*
 * Artifact 預覽專用（PORTAL-PLAN § 8.4 做法 ①）。
 * MPA 建置沒有 client JS，預設主題的互動要靠這支補上：
 *   ① 深淺色：依 data-theme（Artifact 外框設定）→ 使用者切換 → prefers-color-scheme 決定 .dark
 *   ② 手機選單（漢堡鈕）：從 SSR 輸出的導覽列複製連結，做成下拉面板
 *   ③ 側欄（手機「選單」鈕）開關、可收合群組
 *   ④ 「回到頂端」
 * 只由 scripts/build-artifact.mjs 注入到 dist-artifact/ 的 HTML；正式站不載入。
 * storage 一律 try/catch：Artifact 預覽可能拿不到 localStorage。
 */
(function () {
  'use strict'

  var KEY = 'vitepress-theme-appearance'
  var root = document.documentElement
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

  function readPref() {
    try {
      return window.localStorage.getItem(KEY)
    } catch (e) {
      return null
    }
  }

  function writePref(value) {
    try {
      window.localStorage.setItem(KEY, value)
    } catch (e) {
      /* 拿不到 storage 就只在這次瀏覽生效 */
    }
  }

  // 使用者在本頁按過切換鈕：優先於外框的 data-theme，直到外框再改一次
  var sessionPref = null

  function wantDark() {
    if (sessionPref) return sessionPref === 'dark'
    var attr = root.getAttribute('data-theme')
    if (attr === 'dark') return true
    if (attr === 'light') return false
    var pref = readPref()
    if (pref === 'dark') return true
    if (pref === 'light') return false
    return !!(media && media.matches)
  }

  function syncSwitches() {
    var dark = root.classList.contains('dark')
    var switches = document.querySelectorAll('.VPSwitchAppearance')
    for (var i = 0; i < switches.length; i++) {
      switches[i].setAttribute('aria-checked', dark ? 'true' : 'false')
      switches[i].setAttribute('title', dark ? '切換為淺色' : '切換為深色')
    }
  }

  function applyTheme() {
    root.classList.toggle('dark', wantDark())
    syncSwitches()
  }

  applyTheme()

  if (media) {
    var onMedia = function () {
      applyTheme()
    }
    if (media.addEventListener) media.addEventListener('change', onMedia)
    else if (media.addListener) media.addListener(onMedia)
  }

  if (window.MutationObserver) {
    new MutationObserver(function () {
      sessionPref = null
      applyTheme()
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] })
  }

  function injectStyle() {
    var css =
      '.ct-shim-screen{position:fixed;top:var(--vp-nav-height);right:0;bottom:0;left:0;z-index:var(--vp-z-index-nav);' +
      'overflow-y:auto;padding:16px 16px 48px;background:var(--vp-c-bg);border-top:1px solid var(--vp-c-divider)}' +
      '.ct-shim-screen[hidden]{display:none}' +
      '.ct-shim-screen a{display:block;padding:12px 0;border-bottom:1px solid var(--vp-c-divider);' +
      'color:var(--vp-c-text-1);font-size:15px;font-weight:500;text-decoration:none}' +
      '.ct-shim-screen a:hover,.ct-shim-screen a:focus-visible{color:var(--vp-c-brand-1)}' +
      '.ct-shim-screen .ct-shim-group{padding:16px 0 4px;color:var(--vp-c-text-2);font-size:13px;font-weight:700}' +
      '.ct-shim-screen .ct-shim-group + a,.ct-shim-screen .ct-shim-sub{padding-left:12px}' +
      '.ct-shim-screen button{margin-top:20px;padding:8px 14px;border:1px solid var(--vp-c-divider);border-radius:8px;' +
      'background:var(--vp-c-bg-soft);color:var(--vp-c-text-1);font:inherit;font-size:14px}' +
      '.ct-shim-backdrop{position:fixed;inset:0;z-index:calc(var(--vp-z-index-sidebar) - 1);background:rgba(0,0,0,.6)}' +
      '.ct-shim-backdrop[hidden]{display:none}' +
      '@media (min-width:768px){.ct-shim-screen{display:none}}' +
      '@media (min-width:960px){.ct-shim-backdrop{display:none}}'
    var style = document.createElement('style')
    style.setAttribute('data-ct-shim', '')
    style.textContent = css
    document.head.appendChild(style)
  }

  function buildScreen() {
    var menu = document.querySelector('.VPNavBarMenu')
    var screen = document.createElement('nav')
    screen.className = 'ct-shim-screen'
    screen.id = 'ct-shim-screen'
    screen.setAttribute('aria-label', '主選單')
    screen.hidden = true
    if (menu) {
      var children = menu.querySelectorAll(':scope > a, :scope > .VPFlyout')
      for (var i = 0; i < children.length; i++) {
        var node = children[i]
        if (node.tagName === 'A') {
          screen.appendChild(cloneLink(node, false))
          continue
        }
        var label = node.querySelector('.button .text')
        var group = document.createElement('div')
        group.className = 'ct-shim-group'
        group.textContent = label ? label.textContent.trim() : ''
        screen.appendChild(group)
        var links = node.querySelectorAll('.VPMenu a')
        for (var j = 0; j < links.length; j++) screen.appendChild(cloneLink(links[j], true))
      }
    }
    var toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.textContent = '◐ 切換深淺色'
    toggle.addEventListener('click', flipTheme)
    screen.appendChild(toggle)
    document.body.appendChild(screen)
    return screen
  }

  function cloneLink(a, sub) {
    var link = document.createElement('a')
    link.href = a.getAttribute('href')
    if (a.getAttribute('target')) link.target = a.getAttribute('target')
    if (a.getAttribute('rel')) link.rel = a.getAttribute('rel')
    link.textContent = a.textContent.trim()
    if (sub) link.className = 'ct-shim-sub'
    return link
  }

  function flipTheme() {
    var next = root.classList.contains('dark') ? 'light' : 'dark'
    sessionPref = next
    writePref(next)
    applyTheme()
  }

  function init() {
    injectStyle()
    syncSwitches()

    var switches = document.querySelectorAll('.VPSwitchAppearance')
    for (var i = 0; i < switches.length; i++) switches[i].addEventListener('click', flipTheme)

    // ② 手機選單
    var hamburger = document.querySelector('.VPNavBarHamburger')
    var screen = null
    function setScreen(open) {
      if (!screen) screen = buildScreen()
      screen.hidden = !open
      if (hamburger) {
        hamburger.classList.toggle('active', open)
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false')
      }
      document.body.style.overflow = open ? 'hidden' : ''
    }
    if (hamburger) {
      hamburger.setAttribute('aria-controls', 'ct-shim-screen')
      hamburger.addEventListener('click', function () {
        setScreen(!screen || screen.hidden)
      })
    }

    // ③ 側欄
    var sidebar = document.querySelector('.VPSidebar')
    var sidebarButton = document.querySelector('.VPLocalNav .menu')
    var backdrop = null
    function setSidebar(open) {
      if (!sidebar) return
      if (!backdrop) {
        backdrop = document.createElement('div')
        backdrop.className = 'ct-shim-backdrop'
        backdrop.hidden = true
        backdrop.addEventListener('click', function () {
          setSidebar(false)
        })
        document.body.appendChild(backdrop)
      }
      sidebar.classList.toggle('open', open)
      backdrop.hidden = !open
      if (sidebarButton) sidebarButton.setAttribute('aria-expanded', open ? 'true' : 'false')
    }
    if (sidebarButton) {
      sidebarButton.addEventListener('click', function () {
        setSidebar(!sidebar.classList.contains('open'))
      })
    }
    var collapsibles = document.querySelectorAll('.VPSidebarItem.collapsible > .item')
    for (var k = 0; k < collapsibles.length; k++) {
      collapsibles[k].addEventListener('click', function (event) {
        if (event.target.closest('a')) return
        this.parentNode.classList.toggle('collapsed')
      })
    }

    // ④ 回到頂端（手機本頁目錄列的按鈕）
    var top = document.querySelector('.VPLocalNavOutlineDropdown > button')
    if (top) {
      top.addEventListener('click', function () {
        window.scrollTo(0, 0)
      })
    }

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return
      if (screen && !screen.hidden) setScreen(false)
      if (sidebar && sidebar.classList.contains('open')) setSidebar(false)
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
