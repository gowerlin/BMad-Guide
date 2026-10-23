#!/usr/bin/env node
// Artifact 預覽包（VitePress MPA 建置，頁面零 client JS）。零依賴。
//
//   npm run build:artifact            # = node scripts/build-artifact.mjs
//   node scripts/build-artifact.mjs --skip-build   # 只改寫既有的暫存建置（除錯用）
//
// 1. PORTAL_TARGET=artifact 跑 vitepress build（MPA、cleanUrls: false、base 是哨兵 /__ct__/），
//    輸出到 .vitepress/cache/artifact-build/（不動正式站的 .vitepress/dist/）
// 2. 複製到 dist-artifact/：哨兵改成依檔案深度計算的相對路徑；站內連結補成實際檔名（index.html、.html）；
//    每個 HTML 注入 artifact-shim.js
// 3. 產出 artifact-files.json（published path → 來源檔，路徑相對於 repo 根目錄）
// 4. 自我檢查（Artifact 的檔數與大小限制、站內路徑、外部資源），任一不過就 exit 1
// 5. 對 dist-artifact/ 跑 deid-scan.mjs --internal-ids（內部編號也要 0），命中就 exit 1。
//    私有詞表與允許清單同 deid-scan：環境變數 PORTAL_DEID_TERMS／PORTAL_DEID_ALLOW，沒設定就報錯結束，不會略過
//
// 不發布。發布由維護者另外執行。

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SENTINEL = '/__ct__/'
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO = path.resolve(SITE, '..', '..')
const BUILD_DIR = path.join(SITE, '.vitepress', 'cache', 'artifact-build')
const OUT_DIR = path.join(SITE, 'dist-artifact')
const MANIFEST = path.join(SITE, 'artifact-files.json')

// 預覽包不需要的建置產物：404 靠伺服器路由、hashmap／package.json 是 MPA 建置的內部檔
const SKIP = new Set(['404.html', 'hashmap.json', 'package.json'])
const TEXT_EXT = new Set(['.html', '.css', '.js', '.mjs', '.svg', '.json', '.txt', '.xml'])

const LIMITS = {
  maxFiles: 255,
  maxFileBytes: 16 * 1024 * 1024,
  maxTotalBytes: 64 * 1024 * 1024
}
const ALLOWED_EXTERNAL_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com'])

const toPosix = p => p.split(path.sep).join('/')

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile()) out.push(full)
  }
  return out
}

function build() {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true })
  const vitepress = path.join(SITE, 'node_modules', 'vitepress', 'bin', 'vitepress.js')
  const result = spawnSync(process.execPath, [vitepress, 'build', '--outDir', BUILD_DIR], {
    cwd: SITE,
    stdio: 'inherit',
    env: { ...process.env, PORTAL_TARGET: 'artifact' }
  })
  if (result.status !== 0) {
    console.error(`[build-artifact] vitepress build 失敗（exit ${result.status}）`)
    process.exit(result.status || 1)
  }
}

// 從 published path 所在目錄回到根目錄的相對前綴：index.html → ./、guide/index.html → ../
function prefixFor(rel) {
  const depth = rel.split('/').length - 1
  return depth === 0 ? './' : '../'.repeat(depth)
}

