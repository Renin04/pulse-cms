# Migration to Phase 4 (Pre-Phase Gate)

> This phase is a hard migration gate before Phase 4 AI work. Its purpose is to close
> editor parity gaps versus leading editors, establish Pulse as a real CMS platform
> (not only an editor), run a logical product-completeness audit, and ship the first
> Pulse-powered product website/blog surface.

**Status:** ✅ Complete (PM4-1 through PM4-12 closed on 2026-04-10)  
**Depends On:** Phase 3 closure (R3-1..R3-16)  
**Blocks:** Phase 4 AI implementation start (R4-1+)  
**Estimated Sessions:** 12  
**Priority:** P0

---

## 🎯 Goals

1. Benchmark Pulse against CKEditor 5 and TinyMCE and close high-impact editor gaps.
2. Expand Pulse from "editor" into a complete CMS baseline (content model, workflow, publishing, operations).
3. Run logical UX audits for command/shortcut discoverability and customizability.
4. Ship a public Pulse website that both markets Pulse and runs a real Pulse-powered blog/CMS flow.

---

## 📦 Scope

### A) Editor Parity Closure (vs CKEditor/TinyMCE)
- Build a parity matrix from official docs and map each capability to Pulse state (`done`, `partial`, `missing`).
- Prioritize high-value missing items (e.g. alignment, find/replace, word count, richer table/image metadata, source/editing diagnostics, import/export, review flows).
- Ensure every new editor action remains reachable through at least two UX paths (shortcut + command/menu/toolbar).

### B) CMS Expansion (vs WordPress/Strapi/Contentful/Sanity/Ghost)
- Add CMS primitives: content types, entries, taxonomies, slugs, statuses, scheduling, revision trail, approvals.
- Add operational capabilities: media library metadata policies, role/permission matrix, workflow and release controls, audit/activity logs.
- Add integration surfaces: API/webhook-ready publishing flow and admin list/manage UI surfaces.

### C) Logical Completeness Audit
- Verify command/shortcut documentation surface exists and is always in-product discoverable.
- Verify users can define new shortcuts/commands/macros safely with conflict detection and validation.
- Verify consistency across editor/renderer/manual-lab/docs for command names and behavior.

### D) Pulse Product Website + Dogfooding Blog
- Launch first website for Pulse product positioning and feature demos.
- Build an internal blog/CMS area inside the site, authored and managed with Pulse itself.
- Ensure website/blog architecture is reusable as a long-term dogfooding environment.

---

## ✅ Exit Criteria

Migration gate is complete only when all criteria pass:

1. `docs/research/PHASE4_MIGRATION_COMPETITOR_BASELINE.md` contains benchmark matrix + prioritized gaps.
2. All PM4-tagged feature rows in `docs/FEATURES.md` are either completed or intentionally deferred with rationale.
3. CMS baseline is functionally usable for create/edit/review/schedule/publish workflows.
4. Command/shortcut discoverability + customization audit checklist is complete and tested.
5. Pulse website is online in local dev with product pages and Pulse-powered blog admin + reader flows.
6. Quality gates pass for each PM4 implementation session:
   - `npm run docs:check`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - `npm run test`

---

## 🗂️ Session Plan (PM4-1 to PM4-12)

### PM4-1 — Competitor research + migration planning baseline
- Build editor + CMS benchmark matrix from official sources.
- Create this migration gate document and align active backlog.
- Seed PM4 feature rows in `docs/FEATURES.md`.

### PM4-2 — Rich text parity core
- Add high-impact text parity features (alignment, find/replace, word count, advanced paste hygiene, additional formatting controls).
- Add command/toolbar/shortcut access paths and regression tests.

### PM4-3 — Media parity core
- Add image metadata parity (`alt`, title/credit/source/license), image controls, and UX guardrails.
- Add media authoring tests and renderer parity checks.

### PM4-4 — Command & shortcut completeness pack
- Add in-product shortcuts/commands reference page and searchable command catalog.
- Add user-defined command/shortcut authoring UX with conflict checks.

### PM4-5 — Collaboration/review baseline
- Add commenting/suggestion/version-comparison primitives (single-workspace baseline first).
- Add audit-safe change history visibility.

### PM4-6 — CMS data model foundations
- Implement content types/collections, fields, taxonomies, slug policy, and relationship modeling.
- Add migration-safe schema validation boundaries.

### PM4-7 — CMS workflow & governance
- Implement draft/review/publish status flow, publish scheduling, approval checkpoints.
- Implement role/permission scaffolding for editorial operations.

### PM4-8 — CMS media & SEO operations baseline
- Implement CMS media library operations (folders, metadata policy, search/filter).
- Add baseline SEO entry metadata workflow (title/meta/slug/social preview checks).

### PM4-9 — CMS admin surfaces + API integration
- Build content list/manage views (filters, sorting, bulk actions).
- Expose publish hooks/events for automation and external integrations.

### PM4-10 — Pulse website scaffold
- Create product website app structure and design system.
- Ship core marketing pages and feature showcase blocks.

### PM4-11 — Pulse-powered blog & admin in website
- Implement blog listing/post pages plus admin authoring flow powered by Pulse editor.
- Ensure end-to-end content lifecycle can be executed through the site.

### PM4-12 — Migration sign-off and Phase 4 handoff
- Stabilize PM4 scope, close docs tracking, and finalize handoff checklist for AI phase start.
- Ensure backlog/memory/features parity and quality gates are clean.

---

## 📌 Execution Log

- ✅ PM4-1 completed on 2026-04-06:
  - initiated official-source benchmark research for CKEditor 5, TinyMCE, WordPress, Strapi, Contentful, Sanity, and Ghost
  - authored migration gate plan and sessionized PM4 roadmap
