# 上游維護

## Remote

- Fork：`origin` → `https://github.com/SanHsien/html-anything.git`
- 原作者：`upstream` → `https://github.com/nexu-io/html-anything.git`
- 追蹤分支：`main`

## 檢查新提交

```powershell
git fetch upstream main
python tools\check_upstream_updates.py --strict
```

工具以 `tools/upstream_baseline.json` 的 `reviewed_through` 為起點，列出所有未審查提交。
有新提交或檢查失敗時，`--strict` 回傳非零；排程 workflow 也會因此明確失敗。

## 審查清冊

每次只做一次批次審查：

1. 讀 commit 主旨與變更檔案（open PR 必須讀 diff，禁止只憑標題／「等上游定案」結案）。
2. 判斷是否與 fork overlay、Windows gate、`scripts/guard.ts` 或測試衝突。
3. 可直接同步的提交用 merge；只需要部分修正時 cherry-pick 或最小重做。
4. 跑 `pwsh -NoProfile -File tools\dev_check.ps1`。產品檔有動再跑 `pnpm exec tsx scripts/guard.ts` 與對應 typecheck／test。
5. 在 `docs/fork/DECISIONS.md` 記錄採用／略過理由（須引用具體檔案與衝突點）。
6. 驗證完成後才把 baseline 推進到已審查的完整 40 字元 SHA。

Baseline 代表「已審查」，不代表「全部已合併」。

**四個面向都要看，不是只看 commit**：commit、open PR、open issue、上游分支。

README 衝突的解法：保留頂部 overlay，把上游新產品說明留在英文 `README.md`。不要把公開入口改成繁中主檔。來源與授權 credit 留在 README 與 `NOTICE.md`。

`scripts/guard.ts` 與 `.github/workflows/ci.yml` 的產品指令是契約。merge 上游時若這兩份一起改，要對照，不要弄丟 fork overlay workflows。

## 2026-08-28：fork 起點

本 fork 自上游 `main` `c31204544230578ac814026fecc153c6e36587ae` 建立。此 SHA 設為第一個 `reviewed_through`。
之後的上游 commit 才需要進入審查清冊。

建置當下 GitHub 上已有 open PR（最高編號 144）與 open issue。**本輪沒有逐筆讀那些 diff**，所以 baseline 不寫 PR／issue watermark。下次上游審查從現有 open items 開始，不要假設「編號比 144 小的都已看過」。
