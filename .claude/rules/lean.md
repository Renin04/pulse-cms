# Lean mode (token + request budget)

Goal: best result for the fewest tokens AND fewest model requests. Applies to every model.

## Roles
- **Main (Fable/Opus, effort medium):** decide, write specs, review diffs. Reads little, writes little.
- **`scout` (Haiku):** any search/reading over >3 files or >400 lines, log/test/doc digging. Returns findings as `path:line` + ≤150 words.
- **`worker` (Sonnet):** mechanical or well-specified edits, bulk transforms, running+fixing tests. Returns ≤100 words + changed paths.
- Judgment-critical subagents (critics, medical/accuracy review, final prose): pass `model: opus` explicitly. Final user-facing prose and article text are written by main.

## Delegation
- Delegate only when the job needs >~5 tool calls or >~10k tokens of reading. Smaller: do it inline.
- Per run: at most one `scout` and one `worker`, plus the critics a routine names. **Never spawn a second one of the same type: reuse with SendMessage**, also for unrelated follow-up tasks. No fan-out, no Workflow tool.
- Brief = goal · exact paths (+line ranges) · constraints · done-check · reply format and word cap. No "explore the repo". Details and templates: skill `lean`.
- Long results go to a file; the reply carries the path + summary. Never paste file bodies back.

## Requests (each tool round = one request re-sending the whole context)
- Batch independent tool calls in one turn. Plan the reads, then issue them together.
- Grep first, then Read with offset/limit. Do not re-read a file already in context. `lean-guard` enforces this: a no-`limit` Read of a >500-line file is denied once in the main session (pass `limit` if the whole file is truly needed), as is a second scout/worker spawn.
- Noisy commands (tests, builds, installs, long logs): `.claude/lean/bin/lean-run <cmd>` (tail + error lines, full log on disk).
- A repeated multi-step procedure becomes one script call, not N model steps.
- Do not poll. Do not re-verify what a tool already confirmed.

## Output
- Internal text (notes, briefs, commit messages, docs, skills, routines): compact English. No preamble, no restating the task, no closing summary of what was just shown.
- Docs: bullets/tables over prose, one fact once, link instead of copy. Compress wording, never drop a rule or a number.
- Reply to the user: his language, ≤10 lines unless he asks for detail.
