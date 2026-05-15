# Context Snapshot — Current State

> Quick reference for the next agent session.
> Update this at the end of every session.

**Last Updated:** 2026-05-15
**Current Session:** Session 77 — L-5 Advanced & Creative Blocks QA (Complete)
**Current Phase:** Launch Readiness Gate — Pre-Phase 4 Validation (L-6 next)

---

## Current Focus

**What we just completed (Session 77):**
- L-5 Advanced & Creative Blocks QA — all 17 blocks verified
- Puppeteer MCP testing in demo editor preview pane, editor panel, and live blog post
- Created `apps/website/scripts/block-qa-l5-advanced.mjs` — automated QA script
- Created test blog post `/blog/l5-advanced-blocks-qa/` with all 17 advanced blocks via Prisma
- Verified no placeholders in editor panel; all blocks have dedicated editable UI
- Desktop (1400px) and mobile (375px) screenshots captured
- Updated `docs/launch/BLOCK_TEST_MATRIX.md` — all 17 marked PASS
- Updated `docs/launch/BUG_LOG.md` — L-5 session notes appended
- Committed all changes

**Previous sessions completed:**
- L-1: Test Strategy & Environment Setup ✅
- L-2: Basic Blocks QA (8/8 PASS) ✅
- L-3: Media Blocks QA (4/4 PASS) ✅
- L-4: Interactive Blocks QA (8/8 PASS) ✅
- L-5: Advanced & Creative Blocks QA (17/17 PASS) ✅

---

## Project Status

### Overall Progress
- **Phase 1:** ✅ Completed
- **Phase 2:** ✅ Completed
- **Pre-Migration Gate to Phase 3:** ✅ Completed
- **Phase 3:** ✅ Completed
- **PM4 Migration Gate:** ✅ Completed
- **Launch Readiness Gate:** 🟦 In Progress (L-6 next)
- **Phase 4 (AI):** ⬜ Blocked until Launch Readiness Gate closes
- **Phase 5 (SEO):** ⬜ Planned
- **Phase 6 (Production):** ⬜ Planned

### Launch Readiness Priority Themes
1. ~~Block-by-block QA (editor + renderer) — L-2 through L-5~~ — ALL COMPLETE ✅
2. Editor UX integrity — L-6 — NEXT
3. Renderer integrity (layout, animation, interaction, reader XP) — L-7, L-8
4. CMS end-to-end workflow validation — L-9
5. Website/blog dogfooding — L-10
6. Security audit — L-11
7. Performance audit — L-12
8. Bug bash & regression closure — L-13
9. Final sign-off and Phase 4 unblocking — L-14

---

## Key Files Status

### Session 77 — L-5 Advanced Blocks QA
- ✅ `apps/website/scripts/block-qa-l5-advanced.mjs` — New
- ✅ `apps/website/scripts/create-l5-test-entry.mjs` — New
- ✅ `apps/website/scripts/add-callout-alert-to-l5.mjs` — New
- ✅ `apps/website/scripts/get-content-types.mjs` — New
- ✅ `docs/launch/qa-screenshots/L-5-*` — New (35 screenshots)
- ✅ `docs/launch/BLOCK_TEST_MATRIX.md` — Updated (17/17 PASS)
- ✅ `docs/launch/BUG_LOG.md` — Updated (L-5 notes)
- ✅ `backlog/BACKLOG.md` — Updated (L-4, L-5 marked complete)
- ✅ `backlog/DONE.md` — Updated (L-4, L-5 archived)

---

## Constraints and Environment Notes
- Windows host + WSL runtime. Canonical project path on host: `C:\Users\z0512\Desktop\pulse`.
- Puppeteer QA script requires Chrome installed (auto-detected at `C:\Program Files\Google\Chrome\Application\chrome.exe`)
- Next.js dev server for puppeteer testing should run on port 3001 to avoid conflicts
- Offline-first E2E policy (D002) remains active.
- `apps/website` dependency install still works best when run from the website workspace.
- Playwright/browser-dependent website E2E remains skipped by explicit user instruction.
- The website studio is intentionally local-first and persists through browser storage.
- Launch Readiness Gate is active; Phase 4 is explicitly blocked until L-14 sign-off.

---

## Session Protocol Reminder

**At session start:**
1. Read `docs/memory/CONTEXT_SNAPSHOT.md`
2. Read `backlog/BACKLOG.md`
3. Read `backlog/DECISIONS.md`
4. Read active phase file: `phases/PHASE_LAUNCH_READINESS.md`
5. Read `docs/renderer/STYLING_GUIDE.md` only if touching renderer CSS/theme/layout

**At the end of every session:**
1. Update `docs/launch/BUG_LOG.md` if any findings
2. Update `docs/launch/BLOCK_TEST_MATRIX.md` if block QA was performed
3. Update `backlog/BACKLOG.md`
4. Update `backlog/DONE.md`
5. Update `docs/memory/CONTEXT_SNAPSHOT.md`
6. Update `docs/memory/CONVERSATION_LOG.md`
7. Update `docs/FEATURES.md` only if feature status changes
8. Update `backlog/DECISIONS.md` only for true architecture/design decisions
9. Run: `npm run docs:check`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`
10. Skip Playwright/browser-dependent validation unless the user later provides a reachable browser runtime or explicitly changes the network constraint.

---

**Next Session Goal:** L-6 Editor Core UX QA (slash commands, shortcuts, context menus, toolbar, DnD, clipboard, undo/redo, multi-select, block search, templates).
