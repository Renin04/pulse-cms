# Phase 4 Migration Competitor Baseline (Editor + CMS)

**Date:** 2026-04-06  
**Prepared For:** Pre-Phase gate `phases/PHASE_PRE_MIGRATION_04.md`  
**Scope:** Compare Pulse current state against leading editor + CMS capabilities using official documentation.

---

## 1) Sources Used (Official)

### Editors
- CKEditor 5 features: https://ckeditor.com/ckeditor-5/features/
- CKEditor 5 feature index/docs: https://ckeditor.com/docs/ckeditor5/latest/features/index.html
- TinyMCE feature overview: https://www.tiny.cloud/tinymce/features/
- TinyMCE plugin catalog: https://www.tiny.cloud/docs/tinymce/latest/plugins/

### CMS Platforms
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

## 2) Editor Parity Matrix (Pulse vs CKEditor/TinyMCE)

Legend:
- `Implemented`: feature is clearly present in `docs/FEATURES.md` as completed.
- `Partial`: nearby capability exists, but benchmark-grade UX/coverage is incomplete.
- `Missing`: no tracked feature with implementation path.

| Capability | Benchmark Evidence | Pulse State | Gap Level | PM4 Target |
|---|---|---|---|---|
| Slash-command insertion | CKEditor slash commands; TinyMCE slash commands | Implemented | Low | Keep parity tests |
| Rich formatting baseline | Both editors ship formatting, lists, links, code, tables | Implemented | Low | Regression only |
| Text alignment controls | CKEditor alignment feature; Tiny alignment formats | Partial (not explicit in Pulse features) | High | PM4-2 |
| Find and replace | CKEditor + TinyMCE feature sets include find/replace | Missing | High | PM4-2 |
| Word/character count | CKEditor word count; Tiny word count | Missing | Medium | PM4-2 |
| Advanced paste cleanup | Tiny PowerPaste-style cleanup; CKEditor paste pipelines | Missing | Medium | PM4-2 |
| Mentions/inline entities | CKEditor mentions; Tiny mentions | Missing | Medium | PM4-2 |
| Image metadata (`alt`, title, caption/credit/source) | CKEditor image feature family; Tiny image tools | Partial (caption exists, metadata incomplete) | High | PM4-3 |
| Table authoring depth (resize/merge/advanced edit) | CKEditor table suite; Tiny advanced tables | Partial (table block exists, advanced ops unclear) | Medium | PM4-3 |
| Accessibility checker in editor | Both ecosystems expose accessibility tooling | Missing (a11y tests exist, checker UX missing) | Medium | PM4-4 |
| Spell/grammar UX surface | Tiny spell checker; editor quality tooling | Partial (AI grammar planned, non-AI checker missing) | Medium | PM4-4 |
| Comments/suggestions (review mode) | CKEditor + Tiny premium collaboration stacks | Missing | High | PM4-5 |
| Revision history / compare | Both ecosystems provide review/version features | Partial (undo/redo only) | High | PM4-5 |
| Source/HTML editing mode | CKEditor source editing/full-page HTML; Tiny code/full-page | Missing | Medium | PM4-2/PM4-4 |
| Document import/export (DOCX/PDF) | Tiny import/export suite; CKEditor ecosystem supports conversions | Missing | Medium | PM4-4 |

Key inference:
- Pulse is strong in command-driven editing and block extensibility.
- Highest editor parity risk is not core editing; it is review/governance tooling and media metadata depth.

---

## 3) CMS Parity Matrix (Pulse vs Leading CMS Platforms)

| Capability | Benchmark Evidence | Pulse State | Gap Level | PM4 Target |
|---|---|---|---|---|
| Content model builder (types/fields) | Strapi content-type builder; Contentful modeling; Sanity schemas | Missing | High | PM4-6 |
| Reusable components/blocks in content model | Strapi components/dynamic zones; Sanity structured content | Partial (block system exists, CMS modeling absent) | High | PM4-6 |
| Entry management UI (list/filter/sort/bulk) | WordPress posts/pages admin; Strapi content manager | Missing | High | PM4-9 |
| Draft/publish statuses | Strapi Draft & Publish; Contentful states; WordPress statuses | Missing | High | PM4-7 |
| Scheduled publish/unpublish | Contentful scheduled publishing; WordPress scheduling; Strapi releases | Missing | High | PM4-7 |
| Review workflows / approvals | Strapi review workflows; enterprise CMS standards | Missing | High | PM4-7 |
| Revision history / restore | WordPress revisions; CMS version history patterns | Partial (editor history only) | High | PM4-5/PM4-7 |
| Release orchestration | Strapi releases; Contentful release-oriented workflows | Missing | Medium | PM4-7 |
| Role-based access control | Contentful content permissions; Strapi RBAC; Sanity roles | Missing | High | PM4-7 |
| Localization / locale strategy | Strapi i18n; Contentful/Sanity localization capabilities | Missing (global i18n UI planned Phase 6 only) | High | PM4-8 |
| Media library (folders, metadata, search/filter) | WordPress media library; Strapi media library | Missing | High | PM4-8 |
| Asset metadata governance | Contentful media metadata patterns; CMS DAM norms | Missing | High | PM4-8 |
| API-first content delivery (REST/GraphQL contracts) | Contentful/Sanity/Strapi positioning | Partial (library APIs exist, CMS content APIs absent) | Medium | PM4-9 |
| Webhooks and automation triggers | Contentful/Strapi operational model | Missing | Medium | PM4-9 |
| SEO publishing fields (slug/meta/social) | WordPress + modern CMS workflows | Partial (SEO phase planned, CMS entry integration missing) | High | PM4-8 |
| Multi-channel publish readiness | Contentful omnichannel; Sanity content lake distribution | Missing | Medium | PM4-9 |
| Membership/paywall-ready content controls | Ghost tiers/memberships | Missing | Low (post-MVP) | Backlog parking |
| Product website + dogfooding loop | Many platforms market + demonstrate with real content products | Missing | High | PM4-10/PM4-11 |

Key inference:
- Pulse currently behaves as a powerful editing engine, not yet as a full CMS operating system.
- The largest gap is editorial operations (workflow/permissions/scheduling/media), not block authoring.

---

## 4) PM4 Prioritization (Recommended)

### Wave A (Must Close Before Phase 4 AI)
1. Content model + entry workflow foundations (`PM4-6`, `PM4-7`).
2. Media metadata and library baseline (`PM4-8`).
3. Command/shortcut discoverability and customization surfaces (`PM4-4`).
4. Editor parity for alignment/find-replace/word-count/image metadata (`PM4-2`, `PM4-3`).
5. Pulse website + internal blog dogfooding baseline (`PM4-10`, `PM4-11`).

### Wave B (Can Start in PM4, Finish in Phase 4/5 if needed)
1. Collaboration suite depth (comment threads, multi-user suggestion UX).
2. Import/export interoperability pipelines.
3. Membership/paywall and subscription feature packs.
4. Cross-channel release orchestration and advanced analytics.

---

## 5) Guardrails for This Migration

- Do not clone every enterprise editor/CMS feature blindly; prioritize workflow-completing capabilities.
- Keep each PM4 session testable and reversible.
- Every added capability must map to one clear user job in Pulse authoring or publishing flow.
- Preserve block-first architecture; CMS layer should orchestrate blocks, not bypass them.
