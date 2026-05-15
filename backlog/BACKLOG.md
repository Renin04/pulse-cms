# Pulse — Development Backlog

> This is the actionable work queue.  
> Completed tasks must be removed from this file and archived in `backlog/DONE.md`.

**Last Updated:** 2026-05-15  
**Current Phase:** Launch Readiness Gate — Pre-Phase 4 Validation

---

## 🎯 Active Execution Backlog

Only tasks that are still open belong here.

### Launch Readiness Gate

Reference plan: `phases/PHASE_LAUNCH_READINESS.md`  
Start prompt: `docs/prompt/PHASE_LAUNCH_KICKOFF.md`  
Closeout prompt: `docs/prompt/PHASE_LAUNCH_CLOSEOUT.md`

#### Session L-1 — Test Strategy & Environment Setup
- ✅ Create `docs/launch/BLOCK_TEST_MATRIX.md` covering all block types.
- ✅ Create `docs/launch/SECURITY_AUDIT_CHECKLIST.md`.
- ✅ Create `docs/launch/PERF_AUDIT_CHECKLIST.md`.
- ✅ Define severity labels and `docs/launch/BUG_LOG.md` template.
- ✅ Harden build/test environment: fix root `npm run build` (L-0-001) and website snapshot test path (L-0-002).

#### Session L-2 — Basic Blocks QA (Editor + Renderer)
- ✅ Automated verification: Paragraph, Heading, List, Blockquote, Code, Inline Code, HR, Link, Image.
- ✅ Validate renderer SSR and hydrated output (Puppeteer + DOM inspection).
- ✅ Validate mobile rendering (375px viewport).
- ✅ Validate edit data persistence (editor loads all blocks with correct fields).
- ✅ Manual verification: insert via slash, shortcut, and context menu (via Puppeteer demo editor).
- ✅ Copy/paste round-trip (tested via block duplication in demo editor).
- ✅ Log defects in `docs/launch/BUG_LOG.md` (L-2-001 found and fixed).

#### Session L-3 — Media Blocks QA
- ✅ Manual verification: Image (extended metadata), Video, Audio, File, Embed.
- ✅ Validate metadata fields: alt, title, credit, source, license.
- ✅ Validate renderer attribution exposure.
- ✅ Log defects (none found).

#### Session L-4 — Interactive Blocks QA
- ⬜ Manual verification: Quiz, Poll, Survey, Flashcard, Accordion, Tabs, Toggle, Spoiler.
- ⬜ Validate interactivity in renderer and SSR fallback.
- ⬜ Log defects.

#### Session L-5 — Advanced & Creative Blocks QA
- ⬜ Manual verification: Table, Chart, Map, Code Playground, Math, Diagram, Timeline,
  Comparison, Before/After, Manga, Speech Bubble, Callout, Alert, Card, Hero, Gallery,
  Carousel, Annotated Image.
- ⬜ Validate lazy loading for heavy blocks.
- ⬜ Log defects.

#### Session L-6 — Editor Core UX QA
- ⬜ Validate slash commands, backslash macros, shortcuts, context menus, toolbar.
- ⬜ Validate DnD, clipboard, undo/redo, multi-select, block search, templates.
- ⬜ Validate bidirectional input safety.
- ⬜ Log defects.

#### Session L-7 — Renderer QA — Layout & Responsive
- ⬜ Validate layout modes: single-column, multi-column, grid, manga, full-width, sticky.
- ⬜ Validate responsive behavior across mobile/tablet/desktop.
- ⬜ Log defects.

#### Session L-8 — Renderer QA — Animation & Interaction
- ⬜ Validate scroll animations, fade/slide, parallax, hover, click, forms, progress.
- ⬜ Validate `prefers-reduced-motion` fallback.
- ⬜ Log defects.

#### Session L-9 — CMS End-to-End QA
- ⬜ Execute full content lifecycle: draft → review → approve → schedule → publish.
- ⬜ Validate roles, media library, taxonomy, SEO metadata, webhooks.
- ⬜ Log defects.

#### Session L-10 — Website & Blog Dogfooding QA
- ⬜ Author a realistic post in the studio and verify preview + published feed.
- ⬜ Verify offline serving (`npm run serve:offline`).
- ⬜ Log defects.

#### Session L-11 — Security Audit
- ⬜ Run XSS injection tests in block data and URLs.
- ⬜ Review CSP, CORS, and API-key encryption behavior.
- ⬜ Log findings and fix launch-blocking issues.

#### Session L-12 — Performance Audit
- ⬜ Measure bundle sizes and compare to architecture targets.
- ⬜ Profile render and animation performance.
- ⬜ Check for memory leaks.
- ⬜ Log findings and fix launch-blocking issues.

#### Session L-13 — Bug Bash & Regression Fix
- ⬜ Triage `docs/launch/BUG_LOG.md` and fix all P0 bugs.
- ⬜ Fix P1 bugs as capacity allows; defer remaining with rationale.
- ⬜ Re-run affected tests and manual verification.

#### Session L-14 — Final Validation & Launch Sign-off
- ⬜ Run full quality gates: `docs:check`, `lint`, `typecheck`, `build`, `test`.
- ⬜ Create `docs/launch/LAUNCH_SIGNOFF.md`.
- ⬜ Sync all docs and memory files.
- ⬜ Get user approval for launch readiness.

---

## 🔮 Future Roadmap (Not Active Yet)

These items are intentionally parked until the Launch Readiness Gate closes.

### Phase 4: AI Builder & Automation Runtime
Reference plan: `phases/PHASE_04_AI.md`  
Kickoff handoff: `docs/PHASE_04_AI_KICKOFF_CHECKLIST.md`
- ⬜ R4-1: Scaffold `@pulse/ai` + capability contracts
- ⬜ R4-2 through R4-18: AI workspace, invocation UX, provider GUI, builder runtime,
  automation engine, media intelligence, safety/audit, stabilization

### Phase 5: SEO Intelligence
Reference plan: `phases/PHASE_05_SEO.md`
- ⬜ Add SEO brief and keyword/intent planning workflows
- ⬜ Add on-page optimization (title/meta/slug/headings/internal links)
- ⬜ Add schema/FAQ/rich-snippet assistants
- ⬜ Add pre-publish SEO score and SEO automations

### Phase 6: Production Hardening
Reference plan: `phases/PHASE_06_PRODUCTION.md`
- ⬜ Complete packaging/release operations (npm/CDN/changelog/migrations)
- ⬜ Complete observability/testing hardening (E2E/visual/performance monitoring)
- ⬜ Complete developer/documentation surfaces (API docs/guides/examples)
- ⬜ Complete platform expansion (adapters, i18n, security hardening)

---

## ⏸️ Blocked Tasks

- Playwright/browser-dependent website E2E remains blocked by the current network/browser-install constraint.

---

## 🗑️ Cancelled Tasks

*No cancelled tasks yet.*

---

## 📝 Backlog Hygiene Rules

- Keep this file limited to **not completed** tasks.
- Move done work to `backlog/DONE.md` in the same session.
- Do not keep `- ✅` checklist items in this file.
- Automated check: run `npm run docs:check` (also included in `npm run ci:local`).

---

**Current Goal:** Proceed to L-4 Interactive Blocks QA.
