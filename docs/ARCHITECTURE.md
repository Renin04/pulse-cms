# Pulse — Technical Architecture

> This document defines the technical architecture of Pulse: how modules communicate,
> how blocks work, how plugins extend the system, and how everything stays decoupled.

---

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Pulse Core                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Block        │  │ Event        │  │ Plugin       │     │
│  │ Registry     │  │ System       │  │ System       │     │
│  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
           ▲                    ▲                    ▲
           │                    │                    │
    ┌──────┴──────┐      ┌─────┴─────┐      ┌──────┴──────┐
    │             │      │           │
┌───▼────┐   ┌───▼────┐ │  ┌────▼────┐ ┌───▼────┐
│ Editor │   │Renderer│ │  │   AI    │ │Plugin 1│   │Plugin N│
│Package │   │Package │ │  │ Package │ │        │   │        │
└────────┘   └────────┘ │  └─────────┘ └────────┘   └────────┘
                        │┌────▼─────┐
                   │ User App │
                   │(Next.js, │
                   │ Nuxt,etc)│
                   └──────────┘

---

## 📦 Package Structure

Pulse is a **monorepo** with independent, composable packages:


pulse/
├── packages/
│   ├── core/              # @pulse/core
│   │   ├── block-registry/
│   │   ├── event-system/
│   │   ├── plugin-system/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── editor/            # @pulse/editor
│   │   ├── blocks/        # Editor-side block components
│   │   ├── commands/      # Slash commands, shortcuts
│   │   ├── ui/            # Editor UI (toolbar, menus, etc.)
│   │   ├── state/         # Editor state management
│   │   └── index.ts
│   │
│   ├── renderer/          # @pulse/renderer
│   │   ├── blocks/        # Renderer-side block components
│   │   ├── layout/        # Layout engine
│   │   ├── interactions/  # Scroll triggers, animations
│   │   └── index.ts
│   │
│   ├── ai/                # @pulse/ai
│   │   ├── block-generator/
│   │   ├── content-analyzer/
│   │   ├── layout-suggester/
│   │   └── index.ts
│   │
│   └── plugins/           # Official plugins
│       ├── quiz/          # @pulse/plugin-quiz
│       ├── poll/          # @pulse/plugin-poll
│       ├── manga/         # @pulse/plugin-manga
│       └── ...
│
├── apps/
│   └── playground/        # Dev/test environment
│
└── docs/                  # Documentation

### Package Dependencies


