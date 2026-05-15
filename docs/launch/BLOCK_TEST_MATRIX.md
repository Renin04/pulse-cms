# Block Test Matrix — Launch Readiness Gate

> One row per block type. Mark each cell after manual verification.
> Status: `⬜` = not tested, `✅` = pass, `❌` = fail (link to bug in BUG_LOG.md)

---

## Basic Blocks

| Block | Insert (/) | Insert (shortcut) | Insert (menu) | Edit data | Copy/paste | Renderer SSR | Renderer hydrated | Mobile OK | Status |
|-------|------------|-------------------|---------------|-----------|------------|--------------|-------------------|-----------|--------|
| Paragraph | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ | ✅ | |
| Heading H1-H6 | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ | ✅ | |
| Ordered List | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ | ✅ | |
| Unordered List | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ | ✅ | |
| Blockquote | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ | ✅ | |
| Code Block | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ | ✅ | |
| Inline Code | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ | ✅ | |
| Horizontal Rule | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ | ✅ | |
| Link | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ | ✅ | |
| Image | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ | ✅ | |

## Media Blocks

| Block | Insert | Edit metadata | Save/load round-trip | Renderer output | Alt text exposed | Mobile OK | Status |
|-------|--------|---------------|----------------------|-----------------|------------------|-----------|--------|
| Image (extended) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Video | ⬜ | ⬜ | ⬜ | ⬜ | — | ⬜ | |
| Audio | ⬜ | ⬜ | ⬜ | ⬜ | — | ⬜ | |
| File | ⬜ | ⬜ | ⬜ | ⬜ | — | ⬜ | |
| Embed | ⬜ | ⬜ | ⬜ | ⬜ | — | ⬜ | |

## Interactive Blocks

| Block | Configure | Interact (renderer) | SSR fallback | State reset | Mobile OK | Status |
|-------|-----------|---------------------|--------------|-------------|-----------|--------|
| Quiz | ✅ | ✅ | ✅ | ✅ | ⬜ | **PASS** |
| Poll | ✅ | ✅ | ✅ | ✅ | ⬜ | **PASS** |
| Survey | ✅ | ✅ | ✅ | ✅ | ⬜ | **PASS** |
| Flashcard | ✅ | ✅ | ✅ | ✅ | ⬜ | **PASS** |
| Accordion | ✅ | ✅ | ✅ | ✅ | ⬜ | **PASS** |
| Tabs | ✅ | ✅ | ✅ | ✅ | ⬜ | **PASS** |
| Toggle | ✅ | ✅ | ✅ | ✅ | ⬜ | **PASS** |
| Spoiler | ✅ | ✅ | ✅ | ✅ | ⬜ | **PASS** |

## Advanced & Creative Blocks

| Block | Insert | Configure | Renderer output | Lazy loaded | Mobile OK | Status |
|-------|--------|-----------|-----------------|-------------|-----------|--------|
| Table | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Chart | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Map | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Math Equation | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Diagram | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Timeline | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Comparison | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Before/After | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Manga Panel | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Speech Bubble | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Card | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Hero Section | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Gallery | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Carousel | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Annotated Image | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Callout | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |
| Alert | ✅ | ✅ | ✅ | ⬜ | ✅ | **PASS** |

## Branching & Conditional

| Block | Configure | Renderer eval | SSR eval | Mobile OK | Status |
|-------|-----------|---------------|----------|-----------|--------|
| Branch Block | ⬜ | ⬜ | ⬜ | ⬜ | |
| Conditional Block | ⬜ | ⬜ | ⬜ | ⬜ | |

## Editor Core UX (L-6)

| Feature | Test Method | Result | Notes |
|---------|-------------|--------|-------|
| Slash palette (`/`) | Puppeteer keypress | ✅ | Opens with search input, filters blocks correctly |
| Backslash macro (`\\`) | Puppeteer keypress | ⚠️ | Opens same palette as `/` (no separate macro system in demo) |
| Block addition via palette | Click "Table" block | ✅ | Block added to canvas, preview updated |
| Block duplication (copy icon) | Click copy button | ✅ | Block count increases |
| Block deletion (trash icon) | Click trash button | ✅ | Block count decreases |
| Block reordering (chevrons) | Click down chevron | ✅ | Blocks swap positions correctly |
| Preview toggle | Click "Hide preview" | ✅ | Button text toggles to "Show preview" |
| Reset canvas | Click "Reset" | ⚠️ | Clears most blocks but leaves 2 default blocks |
| Keyboard shortcut `/` | Puppeteer keydown | ✅ | Opens command palette |
| Keyboard shortcut `Escape` | Puppeteer keydown | ❌ | Does NOT close palette (documented gap) |
| Multi-select (Shift+click) | Puppeteer mouse event | ❌ | Not implemented |
| Drag & drop reordering | DragEvent simulation | ❌ | Not functional via DnD library |
| Context menu (right-click) | contextmenu event | ❌ | Not implemented |
| Undo/Redo (`Ctrl+Z/Y`) | Puppeteer keydown | ❌ | Infrastructure exists but unwired (L-6-001) |

---

**Last Updated:** 2026-05-15  
**Tester:** Puppeteer QA script `block-qa-l6-editor-ux.mjs`
