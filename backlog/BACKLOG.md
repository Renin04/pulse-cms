# Pulse — Development Backlog

> This is the actionable work queue.  
> Completed tasks must be removed from this file and archived in `backlog/DONE.md`.

**Last Updated:** 2026-05-16  
**Current Phase:** Phase 4 — AI Builder & Automation Runtime

---

## 🎯 Active Execution Backlog

Only tasks that are still open belong here.

### Phase 4: AI Builder & Automation Runtime

Reference plan: `phases/PHASE_04_AI.md`  
Kickoff handoff: `docs/PHASE_04_AI_KICKOFF_CHECKLIST.md`

#### R4-1 — AI package scaffold + capability contracts
- ⬜ Create `packages/ai` package structure (src/, tests/, package.json, tsconfig)
- ⬜ Define capability interfaces: `text_generation`, `image_generation`, `builder_tools`, `automation`
- ⬜ Add capability resolution registry and base tests

#### R4-2 — AI brief and context model
- ⬜ Implement document-level AI brief schema and storage
- ⬜ Implement context pack resolver (topic + nearby blocks + selection)
- ⬜ Add tests for context assembly determinism

#### R4-3 — Inline invocation UX
- ⬜ Implement inline AI launcher (`Cmd/Ctrl + J`) and selection-aware commands
- ⬜ Add apply modes (`replace`, `append`, `new block`) with preview state
- ⬜ Add interaction tests around cursor/selection transitions

#### R4-4 — Provider registry GUI
- ⬜ Build provider management panel (add/edit/remove provider, endpoint, auth mode)
- ⬜ Build AI Studio tabs for feature/command/shortcut/action/automation catalogs
- ⬜ Add provider validation and health-check probe flow
- ⬜ Add UI tests for provider panel state transitions

#### R4-5 — Secure key and model profile management
- ⬜ Implement secure API key storage integration path
- ⬜ Implement model profile CRUD (temperature, max tokens, timeout, budgets)
- ⬜ Add tests for key redaction and profile fallback behavior

#### R4-6 — Capability router (text vs image split)
- ⬜ Implement capability router with independent text and image model routes
- ⬜ Implement fallback chain policy by capability
- ⬜ Add routing tests for model failure and fallback selection

#### R4-7 — Tool runtime foundation
- ⬜ Build tool invocation contract with strict input/output schemas
- ⬜ Add permission levels (`read`, `suggest`, `apply-with-approval`)
- ⬜ Add audit envelope and trace ID generation

#### R4-8 — AI Builder: block creation toolchain
- ⬜ Implement `createBlockType` tool flow (schema + registration patch proposal)
- ⬜ Add generated test scaffolding and docs draft output
- ⬜ Add approval gate before any write action

#### R4-9 — AI Builder: command/shortcut/macro tools
- ⬜ Implement `addCommand`, `addShortcut`, `addMacro` tools
- ⬜ Implement conflict checks and rollback-safe proposals
- ⬜ Add regression tests for command and shortcut generation

#### R4-10 — AI Builder: AI action generator (meta-builder)
- ⬜ Implement `createAiAction` tool to register new AI actions
- ⬜ Support action metadata (name, category, params, safety level)
- ⬜ Auto-refresh AI Studio catalogs after generated-action registration
- ⬜ Add tests for action registry updates and validation failure cases

#### R4-11 — Automation engine core
- ⬜ Implement trigger/condition/action runtime engine
- ⬜ Add run orchestration with retries, timeouts, and deterministic logs
- ⬜ Add tests for multi-step automation execution

#### R4-12 — Silent automation mode
- ⬜ Implement policy-driven silent runs (pre-approved action scopes only)
- ⬜ Add budget ceilings (token/cost/run-frequency)
- ⬜ Add tests for silent mode guardrail violations

#### R4-13 — Automation recipe builder UX
- ⬜ Implement GUI builder for automation recipes
- ⬜ Support schedule, publish, and manual triggers
- ⬜ Add tests for recipe validation and persistence

#### R4-14 — Image generation flow
- ⬜ Implement image request pipeline with separate image model route
- ⬜ Add prompt helper, style presets, regenerate/variation actions
- ⬜ Add tests for image workflow fallback and metadata payload

#### R4-15 — Media enrichment
- ⬜ Implement auto alt-text and caption suggestions
- ⬜ Implement style-to-theme matching hints for generated media
- ⬜ Add tests for accessibility metadata completeness

#### R4-16 — Safety and governance hardening
- ⬜ Implement prompt injection defenses and policy guardrails
- ⬜ Implement redaction options and confidence/hallucination risk tags
- ⬜ Add policy enforcement and rejection-path tests

#### R4-17 — Auditability and observability
- ⬜ Implement action audit stream + searchable execution history
- ⬜ Add trace correlation between UI action and tool/runtime logs
- ⬜ Add tests for audit completeness and replay references

#### R4-18 — Stabilization and handoff
- ⬜ Run full quality gates and fix Phase 4 regressions
- ⬜ Close all Phase 4 `docs/FEATURES.md` rows
- ⬜ Document handoff contracts for Phase 5 (SEO Intelligence)

---

## 🔮 Future Roadmap (Not Active Yet)

These items are intentionally parked until Phase 4 closes.

### Phase 5: SEO Intelligence
Reference plan: `phases/PHASE_05_SEO.md`
- ⬜ Add SEO brief and keyword/intent planning workflows
- ⬜ Add on-page optimization (title/meta/slug/headings/internal links)
- ⬜ Add schema/FAQ/rich-snippet assistants
- ⬜ Add pre-publish SEO score and SEO automations

### Phase 6: Production Hardening
Reference plan: `phases/PHASE_06_PRODUCTION.md`
- ⬜ Complete packaging/release operations (npm/CDN/changelog/migrations)
- ⬜ Complete observability/testing hardening (E2E/visual/performance monitoring)
- ⬜ Complete developer/documentation surfaces (API docs/guides/examples)
- ⬜ Complete platform expansion (adapters, i18n, security hardening)

---

## ⏸️ Blocked Tasks

- Playwright/browser-dependent website E2E remains blocked by the current network/browser-install constraint.

---

## 🗑️ Cancelled Tasks

*No cancelled tasks yet.*

---

## 📝 Backlog Hygiene Rules

- Keep this file limited to **not completed** tasks.
- Move done work to `backlog/DONE.md` in the same session.
- Do not keep `- ✅` checklist items in this file.
- Automated check: run `npm run docs:check` (also included in `npm run ci:local`).

---

**Current Goal:** Execute R4-1 — scaffold `@pulse/ai` and define capability contracts.
