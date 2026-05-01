# Architecture & Design Decisions

> Record of all significant technical decisions made during Pulse development.
> Each decision includes context, alternatives considered, chosen solution, and rationale.

**Last Updated:** 2026-05-01  
**Total Decisions:** 7

---

## Decision Log

### [D007] Insert a Launch Readiness Gate Before Phase 4 (Product Validation + Hardening)
**Date:** 2026-05-01  
**Status:** ✅ Accepted  
**Phase:** Transition (PM4 -> Phase 4)

**Context:**
PM4 (editor parity + CMS baseline + website) is closed, but the product has not yet undergone
a systematic end-to-end validation. Before exposing Pulse to early adopters or layering AI
automation on top, we need confidence that every block, editor surface, renderer path, CMS
workflow, and website flow behaves correctly in real usage. Additionally, security and
performance baselines must be validated, and structured user feedback must be collected.

**Options Considered:**
1. **Start Phase 4 immediately** and fix bugs as they are discovered during AI development.
2. **Run ad-hoc testing** in spare time without a structured gate.
3. **Add a dedicated Launch Readiness Gate** with formal test matrices, bug tracking,
   security/performance audits, and user feedback loops before Phase 4 kickoff.

**Decision:**
Adopt option 3: introduce `phases/PHASE_LAUNCH_READINESS.md` as an active gate before Phase 4.
Phase 4 remains blocked until L-14 launch sign-off is complete and user-approved.

**Rationale:**
- Prevents AI feature design from coupling to unstable editor/CMS/renderer baselines.
- Ensures the product is launch-ready (Editor + Renderer + CMS) before adding AI complexity.
- Creates reproducible validation artifacts (test matrices, bug logs, audit checklists).
- Collects structured user feedback so UX gaps are closed before public launch.
- Reduces risk of shipping security or performance regressions to early adopters.

**Consequences:**
- Phase 4 start is intentionally delayed until the Launch Readiness Gate closes.
- Backlog focus shifts to L-1..L-14 validation sessions.
- New documentation artifacts are added under `docs/launch/`.
- Agent session prompts are updated to enforce validation-first behavior.

**Related Files:**
- `phases/PHASE_LAUNCH_READINESS.md`
- `docs/launch/BLOCK_TEST_MATRIX.md`
- `docs/launch/SECURITY_AUDIT_CHECKLIST.md`
- `docs/launch/PERF_AUDIT_CHECKLIST.md`
- `docs/launch/BUG_LOG.md`
- `docs/prompt/PHASE_LAUNCH_KICKOFF.md`
- `docs/prompt/PHASE_LAUNCH_CLOSEOUT.md`
- `backlog/BACKLOG.md`
- `docs/memory/CONTEXT_SNAPSHOT.md`

---

### [D006] Insert a Migration Gate Before Phase 4 (Editor/CMS Completion + Product Website)
**Date:** 2026-04-06  
**Status:** ✅ Accepted  
**Phase:** Transition (Phase 3 -> Phase 4)

**Context:**
Phase 3 renderer scope is closed, but product requirements expanded before AI implementation:
1) benchmark Pulse against mature editors (CKEditor/TinyMCE) and close important editing gaps,
2) establish Pulse as a real CMS platform (not only an editor runtime),
3) verify logical completeness around commands/shortcuts discoverability/customization,
4) ship a Pulse product website with a dogfooding blog/CMS powered by Pulse itself.
Starting Phase 4 AI without these foundations would make AI workflows target an incomplete publishing surface.

**Options Considered:**
1. **Start Phase 4 immediately** and defer editor/CMS/website parity work into later phases
2. **Implement only a subset of parity items** and begin AI in parallel
3. **Add a dedicated pre-Phase migration gate** and block Phase 4 until parity + CMS baseline + website baseline are in place

**Decision:**
Adopt option 3: introduce `phases/PHASE_PRE_MIGRATION_04.md` as an active gate before Phase 4.  
Phase 4 remains AI-focused, but starts only after PM4 closure criteria are met.

