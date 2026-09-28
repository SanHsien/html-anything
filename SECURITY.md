# 安全政策

> **SanHsien 維護型 fork。** 產品漏洞（Next API、agent spawn、sandbox、export、skill 模板）請回報上游 [`nexu-io/html-anything`](https://github.com/nexu-io/html-anything/security/advisories/new)；若該入口不可用，改開上游 private contact，不要先建立公開 Issue。本 fork overlay（`tools/`、`docs/fork/`、workflow）開 [`SanHsien/html-anything`](https://github.com/SanHsien/html-anything/security/advisories/new) 的 Security tab。維護規則見 [`FORK.md`](FORK.md)。

## 支援範圍

安全修正以本 fork 的最新 `main` 為主；上游版本的問題也會視需要回報原作者。本線不承擔官方 SLA。

## 私下回報

請使用 GitHub Security Advisories 的 **Report a vulnerability** 私下回報。不要先建立公開 Issue。

回報請包含影響範圍、重現步驟、受影響版本與最小必要證據。請勿附上真實 API key、cookie、CLI session 或帳號資料。

## 特別注意

- `/api/convert` 會以寬鬆旗標 spawn 本機 coding-agent CLI；`/api/deploy` 會把有憑證的設定寫進磁碟。兩者都只適合單人、單機。預設 Host allowlist 見上游 [`README.md`](README.md) 的 Security 節與 [`next/src/middleware.ts`](next/src/middleware.ts)。
- 不要把 `HTML_ANYTHING_ALLOW_ANY_HOST=1` 設成預設，除非前面有可信任的反向代理在管 Host。
- 使用者生成的 HTML 在 `iframe sandbox` 裡執行；不要把預覽頁當成已消毒的受信任來源。
- 本 fork 不代管任何模型 API key。Agent CLI 複用你本機已登入的 session。
