# Launch Readiness Gate — Pre-Phase 4 Validation

> This is a product-hardening and validation gate before Phase 4 (AI). Its purpose is to
> verify that every implemented block, editor surface, renderer path, CMS workflow, and
> website flow behaves correctly in real usage; close security and performance gaps;
> and collect structured user feedback so Pulse is launch-ready as a complete
> Editor + Renderer + CMS product.

**Status:** 🟦 In Progress (L-1 next)  
**Depends On:** Phase 3 closure (R3-1..R3-16), PM4 closure (PM4-1..PM4-12)  
**Blocks:** Phase 4 AI implementation start (R4-1+)  
**Estimated Sessions:** 14  
**Priority:** P0

---

## 🎯 Goals

1. **Block Completeness:** Every block type works correctly in the editor (insert, edit, delete,
   configure) and renders correctly in the reader (SSR, static, hydrated).
2. **Editor UX Integrity:** All commands, shortcuts, context menus, toolbars, drag-and-drop,
   clipboard, undo/redo, and multi-select flows are bug-free and consistent.
3. **Renderer Integrity:** Layouts, animations, interactions, reader experience features, and
   framework adapters behave correctly across breakpoints and reduced-motion preferences.
4. **CMS Integrity:** Content lifecycle (create → edit → review → schedule → publish) works
   end-to-end; roles, permissions, media library, and SEO metadata are functional.
5. **Website Dogfooding:** The Pulse-powered blog studio, preview, and public feed are stable
   and usable for real content.
6. **Security Baseline:** XSS, CSP, CORS, input sanitization, and API-key handling pass audit.
7. **Performance Baseline:** Bundle sizes, render performance, lazy loading, and animation
   jank are within acceptable thresholds.
8. **Launch Documentation:** All user-facing docs, API references, and in-product help are
   complete enough for early adopters.

---

## 📦 Scope

### A) Block-by-Block QA
- Build a test matrix: every block × editor path × renderer path × mobile/desktop.
- Validate data integrity: block JSON round-trips through save/load without corruption.
- Validate schema compliance: every block passes Zod validation in both editor and renderer.
- Test edge cases: empty blocks, oversized content, invalid URLs, missing metadata.

### B) Editor UX QA
- Walk through every slash command, backslash macro, keyboard shortcut, context menu,
  toolbar action, and drag-and-drop flow.
- Validate bidirectional (RTL/LTR mixed) input remains correct across all surfaces.
- Validate command/shortcut conflict detection and custom command/macro authoring.
- Validate in-product command catalog and help surfaces.

### C) Renderer QA
- Test all layout modes (single-column, multi-column, grid, manga, full-width, sticky).
- Test animation system with reduced-motion preference respected.
- Test interaction runtime (click, form submit, hover, parallax, progress tracking).
- Test reader experience pack (TOC, read time, bookmarks, share).
- Test framework adapters (Next.js, Nuxt, Astro) compile and hydrate without errors.
- Test lazy-loading boundaries for heavy blocks.

### D) CMS End-to-End QA
- Full content lifecycle: create entry → edit fields → save draft → request review →
  approve → schedule → publish → view public → unpublish.
- Role-based access: author, editor, reviewer, admin paths.
- Media library: upload, foldering, metadata, search/filter, referencing in entries.
- SEO metadata: title, description, keywords, OG image, canonical, slug uniqueness.
- Taxonomy: categories, tags, relationships.
- Webhooks/events: publish triggers fire correctly.

### E) Website & Blog Dogfooding QA
- Studio: create/edit/review/schedule/publish flows in `apps/website/app/studio`.
- Preview: reader preview renders authored content accurately.
- Blog feed: locally published entries hydrate into `/blog` correctly.
- Offline serving: `npm run serve:offline` serves the full site without network deps.
- Navigation, branding, and marketing pages remain intact.

### F) Security Audit
- XSS: attempt script injection through block data, URLs, and metadata fields.
- CSP: verify header/configuration recommendations exist and are documented.
- CORS: verify allowlist and preflight behavior.
- API key encryption: verify encryption/decryption and rotation utilities.
- Input sanitization: verify HTML/URL sanitization in paste and block data.

### G) Performance Audit
- Bundle analysis for `@pulse/core`, `@pulse/editor`, `@pulse/renderer`, `@pulse/blocks`.
- Render performance: large documents (100+ blocks) render without jank.
- Animation performance: scroll and parallax effects throttle correctly.
- Lazy loading: heavy blocks defer correctly and hydrate cleanly.
- Memory leaks: event listeners and subscriptions clean up on unmount.

