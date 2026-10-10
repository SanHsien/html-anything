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

**後續**：同日「審查可修項落地」已 pin 這兩個 action 的 SHA；`guard.ts` 核對的 pnpm 字串未改。

**理由**：`scripts/guard.ts` 把 `ci.yml` 裡的產品指令當契約。改 pin 不是這次 overlay 的範圍；交給 Dependabot。

## 2026-08-28：fork gate 不跑 Playwright

**決定**：`tools/dev_check.ps1` 只驗 overlay Python。產品 e2e 留在上游 `ci.yml`。

**理由**：Playwright 需要瀏覽器與較長時間；Cursor stop hook 會跑 `dev_check.ps1`。把 e2e 放進 overlay gate 會讓每次結束都等完整產品 CI。

## 2026-08-28：現有上游 open PR／issue 不在建置當下逐筆審查

**決定**：`reviewed_through` 設為 fork 起點 `c31204544230578ac814026fecc153c6e36587ae`。不寫 `reviewed_pr_through`／`reviewed_issue_through`，避免把「還沒讀 diff」標成已審。

**理由**：本輪目標是開發環境。open PR（截至 #144）與 open issue 下次做上游審查時從最小編號開始看。

## 2026-08-28：審查可修項落地（不回貢）

**決定**：在本 fork 修完 REVIEW 裡還能改、且不改產品信任模型的項：Windows symlink 測試改 ustar、CONTRIBUTING overlay 寫 `pnpm -F`、簡中 export-menu 對齊、overlay 文件 skill 數改 81、產品 `ci.yml` pin action SHA、marketplace id 驗證改拆解而非單一 regex、stripTags 迴圈、屬性跳脫。不送上游。

**理由**：主人這次對話要求「可修的都修、先不考慮回貢」。spawn CLI、iframe `allow-scripts allow-same-origin`、英文 README 行銷數字仍屬產品契約，維持不改。

**限制**：

- 不翻英文 README、不把 Playwright 放進 overlay gate、不合併未讀的上游 #131。
- 不關閉 GitHub CodeQL alert（修碼後等下次掃描）。

## 2026-08-28：審查輪 overlay 修正

**決定**：修本線能改、且不碰產品契約字串的項：`pytest>=9.1`、Issue 模板補本 fork CONTRIBUTING、gitignore 點名 cookie／憑證檔、測試禁止 tracked symlink、產品 `ci.yml` 加 `persist-credentials: false`、`CONTRIBUTING.zh-CN.md` 路徑改 `next/src/`。CodeQL 告警與 iframe sandbox 不在 overlay 清。

**理由**：dependency-freshness 已對 pytest 8 下限紅燈；簡中 CONTRIBUTING 的 `src/` 會讓跟著走的人撞 `guard.ts`。產品 spawn／預覽模型是上游取捨，改它等於改產品安全契約，需要回貢授權。

**限制**：

- 不 pin 產品 `ci.yml` 的 action 版本。
- 不關閉、不「處理」CodeQL 32 筆 alert。
- 不推進 `reviewed_pr_through`／`reviewed_issue_through`。

**後續**：同日「審查可修項落地」已 pin 產品 `ci.yml` 的 checkout／setup-node SHA；pnpm 指令字串仍不動。

## 2026-08-28：不修 Windows symlink 單元測試

**決定**：接受 `install-rejections.test.ts` 在未開 Developer Mode 的 Windows 上 `fs.symlink` EPERM。overlay gate 不跑 vitest。

**後續**：2026-08-28「審查可修項落地」已改用手搓 ustar，不再呼叫 `fs.symlink`。

**理由**：這是產品測試對 Unix symlink 的假設，不是 overlay 能最小修的範圍。Ubuntu `ci.yml` 仍覆蓋該案例。若要修，應送回上游並在當次對話取得回貢同意。


## 2026-08-29：上游檢查補上 PR 與 issue 兩個面向

**決定**：`tools/check_upstream_updates.py` 補上以 `--state all` 收集上游 PR／issue 的邏輯，
`upstream-check.yml` 補 `GH_TOKEN: ${{ github.token }}`，並新增 `tests/test_upstream_updates.py`。
**不**補 `reviewed_pr_through`／`reviewed_issue_through`。

