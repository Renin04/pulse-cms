---
name: lean
description: "Token-lean delegation: brief templates for scout/worker, reuse rules, usage measuring. Read before delegating."
---
# Lean delegation

Always-on rules: `.claude/rules/lean.md`. This file = how to do it well.

## Flow for a non-trivial task
1. **Locate** (scout, 1 message): where is the code/data, what are the constraints.
2. **Decide** (main): approach + spec. Read only the `path:line` ranges scout returned.
3. **Execute** (worker, 1 message per unit of work; same worker for all units, sequentially).
4. **Review** (main): `git diff --stat` then the diff of risky files only. Fix small things inline; send larger fixes back to the same worker.

Skip steps that are not needed. A 2-file fix is done inline with zero subagents.

## Scout brief template
```
GOAL: <one question>
SCOPE: <dirs/files/globs; or URLs>
KNOWN: <what is already established, so it is not re-derived>
RETURN: ANSWER/EVIDENCE format, ≤150 words [or: write table to <path>, reply path + 3 lines]
```

## Worker brief template
```
GOAL: <outcome in one line>
FILES: <path[:lines]> ... (only these may change)
SPEC: <numbered, concrete changes; exact names, signatures, strings>
DON'T: <things that look tempting but are out of scope>
DONE-CHECK: <command that must pass>
RETURN: standard worker format
```
A brief must be executable without reading anything the brief does not name. If you cannot write it that concretely, the deciding is not finished: do not delegate yet.

## Reuse
- Keep the agent id/name from the first spawn. Every later task, related or not: `SendMessage` to it.
- Respawn only when its context is polluted (>~150k tokens or a long wrong path); say so in one line.
- Subagents that must not have seen the text (critics) are the exception: one per role per run, still resumed between rounds/items.

## When NOT to delegate
- Work that needs the whole conversation's nuance (final prose, user-facing wording, tradeoff calls).
- Anything under ~5 tool calls.
- Irreversible/outward actions (push, publish, deploy, send): main does these itself.

## Session hygiene (user-side levers, remind once when relevant)
- One task per session; `/clear` between unrelated tasks.
- A pause >1 h drops the prompt cache: the next message re-bills the whole context at full input price. Finish or `/compact` before leaving.
- Switching model mid-session also rebuilds the cache. Pick the model at the start.
- Routine/mechanical sessions: start on Sonnet. Fable/Opus for design, hard debugging, final judgment.
- Advisor (`/advisor`) is off by default: each call re-reads the full transcript uncached on the stronger model. Use it only on a Sonnet main session, for a long task, sparingly.

## Measure and monitor
- `lean-guard` (hook) enforces big-read and agent-reuse rules and notes context growth; fire counts per session in `~/.claude/lean/guard/<session>.json` (`fired`).
- `.claude/lean/bin/lean-stats` (current project, last session) · `.claude/lean/bin/lean-stats --all` · `.claude/lean/bin/lean-stats <session.jsonl>`: per model requests, fresh input, cache write/read, output, list-price cost; main vs subagents.
- Recording is automatic: Stop/SessionEnd hooks run `lean-log --hook` (no model tokens). Records: `~/.claude/lean/usage/<project>/<session>.json`, synced to branch `lean-usage` of the repo's origin (`sessions/<project>/<session>.json`). `LEAN_USAGE_REMOTE=<git url>` sends every project's records to one repo; `LEAN_USAGE_OFF=1` disables.
- Local history: `lean-log --backfill` then `lean-log --sync`.
- Dashboard: `lean-dash [--out FILE] [repo ...]` builds one self-contained HTML (limits, trend by model, token mix, routing savings, before/after, projects, top sessions). `--artifact` for publishing as a Claude artifact.
- Hosted dashboard `https://claude.ai/artifact/1a3VpWqV7s4gQ4B6V2iz8H` is refreshed every 4 h by the scheduled task «lean-dashboard-refresh», which wakes one persistent Haiku cloud session («lean dashboard refresh», holds this repo) to build with `lean-dash --artifact` and republish to the same `url` (a fresh-session task has no repo and cannot do it); local file `LEAN_DASH_OUT` (default `~/lean-usage.html`) is rebuilt by the hook after each sync.
- Official 5h/7d percentages exist only in local sessions (status line, `lean-log --statusline`, set by `install.sh --user` when no status line is configured). Cloud: calibrate by hand in the dashboard.
- Local installs self-update: once a day the hook pulls the kit clone (`LEAN_KIT_DIR`) and re-runs `install.sh --user` when `lean/` changed.
- Context cap: `modelSettings.*.autoCompactWindow` = 200000 (cache reads were 60% of measured cost; raise it if long sessions lose needed detail).
- Compare before/after on the same kind of task; do not trust estimates.
