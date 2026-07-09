# PROJECT — Per-Agent Model Assignment (omp harness)

## Request
Research how the oh-my-pi (omp) harness assigns models to agents/subagents.
Goal: find the syntax to assign each team member (reqguru, drpe, leaddev, middev,
validator, docworm, wrapper, hr) a omp-defined model, with fallback to the default
when a model is not specified.

## Classification
FULL — research phase.

## Workflow
REQUEST → GRILL → **[RESEARCH]** → SPEC → DEVELOP ⇄ VALIDATE → DONE

## Current Phase
RESEARCH — delegated to `drpe`.

## Pending Asks
(none)

## Notes
- Relates to parked IDEA-003 ("Is marketplace.json agents[] load-bearing?").
- One coding session may run different subagents on different models.
- Requirement: undefined model → fall back to the default (must not hard-fail).
