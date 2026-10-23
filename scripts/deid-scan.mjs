#!/usr/bin/env node
// 去識別掃描（PORTAL-PLAN § 7.2）。零依賴。
//
//   node scripts/deid-scan.mjs [--terms <私有詞表>] [--allow <允許清單>] [--internal-ids] <路徑…>
//
// --internal-ids：選用類別「內部 id」（D184），只對更版紀錄（versions/releases.md 與建置出的 releases.html）生效：
// 工單號、決策號、BUG／PLAN 編號、commit SHA、BAT 內部文件路徑、BAT 回函與介面契約條目（F-n、O-n、C-n）、
// 內部階段名（「智能 P2」這類）。HTML 先去掉標籤再比對（資產檔名的雜湊不算）。
//
// 只輸出「檔案:行:類別」與各類計數，不輸出命中的原文（避免把敏感值印進日誌）。命中數 > 0 時 exit 1。
// 詞表與允許清單放在 site/ 外（§ 7.1），以參數或環境變數 PORTAL_DEID_TERMS／PORTAL_DEID_ALLOW 傳入（參數優先）；
// 兩個都沒有就報錯結束（exit 2），不會略過掃描。檔案格式見各檔開頭的註解。
//
// 掃描範圍：EXTENSIONS 的副檔名，以及沒有副檔名的檔案（含 .gitignore 這類點開頭的檔名）；
// 前 8 KB 有 NUL 位元組的檔案視為二進位，跳過。export-public-repo.mjs 用 isScannable 判斷哪些檔案要另外補掃

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const EXTENSIONS = new Set(['.md', '.vue', '.ts', '.mts', '.css', '.json', '.html', '.svg', '.js', '.mjs', '.toml', '.txt', '.xml', '.yml', '.yaml'])
// 不掃的目錄：依賴與建置快取。.vitepress/dist 與 dist-artifact 要另外當路徑參數傳入才掃
const SKIP_DIRS = new Set(['node_modules', '.git', 'cache'])
const SKIP_UNLESS_ROOT = new Set(['dist', 'dist-artifact'])
// 不掃的檔案：鎖檔只有套件名稱與雜湊；PORTAL-PLAN 是設計文件，§ 7.1 本身就列出正則
const SKIP_FILES = new Set(['package-lock.json', 'PORTAL-PLAN.md'])

// 類別編號對應 § 7.1；1、2 另有私有詞表
const PATTERNS = [
  ['1-專案名', /\b20[0-9]{2}_[A-Za-z][A-Za-z0-9_-]+/g],
  ['3-個人路徑', /([A-Z]:[\\/]+|\/[a-z]\/)Users[\\/]/gi],
  ['3-磁碟路徑', /\b[A-Z]:[\\/]+[A-Za-z@]/g],
  ['3-專案目錄編碼', /[A-Za-z]--[A-Za-z0-9-]+--/g],
  ['3-Claude 專案目錄', /\.claude[\\/]projects[\\/]/g],
  ['4-內網位址', /\b(10|192\.168|172\.(1[6-9]|2[0-9]|3[01]))(\.[0-9]{1,3}){2}\b/g],
  ['5-權杖', /(ghp_|gho_|github_pat_|sk-ant-|glpat-|AKIA|xox[bp]-)[A-Za-z0-9_-]{8,}/g],
  ['6-UUID', /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi],
  ['6-32 碼 hex', /\b[0-9a-f]{32}\b/g],
  ['6-提問 id', /\bq-[0-9a-f]{8}-[0-9a-f]{16}\b/g],
  ['6-分頁短 id', /· [0-9a-f]{6,8}\b/g],
  ['7-私人規則名', /R-G0[0-9]{2}/g],
  ['8-Email', /[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[a-z]{2,})/g]
]
const EMAIL_ALLOWED = /(^|\.)example\.(com|org|net)$/