**Rationale:**
- Prevents AI feature design from coupling to incomplete editor/CMS workflows
- Reduces product-level rework by establishing publishing and governance primitives first
- Creates a clean, testable checkpoint for parity-driven scope
- Enables immediate dogfooding loop via Pulse website/blog before AI automation expands behavior

**Consequences:**
- Phase 4 start is intentionally delayed until PM4 completion
- Backlog focus shifts from Phase 4 kickoff to PM4 sessions (`PM4-1`..`PM4-12`)
- `docs/FEATURES.md` gains PM4-tracked feature rows for editor parity and CMS baseline
- Documentation overhead increases short term due migration tracking, but phase risk is reduced

**Related Files:**
- `phases/PHASE_PRE_MIGRATION_04.md`
- `docs/research/PHASE4_MIGRATION_COMPETITOR_BASELINE.md`
- `backlog/BACKLOG.md`
- `docs/FEATURES.md`

---

### [D005] Re-split Roadmap: Phase 5 SEO Intelligence, Phase 6 Production Hardening
**Date:** 2026-04-04  
**Status:** ✅ Accepted  
**Phase:** Transition (Phase 3 planning refinement)

**Context:**
After expanding Phase 4 scope for AI builder runtime and automation workflows, product requirements clarified that SEO must be handled as its own focused phase, while release hardening and platformization concerns (packaging, docs, observability, i18n, release QA) should remain a separate production phase.

**Options Considered:**
1. **Keep 5-phase roadmap** — Phase 5 mixes SEO + production hardening
2. **Fold SEO into Phase 4** — AI + SEO bundled together
3. **Re-introduce Phase 6** — Phase 4 AI runtime, Phase 5 SEO, Phase 6 production hardening

**Decision:**
Adopt option 3: keep Phase 4 focused on AI Builder + automation runtime, define Phase 5 for SEO intelligence and SEO automations, and use Phase 6 for production hardening/release concerns.

**Rationale:**
- SEO workflows need dedicated product strategy and validation loops
- Production hardening scope is large and should not compete with SEO delivery
- AI runtime contracts must stabilize before SEO automations depend on them
- Clear phase boundaries reduce planning ambiguity and acceptance drift

**Consequences:**
- D004 roadmap simplification is partially superseded by this refined 6-phase plan
- SEO-related features are grouped into Phase 5 for focused implementation
- Non-SEO production concerns move to Phase 6
- Phase summary and planning artifacts require phase remapping updates

**Related Files:**
- `docs/FEATURES.md`
- `phases/PHASE_04_AI.md`
- `backlog/BACKLOG.md`

---

### [D004] Merge Phase 6 (Theming & UI Polish) into Phase 3 (Renderer)
**Date:** 2026-04-04  
**Status:** 🔄 Superseded by D005  
**Phase:** Transition (Phase 2 → Phase 3)

**Context:**
Phase 6 was originally a separate "Theming & UI Polish" phase placed after Phase 4 (AI) and Phase 5 (Platform). This meant the renderer would ship in Phase 3 without a CSS baseline, a visual contract, or theming support — making it unusable on real websites until Phase 6. The theming system (CSS variables, theme tokens, custom CSS) is fundamentally a renderer contract, not an afterthought.

**Options Considered:**
1. **Keep Phase 6 separate** — ship renderer without CSS, add theming in Phase 6 after AI
2. **Pull only baseline CSS into Phase 3** — minimal visual layer, full theming later
3. **Merge all Phase 6 theming/UI items into Phase 3** — renderer ships with full visual contract

**Decision:**
Adopt option 3: merge all Phase 6 theming and UI polish items into Phase 3. Phase 4 = AI Features (unchanged). Phase 5 = Platform/Expansion + remaining Phase 6 infrastructure items (docs, distribution, analytics, i18n). Phase 6 as a named phase is retired.

