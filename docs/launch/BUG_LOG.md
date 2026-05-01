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
| L-0-001 | L-0 (Planning) | P1 | Root build | Root `npm run build` fails with ~100 TS errors in `apps/website/app/api/*` routes due to missing `@/lib/*` module resolution when built from root tsconfig. Website `npm run typecheck` passes when run from `apps/website` workspace. | `cd /mnt/c/Users/z0512/Desktop/pulse && npm run build` | — | ✅ Fixed |
| L-0-002 | L-0 (Planning) | P1 | Website test | `apps/website/lib/blog-studio.test.ts` fails with ENOENT on `blog-snapshot.json` due to hardcoded WSL path resolving incorrectly on Windows host. | `cd /mnt/c/Users/z0512/Desktop/pulse && npm run test` | — | ✅ Fixed |

## Closed Bugs

| ID | Session | Severity | Block/Feature | Description | Fix Commit/PR | Verified By |
|----|---------|----------|---------------|-------------|---------------|-------------|
| L-0-001 | L-1 | Root build | Removed `apps/**/*.ts` from root `tsconfig.build.json`. Next.js apps have their own build pipelines and path aliases; they should not be compiled by root `tsc`. | Root `npm run build` passes. |
| L-0-002 | L-1 | Website test | Replaced hardcoded WSL path in `blog-studio.test.ts` with `join(dirname(fileURLToPath(import.meta.url)), '../public/blog-snapshot.json')`. | `apps/website/lib/blog-studio.test.ts` passes (9/9). |

---

**Last Updated:** 2026-05-01 (L-1 closeout)
