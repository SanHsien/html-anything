English | [中文版](CHANGELOG.md)

# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); newest first.
This file records **this fork's maintenance history** only (from 2026-08-28). The product
history of upstream
[`nexu-io/html-anything`](https://github.com/nexu-io/html-anything) lives in its
own history and in the review ledger at [`docs/fork/UPSTREAM.md`](docs/fork/UPSTREAM.md).
Per-commit adopt/skip reasoning is recorded in [`docs/fork/DECISIONS.md`](docs/fork/DECISIONS.md).

---

## 2026-08-28 (create a Windows-first maintenance fork)

### Added

- **Fork overlay.** `FORK.md`, `NOTICE.md`, `REVIEW.md`, `SECURITY.md`, `docs/fork/`, the Windows gate, `upstream-check`, CodeQL, and Dependabot.
- **`CLAUDE.md` as a regular file.** Upstream points at `@AGENTS.md`; git symlinks are unreliable on Windows.

### Changed

- **Overlay banners** on `README.md`, `README.zh-CN.md`, `AGENTS.md`, and `CONTRIBUTING.md`. Product prose still follows upstream.

This pass does not contribute back upstream.
