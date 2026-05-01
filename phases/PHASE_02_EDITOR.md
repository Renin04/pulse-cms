# Phase 2: Editor Experience

> Build the authoring layer on top of Phase 1 core primitives and deliver a keyboard-first, block-native editing experience.

**Status:** 🟦 In Progress (Session 9-10 complete; Session 11-12 queued)  
**Depends On:** Phase 1 (Core Foundation) ✅  
**Estimated Sessions:** 12-16 sessions  
**Priority:** P0

---

## Overview

Phase 2 delivers `@pulse/editor` as a production-ready editing package that consumes
`@pulse/core` and `@pulse/blocks`. The focus is fast authoring workflows:
slash/backslash commands, keyboard shortcuts, selection, toolbar/context actions,
drag-and-drop block manipulation, and save flows.

This phase is intentionally split into:
- A **P0/P1 delivery track** (must-have editor UX and API stability)
- A **P2 expansion track** (advanced commands, richer blocks, debug utilities)

---

## Objectives

- Ship the first usable `@pulse/editor` package with React adapter support.
- Complete all **Phase 2 P0 features** from `docs/FEATURES.md`.
- Deliver the core **P1 interaction layer** (DnD, multi-select, toolbar/context menu, autosave).
- Keep architecture aligned with `docs/ARCHITECTURE.md`:
  - single source of truth editor state
  - event-driven integration
  - command-centric action model
- Maintain local quality gates (`lint`, `typecheck`, `test`, skip-safe `test:e2e`).

---

## Deliverables

### Core Deliverables

- `@pulse/editor` package scaffold and public API (`packages/editor/src/index.ts`)
- Editor shell with block rendering, focus, and selection orchestration
- Command system:
  - slash menu
  - backslash menu
  - command registry + search
- Keyboard shortcuts manager (platform-aware defaults + overrides)
- Block manipulation UX:
  - drag-and-drop
  - multi-select
  - context menus
  - block action menu
- Save workflows:
  - manual save
  - autosave integration

### Supporting Deliverables

- React adapter components for host applications
- Dev playground integration for editor iteration
- Editor-specific tests:
  - unit tests for commands, shortcut parsing, state reducers
  - integration tests for command -> state -> event flow
  - optional local-only E2E scenarios (no external URLs)
- Docs updates for editor API and extension points

---

## Feature Breakdown

### Dependency Keys

- **D1**: Block registry + schemas (`@pulse/core`)
- **D2**: Event bus + middleware (`@pulse/core`)
- **D3**: Document/Selection/History/Persistence (`@pulse/core`)
- **D4**: Plugin manager and plugin hooks (`@pulse/core`)
- **D5**: Basic block definitions (`@pulse/blocks`)
- **D6**: Tooling/CI/testing baseline (Vitest/Playwright/Turbo)

### P0 Features (10)

| Feature | Description | Dependencies | Implementation approach | Estimated sessions |
|---|---|---|---|---|
| Text editing | Basic text input | D1, D3, D5 | Build editable text block wrapper with controlled updates into `DocumentState` | 1-2 |
| Rich text formatting | Bold/italic/underline/code/link marks | D1, D3, D5 | Add inline mark command layer and formatter actions (toolbar + shortcuts) | 1-2 |
| Copy/paste | Clipboard support | D1, D3 | Add normalized clipboard serializers/deserializers for block-aware pastes | 1 |
| Manual save | Explicit save action | D2, D3 | Add `save` command and event emission (`content:saved`) with status feedback | 1 |
| Slash menu | `/` command palette | D1, D2, D5 | Build command palette UI + trigger parser + insert pipelines | 1-2 |
| Command search | Fuzzy find commands | D1 | Add in-memory indexed command search with category/type metadata | 1 |
| Default shortcuts | Standard shortcut set | D2, D3 | Build shortcut router with default command map and collision-safe dispatch | 1 |
| Platform-specific | Cmd vs Ctrl mapping | D2 | Add platform adapter for modifier normalization | 0.5 |
| Block focus state | Focus indicator & active block model | D3, D5 | Add focused block state + visual and ARIA reflection | 0.5-1 |
| React adapter | React components for host app integration | D1, D2, D3, D5 | Expose React `Editor` root + hooks/providers in `@pulse/editor` | 1-2 |

### P1 Features (29)

