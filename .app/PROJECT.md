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

## Current Phase
DEVELOP — SPEC complete (.app/SPEC.md, 39KB). LeadDev implementing per spec.

## GRILL Decisions (locked)
| # | Decision | Resolution |
|---|---|---|
| D1 | Scope | Both — CI/CD pipeline failures + general codebase/runtime bugs |
| D2 | Capability | Diagnose ONLY — read-only root-cause report; another agent applies fix |
| D3 | Model tier | pi/task |
| D4 | Name | `debugger` |
| D5 | Pipeline | On-demand by Elon; no new phase; PROTO.md Agent-to-Phase Map row mandatory |
| D6 | Registration | marketplace.json agents[] + plugins[0].count=9; resolves IDEA-003 inline |

Tool allowlist: `read, bash, search, find, lsp, debug`. No edit/write/ast_edit/ast_grep.
Solo agent: no spawns field.

## SPEC Summary
- **Create**: debugger.md (agent def), debugger/SKILL.md (skill), local mirrors
- **Modify**: marketplace.json, enforce-orchestrator.ts, PROTO.md, AGENTS.md,
  README.md, DEVREADME.md, elon_ko.sh (5 occurrences), release.yml, CHANGELOG.md
- **Don't touch**: mess-transport.ts, validate-plugins.sh, REQ.md

## Previous workflow
v2.5.0 (Per-Agent Model Assignment) — DONE, shipped.

## Pending Asks
(none)
