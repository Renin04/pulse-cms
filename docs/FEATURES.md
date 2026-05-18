# Pulse — Complete Feature List

> This document lists ALL features planned for Pulse, organized by priority and category.
> Features are marked with status indicators and phase assignments.

---

## 📊 Priority Levels

| Symbol | Priority | Meaning |
|--------|----------|---------|
| 🔴 | P0 | Must-have for MVP. Blocking. |
| 🟠 | P1 | Important for launch. High value. |
| 🟡 | P2 | Nice to have. Medium value. |
| 🟢 | P3 | Future enhancement. Low priority. |

## 🏷️ Status Indicators

| Symbol | Status |
|--------|--------|
| ⬜ | Not started |
| 🟦 | In progress |
| ✅ | Completed |
| 🚫 | Blocked |
| ⏸️ | Paused |

---

## 🎯 Core Features

### Block System

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Block registry | 🔴 P0 | ✅ | 1 | Central registry for all block types |
| Block validation | 🔴 P0 | ✅ | 1 | Zod-based schema validation |
| Block serialization | 🔴 P0 | ✅ | 1 | JSON import/export |
| Nested blocks | 🟠 P1 | ✅ | 1 | Container blocks with children |
| Block versioning | 🟡 P2 | ⬜ | 6 | Version tracking for blocks |
| Block templates | 🟡 P2 | ✅ | 2 | Reusable block patterns |
| Block cloning | 🟠 P1 | ✅ | 1 | Duplicate blocks with data |
| Block search | 🟡 P2 | ✅ | 2 | Search within blocks |

### Event System

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Event bus | 🔴 P0 | ✅ | 1 | Core event system |
| Event logging | 🟠 P1 | ✅ | 1 | Debug/trace events |
| Event replay | 🟢 P3 | ⬜ | 6 | Replay events for debugging |
| Event filtering | 🟡 P2 | ✅ | 2 | Filter events by type/source |

### Plugin System

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Plugin loader | 🔴 P0 | ✅ | 1 | Load/unload plugins |
| Plugin context | 🔴 P0 | ✅ | 1 | API access for plugins |
| Plugin dependencies | 🟠 P1 | ✅ | 1 | Dependency resolution |
| Plugin marketplace | 🟢 P3 | ⬜ | - | Community plugin registry |
| Plugin sandboxing | 🟡 P2 | ⬜ | 6 | Security isolation |
| Hot reload plugins | 🟢 P3 | ⬜ | - | Dev-time hot reload |

---

## 🖊️ Editor Features

### Basic Editing

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Text editing | 🔴 P0 | ✅ | 2 | Basic text input |
| Rich text formatting | 🔴 P0 | ✅ | 2 | Bold, italic, underline, etc. |
| Undo/redo | 🔴 P0 | ✅ | 1 | History stack |
| Copy/paste | 🔴 P0 | ✅ | 2 | Clipboard support |
| Drag and drop | 🟠 P1 | ✅ | 2 | Reorder blocks |
| Multi-select | 🟠 P1 | ✅ | 2 | Select multiple blocks |
| Autosave | 🟠 P1 | ✅ | 2 | Auto-save to storage |
| Manual save | 🔴 P0 | ✅ | 2 | Explicit save action |

### Slash Commands

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Slash menu | 🔴 P0 | ✅ | 2 | `/` triggers command palette |
| Command search | 🔴 P0 | ✅ | 2 | Fuzzy search commands |
| Command categories | 🟠 P1 | ✅ | 2 | Group commands by type |
| Recent commands | 🟡 P2 | ✅ | 2 | Show recently used |
| Command aliases | 🟡 P2 | ✅ | 2 | Multiple triggers per command |
| Custom commands | 🟠 P1 | ✅ | PM4 | User-defined command authoring surface with validation and safe registration |
| Command preview | 🟡 P2 | ✅ | 2 | Preview before insert |
| Nested commands | 🟡 P2 | ✅ | 2 | Sub-menus (e.g., `/heading/1`) |

