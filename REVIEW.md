# 倉庫審查（Windows-first）

- 審查日期：2026-08-28
- 本線審查起點：`2104253e5032c5c8a2a04155ac4ca2b3d8725d86`（fork overlay 落地 commit）
- 上游 `reviewed_through`：`c31204544230578ac814026fecc153c6e36587ae`（未推進；open PR／issue 仍未逐筆讀 diff）
- 修復落地：同日 overlay 修正之後，再落地審查可修項（Windows symlink 測試、CONTRIBUTING overlay、`ci.yml` pin、skill id 驗證、stripTags）
- 主環境：Windows 11、PowerShell、Python 3.14（overlay gate）；產品 CI 仍是上游 Ubuntu `ci.yml`（Node 24 + pnpm）
- 狀態：可繼續當 Windows 維護線。**不是**產品安全審計通過證明。本輪 **不回貢**。

## 結論

這個 fork 適合作為 Windows 本機、給 Agent 維護的 HTML Anything 開發線。產品行為跟隨 `nexu-io/html-anything`：Next app、skill 模板、本機 CLI spawn。本線加上 overlay：頂部 fork 標示、Windows gate、上游追蹤、CodeQL、Dependabot。

根目錄 `README.md` 保持上游英文產品說明。`scripts/guard.ts` 禁止根目錄 `src/`、`app/`、`tests/ui`；fork pytest 放 `tests/`。產品 `ci.yml` 繼續在本 fork 跑，不當成官方-only。

本產品是單人、單機、local-first：`/api/convert` 會以寬鬆權限 spawn 本機 Agent CLI，部署 token 寫進 `~/.html-anything/`。預設 Host allowlist 擋 DNS rebinding；**不要**把預覽 iframe 或 CodeQL workflow 綠燈當成已消毒或零漏洞。

不把 fork 當成第二個官方產品 repo。官網、Discord、星圖與社群仍屬上游。本線 **沒有**獨立模型後端。

本輪 **不回貢**。

## 本輪實證

### Git 與 remote

```text
git rev-parse HEAD
→ 2104253e5032c5c8a2a04155ac4ca2b3d8725d86

gh repo set-default --view
→ SanHsien/html-anything

origin   → https://github.com/SanHsien/html-anything.git
upstream → https://github.com/nexu-io/html-anything.git

LICENSE → Apache License 2.0（仍在 git 追蹤）
git ls-files -s → 無 mode 120000（無 tracked symlink）
git ls-files .env* cookies.txt cookies.json credentials.json *.pem → 空
secret-scanning alerts → 0
```

根目錄 `package.json` 沒有 `scripts`，`devDependencies` 只有 `tsx`；`packageManager` 釘 `pnpm@10.33.2`。`CLAUDE.md` 是一般檔（`100644`），不是 `@AGENTS.md` 指針。

### GitHub Actions（commit `2104253`）

| Workflow | 結果 | URL |
|---|---|---|
| CI（guard / typecheck / vitest / build / Playwright） | **success** | https://github.com/SanHsien/html-anything/actions/runs/33142785904 |
| Fork maintenance（Ubuntu + Windows） | **success** | https://github.com/SanHsien/html-anything/actions/runs/33142785949 |
| Upstream check | **success** | https://github.com/SanHsien/html-anything/actions/runs/33142785922 |
| CodeQL（actions / javascript-typescript / python） | **success**（分析跑完，不是零告警） | https://github.com/SanHsien/html-anything/actions/runs/33142785968 |
| Dependency freshness | **failure** | https://github.com/SanHsien/html-anything/actions/runs/33142786001 |

Freshness 紅燈原因：`pytest>=8.3.0` 對上 PyPI `9.1.1` → `REVIEW UPDATE`。本線 CI 跑 Python 3.14，下限改成 `pytest>=9.1`（兩段版號；與 `ruff>=0.16` 同一套精度規則）。`ruff>=0.16` 對 `0.16.5` 本來就是 OK。

### 本機 overlay gate（本輪可修項落地後）

