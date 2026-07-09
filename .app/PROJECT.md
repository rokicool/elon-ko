# PROJECT — Debugger Agent Role (IDEA-002)

## Request
Add a debug agent role to the elon-ko team pipeline. Promoted from parked idea
IDEA-002 ("Add debug agent role to the team pipeline").

Context: the DevOps orchestration workflow references `gsd-debugger` for pipeline-
failure debugging, but no debug agent exists in the team roster (8 agents: hr,
docworm, drpe, leaddev, middev, reqguru, validator, wrapper). Today, pipeline
failures fall back to `wrapper` or `leaddev`.

## Classification
FULL — new agent role: requires agent definition (hr), marketplace registration,
skill authoring, CI/test updates.

## Workflow
REQUEST → GRILL → ~~[RESEARCH]~~ → SPEC → DEVELOP ⇄ VALIDATE → DONE

RESEARCH skipped — IDEA-003 largely pre-resolved (agents[] metadata-only, count
not an omp field, schema validation LOW risk). Remaining confirmation folded into
SPEC as a design decision.

## Current Phase
SPEC — REQ.md locked at GRILL COMPLETE. Handing to LeadDev for design spec.

## GRILL Decisions (locked, user-confirmed)
| # | Decision | Resolution |
|---|---|---|
| D1 | Scope | Both — CI/CD pipeline failures + general codebase/runtime bugs |
| D2 | Capability | Diagnose ONLY — read-only root-cause report; another agent applies fix |
| D3 | Model tier | pi/task |
| D4 | Name | `debugger` |
| D5 | Pipeline | On-demand by Elon; no new phase; PROTO.md Agent-to-Phase Map row still mandatory |
| D6 | Registration | Add to marketplace.json agents[] + dedicated count field; resolves IDEA-003 inline |

Tool allowlist: `read, bash, search, find, lsp, debug` (repo token convention;
NOT grep/glob). No edit/write/ast_edit/ast_grep (diagnose-only). No spawns (solo).

## Tensions (flagged, non-blocking)
- T1: D5 "no PROTO.md change" vs HR-mandatory Agent-to-Phase Map — resolved (registration row mandatory, no new phase subsection).
- T2: Name `debugger` ≠ DevOps workflow `gsd-debugger` reference — accepted gap.

## Previous workflow
v2.5.0 (Per-Agent Model Assignment) — DONE, shipped. See git history + release artifacts.

## Pending Asks
(none)
