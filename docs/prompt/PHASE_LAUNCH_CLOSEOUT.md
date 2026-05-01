# Launch Readiness Gate — End-of-Phase Closeout Prompt

> Use this prompt for the final session (L-14) of the Launch Readiness Gate.

---

You are performing the **Launch Readiness Gate closeout** for the Pulse project.

This is a PLANNING + DOCUMENTATION + VALIDATION session. No new feature code unless
required to fix a launch-blocking bug.

**Follow startup protocol exactly:**
1. Read `docs/memory/CONTEXT_SNAPSHOT.md`
2. Read `backlog/BACKLOG.md`
3. Read `backlog/DECISIONS.md`
4. Read `phases/PHASE_LAUNCH_READINESS.md`
5. Read `docs/launch/BUG_LOG.md`
6. Read `docs/launch/BLOCK_TEST_MATRIX.md`
7. Read `docs/FEATURES.md`

**Mandatory closeout tasks:**

1. **Bug Triage Finalization**
   - Ensure `docs/launch/BUG_LOG.md` has zero open `P0` bugs.
   - Ensure every open `P1` bug has a deferral rationale or is assigned a fix session.
   - Move closed bugs to the "Closed Bugs" table.

2. **Test Matrix Finalization**
   - Ensure `docs/launch/BLOCK_TEST_MATRIX.md` has no `⬜` cells for P0 blocks.
   - Note any blocks that remain untested with rationale.

3. **Quality Gates**
   - Run `npm run docs:check`
   - Run `npm run lint`
   - Run `npm run typecheck`
   - Run `npm run build`
   - Run `npm run test`
   - Report any failures and fix launch-blocking issues.

4. **Documentation Sync**
   - Update `docs/FEATURES.md` so all Phase 1-3 and PM4 rows are `✅` or intentionally
     deferred with rationale.
   - Update `backlog/BACKLOG.md` so only Phase 4 (AI) tasks remain open.
   - Update `backlog/DONE.md` with all launch-gate tasks.
   - Update `docs/memory/CONTEXT_SNAPSHOT.md` to reflect launch-ready state and unblock
     Phase 4.
   - Append a summary to `docs/memory/CONVERSATION_LOG.md`.

5. **Launch Sign-Off Document**
   - Create `docs/launch/LAUNCH_SIGNOFF.md` containing:
     - Date of sign-off
     - List of all sessions executed (L-1..L-14)
     - Summary of bugs found and closed
     - Security audit result
     - Performance audit result
     - User approval statement
     - Phase 4 unblocked confirmation

6. **Phase 4 Handoff**
   - Confirm `phases/PHASE_04_AI.md` is current.
   - Confirm `docs/PHASE_04_AI_KICKOFF_CHECKLIST.md` is current.
   - Update any handoff notes needed for the AI phase.

**Hard acceptance criteria for this closeout:**
1. Zero open `P0` bugs.
2. All quality gates pass.
3. `docs/FEATURES.md` is internally consistent with implementation state.
4. `docs/memory/CONTEXT_SNAPSHOT.md` marks Phase 4 as unblocked and ready for R4-1.
5. User confirms launch readiness.

**At the end, provide:**
- A concise "Launch Readiness Summary"
- Confirmation that Pulse is ready for launch as Editor + Renderer + CMS
- Confirmation that Phase 4 (AI) is unblocked
