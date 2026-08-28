# 開發環境

維護者與 AI 接手用的開發文件。產品用法看 [`README.md`](../../README.md)；上游同步在 [`UPSTREAM.md`](UPSTREAM.md)；決策在 [`DECISIONS.md`](DECISIONS.md)。

## 架構

```text
Browser (Next.js 16)
        │
        ├─ GET /api/agents     掃描 PATH 上的 coding-agent CLI
        └─ POST /api/convert   SSE，spawn 本機 CLI
                │
                ▼
        iframe sandbox 預覽 → juice / modern-screenshot 匯出
```

- `next/`：完整 Next app（`@html-anything/next`）。
- `e2e/`：Playwright 唯一來源（`@html-anything/e2e`）。
- `cli/`：獨立 CLI 套件。
- 根目錄只放 workspace metadata、`scripts/guard.ts`、CI 與文件。
- `FORK.md`、`tools/`、`docs/fork/` 是本 fork 的開發與治理骨架。

不要新增根目錄 `src/`、`app/` 或 `tests/ui`；`scripts/guard.ts` 會失敗。fork pytest 放 `tests/`。

## 本機開發（Windows）

需要 Python 3.11+（fork gate）與 Node 20+／pnpm 10（產品）。本機已驗證 Node 26 + Python 3.14。Corepack 若不在 PATH，先 `npm install -g pnpm@10.33.2` 或啟用 Corepack。

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r requirements-dev.txt
$env:PYTHONUTF8 = "1"
pwsh -NoProfile -File tools\dev_check.ps1
```

## Canonical fork gate

`tools\dev_check.ps1` 會依序：

1. `python -m compileall`（`tools`、`tests`）
2. `ruff check`（E9 + F，僅 overlay Python）
3. `pytest tests -q`
4. `python tools/check_links.py`

這是 fork 文件與 guard 的硬閘門，不是完整產品回歸。

產品行為變更再跑：

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm exec tsx scripts/guard.ts
pnpm -F @html-anything/next typecheck
pnpm -F @html-anything/next test
pnpm -F @html-anything/next build
pnpm -F @html-anything/e2e typecheck
pnpm -F @html-anything/e2e test
```

上游 `ci.yml` 仍會在本 fork 的 `main` 上跑 Ubuntu 產品回歸。不要把那條 workflow 加上官方-repo-only guard。

本機開發伺服器：

```powershell
pnpm -F @html-anything/next dev
# → http://localhost:3000
```

CONTRIBUTING 裡的 `pnpm dev`／`pnpm build` 是上游文件；根目錄 `package.json` 依 `guard.ts` **不得**定義 scripts。請用上面的 `-F` 過濾器。

Windows 本機 `pnpm -F @html-anything/next test` 目前會有 **1** 筆失敗：`install-rejections.test.ts` 對暫存目錄做 `fs.symlink`，未開 Developer Mode 時得到 `EPERM`。Ubuntu 產品 CI 不受影響。不要為了讓本機全綠就改產品測試；那是上游契約。

## 不要做的事

- 不要把產品 `CONTRIBUTING.md` 的上游流程改寫掉；只加開頭 overlay，產品貢獻仍指向上游。
- 不要把產品 `AGENTS.md` 整份改寫成維護索引；只保留開頭 overlay。
- 不要把根目錄 `README.md` 改成繁中主檔。
- 不要提交 `.env*`、API key、CLI session 或使用者生成的 HTML／PNG。
- 不要刪上游 `README.zh-CN.md` 來「統一語系」。
- 不要對上游開 PR，除非維護者在當次對話明確同意回貢。
