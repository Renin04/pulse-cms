# Performance Audit Checklist — Launch Readiness Gate

> Validate performance baselines before launch.

---

## Bundle Size

| Package | Target (gzipped) | Actual | Status |
|---------|------------------|--------|--------|
| `@pulse/core` | < 50 KB | | |
| `@pulse/editor` | < 200 KB | | |
| `@pulse/renderer` | < 100 KB | | |
| `@pulse/blocks` | < 100 KB | | |
| `@pulse/react` | < 50 KB | | |

## Runtime Performance

- [ ] **Large document render:** 100+ blocks render without frame drops (> 30 fps).
- [ ] **Scroll jank:** Long pages with animations scroll smoothly.
- [ ] **Parallax throttle:** Parallax updates do not exceed 60 fps budget.
- [ ] **Lazy loading:** Heavy blocks (Chart, Map, Code Playground) defer hydration until
  intersection.
- [ ] **Memory leaks:** Event listeners and subscriptions are cleaned up on unmount.

## Editor Performance

- [ ] **Typing latency:** Keypress to visual update < 16 ms for text blocks.
- [ ] **Autosave debounce:** Save triggers do not block the main thread.
- [ ] **Block inspector:** Opening inspector on large documents does not freeze UI.

## Website Performance

- [ ] **Static export:** `apps/website` static export builds successfully.
- [ ] **Offline serving:** `npm run serve:offline` responds quickly for all routes.
- [ ] **LCP:** Largest Contentful Paint for blog posts is reasonable (target < 2.5 s).

---

**Auditor:** _______________  
**Date:** _______________  
**Result:** `PASS` / `PASS WITH DEFERRALS` / `FAIL`
