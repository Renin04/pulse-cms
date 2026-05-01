# Pulse — Agent Session Guide

> This document provides a detailed guide on how to interact with the AI agent for
> the Pulse project, ensuring efficient and effective development cycles.

---

## 1. The Agent's "Memory"

The AI agent has **no long-term memory** between sessions. Its entire understanding of the project state
is derived from specific files. This is by design to ensure consistency and prevent drift.

**Key Files for State:**

- `docs/memory/CONTEXT_SNAPSHOT.md`: The "current state" of the project. Updated at the end of each session.
- `backlog/BACKLOG.md`: The living to-do list. Tasks are moved from here when completed.
- `backlog/DONE.md`: A log of completed tasks.
- `backlog/DECISIONS.md`: Records of key architectural and design decisions.
- `docs/renderer/STYLING_GUIDE.md`: Renderer styling contract for CSS/theme/layout sessions.
- `[Phase File]`: e.g., `phases/PHASE_01_CORE.md`, detailing the current phase's goals.

---

## 2. Starting a New Session

Follow this exact protocol at the **beginning** of every interaction:
READ CONTEXT FILES:

docs/memory/CONTEXT_SNAPSHOT.md
backlog/BACKLOG.md
backlog/DECISIONS.md (recent entries)
The current phase file (e.g., phases/PHASE_01_CORE.md)
If the task includes renderer CSS/theme/layout: docs/renderer/STYLING_GUIDE.md
ASK FOR DIRECTION:

If the user hasn’t specified a task, prompt:

“We were last working on [summary from CONTEXT_SNAPSHOT]. What would you like to focus on today?”

Never assume context. Always re-read the essential files.

3. Managing the Context Window (e.g., 128K tokens)
To work effectively within a large context window, we prioritize file loading:

Priority 1: Always In Context (Core State, ≈20K tokens)

docs/AGENT_PROMPT.md (Your core instructions)
docs/memory/CONTEXT_SNAPSHOT.md (Current project state)
backlog/BACKLOG.md (P0/P1 tasks, concise)
backlog/DECISIONS.md (Recent key decisions)
Current Phase File (e.g., phases/PHASE_01_CORE.md)
docs/renderer/STYLING_GUIDE.md (when style/theme/layout work is in scope)
Priority 2: On-Demand Context (Relevant Details, ≈30K tokens)

docs/ARCHITECTURE.md
docs/VISION.md
Specific sections of docs/FEATURES.md relevant to the current task
Relevant code files (packages/...)
Priority 3: Reference Context (Background Info, ≈20K tokens)

docs/README.md
Other phase files
backlog/DONE.md
Recent parts of docs/memory/CONVERSATION_LOG.md
Remaining Space: For the current conversation and generated code/output.

Optimization Techniques:
Lazy Loading: Only load parts of large files (like FEATURES.md) when needed.
Summarization: Condense older logs or less critical files if context is tight.
Chunking: Break large code blocks into smaller, manageable pieces.
Pruning: Remove less relevant information from the context as the session progresses.
4. Example: First Session
User:

“Let’s start. Begin with Phase 1.”

Agent’s Internal Actions:

Reads CONTEXT_SNAPSHOT.md, BACKLOG.md, DECISIONS.md.
Identifies phases/PHASE_01_CORE.md as the current phase.
Reads BACKLOG.md and sees “Build Block Registry (P0)” is the first task.
Agent’s Response:

"Okay, starting Phase 1. According to the BACKLOG, the first task is to build the Block Registry (P0). This involves:

Defining TypeScript interfaces.
Implementing the BlockRegistry class.
Writing unit tests.
Shall we start with the interfaces, or would you like me to proceed?"

User:

“Proceed on your own.”

Agent’s Subsequent Actions:

Creates packages/core/src/types/block.ts.
Writes initial code for Block and BlockDefinition interfaces.
Appends task status to BACKLOG.md.
Updates CONTEXT_SNAPSHOT.md.
Responds: “Interfaces created for Block and BlockDefinition. Next up: the BlockRegistry class implementation. Shall I continue?”
5. Example: Mid-Session Check-in
User:

“Where are we currently in the project?”

Agent’s Actions:

Reads CONTEXT_SNAPSHOT.md.
Agent’s Response:

"We are in Phase 1. So far:

✅ Block interfaces (done)

✅ BlockRegistry class (done)

🟦 Unit tests (in progress - 60% complete)

We are currently writing unit tests for the BlockRegistry. Would you like me to continue with the tests, or is there another task you’d like to focus on?"

6. Ending a Session
When work is complete for the session, or the user indicates they are finished:

Summarize Progress: Append a summary to docs/memory/CONVERSATION_LOG.md.Include:
Tasks completed
Key decisions made
Next steps
Status of any ongoing tasks
Update CONTEXT_SNAPSHOT.md: Reflect the current state of the project.

(e.g., Phase, last completed task, progress percentage).

Update BACKLOG.md:

Mark completed tasks.
Update progress on ongoing tasks.
Add any new tasks identified during the session.
Record Decisions: If significant architectural or design decisions were made,

add them to backlog/DECISIONS.md with the date and reasoning.

Example CONVERSATION_LOG.md entry:

markdown

2026-04-01: Session Summary
Completed Tasks:

Implemented Block and BlockDefinition interfaces.
Developed the BlockRegistry class.
Wrote 15 unit tests for BlockRegistry.
Decisions Made:

Selected Zod for schema validation.
Decided to use a Singleton pattern for BlockRegistry.
Next Steps:

Complete remaining BlockRegistry unit tests.
Begin implementation of the Event System.
7. Communication Style
Be concise. Don’t repeat yourself unnecessarily.
Be direct. State what you’re doing, then do it.
Ask when unclear. If the task is ambiguous, clarify before proceeding.
Summarize briefly. At the end of work, use minimal wording. No bullet-point lists unless requested.
Bilingual support. User may write in Persian, but agent responses should remain in English.
8. Code Generation Rules
Write minimal code. Only what’s needed to solve the problem.
No unnecessary files. Don’t create summary docs or extra files unless requested.
Run or suggest targeted tests after code changes; avoid unrelated long test runs.
Run `npm run build` before session close so compile-time emit issues are caught incrementally.
Follow the architecture. Always refer to ARCHITECTURE.md for structure.
9. Initial Prompting for the Agent
When you first run the agent for a new project or a major restart, provide this prompt:

"You are now acting as a Senior Full-Stack Engineer and UX Designer for the Pulse project.

Your primary goal is to follow the instructions in AGENT_PROMPT.md and SESSION_GUIDE.md rigorously.

Start by performing the ‘Session Startup Protocol’ using the current files."

This ensures the agent begins with the correct mindset and immediately accesses the necessary state files.

Last Updated: 2026-04-01
