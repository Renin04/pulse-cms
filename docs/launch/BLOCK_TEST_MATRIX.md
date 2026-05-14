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
| Quiz | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Poll | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Survey | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Flashcard | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Accordion | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Tabs | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Toggle | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Spoiler | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |

## Advanced & Creative Blocks

| Block | Insert | Configure | Renderer output | Lazy loaded | Mobile OK | Status |
|-------|--------|-----------|-----------------|-------------|-----------|--------|
| Table | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Chart | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Map | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Code Playground | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Math Equation | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Diagram | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Timeline | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Comparison | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Before/After | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Manga Panel | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Speech Bubble | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Callout | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Alert | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Card | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Hero Section | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Gallery | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Carousel | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| Annotated Image | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |

## Branching & Conditional

| Block | Configure | Renderer eval | SSR eval | Mobile OK | Status |
|-------|-----------|---------------|----------|-----------|--------|
| Branch Block | ⬜ | ⬜ | ⬜ | ⬜ | |
| Conditional Block | ⬜ | ⬜ | ⬜ | ⬜ | |

---

**Last Updated:** 2026-05-01  
**Tester:** _______________
