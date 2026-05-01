# Phase 5 — SEO Intelligence & Content Growth

> Phase 5 turns Pulse into an SEO-native publishing system. This phase focuses on
> measurable search performance, semantic quality, and media-aware optimization workflows.

**Status:** ⬜ Not Started  
**Depends On:** Phase 4 (AI Builder & Automation Runtime)  
**Blocks:** Phase 6 (Production Hardening)  
**Estimated Sessions:** 16  
**Priority:** P0

---

## 🎯 Goals

1. Deliver an editor-native SEO workflow from planning to publish gate.
2. Ship advanced media SEO controls (format, size, alt-text, captions, figures, schema).
3. Implement semantic SEO and entity-driven optimization beyond keyword stuffing.
4. Deliver robust schema generation and validation for rich result eligibility.
5. Ship SEO automation pipelines with strict auditability and rollback behavior.
6. Tie all recommendations to measurable growth KPIs and publish quality thresholds.

---

## 📦 Scope

### SEO Planning & Briefing
- SEO brief generator (topic, intent, audience, keyword clusters, objective)
- Search intent mapping and content-angle recommendations
- Topic cluster planning and competitor gap hints

### On-Page SEO Optimization
- Title/meta/slug optimization
- Heading structure and scanability checks
- Internal linking suggestions and anchor-text improvements
- External source quality suggestions and citation hints

### Media SEO Studio
- Image format policy (AVIF/WebP/JPEG fallback)
- Compression and responsive image profile (`srcset`/`sizes`)
- Alt-text quality scoring and rewrite suggestions
- Caption/figure templates and attribution metadata
- Media schema hints (`ImageObject`, `VideoObject`) and accessibility completeness

### Semantic SEO Engine
- Entity extraction and semantic coverage scoring
- Intent-fit checks across headings, body, and metadata
- Semantic gap detection and recommended expansion sections
- Cannibalization detection and merge/split guidance

### Schema & Rich Results
- Schema type suggestions per article type (`Article`, `BlogPosting`, `FAQPage`, `HowTo`)
- JSON-LD generation and validation hints
- Breadcrumb and organization/person graph suggestions
- Rich snippet readiness checks

### SEO Automation & Publishing
- Pre-publish SEO gate and weighted SEO quality score
- Content freshness monitor and refresh queue
- Programmatic SEO automation recipes
- Headline/meta variant experiments for CTR optimization

---

## ✅ Exit Criteria

Phase 5 is complete only when all criteria pass:

1. All Phase 5 rows in `docs/FEATURES.md` are `✅` with implementation and tests.
2. Each publish flow can generate and validate an SEO brief before content finalization.
3. Media SEO panel supports format/compression/alt/caption/figure workflows and policy presets.
4. Semantic SEO checks produce actionable results with pass/fail thresholds.
5. Schema assistant generates valid structured-data suggestions with validation coverage.
6. Pre-publish SEO gate can block publish when thresholds fail.
7. SEO automations support dry-run, approval, silent-policy modes, and rollback.
8. Full quality gates pass:
   - `npm run docs:check`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - `npm run test`

---

## 🗂️ Session Plan (R5-1 to R5-16)

### R5-1 — SEO domain model + scoring contracts
- Define SEO domain schemas (`brief`, `intent`, `score`, `gate`).
- Add score component contracts (metadata, semantic, media, technical).
- Add baseline tests for score determinism.

### R5-2 — SEO brief generator
- Build SEO brief composer UI + AI-assisted draft.
- Add keyword and intent cluster fields with validation.
- Add tests for brief persistence and validation.

### R5-3 — On-page optimizer foundations
- Implement title/meta/slug recommendation engine.
- Add heading structure analysis with actionable hints.
- Add tests for optimizer output stability.

### R5-4 — Internal linking and content structure
- Implement internal link suggestion engine.
- Add anchor-text quality hints and link density checks.
- Add tests for linking suggestion relevance.

### R5-5 — Media SEO policy engine
- Implement media policy schema (format, compression, dimensions, loading strategy).
- Add editor controls for media policy selection.
- Add tests for policy application on image blocks.

### R5-6 — Media metadata intelligence
- Implement alt-text score and rewrite suggestions.
- Implement caption/figure templates and accessibility checks.
- Add tests for metadata completeness scoring.

### R5-7 — Responsive media optimization
- Implement responsive image profile generator (`srcset`/`sizes` guidance).
- Add focal-point and crop-safe suggestion model.
- Add tests for profile generation rules.

### R5-8 — Semantic SEO engine
- Implement entity extraction and semantic graph builder.
- Add intent-fit analysis and semantic gap detection.
- Add tests for semantic scoring and entity coverage.

### R5-9 — Cannibalization and cluster quality
- Implement cannibalization detection using title/intent/entity overlap.
- Add recommendations for merge/split/reposition actions.
- Add tests for overlap detection thresholds.

### R5-10 — Schema assistant core
- Implement schema-type recommendation engine by article pattern.
- Add JSON-LD generation helper and field completeness checks.
- Add tests for schema suggestion validity.

### R5-11 — Rich results readiness
- Implement FAQ/HowTo rich-snippet readiness checks.
- Add breadcrumb and organization/person graph hints.
- Add tests for rich-result eligibility scoring.

### R5-12 — Pre-publish SEO gate
- Implement configurable SEO pass/fail gate in publish flow.
- Add blocking reasons with remediation suggestions.
- Add tests for gate enforcement behavior.

### R5-13 — SEO automation recipes
- Implement SEO automation recipe set (refresh, metadata updates, schema refresh, link pass).
- Add dry-run and approval flow hooks.
- Add tests for recipe execution safety.

### R5-14 — Silent SEO automations + rollback
- Enable silent mode for pre-approved SEO tasks within policy budgets.
- Add rollback/replay references for automation runs.
- Add tests for silent-mode policy constraints.

### R5-15 — SEO experiments and growth analytics
- Implement title/meta variant experiments and result tracking.
- Add growth dashboard contract (CTR, intent score, freshness backlog).
- Add tests for experiment data integrity.

### R5-16 — Stabilization and handoff
- Run full quality gates and resolve Phase 5 regressions.
- Close all Phase 5 rows in `docs/FEATURES.md`.
- Document Phase 6 handoff requirements (production policies, SLO instrumentation).

---

## 📌 Execution Log

*No implementation sessions yet.*

---

## ⚠️ Risks

- Over-optimization can reduce editorial quality if score weights are too rigid.
- Image SEO flows can become slow without performance-aware defaults.
- Schema recommendations may drift from content truth without strict validation.
- Silent automations can introduce SEO regressions without robust rollback.
- SEO metrics can be misleading without clear attribution and baseline windows.

---

## 🔄 Handoff to Phase 6

Phase 6 starts when Phase 5 provides:

- Stable SEO scoring contracts and publish-gate logic.
- Media SEO policy model integrated into authoring workflows.
- Schema recommendation and validation pipelines.
- Automation telemetry and rollback hooks for production operations.
