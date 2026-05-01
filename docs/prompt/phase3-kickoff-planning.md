# Phase 3 Kickoff — Full Planning + Phase 1/2 Retrospective Audit

> **Scope change applied:** Phase 6 (Theming & UI Polish) is merged into Phase 3.
> Phase 4 = AI Features. Phase 5 = Platform/Expansion. Phase 6 is retired.

## Session Goal

This session has two sequential, non-skippable objectives:

1. **Retrospective audit** of Phase 1 and Phase 2 deliverables — identify real gaps,
   integration risks, and anything that must be resolved before adding renderer complexity.
2. **Full Phase 3 planning** — exhaustive plan covering every feature in `docs/FEATURES.md`
   tagged to Phase 3 **plus all Phase 6 theming/UI features** (now merged). P0 through P2,
   nothing deferred. All planning artifacts updated with session-granular task breakdowns.

---

## Step 0 — Context Load (mandatory, do this first)

Read these files in order before doing anything else:

1. `docs/AGENT_PROMPT.md`
2. `docs/memory/CONTEXT_SNAPSHOT.md`
3. `backlog/BACKLOG.md`
4. `backlog/DECISIONS.md`
5. `docs/FEATURES.md` — extract every row where Phase = 3 **and Phase = 6**
6. `docs/ARCHITECTURE.md`
7. `phases/PHASE_PRE_MIGRATION_03.md` — style reference and retrospective context

---

## Step 1 — Apply Scope Restructuring to `docs/FEATURES.md`

Before the audit, apply the agreed phase restructuring:

- All Phase 6 rows (`CSS variables`, `Theme system`, `Custom CSS`, `Font customization`,
  `Dark mode`, `Accessibility` full sweep, `Mobile editing`) → reassign to **Phase 3**
- Phase 4 remains: AI Features (unchanged)
- Phase 5 remains: Platform/Expansion (unchanged)
- Delete or retire the Phase 6 label — it no longer exists as a separate phase
- Update the summary table at the bottom of `FEATURES.md` (merge Phase 6 counts into
  Phase 3 row, remove Phase 6 row)
- Update `Total Features`, `Last Updated`

Record this as decision **D004** in `backlog/DECISIONS.md`:
> Phase 6 (Theming & UI Polish) merged into Phase 3 (Renderer & Display) because CSS
> baseline and theming are renderer contracts, not afterthoughts. Renderer cannot ship
> a usable public API without a visual contract. Phase 4 = AI, Phase 5 = Platform.

---

## Step 2 — Phase 1 & Phase 2 Retrospective Audit

Review what was actually built. Be critical — do not rubber-stamp.

### 2a. Feature Completeness Check
- Confirm all Phase 1 and Phase 2 rows in `docs/FEATURES.md` are `✅`
- Flag any `✅` row that has no corresponding implementation or test file
- Expected result: zero `⬜` or `🟦` in Phase 1/2 (pre-migration closed this)

### 2b. Integration Risk Audit
For each risk below, decide: **fix now** (add task before R3-1) or **document and defer**
(add as known risk note). Do not silently skip any item.

- `@pulse/react` EditorBridge under React StrictMode (double-invoke, concurrent rendering,
  double-mount/unmount cycle)
- `VanillaEditorAPI` exercised against a real DOM surface (not just unit mocks)
- Circular dependency risk: `@pulse/react` importing from both `@pulse/core` and
  `@pulse/editor` — verify with import trace
- CommandRegistry alias normalization edge cases (RTL + bidi control characters in aliases)
- HistoryState push behavior under rapid successive mutations (debounce boundary)

For each: one line — what the risk is, decision made, and why.

### 2c. Missing Features Audit
Check whether any of the following are missing from `docs/FEATURES.md` entirely:
- Renderer public TypeScript API surface
- Server-side HTML serialization (distinct from SSR framework integration)
- Framework adapters (Next.js / Nuxt / Astro)
- Renderer theming contract (how a consumer overrides visual style per-site)
- CSS-in-JS vs plain CSS strategy decision for renderer block styles

If any are missing and belong in Phase 3, add them as new rows.
Assign Phase 4+ items correctly — do not inflate Phase 3 scope beyond renderer + UI.

---

## Step 3 — Phase 3 Feature Extraction

From `docs/FEATURES.md` (after Step 1 reassignment), extract every row where Phase = 3.
Include ALL priority levels (P0, P1, P2). Do not skip or defer any P2 items.

Expected groups after merge (verify against actual file):

**Core Rendering**
Block rendering (P0), Responsive layout (P0), SSR support (P1), Static generation (P1),
Lazy loading (P1), Error boundaries (P1)

**Animations & Interactions**
Click interactions (P0), Form submissions (P0), Scroll animations (P1), Fade in/out (P1),
Slide in/out (P1), Parallax effects (P2), Hover effects (P2), Progress tracking (P2)

**Layout Engine**
Single column (P0), Multi-column (P2), Grid layout (P2), Manga layout (P1),
Full-width blocks (P1), Sticky elements (P2), Custom spacing (P2)

**Reader Experience**
Table of contents (P1), Reading progress (P2), Estimated read time (P2),
Bookmarks (P2), Share buttons (P2)

**Advanced Block Types**
Code playground (P2), Branch block (P2), Conditional block (P2)

**Security**
CORS handling (P1), API key encryption (P1)

**Theming & UI (merged from Phase 6)**
CSS variables (P1), Theme system (P2), Custom CSS (P1), Font customization (P2),
Dark mode (P2), Accessibility full sweep (P1), Mobile editing (P2)

