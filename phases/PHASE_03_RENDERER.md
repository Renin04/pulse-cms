# Phase 3 — Renderer, Display & UI

> This phase starts after pre-migration closure and now includes the former Phase 6
> theming/UI scope (decision D004). Phase 3 exits only when renderer output is usable,
> themed, responsive, and validated for framework consumers.

**Status:** ✅ Complete (R3-1 through R3-16 closed on 2026-04-06)  
**Depends On:** Phase 1 (Core Foundation), Phase 2 (Editor + Blocks), Pre-Migration Gate PM-1..PM-10  
**Blocks:** PM4 Migration Gate and then Phase 4 (AI Features)  
**Estimated Sessions:** 16  
**Priority:** P0

---

## 🎯 Goals

1. Deliver `@pulse/renderer` with stable public API and block rendering parity.
2. Ship SSR/SSG-safe rendering and framework adapter helpers for common app stacks.
3. Deliver responsive layouts, interactions, and reader-experience features.
4. Ship baseline design tokens, theme system, and per-site style customization.
5. Close accessibility and mobile editing UI quality gates before AI phase start.

---

## 📦 Scope

### Core Rendering (Phase 3, P0/P1)
- `Block rendering`, `Renderer public API`, `Responsive layout`
- `SSR support`, `Static generation`, `Lazy loading`, `Error boundaries`
- `Framework adapters` (Next.js / Nuxt / Astro integration helpers)

### Interactions & Animation (Phase 3, P0/P1/P2)
- `Click interactions`, `Form submissions`
- `Scroll animations`, `Fade in/out`, `Slide in/out`
- `Parallax effects`, `Hover effects`, `Progress tracking`

### Layout Engine (Phase 3, P0/P1/P2)
- `Single column`, `Multi-column`, `Grid layout`
- `Manga layout`, `Full-width blocks`, `Sticky elements`, `Custom spacing`

### Reader Experience (Phase 3, P1/P2)
- `Table of contents`, `Reading progress`, `Estimated read time`
- `Bookmarks`, `Share buttons`

### Advanced Blocks (Phase 3, P2)
- `Code playground`, `Branch block`, `Conditional block`

### Theming & UI (merged from former Phase 6 by D004)
- `CSS variables`, `Theme system`, `Custom CSS`
- `Font customization`, `Spacing system`, `Dark mode`
- `Accessibility`, `Mobile editing`, `Customizable toolbar`

### Security (Phase 3, P1)
- `CORS handling`, `API key encryption`

---

## ✅ Exit Criteria

Phase 3 is complete only when all criteria pass:

1. No `⬜` or `🟦` rows remain in `docs/FEATURES.md` for all Phase 3 items.
2. `phases/PHASE_03_RENDERER.md` execution log includes closure evidence for all R3 sessions.
3. `@pulse/renderer` package exposes documented public API with type coverage and tests.
4. Theming baseline ships with CSS variables + default theme + custom CSS extension path.
5. Accessibility and mobile rendering baseline pass automated checks and manual-lab smoke flows.
6. Full quality gates pass at phase close:
   - `npm run docs:check`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - `npm run test`
7. Phase 4 handoff checklist is documented (renderer contracts available for AI workflows).

---

## 🗂️ Session Plan (R3-1 to R3-16)

### R3-1 — Renderer package scaffold + public API contract
- **Goal:** Create `@pulse/renderer` package and lock API shape.
- **Tasks:**
  - scaffold `packages/renderer` package, tsconfig, exports
  - implement initial `renderDocument` API and types
  - map core block types to renderer entry points
  - add first renderer unit tests
- **Deliverables (files):**
  - `packages/renderer/package.json`
  - `packages/renderer/src/index.ts`
  - `packages/renderer/src/types.ts`
  - `packages/renderer/tests/renderer-api.test.ts`
- **Acceptance:**
  - package builds and exports compile
  - basic block list renders deterministically

### R3-2 — Core block rendering parity
- **Goal:** Render all shipped Phase 1/2 blocks with stable output contracts.
- **Tasks:**
  - implement block renderer registry + per-block renderers
  - ensure fallback rendering for unknown/invalid block types
  - add snapshot-style tests for representative blocks
- **Deliverables (files):**
  - `packages/renderer/src/registry/RendererRegistry.ts`
  - `packages/renderer/src/blocks/*.ts`
  - `packages/renderer/tests/block-rendering.test.ts`
- **Acceptance:**
  - all current block families render without runtime errors
  - fallback rendering path is covered by tests

### R3-3 — SSR and static generation support
- **Goal:** Make rendering deterministic and framework-safe on server and build pipelines.
- **Tasks:**
  - add SSR-safe rendering utilities
  - add static serialization path (HTML/string output)
  - validate no browser-only globals in SSR path
- **Deliverables (files):**
  - `packages/renderer/src/runtime/ssr.ts`
  - `packages/renderer/src/runtime/static.ts`
  - `packages/renderer/tests/ssr-static.test.ts`
