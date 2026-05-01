# Pre-Migration Gate to Phase 3

> This phase is a hard gate between completed Phase 1/2 delivery waves and the start of
> Phase 3 renderer implementation. The goal is to leave zero unfinished Phase 1/2 features
> in planning artifacts before renderer work begins.

**Status:** ✅ Complete (PM-1 through PM-10 complete)  
**Depends On:** Phase 1 and Phase 2 implementation baseline  
**Blocks:** Phase 3 kickoff  
**Estimated Sessions:** 10  
**Priority:** P0

---

## 🎯 Goals

1. Complete every non-done feature in `docs/FEATURES.md` that is tagged to Phase 1 or Phase 2.
2. Ensure each completed feature has test evidence and acceptance validation.
3. Align planning artifacts so no hidden Phase 1/2 debt remains outside the active backlog.
4. Enter Phase 3 with a clean feature baseline and documented sign-off.

---

## 📦 Scope

This phase includes all remaining Phase 1/2 items now tracked in:

- `backlog/BACKLOG.md` under "Pre-Migration to Phase 3"

Scope groups:

- Foundation/API closure (types, adapters, framework-agnostic API)
- Command, macro, and input UX completion
- Menu/shortcut/toolbar interaction completion
- Remaining Phase 2 block implementation closure (including P2 items)
- Bidirectional typing and accessibility verification closure
- Documentation + traceability + sign-off gates

---

## ✅ Exit Criteria

Pre-migration is complete only when all criteria pass:

1. No `⬜` or `🟦` rows remain in `docs/FEATURES.md` for Phase 1 or Phase 2 items.
2. All pre-migration backlog tasks are moved out of `backlog/BACKLOG.md` into `backlog/DONE.md`.
3. Quality gates pass for final merged scope:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - `npm run test`
4. A traceability map links each closed feature to implementation and test references.
5. Phase 3 kickoff plan is reaffirmed with updated dependency confidence.

---

## 🗂️ Session Plan (PM-1 to PM-10)

### PM-1 — Audit + Foundation/API gaps
- Finalize open type/API gaps (`TypeScript types`, `Vanilla JS API`, `React adapter`)
- Define acceptance matrix template for the remaining pre-migration tasks

### PM-2 — Commands and macro core
- Close command alias/preview and backslash core behavior
- Implement quick inserts and macro registry baseline

### PM-3 — Macro expansion and empty-space flows
- Complete variables/templates macro features
- Complete empty-space context menu behavior and tests

### PM-4 — Shortcut system closure
- Deliver custom shortcuts, shortcut help, and chord shortcuts
- Expand keyboard navigation coverage for command/context menus

### PM-5 — Toolbar/drag UX closure
- Complete floating/fixed/responsive toolbar and toolbar groups
- Complete block drag-handle UX and test evidence

### PM-6 — Core block completion wave A
- Close in-progress block families (video/audio/file/table/embed/quiz/poll/survey)
- Verify serialization/editing parity for these block types

### PM-7 — Core block completion wave B
- Close creative in-progress blocks (manga panel/speech bubble/callout/alert/card/gallery/carousel)
- Close bidirectional typing acceptance criteria

### PM-8 — Remaining Phase 2 missing blocks
- Implement currently not-started Phase 2 block set (flashcard/accordion/tabs/toggle/spoiler/chart/map/math/diagram/timeline/comparison/before-after/hero/annotated image)
- Add slash/backslash insertion + editor integration coverage

### PM-9 — Block tooling and state utilities
- Close block templates, block search, and state snapshots
- Finalize accessibility tests completion and evidence

### PM-10 — Pre-migration sign-off
- Run full quality gates and docs sync
- Complete traceability matrix and Phase 3 entry checklist
- Freeze pre-migration scope and formally open Phase 3

---

## 📌 Execution Log

- ✅ PM-1 (planning/audit) completed on 2026-04-02:
  - audited unfinished Phase 1/2 features from `docs/FEATURES.md`
  - created pre-migration traceability matrix at `docs/pre-migration/PHASE12_TRACEABILITY.md`
- ✅ PM-2 (planning/spec) completed on 2026-04-02:
  - authored command/macro acceptance pack at `docs/pre-migration/PM2_COMMAND_MACRO_ACCEPTANCE.md`
  - defined closure criteria and test gates for command/macro workstream
- ✅ PM-3 (implementation) completed on 2026-04-02:
  - implemented macro command stack (`quick inserts`, `variables`, `templates`) and macro registry in `packages/editor/src/commands/macroCommands.ts`
  - implemented empty-space context menu support and context-menu keyboard state model in `packages/editor/src/ui/ContextMenus.ts`
  - implemented command preview support in `packages/editor/src/ui/CommandPalette.ts`