**理由**：`docs/fork/UPSTREAM.md` 早就寫著「四個面向都要看」，但檢查器只讀 commit 水位，PR／issue
沒有程式在看，排程報告卻是綠的。把收集補上，那兩個面向才真的被排程檢查。水位不補，是因為 triage
真的還沒做——寫上數字會把未分類的待辦洗成已審查。

**代價（已知且刻意）**：缺水位＝0，所以每週的 upstream-check 會列出整份上游 PR／issue 清單並回
exit 1，在 triage 做完之前這支檢查是紅的。這是真實狀態，不是故障。

**觸發條件**：做完初次 triage、逐筆理由寫進本檔之後，才把水位寫進 baseline，紅燈才會消失。


## 2026-08-30：初次上游 triage 完成，三個面向水位一起落地

先前 baseline 刻意留空 PR／issue 水位（「真的還沒逐筆讀」）。本輪做完。

### commit 軸：已在上游 tip

`c3120454` 之後上游 **0 個新 commit**，本 fork 就在 `upstream/main` 的 tip 上。

### 本 fork 與別的 overlay-only fork 不同：它有分歧的產品程式碼

`git diff refs/upstream-check/main HEAD` 顯示本 fork 動過 **14 個 `next/src/lib/` 底下的產品檔**
（`deck.ts`、`hyperframes.ts`、`export/*`、`skills/*`、`templates/loader.ts`）。所以
`diagram-design` 那套「產品碼與上游相同，被拒收的 PR 不可能在修本 fork 的缺陷」的結構性論證
**在這裡不成立**——必須逐筆對照。

### PR 軸：76 筆，水位推進到 145

| 分類 | 筆數 | 判定 |
| --- | --- | --- |
| MERGED | 36 | 已在 `upstream/main`，而本 fork 就在 tip 上，內容已在 |
| OPEN | 27 | 還不是上游狀態；本 fork 只在自己痛的時候才提前引用 |
| **CLOSED 未合併** | **13** | 逐筆比對與本 fork **分歧檔**的重疊，見下 |

13 筆裡有 **10 筆與本 fork 改過的檔零重疊**（`#25`／`#41`／`#42`／`#45` 是 DeployControl 的
無限重繪、`#51`／`#90`／`#92` 是 Codex／OpenCode 輸出管線、`#75`／`#80` 是 CLI 工具、`#124`
是文件潤飾）。本 fork 沒有動那些檔，上游也拒收了，沒有可引用的內容。

有重疊的三筆逐一查過：

| PR | 重疊檔 | 判定與證據 |
| --- | --- | --- |
| `#119` preserve zero data-duration | `hyperframes.ts` | **已涵蓋**。上游改以 `#118`／`#120` 合併，本 fork 在 tip 上所以已有。實查本 fork：`parseOptionalDuration` 用 `Number.isFinite` 所以 `0` 會通過，取值用 `meta?.duration ?? dataDur ?? marker.duration ?? 3000`（`??` 不是 `||`，`0` 不會被吃掉），而且 `__tests__/hyperframes.test.ts` 有三條 issue #110 的回歸測試 |
| `#106` restore i18n localization with English default | `templates/loader.ts` | **不引用**。它把 `${meta.zhName} 示例` 改成 `${meta.enName} Example`，也就是把預設語言改成英文。上游拒收；本 fork 是繁中維護線、預設中文正是想要的。本 fork 對同一檔的改動是 skill-id 驗證強化，與此無關、不衝突 |
| `#127` server-backed project workflow | `deck.ts` | **不引用**。60 檔的功能提案（把專案流程改成後端支撐），上游未採納。本 fork 對 `deck.ts` 的改動是 12 行的 `escapeAttr`／`stripTags` 強化，與該提案無關。引用一個 60 檔的未採納架構變更，會讓本 fork 背上一條上游不維護的分支 |

**觸發條件**：`#106` — 本 fork 哪天要做英文介面時重評；`#127` — 上游採納或本 fork 需要後端流程時。

### issue 軸

上游 issue 是產品的功能請求與使用問題（Hermes 支援、WSL agent 偵測、PPT 匯出、
中文使用回報等）。本 fork 的分歧只在上述 14 個檔，這些 issue 都不落在那些檔的行為上；
真正成立的缺陷修正會經由 commit 軸抵達。

## 2026-09-30：第二輪上游審查（commit 至 553ed98、PR 至 #159、issue 至 #158）

### commit 軸（1 筆）