### H) Bug Bash & Regression Closure
- Collate findings from sessions L-2 through L-12.
- Fix all P0 bugs and as many P1 bugs as capacity allows.
- Re-run affected tests and manual verification steps.
- Update `docs/FEATURES.md` status for any feature that required correction.

---

## ✅ Exit Criteria

This gate is complete only when all criteria pass:

1. **Block Matrix:** Every block type has been manually verified in editor and renderer with
   no P0 or unresolved P1 defects.
2. **Editor UX Checklist:** All interaction paths (command, shortcut, menu, toolbar, DnD,
   clipboard) pass manual verification with no P0/P1 defects.
3. **Renderer Checklist:** Layout, animation, interaction, and reader-experience features pass
   manual verification with no P0/P1 defects.
4. **CMS Checklist:** At least one complete content lifecycle has been executed manually for
   each major content type with no P0/P1 defects.
5. **Website Checklist:** The Pulse studio and blog surfaces are usable offline and online
   with no P0/P1 defects.
6. **Security Checklist:** XSS injection attempts are sanitized; API-key utilities behave
   correctly; no high-severity security gaps remain.
7. **Performance Checklist:** Bundle sizes are within architecture targets; no critical perf
   regressions in render or animation paths.
8. **Bug Closure:** All P0 bugs found during the gate are closed. P1 bugs are either closed
   or intentionally deferred with rationale.
9. **Quality Gates Pass:**
   - `npm run docs:check`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - `npm run test`
10. **Documentation Sync:** `docs/FEATURES.md`, `backlog/BACKLOG.md`, `backlog/DONE.md`,
    `docs/memory/CONTEXT_SNAPSHOT.md`, and `docs/memory/CONVERSATION_LOG.md` reflect the
    launch-ready state.

---

## 🗂️ Session Plan (L-1 to L-14)

### L-1 — Test Strategy & Environment Setup
- **Goal:** Define the validation matrix, bug-report template, and session-by-session checklist.
- **Tasks:**
  - Create `docs/launch/BLOCK_TEST_MATRIX.md` mapping every block to editor/renderer tests.
  - Create `docs/launch/SECURITY_AUDIT_CHECKLIST.md`.
  - Create `docs/launch/PERF_AUDIT_CHECKLIST.md`.
  - Define severity labels: `P0` (launch blocker), `P1` (fix before Phase 4), `P2` (defer).
  - Set up a `BUG_LOG.md` in `docs/launch/`.
- **User Feedback Protocol:**
  - Agent shares the test matrix for review.
  - User confirms the matrix covers all blocks and workflows they care about.
  - User approves severity definitions.
- **Acceptance:** Test matrices exist, are complete, and are approved by user.

### L-2 — Basic Blocks QA (Editor + Renderer)
- **Goal:** Verify all basic blocks in editor and rendered output.
- **Blocks:** Paragraph, Heading (H1-H6), Ordered List, Unordered List, Blockquote, Code Block,
  Inline Code, Horizontal Rule, Link, Image.
- **Tasks:**
  - Insert each block via slash command, shortcut, and context menu.
  - Edit block data and verify state persistence.
  - Copy/paste blocks between documents.
  - Verify renderer output for each block (SSR + hydrated).
  - Verify mobile rendering.
- **User Feedback Protocol:**
  - Agent provides a checklist: "Create a post with each basic block. Verify: (1) insert works
    via `/`, shortcut, and right-click, (2) edit and save without errors, (3) renderer shows
    correct HTML, (4) mobile view is readable. Report any block that fails."
  - User walks through the checklist and reports `PASS`/`FAIL` per block with notes.
- **Acceptance:** All basic blocks pass manual verification; any defects are logged.

### L-3 — Media Blocks QA
- **Goal:** Verify Image, Video, Audio, File, Embed blocks and metadata integrity.
- **Tasks:**
  - Test image with alt text, title, credit, source, license.
  - Test video/audio embed and file download block.
  - Test generic embed (iframe) with various URLs.
  - Verify metadata round-trips through save/load.
  - Verify renderer exposes attribution metadata.
- **User Feedback Protocol:**
  - Agent provides checklist for media blocks including metadata fields.
  - User tests upload/insert, fills metadata, saves, and verifies renderer output.
- **Acceptance:** All media blocks and metadata fields work correctly.

### L-4 — Interactive Blocks QA
- **Goal:** Verify Quiz, Poll, Survey, Flashcard, Accordion, Tabs, Toggle, Spoiler.
- **Tasks:**
  - Configure each interactive block in the editor.
  - Verify renderer interactivity (answer selection, result display, toggle behavior).
  - Verify state reset and re-interaction.
  - Test SSR fallback (non-interactive static output before hydration).
