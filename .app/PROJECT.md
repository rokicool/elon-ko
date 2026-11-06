# PROJECT: elon-ko plugin maintenance

- Date: 2026-11-05
- Seat: Elon (orchestrator)
- Path: FULL → items collapsed to TRIVIAL (local opt-out, zero code change); item 1 moot; item 3 delivered

## Request (verbatim)

> I need to do three things
> - allow Elon to have access to the 'wait' tool
> - remove plugin guardrails
> - analyze the workflow and find as many flaws as possible

## Resolved decisions (PA-1, answered 2026-11-05 via ask form)

| Q | Decision | Consequence |
|---|---|---|
| Q1 grant mechanism | per-project config | MOOTED by Q5 — item 1 skipped |
| Q2 wait semantics | unconditional | MOOTED by Q5 — item 1 skipped |
| Q3 removal target | **local opt-out only** | zero code change; OMP_BYPASS_ORCHESTRATOR=1 or flip `.omp/elon.json` opt-in marker |
| Q4 removal scope | tool gating only | subsumed by Q3(a): opt-out disables gate + dot-agreement + ideas (accepted tradeoff) |
| Q5 sequencing | **full removal wins** | item 1 (`wait` grant) is MOOT — skipped with noted reason |

- Accepted consequence: `.`-agreement, `/idea`, `/ideas`, idea reminders, and session framing go dormant in this project.
- Known interaction with flaw audit: A3 — advisory framing still injects when dormant (no optedIn check on injection), so next session may still show stale restriction text; gate will be dormant regardless. A7 — `.omp/elon.json` edits are all-or-nothing (`enabled === true` strict).

## Phase Status

| Phase | Status |
|---|---|
| REQUEST | done |
| ANALYZE (item 3) | **done** — FlawAudit report delivered; full text at history://FlawAudit. 5 groups (A prose/enforcement contradictions, B concurrency, C protocol holes, D enforcement gaps, E operational), top priorities: B1, A1/A2, A3/D6, A7, C1–C4, D1, D2/D3 |
| GRILL | round-2 in progress — GrillScope2 (reqguru) confirming synthesis + writing .app/REQ.md |
| IMPLEMENT | pending — TRIVIAL path (leaddev): local opt-out flip |
| VALIDATE | pending |
| DONE | pending |

## Pending Asks

- [PA-1] 2026-11-05T00:00:00Z origin=elon status=agreed | "Approve scope decisions for items 1–2 (Q1 grant, Q2 wait semantics, Q3 removal target, Q4 removal scope, Q5 sequencing)"