- **採用** `553ed98` #129 MiniMax 模型加入 picker：4 檔 +63 行，只加模型清單與測試。本 fork 對應檔 `next/src/lib/agents/detect.ts`、`cli/src/agents-detect.ts` 不在 14 個分歧檔內，`cherry-pick -x` 無衝突（本 fork SHA `ff1444b`）。驗證：`cli` 的 `tsc --noEmit` 對非測試原始碼無錯誤；本機未安裝 vitest，新增的 vitest 測試未在本機執行，由上游 CI 涵蓋。

### PR 軸（9 筆，#146 至 #159）

分歧檔（`deck.ts`、`clipboard.ts`、`hyperframes.ts`、`skills/install.ts` 等）與這 9 筆改動的檔案零重疊，全部只碰 `agents/`、`use-convert`、settings／welcome modal、文件。

- **採用待辦（adoption pending: 上游尚未合併且需 vitest 與 UI 驗證，本機無法驗證）**：#149 Codex 生命週期處理（issue #148）、#153 copilot/qwen/bob 重複 payload 只發一次 delta、#159 use-convert 批次 SSE（issue #158，記憶體耗盡）。觸發條件：上游合併後隨 commit 軸抵達。
- **不適用**：#146（OPEN）、#147（CLOSED，#146 的重複）OpenClaw 多行 prompt；#150 Grok Build 偵測、#157 ZCode adapter（新 agent，本 fork 不使用）；#154、#155 Memcode 整合（上游專屬服務）。

### issue 軸（4 筆，#148 至 #158）

- #148、#158：對應 #149、#159，見上。
- #152（匯出 HTML 分頁顯示錯誤的使用回報）、#156（社群 Windows 桌面版連結）：不適用；#152 無重現與對應修正，觸發條件為上游出現修正 PR。
## 2026-10-10：安全依賴覆寫與 Next 修補

- `source-map-js` 安全下限併入 `pnpm-workspace.yaml` 的既有覆寫；根目錄 `package.json` 不另設 `pnpm.overrides`，避免遮蓋原有七項安全下限。保留 image-size 2.0.4、PostCSS 8.5.28 與其他既有解析版本。
- Next 16.3.6 更新至 16.3.8，包含官方 SSRF、快取與資訊洩漏修補；同版 `@next/env`／SWC 隨 lock 更新，React 與其他 manifest 範圍不變。官方版本說明：<https://github.com/vercel/next.js/releases/tag/v16.3.8>。
- frozen install、app typecheck、186 項 app 測試與 build 通過。既有 Windows fork gate 的 40 項測試、guard 與 e2e typecheck 已通過；此輪沒有執行 Playwright 產品 e2e。
- 原始 `pnpm audit` 仍以 workspace 路徑 `cli`／版本 0.1.0 回報 GHSA-6cpc-mj5c-m9rq。實際 private workspace 名稱是 `@html-anything/cli`，沒有安裝 npm `cli`，lock 的 registry package keys 與 `pnpm why -r cli` 均無此套件。該告警的官方身分為 npm `cli`（來源 chriso/cli），不是此 workspace：<https://github.com/advisories/GHSA-6cpc-mj5c-m9rq>。
- 將 lock 中所有 registry 套件／版本送至 npm 官方 bulk advisory endpoint，結果為空（0 項）。保留原始 audit 的非零退出與錯配證據，不新增忽略規則、不修改 audit 閘門，也不宣稱原始 `pnpm audit` 已歸零。
## 2026-10-10：上游 PR #161／issue #160 逐筆審查

### PR #161：Antigravity agent adapter（延後採用）

- 實讀 open、非 draft PR 完整 9 檔 diff；head `26aacf9e3cb8cc6ecfe96e033f86fd9e0c2f5fe5`，base `553ed98c283f9c0f489902d035416a972d6a9699`。來源：<https://github.com/nexu-io/html-anything/pull/161>。
- 變更是新增功能：兩份 detect 註冊 `agy`／`ANTIGRAVITY_BIN`，兩份 argv/parser 增加 `init`／`step_update`／`result`、工具 HTML rescue、usage 轉換與 result 去重，另修改 invoke 註解、測試、README。沒有現有匯出或 Windows spawn 缺陷修補。
- 本 fork `next/src/lib/agents/invoke.ts` 使用 `cross-spawn`、`shell: false` 處理 Windows shim，PR 的尾端 `-p`／prompt 路徑與此契約相容；但新 adapter 固定 `--effort medium` 與權限參數，新增測試多為 parser／mock，沒有本 fork Windows `agy` 的真實協定驗收。本輪不為新增 adapter 啟動外部模型或登入。
- **重評條件**：上游合併此 head 或維護者要求使用 `agy` 時，核實實際 CLI 的上述 flags、Windows shim、model 透傳、session／usage 與最終 HTML 去重；維持本 fork cross-spawn 邊界後再採用。原 README 的 fork overlay 與英文產品說明須保留。