- **Acceptance:**
  - SSR path runs in Node without DOM globals
  - static output is stable for identical input

### R3-4 — Responsive baseline + single-column layout
- **Goal:** Deliver default responsive layout and mobile-safe content flow.
- **Tasks:**
  - implement single-column layout engine
  - add responsive container breakpoints
  - add baseline style tokens required by layout
- **Deliverables (files):**
  - `packages/renderer/src/layout/singleColumn.ts`
  - `packages/renderer/src/styles/layout.css`
  - `packages/renderer/tests/layout-responsive.test.ts`
- **Acceptance:**
  - rendered output is readable on mobile/tablet/desktop widths
  - layout tests pass for key breakpoints

### R3-5 — Layout engine expansion
- **Goal:** Add multi-column/grid/full-width/sticky/custom-spacing/manga layouts.
- **Tasks:**
  - implement layout switcher and schema
  - ship multi-column and grid layout modes
  - add manga layout and full-width breakout support
  - add sticky elements and spacing controls
- **Deliverables (files):**
  - `packages/renderer/src/layout/modes.ts`
  - `packages/renderer/src/layout/manga.ts`
  - `packages/renderer/src/styles/layout-modes.css`
  - `packages/renderer/tests/layout-modes.test.ts`
- **Acceptance:**
  - all layout options apply consistently by config
  - spacing and sticky behavior covered by tests

### R3-6 — Interaction runtime (click/forms/error boundaries)
- **Goal:** Support interactive block behavior with resilient error handling.
- **Tasks:**
  - implement click interaction dispatcher
  - wire form submission hooks/events
  - add renderer error-boundary/fallback model
- **Deliverables (files):**
  - `packages/renderer/src/interactions/click.ts`
  - `packages/renderer/src/interactions/forms.ts`
  - `packages/renderer/src/runtime/errorBoundary.ts`
  - `packages/renderer/tests/interactions-core.test.ts`
- **Acceptance:**
  - click/form interactions emit expected events
  - renderer recovers from block-level failures

### R3-7 — Animation baseline
- **Goal:** Implement fade/slide/scroll animation system.
- **Tasks:**
  - define animation registry and config API
  - implement fade and slide transitions
  - add scroll-trigger support with safe defaults
- **Deliverables (files):**
  - `packages/renderer/src/animations/registry.ts`
  - `packages/renderer/src/animations/fadeSlide.ts`
  - `packages/renderer/src/animations/scroll.ts`
  - `packages/renderer/tests/animations-baseline.test.ts`
- **Acceptance:**
  - animation settings are configurable per block
  - reduced-motion fallback path exists

### R3-8 — Advanced interaction effects
- **Goal:** Add parallax/hover/progress tracking features.
- **Tasks:**
  - implement hover effect states and hooks
  - add parallax engine with throttle limits
  - implement progress tracking signal for runtime
- **Deliverables (files):**
  - `packages/renderer/src/animations/parallax.ts`
  - `packages/renderer/src/interactions/hover.ts`
  - `packages/renderer/src/interactions/progressTracking.ts`
  - `packages/renderer/tests/animations-advanced.test.ts`
- **Acceptance:**
  - effects remain performant under long pages
  - progress events are deterministic in tests

### R3-9 — Reader experience pack
- **Goal:** Ship TOC, reading progress, read-time, bookmarks, and share actions.
- **Tasks:**
  - heading extraction and TOC generation
  - estimated read-time calculator
  - bookmark model and restoration behavior
  - share action abstraction (platform-safe)
- **Deliverables (files):**
  - `packages/renderer/src/reader/toc.ts`
  - `packages/renderer/src/reader/readTime.ts`
  - `packages/renderer/src/reader/bookmarks.ts`
  - `packages/renderer/src/reader/share.ts`
  - `packages/renderer/tests/reader-experience.test.ts`
- **Acceptance:**
  - reader feature outputs match docs and tests
  - TOC and read-time cover mixed-content posts

### R3-10 — Theming contract + CSS variables
- **Goal:** Define style contract required by consumer websites.
- **Tasks:**
  - establish CSS variable token map
  - expose renderer style entrypoint
  - support custom CSS override hooks
- **Deliverables (files):**
  - `packages/renderer/src/theme/tokens.ts`
  - `packages/renderer/src/styles/tokens.css`
  - `packages/renderer/src/theme/customCss.ts`
  - `packages/renderer/tests/theme-tokens.test.ts`
- **Acceptance:**
  - base theme works without app-specific CSS
  - custom CSS overrides do not break defaults

### R3-11 — Theme system + dark mode + font/spacing controls
- **Goal:** Provide runtime theme switching and typography/spacing customization.
- **Tasks:**
  - implement built-in themes (light/dark/minimal)
  - add runtime theme resolver
  - add font and spacing token customization APIs
