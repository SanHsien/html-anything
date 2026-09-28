English | [中文版](CHANGELOG.md)

# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); newest first.
This file records **this fork's maintenance history** only (from 2026-08-28). The product
history of upstream
[`nexu-io/html-anything`](https://github.com/nexu-io/html-anything) lives in its
own history and in the review ledger at [`docs/fork/UPSTREAM.md`](docs/fork/UPSTREAM.md).
Per-commit adopt/skip reasoning is recorded in [`docs/fork/DECISIONS.md`](docs/fork/DECISIONS.md).

---

## 2026-08-28 (land remaining review remediations)

### Changed

- **Windows vitest symlink.** `install-rejections.test.ts` now packs a hand-rolled ustar instead of calling `fs.symlink`.
- **CONTRIBUTING overlay** documents `pnpm -F @html-anything/next`; Simplified Chinese export docs point at `export-menu.tsx`.
- **Product `ci.yml` pins** `actions/checkout` and `setup-node` SHAs (pnpm command strings that `guard.ts` checks are unchanged).
- **Marketplace skill ids** validate via `parseSkillId` / `parsePackageId` instead of one polynomial regex.
- **stripTags / attribute escaping** tighten the incomplete sanitization paths CodeQL flagged.

This pass does not contribute back upstream.

---

## 2026-08-28 (full-repo review and overlay fixes)

### Changed

- **Rewrote `REVIEW.md`.** Records GitHub Actions URLs, the 32 open CodeQL alerts, the actual 81 skill directories, and the overlay remediations from this pass.
- **`pytest>=9.1`.** Clears the dependency-freshness failure against the pytest 8 floor; this line's CI runs Python 3.14.
- **Product `ci.yml` checkout now sets `persist-credentials: false`.** The pnpm command strings that `guard.ts` checks are unchanged.
- **`CONTRIBUTING.zh-CN.md` paths now use `next/src/`.** The Simplified Chinese guide no longer points at a root `src/` tree that `guard.ts` forbids.

This pass does not contribute back upstream.

---

## 2026-08-28 (create a Windows-first maintenance fork)

### Added

- **Fork overlay.** `FORK.md`, `NOTICE.md`, `REVIEW.md`, `SECURITY.md`, `docs/fork/`, the Windows gate, `upstream-check`, CodeQL, and Dependabot.
- **`CLAUDE.md` as a regular file.** Upstream points at `@AGENTS.md`; git symlinks are unreliable on Windows.

### Changed

- **Overlay banners** on `README.md`, `README.zh-CN.md`, `AGENTS.md`, and `CONTRIBUTING.md`. Product prose still follows upstream.

This pass does not contribute back upstream.
