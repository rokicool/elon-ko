# PROJECT.md — Idea/Suggestion Storage Extension

## Brief
Analyze the agent-communication protocol (`skill://elon`) and design an extension
for **ideas/suggestions storage** under `.app/`: capture worthwhile-but-out-of-
scope work, persist it, let Elon remind the user about relevant stored ideas, and
allow promotion of an idea into the FULL workflow.

## Classification
**FULL** — new orchestrator-protocol extension.

## Workflow Path
FULL: REQUEST → GRILL → RESEARCH → SPEC → DEVELOP ⇄ VALIDATE → DONE

## Current Phase
**GRILL gate reached** — `.app/REQ.md` produced (R1–R5 locked, §6 assumptions
pending user accept). RESEARCH (DrPe → `.app/RESEARCH.md`) running in parallel.
Next: SPEC (LeadDev) once assumptions accepted + research in.

## Resolved Requirements (GRILL round 1 — user-confirmed)
- **A. Capture:** BOTH — user (NL phrase or `/idea`) + agents (guarded proactive parking). Immediate ack.
- **B. Storage:** single `.app/IDEAS.md`, append-style; **writes owned by DocWorm** (Elon's `write` stays `PROJECT.md`-only).
- **C. Reminder:** proactive one-line pointer on relatedness (keyword/tag overlap, capped 1–2) + on-demand `/ideas`; opt-out flag.
- **D. Enforcement:** advisory prose in `skill://elon` **+** turn-start hard hook (mirrors `dot-agreement`).
- **E. Lifecycle:** Ideas **distinct** from Pending Asks; **promotable** into a fresh `REQ.md` (`status=promoted`, kept for audit).

## REQ.md §6 — Assumptions pending user accept (override surface before SPEC)
- §6.1 NL trigger phrases (`idea:`, `park this idea:`, `we should … later`, …); `/idea` is unambiguous fallback.
- §6.2 Agent rubric: out-of-scope AND plausibly valuable AND specific (all 3) + Elon veto.
- §6.3 Agent-initiated captures surfaced only when promoted to parked.
- §6.4 Promotion conflict with active REQ.md → Pending Ask, no clobber.
- §6.5 Status machine: `parked → {promoted | rejected(re-openable) | superseded}`.
- §6.6 Per-idea schema: id, created, source, title, body, tags, status + optional promoted_to/at, superseded_by, notes.
- §6.7 Notes append-only.
- §6.8 Reminder config: token-set intersection, min-overlap 1, older-first, cap 2/turn, opt-out via `idea_reminders=off` line in PROJECT.md.
- §6.9 Hook: read parked IDEAS.md entries, tokenize request, match, inject ≤2 as advisory (user turns only).
- §6.10 `/ideas` lists non-terminal; `/ideas all` includes terminal (audit).

## Known Extension Surface
`enforce-orchestrator` (tool gate), `dot-agreement` (hard `before_agent_start` hook + advisory text), `mess-transport`, `orchestrator-agents` (frontmatter). Elon owns `.app/` `[PROTO]` commits.

## Phase Log
- 2026-06-27 REQUEST — classified FULL, created PROJECT.md, routed to ReqGuru.
- 2026-06-27 GRILL r1 — ReqGuru returned 5-fork batch; relayed via `ask`; user resolved all five.
- 2026-06-27 GRILL gate — ReqGuru-2 wrote `.app/REQ.md` (R1–R5, AC1–AC14, §6 assumptions). Committed `[PROTO]`.
- 2026-06-27 RESEARCH — DrPe mapping extension substrate → `.app/RESEARCH.md` (running).

## Pending Asks
- [PA-1] 2026-06-27 origin=elon status=pending | "Accept REQ.md §6 assumptions (10 defaults) and proceed to SPEC? Reply `.` to accept all; or name any assumptions to override."
