[English](CHANGELOG.en.md) | 中文版

# 變更紀錄

格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，新的在上面。
本檔只記錄**本 fork 的維護歷史**（2026-08-28 起）；上游
[`nexu-io/html-anything`](https://github.com/nexu-io/html-anything)
的產品演進見其自身歷史與 [`docs/fork/UPSTREAM.md`](docs/fork/UPSTREAM.md) 的審查清冊。
逐筆採用／略過的理由記在 [`docs/fork/DECISIONS.md`](docs/fork/DECISIONS.md)。

---

## 2026-08-28（建立 Windows-first 維護型 fork）

### 新增

- **Fork overlay。** `FORK.md`、`NOTICE.md`、`REVIEW.md`、`SECURITY.md`、`docs/fork/`、Windows gate、`upstream-check`、CodeQL、Dependabot。
- **`CLAUDE.md` 改為一般檔。** 上游是 `@AGENTS.md` 指針；Windows 無法可靠使用 git symlink。

### 變更

- **`README.md`／`README.zh-CN.md`／`AGENTS.md`／`CONTRIBUTING.md` 加頂部 overlay。** 產品正文仍以上游為準。

本輪不回貢。
