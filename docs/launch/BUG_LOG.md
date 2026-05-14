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
| L-1-004 | L-1 | P1 | Editor UX / Studio | Backslash (`\`) macro trigger does not open the block palette in website studio. Only `/` works. Website studio uses a custom `StudioBlockCanvas` palette that only listens for `/` key. | Open studio → focus editor canvas → press `\`. Nothing happens. Press `/` → palette opens. | — | ✅ Fixed |

## Closed Bugs

| ID | Session | Severity | Block/Feature | Description | Fix Commit/PR | Verified By |
|----|---------|----------|---------------|-------------|---------------|-------------|
| L-0-001 | L-1 | Root build | Removed `apps/**/*.ts` from root `tsconfig.build.json`. Next.js apps have their own build pipelines and path aliases; they should not be compiled by root `tsc`. | Root `npm run build` passes. |
| L-0-002 | L-1 | Website test | Replaced hardcoded WSL path in `blog-studio.test.ts` with `join(dirname(fileURLToPath(import.meta.url)), '../public/blog-snapshot.json')`. | `apps/website/lib/blog-studio.test.ts` passes (9/9). |
| L-1-004 | L-1 | Editor UX / Studio | Added `\` key handler to `StudioBlockCanvas.tsx` (line 1484), updated `parsePath`, `tabComplete`, and `breadcrumb` to treat `\` identically to `/`, and updated help text + input placeholder. | Website rebuilt and restarted. `\` now opens palette. |

---

**Last Updated:** 2026-05-14 (L-2 automated basic blocks QA — no new defects)

### L-2 Automated QA Notes
- All 10 basic block types were created via API and verified in both editor and renderer using Puppeteer.
- Renderer: semantic HTML output confirmed for all blocks (headings, paragraphs, lists, blockquote, code, hr, link, image with attribution).
- Editor: all blocks load with correct editable fields and no console errors.
- Mobile (375px): responsive layout confirmed readable.
- No P0/P1 defects found in automated coverage. Manual insert-via-UI (slash, shortcut, menu) and copy/paste still need human verification.
