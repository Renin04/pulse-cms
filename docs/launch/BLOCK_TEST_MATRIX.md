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
| Callout | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Alert | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |

## Branching & Conditional

| Block | Configure | Renderer eval | SSR eval | Mobile OK | Status |
|-------|-----------|---------------|----------|-----------|--------|
| Branch Block | ⬜ | ⬜ | ⬜ | ⬜ | |
| Conditional Block | ⬜ | ⬜ | ⬜ | ⬜ | |

---

**Last Updated:** 2026-05-15  
**Tester:** Puppeteer QA script `block-qa-l5-advanced.mjs`
