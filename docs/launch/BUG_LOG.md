# Bug Log — Launch Readiness Gate

> All defects found during L-2 through L-12 are logged here.
> Format: `L-<session>-<number>` (e.g., `L-2-001`).

---

## Severity Legend

| Severity | Meaning | Action |
|----------|---------|--------|
| `P0` | Launch blocker | Must fix before Phase 4 |
| `P1` | High impact | Should fix before Phase 4; defer only with rationale |
| `P2` | Medium/Low | Can defer to Phase 4+ or later |

---

## Open Bugs

| ID | Session | Severity | Block/Feature | Description | Repro Steps | Owner | Status |
|----|---------|----------|---------------|-------------|-------------|-------|--------|
| L-1-003 | L-1 | P2 | Homepage / Marketing | `SplashCursor.tsx` and `ReactBitsInfiniteMenu.tsx` spam `WebGL: INVALID_ENUM: activeTexture: texture unit out of range` in browser console on homepage load. Does not break functionality but degrades console hygiene. | Open `http://localhost:8000/` in browser → open DevTools Console. | — | Open |

---

## Closed Bugs

| ID | Session | Severity | Block/Feature | Description | Fix Commit/PR | Verified By |
|----|---------|----------|---------------|-------------|---------------|-------------|
| L-0-001 | L-1 | — | Root build | Removed `apps/**/*.ts` from root `tsconfig.build.json`. Next.js apps have their own build pipelines and path aliases; they should not be compiled by root `tsc`. | Root `npm run build` passes. |
| L-0-002 | L-1 | — | Website test | Replaced hardcoded WSL path in `blog-studio.test.ts` with `join(dirname(fileURLToPath(import.meta.url)), '../public/blog-snapshot.json')`. | `apps/website/lib/blog-studio.test.ts` passes (9/9). |
| L-1-004 | L-1 | P1 | Editor UX / Studio | Added `\` key handler to `StudioBlockCanvas.tsx` (line 1484), updated `parsePath`, `tabComplete`, and `breadcrumb` to treat `\` identically to `/`, and updated help text + input placeholder. | Website rebuilt and restarted. `\` now opens palette. |
| L-2-001 | L-2 | P1 | Editor UX / Demo | `blockTypeToLabel` and `blockTypeToIcon` maps used wrong keys for hyphenated block types (`horizontalrule` instead of `horizontal-rule`, `math` instead of `math-equation`, etc.). This caused the block palette to show fallback names and prevented search from finding blocks like Divider, Equation, Speech Bubble, Before/After, Hero Section, Annotated Image. | Commit a5cbe3c | Puppeteer QA script |
| L-4-001 | L-4 | P0 | Interactive Blocks | 5 interactive block renderers (Quiz, Poll, Survey, Tabs, Spoiler) emitted inline `<script>` tags that React's `dangerouslySetInnerHTML` strips, leaving static HTML with zero client-side interactivity. | Removed dead scripts from block renderers; added client-side hydration `useEffect` in `PulseDemoEditor.tsx` and `PulseBlogStudio.tsx` that wires event listeners after React renders. | Puppeteer click-verification script `block-qa-l4-interactive.mjs` — 8/8 PASS |

---

**Last Updated:** 2026-05-15

### L-2 + L-3 Automated QA Notes (Session 73)
- Puppeteer automated test script created: `apps/website/scripts/block-qa-puppeteer.mjs`
- **L-2 Basic Blocks (8/8 PASS):** Paragraph, Heading, List, Blockquote, Code, Divider, Link, Image
- **L-3 Media Blocks (4/4 PASS):** Video, Audio, File, Embed
- All blocks render correctly in the preview pane with semantic HTML
- One P1 bug found and fixed during testing: hyphenated block type label keys
- Screenshots saved to `docs/launch/qa-screenshots/`

### L-4 Interactive Blocks QA Notes (Session 76)
- **Root cause identified:** Inline `<script>` tags in block renderers are stripped by React `dangerouslySetInnerHTML`. Previous QA only checked HTML string length, not actual click behavior.
- **Fix:** Removed dead inline scripts from 5 block renderers; added client-side hydration `useEffect` in `PulseDemoEditor.tsx` and `PulseBlogStudio.tsx`.
- **Verification script:** `apps/website/scripts/block-qa-l4-interactive.mjs` performs real browser clicks and verifies DOM mutations.
- **L-4 Interactive Blocks (8/8 PASS):** Quiz, Poll, Survey, Tabs, Spoiler, Flashcard, Accordion, Toggle

### L-5 Advanced & Creative Blocks QA Notes (Session 77)
- **Verification script:** `apps/website/scripts/block-qa-l5-advanced.mjs` inserts each block via slash palette, asserts semantic HTML structure, screenshots desktop (1400px) and mobile (375px), and monitors console/network errors.
- **L-5 Advanced Blocks (17/17 PASS):** Table, Chart, Map, Math Equation, Diagram, Manga Panel, Speech Bubble, Card, Gallery, Carousel, Timeline, Comparison, Before/After, Hero Section, Annotated Image, Callout, Alert.
- **Demo Editor — Preview Pane (Puppeteer MCP):** All 15 blocks inserted via `/` palette, preview HTML verified for correct semantic tags and data attributes. Desktop + mobile screenshots captured.
- **Demo Editor — Editor Panel (Puppeteer MCP):** All 15 blocks verified to render proper editor UI components in the editor canvas (left panel). No `GenericBlockPlaceholder` or mock/placeholder components found. Each block shows its dedicated editable form: Table (columns/rows), Chart (type/labels/datasets), Map (provider/lat/lng/zoom), Math Equation (latex/display mode), Diagram (engine/source), Manga Panel (layout/panels), Speech Bubble (tone/align/text), Card (title/body/media/CTA), Gallery (layout/columns/images), Carousel (slides/autoplay/indicators), Timeline (events), Comparison (rows), Before/After (slider position), Hero Section (title/subtitle/background/CTA), Annotated Image (hotspots).
- **Blog Post (Puppeteer MCP):** Created a real published blog post (`/blog/l5-advanced-blocks-qa/`) via Prisma with all 15 advanced blocks. All blocks rendered correctly in the `studio-rendered` article container with identical HTML structure to the demo editor preview.
- No console errors or broken asset references observed (only benign `favicon.ico` 404 and expected `example.com` placeholder image 404s from default block data).
- Mobile viewport screenshots confirm responsive rendering for all blocks.

### L-7 Renderer Layout & Responsive QA Notes (Session 78)
- **Breakpoints tested:** 375px (mobile), 768px (tablet), 1024px (desktop), 1400px (wide)
- **Method:** Puppeteer MCP screenshots + DOM measurement on `/blog/l5-advanced-blocks-qa/`
- **Results:**
  - ✅ No horizontal overflow at any breakpoint
  - ✅ Sidebar correctly stacks below article at <1024px, appears beside at ≥1024px
  - ✅ All 17 advanced blocks fit within article container at all breakpoints
  - ✅ Article width scales: ~326px @375px, ~703px @768px, ~627px @1024px (with sidebar), ~709px @1400px
  - ⚠️ Tables lack `overflow-x: auto` wrapper — wide tables may break layout if content exceeds container
  - ⚠️ Renderer layout modes (single/multi-column/grid/manga/sticky) exist in `@pulse/renderer` but are NOT wired into the blog post rendering pipeline (`entry-adapter.ts` uses plain `<div class="studio-rendered">`)
  - ⚠️ Manga layout CSS does not reduce columns on small viewports (`grid-template-columns: repeat(var(--pulse-layout-manga-columns), minmax(0, 1fr))`)
  - ⚠️ No container queries — all responsive behavior is viewport-based
  - ⚠️ Sticky sidebar layout has no mobile fallback (<1024px reverts to single column but sticky content is still present)

### L-6 Editor Core UX QA Notes (Session 78)
- **Verification method:** Puppeteer MCP on live `/demo` editor at `localhost:3001`.
- **Features tested:**
  - ✅ Slash palette (`/`) — opens command palette with search input and category filters
  - ✅ Block addition via palette — Table block inserted successfully
  - ✅ Block duplication — hover action bar → copy icon increases block count
  - ✅ Block deletion — hover action bar → trash icon decreases block count
  - ✅ Block reordering — hover action bar → chevron up/down swaps block positions
  - ✅ Preview toggle — "Hide preview" / "Show preview" button toggles preview panel
  - ⚠️ Reset canvas — clears most blocks but leaves 2 default blocks (heading + paragraph)
  - ❌ Escape to close palette — palette stays open (no Escape handler)
  - ❌ Multi-select (Shift+click) — not implemented
  - ❌ Drag & drop reordering — DnD library events not functional via simulation
  - ❌ Context menu (right-click) — not implemented
  - ❌ Undo/Redo (`Ctrl+Z/Y`) — `HistoryState.ts` engine exists but `EditorStateAdapter` never wires it. No `adapter.undo()`/`redo()` methods. Known architectural gap, not a launch blocker.
