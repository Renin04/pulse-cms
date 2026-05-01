# Phase 1: Core Foundation

> Build the foundational architecture and core systems that all other features depend on.

**Status:** ✅ Completed (closed by stakeholder sign-off on 2026-04-01)  
**Estimated Sessions:** 10-14 sessions  
**Priority:** P0 (Critical)  
**Dependencies:** None

---

## 🎯 Phase Objectives

This phase establishes the **minimal viable core** that enables all future development:

1. **Block System:** Define, register, and manage content blocks
2. **Event System:** Enable decoupled communication between components
3. **State Management:** Handle document state, selection, and history
4. **Plugin Infrastructure:** Allow extensibility without modifying core
5. **Development Tooling:** Set up monorepo, testing, and build pipeline

**What This Phase Does NOT Include:**
- UI components (Phase 2)
- AI features (Phase 3)
- Renderer (Phase 4)
- Advanced block types (Phase 5+)

---

## 📦 Session Breakdown

### **Session 1-2: Block System Foundation**
**Package:** `@pulse/core`

**Tasks:**
- [x] Define TypeScript interfaces (`Block`, `BlockDefinition`, `BlockConfig`)
- [x] Implement `BlockRegistry` class (singleton pattern)
- [x] Add block validation using Zod schemas
- [x] Implement block lifecycle hooks (`onCreate`, `onUpdate`, `onDestroy`)
- [x] Write unit tests for registry (add, remove, get, validate)

**Files to Create:**
packages/core/src/types/block.ts
packages/core/src/registry/BlockRegistry.ts
packages/core/src/schemas/blockSchema.ts
packages/core/tests/registry.test.ts

**Acceptance Criteria:**
- Registry can add/remove/get blocks by ID or type
- Block definitions are validated on registration
- Lifecycle hooks fire in correct order
- 95%+ test coverage for registry

**Estimated Time:** 2 sessions (4-6 hours)

---

### **Session 3-4: Event System**
**Package:** `@pulse/core`

**Tasks:**
- [x] Implement `EventBus` class (pub/sub pattern)
- [x] Define core event types (`BlockEvent`, `SelectionEvent`, `ContentEvent`)
- [x] Add event priority and ordering
- [x] Implement event cancellation (`event.preventDefault()`)
- [x] Add event middleware support (logging, validation)
- [x] Write unit tests for event bus

**Files to Create:**

packages/core/src/events/EventBus.ts
packages/core/src/types/event.ts
packages/core/src/events/coreEvents.ts
packages/core/src/events/middleware.ts
packages/core/tests/events.test.ts

**Core Events to Define:**
typescript
// Block events
'block:created', 'block:updated', 'block:deleted', 'block:moved'

// Selection events
'selection:changed', 'selection:cleared'

// Content events
'content:changed', 'content:saved'

// Editor events
'editor:ready', 'editor:destroyed', 'editor:focus', 'editor:blur'

**Acceptance Criteria:**
- Events fire in correct order with priority support
- Event listeners can be added/removed dynamically
- Event cancellation works correctly
- No memory leaks from listeners
- Performance: <1ms per event dispatch

**Estimated Time:** 2 sessions (4-6 hours)

---

### **Session 5-6: State Management**
**Package:** `@pulse/core`

**Tasks:**
- [x] Implement `DocumentState` (immutable state tree)
- [x] Implement `SelectionState` (cursor, range, multi-block selection)
- [x] Implement `HistoryState` (undo/redo stack with compression)
- [x] Add state persistence to IndexedDB
- [x] Add state selectors and computed values
- [x] Write unit tests for all state classes

**Files to Create:**

packages/core/src/state/DocumentState.ts
packages/core/src/state/SelectionState.ts
packages/core/src/state/HistoryState.ts
packages/core/src/state/persistence.ts
packages/core/src/state/selectors.ts
packages/core/tests/state.test.ts

**State Structure:**
typescript
{
  document: {
    id: string;
    blocks: Block[];
    metadata: { title, author, createdAt, updatedAt };
  },
  selection: {
    blockId: string | null;
    offset: number;
    range: { start, end } | null;
  },
  history: {
    past: State[];
    present: State;
    future: State[];
  }
}

**Acceptance Criteria:**
- State updates are atomic and immutable
- Undo/redo works for all operations (50 levels deep)
- State persists to IndexedDB on change (debounced)
- State can be serialized/deserialized
- Performance: <5ms per state update

**Estimated Time:** 2 sessions (5-7 hours)

---

### **Session 7-8: Plugin System**
**Package:** `@pulse/core`

**Tasks:**
- [x] Implement `PluginManager` class
- [x] Define `Plugin` interface and lifecycle
- [x] Add plugin configuration schema validation
- [x] Implement plugin hooks (tap into events)
- [x] Add plugin dependency resolution
- [x] Create 2 example plugins (Markdown parser, Slash commands)
- [x] Write unit tests for plugin system

