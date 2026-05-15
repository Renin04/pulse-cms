# Pulse â€” Development Backlog

> This is the actionable work queue.  
> Completed tasks must be removed from this file and archived in `backlog/DONE.md`.

**Last Updated:** 2026-05-15  
**Current Phase:** Launch Readiness Gate â€” Pre-Phase 4 Validation

---

## ðŸŽ¯ Active Execution Backlog

Only tasks that are still open belong here.

### Launch Readiness Gate

Reference plan: `phases/PHASE_LAUNCH_READINESS.md`  
Start prompt: `docs/prompt/PHASE_LAUNCH_KICKOFF.md`  
Closeout prompt: `docs/prompt/PHASE_LAUNCH_CLOSEOUT.md`

#### Session L-1 â€” Test Strategy & Environment Setup
- âœ… Create `docs/launch/BLOCK_TEST_MATRIX.md` covering all block types.
- âœ… Create `docs/launch/SECURITY_AUDIT_CHECKLIST.md`.
- âœ… Create `docs/launch/PERF_AUDIT_CHECKLIST.md`.
- âœ… Define severity labels and `docs/launch/BUG_LOG.md` template.
- âœ… Harden build/test environment: fix root `npm run build` (L-0-001) and website snapshot test path (L-0-002).

#### Session L-2 â€” Basic Blocks QA (Editor + Renderer)
- âœ… Automated verification: Paragraph, Heading, List, Blockquote, Code, Inline Code, HR, Link, Image.
- âœ… Validate renderer SSR and hydrated output (Puppeteer + DOM inspection).
- âœ… Validate mobile rendering (375px viewport).
- âœ… Validate edit data persistence (editor loads all blocks with correct fields).
- âœ… Manual verification: insert via slash, shortcut, and context menu (via Puppeteer demo editor).
- âœ… Copy/paste round-trip (tested via block duplication in demo editor).
- âœ… Log defects in `docs/launch/BUG_LOG.md` (L-2-001 found and fixed).

#### Session L-3 â€” Media Blocks QA
- âœ… Manual verification: Image (extended metadata), Video, Audio, File, Embed.
- âœ… Validate metadata fields: alt, title, credit, source, license.
- âœ… Validate renderer attribution exposure.
- âœ… Log defects (none found).

#### Session L-4 â€” Interactive Blocks QA
- â¬œ Manual verification: Quiz, Poll, Survey, Flashcard, Accordion, Tabs, Toggle, Spoiler.
- â¬œ Validate interactivity in renderer and SSR fallback.
- â¬œ Log defects.

#### Session L-5 â€” Advanced & Creative Blocks QA
- â¬œ Manual verification: Table, Chart, Map, Code Playground, Math, Diagram, Timeline,
  Comparison, Before/After, Manga, Speech Bubble, Callout, Alert, Card, Hero, Gallery,
  Carousel, Annotated Image.
- â¬œ Validate lazy loading for heavy blocks.
- â¬œ Log defects.

#### Session L-6 â€” Editor Core UX QA
- â¬œ Validate slash commands, backslash macros, shortcuts, context menus, toolbar.
- â¬œ Validate DnD, clipboard, undo/redo, multi-select, block search, templates.
- â¬œ Validate bidirectional input safety.
- â¬œ Log defects.

#### Session L-7 â€” Renderer QA â€” Layout & Responsive
- â¬œ Validate layout modes: single-column, multi-column, grid, manga, full-width, sticky.
- â¬œ Validate responsive behavior across mobile/tablet/desktop.
- â¬œ Log defects.

#### Session L-8 â€” Renderer QA â€” Animation & Interaction
- â¬œ Validate scroll animations, fade/slide, parallax, hover, click, forms, progress.
- â¬œ Validate `prefers-reduced-motion` fallback.
- â¬œ Log defects.

#### Session L-9 â€” CMS End-to-End QA
- â¬œ Execute full content lifecycle: draft â†’ review â†’ approve â†’ schedule â†’ publish.
- â¬œ Validate roles, media library, taxonomy, SEO metadata, webhooks.
- â¬œ Log defects.

#### Session L-10 â€” Website & Blog Dogfooding QA
- â¬œ Author a realistic post in the studio and verify preview + published feed.
- â¬œ Verify offline serving (`npm run serve:offline`).
- â¬œ Log defects.

#### Session L-11 â€” Security Audit
- â¬œ Run XSS injection tests in block data and URLs.
- â¬œ Review CSP, CORS, and API-key encryption behavior.
- â¬œ Log findings and fix launch-blocking issues.

#### Session L-12 â€” Performance Audit
- â¬œ Measure bundle sizes and compare to architecture targets.
- â¬œ Profile render and animation performance.
- â¬œ Check for memory leaks.
- â¬œ Log findings and fix launch-blocking issues.

#### Session L-13 â€” Bug Bash & Regression Fix
- â¬œ Triage `docs/launch/BUG_LOG.md` and fix all P0 bugs.
- â¬œ Fix P1 bugs as capacity allows; defer remaining with rationale.
- â¬œ Re-run affected tests and manual verification.

#### Session L-14 â€” Final Validation & Launch Sign-off
- â¬œ Run full quality gates: `docs:check`, `lint`, `typecheck`, `build`, `test`.
- â¬œ Create `docs/launch/LAUNCH_SIGNOFF.md`.
- â¬œ Sync all docs and memory files.
- â¬œ Get user approval for launch readiness.

---

## ðŸ”® Future Roadmap (Not Active Yet)

These items are intentionally parked until the Launch Readiness Gate closes.

### Phase 4: AI Builder & Automation Runtime
Reference plan: `phases/PHASE_04_AI.md`  
Kickoff handoff: `docs/PHASE_04_AI_KICKOFF_CHECKLIST.md`
- â¬œ R4-1: Scaffold `@pulse/ai` + capability contracts
- â¬œ R4-2 through R4-18: AI workspace, invocation UX, provider GUI, builder runtime,
  automation engine, media intelligence, safety/audit, stabilization

### Phase 5: SEO Intelligence
Reference plan: `phases/PHASE_05_SEO.md`
- â¬œ Add SEO brief and keyword/intent planning workflows
- â¬œ Add on-page optimization (title/meta/slug/headings/internal links)
- â¬œ Add schema/FAQ/rich-snippet assistants
- â¬œ Add pre-publish SEO score and SEO automations

### Phase 6: Production Hardening
Reference plan: `phases/PHASE_06_PRODUCTION.md`
- â¬œ Complete packaging/release operations (npm/CDN/changelog/migrations)
- â¬œ Complete observability/testing hardening (E2E/visual/performance monitoring)
- â¬œ Complete developer/documentation surfaces (API docs/guides/examples)
- â¬œ Complete platform expansion (adapters, i18n, security hardening)

---

## â¸ï¸ Blocked Tasks

- Playwright/browser-dependent website E2E remains blocked by the current network/browser-install constraint.

---

## ðŸ—‘ï¸ Cancelled Tasks

*No cancelled tasks yet.*

---

## ðŸ“ Backlog Hygiene Rules

- Keep this file limited to **not completed** tasks.
- Move done work to `backlog/DONE.md` in the same session.
- Do not keep `- âœ…` checklist items in this file.
- Automated check: run `npm run docs:check` (also included in `npm run ci:local`).

---

**Current Goal:** Proceed to L-4 Interactive Blocks QA.

