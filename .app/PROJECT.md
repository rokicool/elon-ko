# PROJECT — Debugger Agent Role (IDEA-002)

## Request
Add a debug agent role to the elon-ko team pipeline. Promoted from parked idea
IDEA-002 ("Add debug agent role to the team pipeline").

## Classification
FULL — new agent role: agent definition, marketplace registration, skill, CI/docs.

## Workflow
REQUEST → GRILL → ~~[RESEARCH]~~ → SPEC → DEVELOP ⇄ VALIDATE → DONE

## Current Phase
VALIDATE — DEVELOP complete (all 12 ACs pass). Validator auditing against SPEC.

## GRILL Decisions (locked)
| # | Decision | Resolution |
|---|---|---|
| D1 | Scope | Both — CI/CD + general codebase debugging |
| D2 | Capability | Diagnose ONLY — read-only root-cause report |
| D3 | Model tier | pi/task |
| D4 | Name | `debugger` |
| D5 | Pipeline | On-demand by Elon; no new phase |
| D6 | Registration | marketplace.json agents[] + plugins[0].count=9 |

## DEVELOP Results
- **Created**: debugger.md (agent), debugger/SKILL.md (skill), 2 local mirrors
- **Modified**: marketplace.json, enforce-orchestrator.ts, PROTO.md, AGENTS.md,
  README.md, DEVREADME.md, elon_ko.sh (5), release.yml, CHANGELOG.md
- **CI**: validate-plugins.sh PASS, typecheck PASS

## Previous workflow
v2.5.0 (Per-Agent Model Assignment) — DONE, shipped.

## Pending Asks
(none)