**Files to Create:**

packages/core/src/plugins/PluginManager.ts
packages/core/src/plugins/PluginAPI.ts
packages/core/src/types/plugin.ts
packages/core/src/plugins/examples/MarkdownPlugin.ts
packages/core/src/plugins/examples/SlashCommandsPlugin.ts
packages/core/tests/plugins.test.ts

**Plugin Lifecycle:**
typescript
interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];
  
  onInstall?(api: PluginAPI): void;
  onEnable?(api: PluginAPI): void;
  onDisable?(): void;
  onUninstall?(): void;
}

**Plugin Hooks:**
- `api.onBlockCreate(callback)`
- `api.onBlockUpdate(callback)`
- `api.onBlockDelete(callback)`
- `api.onSelectionChange(callback)`
- `api.onContentChange(callback)`

**Acceptance Criteria:**
- Plugins can register without modifying core
- Plugin errors don't crash the editor
- Plugin dependencies resolve correctly
- Plugins can be enabled/disabled dynamically
- Performance: <10ms plugin initialization

**Estimated Time:** 2 sessions (5-7 hours)

---

### **Session 9-10: Basic Block Types**
**Package:** `@pulse/blocks`

**Tasks:**
- [x] Create `TextBlock` (plain text with inline formatting)
- [x] Create `HeadingBlock` (H1-H6)
- [x] Create `ListBlock` (ordered/unordered)
- [x] Create `CodeBlock` (with syntax highlighting via Shiki)
- [x] Create `ImageBlock` (with upload and resize)
- [x] Register all blocks in registry
- [x] Write unit tests for each block type
- [x] Add remaining Phase 1 basic blocks: `Blockquote`, `HorizontalRule`, `Link`
- [x] Expand inline-code behavior coverage in `TextBlock`

**Files to Create:**

packages/blocks/src/TextBlock.ts
packages/blocks/src/HeadingBlock.ts
packages/blocks/src/ListBlock.ts
packages/blocks/src/CodeBlock.ts
packages/blocks/src/ImageBlock.ts
packages/blocks/src/index.ts
packages/blocks/tests/blocks.test.ts

**Block Interface:**
typescript
interface BlockDefinition {
  type: string;
  name: string;
  icon: string;
  category: 'basic' | 'media' | 'interactive' | 'advanced';
  
  schema: ZodSchema;
  defaultData: any;
  
  render(data: any, context: RenderContext): ReactNode;
  serialize(data: any): string;
  deserialize(content: string): any;
}

**Acceptance Criteria:**
- All 5 block types render correctly
- Blocks can be serialized to/from JSON
- Blocks validate their data on creation
- Code block supports 10+ languages
- Image block handles upload errors gracefully

**Estimated Time:** 2 sessions (5-7 hours)

---

### **Session 11-12: Development Tooling & Testing**
**Package:** Root workspace

**Tasks:**
- [x] Set up Turborepo monorepo configuration
- [x] Configure TypeScript for all packages
- [x] Set up Vitest for unit testing
- [x] Set up Playwright for E2E testing
- [x] Configure ESLint and Prettier
- [x] Set up GitHub Actions CI/CD pipeline
- [x] Add test coverage reporting
- [x] Write integration tests (events + state + blocks)
- [x] Add block-level import/export API for JSON document workflows
- [x] Implement nested block support (`parentId`/children tree validation + traversal)
- [x] Implement block cloning utilities for flat + nested structures
- [x] Add event logging middleware with configurable log levels
- [x] Add dirty-state tracking for unsaved changes
- [x] Add explicit XSS hardening tests around serialization/render output boundaries

**Files to Create:**

turbo.json
tsconfig.base.json
vitest.config.ts
playwright.config.ts
.github/workflows/ci.yml
packages/core/tests/integration.test.ts

**CI/CD Pipeline:**
1. Lint all packages
2. Type-check all packages
3. Run unit tests (Vitest)
4. Run integration tests
5. Generate coverage report
6. Build all packages
7. Run E2E tests (Playwright)

**Acceptance Criteria:**
- All packages build successfully
- Tests run in <30 seconds
- CI/CD passes on every commit
- Coverage report shows 90%+ coverage
- E2E tests cover basic workflows

**Estimated Time:** 3-4 sessions (6-10 hours)

---

## 🗂️ Final File Structure


