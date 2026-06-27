# PROJECT.md — Idea/Suggestion Storage Extension

## Brief
Analyze the agent-communication protocol (`skill://elon`) and design an extension
for **ideas/suggestions storage** under `.app/`: capture worthwhile-but-out-of-
scope work, persist it, let Elon remind the user about relevant stored ideas, and
allow promotion of an idea into the FULL workflow.

## Classification
**FULL** — new orchestrator-protocol extension (Plugin A code + advisory prose).

## Workflow Path
FULL: REQUEST → GRILL → RESEARCH → SPEC → DEVELOP ⇄ VALIDATE → DONE

## Current Phase
**GRILL gate + RESEARCH gate both reached.** `.app/REQ.md` (R1–R5, AC1–AC14,
§6 assumptions) and `.app/RESEARCH.md` (substrate verified, R1–R6 integration
options, U1–U9 for SPEC) produced and committed. **Awaiting PA-1 (accept §6
assumptions) to enter SPEC.** Verdict from RESEARCH: all forks feasible, PROCEED
to SPEC, no GRILL loopback.

## Resolved Requirements (GRILL round 1 — user-confirmed)
- **A. Capture:** BOTH — user (NL phrase or `/idea`) + agents (guarded proactive parking). Immediate ack.
- **B. Storage:** single `.app/IDEAS.md`, append-style; **writes owned by DocWorm** (Elon's `write` stays `PROJECT.md`-only). *Verified: no agent-definition edit needed — DocWorm frontmatter already permits the write (RESEARCH F5.2).*
- **C. Reminder:** proactive one-line pointer on relatedness (keyword/tag overlap, capped 1–2) + on-demand `/ideas`; opt-out flag.
- **D. Enforcement:** advisory prose in `skill://elon` **+** turn-start hard hook = `before_agent_start` `{message}` injection (mirrors `dot-agreement`, RESEARCH F2.2/R2). *Note (RESEARCH U7): advisory layer is protocol prose only — system-attributed injection is not reachable.*
- **E. Lifecycle:** Ideas **distinct** from Pending Asks; **promotable** into a fresh `REQ.md` (`status=promoted`, kept for audit). Separate file/parser/customType — no collision with `dot-agreement` (RESEARCH F3.3).

## REQ.md §6 — Assumptions pending user accept (PA-1, override surface before SPEC)
1. NL trigger phrases (`idea:`, `park this idea:`, `we should … later`, …); `/idea` unambiguous fallback.
2. Agent rubric: out-of-scope AND plausibly valuable AND specific (all 3) + Elon veto.
3. Agent-initiated captures surfaced only when promoted to parked.
4. Promotion conflict with active REQ.md → Pending Ask, no clobber.
5. Status machine: `parked → promoted | rejected (re-openable) | superseded`.
6. Per-idea schema: id, created, source, title, body, tags, status + optional promoted_to/at, superseded_by, notes.
7. `notes` append-only.
8. Matcher: token-set intersection, min-overlap 1, older-first, **cap 2/turn**. **Refinement (RESEARCH R4): opt-out lives in `.omp/elon.json` (`ideas.reminders:false`) + env `OMP_IDEA_REMINDERS=0`, not a PROJECT.md line** — established config channel.
9. Hook: read parked IDEAS.md entries (via `node:fs`, read-only), tokenize request, inject ≤2 as advisory framing — **user turns only**.
10. `/ideas` lists non-terminal; `/ideas all` includes terminal (audit).

## RESEARCH — key substrate facts (for SPEC)
- Extension = new `src/*.ts` in `package.json#omp.extensions`; `import {optedIn}` for dormancy parity (RESEARCH F1.1–F1.4).
- Reminder hook = `before_agent_start` returning `{message:{customType:"elon-ko-gate:idea-reminder",content,display:false,attribution:"user"}}` (RESEARCH F2.2/R2).
- `.app/IDEAS.md` auto-tracked by `.gitignore` `!.app/*.md` (RESEARCH F3.1); parser mirrors `mostRecentPendingAsk` (tolerant, never-throws) (F3.3).
- DocWorm writes; extension reads via `fs`; Elon `[PROTO]`-commits (RESEARCH F5.2–F5.5).
- Zero runtime deps (RESEARCH U3/U9); atomic write via temp+`fs.rename` (U4).
- SPEC must resolve U1 (block grammar), U2 (opt-out key), U5 (reminder cadence mid-workflow), U6 (customType name), U8 (`/idea` write routing).

## Known Extension Surface
Plugin A `elon-ko-gate` (`src/*.ts`, `package.json#omp.extensions`); Plugin B `elon-ko-agents` (`plugins/agents/agents/*.md`). Enforcement: `enforce-orchestrator`, `dot-agreement`, `mess-transport`.

## Phase Log
- 2026-06-27 REQUEST — classified FULL, created PROJECT.md, routed to ReqGuru.
- 2026-06-27 GRILL r1 — 5-fork batch relayed; user resolved all five.
- 2026-06-27 GRILL gate — `.app/REQ.md` written + committed `[PROTO]` (dc2fbb5).
- 2026-06-27 RESEARCH gate — DrPe wrote `.app/RESEARCH.md` (verified substrate, forks feasible, PROCEED to SPEC).

## Pending Asks
- [PA-1] 2026-06-27 origin=elon status=pending | "Accept REQ.md §6 assumptions (10 defaults; §6.8 refined per RESEARCH to use `.omp/elon.json`) and proceed to SPEC? Reply `.` to accept all; or name any to override."
