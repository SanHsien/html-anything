#!/usr/bin/env python3
"""檢查本 fork overlay 文件之間的相對連結。

只驗 overlay 文件、docs/fork/ 與已對齊 `next/src/` 的 CONTRIBUTING.zh-CN.md。
不掃根目錄 README.md／README.zh-CN.md：那是上游產品契約。

    python tools/check_links.py
"""

from __future__ import annotations

import re
import sys
from collections.abc import Iterator
from pathlib import Path
from urllib.parse import unquote

from markdown_it import MarkdownIt
from markdown_it.token import Token

ROOT = Path(__file__).resolve().parent.parent
HTML_SRC_PATTERN = re.compile(r"""(?is)<img[^>]+src=["']([^"']+)["']""")
# `(target "title")`: a destination, optionally followed by a quoted title.
TITLE_SUFFIX = re.compile(r"""\s+(?:"[^"]*"|'[^']*'|\([^)]*\))\s*$""")
SKIP_PREFIXES = ("http://", "https://", "mailto:", "tel:", "#")
SKIP_NAMES = {
    "upstream-review-report.md",
    "dependency-freshness-report.md",
}

FORK_DOCUMENTS = [
    ROOT / "FORK.md",
    ROOT / "NOTICE.md",
    ROOT / "REVIEW.md",
    ROOT / "SECURITY.md",
    ROOT / "CONTRIBUTING.md",
    ROOT / "CONTRIBUTING.zh-CN.md",
    ROOT / "CODE_OF_CONDUCT.md",
    ROOT / "CHANGELOG.md",
    ROOT / "CHANGELOG.en.md",
    ROOT / "AGENTS.md",
]


def iter_documents() -> list[Path]:
    documents = [path for path in FORK_DOCUMENTS if path.is_file()]
    fork_docs = ROOT / "docs" / "fork"
    if fork_docs.is_dir():
        documents.extend(sorted(fork_docs.glob("*.md")))
    return [path for path in documents if path.name not in SKIP_NAMES]


def _missing_relative(path: Path, target: str) -> str | None:
    target = TITLE_SUFFIX.sub("", target.strip())
    target = target.strip().strip("<>")
    if not target or target.startswith(SKIP_PREFIXES):
        return None
    file_part = unquote(target.split("#", 1)[0])
    if not file_part:
        return None
    resolved = (path.parent / file_part).resolve()
    if not resolved.is_relative_to(ROOT):
        return f"{target} → 逃出 repo 根目錄"
    if resolved.exists():
        return None
    try:
        shown = resolved.relative_to(ROOT)
    except ValueError:
        shown = resolved
    return f"{target} → 找不到 {shown}"


# Read Markdown with a real CommonMark + GFM table parser, the way GitHub
# renders it. Hand-written regexes for code spans and fences kept hiding real
# links (HTML blocks, tables, list items opening with a heading, tabs after ">"),
# so the parser decides what is code; links quoted in code are never tokens.
MARKDOWN = MarkdownIt("commonmark", {"html": True}).enable("table")
FENCE_CLOSE = re.compile(r"[ \t>]*(?P<fence>`{3,}|~{3,})[ \t]*$")


def _walk(tokens: list[Token]) -> Iterator[Token]:
    for token in tokens:
        yield token
        if token.children:
            yield from _walk(token.children)


def _fence_is_closed(token: Token, lines: list[str]) -> bool:
    """A closed fence's source range ends on its closing line."""
    start, end = token.map or (0, 0)
    if end - start < 2 or end > len(lines):
        return False
    closer = FENCE_CLOSE.match(lines[end - 1])
    return bool(
        closer
        and closer.group("fence")[0] == token.markup[0]
        and len(closer.group("fence")) >= len(token.markup)
    )


def extract_targets(text: str) -> tuple[list[tuple[str, bool]], int | None]:
    """Return the link targets of a document and the line of an unclosed fence.

    Each target is (destination, is_markdown): Markdown links and images carry a
    parsed destination (titles already removed), an HTML <img src> is the raw
    attribute. CommonMark runs an unclosed fence to the end of its container and
    hides every link after it; that is almost always a typo, so the caller
    reports it instead of passing silently.
    """
    lines = text.splitlines()
    targets: list[tuple[str, bool]] = []
    unclosed: int | None = None
    for token in _walk(MARKDOWN.parse(text)):
        if token.type == "link_open":
            targets.append((str(token.attrGet("href") or ""), True))
        elif token.type == "image":
            targets.append((str(token.attrGet("src") or ""), True))
        elif token.type in ("html_block", "html_inline"):
            targets.extend(
                (match.group(1), False)
                for match in HTML_SRC_PATTERN.finditer(token.content)
            )
        elif (
            token.type == "fence"
            and unclosed is None
            and not _fence_is_closed(token, lines)
        ):
            unclosed = (token.map or (0, 0))[0] + 1
    return targets, unclosed


def check_document(path: Path) -> list[str]:
    problems: list[str] = []
    # Links shown as examples inside code are not links of this document.
    targets, unclosed = extract_targets(path.read_text(encoding="utf-8"))
    if unclosed is not None:
        problems.append(f"第 {unclosed} 行的 code fence 沒有收尾，之後的連結都不會被檢查")
    for target, _ in targets:
        missing = _missing_relative(path, target)
        if missing:
            problems.append(missing)
    return problems


def main() -> int:
    documents = iter_documents()
    if not documents:
        print("找不到任何 fork overlay Markdown 檔")
        return 1

    failures = 0
    for path in documents:
        problems = check_document(path)
        rel = path.relative_to(ROOT)
        if problems:
            failures += 1
            for problem in problems:
                print(f"FAIL {rel}: {problem}")
        else:
            print(f"OK   {rel}")

    print(f"\n共 {len(documents)} 份 overlay 文件，{failures} 份有缺檔。")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
