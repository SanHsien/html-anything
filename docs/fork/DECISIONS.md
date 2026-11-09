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

**理由**：維護者這次對話要求「可修的都修、先不考慮回貢」。spawn CLI、iframe `allow-scripts allow-same-origin`、英文 README 行銷數字仍屬產品契約，維持不改。

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

## 2026-10-24：依賴安全修補（Dependabot #66–#68 與 audit 高／嚴重項）

- Dependabot #66–#68（vite，`pnpm-lock.yaml`，launch-editor 三筆，修補版 8.3.3）：vite 是 vitest 的 peer（`autoInstallPeers`），pnpm 不會因 override 重解析既有 lock 的 peer，單靠 `pnpm update` 或 `overrides` 都留在 8.3.1。做法是在 `cli`／`next` 各加 `vite ^8.3.5` devDependency（vitest 4.1.12 的 `@vitest/mocker` 本身要求 peer `vite ^8.3.5`），lock 只剩 8.3.5。
- 同批原始 `pnpm audit` 的其他項：`vitest` ^4.1.12（`@vitest/mocker` 4.1.12）、`dompurify` ^3.4.17、`undici` override 下限 `^6.29.1`、`next` 16.3.8 → 16.4.1（audit 列 2 critical + 1 high；官方版本說明 <https://github.com/vercel/next.js/releases/tag/v16.4.1>）、`happy-dom` ^20.9.0 → ^21.0.4（high，僅 next 測試環境 devDependency）。
- 這些都是真依賴，沒有「parent 自帶 bundle」的情況：`pnpm why` 與 lock 的 resolution 都指向 registry 套件，修補後 lock 內舊版已不存在，因此不是只讓掃描器變綠。
- 驗收：`pnpm install --frozen-lockfile`、guard、next／e2e typecheck、next 203 項測試、next build 通過；`tools\dev_check.ps1` 綠。`pnpm audit` 只剩 low 的 `cli`（見上一輪：workspace 名稱錯配，非真實依賴）。cli workspace 的 16 項測試在 Windows 本機與修補前基線同樣失敗（POSIX 路徑假設），CI 不跑 cli 測試。
- 本機從 Git Bash 執行測試時 PATH 上的 GNU tar 會讓 `skills` 相關 16 項測試因 `C:` 路徑失敗，與依賴無關；把 `C:\Windows\System32` 放在 PATH 前面（bsdtar）即 203/203。**後續**：2026-11-10 確認是產品缺陷（上游 #164），已修，見 2026-11-10 段。
- 未執行 Playwright 產品 e2e；由 PR 的 CI 驗證。

## 2026-10-24：上游審查至 975fb3b／PR #162（commit 4 筆、PR 1 筆）

上游與本 fork 沒有共同祖先（`git merge upstream/main` 回 unrelated histories），所以逐筆 cherry-pick。

| 項目 | 結論 | 證據 |
| --- | --- | --- |
| `975fb3b` Codex 生命週期（#149） | **採用，手工解衝突** | `invoke.ts` 衝突：本 fork 以 `cross-spawn` 啟動並把子行程存在 `activeChild`（`next/src/lib/agents/invoke.ts:196`），上游寫 `child`；改成沿用 `activeChild`，其餘照上游（stderr 逐行 `sanitizeAgentStderrLine`、`close`／abort 時 `flushStderr`）。`argv.ts`、`use-convert.ts` 與測試無衝突 |
| `ce50359` WeChat 貼上內聯 computed style（#94） | 採用 | `wechat.ts`、`clipboard.ts`、`export-menu.test.ts` 自動合併無衝突；本 fork 在 `clipboard.ts` 的差異（圖片匯出）不在同一段 |
| `94137b2`、`597960c` README | 採用 | 只動英文 `README.md` 與 `README.zh-CN.md`，保留頂部 overlay |
| 上游 PR #162（MiniMax 模型清單） | **不採用，未合併** | 仍是 open；改 `detect.ts` 模型清單並移除 `MiniMax-M2.7`，新增的 `minimax-invoke.test.ts` 用 `vi.mock('node:child_process')`，本 fork 走 `cross-spawn`，照抄會讓測試失效。模型名稱是否存在無法在本機驗證。**重看條件**：上游合併後經 commit 軸抵達時，再逐檔對照 |
| 上游 issue | 無新項目 | 水位維持 #160 |