pulse/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── block.ts
│   │   │   │   ├── event.ts
│   │   │   │   ├── state.ts
│   │   │   │   └── plugin.ts
│   │   │   ├── registry/
│   │   │   │   └── BlockRegistry.ts
│   │   │   ├── events/
│   │   │   │   ├── EventBus.ts
│   │   │   │   ├── coreEvents.ts
│   │   │   │   └── middleware.ts
│   │   │   ├── state/
│   │   │   │   ├── DocumentState.ts
│   │   │   │   ├── SelectionState.ts
│   │   │   │   ├── HistoryState.ts
│   │   │   │   ├── persistence.ts
│   │   │   │   └── selectors.ts
│   │   │   ├── plugins/
│   │   │   │   ├── PluginManager.ts
│   │   │   │   ├── PluginAPI.ts
│   │   │   │   └── examples/
│   │   │   │       ├── MarkdownPlugin.ts
│   │   │   │       └── SlashCommandsPlugin.ts
│   │   │   ├── schemas/
│   │   │   │   └── blockSchema.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   │   ├── registry.test.ts
│   │   │   ├── events.test.ts
│   │   │   ├── state.test.ts
│   │   │   ├── plugins.test.ts
│   │   │   └── integration.test.ts
│   │   └── package.json
│   │
│   └── blocks/
│       ├── src/
│       │   ├── TextBlock.ts
│       │   ├── HeadingBlock.ts
│       │   ├── ListBlock.ts
│       │   ├── CodeBlock.ts
│       │   ├── ImageBlock.ts
│       │   └── index.ts
│       ├── tests/
│       │   └── blocks.test.ts
│       └── package.json
│
├── docs/
├── phases/
├── backlog/
├── turbo.json
├── tsconfig.base.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json

---

## 🔗 Dependencies

**External:**
- `immer` (^10.0.0) — Immutable state updates
- `zod` (^3.22.0) — Schema validation
- `idb` (^8.0.0) — IndexedDB wrapper
- `nanoid` (^5.0.0) — Unique ID generation
- `shiki` (^1.0.0) — Syntax highlighting for code blocks

**Dev Dependencies:**
- `typescript` (^5.3.0)
- `vitest` (^1.0.0)
- `playwright` (^1.40.0)
- `turbo` (^1.11.0)
- `eslint` (^8.55.0)
- `prettier` (^3.1.0)

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- Test each class/function in isolation
- Mock external dependencies (IndexedDB, events)
- Aim for 95%+ coverage
- Use property-based testing for state management

### Integration Tests (Vitest)
- Test interactions between systems:
  - Events → State updates
  - Plugins → Event hooks
  - State → Persistence
- Test block operations with real registry

### E2E Tests (Playwright)
- Test complete workflows:
  - Create document → Add blocks → Save → Reload
  - Undo/redo operations
  - Plugin installation and usage

---

## 📊 Success Metrics

**Code Quality:**
- 95%+ test coverage
- 0 critical bugs
- TypeScript strict mode enabled
- ESLint with 0 warnings

**Performance:**
- Block operations: <16ms (60fps)
- State updates: <5ms
- Event dispatch: <1ms
- Plugin initialization: <10ms

**Developer Experience:**
- Clear API documentation
- Type-safe interfaces
- Helpful error messages
- Easy to extend

---

## 🚧 Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large documents (1000+ blocks) slow | High | Implement virtual scrolling in Phase 2 |
| State complexity grows | Medium | Keep state tree flat, use selectors |
| Plugin security vulnerabilities | High | Implement plugin sandboxing in Phase 3 |
| IndexedDB quota exceeded | Medium | Add quota monitoring and cleanup |

---

## 🔄 Phase Completion Checklist

Before moving to Phase 2, ensure:

- [x] All session tasks completed
- [x] All tests passing (unit + integration)
- [x] Test coverage ≥95%
- [x] Performance benchmarks met
- [x] API documentation complete
- [x] No critical bugs in backlog
- [x] Code reviewed and merged
- [x] `CONTEXT_SNAPSHOT.md` updated
- [x] `BACKLOG.md` cleared of P0/P1 tasks
- [x] Key decisions logged in `DECISIONS.md`

---

## 📝 Notes for Agent

- **Start each session by reading:** `CONTEXT_SNAPSHOT.md`, `BACKLOG.md`, this phase file
- **End each session by updating:** `CONTEXT_SNAPSHOT.md`, `BACKLOG.md`, `CONVERSATION_LOG.md`
- **Write minimal code:** Only what's needed to pass tests
- **Don't auto-generate tests:** Wait for explicit request
- **Document decisions:** Add to `DECISIONS.md` with reasoning
- **Ask when unclear:** Don't assume requirements

---

## 🎯 Next Phase

**Phase 2: Editor UI** will build the visual editor interface on top of this foundation, including:
- React components for editor shell
- Block rendering and editing
- Toolbar and context menus
- Slash commands UI
- Keyboard shortcuts

---

**Last Updated:** 2026-04-01  
**Completion:** Closed on 2026-04-01 after Session 11-12 closure and stakeholder phase sign-off.