| Feature | Description | Dependencies | Implementation approach | Estimated sessions |
|---|---|---|---|---|
| Drag and drop | Reorder blocks | D1, D3, D5 | Pointer + keyboard DnD with drop indicators and immutable reordering | 1-2 |
| Multi-select | Multi-block selection | D3 | Extend selection state adapters for range and set-based block selection | 1 |
| Autosave | Auto-save to storage | D2, D3 | Debounced persistence with dirty-state selectors and retries | 0.5-1 |
| Command categories | Group commands | D1 | Add category metadata to registry and grouped UI rendering | 0.5 |
| Backslash menu | `\` macro menu | D1 | Reuse command palette shell with alternate trigger namespace | 0.5 |
| Quick inserts | Fast inserts (`\date`) | D1, D3 | Add macro resolvers that emit block insertion commands | 0.5 |
| Block context menu | Right-click block actions | D1, D3 | Context menu scoped to block target + command dispatch | 1 |
| Selection context menu | Right-click selection actions | D3 | Selection-aware context menu with inline formatting commands | 0.5-1 |
| Contextual actions | Actions by block type | D1, D5 | Add block-definition action resolvers and conditional menu entries | 0.5 |
| Custom shortcuts | User overrides | D2 | Add API for shortcut remapping at runtime | 0.5 |
| Shortcut registry | Central shortcut store | D2 | Implement registry with validation and lookup by context | 0.5 |
| Shortcut conflicts | Detect collisions | D2 | Add conflict checker and warning metadata surfaced in UI | 0.5 |
| Floating toolbar | Selection toolbar | D3 | Anchor toolbar to text selection range with command bindings | 1 |
| Responsive toolbar | Adapt toolbar layout | D6 | Add breakpoint-aware groups and overflow handling | 0.5 |
| Block hover state | Hover affordances | D5 | Add hover visuals and action reveal in block wrapper | 0.5 |
| Block drag handle | Drag handle UI | D5 | Render drag handle control and integrate with DnD start | 0.5 |
| Block actions menu | Per-block action menu | D1, D3 | Add duplicate/delete/move actions bound to command IDs | 0.5 |
| Empty state | Empty editor UX | D3 | Add onboarding hint with quick insert actions | 0.5 |
| Loading state | Load feedback | D3 | Add skeleton/loading visuals during state hydration | 0.5 |
| Error state | Error feedback | D2, D3 | Add recoverable error boundaries and toast/status channel | 0.5 |
| Video | Video block in editor | D1, D5 | Add editor-side controls for URL/embed video data | 1 |
| Quiz | Quiz block authoring | D1, D4 | Add interactive form-based editing controls for quiz schema | 1 |
| Poll | Poll block authoring | D1, D4 | Add poll options editor with validation | 1 |
| Table | Table block authoring | D1, D5 | Add basic table editing grid with cell model | 1 |
| Embed | Generic embed block | D1 | Add iframe/embed URL validation and placeholder renderer | 1 |
| Manga panel | Panel layout block | D1 | Add panel editor configuration and nested content support | 1 |
| Callout | Highlight note block | D1, D5 | Add styled callout variants and icon/text fields | 0.5 |
| Alert | Alert status block | D1, D5 | Add severity variants and dismiss/state controls | 0.5 |
| Dev playground | Editor playground app integration | D6 | Wire editor package into local playground fixtures | 0.5 |

### P2 Features (40)

| Feature | Description | Dependencies | Implementation approach | Estimated sessions |
|---|---|---|---|---|
| Block templates | Reusable block patterns | D1, D3 | Save/load templated block payloads through command palette | 0.5 |
| Block search | Search within blocks | D1, D3 | Add indexed block text search and jump navigation | 0.5 |
| Event filtering | Filter events by type/source | D2 | Add event stream filters in dev tools and logger panel | 0.5 |
| Recent commands | Show recently used commands | D1 | Persist MRU command list and rank in palette results | 0.5 |
| Command aliases | Multi-trigger commands | D1 | Support alias metadata and trigger normalization | 0.5 |
| Command preview | Preview before insert | D1, D5 | Render command preview cards in palette | 0.5 |
| Nested commands | Sub-command menus | D1 | Add tree-based command model and breadcrumb UI | 0.5-1 |
| Variables | Dynamic insert values | D1, D3 | Add variable resolvers (date/user/custom) in macro engine | 0.5 |
| Templates | Insert content templates | D1, D3 | Add template browser and insert flows | 0.5 |
| Macro registry | Macro discoverability | D1 | Add registry listing + help docs integration | 0.5 |
| Empty space menu | Right-click empty canvas | D3 | Add context-aware insertion menu for blank area | 0.5 |
| Keyboard navigation | Navigate menus by keys | D1 | Add roving tabindex + enter/escape behavior | 0.5 |
| Shortcut help | Shortcut cheat sheet | D2 | Add command-driven modal for key map overview | 0.5 |
| Chord shortcuts | Multi-step shortcuts | D2 | Add chord parser (`mod+k mod+s`) with timeout handling | 0.5 |
| Fixed toolbar | Persistent top toolbar | D3 | Add optional static toolbar mode in config | 0.5 |
| Toolbar groups | Group toolbar commands | D1 | Add group metadata and adaptive rendering | 0.5 |
| State snapshots | Capture debug snapshots | D3 | Expose snapshot API and diff-friendly serialization | 0.5 |
| Audio | Audio block authoring | D1 | Add source uploader/URL + metadata editor | 0.5-1 |
| File | File attachment block | D1 | Add file metadata model and upload hooks | 0.5-1 |
| Survey | Multi-question survey block | D1, D4 | Add survey builder UI and schema validation | 1 |
| Flashcard | Flashcard block | D1 | Add front/back card editor with preview mode | 0.5 |
| Accordion | Collapsible section block | D1 | Add accordion item editor and ordering controls | 0.5 |
| Tabs | Tabbed content block | D1 | Add tab definitions and active-tab editing controls | 0.5 |
| Toggle | Show/hide content block | D1 | Add toggle summary/body editing | 0.5 |
| Spoiler | Hidden content reveal block | D1 | Add spoiler label/content editing with preview | 0.5 |
| Chart | Chart block authoring | D1 | Add data schema editor and chart config controls | 1 |
| Map | Map block authoring | D1 | Add location/embed config editor | 0.5-1 |
| Math equation | Math block authoring | D1 | Add LaTeX input + preview pipeline | 0.5 |
| Diagram | Diagram block authoring | D1 | Add Mermaid/diagram source editor with validation | 0.5 |
| Timeline | Timeline block authoring | D1 | Add timeline event item editor | 0.5 |
| Comparison | Side-by-side comparison block | D1 | Add paired panel editor and responsive rules | 0.5 |
| Before/After | Image slider block | D1 | Add dual-image config and slider handle settings | 0.5 |
| Speech bubble | Dialogue bubble block | D1 | Add speech style variants and character label fields | 0.5 |
| Card | Card block | D1 | Add media/title/body card editor | 0.5 |
| Hero section | Hero block | D1 | Add heading/subheading/media/action controls | 0.5 |
| Gallery | Gallery block | D1 | Add image collection editor with ordering | 0.5 |
| Carousel | Carousel block | D1 | Add slides editor and navigation config | 0.5 |
| Annotated image | Image hotspot block | D1 | Add hotspot positioning and annotation editor | 0.5-1 |
| Block inspector | Debug block data panel | D1, D3 | Add inspector panel in playground/dev mode | 0.5 |
| Event logger | View all events | D2 | Add realtime event panel with filters/search | 0.5 |

---

## Session Plan

### Session 1-2: Editor Shell and Rendering Pipeline
**Goal:** Deliver first working `Editor` component backed by Phase 1 state.

**Tasks:**
- Create `packages/editor` structure (`blocks`, `commands`, `ui`, `state`, `index.ts`)
- Implement editor root + block list renderer + block wrapper
- Wire document/selection adapters to `@pulse/core` state classes
- Add focus model and active block visuals
- Add first integration tests for render + state sync

**Deliverables:**
- Running editor shell in local playground
- `@pulse/editor` public entrypoint
- Initial tests for editor mount and basic block editing

### Session 3-4: Command System and Slash Menu
**Goal:** Implement command registry and slash-triggered insertion/search flow.

**Tasks:**
- Build command registry with categories and metadata
- Implement slash trigger parsing and command palette UI
- Add fuzzy command search and insert execution pipeline
- Add command unit tests and keyboard navigation basics

**Deliverables:**
- Slash menu (`/`) with searchable commands
- Command execution abstraction reused by menus/toolbars/shortcuts
- Command tests with coverage for availability and filtering

### Session 5-6: Keyboard Shortcuts and Inline Formatting
**Goal:** Complete P0 shortcut experience and rich-text formatting path.

**Tasks:**
- Implement shortcut registry + platform-aware mappings
- Add default shortcuts (bold, italic, link, code, heading, save)
- Implement floating toolbar anchored to selection
- Add rich text mark commands and conflict detection
- Add tests for shortcut dispatch/conflict handling

**Deliverables:**
- Default keyboard-first editing workflow
- Floating selection toolbar with core formatting
- Shortcut and formatting test suite

### Session 7-8: Context Menus, Block Actions, and DnD (Flexible Wave)
**Goal:** Deliver core P1 manipulation UX.

**Tasks:**
- Block and selection context menus
- Per-block actions menu (duplicate/delete/move)
- Drag handle + drag-and-drop reorder
- Multi-select operations and batch actions

**Deliverables:**
- Right-click and drag workflows for block manipulation
- Integration tests for reorder and selection behavior

### Session 9-10: Save/Clipboard/UX State Wave (Flexible)
**Goal:** Stabilize authoring workflows and editor reliability.

**Tasks:**
- Manual save command + autosave debounce
- Clipboard copy/paste for block-aware content
- Empty/loading/error state surfaces
- State snapshot and debug hooks (P2 starter)

**Deliverables:**
- Reliable save + restore editing loop
- Clipboard and fallback UX state coverage

### Session 11-12: Extended Block Authoring Wave 1 (Flexible)
**Goal:** Add top-value P1/P2 blocks used by editor scenarios.

**Tasks:**
- Add editor controls for video/audio/file/table/embed
- Add callout/alert blocks and validation flows
- Add command entries and shortcuts for new blocks

**Deliverables:**
- Extended authoring block set integrated in editor
- Schema validation and insert/edit tests

### Session 13-14: Interactive and Creative Blocks Wave 2 (Flexible)
**Goal:** Add interaction-heavy block authoring.

**Tasks:**
- Quiz/poll/survey/accordion/tabs/toggle/spoiler editors
- Manga panel/speech bubble/card/gallery/carousel editors
- Performance pass on heavy block editing interactions

**Deliverables:**
- Interactive block editing baseline
- Performance test evidence for common workflows

### Session 15-16: P2 Polish and Dev Experience (Stretch)
**Goal:** Complete P2 polish and harden developer tooling.

**Tasks:**
- Recent/alias/nested command enhancements
- Block inspector + event logger in playground
- Accessibility and keyboard audit pass
- Final package docs and migration notes

**Deliverables:**
- Polished editor UX + debug tools
- Phase 2 closure package documentation

---

## Technical Considerations

- **Architecture decisions needed**
  - Keep command execution as the single action path for menu/shortcut/toolbar parity.
  - Preserve strict separation: `@pulse/editor` consumes `@pulse/core`; no reverse dependency.
  - Keep block-specific editing behavior in block definitions/extensions, not hardcoded editor core.
- **Performance considerations**
  - Memoize block wrappers and minimize full-list rerenders.
  - Add incremental rendering strategy before large-document optimization.
  - Debounce autosave and expensive derived calculations.
- **Security considerations**
  - Reuse Phase 1 validation/XSS boundaries for editor input and serialization.
  - Sanitize/validate embed, link, and media URLs before persistence.
  - Keep plugin-injected commands/actions behind schema and capability checks.
- **Network/testing constraints**
  - Follow [D002]: local-only test fixtures and no dependency on external URLs.
  - Keep Playwright scenarios skip-safe when Linux browser runtime is unavailable in WSL.

---

## Dependencies

### From Previous Phases

- Completed Phase 1 systems:
  - block registry and block schemas
  - event bus and middleware
  - document/selection/history/persistence state classes
  - plugin manager and APIs
  - baseline blocks package
  - testing/tooling/CI scaffolding

### External

- UI runtime: React adapter first (`@pulse/editor` React entrypoint)
- Optional DnD utility library if native implementation is too costly
- Optional fuzzy-search helper for command palette
- Existing workspace stack: TypeScript, Vitest, Playwright, Turbo, ESLint, Prettier

---

## Success Criteria

- [ ] All 10 Phase 2 P0 features are implemented and validated.
- [ ] Core P1 editor interaction features (DnD, context menus, multi-select, autosave) are stable.
- [ ] `@pulse/editor` package exports a usable React integration API.
- [ ] `npm run ci:local` remains green during Phase 2 execution.
- [ ] Editor command model is shared by slash menu, shortcuts, toolbar, and context menu.
- [ ] No critical regressions introduced in `@pulse/core` or `@pulse/blocks`.

---

## Estimated Timeline

- **Total sessions:** 12-16
- **Estimated duration:** 4-6 weeks (session-based velocity)
- **Detailed planning horizon:** Sessions 1-6
- **Flexible planning horizon:** Sessions 7-16 (reprioritized based on feedback and complexity)

---

## Phase 2 Entry Criteria

- Phase 1 is marked complete.
- Phase 2 backlog has initial sessions ready.
- Context snapshot reflects phase transition.
- Development starts with Session 1-2 editor shell implementation.

---

**Last Updated:** 2026-04-02  
**Next Milestone:** Session 11-12 complete with first extended authoring block wave.