### Backslash Commands

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Backslash menu | 🟠 P1 | ✅ | 2 | `\` triggers macro menu |
| Quick inserts | 🟠 P1 | ✅ | 2 | Fast shortcuts (e.g., `\date`) |
| Variables | 🟡 P2 | ✅ | 2 | Insert dynamic values |
| Templates | 🟡 P2 | ✅ | 2 | Insert block templates |
| Custom macros | 🟡 P2 | ✅ | PM4 | User-defined macro authoring and registry management |
| Macro registry | 🟡 P2 | ✅ | 2 | List all available macros |

### Context Menu (Right-Click)

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Block context menu | 🟠 P1 | ✅ | 2 | Right-click on block |
| Selection context menu | 🟠 P1 | ✅ | 2 | Right-click on text selection |
| Empty space menu | 🟡 P2 | ✅ | 2 | Right-click on empty area |
| Contextual actions | 🟠 P1 | ✅ | 2 | Actions based on block type |
| Custom menu items | 🟡 P2 | ⬜ | 6 | Plugins add menu items |
| Keyboard navigation | 🟡 P2 | ✅ | 2 | Navigate menu with arrows |

### Keyboard Shortcuts

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Default shortcuts | 🔴 P0 | ✅ | 2 | Standard shortcuts (Cmd+B, etc.) |
| Custom shortcuts | 🟠 P1 | ✅ | 2 | User-defined shortcuts |
| Shortcut manager UI | 🟠 P1 | ✅ | PM4 | In-product shortcut editor with search/grouping/import-export |
| Shortcut registry | 🟠 P1 | ✅ | 2 | Central shortcut management |
| Shortcut conflicts | 🟠 P1 | ✅ | 2 | Detect and warn conflicts |
| Shortcut help | 🟡 P2 | ✅ | 2 | Show all shortcuts (Cmd+/) |
| Chord shortcuts | 🟡 P2 | ✅ | 2 | Multi-key sequences |
| Platform-specific | 🔴 P0 | ✅ | 2 | Cmd on Mac, Ctrl on Win/Linux |

### Toolbar

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Floating toolbar | 🟠 P1 | ✅ | 2 | Appears on text selection |
| Fixed toolbar | 🟡 P2 | ✅ | 2 | Always visible at top |
| Customizable toolbar | 🟡 P2 | ✅ | 3 | Schema, rendering, overflow, safe fallbacks |
| Toolbar groups | 🟡 P2 | ✅ | 2 | Organize buttons by category |
| Responsive toolbar | 🟠 P1 | ✅ | 2 | Adapts to screen size |

### Editor UI/UX

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Block hover state | 🟠 P1 | ✅ | 2 | Visual feedback on hover |
| Block focus state | 🔴 P0 | ✅ | 2 | Clear focus indicator |
| Block drag handle | 🟠 P1 | ✅ | 2 | Drag icon on hover |
| Block actions menu | 🟠 P1 | ✅ | 2 | Delete, duplicate, etc. |
| Empty state | 🟠 P1 | ✅ | 2 | Helpful message when empty |
| Loading state | 🟠 P1 | ✅ | 2 | Show loading indicators |
| Error state | 🟠 P1 | ✅ | 2 | Display errors gracefully |
| Dark mode | 🟡 P2 | ✅ | 3 | Dark theme support |
| Accessibility | 🟠 P1 | ✅ | 3 | ARIA labels, keyboard nav, focus management, skip links |
| Mobile editing | 🟡 P2 | ✅ | 3 | Touch gestures, touch targets, viewport detection |

### Editor State

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| State management | 🔴 P0 | ✅ | 1 | Reactive state (Zustand/Valtio) |
| Selection tracking | 🔴 P0 | ✅ | 1 | Track cursor/selection |
| History management | 🔴 P0 | ✅ | 1 | Undo/redo stack |
| Dirty state tracking | 🟠 P1 | ✅ | 1 | Detect unsaved changes |
| State persistence | 🟠 P1 | ✅ | 1 | Save/restore editor state |
| State snapshots | 🟡 P2 | ✅ | 2 | Capture state for debugging |

---

## 🧭 Migration to Phase 4 (PM4)

### Editor Parity Gaps (CKEditor/TinyMCE Benchmark)

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Text alignment controls | 🟠 P1 | ✅ | PM4 | Paragraph/list alignment commands with toolbar, shortcut, and command palette access |
| Find and replace | 🟠 P1 | ✅ | PM4 | In-editor search and replace with next/prev and scoped replacement |
| Word and character count | 🟡 P2 | ✅ | PM4 | Live content metrics for editor footer and command panel |
| Paste cleanup pipeline | 🟡 P2 | ⬜ | PM4 | Normalize pasted HTML/Word content with preserve-vs-clean modes |
| Mentions | 🟡 P2 | ⬜ | PM4 | Inline mention triggers with entity suggestions and rendering hooks |
| Image alt text metadata | 🟠 P1 | ✅ | PM4 | Required and validated alt text authoring flow for image-like blocks |
| Image credit/source/license fields | 🟡 P2 | ✅ | PM4 | Media attribution metadata (credit/source/license) with renderer exposure |
| Advanced table operations | 🟡 P2 | ⬜ | PM4 | Merge/split cells, table header toggles, row/column controls |
| Source editing mode | 🟡 P2 | ⬜ | PM4 | Optional HTML/source view with safe round-trip validation |
| Accessibility checker UI | 🟡 P2 | ⬜ | PM4 | In-editor a11y issue scanner and quick-fix assistant |
| Collaboration comments | 🟠 P1 | ✅ | PM4 | Comment threads anchored to blocks/selections for editorial review |
| Suggestion mode | 🟠 P1 | ✅ | PM4 | Suggestion/track-change style proposed edits before apply |
| Revision history timeline | 🟠 P1 | ✅ | PM4 | Snapshot timeline and diff viewing for restore/compare workflows |
| Document import/export | 🟡 P2 | ⬜ | PM4 | Import and export pipelines (initially HTML/Markdown, expand to DOCX/PDF) |
| Command center reference page | 🟠 P1 | ✅ | PM4 | In-product discoverable reference for commands/shortcuts/macros |

### CMS Platform Baseline (WordPress/Strapi/Contentful/Sanity/Ghost Benchmark)

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Content type builder | 🟠 P1 | ✅ | PM4 | Define reusable content types and field schemas for CMS entries |
| Collection and entry manager | 🟠 P1 | ✅ | PM4 | Create/edit/list/filter/sort entries per content type |
| Taxonomy management | 🟡 P2 | ✅ | PM4 | Categories/tags/labels with content relationships |
| Slug policy and URL rules | 🟠 P1 | ✅ | PM4 | Deterministic slug generation and uniqueness validation |
| Draft/review/publish statuses | 🟠 P1 | ✅ | PM4 | Editorial status workflow with explicit transitions |
| Publish scheduling | 🟠 P1 | ✅ | PM4 | Schedule publish/unpublish actions per entry |
| Approval checkpoints | 🟠 P1 | ✅ | PM4 | Human approval gates for sensitive content transitions |
| Role and permission matrix | 🟠 P1 | ✅ | PM4 | Author/editor/admin permission model for CMS operations |
| Revision restore for entries | 🟠 P1 | ⬜ | PM4 | Entry-level history with rollback and compare actions |
| Release/batch publish workflow | 🟡 P2 | ⬜ | PM4 | Group changes into release batches for controlled publishing |
| Media library | 🟠 P1 | ✅ | PM4 | CMS media hub with upload, foldering, metadata, and references |
| Media search/filter and governance | 🟡 P2 | ✅ | PM4 | Filter media by type/usage/metadata plus quality checks |
| Locale-aware content variants | 🟡 P2 | ⬜ | PM4 | Per-entry localization model for multilingual publishing |
| Publish webhooks/events | 🟡 P2 | ✅ | PM4 | Outbound events for publish/update/delete lifecycle integration |
| CMS content APIs | 🟡 P2 | ✅ | PM4 | API contracts for content delivery and management automation |
| SEO metadata at entry level | 🟠 P1 | ✅ | PM4 | Title/meta/slug/social metadata integrated into CMS form workflow |
| Audit activity log | 🟡 P2 | ✅ | PM4 | Timeline of content changes, approvals, and publishes |
| Website/blog dogfooding stack | 🟠 P1 | ✅ | PM4 | Pulse marketing site plus Pulse-powered blog management and rendering; marketing pages, studio authoring, local preview, and hydrated local blog feed are now operational |

### PM4 Accepted Deferrals (Documented at Sign-Off)

The remaining unchecked PM4 rows are intentionally deferred and do not block AI kickoff. Formal handoff reference: `docs/PHASE_04_AI_KICKOFF_CHECKLIST.md`.

| Feature | Follow-up target | Rationale |
|---------|------------------|-----------|
| Paste cleanup pipeline | 6 | Authoring cleanup improvement, but PM4 already delivered the required editor/CMS lifecycle baseline. |
| Mentions | 6 | Useful collaboration affordance, but not required for the single-workspace dogfooding loop. |
| Advanced table operations | 6 | Deeper editor parity item that does not block PM4 exit criteria or AI package kickoff. |
| Source editing mode | 6 | Power-user authoring surface deferred until post-AI stabilization to avoid expanding maintenance scope early. |
| Accessibility checker UI | 6 | Dedicated audit UI is postponed because PM4 already ships a11y metadata and publish guardrails. |
| Document import/export | 6 | Interoperability workflow is deferred because PM4 only requires native Pulse authoring and rendering. |
| Revision restore for entries | 6 | Rollback depth is useful later, but PM4 already includes review/history primitives sufficient for the gate. |
| Release/batch publish workflow | 6 | Multi-entry release orchestration exceeds the current PM4 website dogfooding baseline. |
| Locale-aware content variants | 6 | Multilingual publishing is intentionally parked until AI/SEO/production contracts stabilize. |

---

## 🎭 Renderer Features

### Core Rendering

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Block rendering | 🔴 P0 | ✅ | 3 | Render all Phase 1/2 block types through renderer parity registry |
| Responsive layout | 🔴 P0 | ✅ | 3 | Mobile/tablet/desktop baseline with breakpoint-aware single-column container behavior |
| SSR support | 🟠 P1 | ✅ | 3 | SSR-safe rendering path with no browser-global dependency in runtime helpers |
| Static generation | 🟠 P1 | ✅ | 3 | Pre-render at build time via `renderToStaticHtml()` and metadata extraction |
| Lazy loading | 🟠 P1 | ✅ | 3 | Intersection/idle/eager boundaries; heavy-block detection; SSR-safe |
| Error boundaries | 🟠 P1 | ✅ | 3 | Per-block renderer fallback and document-level error isolation |

### Animations & Interactions

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Scroll animations | 🟠 P1 | ✅ | 3 | Deterministic scroll-trigger runtime with threshold/offset and once-safe defaults |
| Fade in/out | 🟠 P1 | ✅ | 3 | Baseline fade animation contract with configurable timing/easing and reduced-motion fallback |
| Slide in/out | 🟠 P1 | ✅ | 3 | Directional slide animation contract with per-block distance/direction controls and reduced-motion fallback |
| Parallax effects | 🟡 P2 | ✅ | 3 | Deterministic parallax vector runtime with throttle-safe update model |
| Hover effects | 🟡 P2 | ✅ | 3 | Pointer-aware hover runtime with reduced-motion-safe state transitions |
| Click interactions | 🔴 P0 | ✅ | 3 | Typed click action contract with renderer-safe HTML data attributes |
| Form submissions | 🔴 P0 | ✅ | 3 | Interactive form runtime with submission contract and static fallback mode |
| Progress tracking | 🟡 P2 | ✅ | 3 | Scroll-based progress signal runtime with milestone events and bounded update emissions |

### Layout Engine

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Single column | 🔴 P0 | ✅ | 3 | Default layout with deterministic breakpoint metrics and container wrappers |
| Multi-column | 🟡 P2 | ✅ | 3 | Side-by-side blocks via mode-driven multi-column layout contract |
| Grid layout | 🟡 P2 | ✅ | 3 | CSS Grid-based mode with configurable item width, columns, and flow |
| Manga layout | 🟠 P1 | ✅ | 3 | Panel-based layout helpers with manga panel size/alignment options |
| Full-width blocks | 🟠 P1 | ✅ | 3 | Configurable full-width breakout behavior in layout mode contract |
| Sticky elements | 🟡 P2 | ✅ | 3 | Sticky side-region layout behavior with configurable top offset and z-index |
| Custom spacing | 🟡 P2 | ✅ | 3 | Mode-level spacing controls (`blockGap`, `rowGap`, `columnGap`, `outerPadding`) |

### Reader Experience

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Table of contents | 🟠 P1 | ✅ | 3 | Heading-based TOC generation with hierarchical tree + HTML render helpers |
| Reading progress | 🟡 P2 | ✅ | 3 | Reader progress helpers using document-scroll progress calculations |
| Estimated read time | 🟡 P2 | ✅ | 3 | Read-time estimator from block/text content with configurable WPM |
| Bookmarks | 🟡 P2 | ✅ | 3 | Bookmark create/update/restore and persistence helpers |
| Share buttons | 🟡 P2 | ✅ | 3 | Provider-agnostic share action abstraction (native/url/clipboard modes) |
| Print styles | 🟢 P3 | ⬜ | - | Optimized for print |
| Reader mode | 🟢 P3 | ⬜ | - | Distraction-free reading |
| Renderer public API | 🔴 P0 | ✅ | 3 | TypeScript API surface — RendererRegistry, render/renderSSR helpers, PulseRenderer, builtin registration, static output helpers |
| Framework adapters | 🟠 P1 | ✅ | 3 | Next.js, Nuxt, Astro adapters; SSR context; hydration scripts; route rules |

---

## 🧩 Block Types

### Basic Blocks

| Block Type | Priority | Status | Phase | Description |
|------------|----------|--------|-------|-------------|
| Paragraph | 🔴 P0 | ✅ | 1 | Basic text block |
| Heading (H1-H6) | 🔴 P0 | ✅ | 1 | Heading levels |
| List (ordered) | 🔴 P0 | ✅ | 1 | Numbered list |
| List (unordered) | 🔴 P0 | ✅ | 1 | Bullet list |
| Blockquote | 🟠 P1 | ✅ | 1 | Quote block |
| Code block | 🟠 P1 | ✅ | 1 | Syntax-highlighted code |
| Inline code | 🟠 P1 | ✅ | 1 | Inline code formatting |
| Horizontal rule | 🟠 P1 | ✅ | 1 | Divider line |
| Link | 🔴 P0 | ✅ | 1 | Hyperlink |
| Image | 🔴 P0 | ✅ | 1 | Image with caption |
| Video | 🟠 P1 | ✅ | 2 | Video embed |
| Audio | 🟡 P2 | ✅ | 2 | Audio player |
| File | 🟡 P2 | ✅ | 2 | File download |

### Interactive Blocks

| Block Type | Priority | Status | Phase | Description |
|------------|----------|--------|-------|-------------|
| Quiz | 🟠 P1 | ✅ | 2 | Multiple choice quiz |
| Poll | 🟠 P1 | ✅ | 2 | Reader poll with results |
| Survey | 🟡 P2 | ✅ | 2 | Multi-question survey |
| Flashcard | 🟡 P2 | ✅ | 2 | Flip card for learning |
| Accordion | 🟡 P2 | ✅ | 2 | Collapsible content |
| Tabs | 🟡 P2 | ✅ | 2 | Tabbed content |
| Toggle | 🟡 P2 | ✅ | 2 | Show/hide content |
| Spoiler | 🟡 P2 | ✅ | 2 | Hidden content (click to reveal) |
| Countdown | 🟢 P3 | ⬜ | - | Countdown timer |
| Progress bar | 🟢 P3 | ⬜ | - | Visual progress indicator |

### Advanced Blocks

| Block Type | Priority | Status | Phase | Description |
|------------|----------|--------|-------|-------------|
| Table | 🟠 P1 | ✅ | 2 | Data table |
| Chart | 🟡 P2 | ✅ | 2 | Data visualization |
| Map | 🟡 P2 | ✅ | 2 | Interactive map |
| Embed | 🟠 P1 | ✅ | 2 | Generic iframe embed |
| Code playground | 🟡 P2 | ✅ | 3 | Live code editor with sandboxed output iframe and SSR-safe markup |
| Math equation | 🟡 P2 | ✅ | 2 | LaTeX/MathML |
| Diagram | 🟡 P2 | ✅ | 2 | Mermaid/PlantUML |
| Timeline | 🟡 P2 | ✅ | 2 | Event timeline |
| Comparison | 🟡 P2 | ✅ | 2 | Side-by-side comparison |
| Before/After | 🟡 P2 | ✅ | 2 | Image slider |

### Creative Blocks

| Block Type | Priority | Status | Phase | Description |
|------------|----------|--------|-------|-------------|
| Manga panel | 🟠 P1 | ✅ | 2 | Comic/manga layout |
| Speech bubble | 🟡 P2 | ✅ | 2 | Character dialogue |
| Callout | 🟠 P1 | ✅ | 2 | Highlighted note |
| Alert | 🟠 P1 | ✅ | 2 | Warning/info/success box |
| Card | 🟡 P2 | ✅ | 2 | Content card |
| Hero section | 🟡 P2 | ✅ | 2 | Large header section |
| Gallery | 🟡 P2 | ✅ | 2 | Image gallery |
| Carousel | 🟡 P2 | ✅ | 2 | Sliding content |
| Annotated image | 🟡 P2 | ✅ | 2 | Image with hotspots |

### Branching & Conditional

| Block Type | Priority | Status | Phase | Description |
|------------|----------|--------|-------|-------------|
| Branch block | 🟡 P2 | ✅ | 3 | Choose-your-path branching UI with deterministic option/content mapping |
| Conditional block | 🟡 P2 | ✅ | 3 | Rule-based conditional rendering with client/static/SSR evaluation helpers |
| Personalized block | 🟢 P3 | ⬜ | - | Show based on user data |

---

## 🤖 AI Features

### AI Workspace & Briefing

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| AI brief profile | 🟠 P1 | ⬜ | 4 | Topic, audience, tone, objective, constraints |
| Document objective profile | 🟠 P1 | ⬜ | 4 | Explicit outcome and publish target |
| Context pack builder | 🟠 P1 | ⬜ | 4 | Cursor + selection + surrounding blocks context |
| Reference source set | 🟡 P2 | ⬜ | 4 | Attach references before AI generation |
| Constraint & guardrail profile | 🟠 P1 | ⬜ | 4 | Forbidden claims, style and safety limits |
| Prompt templates library | 🟡 P2 | ⬜ | 4 | Reusable instruction templates |
| Task intent classifier | 🟡 P2 | ⬜ | 4 | Classify request type before execution |

### AI Invocation & Assistance

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Inline AI prompt | 🔴 P0 | ⬜ | 4 | Invoke AI while typing (cursor-first flow) |
| Selection-aware actions | 🟠 P1 | ⬜ | 4 | Rewrite/expand/summarize selected text |
| AI command palette | 🟠 P1 | ⬜ | 4 | Unified list of AI actions and tools |
| Streaming responses | 🟠 P1 | ⬜ | 4 | Token-by-token streaming UI |
| Diff preview before apply | 🟠 P1 | ⬜ | 4 | Show changes before writing to document |
| Apply modes | 🟠 P1 | ⬜ | 4 | Replace, append, or insert as new block |
| Text completion | 🟡 P2 | ⬜ | 4 | Smart autocomplete |
| Grammar check | 🟡 P2 | ⬜ | 4 | Detect grammar errors |
| Tone adjustment | 🟡 P2 | ⬜ | 4 | Suggest tone changes |
| Summarization | 🟡 P2 | ⬜ | 4 | Summarize content |
| Translation | 🟢 P3 | ⬜ | - | Translate to other languages |
| Layout suggestions | 🟡 P2 | ⬜ | 4 | Suggest better layouts |
| Block reordering | 🟡 P2 | ⬜ | 4 | AI-suggested block order |
| Accessibility check | 🟡 P2 | ⬜ | 4 | Detect a11y issues |

### AI Studio UI & Catalog Sync

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| AI Studio tabs | 🟠 P1 | ⬜ | 4 | Tabs for Features, Commands, Shortcuts, Actions, Automations |
| Customizable AI Studio tabs | 🟡 P2 | ⬜ | 4 | Add/remove/reorder tabs per workspace |
| Capability catalog auto-sync | 🟠 P1 | ⬜ | 4 | Auto-refresh GUI after AI adds/removes capabilities |
| Command and shortcut catalog sync | 🟠 P1 | ⬜ | 4 | Auto-update command/shortcut lists after AI generation |
| Feature lifecycle manager | 🟡 P2 | ⬜ | 4 | Enable/disable/deprecate generated features safely |

### AI Provider & Model Control Center (GUI)

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Provider selection | 🟠 P1 | ⬜ | 4 | OpenAI, Anthropic, local, custom |
| API key management | 🟠 P1 | ⬜ | 4 | Secure key storage and rotation |
| Model selection | 🟡 P2 | ⬜ | 4 | Choose default model per capability |
| Custom prompts | 🟡 P2 | ⬜ | 4 | Override default prompts |
| Rate limiting | 🟠 P1 | ⬜ | 4 | Prevent API abuse |
| Provider health checks | 🟠 P1 | ⬜ | 4 | Connectivity and quota diagnostics |
| Endpoint configuration | 🟡 P2 | ⬜ | 4 | Self-hosted/provider endpoint settings |
| Text model routing | 🟠 P1 | ⬜ | 4 | Dedicated text generation model profile |
| Image model routing | 🟠 P1 | ⬜ | 4 | Dedicated image generation model profile |
| Fallback chain policies | 🟠 P1 | ⬜ | 4 | Provider/model fallback by capability |
| Cost budget guardrails | 🟠 P1 | ⬜ | 4 | Per-session/per-workspace cost ceilings |
| Latency budget guardrails | 🟡 P2 | ⬜ | 4 | Enforce max response latency policies |

### AI Builder & Tooling

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Generate block from prompt | 🟠 P1 | ⬜ | 4 | Create new block type |
| Generate block code | 🟠 P1 | ⬜ | 4 | TypeScript + integration scaffolding |
| Validate generated code | 🟠 P1 | ⬜ | 4 | Syntax + type checking |
| Test generated block | 🟠 P1 | ⬜ | 4 | Auto-generate tests |
| Register block | 🟠 P1 | ⬜ | 4 | Add to registry |
| Explain block usage | 🟠 P1 | ⬜ | 4 | Generate docs/help copy |
| Generate slash commands | 🟠 P1 | ⬜ | 4 | Add command entries for new features |
| Generate shortcuts | 🟠 P1 | ⬜ | 4 | Add keyboard shortcuts and conflict checks |
| Generate macros | 🟡 P2 | ⬜ | 4 | Add backslash macros |
| Tool registry | 🟠 P1 | ⬜ | 4 | Register callable AI tools |
| Action registry | 🟠 P1 | ⬜ | 4 | Register AI actions surfaced in UI |
| Add custom AI actions | 🟠 P1 | ⬜ | 4 | User-defined AI action definitions |
| AI-generated AI actions | 🟡 P2 | ⬜ | 4 | AI Builder creates new AI actions |
| Approval workflow for AI writes | 🟠 P1 | ⬜ | 4 | Plan/diff/approve before file writes |
| Audit logs for AI actions | 🟠 P1 | ⬜ | 4 | Trace every AI action/tool execution |

### Automation Runtime

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Automation builder | 🟠 P1 | ⬜ | 4 | Trigger/condition/action workflow editor |
| Scheduled automations | 🟡 P2 | ⬜ | 4 | Time-based workflow execution |
| Publish-time automations | 🟠 P1 | ⬜ | 4 | Run workflows before or at publish |
| Silent automations | 🟠 P1 | ⬜ | 4 | Approved background automations |
| Multi-step automation pipelines | 🟠 P1 | ⬜ | 4 | Chained AI tasks with dependencies |
| AI-generated automation recipes | 🟠 P1 | ⬜ | 4 | AI creates new workflow definitions |
| Automation rollback/replay | 🟡 P2 | ⬜ | 4 | Revert/re-run previous automation runs |
| Human-in-the-loop checkpoints | 🟠 P1 | ⬜ | 4 | Optional approval gates inside workflows |

### AI Media Intelligence

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Image generation | 🟠 P1 | ⬜ | 4 | Generate images from prompts |
| Image prompt assistant | 🟡 P2 | ⬜ | 4 | Improve prompts before image generation |
| Auto alt-text generation | 🟠 P1 | ⬜ | 4 | Accessibility metadata for media |
| Caption suggestions | 🟡 P2 | ⬜ | 4 | Generate context-aware captions |
| Style-consistent media suggestions | 🟡 P2 | ⬜ | 4 | Align media style with article theme |

### AI Safety & Governance

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Prompt injection protection | 🟠 P1 | ⬜ | 4 | Detect and block unsafe prompt payloads |
| PII redaction controls | 🟠 P1 | ⬜ | 4 | Optional redaction before provider calls |
| Confidence scoring | 🟡 P2 | ⬜ | 4 | Confidence estimates for AI outputs |
| Hallucination risk flags | 🟡 P2 | ⬜ | 4 | Flag potentially unreliable outputs |
| Policy guardrails | 🟠 P1 | ⬜ | 4 | Enforce allowed/blocked AI behavior |
| Sandboxed tool execution | 🟠 P1 | ⬜ | 4 | Restrict tool scope and capabilities |

---

## 🔎 SEO & Growth Intelligence

### SEO Planning & Research

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| SEO brief generator | 🟠 P1 | ⬜ | 5 | Generate keyword and intent brief for article |
| Keyword discovery | 🟠 P1 | ⬜ | 5 | Suggest primary/secondary keywords |
| Search intent clustering | 🟠 P1 | ⬜ | 5 | Map keywords to intent clusters |
| Topic cluster planner | 🟡 P2 | ⬜ | 5 | Build related topic maps and content hubs |
| Competitor gap hints | 🟡 P2 | ⬜ | 5 | Suggest missing angles vs competitor topics |

### On-Page Optimization

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Title optimizer | 🟠 P1 | ⬜ | 5 | Improve SERP-facing title options |
| Meta description optimizer | 🟠 P1 | ⬜ | 5 | Generate optimized meta descriptions |
| Slug optimizer | 🟡 P2 | ⬜ | 5 | Suggest clean and keyword-aware slugs |
| Heading structure optimizer | 🟠 P1 | ⬜ | 5 | Improve heading hierarchy and scanability |
| Internal linking suggestions | 🟠 P1 | ⬜ | 5 | Suggest links to relevant existing content |
| External source suggestions | 🟡 P2 | ⬜ | 5 | Suggest credible external references |
| Content analysis | 🟠 P1 | ⬜ | 5 | Analyze readability, clarity, and SEO fitness |
| Readability scoring | 🟡 P2 | ⬜ | 5 | Grade readability by audience profile |
| FAQ snippet generator | 🟡 P2 | ⬜ | 5 | Generate FAQ blocks for rich results |
| Schema markup assistant | 🟠 P1 | ⬜ | 5 | Suggest structured data markup hints |

### Media SEO & Image Optimization

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Image format policy | 🟠 P1 | ⬜ | 5 | AVIF/WebP/JPEG strategy by context |
| Image compression policy | 🟠 P1 | ⬜ | 5 | Quality targets and compression guardrails |
| Responsive image profile | 🟠 P1 | ⬜ | 5 | `srcset` and `sizes` guidance for layouts |
| Lazy vs prioritized image loading | 🟡 P2 | ⬜ | 5 | Control LCP-critical vs deferred images |
| Image filename optimizer | 🟡 P2 | ⬜ | 5 | SEO-friendly and meaningful media names |
| Alt-text quality score | 🟠 P1 | ⬜ | 5 | Score usefulness and specificity of alt text |
| Alt-text rewrite suggestions | 🟠 P1 | ⬜ | 5 | Improve weak/duplicate alt text |
| Caption and figure templates | 🟡 P2 | ⬜ | 5 | Structured caption/figure authoring patterns |
| Media attribution metadata | 🟡 P2 | ⬜ | 5 | Track source/license/credit for media |
| Image schema suggestions | 🟠 P1 | ⬜ | 5 | Suggest `ImageObject` schema fields |

### Semantic SEO & Schema Intelligence

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Entity extraction | 🟠 P1 | ⬜ | 5 | Extract key entities from content |
| Entity coverage score | 🟡 P2 | ⬜ | 5 | Score semantic coverage of target entities |
| Intent consistency auditor | 🟠 P1 | ⬜ | 5 | Detect mismatch between intent and copy |
| Semantic gap detector | 🟠 P1 | ⬜ | 5 | Identify missing semantic subtopics |
| Topical authority signal | 🟡 P2 | ⬜ | 5 | Measure cluster-level topical depth |
| Structured data validator | 🟠 P1 | ⬜ | 5 | Validate generated schema against rules |
| Rich-result eligibility checks | 🟠 P1 | ⬜ | 5 | Estimate eligibility for rich snippets |
| Canonical tag assistant | 🟡 P2 | ⬜ | 5 | Suggest canonical strategy and conflict fixes |
| Breadcrumb schema assistant | 🟡 P2 | ⬜ | 5 | Suggest breadcrumb and hierarchy markup |

### SEO Automation & Publishing

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Pre-publish SEO checklist | 🟠 P1 | ⬜ | 5 | Validate SEO readiness before publish |
| SEO quality score | 🟠 P1 | ⬜ | 5 | Weighted score for search readiness |
| Cannibalization detector | 🟡 P2 | ⬜ | 5 | Detect overlap with existing articles |
| Content freshness monitor | 🟡 P2 | ⬜ | 5 | Flag stale content for refresh |
| Social snippet generation | 🟡 P2 | ⬜ | 5 | Generate social share text variants |
| Programmatic SEO automation recipes | 🟡 P2 | ⬜ | 5 | AI automation templates for SEO workflows |
| CTR headline experiments | 🟡 P2 | ⬜ | 5 | Generate headline variants for CTR testing |

---

## 🔧 Developer Features

### API & SDK

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| TypeScript types | 🔴 P0 | ✅ | 1 | Full type definitions |
| JSDoc comments | 🟠 P1 | ⬜ | 6 | API documentation |
| React adapter | 🔴 P0 | ✅ | 2 | React components |
| Vue adapter | 🟡 P2 | ⬜ | 6 | Vue components |
| Svelte adapter | 🟡 P2 | ⬜ | 6 | Svelte components |
| Vanilla JS API | 🟠 P1 | ✅ | 1 | Framework-agnostic |
| Headless mode | 🟡 P2 | ⬜ | 6 | No UI, just logic |

### Developer Tools

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Dev playground | 🟠 P1 | ✅ | 2 | Test environment |
| Manual lab server | 🟠 P1 | ✅ | 2 | Local verification harness with CKEditor-like WYSIWYG simple mode (`/`) and advanced diagnostics mode (`/advanced`) |
| Block inspector | 🟡 P2 | ✅ | 2 | Debug block data |
| Event logger | 🟡 P2 | ✅ | 2 | View all events |
| Performance profiler | 🟢 P3 | ⬜ | - | Measure performance |
| CLI tool | 🟡 P2 | ⬜ | 6 | Generate blocks, plugins |

### Documentation

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Getting started guide | 🔴 P0 | ⬜ | 6 | Quick start tutorial |
| API reference | 🔴 P0 | ⬜ | 6 | Complete API docs |
| Block development guide | 🟠 P1 | ⬜ | 6 | How to create blocks |
| Plugin development guide | 🟠 P1 | ⬜ | 6 | How to create plugins |
| Examples repository | 🟠 P1 | ⬜ | 6 | Code examples |
| Video tutorials | 🟢 P3 | ⬜ | - | Screencasts |
| Interactive docs | 🟢 P3 | ⬜ | - | Try Pulse in docs |

---

## 📦 Distribution & Deployment

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| NPM packages | 🔴 P0 | ⬜ | 6 | Publish to npm |
| CDN distribution | 🟡 P2 | ⬜ | 6 | Unpkg/jsDelivr |
| GitHub releases | 🟠 P1 | ⬜ | 6 | Versioned releases |
| Changelog | 🟠 P1 | ⬜ | 6 | Track changes |
| Migration guides | 🟠 P1 | ⬜ | 6 | Version upgrade guides |
| Semantic versioning | 🔴 P0 | ⬜ | 6 | Follow semver |

---

## 🎨 Theming & Customization

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| CSS variables | 🟠 P1 | ✅ | 3 | Customizable colors via CSS custom properties |
| Theme system | 🟡 P2 | ✅ | 3 | Pre-built themes (light, dark, minimal) |
| Custom CSS | 🟠 P1 | ✅ | 3 | Per-site style overrides |
| Font customization | 🟡 P2 | ✅ | 3 | Custom font support |
| Spacing system | 🟡 P2 | ✅ | 3 | Configurable block spacing tokens |

---

## 🔐 Security & Privacy

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| XSS protection | 🔴 P0 | ✅ | 1 | Sanitize user input |
| CSP support | 🟠 P1 | ⬜ | 4 | Content Security Policy |
| CORS handling | 🟠 P1 | ✅ | 3 | Cross-origin policy helpers (allowlist/headers/preflight/sanitization/proxy helpers) |
| API key encryption | 🟠 P1 | ✅ | 3 | Secure API key encryption/decryption and metadata/rotation utilities |
| Plugin sandboxing | 🟡 P2 | ⬜ | 6 | Isolate plugin code |
| Data validation | 🔴 P0 | ✅ | 1 | Validate all inputs |

---

## 📊 Analytics & Monitoring

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Usage analytics | 🟢 P3 | ⬜ | - | Track feature usage |
| Error tracking | 🟠 P1 | ⬜ | 6 | Capture errors |
| Performance monitoring | 🟡 P2 | ⬜ | 6 | Track performance |
| Custom events | 🟡 P2 | ⬜ | 4 | User-defined analytics |

---

## 🌍 Internationalization

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| i18n support | 🟡 P2 | ⬜ | 6 | Multi-language UI |
| RTL support | 🟡 P2 | ⬜ | 6 | Right-to-left languages |
| Bidirectional typing (RTL/LTR mixed) | 🟠 P1 | ✅ | 2 | Mixed Persian/English typing in editor inputs |
| Date/time formatting | 🟡 P2 | ⬜ | 6 | Locale-aware formatting |
| Number formatting | 🟡 P2 | ⬜ | 6 | Locale-aware numbers |

---

## 🧪 Testing & Quality

| Feature | Priority | Status | Phase | Description |
|---------|----------|--------|-------|-------------|
| Unit tests | 🔴 P0 | 🟦 | All | Test all modules |
| Integration tests | 🟠 P1 | 🟦 | All | Test module interactions |
| E2E tests | 🟠 P1 | 🟦 | 6 | Test user workflows |
| Visual regression | 🟡 P2 | ⬜ | 6 | Catch UI changes |
| Performance tests | 🟡 P2 | ⬜ | 6 | Benchmark performance |
| Accessibility tests | 🟠 P1 | ✅ | 2 | Automated a11y checks |

---

## 📈 Feature Summary by Phase

| Phase | P0 Features | P1 Features | P2 Features | P3 Features | Total |
|-------|-------------|-------------|-------------|-------------|-------|
| Phase 1 | 19 | 11 | 0 | 0 | 30 |
| Phase 2 | 10 | 32 | 40 | 0 | 82 |
| Phase 3 | 6 | 16 | 20 | 0 | 42 |
| PM4 Migration Gate | 0 | 13 | 16 | 0 | 29 |
| Phase 4 | 1 | 46 | 26 | 0 | 73 |
| Phase 5 | 0 | 22 | 19 | 0 | 41 |
| Phase 6 | 4 | 9 | 16 | 1 | 30 |
| **Total (Phases 1-6 + PM4)** | **40** | **156** | **137** | **1** | **334** |

---

## 🎯 MVP Feature Set (Phase 1)

The absolute minimum for a working product:

**Core:**
- Block registry, validation, serialization
- Event system
- Basic editor state

**Editor:**
- Text editing with rich formatting
- Undo/redo
- Slash commands (basic)
- Keyboard shortcuts (basic)
- Drag and drop
- Autosave

**Blocks:**
- Paragraph, Heading, List, Blockquote, Code, Image, Link

**Renderer:**
- Block rendering
- Responsive layout
- Click interactions

**Developer:**
- TypeScript types
- React adapter
- Basic documentation

---

## 📝 Notes

- این لیست زنده است و با پیشرفت پروژه آپدیت می‌شود
- فیچرهای جدید با توافق تیم اضافه می‌شوند
- اولویت‌ها ممکن است بر اساس فیدبک کاربران تغییر کنند
- هر فیچر باید قبل از completed شدن، تست و مستند شود
- Phase alignment sync (2026-04-01): editor interaction/UI items were moved to Phase 2, while implemented plugin infrastructure was moved to Phase 1.
- Phase 1 gap-closure items (`Nested blocks`, `Block cloning`, `Event logging`, remaining basic blocks, `XSS protection` hardening) are now explicitly tracked in `backlog/BACKLOG.md` Session 11-12.
- Session 11-12 progress (2026-04-01): block-level JSON import/export API is complete and initial core integration tests are now in place.
- Session 11-12 progress (2026-04-01): remaining Phase 1 basic blocks (`Blockquote`, `HorizontalRule`, `Link`) and XSS boundary tests are now complete.
- Session 11-12 progress (2026-04-01): local-only Playwright E2E scenarios are added and currently run in skip-safe mode when cached browser runtime is unavailable.
- Session 11-12 progress (2026-04-01): nested block tree support and subtree cloning utilities are now implemented in `@pulse/core`.
- Session 11-12 progress (2026-04-01): event logging middleware and dirty-state tracking workflow/selectors are now implemented.
- Session 11-12 closure (2026-04-01): coverage target is now met at 96.31% statements/lines (94.04% branches) with `npm run ci:local` fully passing and E2E remaining skip-safe under runtime constraints.
- Phase transition (2026-04-01): Phase 1 is formally closed and Phase 2 planning is now expanded in `phases/PHASE_02_EDITOR.md`; implementation starts from Session 1-2 editor shell work.
- Session 1-2 progress (2026-04-02): `@pulse/editor` package scaffold, state adapter wiring (`DocumentState` + `SelectionState`), focused block shell rendering, and initial editor tests are now complete.
- Session 1-2 progress (2026-04-02): local playground fixture integration for editor shell validation is now in progress via `apps/playground/editor-shell-playground.ts`.
- Session 3-4 progress (2026-04-02): command registry primitives, slash trigger parsing, fuzzy search, category grouping, keyboard navigation, and seeded recent-command ordering are implemented in `@pulse/editor`.
- Session 5-6 progress (2026-04-02): shortcut registry with platform `mod` mapping, default shortcut set, conflict detection, formatting command actions, and floating toolbar selection binding are implemented in `@pulse/editor`.
- Session 7-8 progress (2026-04-02): block/selection context menus, block action menu with hover/drag state, drag/drop reorder controller, and multi-select batch operations are implemented in `@pulse/editor`.
- Documentation governance update (2026-04-02): roadmap numbering is now aligned as Phase 3 Renderer and Phase 4 AI to match phase files and active backlog planning.
- Session 11-12 progress (2026-04-02): extended authoring blocks (`video`, `audio`, `file`, `table`, `embed`, `callout`, `alert`) are now implemented in `@pulse/blocks` with schema/edit helpers, slash command entries, shortcut bindings, playground wiring, and integration tests.
- Session 13-14 progress (2026-04-02): interactive/creative authoring blocks (`quiz`, `poll`, `survey`, `manga-panel`, `speech-bubble`, `card`, `gallery`, `carousel`) are now implemented with schema helpers, editor command/shortcut insertion paths, playground wiring, and dedicated tests.
- Session 15-16 progress (2026-04-02): nested command submenus (`menuPath` + palette navigation), playground dev tooling surfaces (`BlockInspector`, `EventLoggerPanel` with filters), and accessibility baseline semantics/tests are now implemented in `@pulse/editor`.
- Session 23 progress (2026-04-02): slash + backslash live suggestion flows now support Enter-as-final-confirm and Tab-as-preliminary-confirm path expansion for nested commands; Persian aliases are now validated in command palette tests for both trigger types.
- Session 24 progress (2026-04-02): bidirectional-safe command input normalization and acceptance tests now cover mixed Persian/English plus directional marks for slash/backslash command parsing/search flows.
- Phase strategy update (2026-04-04): Phase 4 is now AI Builder + automations, Phase 5 is SEO intelligence, and Phase 6 is production hardening/release.
- SEO expansion update (2026-04-04): Phase 5 now includes media SEO/image optimization controls plus semantic SEO and schema intelligence workflows.
- Pre-migration planning update (2026-04-02): all remaining non-complete Phase 1/2 items are now consolidated into `backlog/BACKLOG.md` and governed by `phases/PHASE_PRE_MIGRATION_03.md` before Phase 3 kickoff.
- Pre-migration PM-1/PM-2 update (2026-04-02): traceability baseline and command/macro acceptance criteria are documented in `docs/pre-migration/PHASE12_TRACEABILITY.md` and `docs/pre-migration/PM2_COMMAND_MACRO_ACCEPTANCE.md`.
- Session 25 progress (2026-04-02): added `apps/manual-lab` interactive test server with a custom minimal UI that exercises current editor capabilities (commands, shortcuts, menus, DnD, clipboard/save, inspector, event logger) in one local browser surface.
- Session 32 progress (2026-04-03): rebuilt `apps/manual-lab` simple route into a CKEditor-like contenteditable editor surface with hover block controls, floating selection formatting toolbar, and nested slash/backslash suggestion flow where `Tab` keeps the command chain open and `Enter` performs final execution; bidi safety was reinforced with `dir="auto"` + `unicode-bidi: plaintext` defaults in both manual-lab UI and core editor root/block rendering.
- PM-6 closure (2026-04-02): wave A blocks (`video`, `audio`, `file`, `table`, `embed`, `quiz`, `poll`, `survey`) validated complete with schema validation, serialize/deserialize parity, editor command/shortcut insertion, and passing tests in `packages/blocks/tests/blocks.test.ts` and `packages/editor/tests/extended-blocks.test.ts` / `interactive-creative-blocks.test.ts`. All 8 wave A feature rows promoted to ✅.
- PM-7 closure (2026-04-02): wave B blocks (`manga-panel`, `speech-bubble`, `callout`, `alert`, `card`, `gallery`, `carousel`) and `Bidirectional typing (RTL/LTR mixed)` are validated complete with block schemas/helpers, command + shortcut insertion flow, and mixed-direction trigger parsing coverage in `packages/editor/tests/command-system.test.ts`.
- PM-8 closure (2026-04-02): implemented and integrated the remaining Phase 2 expansion blocks (`flashcard`, `accordion`, `tabs`, `toggle`, `spoiler`, `chart`, `map`, `math-equation`, `diagram`, `timeline`, `comparison`, `before-after`, `hero-section`, `annotated-image`) with schema/render/serialize support plus slash/backslash command and shortcut insertion coverage.
- PM-9 closure (2026-04-02): completed `Block templates`, `Block search`, `State snapshots`, and `Accessibility tests` with new editor state modules (`BlockTemplates`, `blockSearch`, `StateSnapshots`), regression tests, and quality-gate evidence.
- Renderer style governance update (2026-04-05): introduced `docs/renderer/STYLING_GUIDE.md` as the living CSS/theme contract for Phase 3+ styling sessions.
- R3-5 layout expansion update (2026-04-05): added layout mode contracts for multi-column/grid/full-width/sticky plus manga layout helpers and spacing controls.
- R3-6 interaction/runtime update (2026-04-05): added click action runtime, interactive form submission contract, and renderer error-boundary fallback helpers with regression coverage.
- R3-7 animation baseline update (2026-04-05): added animation registry/config API, fade+slide contracts, scroll-trigger runtime helpers, and reduced-motion-safe baseline behaviors.
- R3-8 advanced interaction update (2026-04-05): added hover runtime, parallax runtime, progress signal tracking, and advanced interaction/performance regression coverage.
- R3-9 reader experience update (2026-04-05): added TOC generation, read-time/progress helpers, bookmark model/store, share action abstraction, and reader regression coverage.
- R3-14 framework/lazy update (2026-04-06): added Next.js/Nuxt/Astro adapter helpers and lazy boundary runtime for heavy renderer blocks with adapter integration tests.
- R3-15 advanced/security update (2026-04-06): added code playground/branch/conditional renderer support plus CORS and API-key encryption utility modules with dedicated regression coverage.
- R3-16 phase sign-off update (2026-04-06): closed all remaining Phase 3 feature rows and completed renderer stabilization quality gates.
- PM4 migration update (2026-04-06): added editor parity + CMS baseline feature rows and moved `Custom commands`/`Custom macros` to PM4 execution scope.
- PM4-7 closure (2026-04-07): completed CMS Workflow & Governance — workflow engine, approval checkpoints, scheduling system, and role/permission matrix now implemented with 46 passing tests.
- PM4-8 closure (2026-04-07): completed CMS Media + SEO Ops Baseline — media library with folders/metadata, SEO entry metadata integration, and workflow guards for accessibility and SEO quality with 51 passing tests.
- PM4-11 closure (2026-04-10): completed the website/blog dogfooding stack — local studio authoring, reader preview, hydrated published feed, and lifecycle regression coverage are now operational.
- PM4-12 closure (2026-04-10): completed PM4 sign-off, documented accepted PM4 deferrals with rationale, hardened website studio storage recovery, and published the formal Phase 4 AI kickoff checklist.

---

**Last Updated:** 2026-05-16  
**Total Features:** 348  
**Completed:** 181  
**In Progress:** 0  
**Blocked:** 0

---

## 🚀 Launch Readiness Gate

A dedicated pre-launch validation phase (`phases/PHASE_LAUNCH_READINESS.md`) was executed
between PM4 and Phase 4. This gate did not add new feature rows; its purpose was to manually
verify every implemented block, editor surface, renderer path, CMS workflow, and website flow;
run security and performance audits; collect structured user feedback; and close all
launch-blocking bugs before Phase 4 (AI) begins.

**Launch Gate Sessions:** L-1 (test strategy) through L-14 (launch sign-off).
**Status:** ✅ **COMPLETE** — All exit criteria passed. User approved launch readiness on 2026-05-16.
**Phase 4 AI is now unblocked.** See `docs/launch/LAUNCH_SIGNOFF.md` for formal evidence.
