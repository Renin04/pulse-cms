# Pulse — Interactive Blog Engine

> A modular, pluggable, AI-powered blog engine that goes far beyond traditional blogging.

---

## What is Pulse?

Pulse is a next-generation blog engine built as a **JavaScript library** that you can import
into any website. It provides both:

- **Editor side** — A block-based editor with AI assistance, slash commands, custom right-click
  menus, advanced shortcuts, and the ability to create entirely new interactive block types
  through natural language.
- **Display side** — A rendering engine that brings blog posts to life with interactive elements
  like quizzes, polls, manga-style layouts, scroll-triggered animations, and more.

---

## Why?

Every blog engine today is essentially the same: title, text, image, repeat.
Pulse exists because we believe blog posts should be **experiences**, not just pages.

- 📝 Writers should have an editor that feels like a creative tool, not a text box.
- 🎮 Readers should interact with content, not just scroll through it.
- 🧩 Developers should be able to plug it into any project with minimal effort.
- 🤖 AI should help create new block types that don't exist yet.

---

## Core Principles

| Principle | Meaning |
|-----------|---------|
| **Modular** | Import only what you need. Use the editor, the renderer, or both. |
| **Block-based** | Everything is a block. Text, quiz, manga panel, code, poll — all blocks. |
| **Interactive-first** | Blocks are not static. They respond, animate, collect data, branch. |
| **AI-native** | AI is not a chatbot sidebar. It's woven into the editor as a creation tool. |
| **UX-obsessed** | Slash commands, context menus, keyboard-first design, zero friction. |
| **Extensible** | Build new block types via plugins or via AI-generated code. |

---

## Who is this for?

- **Content creators** who want to make interactive, memorable posts.
- **Educators** who want quizzes, branching paths, and engaged readers.
- **Developers** who need a blog module they can drop into any JS project.
- **Teams** who want to push the boundaries of what a "blog post" can be.

---

## Project Structure

```
Pulse/
├── packages/
│   ├── core/          # Shared types, block registry, plugin system
│   ├── editor/        # The block editor (authoring side)
│   ├── renderer/      # The display engine (reading side)
│   ├── ai/            # AI integration layer
│   └── plugins/       # Official block plugins (quiz, poll, manga, etc.)
├── docs/              # Project documentation & agent files
├── apps/
│   ├── playground/    # Programmatic editor fixture
│   └── manual-lab/    # Interactive local test server + UI harness
└── ...
```

---

## Manual Lab Server

Use the manual lab server to test currently implemented editor features in a single UI:

- slash/backslash suggestions
- nested command acceptance (`Tab` pre-confirm, `Enter` final execute)
- shortcuts, context menus, DnD, clipboard, save flows
- block inspector and event logger surfaces
- Persian alias command queries and mixed-direction input

Run:

```bash
npm run dev:manual-lab
```

Then open:

- `http://127.0.0.1:4177` (simple editor-like mode)
- `http://127.0.0.1:4177/advanced` (full advanced harness)

More details: `apps/manual-lab/README.md`

---

## Development Approach

This project is developed using an **agentic AI workflow**:

- All features, decisions, and progress are documented in `docs/`.
- An AI agent reads context files at the start of each session.
- A living backlog tracks all tasks and priorities.
- Each phase has its own spec file with acceptance criteria.

See `docs/AGENT_PROMPT.md` for the agent's operating instructions.

---

## Status

🟦 **Pre-Migration gate active before Phase 3 (Renderer)**

Phase 1 and Phase 2 implementation waves are complete, and all remaining Phase 1/2
feature debt is now being closed under `phases/PHASE_PRE_MIGRATION_03.md` before
renderer kickoff.
