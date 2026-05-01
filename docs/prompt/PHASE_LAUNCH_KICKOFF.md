# Launch Readiness Gate — Session Kickoff Prompt

> Use this prompt at the start of every session in the Launch Readiness Gate.
> Copy this into the chat and fill in the session number.

---

You are continuing work on the Pulse project in the **Launch Readiness Gate**.

First, follow `docs/AGENT_PROMPT.md` startup protocol exactly:
1. Read `docs/memory/CONTEXT_SNAPSHOT.md`
2. Read `backlog/BACKLOG.md`
3. Read `backlog/DECISIONS.md`
4. Read `phases/PHASE_LAUNCH_READINESS.md`
5. Read the current session plan in `phases/PHASE_LAUNCH_READINESS.md` (session L-__)

If the session involves block, renderer, or CMS testing, also read:
- `docs/launch/BLOCK_TEST_MATRIX.md`
- `docs/launch/SECURITY_AUDIT_CHECKLIST.md`
- `docs/launch/PERF_AUDIT_CHECKLIST.md`
- `docs/launch/BUG_LOG.md`

**Session focus:** L-__ — ________________

**Rules for this session:**
- Do not implement new features. This phase is validation, bug fixes, and hardening only.
- If a bug requires a feature-level change, log it in `docs/launch/BUG_LOG.md` and discuss
  with the user before expanding scope.
- Every session that includes manual testing must provide a structured **User Feedback
  Checklist** telling the user exactly what to test and how to report results.
- Run tests after any code change, but avoid long unrelated test runs.
- Run `npm run build` before session close if code was changed.

**At session end, update:**
- `docs/launch/BUG_LOG.md` (new findings, status changes)
- `docs/launch/BLOCK_TEST_MATRIX.md` (if block QA was performed)
- `backlog/BACKLOG.md`
- `backlog/DONE.md`
- `docs/memory/CONTEXT_SNAPSHOT.md`
- `docs/memory/CONVERSATION_LOG.md`
- `docs/FEATURES.md` (only if a feature status changes due to a fix)
- `backlog/DECISIONS.md` (only if a real architectural decision is made)

**User feedback protocol:**
- The agent must ask the user to test specific blocks, flows, or surfaces.
- The agent must provide clear steps and expected outcomes.
- The user reports `PASS`, `FAIL`, or `PARTIAL` with observations.
- The agent logs findings in the bug log and updates matrices.

Also remember:
- I'm on Windows, but you're running on WSL. My project is located at `pulse` folder on my desktop.
- You've got some tools on WSL that you can use to work better; you can read the entire list at:
  `C:\Users\z0512\Desktop\ai-agent-tools.md`
- Browser-dependent E2E (Playwright) remains skipped unless I explicitly tell you otherwise.
