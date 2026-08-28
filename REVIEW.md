# Repository review（Windows-first）

- Review date: 2026-08-28
- Review baseline: `c31204544230578ac814026fecc153c6e36587ae`
- Remediation: 2026-08-28 fork-local overlay
- Upstream reviewed through: `c31204544230578ac814026fecc153c6e36587ae`
- Primary environment: Windows 11、PowerShell、Python 3.14（overlay gate）；產品 CI 仍是上游 Ubuntu `ci.yml`（Node 24 + pnpm）
- Status: 維護骨架已落地。本輪是 fork 建置，不是完整產品安全審計。

## 結論

這個 fork 適合作為 Windows 本機、給 Agent 維護的 HTML Anything 開發線。產品行為跟隨 `nexu-io/html-anything` 的 Next app、skill 模板與本地 CLI 偵測，再加上本線 overlay：頂部 fork 標示、Windows gate、逐筆上游審查。

根目錄 `README.md` 保持上游英文產品說明。`scripts/guard.ts` 禁止根目錄 `src/`、`app/`、`tests/ui`；fork 測試放 `tests/`。上游 `ci.yml` 繼續在本 fork 跑，不當成官方-only。

不把 fork 當成第二個官方產品 repo。官網、Discord、星圖與社群仍屬上游。本線 **沒有**獨立模型後端；執行時 spawn 本機已登入的 Agent CLI。

本輪 **不回貢**。

## 本輪實證

### 審查當下（`c312045`）

```text
git rev-parse HEAD
→ c31204544230578ac814026fecc153c6e36587ae

gh repo set-default --view
→ SanHsien/html-anything

origin  → https://github.com/SanHsien/html-anything.git
upstream → https://github.com/nexu-io/html-anything.git
```

實查（不是只讀 README）：

- `LICENSE` 是 Apache License 2.0。
- 根目錄 `package.json` 沒有 `scripts`，`devDependencies` 只有 `tsx`；`packageManager` 釘 `pnpm@10.33.2`。
- `.github/workflows/` 當時只有 `ci.yml`（Ubuntu、Node 24、guard / typecheck / vitest / build / Playwright）。
- 沒有 `SECURITY.md`、沒有 Dependabot、沒有 CodeQL、沒有 `.gitattributes`。
- `CLAUDE.md` 內容是 `@AGENTS.md`（11 bytes），不是完整檔。
- `scripts/guard.ts` 禁止 `app/`、`src/`、`tests/ui`、`playwright.config.ts`（根）、`next/e2e`、`next/tests`。
- `.gitignore` 已忽略 `.env*`、`node_modules`、`.next`；當時沒有 `.venv/`。
- CONTRIBUTING 寫 `pnpm dev`／`pnpm build`，但 guard 禁止根目錄 scripts；真正指令是 `pnpm -F @html-anything/next …`（`AGENTS.md` 已寫）。本輪不改產品 CONTRIBUTING 正文。

本輪 overlay 落地後實跑：

```text
pwsh -NoProfile -File tools\dev_check.ps1
→ 26 passed、WINDOWS DEV CHECK GREEN

pnpm install --frozen-lockfile
pnpm exec tsx scripts/guard.ts
→ Guard passed.

pnpm -F @html-anything/next typecheck
→ 通過

pnpm -F @html-anything/next test
→ 180 passed / 1 failed：`install-rejections.test.ts` 在 Windows 對 temp 目錄 `fs.symlink` 得到 EPERM
```

**沒有**用真實 Agent CLI 跑端到端生成，**沒有**跑 Playwright，**沒有**對上游開 PR，**沒有**部署到 Vercel。

## 已修 findings

| ID | 項目 | 處理 |
|---|---|---|
| R-01 | 無 fork overlay／Windows gate | 加上 `FORK.md`、`tools/dev_check.ps1`、`docs/fork/` |
| R-02 | `CLAUDE.md` 在 Windows 不可靠 | 改為一般檔 |
| R-03 | 無上游追蹤 | `upstream-check.yml` + `tools/upstream_baseline.json` |
| R-04 | 無安全回報入口 | 新增 `SECURITY.md`，產品漏洞指向上游 |
| R-05 | Issue 會落到產品討論而無導流 | `ISSUE_TEMPLATE/config.yml` 導向上游與 Security advisory |
| R-06 | 無 Dependabot／CodeQL | 新增 npm + pip + github-actions；CodeQL 掃 JS/TS、Python、Actions |
| R-07 | Windows 上 vitest 有一筆 symlink EPERM | 記錄，不改產品測試。Ubuntu CI 仍會跑過 |

## 接受不改

- 上游 `ci.yml` 繼續用未 pin 的 `actions/checkout@v4`／`setup-node@v4`。改它會動產品契約字串（`guard.ts` 核對 ci.yml 指令）；交給 Dependabot 開 PR 後再讀 diff。
- 不把產品 README 翻成繁中主檔。這會讓公開入口偏離上游，也違反本線「英文產品契約」慣例。
- 不在 overlay gate 跑完整 Playwright。那是產品 CI 的工作；本機沒裝瀏覽器時不得宣稱 e2e 綠燈。
- 現有上游 open PR／issue 本輪不逐筆讀 diff。watermark 不推進；下次上游審查從這些編號開始看。
- 不在本輪修 `install-rejections.test.ts` 的 Windows `fs.symlink` EPERM。那是產品測試假設 Unix symlink 可用；改它屬於上游 bugfix，需要維護者同意回貢。見 R-07。

## 尚未宣稱範圍

- 未跑 `pnpm -F @html-anything/e2e test`。
- 未驗證 9 個 Agent CLI 的實際 spawn／SSE。
- 未審計 `iframe sandbox` 或 Host allowlist 以外的安全面。
- 未把任何產品 skill 模板改成本線風格。