水位推到 `975fb3bcb98f1777781fb4c738902d36e32c8c46`／PR #162／issue #160。水位代表「已審查」，不代表 #162 已處理。

同批原本把 `requirements-dev.txt` 的 `ruff` 下限 0.16 → 0.17 來消除新鮮度紅燈；這違反「不得靠提高下限消紅燈」，已改回 `ruff>=0.16  # freshness-hold: …`（`ruff check --select E9,F tools tests` 在 0.16.10 與 0.17.2 皆通過，程式不需要 0.17）。

## 2026-10-30：查明 Dependabot 歷史升級失敗原因（vite 與 source-map-js 四個 run）

**背景**：`ROADMAP.md` 列出歷史上 Dependabot `npm_and_yarn in /. for vite - Update` 失敗 3 次（run 39534396371、39580268072、39581085662；job #1641315781、#1642233351、#1642247854），`for source-map-js - Update` 失敗 1 次（run 37601207401；job #1614936085）。日誌未記錄失敗具體原因，本輪逐筆調閱失敗日誌查明並記錄。

### 失敗日誌查明結果（`gh run view <run ID> --log-failed`）

- **run 37601207401**（2026-10-07，job #1614936085，`source-map-js`）：
  - 失敗類型：`security_update_not_possible`。
  - 錯誤明細：`dependency-name: "source-map-js"`, `latest-resolvable-version: "1.2.1"`, `lowest-non-vulnerable-version: "1.2.2"`。
  - 原因：`source-map-js` 當時為間接依賴，Dependabot updater 無法在既有 `pnpm-lock.yaml` 解析邊界下自動跨過 1.2.1 安裝修復版 1.2.2。
  - 後續處理：維護者已於 2026-10-10 在 `pnpm-workspace.yaml` 加入 `source-map-js: ^1.2.2` 覆寫（見本檔 2026-10-10 段），lock 內舊版已被完全取代。
- **run 39534396371**、**run 39580268072**、**run 39581085662**（2026-10-21，job #1641315781、#1642233351、#1642247854，`vite`）：
  - 失敗類型：`security_update_not_possible`。
  - 錯誤明細：`dependency-name: "vite"`, `latest-resolvable-version: "8.3.1"`, `lowest-non-vulnerable-version: "8.3.3"`。
  - 原因：Dependabot 嘗試修補 Dependabot alert #66（CVE-2026-112943）、#67（CVE-2026-112944）、#68（CVE-2026-112942），要求 `vite >= 8.3.3`。日誌顯示 job 設定為 `allowed-updates: dependency-type: direct` 與 `update-subdependencies: false`，`conflicting-dependencies: []`；當時 `vite` 不是任何工作區的直接依賴（經由 `vitest` / `@vitest/mocker` 帶入），所以 Dependabot 不會改動它，解析結果停在 8.3.1，3 次重試皆報 `security_update_not_possible`。（「peer dependency 未被重新解析」是推論，日誌沒有直接寫出。）
  - 後續處理：維護者已於 2026-10-24 在 `cli` 與 `next` 工作區明確加入 `vite ^8.3.5` devDependency（見本檔 2026-10-24 段），使 lock 內 `vite` 唯一解析為 8.3.5，GitHub Dependabot alerts #66–#68 狀態已轉為 fixed。

### 遠端現況與不另開更新之理由

- 執行 `gh api repos/SanHsien/html-anything/dependabot/alerts?state=open` 確認目前 open alerts 為 0 筆。
- `gh run list --repo SanHsien/html-anything --limit 100 --json name,conclusion,createdAt` 中最新的 `npm_and_yarn` run 停留在 2026-10-21 的上述失敗 run。理由是 Dependabot 安全更新僅在有未修復安全漏洞時觸發；由於上述漏洞已由 2026-10-10 與 2026-10-24 的維護提交在 `main` 徹底修復，GitHub 自動關閉通告，不再派發安全更新任務。
- 一般依賴更新則按 `.github/dependabot.yml` 排程（每週一 06:00 Asia/Taipei）運行，故無需人為觸發無實質更新的 dummy job。