**Rationale:**
- Renderer without CSS is not a usable deliverable — consumers would receive unstyled HTML
- CSS variables and theme tokens shape how block rendering works at the API level (they are renderer contracts, not decorations)
- Doing theming in Phase 6 (after AI) would require retrofitting styles onto a renderer not designed for them
- All theming/UI features share the same mental context as renderer work — no context-switching cost
- Consolidation reduces total phase count from 6 to 5 and makes Phase 3 a complete, shippable renderer

**Consequences:**
- Phase 3 scope increases significantly (~22 additional features from Phase 6)
- Phase 3 estimated sessions increase to ~14–16 sessions
- Phase 5 absorbs remaining Phase 6 infrastructure items (docs, npm publish, i18n, analytics)
- Phase 6 label was retired from planning artifacts at decision time (later superseded by D005 roadmap split)
- `docs/FEATURES.md` updated: Phase 6 rows reassigned to Phase 3 or Phase 5

**Related Files:**
- `docs/FEATURES.md`
- `phases/PHASE_03_RENDERER.md`
- `backlog/BACKLOG.md`

---

### [D003] Insert a Pre-Migration Gate Before Phase 3
**Date:** 2026-04-02  
**Status:** ✅ Accepted  
**Phase:** Transition (Phase 2 -> Phase 3)

**Context:**
While preparing to start Phase 3, planning artifacts still listed multiple unfinished features assigned to Phase 1 and Phase 2, including in-progress and not-started low-priority items. Starting renderer work with unresolved upstream feature debt risked backlog drift and acceptance ambiguity.

**Options Considered:**
1. **Start Phase 3 immediately** and carry residual Phase 1/2 work as background tasks
2. **Close only high-priority residuals** and defer lower-priority Phase 1/2 items
3. **Insert a dedicated pre-migration gate** and migrate all remaining Phase 1/2 tasks into one active closure backlog

**Decision:**
Adopt option 3: create a dedicated pre-migration phase (`PHASE_PRE_MIGRATION_03.md`) and move all remaining Phase 1/2 items (including low-priority items) into the active backlog before renderer kickoff.

**Rationale:**
- Eliminates hidden scope debt before major phase transition
- Creates one source of truth for residual work
- Improves release confidence for Phase 3 dependency assumptions
- Enables explicit sign-off with test/documentation evidence

**Consequences:**
- Renderer kickoff is intentionally delayed until pre-migration closure
- Near-term backlog size increases due to full residual migration
- Documentation maintenance overhead rises temporarily (feature-to-backlog traceability)
- Transition success criteria become clearer and auditable

**Related Files:**
- `phases/PHASE_PRE_MIGRATION_03.md`
- `backlog/BACKLOG.md`
- `docs/FEATURES.md`

---

### [D002] Testing Under Restricted International Network Access
**Date:** 2026-04-01  
**Status:** ✅ Accepted  
**Phase:** Phase 1 — Core Foundation

**Context:**
Development runs on WSL with intermittent or restricted international internet access. Browser-tooling downloads (Playwright browsers) and tests that depend on external URLs can become unreliable or blocked.

**Options Considered:**
1. **Online-first E2E** — Require fresh Playwright/browser downloads and permit internet-dependent tests
2. **Offline-first E2E** — Prefer local/cached browser runtimes and local-only test targets; skip/defer E2E when runtime is unavailable
3. **Disable E2E entirely** — Run only unit/integration tests until Phase 2+

**Decision:**
Use **offline-first E2E policy**:
- Keep Playwright configuration and CI scaffolding in place
- Avoid tests that require external internet URLs
- Prefer local/cached browsers only
- If browser runtime is unavailable, do not block core progress (focus on unit/integration coverage)

**Rationale:**
- Keeps development velocity stable under network constraints
- Avoids flaky CI/local failures caused by blocked downloads
- Preserves E2E pathway without forcing brittle internet assumptions
- Aligns with user environment constraints (Windows host + WSL runtime differences)

**Consequences:**
- E2E coverage may lag behind unit/integration until local browser runtime is consistently available
- CI E2E execution must remain conditional
- Team must avoid adding internet-dependent test fixtures until constraints change
- WSL-to-Windows browser interop may fail for Playwright launch in some setups (`remote debugging pipe` startup errors), so Linux-native cached runtime is preferred

