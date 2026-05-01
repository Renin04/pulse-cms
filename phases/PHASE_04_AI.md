# Phase 4 — AI Builder & Automation Runtime

> Phase 4 implements an opinionated, auditable AI layer for Pulse authoring.
> AI is treated as a builder runtime with strict controls, not a free-form chat overlay.

**Status:** ⬜ Not Started (unblocked after PM4 sign-off on 2026-04-10)  
**Depends On:** Phase 3 (Renderer, Display & UI) and PM4 Migration Gate closure  
**Blocks:** Phase 5 (SEO Intelligence), Phase 6 (Production Hardening)  
**Estimated Sessions:** 18  
**Priority:** P0

---

## 🎯 Goals

1. Build a GUI-first AI control center for provider/model/key configuration.
2. Ship inline, selection-aware AI flows that work safely during active writing.
3. Deliver a tool-based AI Builder that can create blocks, commands, shortcuts, and AI actions.
4. Deliver automation runtime (including silent automations) with policy controls and audit logs.
5. Separate text and image model routing with independent fallback chains.
6. Enforce strict safety gates, approval workflows, and observability for all AI actions.

---

## 📦 Scope

### AI Workspace Context
- Document AI brief (topic, audience, tone, objective, constraints, forbidden claims)
- Document-scoped memory/context pack and reusable prompt profile
- Context-aware invocation from cursor, selection, or block scope

### AI Invocation UX
- Inline AI entry (`Cmd/Ctrl + J`) and slash-triggered AI commands
- Selection actions (`rewrite`, `expand`, `summarize`, `explain`, `critique`)
- Apply modes (`replace`, `append`, `new block`) with diff preview
- AI Studio tabbed surfaces (`Features`, `Commands`, `Shortcuts`, `Actions`, `Automations`)
- Auto-sync catalogs when AI adds/removes blocks, commands, shortcuts, or actions

### Provider & Model GUI Control Center
- Add/edit/remove provider via GUI
- Secure API key management and provider health checks
- Independent routing profiles for text models and image models
- Fallback chains, cost caps, and latency budget policies

### AI Builder Runtime
- Tool registry and action registry
- AI-generated block creation flow (schema, renderer/editor wiring, tests, docs draft)
- AI-generated command, shortcut, and macro creation
- AI-generated AI actions (meta-builder support)

### Automation Runtime
- Trigger/condition/action automation builder
- Silent automation mode (approved background runs)
- Scheduled and publish-time automations
- AI-generated automation recipes and approval workflows

### Media Intelligence
- Image generation pipeline with separate model routing
- Prompt assist, style presets, variation/regenerate flow
- Auto alt-text and caption suggestion flow

### Governance & Safety
- Prompt-injection hardening and policy guardrails
- Human-approval checkpoints for write actions
- Action-level audit logs and replayable run history
- Cost controls, rate limiting, and failure handling

---

## ✅ Exit Criteria

Phase 4 is complete only when all criteria pass:

1. All Phase 4 rows in `docs/FEATURES.md` are `✅` and mapped to implementation/tests.
2. AI control center GUI supports provider/model/key CRUD with validation and secure storage.
3. Text and image tasks are routed by separate capability profiles.
4. AI Builder can create and register at least one new block + one new command + one new shortcut via tool flow.
5. AI Builder can add at least one new AI action through the same tool runtime.
6. Automation system supports at least one silent automation and one approval-required automation.
7. Every AI execution path writes audit events with trace IDs and outcome status.
8. Full quality gates pass:
   - `npm run docs:check`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - `npm run test`

---

## 🗂️ Session Plan (R4-1 to R4-18)

### R4-1 — AI package scaffold + capability contracts
- Define `@pulse/ai` package structure and capability interfaces.
- Add `text_generation`, `image_generation`, `builder_tools`, and `automation` capability types.
- Add base tests for capability resolution.

### R4-2 — AI brief and context model
- Implement document-level AI brief schema and storage.
- Implement context pack resolver (topic + nearby blocks + selection).
- Add tests for context assembly determinism.