- ✅ PM4-2 completed on 2026-04-07:
  - implemented text alignment controls (left/center/right/justify) with commands and shortcuts
  - implemented find/replace with search navigation and replace-all capabilities
  - implemented word/character count with Unicode support
  - added 23 comprehensive tests, all passing
- ✅ PM4-3 completed on 2026-04-07:
  - extended ImageBlock with title, credit, source, license metadata fields
  - implemented 8 image metadata commands with validation
  - added accessibility-focused validation (alt text quality, URL validation)
  - added 19 comprehensive tests, all passing
- ✅ PM4-4 completed on 2026-04-07:
  - implemented in-product command catalog with search and filtering
  - implemented user-defined command/shortcut authoring with conflict validation
  - implemented shortcut reference system with platform-specific formatting
  - added 27 comprehensive tests, all passing
- ✅ PM4-5 completed on 2026-04-07:
  - implemented comment/suggestion system with threading and workflow
  - implemented revision history with automatic change detection and diff comparison
  - added moderation hooks and audit statistics
  - added 17 comprehensive tests, all passing
- ✅ PM4-6 completed on 2026-04-07:
  - implemented CMS Data Modeling Foundations
  - created ContentTypeRegistry with CRUD, field management, versioning, and migrations
  - implemented EntryManager with status workflow, querying, and field value management
  - created TaxonomyManager with hierarchical terms and circular reference prevention
  - implemented slug generation with transliteration support
  - added 37 comprehensive CMS tests, all passing
- ✅ PM4-7 completed on 2026-04-07:
  - implemented WorkflowEngine with configurable status transitions
  - created approval checkpoint system for sensitive transitions
  - built scheduling infrastructure for publish/unpublish/archive actions
  - implemented role/permission system (author, editor, admin, reviewer)
  - added comprehensive audit logging for all workflow events
  - added 46 comprehensive workflow tests, all passing
- ✅ PM4-8 completed on 2026-04-07:
  - implemented MediaLibraryManager with folder hierarchy and asset CRUD
  - added media metadata support (alt, title, credit, source, license, tags)
  - implemented search/filter with alt/metadata quality checks
  - integrated SEO entry metadata (title, description, keywords, ogImage, canonicalUrl)
  - added workflow guards for SEO gaps and media accessibility (alt text validation)
  - added 51 comprehensive tests (29 media library + 22 workflow guards), all passing
- ✅ PM4-9 completed on 2026-04-07:
  - implemented ContentAdminManager with list/manage views and bulk operations
  - added PublishEventBus with publish hooks/events and webhook scaffolding
  - created API contracts for content delivery, management, and webhooks
  - added 63 comprehensive tests (24 content admin + 39 publish events), all passing
- ✅ PM4-10 completed on 2026-04-10:
  - completed the first Pulse website scaffold with marketing pages, docs/example surfaces, and static blog detail routes
  - aligned the website shell with the Pulse visual identity system and centralized site content data
  - added website static-export Playwright coverage (execution skipped in this environment)
- ✅ PM4-11 completed on 2026-04-10:
  - implemented the local Pulse-powered blog studio inside the website with entry authoring, workflow controls, scheduling, and preview
  - added a reusable local blog workspace module plus lifecycle regression tests
  - hydrated locally published entries back into the website blog feed and preview route
- ✅ PM4-12 completed on 2026-04-10:
  - stabilized the website studio by validating and sanitizing persisted local snapshot data before hydration
  - documented accepted PM4 deferrals and the formal AI kickoff handoff in `docs/PHASE_04_AI_KICKOFF_CHECKLIST.md`
  - synchronized PM4 closure state across backlog, memory, features, and phase artifacts

---

## 🔎 Baseline Research Sources (Official)

Editor benchmark:
- CKEditor 5 features: https://ckeditor.com/ckeditor-5/features/
- CKEditor 5 feature index/docs: https://ckeditor.com/docs/ckeditor5/latest/features/index.html
- TinyMCE feature overview: https://www.tiny.cloud/tinymce/features/
- TinyMCE plugin catalog: https://www.tiny.cloud/docs/tinymce/latest/plugins/

CMS benchmark:
- WordPress feature overview: https://wordpress.org/about/features/
- WordPress media library docs: https://wordpress.org/documentation/article/media-library-screen/
- WordPress revisions docs: https://wordpress.org/support/article/revisions/
- Strapi CMS docs intro/features: https://docs.strapi.io/cms/intro
- Strapi platform features: https://strapi.io/features
- Contentful feature set: https://www.contentful.com/features/
- Contentful scheduled publishing: https://www.contentful.com/help/scheduled-publishing/
- Contentful permissions: https://www.contentful.com/help/roles/space-roles-and-permissions/content-permissions/
- Sanity Content Lake: https://www.sanity.io/content-lake
- Sanity roles docs: https://www.sanity.io/docs/roles
- Ghost memberships docs: https://ghost.org/help/tiers/

---

## ⚠️ Risks

- Scope can balloon if parity is treated as "copy every feature" instead of "prioritized value parity".
- CMS implementation can drift into platform rewrite without strict milestone slicing.
- Website delivery can stall core editor/CMS work unless integration checkpoints are explicit.

---

## 🔄 Handoff to Phase 4

Phase 4 AI sessions start only after PM4 closes with:
- editor parity baseline and CMS foundation in place,
- product website + Pulse dogfooding blog operational,
- command/shortcut discoverability and customization audited,
- documentation and quality gates fully synchronized.

PM4 is now closed. Start Phase 4 from:
- `docs/PHASE_04_AI_KICKOFF_CHECKLIST.md`
- `phases/PHASE_04_AI.md`