**Related Files:**
- `playwright.config.ts`
- `.github/workflows/ci.yml`
- `backlog/BACKLOG.md`

---

### [D001] Project Structure: Monorepo with Turborepo
**Date:** 2026-04-01  
**Status:** ✅ Accepted  
**Phase:** Phase 1 — Core Foundation

**Context:**
Need to organize multiple packages (core, blocks, ui, renderer, ai) in a maintainable structure that supports independent development while sharing common tooling.

**Options Considered:**
1. **Monorepo (Turborepo)** — Single repository with multiple packages
2. **Multi-repo** — Separate repositories for each package
3. **Monolith** — Single package containing all code

**Decision:**
Use Turborepo-based monorepo structure.

**Rationale:**
- Shared TypeScript configs, ESLint, and build tooling
- Simplified dependency management between packages
- Faster CI/CD with intelligent caching
- Better developer experience with unified commands
- Industry standard for modern TypeScript projects
- Easier to maintain consistency across packages

**Consequences:**
- Initial setup complexity
- Need careful package version management
- Requires team familiarity with Turborepo
- Larger repository size

**Related Files:**
- `turbo.json`
- `package.json` (root)
- `packages/*/package.json`

---

## Template for New Decisions
```markdown
### [DXXX] Decision Title
**Date:** YYYY-MM-DD  
**Status:** 🟦 Proposed | ✅ Accepted | ❌ Rejected | 🔄 Superseded  
**Phase:** Phase X — Name

**Context:**
What problem are we solving? What constraints exist?

**Options Considered:**
1. **Option A** — Brief description
2. **Option B** — Brief description
3. **Option C** — Brief description

**Decision:**
Which option was chosen?

**Rationale:**
Why was this option chosen? What are the key benefits?

**Consequences:**
What are the trade-offs? What challenges might arise?

**Related Files:**
- List of files affected by this decision

**References:**
- Links to relevant documentation, RFCs, or discussions (if any)

---

## Decision Categories

### Architecture Decisions
- [D006] Insert a Migration Gate Before Phase 4 (Editor/CMS Completion + Product Website)
- [D005] Re-split Roadmap: Phase 5 SEO Intelligence, Phase 6 Production Hardening
- [D004] Merge Phase 6 (Theming & UI Polish) into Phase 3 (Renderer)
- [D003] Insert a Pre-Migration Gate Before Phase 3
- [D002] Testing Under Restricted International Network Access
- [D001] Project Structure: Monorepo with Turborepo

### State Management Decisions
*No decisions yet.*

### Plugin System Decisions
*No decisions yet.*

### Performance Decisions
*No decisions yet.*

### Security Decisions
- [D002] Testing Under Restricted International Network Access

### UI/UX Decisions
*No decisions yet.*

### AI Integration Decisions
*No decisions yet.*

---

## 📝 Agent Guidelines

**When to Log a Decision:**
- Choosing between multiple technical approaches
- Selecting a library, framework, or tool
- Defining API or interface structures
- Making performance or security trade-offs
- Establishing coding patterns or conventions
- Architectural changes affecting multiple packages

**When NOT to Log:**
- Routine implementation details
- Obvious choices with no alternatives
- Temporary workarounds (use code comments instead)
- Minor refactoring decisions

**Decision Status:**
- 🟦 **Proposed** — Under discussion, not yet implemented
- ✅ **Accepted** — Approved and implemented
- ❌ **Rejected** — Considered but not chosen
- 🔄 **Superseded** — Replaced by a newer decision (reference new decision ID)

**Numbering Convention:**
- Use sequential format: D001, D002, D003, etc.
- Never reuse numbers, even for rejected decisions
- Pad with zeros for sorting (D001 not D1)

**Update Protocol:**
- Add new decisions at the top of the log (after D001)
- Update "Total Decisions" counter
- Update "Last Updated" date
- Add to appropriate category section

---

**Next Decision ID:** D008
