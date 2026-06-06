# Context Snapshot — Current State

> Quick reference for the next agent session.
> Update this at the end of every session.

**Last Updated:** 2026-06-06
**Current Session:** Session 97 — Bugs 91/92/93/94/95 (Survey block: editor, renderer redesign, results storage, multiple choice, text input)
**Current Phase:** Phase 4 — AI Builder & Automation Runtime (bug-fixing branch)

---

## Current Focus

**What we just completed (Session 97):**
- Bug #91: Survey block is now fully editable in the studio. `EditableSurvey` component with title, description, question CRUD (add/remove/reorder), type selector, required toggle, options management for single/multi, and scale config for rating.
- Bug #92: Complete renderer redesign. Warm off-white card with red gradient accent bar, numbered red badge questions, circular rating buttons with pop animation, card-style option selections with custom radio/checkbox indicators, clean textarea, animated success state with checkmark. Responsive and dark mode support.
- Bug #93: Survey results storage and admin visibility. Added `SurveyResponse` Prisma model with migration. `POST /api/surveys/submit` stores responses per-question. `GET /api/surveys/results` aggregates by question (frequency bars for choice/rating, text samples for open-ended). "View Results" button in editor shows inline results panel.
- Bug #94: Multiple choice supported via `single` (radio) and `multi` (checkbox) question types.
- Bug #95: Four input types supported: `text` (textarea), `single`, `multi`, `rating` (1-N scale). Type dropdown in editor with auto-config defaults.
- Client-side hydration in `BlogPostContent.tsx` intercepts survey form submissions, POSTs to API, shows success state, and restores submitted state on reload via localStorage backup.

**What we just completed (Session 96):**
- Bug #40: New "code-sandbox" block type with interactive code execution. Supports JS/TS/HTML/CSS/JSON via iframe sandbox, Python via Pyodide (WASM), graceful fallback for Go/Rust/Bash/HTTP/Markdown. Editor has dark IDE-style textarea, language selector, line numbers toggle, inline Test Run.
- Bug #41: Image width/height ratio fixed. Render clamping changed from zeroing to capping. Editor added aspect ratio lock toggle.
- Bug #42: Separate captionAlign field independent of image align.
- Bug #43: Image displaySize option (small/medium/large/full) with max constraints. Reduced margins, added hover zoom.
- Bug #44: Image format field (original/webp/jpeg/png) with server-side conversion.
- Bug #45: Better caption UI with styled wrapper, attribution badge, textarea with counter.
- Bug #46: YouTube localhost blocking fixed via privacyMode (youtube-nocookie.com), credentialless iframe, fallback placeholder.
- Bug #47: Video optimization options: quality, poster, loop, muted, controls.
- Bug #48: Video start-at uses HH:MM:SS format with parseTimeToSeconds helper.
- Bug #49: Creative video card UI with dark theme, play button overlay, gradient caption badge, 16:9 aspect ratio.
- Bug #50: Video loading stability with stable wrapper, lazy loading, preload metadata.
- Bug #51: Video preview in editor: actual video for HTML5, thumbnail for YouTube/Vimeo.
- Quality gates: lint, typecheck, build, test (51 files, 1071 tests) green.
- Session 96b fixes: Code sandbox now reader-editable (textarea + Run in blog post). Image align fixed (margin auto). Format conversion works via mediaApi.update. Compression quality slider added. File size display. Aspect lock defaults OFF. Removed card shadow/hover zoom; alt text as tooltip. Video fallback styling fixed (white bg, red text). Fallback only shows on iframe error. Upload size limit type-aware (100MB video, 10MB image). Clean editor UI for both image and video blocks.
- Session 96c fixes: Code sandbox redesigned to match code block UI exactly � .pulse-code-block with Code/Output tabs, Run button, dark textarea editor. Event delegation handles Run for both code blocks and sandbox blocks. Image align fixed by applying margin styles directly on <img>. Video YouTube/Vimeo uses click-to-load pattern (thumbnail + play button + "Click to load video" + "Watch on YouTube/Vimeo" link) avoiding all localhost blocking issues. Video fallback button styling fixed to red background with white text.