- **User Feedback Protocol:**
  - Agent provides per-block interaction scripts (e.g., "Create a quiz, add 3 options, mark
    correct answer, publish, open preview, select wrong then correct answer, verify feedback
    text appears.").
  - User executes scripts and reports results.
- **Acceptance:** All interactive blocks behave correctly in editor and renderer.

### L-5 — Advanced & Creative Blocks QA
- **Goal:** Verify Table, Chart, Map, Code Playground, Math, Diagram, Timeline, Comparison,
  Before/After, Manga Panel, Speech Bubble, Callout, Alert, Card, Hero, Gallery, Carousel,
  Annotated Image.
- **Tasks:**
  - Insert and configure each block.
  - Verify schema validation catches common misconfigurations.
  - Verify renderer output matches configuration.
  - Test heavy blocks (Chart, Map, Code Playground) with lazy loading.
- **User Feedback Protocol:**
  - Agent provides checklist grouped by block family.
  - User tests a representative sample or all blocks depending on time.
- **Acceptance:** All advanced/creative blocks render correctly with no console errors.

### L-6 — Editor Core UX QA
- **Goal:** Validate all editor interaction surfaces.
- **Tasks:**
  - Slash commands: trigger `/`, search, nested categories, recent commands, aliases,
    preview, Enter vs Tab acceptance.
  - Backslash macros: trigger `\`, quick inserts, variables, templates, custom macros.
  - Shortcuts: default set, custom shortcuts, chord shortcuts, platform-specific mod key.
  - Context menus: block menu, selection menu, empty-space menu, keyboard navigation.
  - Toolbar: floating toolbar on selection, fixed toolbar, responsive collapse.
  - Drag and drop: reorder blocks, multi-select drag, drop indicators.
  - Clipboard: copy, cut, paste, paste cleanup (if implemented).
  - Undo/redo: history stack, coalescing, boundary markers.
  - Multi-select: select multiple blocks, batch delete/duplicate/move.
  - Block search and templates.
- **User Feedback Protocol:**
  - Agent provides a UX walkthrough script: "Open manual-lab or website studio. Perform each
    action in the list and mark PASS/FAIL. Note any unexpected behavior, missing command, or
    broken shortcut."
  - User runs through the script.
- **Acceptance:** All editor UX paths work as documented; no broken shortcuts or menus.

### L-7 — Renderer QA — Layout & Responsive
- **Goal:** Validate layout engine and responsive behavior.
- **Tasks:**
  - Test single-column default at mobile/tablet/desktop widths.
  - Test multi-column and grid layout modes.
  - Test full-width breakout blocks.
  - Test manga layout panel sizing.
  - Test sticky element behavior.
  - Test custom spacing tokens (`blockGap`, `rowGap`, `columnGap`, `outerPadding`).
  - Test RTL layout direction.
- **User Feedback Protocol:**
  - Agent provides viewport sizes to test and expected behavior per layout mode.
  - User resizes browser or uses DevTools device emulation and reports layout issues.
- **Acceptance:** Layouts are responsive and correct across tested viewports.

### L-8 — Renderer QA — Animation & Interaction
- **Goal:** Validate animation system and interaction runtime.
- **Tasks:**
  - Test scroll-triggered fade/slide animations.
  - Test parallax effect with scroll.
  - Test hover effects.
  - Test click interaction dispatcher.
  - Test form submission in interactive blocks.
  - Test progress tracking signal.
  - Verify `prefers-reduced-motion` disables animations gracefully.
- **User Feedback Protocol:**
  - Agent provides steps to trigger each animation/interaction and expected visual result.
  - User tests with OS reduced-motion setting on and off.
- **Acceptance:** Animations and interactions are smooth and respect accessibility settings.

### L-9 — CMS End-to-End QA
- **Goal:** Validate the full CMS workflow surface.
- **Tasks:**
  - Create a content type, add fields, create an entry.
  - Move entry through draft → review → approved → scheduled → published.
  - Test role restrictions (author cannot publish without approval, etc.).
  - Test media library upload, foldering, metadata, and entry reference.
  - Test taxonomy assignment and filtering.
  - Test SEO metadata form and validation.
  - Test webhook/event firing on publish.
  - Test revision history viewing and comparison.
- **User Feedback Protocol:**
  - Agent provides a CMS lifecycle script with expected outcomes at each step.
  - User executes the script in the website studio or CMS admin surface.
- **Acceptance:** CMS supports a complete publishing workflow without errors.

### L-10 — Website & Blog Dogfooding QA
- **Goal:** Validate Pulse-powered website surfaces.
- **Tasks:**
  - Author a realistic blog post in the studio using a variety of blocks.
  - Preview the post and verify renderer accuracy.
  - Publish and verify it appears in `/blog` feed.
  - Verify offline serving (`npm run serve:offline`) shows studio, preview, and blog.
  - Verify navigation between marketing pages, studio, preview, and blog.
  - Test brand consistency (logo, colors, fonts) across pages.
- **User Feedback Protocol:**
  - Agent asks user to author a real post and share observations.
  - User reports any studio bugs, rendering mismatches, or navigation issues.
- **Acceptance:** A real post can be authored, previewed, published, and read end-to-end.

### L-11 — Security Audit
- **Goal:** Identify and fix security gaps.
- **Tasks:**
  - Review XSS sanitization in block data, URLs, and HTML content.
  - Review CSP recommendations and document any gaps.
  - Review CORS configuration for media/embed paths.
  - Review API-key encryption/decryption flow.
  - Test injection payloads in manual-lab or studio inputs.
  - Verify block schema validation rejects malicious data shapes.
- **User Feedback Protocol:**
  - Agent provides a short list of safe test payloads (e.g., `<script>alert(1)</script>` in
    paragraph text, image URL, embed URL).
  - User inserts payloads and confirms they are sanitized in renderer output.
- **Acceptance:** No high-severity security vulnerabilities remain open.

### L-12 — Performance Audit
- **Goal:** Ensure performance meets architecture targets.
- **Tasks:**
  - Measure bundle sizes for core, editor, renderer, blocks.
  - Render a document with 100+ blocks and measure render time.
  - Profile scroll/animation performance for jank.
  - Verify lazy loading defers heavy block hydration.
  - Check for memory leaks in event subscriptions.
- **User Feedback Protocol:**
  - Agent asks user to open a large post and scroll; user reports perceived smoothness.
- **Acceptance:** Performance metrics are within targets; no critical regressions.

### L-13 — Bug Bash & Regression Fix
- **Goal:** Close all launch-blocking bugs.
- **Tasks:**
  - Triage `docs/launch/BUG_LOG.md`: mark P0/P1/P2.
  - Fix all P0 bugs. Fix P1 bugs as capacity allows.
  - Write regression tests for every fixed bug.
  - Re-run manual verification for affected blocks/features.
  - Update `docs/FEATURES.md` if any feature required significant correction.
- **User Feedback Protocol:**
  - Agent shares the bug list and asks user to verify fixes for any bugs they reported.
- **Acceptance:** No P0 bugs remain; P1 bugs are closed or deferred with rationale.

### L-14 — Final Validation & Launch Sign-off
- **Goal:** Freeze launch scope and produce clean handoff to Phase 4.
- **Tasks:**
  - Run full quality gates: `docs:check`, `lint`, `typecheck`, `build`, `test`.
  - Verify all `docs/FEATURES.md` rows for Phases 1-3 and PM4 are `✅` or intentionally deferred.
  - Complete `docs/launch/LAUNCH_SIGNOFF.md` with evidence links.
  - Sync `BACKLOG`, `DONE`, `CONTEXT_SNAPSHOT`, `CONVERSATION_LOG`.
  - Document handoff contracts for Phase 4 (AI) — stable editor/CMS/renderer baselines.
- **User Feedback Protocol:**
  - Agent presents the launch sign-off checklist.
  - User confirms they are satisfied with product readiness for launch.
- **Acceptance:** All exit criteria pass; user approves launch readiness; Phase 4 is unblocked.

---

## 📌 Execution Log

### L-1 — Test Strategy & Environment Setup
**Date:** 2026-05-01  
**Status:** ✅ Complete  
**Notes:** Test matrices and checklists created. Two pre-existing P1 build/test bugs (L-0-001, L-0-002) fixed and verified. All quality gates pass. Ready for L-2 block QA.

---

## ⚠️ Risks

- **Scope creep:** Bug fixes can expand into feature rewrites. Strict P0/P1 triage is required.
- **Environment mismatch:** User tests in Windows/WSL + browser; agent tests in Node/vitest.
  Repro steps must be precise.
- **Network constraints:** Playwright/browser E2E remains skipped; manual verification is
  the primary validation path for website surfaces.
- **Documentation drift:** Fixing bugs without updating FEATURES.md or CONTEXT_SNAPSHOT.md
  can create state inconsistency.

---

## 🔄 Handoff to Phase 4

Phase 4 (AI) starts only after this launch gate provides:

- Verified block registry with every block type tested in editor and renderer.
- Stable editor UX with no broken commands, shortcuts, menus, or DnD.
- Stable renderer with responsive, animated, and accessible output.
- Stable CMS with complete content lifecycle and role-based workflow.
- Stable website/blog dogfooding surface.
- Security and performance baselines documented and passing.
- All launch-blocking bugs closed.