## 2026-11-05：保留 pytest 相容下限，以政策 hold 處理新鮮度

- 新鮮度檢查只讀 `requirements-dev.txt`；首次 strict 檢查 exit 1，pytest 宣告 9.1、PyPI 現行 9.2.0，ruff 宣告 0.16、現行 0.17.3（已有 hold）。沒有既有 dependency-deferrals.json。
- 裁決 (b)：保留 `pytest>=9.1`，行末補 `freshness-hold`；這是持續支援 9.1 的相容政策，不是延期安裝 9.2。無上限的宣告仍允許現行版；測試開始使用新版專屬 API 或設定時重新評估。不得僅為消除新鮮度告警提高下限。官方版本說明：<https://docs.pytest.org/en/stable/announce/release-9.2.0.html>。
- ruff 延用 2026-10-24 的 (b) 裁決，不提高 0.16 下限；本輪以現行 0.17.3 通過 E9,F，既有 0.16.10 相容證據仍見前文。
- 驗收：pytest 9.1.0 與現行 9.2.0 各跑 `pwsh -NoProfile -File tools/dev_check.ps1`，均通過 37 項測試、E9,F、compileall 與 13 份文件連結；修改後 strict 新鮮度 exit 0，兩項均為 HELD。工具與測試程式、產品依賴及 workflow 均未修改。

## 2026-11-06：Public checks 改釘 `ubuntu-24.04`

- 現象：`ubuntu-latest` 換成 Ubuntu 26.04（runner image `ubuntu26/20261101.186`）後，`Install Playwright browser` 步驟失敗：`Playwright does not support chromium on ubuntu26.04-x64`（`e2e` 鎖定的 `@playwright/test` 為 1.60.0）。11-02 在 24.04 映像上同一步驟通過。
- 裁決：`public-checks` job 改釘 `ubuntu-24.04`，不改測試、不跳過 E2E。這是 runner 相容性處理，與產品依賴無關。
- 重審條件：升級 `@playwright/test` 到官方支援 Ubuntu 26.04 的版本後，改回 `ubuntu-latest` 並以 CI 驗證；或 GitHub 宣布 `ubuntu-24.04` 退役時。

## 2026-11-07：`safeProjectLabel` 去掉頭尾 `-` 改用逐字元掃描

- 現象：CodeQL #38（`js/polynomial-redos`，high）指向 `next/src/lib/deploy/vercel.ts` 的 `.replace(/^-+|-+$/g, "")`，這段程式從上游原樣帶進來。
- 裁決：改成 `trimDashes()` 從頭尾逐字元掃描，輸出規則不變：小寫、連續 `-` 合併成一個、截到 80 字、頭尾不留 `-`、什麼都不剩就用隨機名稱。新增 `next/src/lib/deploy/__tests__/vercel-name.test.ts` 釘住這些規則，並測 10 萬個 `-` 的輸入要在 1 秒內完成。前例是 2026-08-28 把 marketplace id 驗證改成拆解、不用單一 regex；這次同樣不碰產品契約，不送上游。
- 驗證：本機 vitest 4 條全過，`tsc --noEmit` 通過，`tools\dev_check.ps1` 綠。CodeQL 告警不手動關閉，等下次掃描自動結案。
- 重審條件：上游自己改了這個函式時，改採上游版本。

## 2026-11-10：上游審查至 PR #207／issue #188（commit 0 筆、PR 38 筆、issue 6 筆）

起點：`Upstream check` 2026-11-09 failure。`python tools/check_upstream_updates.py --strict` 回 exit 1，commit 軸 `975fb3b` behind 0，PR 軸 38 筆（#163 至 #207，缺 #164、#166、#170、#178、#186、#188 這幾個 issue 號）、issue 軸 6 筆（#164、#166、#170、#178、#186、#188）。`git ls-remote upstream refs/heads/main` 仍是 `975fb3bcb98f1777781fb4c738902d36e32c8c46`，所以沒有任何東西經 commit 軸抵達。