**What we just completed (Session 95):**
- Bug #35: Code syntax highlighting with Shiki v4. Integrated `createHighlighter` for 13 languages (typescript, tsx, javascript, jsx, json, html, css, markdown, bash, http, python, go, rust) with github-light/github-dark themes. Server-side rendering awaits Shiki before generating HTML; client-side initializes fire-and-forget with fallback. Renderer wraps output in `.pulse-code-block` with macOS window chrome header.
- Bug #36: Code sandbox runtime. Built `CodeSandbox` component with iframe-based safe execution (`sandbox="allow-scripts"`). Console output captured and displayed in styled output panel with red-accent header. Supports JS/TS/JSX/TSX/HTML/CSS/JSON.
- Bug #37: Demo mode (hidden code). Added `mode` field to code block: `show` (default), `run` (code + run button + output), `demo` (hides code, auto-runs on page load like Josh Comeau's blog). Mode toggle in editor toolbar with Eye/Play/Sparkles icons.
- Bug #38: Preview panel rendering. Fixed CSS for code blocks in preview: `.pulse-code-block` wrapper with header bar (red/yellow/green dots, language badge), dark blue-gray background (#1e1e2e), clean border matching editor design. Preview hydration mounts sandbox iframes for run/demo modes.
- Bug #39: Line numbers. Fixed with CSS counter approach (`counter-reset: pulse-line` on `code`, `counter-increment` on `.line::before`). Shiki already wraps lines in `<span class="line">`, so no post-processing needed. Proper left gutter with hover highlight.
- Bug #40: Run option in editor. Editor `EditableCode` has Run button in header for run/demo modes. Output panel shows directly below code. Writer can verify code works before publishing.
- Browser hang fix: Demo mode `useEffect` was re-running `runCode()` on every keystroke due to `code` dependency. Added `demoRanRef` to ensure demo only auto-runs once on mount.
- Design alignment: Preview/blog code blocks now match editor panel exactly (`var(--neutral-200)` border + subtle `0 2px 8px -2px` shadow).
- Files changed: `packages/blocks/src/CodeBlock.ts`, `packages/blocks/tests/blocks.test.ts`, `apps/website/lib/shiki-highlighter.ts` (new), `apps/website/lib/blog-studio.ts`, `apps/website/lib/entry-adapter.ts`, `apps/website/lib/blog-data.ts`, `apps/website/app/blog/[slug]/page.tsx`, `apps/website/app/components/CodeSandbox.tsx` (new), `apps/website/app/components/StudioBlockCanvas.tsx`, `apps/website/app/demo/PulseDemoEditor.tsx`, `apps/website/app/components/PulseBlogStudio.tsx`, `apps/website/app/globals.css`, `pulse bug list.md`.
- Quality gates passed: `lint`, `typecheck`, `build`, `test` (51 test files, 1071 tests passed) green.
- Commit: `39b715f` feat: code block syntax highlighting, sandbox runtime, demo mode

**What we just completed (Session 94):**
- Bug #30: Link block editor now has all rel options. `EditableLink` in `StudioBlockEditors.tsx` added nofollow, noopener, noreferrer, external checkboxes matching `LinkModal` parity. noopener auto-enforced when "Open in new tab" is checked.
- Bug #31: Custom tooltip UI across the studio. Created `StudioTooltip` component with dark rounded card, red accent dot, smooth fade+translate animation, and directional arrows. Replaced all native `title` attributes on toolbar buttons in `PulseBlogStudio.tsx` (via updated `IconBtn`) and `StudioBlockCanvas.tsx` block action toolbars. **Fix:** bumped z-index from 700 to 9999 to stay above all UI layers.
- Bug #32: Link options fully functional. `EditableLink` now stores `rel` correctly in block data. `LinkBlock.ts` renderer already supported all attributes (rel, target, title, align). noopener auto-enforcement prevents contrary options.
- Bug #33: Creative link preview card renderer. `LinkBlock.ts` now renders a beautiful link preview card instead of a bare `<a>` tag: brand-gradient icon badge with link SVG, bold link text title, extracted domain name, optional title subtitle (italic, better color), external-link arrow icon, subtle hover lift+shadow animation, and alignment support. **Fix:** card now uses `width:100%` to occupy the full row.
- Bug #34: Complete block palette redesign. Added `blockTypeToDescription` mapping with useful descriptions for every block type. Redesigned cards with better spacing, left red indicator stripe on hover, larger rounded icon badges with border, bold label + color-coded category badge + description layout, subtle hover lift+shadow. Category filter buttons now have color-coded borders (sky/media, emerald/interactive, violet/advanced, neutral/basic).
- Quick fixes during review: link card width 100%, tooltip z-index 9999, title text styled as italic subtitle.
- Files changed: `packages/blocks/src/LinkBlock.ts`, `apps/website/app/components/StudioBlockEditors.tsx`, `apps/website/app/components/StudioTooltip.tsx` (new), `apps/website/app/components/PulseBlogStudio.tsx`, `apps/website/app/components/StudioBlockCanvas.tsx`, `pulse bug list.md`.
- Quality gates passed: `lint`, `typecheck`, `build`, `test` (51 test files, 1071 tests passed) green.