```text
pwsh -NoProfile -File tools\dev_check.ps1
→ 29 passed、WINDOWS DEV CHECK GREEN

pnpm exec tsx scripts/guard.ts
→ Guard passed.

pnpm -F @html-anything/next typecheck
→ 通過

pnpm -F @html-anything/next test
→ 181 passed / 0 failed（先前 Windows 上那筆 symlink EPERM 已消失）
```

先前 overlay 落地與第一次審查修正時本機曾跑：

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

產品 Ubuntu CI 含 Playwright 已在上表綠燈。本機 **沒有**重跑 Playwright，**沒有**用真實 Agent CLI 做端到端生成，**沒有**對上游開 PR，**沒有**部署到 Vercel。

### 產品面抽查（讀碼，不是滲透）

- `/api/*` 經 `next/src/middleware.ts` + `next/src/lib/security/host-validation.ts` 做 Host allowlist；預設只接受 `127.0.0.1`、`localhost`、`[::1]`。`e2e/ui/host-validation.spec.ts` 有拒絕偽造 Host 的案例。
- Windows 上 spawn `.cmd` 走 `shell: true`；上游註解寫明 prompt 走 stdin 或 `--message`，不插進 shell 字串（`next/src/lib/agents/invoke.ts`）。
- 部署 token 寫 `~/.html-anything/<provider>.json`（chmod 600），不進 git。
- 預覽 iframe：`preview-pane.tsx` / `template-picker.tsx` / `deck-viewer.tsx` 使用 `sandbox="allow-scripts allow-same-origin"`。這組合在瀏覽器裡可以逃出 sandbox；產品預覽需要跑 skill HTML，屬上游取捨，本輪不當成已修好。
- Overlay Python（`tools/`、`tests/`）沒有 `shell=True`、`eval(`、`os.system`。
- `next/src/lib/templates/skills/` 實有 **81** 個 skill 目錄；README 行銷數字仍寫 **75**。`detect.ts` 約 20 個 adapter，README 宣稱 9 個 CLI。這是上游文案落差，英文 README 不改；overlay 文件已改寫 81。

### CodeQL 告警（32 筆 open）

workflow 綠燈只代表分析上傳成功。`gh api repos/SanHsien/html-anything/code-scanning/alerts` 在審查當下回 **32** 筆 `state=open`（`security-extended`）。

Error 級（6）：

| 規則 | 位置 | 本輪判斷 |
|---|---|---|
| `js/command-line-injection` | `agents/invoke.ts`、`agents/detect.ts` | 產品就是要 spawn 本機 CLI；單機信任模型。不在 overlay 改。 |
| `js/path-injection` | `invoke.ts`、`detect.ts`、`templates/loader.ts` | 讀本機 skill／agent 路徑。不在 overlay 改。 |
| `js/incorrect-suffix-check` | `skills/paths.ts` `parsePackageId` | `idx < 1` 已涵蓋 `indexOf === -1`，視為誤報。 |

Warning 級概況：deploy 把本機 token 寫檔再打 Vercel API（符合設計）、skill 安裝寫 tar、HTML／markdown 未完整消毒、測試裡的 GitHub URL 子字串、兩份 `example.html`。**未**逐條當漏洞修，也 **未**關閉 alert。

