# NOTICE

html-anything (SanHsien maintenance fork)
Copyright 2026 SanHsien

This project is derived from [`nexu-io/html-anything`](https://github.com/nexu-io/html-anything), licensed under the Apache License 2.0.

Original work:

- Project: HTML Anything
- Authors: HTML Anything contributors / the Open Design team at `nexu-io`
- License: Apache License 2.0
- Upstream: https://github.com/nexu-io/html-anything

This repository keeps the Apache-2.0 license text in [`LICENSE`](LICENSE). Modifications, documentation, and future project-specific changes in this fork are also licensed under Apache-2.0 unless otherwise noted.

## License Notes

When redistributing this project or substantial parts of it:

- Keep [`LICENSE`](LICENSE) with the Apache-2.0 text.
- Keep attribution to `nexu-io/html-anything`.
- Bundled skill templates retain their original license and authorship inside each `next/src/lib/templates/skills/<skill>/` folder.
- Add separate attribution for new third-party libraries when their licenses require it.

## Project Scope

This repository ships a local-first agentic HTML editor: a Next.js app that reuses coding-agent CLIs already on `PATH`, 81 skill templates, sandboxed preview, and one-click export to HTML / PNG / WeChat / X / Zhihu. It is a maintenance fork, not a second official product site.

It does not include API keys, CLI session credentials, or user-generated HTML / PNG artifacts. Do not commit `.env*` files or credentials.

## Credits

`html-anything` belongs to the upstream project. The Next app, skill templates, agent adapters, and export pipeline in this tree come from `nexu-io/html-anything` unless a file in `docs/fork/` or the SanHsien overlay documents otherwise.

This project is not affiliated with, endorsed by, or sponsored by Anthropic, OpenAI, Google, GitHub, Vercel, WeChat, Zhihu, or any model vendor mentioned in examples.

Do not commit secrets, API keys, cookies, OAuth credentials, or account data.