### Issue #160：小紅書 PNG 被截斷（裁切缺陷已本機修補，待審查發布）

- 實讀 issue 本文、全部 2 則留言及關聯 issue #84；#160 timeline 無 cross-referenced PR，PR 搜尋亦無 #160／#84 關聯修補。來源：<https://github.com/nexu-io/html-anything/issues/160>。上游留言是線索，以下結論另以本 fork 原始碼核實。
- `next/src/lib/export/image.ts` 的 `iframeToBlob` 預設 scale 2，`safeMax = floor(16000 / scale)`，以 `Math.min(layoutHeight, safeMax)` 擷取；高於 8000 CSS 像素的內容仍回傳成功 blob，會靜默遺失下方內容。這是本 fork 的真實缺陷，**不能列為已修復**。
- `next/src/components/export-menu.tsx` 僅在 `parseDeck(...).isDeck` 時提供 `exportDeckPngZip`；普通堆疊卡片不會自動分張。這是另一个卡片分割功能缺口，不等同 PNG 截斷；issue #84 的其他 absolute-slide 高度問題不可直接套一行修補當作 #160 已解決。
- **最小修補範圍**：`next/src/lib/export/image.ts` 與對應新增 image unit test、`e2e/ui/export-menu.test.ts`。至少保證超限內容不會被截斷後仍報成功：以明確可測策略保留全內容（例如有界自動降低 scale），或明確拒絕超限並指示分頁／分張，不能單純移除 canvas 上限。測試涵蓋超高 HTML 尾端、正常短頁、原始 iframe style 成功／失敗還原；用一筆無外部登入的 browser fixture 驗收。若要普通卡片逐張 ZIP，需另界定卡片標記、修改 export-menu／卡片 parser 與相應 e2e，不在此次文件 triage 中擅自新增產品契約。
- **重評／執行條件**：立即交由產品修補 lane 完成上述最小範圍；取得實際修補與驗收證據前保持未完成狀態。若上游提供 patch，先按此原始碼與測試契約審查再採用。

本輪只完成這兩項審查，PR 水位 159 → 161、issue 158 → 160；commit 水位 `553ed98c283f9c0f489902d035416a972d6a9699` 不變。水位表示已審查，不表示產品缺陷已修復。

#### #160 裁切缺陷的本機修補與驗收

- `iframeToBlob` 保留 scale 2 與每邊 16,000 像素的單張安全限制；安全尺寸使用完整 layoutHeight，超高／超寬或使用者指定較小 maxHeight 時明確報错，沿用選單 error toast，不下載部分圖、不顯示成功。較大的 maxHeight 不能繞過安全上限；scale／maxHeight 必須為正且有限。不新增普通卡片分張 ZIP，也不自動降低圖片品質。
- 將暫改 iframe height／html overflow／body overflow 與等待重排全部移入同一 `try/finally`，包括重排排程與 renderer 失敗都還原原始 inline styles。
- 17 項 image focused unit tests 通過，涵蓋短頁、8000 CSS px 邊界、超限不 render／download、指定 maxHeight、安全上限、超寬、非法參數與成功／兩種失敗的還原。app 與 e2e typecheck 通過。
- Chromium 使用既有 export-menu seedStore 一筆 `PNG-160-smoke` fixture：超高頁顯示明確錯誤且沒有 download／成功 toast；同一 fixture 改成安全尺寸後，下載 PNG 高度符合瀏覽器實際量測（包含文字溢出），尾端紅色像素為 `[255,0,0,255]`。其餘 3 個 export-menu 案例通過。首輪固定 400px 預期與第二輪固定 1000px 預期不符瀏覽器 layout；改成實際尺寸與尾端像素驗收後，只重跑該失敗案例，未重跑已通過的 186 項 app／40 項 Python 全套。
- 此為本機未提交成果，仍需 fresh review、發布與 exact-SHA CI；普通堆疊卡片自動分張仍是上述另一項未採用功能缺口，不宣稱 issue 的所有功能要求皆已新增。
