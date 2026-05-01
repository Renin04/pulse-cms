# PM-2 Command and Macro Acceptance Pack

> Session PM-2 planning/output artifact for pre-migration. This document defines
> the exact completion checks for command and macro features before Phase 3.

**Last Updated:** 2026-04-02  
**Applies To:** Phase 2 command/macro closure scope

---

## In-Scope Features

1. Command aliases
2. Command preview
3. Backslash menu
4. Quick inserts
5. Variables
6. Templates (macro/template insertions)
7. Macro registry
8. Keyboard navigation (menus)

---

## Acceptance Criteria (Global)

A feature is considered closed only if all pass:

- Implementation exists in `@pulse/editor` command layers (parser/registry/palette/UI).
- Unit/integration tests cover positive path plus one invalid-input edge case.
- Bidi-safe and mixed RTL/LTR input handling is verified where text parsing is involved.
- Feature row status in `docs/FEATURES.md` is synchronized.
- Traceability row in `docs/pre-migration/PHASE12_TRACEABILITY.md` has implementation and test references.

---

## Feature-Level Validation Checklist

### 1) Command aliases
- Alias metadata can be attached to a command.
- Alias search resolves to canonical command ID.
- Alias collisions produce deterministic ranking behavior.
- Test file target: `packages/editor/tests/command-system.test.ts`.

### 2) Command preview
- Preview payload is available before execute.
- Enter executes selected command; preview does not mutate state on highlight-only.
- Preview render path handles missing preview data gracefully.

### 3) Backslash menu
- `\\` trigger opens command/macro menu with namespace parity vs slash where applicable.
- Backslash query filtering and nested path expansion works.
- Trigger parser strips bidi controls and mixed-direction artifacts.

### 4) Quick inserts
- Supported quick inserts (for example date/time) emit deterministic block or inline payload.
- Insertions are undoable and do not bypass history tracking.

### 5) Variables
- Variable tokens resolve with explicit resolver map.
- Unknown variable keys fail safely (no crashes, clear fallback behavior).

### 6) Templates (macro/template insertions)
- Template insertion supports at least one multi-block payload.
- IDs regenerate on insertion and preserve document validity.

### 7) Macro registry
- Registry lists available macros with metadata.
- Availability filtering supports contextual constraints.
- Registry output is consumable by palette/UI without extra transforms.

### 8) Keyboard navigation (menus)
- Arrow keys move active option deterministically.
- Enter confirms selection; Escape closes; Tab behavior remains per existing command semantics.
- Nested menu navigation supports forward/back transitions with keyboard only.

---

## Suggested Execution Order

1. Parser + registry primitives (`aliases`, `macro registry`, bidi normalization reuse)
2. Palette/UI surface (`backslash menu`, `command preview`, `keyboard navigation`)
3. Action resolvers (`quick inserts`, `variables`, `templates`)
4. Tests and traceability/docusync

---

## Test Gate Commands

Run after each sub-batch and once for PM-2 closure:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`

