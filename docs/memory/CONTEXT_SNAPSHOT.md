# Context Snapshot — Current State

> Quick reference for the next agent session.
> Update this at the end of every session.

**Last Updated:** 2026-05-18
**Current Session:** Session 87 — UX/UI Bug Fixes (#6 ref editor rendering, #8 ref URL relative, #10 duplicate ref numbers, link duplication, drag-text-selection)
**Current Phase:** Phase 4 — AI Builder & Automation Runtime (bug-fixing branch)

---

## Current Focus

**What we just completed (Session 87):**
- Bug #6: Fixed reference rendering in editor — refs now show as superscript numbers (1, a, α, ا) via `pulse-reference-editor` class instead of plain citation text.
- Bug #7: Fixed severe reference UI render problem in blog post — resolved via #10 CSS fix and #8 URL fix.
- Bug #8: Fixed bare domain reference URLs becoming relative (`sanitizeUrl` now auto-prepends `https://`).
- Bug #10: Fixed duplicate numbers in reference footnotes list — increased CSS specificity to override Tailwind prose `ol` styles.
- Link duplication fix: Added `skipBlurRef` guard across heading/text/blockquote blocks in `StudioBlockCanvas.tsx` to prevent `onBlur` DOM reset during modal interaction.
- Can't-type-after-link fix: Added `\u200B` (zero-width space) after links/refs in `markdownToHtml`; stripped in `htmlToMarkdown`.
- Drag fix: Moved `draggable` from entire block wrapper to drag handle icon only.
- Link/Ref target support: Added "Open in new tab" checkbox to both LinkModal and RefModal with auto-`noopener` enforcement. Updated `renderInlineContent` in `blog-studio.ts` and `entry-adapter.ts` to render `target` attribute.
- Quality gates passed: `lint`, `typecheck` green.

**Launch Readiness Gate sessions completed:**
- L-1: Test Strategy & Environment Setup ✅
- L-2: Basic Blocks QA (8/8 PASS) ✅
- L-3: Media Blocks QA (4/4 PASS) ✅
- L-4: Interactive Blocks QA (8/8 PASS) ✅
- L-5: Advanced & Creative Blocks QA (17/17 PASS) ✅
- L-6: Editor Core UX QA ✅ (L-6-001 HistoryState/undo-redo wired and fixed)
- L-7: Renderer QA — Layout & Responsive ✅ (L-7-001 table overflow-x fixed, L-7-002 manga mobile columns fixed)
- L-8: Renderer QA — Animation & Interaction ✅ (Performance audit with Lighthouse + CDP metrics)
- L-9: CMS End-to-End QA ✅
- L-10: Website & Blog Dogfooding QA ✅
- L-11: Security Audit ✅ (XSS hardened, CSP/HSTS added, rate limiting, CORS restrictions)
- L-12: Performance Audit ✅ (Bundle analysis, render profiling, memory-leak checks, cross-browser/PWA baseline)
- L-13: Bug Bash & Regression Fix ✅ (All P0 bugs closed; P1 bugs fixed or deferred with rationale)
- L-14: Final Validation & Launch Sign-off ✅

---

## Project Status

### Overall Progress
- **Phase 1:** ✅ Completed
- **Phase 2:** ✅ Completed
- **Pre-Migration Gate to Phase 3:** ✅ Completed
- **Phase 3:** ✅ Completed
- **PM4 Migration Gate:** ✅ Completed
- **Launch Readiness Gate:** ✅ Completed (L-14 signed off)
- **Phase 4 (AI):** 🟦 Ready to start (R4-1 next)
- **Phase 5 (SEO):** ⬜ Planned
- **Phase 6 (Production):** ⬜ Planned

### Phase 4 Priority Themes
1. AI package scaffold + capability contracts (R4-1)
2. AI brief and context model (R4-2)
3. Inline invocation UX (R4-3)
4. Provider registry GUI (R4-4)
5. Secure key and model profile management (R4-5)
6. Capability router — text vs image split (R4-6)
7. Tool runtime foundation (R4-7)
8. AI Builder: block creation toolchain (R4-8)
9. AI Builder: command/shortcut/macro tools (R4-9)
10. AI Builder: AI action generator (R4-10)
11. Automation engine core (R4-11)
12. Silent automation mode (R4-12)
13. Automation recipe builder UX (R4-13)
14. Image generation flow (R4-14)
15. Media enrichment (R4-15)
16. Safety and governance hardening (R4-16)
17. Auditability and observability (R4-17)
18. Stabilization and handoff (R4-18)

---

## Key Files Status

### Session 85 — L-14 Launch Sign-off
- ✅ `docs/launch/LAUNCH_SIGNOFF.md` — New
- ✅ `docs/launch/BUG_LOG.md` — Updated (all P0 closed, remaining P1/P2 triaged)
- ✅ `docs/launch/BLOCK_TEST_MATRIX.md` — Final (all blocks PASS)
- ✅ `backlog/BACKLOG.md` — L-6..L-14 archived, Phase 4 activated
- ✅ `backlog/DONE.md` — L-6..L-14 archived
- ✅ `docs/memory/CONTEXT_SNAPSHOT.md` — This file
- ✅ `docs/memory/CONVERSATION_LOG.md` — Session 85 summary appended
- ✅ `docs/FEATURES.md` — Launch gate completion note added
- ✅ `phases/PHASE_LAUNCH_READINESS.md` — Execution log completed

---

## Constraints and Environment Notes
- Windows host + WSL runtime. Canonical project path on host: `C:\Users\z0512\Desktop\pulse`.
- Puppeteer QA script requires Chrome installed (auto-detected at `C:\Program Files\Google\Chrome\Application\chrome.exe`)
- Next.js dev server for puppeteer testing should run on port 3001 to avoid conflicts
- Offline-first E2E policy (D002) remains active.
- `apps/website` dependency install still works best when run from the website workspace.
- Playwright/browser-dependent website E2E remains skipped by explicit user instruction.
- The website studio is intentionally local-first and persists through browser storage.
- Launch Readiness Gate is closed; Phase 4 AI is unblocked.

---

## Session Protocol Reminder

**At session start:**
1. Read `docs/memory/CONTEXT_SNAPSHOT.md`
2. Read `backlog/BACKLOG.md`
3. Read `backlog/DECISIONS.md`
4. Read active phase file: `phases/PHASE_04_AI.md`
5. Read `docs/PHASE_04_AI_KICKOFF_CHECKLIST.md`
6. Read `docs/renderer/STYLING_GUIDE.md` only if touching renderer CSS/theme/layout

**At the end of every session:**
1. Update `docs/memory/CONTEXT_SNAPSHOT.md`
2. Update `docs/memory/CONVERSATION_LOG.md`
3. Update `backlog/BACKLOG.md`
4. Update `backlog/DONE.md`
5. Update `docs/FEATURES.md` only if feature status changes
6. Update `backlog/DECISIONS.md` only for true architecture/design decisions
7. Run: `npm run docs:check`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`
8. Skip Playwright/browser-dependent validation unless the user later provides a reachable browser runtime or explicitly changes the network constraint.

---

**Next Session Goal:** R4-1 AI package scaffold + capability contracts.