core→ (no dependencies)
editor        → core
renderer      → core
ai            → core
plugins/*     → core (+ editor and/or renderer if needed)

**Rule:** No circular dependencies. Core is the foundation. Everything else builds on it.

---

## 🧱 Block System

### What is a Block?

A **block** is the fundamental unit of content in Pulse. Everything is a block:
- Paragraph
- Heading
- Image
- Quiz
- Poll
- Manga panel
- Code playground
- Custom user-defined blocks

### Block Anatomy

Every block has:

typescript
interface Block {
  id: string;                    // Unique identifier
  type: string;                  // Block type (e.g., "paragraph", "quiz")
  data: Record<string, any>;     // Block-specific data
  meta?: {                       // Optional metadata
    createdAt?: number;
    updatedAt?: number;
    author?: string;
    version?: string;
  };
  children?: Block[];            // Nested blocks (for containers)
}

### Block Definition

To register a new block type, you define:

typescript
interface BlockDefinition {
  type: string;                           // Unique type identifier
  name: string;                           // Human-readable name
  icon?: string;                          // Icon (emoji or SVG)
  category?: string;                      // Category for slash menu
  schema: z.ZodSchema;                    // Zod schema for data validation
  
  // Editor side
  editorComponent: ComponentType<EditorBlockProps>;
  editorConfig?: {
    toolbar?: ToolbarConfig;
    shortcuts?: ShortcutConfig[];
    slashCommand?: SlashCommandConfig;contextMenu?: ContextMenuConfig;
  };
  
  // Renderer side
  rendererComponent: ComponentType<RendererBlockProps>;
  rendererConfig?: {
    animations?: AnimationConfig;
    interactions?: InteractionConfig;
  };
  
  // Metadata
  version?: string;
  author?: string;
  description?: string;
  examples?: BlockExample[];
}

### Block Registry

The **Block Registry** is the central source of truth for all block types:

typescript
class BlockRegistry {
  register(definition: BlockDefinition): void;
  unregister(type: string): void;
  get(type: string): BlockDefinition | undefined;
  getAll(): BlockDefinition[];
  getByCategory(category: string): BlockDefinition[];
  validate(block: Block): ValidationResult;
}

**Location:** `packages/core/block-registry/`

**Rules:**
- Block types are registered at app startup
- Plugins can register new block types dynamically
- AI-generated blocks are validated and registered at runtime
- Registry is immutable after registration (no hot-swapping)

---

## 🎯 Event System

Pulse uses an **event-driven architecture** for communication between modules.

### Why Events?

- **Decoupling:** Editor doesn't need to know about AI. AI doesn't need to know about renderer.
- **Extensibility:** Plugins can listen to events without modifying core code.
- **Debugging:** All state changes are traceable via event logs.

### Event Bus

typescript
class EventBus {
  on<T>(event: string, handler: (data: T) => void): Unsubscribe;
  once<T>(event: string, handler: (data: T) => void): Unsubscribe;
  off(event: string, handler: Function): void;
  emit<T>(event: string, data: T): void;
  clear(): void;
}

**Location:** `packages/core/event-system/`

### Core Events

| Event | Payload | Emitted By | Listened By |
|-------|---------|------------|-------------|
| `block.inserted` | `{ block: Block, position: number }` | Editor | Plugins, AI |
| `block.updated` | `{ block: Block, changes: Partial<Block> }` | Editor | Plugins, AI |
| `block.deleted` | `{ blockId: string }` | Editor | Plugins |
| `block.moved` | `{ blockId: string, from: number, to: number }` | Editor | Plugins |
| `content.changed` | `{ blocks: Block[] }` | Editor | AI, Plugins |
| `command.executed` | `{ command: string, args: any }` | Editor | Plugins |
| `shortcut.triggered` | `{ shortcut: string, context: any }` | Editor | Plugins |
| `ai.blockGenerated` | `{ block: Block, prompt: string }` | AI | Editor |
| `ai.error` | `{ error: Error, context: any }` | AI | Editor |
| `plugin.loaded` | `{ plugin: PluginMetadata }` | Core | Editor |
| `plugin.error` | `{ plugin: string, error: Error }` | Core | Editor |

### Event Naming Convention


<module>.<action>

Examples:
- `block.inserted`
- `editor.ready`
- `ai.processing`
- `renderer.mounted`

---

## 🔌 Plugin System

Plugins extend Pulse without modifying core code.

### Plugin Structure

typescript
interface Plugin {
  name: string;
  version: string;
  author?: string;
  description?: string;
  // Lifecycle hooks
  onLoad?(context: PluginContext): void | Promise<void>;
  onUnload?(): void | Promise<void>;
  // What the plugin provides
  blocks?: BlockDefinition[];
  commands?: CommandDefinition[];
  shortcuts?: ShortcutDefinition[];
  eventHandlers?: EventHandler[];
  
  // Dependencies
  dependencies?: string[];
  peerDependencies?: string[];
}

### Plugin Context

When a plugin is loaded, it receives a **context** object:

typescript
interface PluginContext {
  blockRegistry: BlockRegistry;
  eventBus: EventBus;
  commandRegistry: CommandRegistry;
  shortcutRegistry: ShortcutRegistry;
  config: Record<string, any>;
  
  // Utilities
  logger: Logger;
  storage: Storage;
  http: HttpClient;
}

### Plugin Lifecycle


1. User installs plugin (npm install @pulse/plugin-quiz)
2. User imports and registers plugin in app
3. Plugin.onLoad() is called with context
4. Plugin registers blocks, commands, shortcuts, event handlers
5. Plugin is now active
6. (On app shutdown) Plugin.onUnload() is called

### Example Plugin

typescript
// @pulse/plugin-quiz

import { Plugin, BlockDefinition } from '@pulse/core';
import { QuizEditor } from './editor';
import { QuizRenderer } from './renderer';

export const quizPlugin: Plugin = {
  name: 'quiz',
  version: '1.0.0',
  author: 'Pulse Team',
  description: 'Interactive quiz blocks',
  
  onLoad(context) {
    // Register quiz block
    context.blockRegistry.register({
      type: 'quiz',
      name: 'Quiz',
      icon: '❓',
      category: 'interactive',
      schema: quizSchema,
      editorComponent: QuizEditor,
      rendererComponent: QuizRenderer,
      editorConfig: {
        slashCommand: {
          trigger: '/quiz',
          description: 'Insert a quiz',
        },
        shortcuts: [
          { key: 'mod+shift+q', action: 'insertQuiz' }
        ]
      }
    });
    
    // Listen to events
    context.eventBus.on('quiz.answered', (data) => {
      context.logger.info('Quiz answered', data);
    });
  },
  
  onUnload() {
    // Cleanup if needed
  }
};

**Location:** `packages/plugins/quiz/`

---

## 🖊️ Editor Architecture

### Editor State

The editor maintains a **single source of truth** for content:

typescript
interface EditorState {
  blocks: Block[];// Content blocks
  selection: Selection | null;  // Current selection
  history: HistoryState;        // Undo/redo stack
  mode: 'edit' | 'preview';     // Current mode
  config: EditorConfig;         // Editor configuration
}

**State Management:** Use a reactive state library (Zustand, Valtio, or similar).

### Editor Components


Editor (root)
├── Toolbar
├── CommandPalette (slash commands)
├── ContextMenu (right-click)
├── BlockList
│   └── BlockWrapper (for each block)
│       ├── BlockComponent (type-specific)
│       └── BlockControls (drag, delete, etc.)
└── StatusBar

### Command System

Commands are actions that can be triggered via:
- Slash commands (`/heading`)
- Keyboard shortcuts (`Cmd+B`)
- Context menu (right-click)
- Toolbar buttons
- AI suggestions

typescript
interface Command {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  
  // Execution
  execute(context: CommandContext): void | Promise<void>;
  
  // Availability
  isAvailable?(context: CommandContext): boolean;
  
  // Shortcuts
  shortcuts?: string[];
  
  // Slash command
  slashTrigger?: string;
}

**Location:** `packages/editor/commands/`

---

## 🎭 Renderer Architecture

The renderer is **stateless** — it receives blocks and renders them.

### Renderer Props

typescript
interface RendererProps {
  blocks: Block[];
  config?: RendererConfig;
  onInteraction?: (event: InteractionEvent) => void;
}

### Renderer Features

- **Layout Engine:** Handles block positioning, spacing, responsive design
- **Animation System:** Scroll-triggered animations, transitions
- **Interaction System:** Handles clicks, hovers, form submissions
- **State Management:** For interactive blocks (quiz answers, poll votes, etc.)

### Renderer Components


Renderer (root)
├── LayoutEngine
│   └── BlockRenderer (for each block)
│       └── BlockComponent (type-specific)
└── InteractionManager

### Renderer vs Editor

| Aspect | Editor | Renderer |
|--------|--------|----------|
| Purpose | Authoring | Display |
| State | Mutable | Immutable (from renderer's perspective) |
| Interactivity | Edit content | Interact with content |
| Components | Editable blocks | Display-only blocks |
| Performance | Less critical | Highly optimized |

---

## 🤖 AI Architecture

### AI Capabilities

1. **Block Generation:** Create new block types from natural language
2. **Content Analysis:** Suggest improvements, detect issues
3. **Layout Suggestions:** Recommend better block arrangements
4. **Auto-completion:** Smart text and code completion

### AI Flow: Block Generation


User: "I need a block where readers can drag items to sort them"
  ↓
AI analyzes request
  ↓
AI generates:
  - Block schema (TypeScript types)
  - Editor component (React/Vue/Svelte)
  - Renderer component
  - Test file
  ↓
AI runs tests
  ↓
If tests pass:
  - Register block in registry
  - Add slash command
  - Explain usage to user
  ↓
User can now use the block

### AI Integration Points

typescript
interface AIService {
  generateBlock(prompt: string): Promise<BlockDefinition>;
  analyzeContent(blocks: Block[]): Promise<ContentAnalysis>;
  suggestLayout(blocks: Block[]): Promise<LayoutSuggestion>;
  completeText(context: string): Promise<string>;
}

**Location:** `packages/ai/`

**Provider Agnostic:** Support OpenAI, Anthropic, local models, etc.

---

## 🔐 Data Flow

### Editor → Renderer


User edits content in Editor
  ↓
Editor state updates (blocks array)
  ↓
Emit 'content.changed' event
  ↓
Serialize blocks to JSON
  ↓
Save to database/file
  ↓
Renderer fetches blocks
  ↓
Renderer displays content

### Block Data Format

Blocks are stored as JSON:

json
{
  "version": "1.0",
  "blocks": [
    {
      "id": "block-1",
      "type": "heading",
      "data": {
        "level": 1,
        "text": "Welcome to Pulse"
      }
    },
    {
      "id": "block-2",
      "type": "quiz",
      "data": {
        "question": "What is 2+2?",
        "options": ["3", "4", "5"],
        "correctAnswer": 1
      }
    }
  ]
}

**Validation:** Every block is validated against its schema before save/render.

---

## 🛠️ Technology Stack

See `docs/TECH_STACK.md` for detailed technology decisions.

**Summary:**
- **Language:** TypeScript (strict mode)
- **Build:** Turborepo + Vite
- **Testing:** Vitest + Playwright
- **UI Framework:** Framework-agnostic (provide React, Vue, Svelte adapters)
- **Styling:** CSS-in-JS or Tailwind (TBD)
- **State:** Zustand or Valtio
- **Validation:** Zod
- **AI:** Provider-agnostic (OpenAI, Anthropic, local)

---

## 📊 Performance Considerations

### Editor Performance
- Virtual scrolling for large documents (1000+ blocks)
- Debounced autosave
- Lazy-load block components
- Memoize block renders

### Renderer Performance
- Server-side rendering (SSR) support
- Static generation support
- Code splitting per block type
- Lazy-load interactive blocks
- Optimize animations (use CSS transforms, not layout changes)

### Bundle Size
- Core: < 50KB gzipped
- Editor: < 200KB gzipped
- Renderer: < 100KB gzipped
- Each plugin: < 50KB gzipped

---

## 🧪 Testing Strategy

### Unit Tests
- Every utility function
- Block validation logic
- Event system
- Command execution

### Integration Tests
- Block registration
- Plugin loading
- Editor state changes
- Renderer output

### E2E Tests
- User workflows (create post, add blocks, publish)
- Keyboard shortcuts
- Slash commands
- AI block generation

**Coverage Target:** 80%+

---

## 🚀 Deployment Models

Pulse supports multiple deployment models:

### 1. NPM Package (Primary)
bash
npm install @pulse/editor @pulse/renderer

### 2. CDN (for quick prototyping)
html
<script src="https://cdn.pulse.dev/editor.js"></script>

### 3. Self-hosted (for full control)
Clone repo, build, deploy to your infrastructure.

---

## 🔮 Future Architecture Considerations

### Real-time Collaboration
- Operational Transform (OT) or CRDT for conflict resolution
- WebSocket or WebRTC for real-time sync
- Cursor presence and selection sharing

### Offline Support
- IndexedDB for local storage
- Service worker for offline editing
- Sync queue for pending changes

### Version Control
- Git-like versioning for content
- Diff/merge UI for content changes
- Branch/fork support for collaborative editing

---

## 📐 Architecture Principles

1. **Modularity:** Every package should work independently
2. **Extensibility:** Plugins should be first-class citizens
3. **Performance:** Fast by default, optimized for scale
4. **Developer Experience:** Simple API, great TypeScript support
5. **User Experience:** Zero friction, maximum expression
6. **Testability:** Every module is testable in isolation
7. **Documentation:** Code is self-documenting + comprehensive docs

---

## 🎯 Non-Goals

What Pulse is **NOT**:
- ❌ A full CMS (no user management, no database, no hosting)
- ❌ A website builder (no page builder, no themes)
- ❌ A social platform (no comments, no likes, no follows)
- ❌ A markdown editor (blocks, not markdown)

Pulse is an **engine**. You bring the app, we bring the content experience.
