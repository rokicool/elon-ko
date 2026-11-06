# Requirements — Local Orchestrator-Guardrail Opt-Out (elon-ko dev repo)

## Goal
Make all elon-ko plugin guardrails dormant **for this repo install only**, via the
existing opt-in marker — zero changes to shipped plugin code.

## Resolved Decisions (GRILL round 2, user answers final)
| # | Decision | Answer | Status |
|---|----------|--------|--------|
| Q1 | Where `wait` is allowed | Per-project config | **SKIPPED (mooted by Q5)** |
| Q2 | `wait` semantics | Unconditional | **SKIPPED (mooted by Q5)** |
| Q3 | Removal target | Local opt-out only | ADOPTED |
| Q4 | Removal scope | Tool gating only | **SUBSUMED by Q3** (opt-out is all-or-nothing) |
| Q5 | Sequencing | Full removal wins | ADOPTED; item 1 moot |

## Mechanism (no code change)
- src/enforce-orchestrator.ts:160-171 `optedIn()`: marker `.omp/elon.json` with
  `enabled:false` (or deleted file) → dormant. No src/ or package.json edit;
  src/enforce-orchestrator.ts:75 `ROOT_ALLOWED` untouched (no `wait` grant needed).
- Local marker exists today as `{"enabled": true}`; flip to `{"enabled": false}`.

## Accepted Feature Loss (all-or-nothing consequence of Q3/Q4(a))
Dormant in this project: `.`-agreement token (dot-agreement.ts:141), /idea & /ideas
(idea-storage.ts:499, 525), idea reminder re-injection (idea-storage.ts:467),
framing re-injection, and cross-instance messaging transport
(mess-transport.ts:656, 773, 821, 855, 868, 876). Accepted by user.

## Acceptance Checks
- AC1 (git-tracking caveat): `git ls-files .omp/elon.json` must return EMPTY.
  `.gitignore:4` lists it, so untracked is expected; if it IS tracked, DO NOT edit
  the marker (opt-out would ship to all clones) — use env route instead:
  `OMP_BYPASS_ORCHESTRATOR=1` (short-circuits optedIn at line 161).
- AC2 (guardrails dormant locally): in the next session in this repo —
  (a) root tool calls unrestricted (no orchestrator gate blocks);
  (b) `.` input passes through with no pending-ask injection;
  (c) `/idea`, `/ideas` report not opted in / no-op; no idea reminders injected.

## Non-Goals
- No shipped-plugin changes; no src/, test, package.json, or docs edits.
- No `wait` grant, no per-project `wait` config, no fine-grained tool gating.
