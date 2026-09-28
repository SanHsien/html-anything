# Fork 維護說明

本 repo fork 自 [`nexu-io/html-anything`](https://github.com/nexu-io/html-anything)，
沿用 Apache-2.0 與完整 Git 歷史。

## 為什麼維護 fork

- 保留上游持續更新的 agentic HTML 編輯器、81 套 skill 模板、本地 CLI 偵測與一鍵匯出。
- 採 Windows-first 維護：Windows 11 + PowerShell 是主要開發、除錯與完整 overlay 驗收環境。
- 繁中維護規則放 `FORK.md`；根目錄 `README.md` 必須保持上游英文產品說明（產品契約與 `scripts/guard.ts` 不掃 README，但仍是公開入口）。
- 建立可重現的 Windows fork gate、fork CI，以及逐筆審查的上游追蹤。
- 產品 CI（`ci.yml`：guard、typecheck、vitest、build、Playwright）**保留並在本 fork 跑**。

**回貢判準：修的是上游的 bug 就送回去；這裡獨創的文件／Windows 維護骨架留在這裡。**
回貢前必須在當次對話取得維護者明確同意；「fork」「建開發環境」「開 PR」都不是同意。

## 與上游的差異

| 項目 | 說明 |
|---|---|
| `README.md` | 上游英文產品說明 + 頂部 fork overlay。繁中維護在 `FORK.md`／`REVIEW.md`。上游 `README.zh-CN.md` 保留 |
| `AGENTS.md` / `CLAUDE.md` | 開頭 overlay；下文仍是上游 workspace 規則。`CLAUDE.md` 改為一般檔，不是 `@AGENTS.md` symlink |
| `NOTICE.md` / `FORK.md` | 來源、授權與同步說明 |
| `SECURITY.md` / `CONTRIBUTING.md` | 開頭 overlay：本線 PR／overlay 問題走 SanHsien；產品貢獻與產品漏洞仍指向上游 |
| `tools/dev_check.ps1` | Windows 本機一鍵 fork gate |
| `.github/workflows/fork-maintenance.yml` | fork 文件與連結檢查 |
| `.github/workflows/upstream-check.yml` | 每週對 `upstream/main` 做未審查 commit 檢查 |
| `.github/workflows/ci.yml` | **保留並在本 fork 跑**，這是產品回歸 |
| `docs/fork/` | Windows 開發、上游審查、決策 |
| `scripts/guard.ts` | 以上游為準。不要新增根目錄 `src/`、`app/`、`tests/ui` |

產品 `next/`、`e2e/`、`cli/`、`next/src/lib/templates/skills/` 以上游為準。

## 分支與 remote

- `origin/main`：SanHsien 維護線，也是唯一長期分支。
- 日常修改在本機跑 gate 後直接推 `origin/main`。
- `upstream/main`：nexu-io 原始專案，只追蹤、不推送。
- Dependabot 或外部 fork 的變更走 PR，讀 diff 並通過 CI 後再合併。

不要 `git push upstream`。同步方式見 [`docs/fork/UPSTREAM.md`](docs/fork/UPSTREAM.md)。

上游更新英文 `README.md` 時，保留頂部 overlay，不要把產品說明改寫成維護索引。繁中維護差異寫在 `FORK.md`。來源 credit 留在 README 與 [`NOTICE.md`](NOTICE.md)。

## 換一台電腦怎麼開發

```powershell
git clone https://github.com/SanHsien/html-anything.git
cd html-anything
gh repo set-default SanHsien/html-anything
python -m venv .venv
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r requirements-dev.txt
pwsh -NoProfile -File tools\dev_check.ps1
```

這是 fork 文件與 guard 的硬閘門，不是完整產品回歸。產品行為變更再跑：

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm exec tsx scripts/guard.ts
pnpm -F @html-anything/next typecheck
pnpm -F @html-anything/next test
pnpm -F @html-anything/next dev
```

完整產品 CI 還包含 e2e typecheck、`next` build 與 Playwright。本機沒跑過的項目不要宣稱已通過。

只想使用產品、不開發時，請走上游官方來源（見 [`README.md`](README.md)）。不要把 `tools/`、`docs/fork/`、`.github/workflows/fork-maintenance.yml` 當成產品裝包。

## 審查紀錄

本輪倉庫審查見 [`REVIEW.md`](REVIEW.md)。
