import { docSections } from './site-content-sections';

export interface DocSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  code?: { language: string; code: string; caption?: string };
}

export interface DocLeaf {
  slug: string[];
  title: string;
  summary: string;
  bullets: string[];
  /** Rich, detailed sections rendered after the key-points card. */
  sections?: DocSection[];
}

export const siteStats = [
  { value: '30+', label: 'Block Types' },
  { value: '1000+', label: 'Tests Passing' },
  { value: '4', label: 'Core Packages' },
];

export const docsLeafPages: DocLeaf[] = [
  {
    slug: ['quickstart'],
    title: 'Quick Start',
    summary: 'Get a Pulse prototype running fast.',
    bullets: [
      'Install the packages you need: editor, renderer, or both.',
      'Register your initial block set and rendering contract.',
      'Use the website demo to understand the authoring model before deeper integration.',
    ],
  },
  {
    slug: ['installation'],
    title: 'Installation',
    summary: 'Choose the package surface that matches your project.',
    bullets: [
      'Use workspaces for local package development.',
      'Keep the editor and renderer decoupled where possible.',
      'Prefer strict TypeScript and explicit exports for public integrations.',
    ],
  },
  {
    slug: ['configuration'],
    title: 'Configuration',
    summary: 'Set themes, registries, commands, and adapters deliberately.',
    bullets: [
      'Define token-driven styling early.',
      'Register only the blocks and commands you need.',
      'Document custom content types and editor behavior alongside the code.',
    ],
  },
  {
    slug: ['blocks'],
    title: 'Blocks',
    summary: 'Understand the block-first mental model.',
    bullets: [
      'Blocks own schema, behavior, and rendering.',
      'New block types should not require core rewrites.',
      'Structured content opens the door to better automation later.',
    ],
  },
  {
    slug: ['state'],
    title: 'Editor State',
    summary: 'Work with selection, history, and document state safely.',
    bullets: [
      'Keep mutations explicit and testable.',
      'Avoid hidden state coupling between UI surfaces.',
      'Use snapshots and history tools for undo and review workflows.',
    ],
  },
  {
    slug: ['events'],
    title: 'Events',
    summary: 'Use the event system for coordination and observability.',
    bullets: [
      'Emit deterministic events for meaningful editor actions.',
      'Prefer typed payloads over generic event bags.',
      'Keep publishing and workflow hooks auditable.',
    ],
  },
  {
    slug: ['plugins'],
    title: 'Plugins',
    summary: 'Extend Pulse without forking the core.',
    bullets: [
      'Use plugin contracts for block packs and integrations.',
      'Keep plugin APIs low-coupling and well typed.',
      'Treat plugin loading and safety checks as part of product quality.',
    ],
  },
  {
    slug: ['api', 'core'],
    title: '@pulse/core API',
    summary: 'Shared contracts, registries, and CMS primitives.',
    bullets: [
      'Core houses schemas, CMS managers, and shared utilities.',
      'Public APIs should stay stable and documented.',
      'Tests should cover behavior, not just types.',
    ],
  },
  {
    slug: ['api', 'editor'],
    title: '@pulse/editor API',
    summary: 'Authoring behaviors, commands, and editing surfaces.',
    bullets: [
      'Expose ergonomic hooks for editor integration.',
      'Keep command naming consistent across UI and docs.',
      'Support at least two access paths for major actions.',
    ],
  },
  {
    slug: ['api', 'renderer'],
    title: '@pulse/renderer API',
    summary: 'Display interactive content with a stable styling contract.',
    bullets: [
      'Consume tokens rather than hardcoded values.',
      'Support SSR and static output predictably.',
      'Keep theme overrides outside runtime logic when possible.',
    ],
  },
  {
    slug: ['api', 'react'],
    title: '@pulse/react API',
    summary: 'React bindings for editor and renderer consumers.',
    bullets: [
      'Provide framework-friendly wrappers without leaking internals.',
      'Keep components composable and tree-shakeable.',
      'Document client and server boundaries clearly.',
    ],
  },
  {
    slug: ['cli'],
    title: 'CLI Reference',
    summary: 'Utilities for local development and project maintenance.',
    bullets: [
      'Use docs checks and local CI gates as a default.',
      'Prefer small, focused scripts over opaque build chains.',
      'Document any workflow that impacts contributors repeatedly.',
    ],
  },
  {
    slug: ['dev'],
    title: 'Development',
    summary: 'Working conventions for the monorepo.',
    bullets: [
      'Read the memory and backlog files every session.',
      'Ship in small slices with tests close to the changed behavior.',
      'Keep docs, backlog, and feature tracking synchronized.',
    ],
  },
  {
    slug: ['testing'],
    title: 'Testing',
    summary: 'A layered test strategy for Pulse.',
    bullets: [
      'Unit and integration tests carry most coverage today.',
      'Website E2E should verify real user flows through the product surface.',
      'Avoid internet-dependent fixtures when a local target is available.',
    ],
  },
  {
    slug: ['block-schema'],
    title: 'Block Schema',
    summary: 'Define the data shape each block owns.',
    bullets: [
      'Schemas should be explicit and versionable.',
      'Validation belongs at boundaries, not only in UI.',
      'Keep future migrations in mind when naming fields.',
    ],
  },
  {
    slug: ['block-editor'],
    title: 'Block Editor',
    summary: 'Authoring UI patterns for custom blocks.',
    bullets: [
      'Editing affordances should stay discoverable.',
      'Preserve keyboard access for all primary flows.',
      'Avoid coupling editor UI too tightly to renderer implementation details.',
    ],
  },
  {
    slug: ['block-renderer'],
    title: 'Block Renderer',
    summary: 'Display blocks consistently across contexts.',
    bullets: [
      'Renderer output must remain deterministic.',
      'Tokens should drive layout and theme behavior.',
      'SSR-safe markup is part of the renderer contract.',
    ],
  },
  {
    slug: ['block-examples'],
    title: 'Block Examples',
    summary: 'Practical references for composing content experiences.',
    bullets: [
      'Mix narrative blocks with interactive ones intentionally.',
      'Use metadata-rich media blocks for accessibility and SEO.',
      'Document usage patterns that other teams can copy cleanly.',
    ],
  },
  {
    slug: ['theming'],
    title: 'Theming',
    summary: 'Token-first styling for editor and renderer surfaces.',
    bullets: [
      'Override tokens before component internals.',
      'Keep light and dark themes contrast-safe.',
      'Avoid selector wars by keeping style layers shallow.',
    ],
  },
  {
    slug: ['ssr'],
    title: 'SSR & Static Rendering',
    summary: 'Render Pulse reliably in build and server environments.',
    bullets: [
      'Avoid hidden browser-state requirements.',
      'Keep class names and attributes stable.',
      'Treat static output as a first-class consumption path.',
    ],
  },
  {
    slug: ['ai'],
    title: 'AI Integration',
    summary: 'The upcoming AI builder runtime and guardrails.',
    bullets: [
      'Separate provider controls from authoring surfaces.',
      'Log and gate write actions carefully.',
      'Use the migration website as a real dogfooding target for future AI flows.',
    ],
  },
  {
    slug: ['performance'],
    title: 'Performance',
    summary: 'Keep both authoring and reading flows responsive.',
    bullets: [
      'Prefer targeted lazy loading for heavy blocks.',
      'Measure bottlenecks before broad optimization work.',
      'Minimize avoidable client-side work in reader-facing surfaces.',
    ],
  },
];

export function getDocLeaf(slug: string[]) {
  const page = docsLeafPages.find((page) => page.slug.join('/') === slug.join('/'));
  if (!page) return undefined;
  return { ...page, sections: docSections[page.slug.join('/')] };
}

export function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}