### PR 軸分佈（`gh api repos/nexu-io/html-anything/pulls` 實查，base 分支分類）

| base | 數量 | 狀態 | 項目 |
| --- | --- | --- | --- |
| `main` | 3 | 2 open、1 draft | #163、#165、#167 |
| `feature/motion` | 25 | 16 merged、7 open、1 draft、1 closed 未合併 | #168、#169、#171、#172、#174、#175、#176、#177、#179–#184、#187、#189、#191、#193、#196、#198–#200、#202、#205、#206 |
| `refactor/odsuite` | 9 | 8 merged、1 open | #185、#190、#192、#194、#195、#201、#203、#204、#207 |
| `optimize-readme-56f71a6f` | 1 | open | #173 |

「merged」是合進上游的**非 main 分支**；`main` 沒動。`feature/motion` 與 `refactor/odsuite` 是 OpenMotion 影片編輯器（`studio/`、`web/`、`template-library/`、`packages/`、`apps/`、`suites/`）的開發線，不是 html-anything 產品。

### 逐項結論

| 項目 | 結論 | 證據 |
| --- | --- | --- |
| #163 Hermes adapter（open，base `main`，head `7947d4830bd626abc83f503404828386215975fd`） | **延後** | 完整 5 檔 diff 已讀（`argv.ts`、`detect.ts`、`invoke.ts` 與兩個測試，+71/−16）。把 `hermes` 從 `acp`（不可呼叫）改成 `argv`：`buildArgv` 回 `["-z", ...model]`，stdout 當純文字 delta。`invoke.ts` 那段「`.exe` 不走 shell」的修正對本 fork 無效：本 fork 的 `invoke.ts` 已用 `cross-spawn`、`shell: false`（見 2026-10-10 #161 條目）。本機 `hermes --help` 確認 `-z, --oneshot PROMPT` 存在（v0.23.0），但 PR 未合併，且新增 adapter 需要真實 `hermes -z` 端到端驗收，不為此啟動外部模型。**重看條件**：上游合併到 `main` 經 commit 軸抵達時，逐檔對照 `activeChild` 與 `cross-spawn` 後採用 |
| #165 README roadmap／status 同步（open，base `main`，head `18aa8fc24cac8325436247dc4e6123461d99ebd9`） | **延後** | 完整 2 檔 diff 已讀（`README.md`、`README.zh-CN.md`，各 +7/−7），只改 Roadmap 與 Status 表的勾選與狀態字樣，不含程式碼。其中「Skill marketplace ✅ stable — Windows GNU tar」一句對應 issue #164，本 fork 已另行修掉（見下）。**重看條件**：合併到 `main` 後隨 commit 軸抵達，保留頂部 overlay 採用 |
| #167 把 OpenMotion 搬到 repo root（draft，base `main`，head `3e67e29c1ee6955841f6763f4acb69933c718390`，head 分支就是 `feature/motion`） | **不採用，高風險監看** | GitHub files API 在 3000 檔截斷（api 回報 +365322/−56695；`studio/` 1859、`web/` 521、`next/` 314、`docs/` 59）。與本 fork 檔重疊 357 個，包含 `.gitattributes`、`.github/workflows/ci.yml`、`.gitignore`、`AGENTS.md`。這是以另一個產品取代 `main` 的根目錄，與 issue #166「standalone OpenMotion replacing the existing application at the repository root」一致。若合併，`next/`、`e2e/`、`cli/`、`scripts/guard.ts` 都會被改寫。**重看條件**：#167 或其 head 合併進 `main`（commit 軸出現大量變更，或 `reviewed_through` 後 `git ls-remote` 的 `main` 移動）時，不得用 cherry-pick 慣例逐檔處理，先決定本 fork 要不要跟進（fork 可以停在 `975fb3b`），再動 `AGENTS.md`、CI 與 guard |
| #168、#169、#171、#172、#174、#175、#176、#179–#184、#187、#189、#191、#193、#196、#198–#200、#202、#205、#206（`feature/motion`） | **不採用** | base 不是 `main`，`main` 沒有這些內容。檔案清單與新增行逐一掃描：只動 `studio/`、`web/`、`skills/`（OpenMotion 的 Skill）、`docs/`、`tests/`、`scripts/`、`.github/` 與根目錄的 OpenMotion 檔案。與本 fork 產品檔（`next/src/lib/` 的分歧檔）零重疊；與本 fork 同名檔的重疊（files API 逐 PR 比對 `git ls-files`）只有 `.gitattributes`、`.gitignore`、`AGENTS.md`、`CONTRIBUTING.md`、`CONTRIBUTING.zh-CN.md`、`README.md`、`README.zh-CN.md`、`.github/workflows/ci.yml`、`package.json`，而這些檔在 `feature/motion` 上指的是 OpenMotion 的版本（含 `README.md`，有 15 個 PR 改它，如 #172、#202）；`next/` 零重疊。#183 closed 未合併 |
| #185、#190、#192、#194、#195、#201、#203、#204、#207（`refactor/odsuite`） | **不採用** | 同上，base 不是 `main`。#185 是 3000 檔截斷的 odsuite 搬遷（api 回報 +46986/−365639），其餘是 `packages/`、`apps/`、`suites/` 內的小改。與 `next/` 零重疊；同名檔只有 `.gitignore`、`AGENTS.md`、`CONTRIBUTING.md`、`CONTRIBUTING.zh-CN.md`、`README.md`、`README.zh-CN.md`、`package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`.github/workflows/ci.yml`（OpenMotion 版本） |
| #173（base `optimize-readme-56f71a6f`）、#177（base `feature/motion`，head 同名分支） | **不採用** | #173 +3377/−2885、136 檔（`docs/` 73、`examples/` 58），#177 +191835/−449、470 檔（`library/` 210、`docs/` 184、`template-library/` 52）。兩者是 OpenMotion 的 README／範例庫提案，#177 內另有 `README.REVERSE-ENGINEERING.md` 自述為替代 README 提案。與 `next/` 零重疊 |