// 選用類別「內部 id」（--internal-ids）；規則與 sync-ct-release.mjs 的摘要化一致
const INTERNAL_ID_PATTERNS = [
  ['內部 id-工單號', /\b(?:CT-T[0-9]{3}|T[0-9]{4})\b/g],
  ['內部 id-決策號', /\bD[0-9]{3}\b/g],
  ['內部 id-BUG／PLAN', /\b(?:BUG|PLAN)-[0-9]{3}\b/g],
  ['內部 id-commit SHA', /\b(?=[0-9a-f]*[0-9])(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/g],
  ['內部 id-BAT 文件路徑', /\b(?:docs\/agent-guide|electron)\/[\w./-]+/g],
  ['內部 id-回函／契約條目', /\b[FOC]-[0-9]+\b/g],
  ['內部 id-內部階段名', /智能 P[0-9]+/g]
]
const isReleases = file => /(^|\/)versions\/releases\.(md|html)$/.test(file.split(path.sep).join('/'))

function usage(message) {
  if (message) console.error(`deid-scan: ${message}`)
  console.error('用法：node scripts/deid-scan.mjs [--terms <私有詞表>] [--allow <允許清單>] [--internal-ids] <路徑…>')
  console.error('      沒給 --terms／--allow 時讀環境變數 PORTAL_DEID_TERMS／PORTAL_DEID_ALLOW')
  process.exit(2)
}

function parseArgs(argv) {
  const env = name => process.env[name] || null
  const out = { terms: env('PORTAL_DEID_TERMS'), allow: env('PORTAL_DEID_ALLOW'), internalIds: false, paths: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--terms') out.terms = argv[++i]
    else if (a === '--allow') out.allow = argv[++i]
    else if (a === '--internal-ids') out.internalIds = true
    else if (a.startsWith('--')) usage(`不認得的參數 ${a}`)
    else out.paths.push(a)
  }
  if (!out.terms) usage('沒有私有詞表：請給 --terms 或設定 PORTAL_DEID_TERMS（不帶詞表不掃描）')
  if (!out.allow) usage('沒有允許清單：請給 --allow 或設定 PORTAL_DEID_ALLOW（不帶清單不掃描）')
  if (!out.paths.length) usage('至少給一個要掃的路徑')
  return out
}

function readList(file) {
  if (!fs.existsSync(file)) usage(`找不到 ${file}`)
  return fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
}

function loadTerms(file) {
  return readList(file).map(line => {
    const [first, second] = line.split('\t')
    const term = second === undefined ? first : second
    const category = second === undefined ? '1' : first.trim()
    const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return { category: `${category}-私有詞表`, re: new RegExp(escaped, 'gi') }
  })
}

// 只看檔名：EXTENSIONS 的副檔名，或沒有副檔名（path.extname('.gitignore') 是 ''）。
// SKIP_FILES 是刻意不掃的檔案，不算「漏掃」，所以不在這裡排除（collect 另外排除），補掃端也不會撿回去
export function isScannable(file) {
  const ext = path.extname(file)
  return ext === '' || EXTENSIONS.has(ext)
}

function isBinary(file) {
  const fd = fs.openSync(file, 'r')
  try {
    const buf = Buffer.alloc(8192)
    return buf.subarray(0, fs.readSync(fd, buf, 0, buf.length, 0)).includes(0)
  } finally {
    fs.closeSync(fd)
  }
}

function collect(target, isRoot, out) {
  const stat = fs.statSync(target)
  if (stat.isFile()) {
    if (isScannable(target) && !SKIP_FILES.has(path.basename(target)) && !isBinary(target)) out.push(target)
    return
  }
  const name = path.basename(target)
  if (!isRoot && (SKIP_DIRS.has(name) || SKIP_UNLESS_ROOT.has(name))) return
  for (const entry of fs.readdirSync(target)) collect(path.join(target, entry), false, out)
}

// 建置產出（dist、dist-artifact）裡的網址常數是設定值組出來的連結，允許出現；
// 原始檔只允許寫在 .vitepress/ 的設定裡（§ 7.1：內文不得手寫這些網址）
function isBuildOutput(file) {
  const p = file.split(path.sep).join('/')
  return /(^|\/)(\.vitepress\/dist|dist-artifact)\//.test(p)
}

function isConfig(file) {
  const p = file.split(path.sep).join('/')
  return /(^|\/)\.vitepress\/[^/]+\.(mts|ts|json)$/.test(p)
}

// 例外（D200）：站點根目錄的 README.md 是公開 repo 的首頁，要放 Portal 自己的公開網址。
// 「站點根目錄」= 旁邊有 .vitepress/config.mts 的目錄，所以 site/README.md 與匯出後公開 repo 根的 README.md 都成立；
// 子目錄的 README.md 與其他 .md 照舊不放行
function isSiteReadme(file) {
  return path.basename(file) === 'README.md' && fs.existsSync(path.join(path.dirname(file), '.vitepress', 'config.mts'))
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const terms = loadTerms(args.terms)
  const allow = readList(args.allow)
  const files = []
  for (const p of args.paths) {
    if (!fs.existsSync(p)) usage(`找不到 ${p}`)
    collect(p, true, files)
  }

  const counts = new Map()
  const hits = []
  const add = (file, line, category) => {
    hits.push(`${file.split(path.sep).join('/')}:${line}:${category}`)
    counts.set(category, (counts.get(category) || 0) + 1)
  }

  let internalFiles = 0
  for (const file of files) {
    const internal = args.internalIds && isReleases(file)
    if (internal) internalFiles++
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
    lines.forEach((raw, i) => {
      let line = raw
      for (const entry of allow) {
        if (!line.includes(entry)) continue
        if (!isBuildOutput(file) && !isConfig(file) && !isSiteReadme(file)) add(file, i + 1, '允許清單網址寫在設定以外')
        line = line.split(entry).join(' ')
      }
      for (const [category, re] of PATTERNS) {
        for (const m of line.matchAll(re)) {
          if (category === '8-Email' && EMAIL_ALLOWED.test(m[1])) continue
          add(file, i + 1, category)
        }
      }
      for (const { category, re } of terms) {
        for (const _ of line.matchAll(re)) add(file, i + 1, category)
      }
      if (internal) {
        const text = file.endsWith('.html') ? line.replace(/<[^>]*>/g, ' ') : line
        for (const [category, re] of INTERNAL_ID_PATTERNS) {
          for (const _ of text.matchAll(re)) add(file, i + 1, category)
        }
      }
    })
  }

  for (const h of hits) console.log(h)
  const internalNote = args.internalIds ? `（內部 id 類別套用 ${internalFiles} 個更版紀錄檔）` : ''
  console.log(`deid-scan：掃描 ${files.length} 個檔案，命中 ${hits.length}${internalNote}`)
  for (const [category, n] of [...counts].sort()) console.log(`  ${category}: ${n}`)
  process.exit(hits.length ? 1 : 0)
}

// export-public-repo.mjs import isScannable 時不執行
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
