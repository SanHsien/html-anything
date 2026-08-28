# 維護決策

## 2026-08-28：建立 Windows-first 維護型 fork

**決定**：fork `nexu-io/html-anything`，保留 Apache-2.0 與完整歷史，預設分支維持 `main`。本線聚焦 Windows 開發 gate、fork overlay 文件，以及逐筆審查的上游追蹤。根目錄 `README.md` 保持上游英文。

**理由**：上游已經是可跑的 local-first HTML 編輯器（Next.js 16、75 skills、零 API key）。缺的是 Windows 11 上可重現的 overlay 驗收骨架，以及「PR 只打本 fork」的硬邊界。直接用上游 repo 難以長期記錄 fork 取捨。

**限制**：

- 不把 fork 包裝成原創專案，不移除原作者與 Apache-2.0 標示。
- 不把產品 skill 模板翻譯成繁體；產品語言跟隨上游。
- 不新增根目錄 `src/`、`app/`、`tests/ui`。
- 上游更新必須逐筆審查。
- 不回貢，除非維護者在當次對話明確同意。

## 2026-08-28：維護線直接推 main

**決定**：fork 維護不再開功能分支。改完在本機跑 gate，通過後直接推 `origin/main`。遠端只留 `main`；`upstream/main` 只追蹤。

**理由**：這是單人維護 fork，分支與 PR 沒有第二審查者，只增加同步成本。

**限制**：

- Dependabot 與外部 fork 仍可能開 PR，讀 diff 後再合併，不自動合併。
- 不推 `upstream`，不 force-push `main`。
- 不刪 `upstream` remote。

## 2026-08-28：不改產品 ci.yml 的 action pin

**決定**：上游 `ci.yml` 維持 `actions/checkout@v4` 與 `actions/setup-node@v4`。overlay workflows 自己 pin SHA。

**理由**：`scripts/guard.ts` 把 `ci.yml` 裡的產品指令當契約。改 pin 不是這次 overlay 的範圍；交給 Dependabot。

## 2026-08-28：fork gate 不跑 Playwright

**決定**：`tools/dev_check.ps1` 只驗 overlay Python。產品 e2e 留在上游 `ci.yml`。

**理由**：Playwright 需要瀏覽器與較長時間；Cursor stop hook 會跑 `dev_check.ps1`。把 e2e 放進 overlay gate 會讓每次結束都等完整產品 CI。

## 2026-08-28：現有上游 open PR／issue 不在建置當下逐筆審查

**決定**：`reviewed_through` 設為 fork 起點 `c31204544230578ac814026fecc153c6e36587ae`。不寫 `reviewed_pr_through`／`reviewed_issue_through`，避免把「還沒讀 diff」標成已審。

**理由**：本輪目標是開發環境。open PR（截至 #144）與 open issue 下次做上游審查時從最小編號開始看。

## 2026-08-28：審查輪 overlay 修正

**決定**：修本線能改、且不碰產品契約字串的項：`pytest>=9.1`、Issue 模板補本 fork CONTRIBUTING、gitignore 點名 cookie／憑證檔、測試禁止 tracked symlink、產品 `ci.yml` 加 `persist-credentials: false`、`CONTRIBUTING.zh-CN.md` 路徑改 `next/src/`。CodeQL 告警與 iframe sandbox 不在 overlay 清。

**理由**：dependency-freshness 已對 pytest 8 下限紅燈；簡中 CONTRIBUTING 的 `src/` 會讓跟著走的人撞 `guard.ts`。產品 spawn／預覽模型是上游取捨，改它等於改產品安全契約，需要回貢授權。

**限制**：

- 不 pin 產品 `ci.yml` 的 action 版本。
- 不關閉、不「處理」CodeQL 32 筆 alert。
- 不推進 `reviewed_pr_through`／`reviewed_issue_through`。

## 2026-08-28：不修 Windows symlink 單元測試

**決定**：接受 `install-rejections.test.ts` 在未開 Developer Mode 的 Windows 上 `fs.symlink` EPERM。overlay gate 不跑 vitest。

**理由**：這是產品測試對 Unix symlink 的假設，不是 overlay 能最小修的範圍。Ubuntu `ci.yml` 仍覆蓋該案例。若要修，應送回上游並在當次對話取得回貢同意。
