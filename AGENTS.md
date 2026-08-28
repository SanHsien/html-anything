> **SanHsien 維護型 fork overlay。** `origin` 是 [`SanHsien/html-anything`](https://github.com/SanHsien/html-anything)，`upstream` 是 [`nexu-io/html-anything`](https://github.com/nexu-io/html-anything)。
> 本 fork 的維護規則以 [`FORK.md`](FORK.md) 為準；與下文衝突時以 FORK.md 優先。開發與驗收細節見 [`docs/fork/DEVELOPMENT.md`](docs/fork/DEVELOPMENT.md)。
> 不要推 `upstream`、不要對上游開 PR（除非維護者在這次對話明確同意回貢）、不要把本 fork 包裝成官方產品站。
> 產品行為（Next app、skill 模板、agent adapter、e2e）仍遵守下文上游規則。根目錄 `README.md` 必須保持上游英文產品說明。
>
> **對外只打本 fork：** `gh` 在 fork clone 的預設 repo 就是上游。每個 clone 先跑 `gh repo set-default SanHsien/html-anything`。開 PR 仍明寫 `--repo SanHsien/html-anything`，並讀輸出 URL，owner 必須是 `SanHsien`。

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `next/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Workspace Shape

- Root is the public harness boundary only: workspace metadata, `.github/workflows/ci.yml`, `scripts/guard.ts`, and repository docs.
- `next/` owns the complete Next application: app routes, components, app libraries, public assets, Next config, app TypeScript config, and app unit tests.
- `e2e/` owns browser-level tests as the only source of truth: Playwright config, e2e TypeScript config, helper scripts, and flat `ui/*.test.ts` cases.
- Do not add Playwright tests under `next/`. Do not add app source back at root `src/` or root `app/`.
- Root `package.json` must not proxy app or e2e scripts. Use pnpm workspace filters from the repository root.

## Commands

- Install: `pnpm install --frozen-lockfile`
- Guard shape: `pnpm exec tsx scripts/guard.ts`
- App dev: `pnpm -F @html-anything/next dev`
- App typecheck: `pnpm -F @html-anything/next typecheck`
- App unit tests: `pnpm -F @html-anything/next test`
- App build: `pnpm -F @html-anything/next build`
- E2E typecheck: `pnpm -F @html-anything/e2e typecheck`
- E2E tests: `pnpm -F @html-anything/e2e test`