隱藏內容掃描（對所有 PR 的 files API patch 之**新增行**）：零寬字元（`U+200B`–`U+200F`、`U+202A`–`U+202E`、`U+2060`–`U+2064`、`U+FEFF`）、`ignore previous／prior` 類提示注入字樣、`curl|bash`、`iwr|iex`、`dangerously` 旗標。結果：新增行只有三類命中，沒有隱藏指令；HTML 註解（`<!-- ... -->`）都是 OpenMotion 範例 HTML 與測試夾具的一般註解。命中的三類：#167 新增行含 2 個 `U+200D`（零寬連接符），上下文是 emoji 組合序列，不是隱藏文字；#168 `README.zh-CN.md` 一行安裝說明 `curl -fsSL https://raw.githubusercontent.com/nexu-io/html-anything/feature/motion/install.sh | bash`（文件文字，指向 `feature/motion` 的安裝器，未執行、未採用）；#185 `suites/guard/tests/style.test.ts` 一個測試字串 `dangerouslySetInnerHTML`（guard 測試夾具）。#167 與 #185 的 files API 被 GitHub 截在 3000 檔，截斷之後的檔案**未掃描**；#163、#165 為整份 `gh pr diff` 逐行閱讀，其餘為 files API 的 patch 加腳本掃描，不是逐行閱讀。

### 開 PR 的 head（讀取當時）

open 的 13 筆：#163 `7947d4830bd626abc83f503404828386215975fd`、#165 `18aa8fc24cac8325436247dc4e6123461d99ebd9`、#167 `3e67e29c1ee6955841f6763f4acb69933c718390`、#173 `31377f82cf93041cc59b6fcbfb2883e1a8e77ad7`、#175 `ffc9529581646a542ea2da9e9690171b367b4593`、#177 `8f34715ef74e8eb85fc84218dbe0efd9689ee832`、#180 `a09c5d2c4e5aa5c2d4a9487b7fc0dddb4fa4415f`、#193 `73ab4be0b0b55809cb14a7e2eed50efb67abe12b`、#198 `0b0d2abad3b7a3972eae2cdf790bf8b9e0fe99a2`、#202 `f54e609ad45d371bed0d4b5dde53c9fce50b9cfd`、#205 `b69eeab8dab7cec93496077a71a2e24476e68da4`、#206 `81694fa389eefc7b722ccf30c2ccb779bff05fe5`、#207 `40e8602193476e3c67fa4e06dab531aa33324be4`。