- ✅ PM-4 (implementation) completed on 2026-04-02:
  - implemented custom shortcut registration, shortcut help entries, and chord dispatch flow in `packages/editor/src/shortcuts/ShortcutRegistry.ts`
  - expanded editor tests (`command-system`, `context-dnd`, `shortcut-formatting`) and validated with full quality gates (`lint`, `typecheck`, `build`, `test`)
- ✅ PM-5 (implementation) completed on 2026-04-02:
  - implemented fixed toolbar model with grouped sections and compact overflow behavior in `packages/editor/src/ui/FixedToolbar.ts`
  - completed toolbar-related accessibility/test coverage and exported fixed toolbar public API
  - completed block drag-handle rendering/state in `packages/editor/src/ui/BlockActionMenu.ts`
- ✅ PM-6 (implementation closure) completed on 2026-04-02:
  - closed wave A block rows (`video`, `audio`, `file`, `table`, `embed`, `quiz`, `poll`, `survey`) in `docs/FEATURES.md`
  - closed traceability rows (`PM-010`, `PM-013`, `PM-014`, `PM-015`, `PM-016`, `PM-020`, `PM-024`, `PM-028`) with implementation/test evidence
  - moved completed wave A backlog tasks from `backlog/BACKLOG.md` into `backlog/DONE.md`
- ✅ PM-7 (implementation closure) completed on 2026-04-02:
  - closed wave B block rows (`manga-panel`, `speech-bubble`, `callout`, `alert`, `card`, `gallery`, `carousel`) and `Bidirectional typing (RTL/LTR mixed)` in `docs/FEATURES.md`
  - closed traceability rows (`PM-005`, `PM-007`, `PM-009`, `PM-012`, `PM-021`, `PM-022`, `PM-025`, `PM-027`) with implementation/test evidence
  - moved completed wave B + bidirectional backlog tasks from `backlog/BACKLOG.md` into `backlog/DONE.md`
- ✅ PM-8 (implementation closure) completed on 2026-04-02:
  - implemented the remaining Phase 2 expansion block set (`flashcard`, `accordion`, `tabs`, `toggle`, `spoiler`, `chart`, `map`, `math-equation`, `diagram`, `timeline`, `comparison`, `before-after`, `hero-section`, `annotated-image`) in `@pulse/blocks`
  - added slash/backslash command + shortcut insertion coverage in `packages/editor/src/commands/phase2ExpansionBlockCommands.ts` and `packages/editor/src/shortcuts/phase2ExpansionBlockShortcuts.ts`
  - validated block/runtime integration with `packages/blocks/tests/blocks.test.ts` and `packages/editor/tests/phase2-expansion-blocks.test.ts`
- ✅ PM-9 (implementation closure) completed on 2026-04-02:
  - completed `Block templates`, `Block search`, and `State snapshots` in `packages/editor/src/state/BlockTemplates.ts`, `packages/editor/src/state/blockSearch.ts`, and `packages/editor/src/state/StateSnapshots.ts`
  - completed accessibility test sign-off with expanded assertions in `packages/editor/tests/devtools-accessibility.test.ts`
  - synchronized `docs/FEATURES.md`, `docs/pre-migration/PHASE12_TRACEABILITY.md`, `backlog/BACKLOG.md`, and `backlog/DONE.md` for PM-8/PM-9 closure

- ✅ PM-10 (pre-migration sign-off) completed on 2026-04-02:
  - closed remaining 4 open traceability rows: PM-001 (TypeScript types), PM-002 (Vanilla JS API), PM-003 (React adapter), PM-023 (Command aliases)
  - implemented `packages/core/src/types/public.ts` (public type barrel), `packages/core/src/api/VanillaEditorAPI.ts` (VanillaJS API), `packages/react/` package (EditorBridge + useEditor hook), and alias resolution methods in `packages/editor/src/commands/CommandRegistry.ts`
  - added new test files: `packages/core/tests/public-types.test.ts`, `packages/core/tests/vanilla-api.test.ts`, `packages/react/tests/react-adapter.test.ts`; extended `packages/editor/tests/command-system.test.ts`
  - all quality gates passed: lint ✅ typecheck ✅ build ✅ test (251/251) ✅ docs:check ✅
  - synchronized all planning artifacts: BACKLOG.md (pre-migration queue cleared), DONE.md, FEATURES.md (all Phase 1/2 rows ✅), PHASE12_TRACEABILITY.md (0 open rows)
  - Pre-migration gate formally closed; Phase 3 is unblocked

---

## ⚠️ Risks

- Feature-table status drift vs real code state can create false closure signals.
- Large mixed scope (UX + blocks + tests) can create regressions without strict batching.
- Accessibility and bidirectional typing need explicit regression coverage to avoid silent breakage.

---

## 🔄 Handoff to Phase 3

After this gate is complete:

- `phases/PHASE_03_RENDERER.md` can start as the active phase
- Backlog active queue transitions from pre-migration tasks to renderer foundation tasks
- Session snapshot reflects renderer kickoff with no unresolved Phase 1/2 debt