- **Deliverables (files):**
  - `packages/renderer/src/theme/themes.ts`
  - `packages/renderer/src/theme/resolveTheme.ts`
  - `packages/renderer/src/styles/themes.css`
  - `packages/renderer/tests/theme-system.test.ts`
- **Acceptance:**
  - theme switch does not require renderer restart
  - dark mode and spacing/font overrides are covered by tests

### R3-12 — Accessibility + mobile editing UI baseline
- **Goal:** Close a11y baseline and touch-oriented UI behavior.
- **Tasks:**
  - apply ARIA and keyboard semantics to renderer UI wrappers
  - add mobile interaction affordances for embedded editing controls
  - validate reduced-motion and contrast baselines
- **Deliverables (files):**
  - `packages/renderer/src/a11y/semantics.ts`
  - `packages/renderer/src/mobile/touch.ts`
  - `packages/renderer/tests/a11y-mobile.test.ts`
- **Acceptance:**
  - a11y automated tests pass for renderer surfaces
  - mobile interaction regression tests pass

### R3-13 — Customizable toolbar integration
- **Goal:** Expose toolbar customization model in renderer/editor boundary.
- **Tasks:**
  - define toolbar schema for add/remove/reorder
  - wire schema to renderer UI hooks
  - add regression tests for missing/invalid actions
- **Deliverables (files):**
  - `packages/renderer/src/ui/toolbarConfig.ts`
  - `packages/renderer/src/ui/toolbarRenderer.ts`
  - `packages/renderer/tests/toolbar-customization.test.ts`
- **Acceptance:**
  - consumer can customize toolbar controls safely
  - invalid config falls back predictably

### R3-14 — Framework adapters + lazy loading
- **Goal:** Deliver integration helpers for mainstream frameworks and lazy block loading.
- **Tasks:**
  - implement adapter utilities for Next.js, Nuxt, Astro
  - add lazy-load boundaries for heavy blocks
  - verify framework-specific SSR contracts
- **Deliverables (files):**
  - `packages/renderer/src/adapters/next.ts`
  - `packages/renderer/src/adapters/nuxt.ts`
  - `packages/renderer/src/adapters/astro.ts`
  - `packages/renderer/src/runtime/lazy.ts`
  - `packages/renderer/tests/framework-adapters.test.ts`
- **Acceptance:**
  - adapter entrypoints compile with type safety
  - lazy path does not regress base render output

### R3-15 — Advanced blocks + security controls
- **Goal:** Close code playground/branch/conditional rendering and security items.
- **Tasks:**
  - implement renderer support for code playground
  - implement branch and conditional runtime evaluation
  - add CORS handling and API-key encryption utilities
- **Deliverables (files):**
  - `packages/renderer/src/blocks/CodePlaygroundRenderer.ts`
  - `packages/renderer/src/blocks/BranchRenderer.ts`
  - `packages/renderer/src/blocks/ConditionalRenderer.ts`
  - `packages/renderer/src/security/cors.ts`
  - `packages/renderer/src/security/keyEncryption.ts`
  - `packages/renderer/tests/advanced-security.test.ts`
- **Acceptance:**
  - advanced block rendering passes integration tests
  - security utilities behave as documented with tests

### R3-16 — Stabilization, regression, and phase sign-off
- **Goal:** Freeze Phase 3 scope and produce clean handoff to Phase 4.
- **Tasks:**
  - run full quality gates and fix phase-specific regressions
  - verify all Phase 3 rows in `docs/FEATURES.md` are closed
  - sync `BACKLOG`, `DONE`, `CONTEXT_SNAPSHOT`, `CONVERSATION_LOG`
  - produce Phase 4 handoff checklist
- **Deliverables (files):**
  - `docs/memory/CONTEXT_SNAPSHOT.md`
  - `docs/memory/CONVERSATION_LOG.md`
  - `backlog/BACKLOG.md`
  - `backlog/DONE.md`
- **Acceptance:**
  - Phase 3 has zero open feature rows
  - quality gates pass and handoff is documented

---

## 📌 Execution Log

- Session planning baseline created (2026-04-04): D004 scope merge applied and R3-1..R3-16 plan authored.
- Phase closure completed (2026-04-06): all R3 sessions completed, quality gates passed, and handoff moved to PM4 migration gate before Phase 4 kickoff.

---

## ⚠️ Risks

- Package coupling risk if `@pulse/react` directly imports renderer internals.
- Animation-heavy pages can degrade performance without strict defaults.
- Theme overrides can reduce readability if token contracts are too loose.
- Framework adapter divergence can create SSR behavior drift.
- Security helpers touching runtime/browser environments may create compatibility edge cases.

---

## 🔄 Handoff to Phase 4

Phase 4 (AI) starts only after Phase 3 provides:

- Stable `@pulse/renderer` public API and framework adapter contracts.
- Finalized block rendering + layout primitives consumable by AI-generated blocks.
- Theme token contract so AI layout/style suggestions target real renderer capabilities.
- Security/runtime baseline for AI-configured interactive blocks.
