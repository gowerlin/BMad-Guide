# BMad Control Tower Portal

**網站：** <https://gowerlin.github.io/BMad-Guide/>

BMad Control Tower（CT）的說明網站原始碼。CT 是檔案驅動的工單編排 skill 組，在 Claude Code 或 Codex 上運作：一個塔台 session 開工單、派工、收單，多個 Worker session 各自執行一張工單，所有決定都留在檔案裡。

網站用 [VitePress](https://vitepress.dev/) 建置，部署到 GitHub Pages（<https://gowerlin.github.io/BMad-Guide/>）。

## 本機開發

需要 Node.js 24。

```bash
npm ci
npm run dev        # 開發伺服器（base 是 /）
npm run build      # 建置到 .vitepress/dist/
npm run preview    # 預覽建置結果
```

建置時讀的環境變數：

| 變數 | 用途 | 沒設定時 |
|---|---|---|
| `PORTAL_BASE` | 站點 base 路徑，例如 `/BMad-Guide/` | `/` |
| `PORTAL_SITE_URL` | 站點完整網址（結尾有 `/`），用於 sitemap、分享卡片的絕對網址 | 不輸出 sitemap 與絕對網址，建置時印出警告 |
| `BAT_SITE_URL` | Better Agent Terminal 站的網址，Portal 連到 BAT 的連結都用它組 | 設定檔內的預設值 |

用 GitHub Pages 的網址在本機建置一次，可以確認資源路徑都帶 base：

```bash
PORTAL_BASE=/BMad-Guide/ PORTAL_SITE_URL=https://<owner>.github.io/BMad-Guide/ npm run build
```

## 目錄

| 路徑 | 內容 |
|---|---|
| `*.md`、`guide/`、`deep/`、`versions/`、`reference/` | 頁面 |
| `.vitepress/config.mts` | 站點設定、nav 與 sidebar |
| `.vitepress/theme/` | 主題與 Vue 元件 |
| `.vitepress/ct-release.json` | 內容基準版本：網站內容對應的 CT 版號、CT Guide 版號、發布日與下載檔名 |
| `data/compat.json` | 相容版本對照表的資料 |
| `public/` | 原樣複製到站點根目錄的靜態檔（圖示、分享卡片圖） |
| `design/og-card.html` | 分享卡片圖 `public/og-card.png` 的原稿，不發布 |
| `scripts/` | 建置與維護用的腳本，見下節 |
| `lychee.toml` | 外部連結檢查（lychee）設定 |
| `.github/workflows/pages.yml` | GitHub Pages 建置與部署 |

## 內容基準版本與版本頁

網站內容以 `.vitepress/ct-release.json` 記錄的 CT 版本為準，頁尾與版本頁的版號都讀這個檔。

`versions/releases.md`（更版紀錄）與 `ct-release.json` 由維護者在本機用 `scripts/sync-ct-release.mjs <版號>` 從 CT 的原始碼與 CHANGELOG 產生後提交。這支腳本需要 CT 的原始碼目錄，本 repo 沒有，所以在這裡執行會失敗；CI 只建置、不重新產生版本頁。

## 腳本

| 腳本 | 用途 |
|---|---|
| `scripts/sync-ct-release.mjs` | 維護者本機用：CT 發版後同步版本資料與更版紀錄頁，產出後自動掃描；要先設定下面兩個變數 |
| `scripts/deid-scan.mjs` | 去識別掃描：找出不該公開的路徑、權杖、識別碼等，掃描 `.md`、`.yml`、`.gitignore` 等文字檔（二進位檔跳過）。`npm run deid` 掃原始檔與 `.vitepress/dist/`，並對更版紀錄加掃內部編號（`--internal-ids`） |
| `scripts/build-artifact.mjs` | `npm run build:artifact`：建置不需要伺服器路由的靜態預覽包（`dist-artifact/`） |

去識別掃描要用的私有詞表與允許清單不在本 repo。以環境變數指定兩個檔案的路徑（也可以改用 `--terms`／`--allow` 參數，參數優先）：

| 變數 | 內容 |
|---|---|
| `PORTAL_DEID_TERMS` | 私有詞表的路徑 |
| `PORTAL_DEID_ALLOW` | 允許清單（可出現的網址常數）的路徑 |

```bash
export PORTAL_DEID_TERMS=<詞表路徑> PORTAL_DEID_ALLOW=<允許清單路徑>
npm run deid
```

沒有設定時 `npm run deid` 與 `sync-ct-release.mjs` 會報錯結束，不會略過掃描。

## 部署

`main` 分支有 push，或在 Actions 頁手動執行 **Pages** workflow 時：

1. `npm ci`、`npm run build`（`PORTAL_BASE=/BMad-Guide/`，`PORTAL_SITE_URL` 由 repo 擁有者組出）
2. 上傳建置結果，部署到 GitHub Pages
3. 另外跑 lychee 外部連結檢查；只警告，不擋部署

**Pages 尚未啟用時**，workflow 只建置與檢查連結，部署步驟會跳過。到 Settings → Pages → Source 選 **GitHub Actions** 啟用後，回 Actions 頁重新執行 **Pages** workflow 即可部署。

本 repo 的內容由維護者從另一個 repo 匯出後推送；請不要直接在這裡改頁面，改動會在下次匯出時被覆蓋。