**What we just completed (Session 93):**
- Bug #24: Fixed quote rendering in preview. `BlockquoteBlock.ts` core renderer now uses `renderInlineMarkdown` to handle links and references, matching `TextBlock`/`ListBlock` parity. Both preview panel and blog post render blockquote inline content correctly.
- Bug #25: Fixed preview panel device mode distinction. Changed device widths to fixed pixels (desktop 1200px, tablet 768px, mobile 375px). Added `ResizeObserver`-driven CSS `zoom` scaling so desktop layout shrinks to fit the panel width without horizontal scrolling. Mobile/tablet stay at native size. Clear visual distinction between all three modes, zero scrollbars.
- Bug #27: Live stats in editor. Added `LiveStats` sub-component in `PulseBlogStudio.tsx` that computes word count and read time directly from `editorBlocks` via newly-exported `countWords`/`formatReadTime` from `blog-studio.ts`. SEO score recomputes live from `draft` fields (title, excerpt, featured image, tags, word count, SEO title/description).
- Bug #28: Fixed duplicate position. `adapter.insertBlock(dup, index + 1)` now passes the correct insertion index so duplicates appear immediately after the original block.
- Bug #29: Added duplicate-without-content button. Uses `CopyX` icon (red hover) next to the regular duplicate. Creates an empty copy using the block type's `defaultData`, inserted right after the original.
- Files changed: `packages/blocks/src/BlockquoteBlock.ts`, `apps/website/lib/blog-studio.ts`, `apps/website/app/components/PulseBlogStudio.tsx`, `apps/website/app/components/StudioBlockCanvas.tsx`, `pulse bug list.md`.
- Quality gates passed: `lint`, `typecheck`, `build`, `test` (51 test files, 1071 tests passed) green.

**What we just completed (Session 92):**
- Bug #22: Commenting system for blocks. Built a creative threaded comment UI using the existing `CommentSystem` from `@pulse/core`. Features: per-block comment badges (amber dot with count on block hover), right-slide panel (380px) with filter tabs (all/active/resolved), admin selector dropdown, threaded replies with avatars/initials, resolve/reject/delete actions, time-ago timestamps, block reference navigation. Comments persisted per-entry in localStorage.
- Bug #23: Notebook for articles. Built a warm, creative notebook UI with paper-like amber theme. Features: pin/unpin notes, search filtering, author avatars with color coding, date stamps, expandable long notes with "read more", pinned-first sorting, smooth spring animations. Unique per article, persisted in localStorage. Accessible via Ctrl+Shift+N and toolbar button.
- Integration: Both panels integrated into `PulseBlogStudio.tsx` with keyboard shortcuts (Ctrl+Shift+C for comments, Ctrl+Shift+N for notebook), toolbar buttons with badges, mutual exclusivity (opening one closes others). Updated `StudioBlockCanvas.tsx` to show comment count badges on blocks and scroll-to-block navigation.
- Files changed: `apps/website/app/components/StudioCommentsPanel.tsx` (new), `apps/website/app/components/StudioNotebookPanel.tsx` (new), `apps/website/app/components/StudioBlockCanvas.tsx`, `apps/website/app/components/PulseBlogStudio.tsx`.
- Quality gates passed: `lint`, `typecheck`, `build`, `test` (51 test files, 1071 tests passed) green.

