# Phase 4 AI Kickoff Checklist

> Formal PM4 handoff artifact for starting `phases/PHASE_04_AI.md`.

**Prepared:** 2026-04-10  
**Source Phase:** `phases/PHASE_PRE_MIGRATION_04.md`  
**Next Active Plan:** `phases/PHASE_04_AI.md`

---

## PM4 Exit Checklist

- ✅ Competitor baseline is documented in `docs/research/PHASE4_MIGRATION_COMPETITOR_BASELINE.md`.
- ✅ Editor parity must-close items are implemented: alignment, find/replace, word/character count, image metadata, command catalog, shortcut customization.
- ✅ CMS baseline is operational for create, edit, review, schedule, publish, permissions, SEO metadata, media governance, admin views, and publish events.
- ✅ Pulse website is active in local development with marketing pages plus Pulse-powered blog authoring, preview, and local feed hydration.
- ✅ PM4 docs are synchronized across `backlog/BACKLOG.md`, `backlog/DONE.md`, `docs/FEATURES.md`, `docs/memory/CONTEXT_SNAPSHOT.md`, and `docs/memory/CONVERSATION_LOG.md`.
- ✅ Non-Playwright quality gates are green:
  - `npm run docs:check`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test`
  - `cd apps/website && npm run typecheck`
  - `cd apps/website && npm run build`
- ✅ Browser-dependent Playwright execution remains intentionally skipped under decision `D002` and explicit user instruction because browser installation is not available on the current network path.

---

## Accepted PM4 Deferrals

These rows remain intentionally deferred and do not block Phase 4 AI kickoff because the PM4 dogfooding, publishing, and governance baseline is already complete.

| Feature | Follow-up target | Rationale |
|---|---|---|
| Paste cleanup pipeline | Phase 6 | Authoring hygiene improvement, but not required for the PM4 editor/CMS lifecycle baseline. |
| Mentions | Phase 6 | Collaboration enhancement, not required for single-workspace PM4 editorial flows. |
| Advanced table operations | Phase 6 | Depth parity item, not required for the website dogfooding or AI package kickoff. |
| Source editing mode | Phase 6 | Power-user tooling that would add maintenance surface before AI runtime contracts stabilize. |
| Accessibility checker UI | Phase 6 | Valuable audit surface, but PM4 already shipped accessible metadata and workflow guardrails without blocking authoring. |
| Document import/export | Phase 6 | Interoperability pack is useful later, but PM4 scope only requires internal Pulse authoring and rendering loop. |
| Revision restore for entries | Phase 6 | Entry rollback depth can follow after AI and SEO contracts settle; PM4 already has revision visibility primitives. |
| Release/batch publish workflow | Phase 6 | Operational scale feature beyond the single-site dogfooding baseline completed in PM4. |
| Locale-aware content variants | Phase 6 | Multilingual expansion is intentionally postponed until core AI, SEO, and production contracts are stable. |

---

## Ready Inputs for Phase 4

- `phases/PHASE_04_AI.md` is now unblocked and remains the canonical plan for R4-1 through R4-18.
- Website dogfooding surface available for future AI UX validation:
  - `/studio`
  - `/blog`
  - `/blog/preview?slug=...`
- Existing reusable packages available for AI integration:
  - `@pulse/core`
  - `@pulse/editor`
  - `@pulse/renderer`
  - `@pulse/react`
- Existing PM4 governance primitives ready to be reused by AI:
  - workflow permissions/checkpoints
  - audit logging
  - publish events/webhooks
  - command catalog and shortcut customization

---

## Recommended R4-1 Start

1. Create `packages/ai` with strict capability contracts only.
2. Keep provider/runtime work behind typed interfaces before any UI or network coupling.
3. Reuse PM4 audit and workflow patterns for approval-gated AI actions.
4. Keep Playwright out of scope unless the environment constraint changes.

---

## Environment Reminders

- Use English for responses and project notes in this phase.
- Skip Playwright/browser-install-dependent validation unless the user explicitly changes the constraint.
- If npm is needed for the website workspace, continue using the local project-safe flow that already works in `apps/website`.