### Issue 軸（6 筆）

| 項目 | 結論 | 證據 |
| --- | --- | --- |
| #164 Windows 上 GNU tar 優先時 marketplace 安裝失敗（open，0 則留言） | **移植（本 fork 自行修，不等上游）** | 在本 fork 重現：`next/src/lib/skills/install.ts` 的 `extractTarball` 把 Windows 絕對路徑 `C:\…` 當 `tar -xzf` 的檔案運算元交給 `spawn("tar", …)`，GNU tar（Git for Windows，本機 PATH 上第一個）把 `C:` 當遠端主機，報 `Cannot connect to C: resolve failed`。2026-10-24 已記過「Git Bash 的 GNU tar 讓 16 項 skills 測試失敗，與依賴無關」，當時當成跑法問題；實際上那是產品缺陷，只是測試夾具也踩到同一個坑所以沒人在 CI 以外的環境看到它。修法見下 |
| #166 搬遷 OpenMotion 到 repo root | 不採用 | 對應 PR #167，見上 |
| #170 共享已發佈的 Motion 範本目錄（closed） | 不採用 | `feature/motion` 工作，對應 #171、#181、#200 |
| #178 Motion 編輯器 11 語系 | 不採用 | `feature/motion`，對應 #179 |
| #186 Motion 完整 npm 測試套件 | 不採用 | `feature/motion`，對應 #187、#205 |
| #188 Motion 預設開啟的分析與 GeoIP | 不採用 | `feature/motion`，對應 #189。**重看條件**：若 #167 合併進 `main` 而本 fork 決定跟進，預設開啟的遙測（PostHog、粗略 GeoIP）要先決定是否採用，不隨根目錄替換一起帶入 |

### #164 的移植：先紅後綠

- 新增 `next/src/lib/skills/__tests__/install-drive-path.test.ts`，名稱「extracts a tarball without handing tar a drive-letter archive path」。tarball 用既有 `ustar.ts` 在行程內組出，不呼叫系統 tar，所以唯一的 tar 呼叫就是被測的 `extractTarball`。
- 修前（`tar --version` = GNU tar 1.35，在 PATH 第一個）：`pnpm -F @html-anything/next exec vitest run src/lib/skills/__tests__/install-drive-path.test.ts` 失敗，`InstallError: tar exited 2: tar (child): Cannot connect to C: resolve failed`。
- 修法：`extractTarball` 以 `cwd: path.dirname(tarPath)` 啟動，檔案運算元只傳 `path.basename(tarPath)`；`-C` 目標目錄不是 `host:path` 運算元，維持絕對路徑。沒有用 `--force-local`，因為 bsdtar 不認得這個旗標。
- 同一個坑也在五個測試的夾具建檔（`api`、`cross-device`、`install-rejections`、`install`、`preflight`）：`spawn("tar", ["-czf", outPath, …])`。一併改成同樣的 `cwd` 加檔名寫法，否則這五個檔在 GNU tar 優先的環境永遠紅（修前 `src/lib/skills` 共 16 項失敗）。
- 修後：GNU tar 優先與 `C:\Windows\System32`（bsdtar 3.8.9）優先兩種 PATH，`src/lib/skills` 都是 9 個檔、58 項測試全過。
- 更新 `ROADMAP.md` 維護方式那一行：原本寫「Git Bash 下 GNU tar 不認 `C:` 路徑，屬跑法問題」，現在錯了。
- 回貢立場：不送上游；回貢需維護者在當次對話明確同意。
- 重審條件：上游自行修 #164 時改採上游版本，並移除本 fork 對 `install.ts` 與五個測試夾具的改寫。

水位推到 PR #207、issue #188、`reviewed_date` 2026-11-10；`reviewed_through` 維持 `975fb3bcb98f1777781fb4c738902d36e32c8c46`（commit 軸沒有新東西）。水位代表「已審查」，不代表 #163、#165 已採用。