**Previous Session 91:**
- Bug #20: Separate link/ref/alignment controls for quote and citation in blockquote block. Citation is now `contentEditable` with full Link/Ref modal support, right-click context menus, and independent alignment (left/center/right/justify).
- Bug #21: Bolder, more creative quote block UI. Editor: rounded card with warm gradient background (`pulse-off-white` → white → `pulse-jasmine-light`), large serif decorative quotation mark, distinct typography (lg medium for quote, sm uppercase tracking-wide for citation). Renderer: gradient background with subtle shadow, decorative quote mark with text-shadow, gradient left accent bar, refined spacing and responsive breakpoints.
- Bug #19.1 (discovered during validation): Removing a reference caused duplicated text (e.g., "testtest" / "QuoteQuote"). Root cause: `selection.collapseToEnd()` was called before `document.execCommand('insertText')` in ref modal confirm handlers, preventing the selected text from being replaced — the markdown was appended after the original text. Removed `collapseToEnd()` from all ref confirm handlers (heading/text/blockquote in both `StudioBlockCanvas.tsx` and `PulseDemoEditor.tsx`). Also fixed broken context-menu ref removal in `PulseDemoEditor.tsx` heading/text blocks: they were comparing `span.textContent` (rendered number like "1") against `ref.text` (original text like "test") which always failed; now using captured `refContextMenu.element` directly.
- Files changed: `packages/blocks/src/BlockquoteBlock.ts`, `apps/website/app/components/StudioBlockCanvas.tsx`, `apps/website/app/demo/PulseDemoEditor.tsx`, `apps/website/lib/blog-studio.ts`, `apps/website/lib/entry-adapter.ts`, `apps/website/app/globals.css`.
- Quality gates passed: `lint`, `typecheck`, `build`, `test` (51 test files passed) green.

**Previous Session 88:**
- Bug #8.1: Fixed reference update not working — replaced fragile textContent matching with direct DOM element tracking (`existingRefElementRef`) across heading, text, and blockquote blocks.
- Bug #8.2: Reference now has all link options — RefModal rebuilt with nofollow, noopener, noreferrer, external checkboxes, matching LinkModal parity.
- Bug #8.3: Contrary options prevented + runtime safety — noopener is auto-enforced and disabled when "Open in new tab" is checked in both LinkModal and RefModal; rel attributes render correctly in preview and blog post; no runtime errors.
- Global sequential ref numbering: Editor reference numbers are now globally sequential (1,2,3,4,5) across all blocks instead of per-block restarting (1,2,1,2,3). Implemented via `useLayoutEffect` in `StudioBlockCanvas` that renumbers all `.pulse-editor-ref` spans after each render.
- Blockquote right-click: Added missing right-click context menu support for references in blockquote block.

**Previous Session 87:**
- Bug #6: Fixed reference rendering in editor — refs now show as superscript numbers (1, a, α, ا) via `pulse-reference-editor` class instead of plain citation text.
- Bug #7: Fixed severe reference UI render problem in blog post — resolved via #10 CSS fix and #8 URL fix.
- Bug #8: Fixed bare domain reference URLs becoming relative (`sanitizeUrl` now auto-prepends `https://`).
- Bug #10: Fixed duplicate numbers in reference footnotes list — increased CSS specificity to override Tailwind prose `ol` styles.
- Link duplication fix: Added `skipBlurRef` guard across heading/text/blockquote blocks in `StudioBlockCanvas.tsx` to prevent `onBlur` DOM reset during modal interaction.
- Can't-type-after-link fix: Added `\u200B` (zero-width space) after links/refs in `markdownToHtml`; stripped in `htmlToMarkdown`.
- Drag fix: Moved `draggable` from entire block wrapper to drag handle icon only.
- Link/Ref target support: Added "Open in new tab" checkbox to both LinkModal and RefModal with auto-`noopener` enforcement. Updated `renderInlineContent` in `blog-studio.ts` and `entry-adapter.ts` to render `target` attribute.

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
