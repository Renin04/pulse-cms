# Contributing to Pulse CMS

Thanks for your interest in contributing!

## Getting started

1. Fork the repo and clone your fork.
2. `npm install` at the root.
3. Set up the website app per the [Quickstart](README.md#quickstart).
4. Create a branch: `git checkout -b feat/my-change`.

## Rules of thumb

- **Engine packages stay framework-agnostic.** `packages/core`, `packages/blocks`, `packages/editor`, and `packages/renderer` must not import React or Next.js — React bindings live in `packages/react`.
- **Tests are required.** New block types and engine features need Vitest coverage; user-facing flows should get Playwright e2e where practical.
- **Run the gates before pushing:** `npm run ci:local` (lint + typecheck + tests).
- **Commit style:** conventional commits (`feat(blocks): ...`, `fix(renderer): ...`).
- Keep PRs focused — one feature or fix per PR.

## Good first contributions

- New block types (`packages/blocks/src/` — follow an existing block's structure).
- Renderer output improvements (`packages/renderer`).
- Accessibility fixes in Studio.
- e2e coverage (`tests/e2e/`).

## Reporting issues

Use the issue templates. Include reproduction steps, expected vs actual behavior, and your environment (OS, Node version, browser).
