import type { DocSection } from './site-content';

/**
 * Detailed documentation sections for every docs leaf page.
 * Keyed by slug path ("api/core" → slug ['api','core']). Merged into DocLeaf
 * at read time in site-content.ts. Content is written against the real
 * codebase — file names, env vars, schemas and commands below are accurate.
 */
export const docSections: Record<string, DocSection[]> = {
  quickstart: [
    {
      heading: 'Run the demo in two minutes',
      paragraphs: [
        'The fastest way to understand Pulse is the live demo editor at /demo. It runs the real Studio with local-only storage: type / to open the block menu, add a poll or a quiz, and watch the live preview render the exact markup readers will load. No account, no setup — the demo is the product surface.',
      ],
    },
    {
      heading: 'Install the packages',
      paragraphs: [
        'Pulse is a monorepo of focused packages. Install only the surface you need: @pulse/blocks for block definitions (schemas + renderers + editors), @pulse/core for the registry and shared contracts, @pulse/editor for Studio behaviors, @pulse/renderer for display, and @pulse/react for React bindings.',
      ],
      code: {
        language: 'bash',
        code: 'npm install @pulse/blocks @pulse/core\n# add @pulse/renderer when you are ready to display content',
        caption: 'Install the minimal surface first; add packages as you grow.',
      },
    },
    {
      heading: 'Your first block',
      paragraphs: [
        'A block is data plus a definition. The smallest useful experiment: take a callout payload, validate it against its schema, then render it.',
      ],
      code: {
        language: 'typescript',
        code: 'import { CalloutBlock } from "@pulse/blocks";\n\nconst data = CalloutBlock.dataSchema.parse({\n  variant: "tip",\n  title: "Hello",\n  body: "My first validated block.",\n});\nconst html = CalloutBlock.render(data);',
        caption: 'Validate first, render second. The parse call is the guardrail.',
      },
    },
    {
      heading: 'Where to go next',
      list: [
        'Blocks — the block-first mental model and the three-part contract.',
        'Block Schema — how to define your own block data shape.',
        'SSR & Static Rendering — what to know before shipping to a constrained builder.',
        'The live reference article (/blog/pulse-block-reference) shows every block rendered.',
      ],
    },
  ],

  installation: [
    {
      heading: 'Package surfaces',
      paragraphs: [
        'Each Pulse package answers one question. @pulse/blocks: what block types exist and how they validate. @pulse/core: how blocks are registered and resolved. @pulse/editor: how authors produce block data. @pulse/renderer: how block data becomes markup. @pulse/react: how all of that binds into React apps.',
      ],
      list: [
        'Building a reading surface? You need @pulse/blocks and @pulse/renderer.',
        'Building an authoring tool? Add @pulse/editor and @pulse/react.',
        'Building a full CMS? The apps/website app in the monorepo is the complete reference implementation.',
      ],
    },
    {
      heading: 'Monorepo layout',
      code: {
        language: 'text',
        code: 'pulse/\n  packages/\n    blocks/     # block definitions (schema + renderer + editor)\n    core/       # registry, shared types, contracts\n    editor/     # Studio behaviors\n    renderer/   # display renderers\n    react/      # React bindings\n  apps/\n    website/    # full Next.js CMS (auth, media, publish API, blog)',
        caption: 'npm workspaces wire the packages; the website app consumes them via file: deps.',
      },
    },
    {
      heading: 'Requirements',
      list: [
        'Node 20+ and npm workspaces.',
        'Strict TypeScript — public APIs are typed and the build type-checks them.',
        'For the full CMS: SQLite (zero setup) or PostgreSQL via the alternate Prisma schema.',
      ],
    },
  ],

  configuration: [
    {
      heading: 'Runtime environment variables',
      paragraphs: [
        'The website app is configured entirely through environment variables. Secrets are read at runtime and never baked into the image; a few NEXT_PUBLIC_* values are baked at build time by definition.',
      ],
      code: {
        language: 'bash',
        code: 'DATABASE_URL="file:/app/data/pulse.db"      # SQLite on a persistent disk\nSTORAGE_TYPE="local"\nSTORAGE_LOCAL_PATH="/app/data/uploads"\nJWT_SECRET="<64 hex chars>"\nJWT_REFRESH_SECRET="<64 hex chars>"\nADMIN_EMAIL="admin@example.com"\nADMIN_PASSWORD="<strong password>"\nCONTENT_API_TOKEN="<token for the publish API>"',
        caption: 'All runtime envs. The seed creates the first admin from ADMIN_*.',
      },
    },
    {
      heading: 'Build-time variables',
      paragraphs: [
        'NEXT_PUBLIC_SITE_URL must be set at build time — it drives canonical URLs, OpenGraph tags and the sitemap. The Dockerfile fails loudly when it is missing; a wrong value silently pointing every canonical at the wrong domain was a real bug we shipped once, hence the guard.',
      ],
    },
    {
      heading: 'Registry and theme configuration',
      paragraphs: [
        'Register only the block types you ship (see Plugins), and drive visual identity through CSS tokens (--pulse-red, --neutral-*, typography) rather than component overrides. Token-first theming keeps editor and renderer in sync.',
      ],
    },
  ],

  blocks: [
    {
      heading: 'The three-part contract',
      paragraphs: [
        'Every block type is one definition with three responsibilities. The schema (zod) decides what data is valid. The renderer turns valid data into markup. The editor produces that data in the Studio. Because they share one definition, they cannot drift: an editor cannot emit data the renderer cannot render.',
      ],
      code: {
        language: 'typescript',
        code: 'export const calloutBlockDataSchema = z.object({\n  variant: z.enum(["info", "tip", "warning", "success", "note"]),\n  title: z.string().optional(),\n  body: z.string(),\n});',
        caption: 'The complete data contract of the callout block.',
      },
    },
    {
      heading: 'Why blocks instead of blobs',
      paragraphs: [
        'A blob of HTML cannot be validated, searched, or safely regenerated. A list of typed blocks can. Articles in Pulse are arrays — ordered, typed, versionable. That single decision enables validation at publish time, redesigns without migrations, and machine-generated content that cannot be malformed.',
      ],
    },
    {
      heading: 'The built-in families',
      list: [
        'Writing: text, heading, list, blockquote, link, spoiler, toggle, horizontal-rule.',
        'Media: image, gallery, carousel, video, audio, before-after, annotated-image, manga-panel, file, embed, map.',
        'Data: table, chart, comparison, code, code-sandbox, diagram, math-equation, auto-solve-equation, stepped-equation.',
        'Engagement: poll, quiz, survey, flashcard, branches, speech-bubble.',
        'Layout: callout, alert, accordion, tabs, timeline, card, hero-section.',
      ],
    },
    {
      heading: 'See them all live',
      paragraphs: [
        'The article "The Complete Pulse Block Reference" (/blog/pulse-block-reference) renders every single block type on one page with a one-paragraph explanation each. It doubles as the visual test suite for the renderer.',
      ],
    },
  ],

  state: [
    {
      heading: 'Document state is a snapshot',
      paragraphs: [
        'The Studio keeps the article as a serializable snapshot: an ordered array of block objects with ids and timestamps. Autosave writes that snapshot to localStorage continuously, so closing a tab never loses a draft. The demo editor uses exactly the same snapshot pipeline as the authenticated Studio.',
      ],
    },
    {
      heading: 'Rules we enforce',
      list: [
        'Mutations are explicit operations on the snapshot — no hidden UI state leaks into the document.',
        'Every block carries createdAt/updatedAt so history and review tooling can reason about change.',
        'Restore paths validate the snapshot against current schemas before hydrating the editor.',
      ],
    },
    {
      heading: 'Server truth',
      paragraphs: [
        'Locally the snapshot is a draft convenience; the database entry is the source of truth. Publishing writes validated blocks to the entry and busts the page caches, so what readers see always matches the last validated state.',
      ],
    },
  ],

  events: [
    {
      heading: 'Auditable actions',
      paragraphs: [
        'Meaningful actions are recorded through logAudit: logins, uploads, publishes, permission changes. Audit rows carry the actor, the resource and the request id, so "who changed what when" is always answerable from the database.',
      ],
    },
    {
      heading: 'Reader-side signals',
      paragraphs: [
        'Poll votes and survey submissions are first-class write APIs with optimistic UI: the interface updates immediately, then reconciles with the server, reverting on error. A per-browser voter id prevents casual double voting without accounts or cookies.',
      ],
      list: [
        'POST /api/polls/vote — one vote per poll per voter (single-choice) or toggles (multi-choice).',
        'GET /api/polls/votes — counts plus the caller’s own votes for rehydration.',
        'POST /api/surveys/submit — validated answers per question type.',
      ],
    },
    {
      heading: 'Hydration lifecycle',
      paragraphs: [
        'Article pages hydrate interactive blocks after SSR through per-family hydrators (hydrateTabs, hydrateBranches, hydrateFlashcards, …). A MutationObserver re-runs them if React rewrites the content DOM, so interactivity survives reconciliation passes.',
      ],
    },
  ],

  plugins: [
    {
      heading: 'Registering a block pack',
      paragraphs: [
        'New block types join the system through the registry. registerDefinitions takes an array of block definitions and returns the registered set — core converts each definition into the shared internal shape, so a custom block is indistinguishable from a built-in one.',
      ],
      code: {
        language: 'typescript',
        code: 'import { BUILTIN_BLOCK_DEFINITIONS, registerDefinitions } from "@pulse/blocks";\nimport { MyCustomBlock } from "./MyCustomBlock";\n\nregisterDefinitions([...BUILTIN_BLOCK_DEFINITIONS, MyCustomBlock]);',
        caption: 'One registration teaches the validator, the renderer and the editor at once.',
      },
    },
    {
      heading: 'Plugin rules',
      list: [
        'A block definition must include a zod schema — unvalidated content is not allowed into the system.',
        'Renderers must be deterministic and SSR-safe (no browser-only APIs at render time).',
        'Keep plugin surfaces low-coupling: consume the registry, never patch core files.',
      ],
    },
    {
      heading: 'Known gap',
      paragraphs: [
        'The reference block ships its definition file but is not yet registered in BUILTIN_BLOCK_DEFINITIONS — registering it is a one-line change, and it is the template example for adding a block to the pack.',
      ],
    },
  ],

  'api/core': [
    {
      heading: 'What lives in @pulse/core',
      paragraphs: [
        'Core is the shared spine: the BlockRegistry, the base block types and contracts, and the schema primitives other packages build on. It deliberately knows nothing about React or the DOM.',
      ],
      list: [
        'BlockRegistry — map from type string to definition, with lookup used by renderer, editor and validator alike.',
        'blockSchema / types — the canonical BlockDefinition shape every package speaks.',
        'No side effects at import: core is safe to consume in SSR, workers and tests.',
      ],
    },
    {
      heading: 'Stability contract',
      paragraphs: [
        'Public exports from core are the API boundary other packages depend on. Changes are additive; renames and removals go through deprecation first. Tests cover behavior of the registry (duplicate registration, unknown type lookup), not just types.',
      ],
    },
  ],

  'api/editor': [
    {
      heading: 'What lives in @pulse/editor',
      paragraphs: [
        'Editor behaviors that produce valid block data: slash-command flows, per-block editing surfaces, and the bridges between raw user input and schema-shaped output. The Studio UI in apps/website composes these behaviors.',
      ],
    },
    {
      heading: 'Conventions',
      list: [
        'Commands are named consistently between keyboard flows and UI buttons.',
        'Every primary action has at least two access paths (keyboard and pointer).',
        'Editor output always passes through the block schema before it becomes document state.',
      ],
    },
  ],

  'api/renderer': [
    {
      heading: 'What lives in @pulse/renderer',
      paragraphs: [
        'Display renderers and the hydration layer. Renderers emit static markup with stable class names and data-block-type attributes; hydrators (hydrateTabs, hydrateBeforeAfter, …) attach behavior after SSR. Splitting render from hydrate keeps the reader page fast and the interactive layer lazy.',
      ],
      code: {
        language: 'typescript',
        code: '// render (SSR): pure data → markup\n<section data-block-type="timeline">…</section>\n\n// hydrate (client): markup → behavior\nhydrateTimelines(articleElement);',
        caption: 'Two phases, one block. Render first, behavior second.',
      },
    },
    {
      heading: 'Styling contract',
      paragraphs: [
        'Renderers consume CSS tokens and never hardcode brand values. A theme change is a token change; no renderer code moves.',
      ],
    },
  ],

  'api/react': [
    {
      heading: 'Bindings, not brains',
      paragraphs: [
        '@pulse/react exposes hooks and components that wrap the editor and renderer for React consumers. The website app shows the pattern: server components fetch and adapt entries (entry-adapter), client components hydrate interactivity (BlogPostContent), and hooks like useBackendBlogEntry bridge the two.',
      ],
      list: [
        'Server/client boundaries are explicit — data fetching on the server, behavior on the client.',
        'Components are composable and tree-shakeable.',
        'Nothing in the React layer re-implements validation; it consumes the packages.',
      ],
    },
  ],

  cli: [
    {
      heading: 'Everyday commands',
      code: {
        language: 'bash',
        code: 'npm run build        # compile packages (tsc + dist fixups)\nnpm run typecheck    # strict type check across the monorepo\nnpm run lint         # eslint\nnpm run test         # vitest with coverage\nnpm run test:e2e     # playwright end-to-end\nnpm run docs:check   # docs/backlog consistency gate\nnpm run ci:local     # all of the above, in order',
        caption: 'The local CI gate is the pre-push habit.',
      },
    },
    {
      heading: 'Website scripts',
      paragraphs: [
        'apps/website adds its own layer: next build/start, prisma migrate deploy, prisma db seed (idempotent roles + first admin), and the article publishing flow through the publish API. The Dockerfile runs migrate + seed at every boot, so a fresh container is immediately usable.',
      ],
    },
  ],

  dev: [
    {
      heading: 'Monorepo conventions',
      list: [
        'Small slices: change one behavior, ship one commit, keep tests close to the change.',
        'AGENTS.md files carry per-package conventions — read them before editing a package.',
        'Docs and backlog move with the code; the docs:check gate fails when they drift.',
      ],
    },
    {
      heading: 'Git and deploy',
      paragraphs: [
        'The repository mirrors between GitHub (source of collaboration) and Hamgit (deploy source). Pushes to main auto-deploy through the platform builder; builds are serialized and resource-guarded for constrained builders.',
      ],
    },
  ],

  testing: [
    {
      heading: 'Layers',
      list: [
        'Unit: block schemas and mutations (packages/blocks, vitest).',
        'Integration: registry behavior and package boundaries (packages/core).',
        'E2E: real user flows through the website (playwright).',
        'Live verification: the block reference article doubles as a visual regression surface — every block rendered, on one page, in production.',
      ],
    },
    {
      heading: 'Rules',
      list: [
        'No internet-dependent fixtures when a local target exists.',
        'A failing schema test means the contract changed — update docs in the same commit.',
        'New block type? Ship its schema tests with it.',
      ],
    },
  ],

  'block-schema': [
    {
      heading: 'Anatomy of a schema',
      paragraphs: [
        'Block schemas are strict zod objects. Strict means unknown keys are rejected — typos in payloads fail loudly instead of being silently dropped. Some blocks go further with superRefine: the quiz schema refuses a quiz with no correct option, so a broken quiz is impossible to publish.',
      ],
      code: {
        language: 'typescript',
        code: '.superRefine((value, context) => {\n  const correctCount = value.options.filter((o) => o.isCorrect).length;\n  if (correctCount < 1) {\n    context.addIssue({\n      code: z.ZodIssueCode.custom,\n      message: "Quiz must include at least one correct option",\n      path: ["options"],\n    });\n  }\n})',
        caption: 'Cross-field validation lives in the schema, not in UI code.',
      },
    },
    {
      heading: 'Design rules',
      list: [
        'Explicit and versionable: field names are chosen with future migrations in mind.',
        'Validation belongs at every boundary — editor, publish API, and renderer.',
        'Legacy shapes get preprocess migrations (the list block maps its old "ordered" style to "numeric").',
      ],
    },
  ],

  'block-editor': [
    {
      heading: 'Editor surfaces',
      paragraphs: [
        'Each block definition may ship an editor: the Studio surface that produces its data. Editors start from valid defaults (a poll always starts with options, a quiz with one correct answer marked) so the first thing a writer sees is already publishable.',
      ],
      list: [
        'Discoverable affordances: slash menu, hover-to-reorder, visible add buttons.',
        'Keyboard-first flows for primary actions.',
        'No direct markup editing — writers shape data, the renderer owns markup.',
      ],
    },
  ],

  'block-renderer': [
    {
      heading: 'The render contract',
      paragraphs: [
        'A renderer receives parsed data — never raw input — and returns deterministic markup. Every block root carries data-block-type for hydrators and test hooks. HTML is escaped at the boundary; inline links are the only markup text blocks produce, through a single reviewed path.',
      ],
      code: {
        language: 'typescript',
        code: 'render(data) {\n  const parsed = calloutBlockDataSchema.parse(data);\n  return `<section data-block-type="callout" data-variant="${parsed.variant}">…`;\n}',
        caption: 'Parse first. Always. Even in the renderer.',
      },
    },
    {
      heading: 'SSR safety',
      list: [
        'No window/document access at render time — behavior belongs to hydrators.',
        'Deterministic output: same data, same bytes, on every render.',
        'Dates render human-readable for humans and ISO in datetime attributes for machines.',
      ],
    },
  ],

  'block-examples': [
    {
      heading: 'Composition patterns',
      list: [
        'Narrative + checkpoint: text sections separated by a poll or quiz where attention drops.',
        'Explain + prove: a code block followed by its code-sandbox twin so readers can break it.',
        'Compare + decide: a comparison block followed by a branch gate that routes by reader choice.',
        'Reference articles: the block reference post itself is the canonical composition example.',
      ],
    },
    {
      heading: 'Media discipline',
      paragraphs: [
        'Images carry alt, caption, credit and license fields — use them. Serve media from the media library (uploaded through the Studio or API) so assets survive deploys on the persistent disk.',
      ],
    },
  ],

  theming: [
    {
      heading: 'Tokens first',
      paragraphs: [
        'Visual identity lives in CSS custom properties: --pulse-red and its dark variant, the --neutral-* ramp, typography stacks, spacing. Editor and renderer consume the same tokens, so a rebrand is a token edit, not a refactor.',
      ],
      code: {
        language: 'css',
        code: ':root {\n  --pulse-red: #FF2800;\n  --pulse-red-dark: #CC2000;\n  --neutral-50 … --neutral-900;\n}',
        caption: 'Override tokens before touching component internals.',
      },
    },
    {
      heading: 'Rules',
      list: [
        'Light and dark themes must both pass contrast checks.',
        'Keep selector depth shallow — no specificity wars.',
        'Renderer output never hardcodes colors; it reads tokens.',
      ],
    },
  ],

  ssr: [
    {
      heading: 'SSR and SSG rules',
      paragraphs: [
        'Renderers are pure: data in, markup out, no browser APIs. Interactive behavior is attached after hydration by the per-family hydrators, which are idempotent and guarded by data-hydrated markers.',
      ],
    },
    {
      heading: 'Constrained builders (battle-tested)',
      paragraphs: [
        'The production builder has tight thread limits. Two lessons are encoded in the repo: generateStaticParams reads a snapshot file instead of querying the database (the native engine cannot spawn threads there), and the Next build runs serialized (cpus: 1, workerThreads: false) with the Prisma engine pinned to its musl-openssl-3.0.x binary.',
      ],
      list: [
        'Never query Prisma in generateStaticParams on the builder.',
        'Build-time env placeholders exist for modules that validate env at import.',
        'An empty migrated SQLite db is prepared before next build for any SSG path that needs one.',
      ],
    },
  ],

  ai: [
    {
      heading: 'AI as a first-class author',
      paragraphs: [
        'The publish API is designed so an AI pipeline can produce a full article payload and ship it. The block schemas are the guardrail: anything a model hallucinates fails validation with precise per-block errors, so machine-authored content cannot be malformed. Every article on this very blog was produced and published this way.',
      ],
    },
    {
      heading: 'Guardrails',
      list: [
        'Constant-time bearer token + per-IP rate limiting on the publish endpoint.',
        'The endpoint stays disabled (503) until CONTENT_API_TOKEN is configured.',
        'Write actions are audited; AI-originated publishes are indistinguishable in the log from human ones.',
      ],
    },
  ],

  performance: [
    {
      heading: 'Reader surfaces',
      list: [
        'Hydration is per-family and lazy — heavy blocks (maps, sandboxes, video) attach behavior only when present.',
        'Below-the-fold homepage sections load through dynamic imports to protect LCP and TBT.',
        'Images ship as WebP with explicit dimensions; media is read from disk through an id-lookup route.',
      ],
    },
    {
      heading: 'Authoring surfaces',
      list: [
        'The Studio snapshot writes are cheap JSON — no re-render storms.',
        'The build runs serialized on constrained builders; correctness beats wall-clock speed there.',
      ],
    },
  ],
};
