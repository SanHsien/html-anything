# 路線圖

> 本 repo 後續工作的單一真相源。做完一項，就在同一個 commit 刪掉那一列；新工作只加在這裡。
> 現況段的數字是 2026-10-30 依 `main` 查的快照，開工前先重查 GitHub。

## 現況
本 repo 是 html-anything（agentic HTML 編輯器與渲染平台）的維護 fork。CI、CodeQL、Fork maintenance、Upstream check 為 success，Dependabot 與 code scanning 告警 0 筆，Issues 停用、open PR 0 筆（2026-10-30 `gh` 查詢）。Dependabot 歷史 4 次失敗 run（vite run 39534396371、39580268072、39581085662；source-map-js run 37601207401）原因已查明並記錄於 `docs/fork/DECISIONS.md`（皆為 `security_update_not_possible`，已由本 fork 的依賴覆寫與 workspace devDependency 修復，目前 open alerts 為 0）。

## 近期：可以直接動手
| 項目 | 為什麼 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |

## 中期：等條件成立再做
| 項目 | 觸發條件 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| 同步上游新提交與 UI 模板改進 | `Upstream check` workflow 轉為 failure（上游有未審項目）或上游 main 有新 commit | 執行 `python tools/check_upstream_updates.py`，逐檔比對 `next/src/lib/` 分歧檔後更新 `tools/upstream_baseline.json` 與 `docs/fork/DECISIONS.md`；`Upstream check` 與 CI 綠 | Codex | `tools/upstream_baseline.json`；`tools/check_upstream_updates.py` |
| 採用上游 PR #149（Codex 生命週期）、#153（重複 payload 只發一次 delta）、#159（use-convert 批次 SSE，記憶體耗盡） | 上游合併後隨 commit 軸抵達 | 逐檔比對無衝突後移植；`next/` 下 `npm test` 與 `npm run typecheck` 綠，並做 UI 驗證；`docs/fork/DECISIONS.md` 更新 | Claude Sonnet | `docs/fork/DECISIONS.md:152` |
| 評估上游 PR #162（MiniMax 模型清單） | 上游合併後經 commit 軸抵達 | 逐檔對照後決定採用與否：其 `minimax-invoke.test.ts` 用 `vi.mock('node:child_process')`，本 fork 走 `cross-spawn`，不能照抄；`npm test` 與 `npm run typecheck` 綠；`docs/fork/DECISIONS.md` 更新 | Claude Sonnet | `docs/fork/DECISIONS.md:211` |

## 刻意不做
| 不做什麼 | 理由 | 什麼情況下重新考慮 |
| --- | --- | --- |
| 補強 `tools/check_links.py` 的剩餘小缺口（未閉合 fence、雙反引號行內碼） | 深掃報告（2026-10-26）列為審查員備註：只會少檢查、不會誤報 | 文件出現這些寫法 |
| 把 `requirements-dev.txt` 的 ruff 下限從 0.16 提高 | 程式不需要 0.17；`ruff check --select E9,F tools tests` 在 0.16.10 與 0.17.2 皆通過，已以 `freshness-hold` 標註（`requirements-dev.txt:2`、`docs/fork/DECISIONS.md:216`） | 程式需要只有 ruff 0.17 以上才有的規則或設定 |

## 維護方式
- 每週由 `Upstream check` 排程檢查上游；轉 failure 或有新 commit 時人工審查再移植。
- 程式變更須通過 `next/` 下的 `npm test`（vitest）、`npm run typecheck`（tsc）與根目錄 `pytest`；請在 PowerShell 跑 vitest，Git Bash 下 GNU tar 不認 `C:` 路徑，會讓 skills 測試失敗，屬跑法問題（深掃報告 2026-10-26）。