**Editor UI Polish (merged from Phase 5/6)**
Customizable toolbar (P2)

Also check: rows with Phase = `-` that logically belong in Phase 3 → reassign.

---

## Step 4 — Create `phases/PHASE_03_RENDERER.md`

Create the complete Phase 3 file. Use `phases/PHASE_PRE_MIGRATION_03.md` as the
**exact style reference** (same markdown structure, headings, emoji usage).

Required sections:

```
# Phase 3 — Renderer, Display & UI

**Status:** 🟦 In Progress (Session R3-1)
**Depends On:** Phase 1 (core), Phase 2 (editor, blocks)
**Blocks:** Phase 4 (AI)
**Estimated Sessions:** [derive from feature count]
**Priority:** P0

## 🎯 Goals
[4–6 concrete, measurable goals — renderer + CSS + theming + UI polish]

## 📦 Scope
[All features from Step 3, grouped by category, with priority labels]

## ✅ Exit Criteria
[Auditable — mirror the style of PHASE_PRE_MIGRATION_03.md]

## 🗂️ Session Plan (R3-1 to R3-N)
[Full session breakdown — see rules below]

## 📌 Execution Log
[Empty — filled as sessions complete]

## ⚠️ Risks
[Real risks from Step 2 audit + renderer/CSS-specific risks]

## 🔄 Handoff to Phase 4
[What Phase 4 specifically depends on from this phase]
```

**Session planning rules:**
- Session IDs: `R3-1`, `R3-2`, ..., `R3-N`
- P0 Core Rendering first, then Layout, then Interactions/Animations, then Reader UX,
  then Theming/CSS, then UI Polish, then Advanced Blocks + Security last
- Each session = one focused deliverable (one system, one feature group)
- Every session must list: goal, specific tasks, files to create/modify, acceptance criteria
- First 5 sessions fully detailed; sessions 6+ slightly less granular
- No feature from Step 3 may be omitted
- CSS baseline session goes before any layout or animation sessions

---

## Step 5 — Update `backlog/BACKLOG.md`

Replace the Phase 3 placeholder with full task entries.
Follow the **exact existing format**:

```markdown
### Phase 3: Renderer, Display & UI

#### Session R3-1 — [Topic]
- ⬜ [Task description] [P0]
- ⬜ [Task description] [P0]

#### Session R3-2 — [Topic]
- ⬜ [Task description] [P1]
```

Hard constraints:
- `⬜` only — never `✅` in `BACKLOG.md`
- Every task from the phase file must appear here
- Keep `## 🔮 Future Roadmap` section untouched (Phase 4, Phase 5 items stay there)
- After editing, run `npm run docs:check` and confirm it passes

---

## Step 6 — Update Memory Artifacts

### `docs/memory/CONTEXT_SNAPSHOT.md`
- Current phase: Phase 3 — Renderer, Display & UI
- Phase 3 status: 🟦 In Progress (Session R3-1 next)
- Add `phases/PHASE_03_RENDERER.md` as ✅ created
- Update next session goal
- Current session number: Session 35

### `docs/memory/CONVERSATION_LOG.md`
Append Session 35 entry:
- Phase restructuring decision (D004)
- Retrospective audit findings from Step 2
- Phase 3 planning decisions
- Files created/updated
- Next session goal (R3-1 topic)

---

## Step 7 — Quality Gate

Run in sequence, all must pass:

```bash
npm run docs:check
npm run lint
npm run typecheck
npm run build
npm run test
```

Report exact test count. Must be 251/251 or higher.

---

## Step 8 — Deliver Planning Summary

### Phase Restructuring Applied
- D004 recorded: Phase 6 merged into Phase 3
- Phase 4 = AI Features, Phase 5 = Platform/Expansion
- FEATURES.md updated: Phase 6 rows → Phase 3

### Retrospective Findings
- Phase 1/2 completeness: [confirmed / gaps found]
- Integration risks resolved: [list]
- Integration risks deferred: [list with rationale]
- New features added to FEATURES.md: [list or "none"]

### Phase 3 Plan Summary
- Total features: [N] | P0: [N] | P1: [N] | P2: [N]
- Total sessions: [N]
- First session (R3-1): [topic and goal]
- Estimated completion: [N sessions]

### Files Updated
- ✅ `backlog/DECISIONS.md` — D004 added
- ✅ `docs/FEATURES.md` — Phase 6 merged, [N] rows updated
- ✅ `phases/PHASE_03_RENDERER.md` — created
- ✅ `backlog/BACKLOG.md` — Phase 3 tasks added ([N] tasks)
- ✅ `docs/memory/CONTEXT_SNAPSHOT.md` — updated
- ✅ `docs/memory/CONVERSATION_LOG.md` — Session 35 appended

### Ready to Execute
- Next session: **R3-1 — [topic]**
- First task: [specific first task with file name]

---

## Constraints (non-negotiable)

- Repo: `/mnt/c/Users/z0512/Desktop/pulse`
- Do NOT `git commit` anything
- Do NOT install new dependencies without asking first
- Do NOT put `✅` in `BACKLOG.md` — `⬜` only
- React is a peer dependency — do not add it as a direct dep
- Next `DECISIONS.md` ID: **D004**
- Next `CONVERSATION_LOG.md` session: **Session 35**
- Session IDs in Phase 3: **R3-1, R3-2, ...** (not PM-X)
- Style must match existing files exactly — read them before writing
- `npm run docs:check` must pass after every docs/backlog edit
- Zero Phase 3 features may be deferred — exhaustive coverage required
- P2 items are not optional — include every single one