上游另有未讀的安全向 PR：[`nexu-io/html-anything#131`](https://github.com/nexu-io/html-anything/pull/131)（`fix(security): close 3 RCE chains`）。本輪不合併、不把 PR watermark 往前推。

### 上游 open items（只記編號，未讀 diff）

Open PR 抽樣：#144（draft）、#142、#139、#135、#134、#133、#132、#131。Open issue 抽樣：#138、#136、#130、#128、#126、#123、#122、#117。下次上游審查從現有最小編號開始看。

## 已修 findings

建置輪（overlay 落地）：

| ID | 項目 | 處理 |
|---|---|---|
| R-01 | 無 fork overlay／Windows gate | `FORK.md`、`tools/dev_check.ps1`、`docs/fork/` |
| R-02 | `CLAUDE.md` 在 Windows 不可靠 | 改為一般檔 |
| R-03 | 無上游追蹤 | `upstream-check.yml` + `tools/upstream_baseline.json` |
| R-04 | 無安全回報入口 | `SECURITY.md`；產品漏洞指向上游 |
| R-05 | Issue 會落到產品討論而無導流 | `ISSUE_TEMPLATE/config.yml` 導向上游與 Security advisory |
| R-06 | 無 Dependabot／CodeQL | npm + pip + github-actions；CodeQL 掃 JS/TS、Python、Actions |
| R-07 | Windows vitest 一筆 symlink EPERM | 改用手搓 ustar 產生 typeFlag-2，不再 `fs.symlink` |

本輪審查修：

| ID | 項目 | 處理 |
|---|---|---|
| R-08 | `pytest>=8.3.0` 讓 dependency-freshness 紅燈 | 下限改 `pytest>=9.1`（對齊本線 Python 3.14 與兩段版號精度） |
| R-09 | Issue 模板沒有本 fork CONTRIBUTING 聯絡連結 | `config.yml` 補 `SanHsien/html-anything` 貢獻說明 |
| R-10 | `.gitignore` 未點名常見憑證檔名 | 加 `cookies.txt`、`cookies.json`、`credentials.json` |
| R-11 | 無測試鎖住 tracked symlink | `git ls-files -s` 禁止 `120000` |
| R-12 | 產品 `ci.yml` checkout 未關 persist-credentials | 加 `persist-credentials: false`（不改 `guard.ts` 核對的 pnpm 字串） |
| R-13 | `CONTRIBUTING.zh-CN.md` 仍寫根目錄 `src/lib/...` | 改成 `next/src/...`，並納入 `check_links.py` |
| R-14 | 英文 CONTRIBUTING 示範根目錄 `pnpm dev` | overlay 補 `pnpm -F @html-anything/next`；產品正文示範保留 |
| R-15 | 簡中 export 列寫 `drafts-menu.tsx` | 對齊英文，改 `export-menu.tsx` |
| R-16 | overlay 文件仍寫 75 skills | `FORK.md`／`NOTICE.md`／CONTRIBUTING 改 81；英文 README 行銷數字不改 |
| R-17 | 產品 `ci.yml` 浮動 `checkout@v4`／`setup-node@v4` | pin 當下 v4 SHA；pnpm 契約字串不動 |
| R-18 | CodeQL `js/polynomial-redos` on skill id | `isValidSkillId` 改走 `parseSkillId`／`parsePackageId` |
| R-19 | CodeQL 不完整 stripTags／屬性跳脫 | 迴圈剝標、`escapeAttr`；測試 fakeFetch 改比 hostname |
| R-20 | CodeQL `js/incorrect-suffix-check` | `parsePackageId` 顯式處理 `indexOf === -1` |

## 接受不改

- 不把產品 README 翻成繁中主檔，也不改 README 的「75 skills / 9 CLIs」行銷數字（實測 81 個 skill 目錄、`detect.ts` 約 20 個 adapter）。那是上游產品契約。
- 不在 overlay gate 跑完整 Playwright。那是產品 CI 的工作。
- 現有上游 open PR／issue 本輪不逐筆讀 diff。watermark 不推進。不合併未讀的 [#131](https://github.com/nexu-io/html-anything/pull/131)。
- 不改 `/api/convert` spawn 本機 CLI 的信任模型（CodeQL `command-line-injection`／`path-injection` 多數由此而來）。
- 不改預覽 iframe 的 `allow-scripts allow-same-origin`。改了會動產品預覽契約。
- 不複製 Python 95% coverage／mutmut／Behave 進這個 Next.js repo。
- 不在本輪關閉 GitHub CodeQL alert；修碼後等下次掃描。
- skill 模板裡的 `example.html`（postMessage origin、過大 character class）不改。那是展示用 HTML，不是 runtime。

## 尚未宣稱範圍

- 未在本機重跑 `pnpm -F @html-anything/e2e test`（Ubuntu CI 有跑過 `2104253`；本輪產品測試另跑 vitest）。
- 未驗證任一 Agent CLI 的實際 spawn／SSE。
- 未把剩餘 CodeQL 告警（spawn、deploy 寫檔、example.html）當漏洞逐條關閉。
- 未審計 iframe sandbox 以外、且本輪沒改到的安全面。
- 未把任何產品 skill 模板改成本線風格。
- 未合併或審查上游 #131 及其他 open PR。