// 站內相對連結補成實際檔名：Artifact 的檔案服務不保證會找目錄的 index，也不會替無副檔名的網址補 .html
//   guide/       → guide/index.html
//   ../install   → ../install.html（元件用 withBase 組的連結；markdown 連結 VitePress 已經補好 .html）
function fixLinks(html, rel, exists) {
  const dir = path.posix.dirname(rel)
  return html.replace(/(\shref=")([^"]*)(")/g, (all, open, url, close) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) return all
    const cut = url.search(/[?#]/)
    const pathPart = cut === -1 ? url : url.slice(0, cut)
    const rest = cut === -1 ? '' : url.slice(cut)
    if (pathPart === '') return all
    if (pathPart.endsWith('/')) return `${open}${pathPart}index.html${rest}${close}`
    if (path.posix.extname(pathPart)) return all
    const target = path.posix.normalize(path.posix.join(dir, pathPart))
    if (exists(`${target}.html`)) return `${open}${pathPart}.html${rest}${close}`
    if (exists(`${target}/index.html`)) return `${open}${pathPart}/index.html${rest}${close}`
    return all
  })
}

function rewrite(rel, content, exists) {
  const ext = path.extname(rel)
  let text = content.split(SENTINEL).join(prefixFor(rel))
  if (ext === '.html') {
    text = fixLinks(text, rel, exists)
    const shim = `<script src="${prefixFor(rel)}artifact-shim.js" defer></script>`
    text = text.replace('</head>', `    ${shim}\n  </head>`)
  }
  return text
}

function selfCheck(files) {
  const problems = []
  const published = new Set(files.map(f => f.rel))
  let total = 0
  for (const { rel, abs } of files) {
    const size = fs.statSync(abs).size
    total += size
    if (size > LIMITS.maxFileBytes) problems.push(`${rel}: ${size} bytes > 16 MB`)
    const ext = path.extname(rel)
    if (!TEXT_EXT.has(ext)) continue
    const text = fs.readFileSync(abs, 'utf8')
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      const where = `${rel}:${i + 1}`
      if (line.includes(SENTINEL)) problems.push(`${where}: 殘留哨兵 ${SENTINEL}`)
      // 以 / 開頭的站內路徑（// 開頭的協定相對網址另外當外部資源檢查）
      for (const m of line.matchAll(/\s(?:href|src|srcset|content|action|poster|data)=["'](\/(?!\/)[^"']*)["']/g)) {
        problems.push(`${where}: 以 / 開頭的站內路徑 ${m[1]}`)
      }
      if (ext === '.css' || ext === '.html') {
        for (const m of line.matchAll(/url\(\s*["']?(\/(?!\/)[^"')]*)/g)) {
          problems.push(`${where}: 以 / 開頭的 url() ${m[1]}`)
        }
      }
      // 外部資源：<link>／<script>／<img>／<source>／<iframe> 的 href/src、CSS url() 與 @import；<a> 連結不算資源
      if (ext === '.html') {
        for (const tag of line.matchAll(/<(link|script|img|source|iframe|video|audio|embed|object)\b[^>]*>/gi)) {
          for (const m of tag[0].matchAll(/\s(?:href|src|srcset)=["']((?:https?:)?\/\/[^"'\s]+)/gi)) {
            checkHost(m[1], where, problems)
          }
        }
      }
      if (ext === '.css' || ext === '.html') {
        for (const m of line.matchAll(/(?:url\(\s*["']?|@import\s+["'])((?:https?:)?\/\/[^"')\s]+)/gi)) {
          checkHost(m[1], where, problems)
        }
      }
    })
    if (ext === '.html') {
      // 站內相對連結（href、src）都要指到包裡存在的檔案
      for (const m of text.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
        const url = m[1]
        if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) continue
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), url.replace(/[?#].*$/, '')))
        if (!published.has(target)) problems.push(`${rel}: 站內連結指到不存在的檔案 ${url}`)
      }
      if (!/^\s*<!doctype html>/i.test(text)) problems.push(`${rel}: 缺 <!doctype html>`)
      if (!/<meta\s+charset=["']?utf-8/i.test(text)) problems.push(`${rel}: 缺 charset`)
      if (!/<meta\s+name=["']viewport["']/i.test(text)) problems.push(`${rel}: 缺 viewport`)
    }
  }
  if (files.length > LIMITS.maxFiles) problems.push(`檔數 ${files.length} > ${LIMITS.maxFiles}（要分批發布）`)
  if (total > LIMITS.maxTotalBytes) problems.push(`總量 ${total} bytes > 64 MB`)
  return { problems, total }
}

function checkHost(url, where, problems) {
  let host
  try {
    host = new URL(url, 'https://x.invalid/').hostname
  } catch {
    problems.push(`${where}: 無法解析的外部資源 ${url}`)
    return
  }
  if (!ALLOWED_EXTERNAL_HOSTS.has(host)) problems.push(`${where}: 外部資源不在允許清單（${host}）`)
}

function main() {
  if (!process.argv.includes('--skip-build')) build()
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`[build-artifact] 找不到暫存建置 ${toPosix(path.relative(SITE, BUILD_DIR))}`)
    process.exit(1)
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true })
  const files = []
  const built = walk(BUILD_DIR).map(abs => ({ abs, rel: toPosix(path.relative(BUILD_DIR, abs)) }))
  const kept = new Set(built.map(f => f.rel).filter(rel => !SKIP.has(rel)))
  const exists = rel => kept.has(rel)
  for (const { abs, rel } of built) {
    if (SKIP.has(rel)) continue
    const dest = path.join(OUT_DIR, rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    if (TEXT_EXT.has(path.extname(rel))) fs.writeFileSync(dest, rewrite(rel, fs.readFileSync(abs, 'utf8'), exists))
    else fs.copyFileSync(abs, dest)
    files.push({ rel, abs: dest })
  }
  files.sort((a, b) => a.rel.localeCompare(b.rel))

  if (!files.some(f => f.rel === 'index.html')) {
    console.error('[build-artifact] 沒有首頁 index.html')
    process.exit(1)
  }

  const { problems, total } = selfCheck(files)

  const manifest = {
    note: '首頁 index.html 當 Artifact 的 file_path，其餘放 files（published path → 來源檔，相對於 repo 根目錄）',
    page: toPosix(path.relative(REPO, path.join(OUT_DIR, 'index.html'))),
    fileCount: files.length,
    totalBytes: total,
    files: Object.fromEntries(
      files.filter(f => f.rel !== 'index.html').map(f => [f.rel, toPosix(path.relative(REPO, f.abs))])
    )
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

  const html = files.filter(f => f.rel.endsWith('.html')).length
  console.log(`[build-artifact] ${toPosix(path.relative(REPO, OUT_DIR))}：${files.length} 檔（HTML ${html}），${total} bytes`)
  console.log(`[build-artifact] manifest：${toPosix(path.relative(REPO, MANIFEST))}`)
  if (problems.length) {
    console.error(`[build-artifact] 自我檢查失敗 ${problems.length} 項：`)
    for (const p of problems) console.error(`  ✗ ${p}`)
    process.exit(1)
  }
  console.log('[build-artifact] 自我檢查通過：檔數、單檔／總量、無 / 開頭站內路徑、站內連結都指到存在的檔案、doctype／charset／viewport、外部資源只有 Google Fonts')

  console.log(`[build-artifact] 去識別掃描 ${toPosix(path.relative(SITE, OUT_DIR))}（--internal-ids）：`)
  const scan = spawnSync(process.execPath, [path.join(SITE, 'scripts', 'deid-scan.mjs'), '--internal-ids', OUT_DIR], { stdio: 'inherit' })
  if (scan.status !== 0) {
    console.error(`[build-artifact] 去識別掃描沒有通過（exit ${scan.status}）；不要發布，修正來源後重建`)
    process.exit(1)
  }
}

main()