### R4-3 — Inline invocation UX
- Implement inline AI launcher (`Cmd/Ctrl + J`) and selection-aware commands.
- Add apply modes (`replace`, `append`, `new block`) with preview state.
- Add interaction tests around cursor/selection transitions.

### R4-4 — Provider registry GUI
- Build provider management panel (add/edit/remove provider, endpoint, auth mode).
- Build AI Studio tabs for feature/command/shortcut/action/automation catalogs.
- Add provider validation and health-check probe flow.
- Add UI tests for provider panel state transitions.

### R4-5 — Secure key and model profile management
- Implement secure API key storage integration path.
- Implement model profile CRUD (temperature, max tokens, timeout, budgets).
- Add tests for key redaction and profile fallback behavior.

### R4-6 — Capability router (text vs image split)
- Implement capability router with independent text and image model routes.
- Implement fallback chain policy by capability.
- Add routing tests for model failure and fallback selection.

### R4-7 — Tool runtime foundation
- Build tool invocation contract with strict input/output schemas.
- Add permission levels (`read`, `suggest`, `apply-with-approval`).
- Add audit envelope and trace ID generation.

### R4-8 — AI Builder: block creation toolchain
- Implement `createBlockType` tool flow (schema + registration patch proposal).
- Add generated test scaffolding and docs draft output.
- Add approval gate before any write action.

### R4-9 — AI Builder: command/shortcut/macro tools
- Implement `addCommand`, `addShortcut`, `addMacro` tools.
- Implement conflict checks and rollback-safe proposals.
- Add regression tests for command and shortcut generation.

### R4-10 — AI Builder: AI action generator (meta-builder)
- Implement `createAiAction` tool to register new AI actions.
- Support action metadata (name, category, params, safety level).
- Auto-refresh AI Studio catalogs after generated-action registration.
- Add tests for action registry updates and validation failure cases.

### R4-11 — Automation engine core
- Implement trigger/condition/action runtime engine.
- Add run orchestration with retries, timeouts, and deterministic logs.
- Add tests for multi-step automation execution.

### R4-12 — Silent automation mode
- Implement policy-driven silent runs (pre-approved action scopes only).
- Add budget ceilings (token/cost/run-frequency).
- Add tests for silent mode guardrail violations.

### R4-13 — Automation recipe builder UX
- Implement GUI builder for automation recipes.
- Support schedule, publish, and manual triggers.
- Add tests for recipe validation and persistence.

### R4-14 — Image generation flow
- Implement image request pipeline with separate image model route.
- Add prompt helper, style presets, regenerate/variation actions.
- Add tests for image workflow fallback and metadata payload.

### R4-15 — Media enrichment
- Implement auto alt-text and caption suggestions.
- Implement style-to-theme matching hints for generated media.
- Add tests for accessibility metadata completeness.

### R4-16 — Safety and governance hardening
- Implement prompt injection defenses and policy guardrails.
- Implement redaction options and confidence/hallucination risk tags.
- Add policy enforcement and rejection-path tests.

### R4-17 — Auditability and observability
- Implement action audit stream + searchable execution history.
- Add trace correlation between UI action and tool/runtime logs.
- Add tests for audit completeness and replay references.

### R4-18 — Stabilization and handoff
- Run full quality gates and fix Phase 4 regressions.
- Close all Phase 4 `docs/FEATURES.md` rows.
- Document handoff contracts for Phase 5 (SEO Intelligence).

---

## 📌 Execution Log

*No implementation sessions yet.*

---

## ⚠️ Risks

- Prompt injection or unsafe tool invocation can bypass expected policy unless every action path is guarded.
- Silent automations can create hidden regressions without strict scope + budget policies.
- Provider API changes can break model routing unless adapters are versioned.
- Cost growth can become unbounded without per-workspace controls and telemetry.
- AI-generated code quality can drift without mandatory tests and approval checkpoints.

---

## 🔄 Handoff to Phase 5

Phase 5 starts when Phase 4 provides:

- Stable AI invocation + automation runtime contracts.
- AI Builder action/tool registry with approval policy framework.
- Reliable model routing infrastructure and provider health checks.
- Audit/event telemetry required for SEO workflow tracking and optimization loops.
