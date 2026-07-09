# PROJECT — Per-Agent Model Assignment (omp harness)

## Request
Research how the oh-my-pi (omp) harness assigns models to agents/subagents.
Goal: find the syntax to assign each team member a omp-defined model, with
fallback to the default when a model is not specified.

## Classification
FULL — research phase.

## Workflow
REQUEST → GRILL → [RESEARCH] → SPEC → DEVELOP ⇄ VALIDATE → **DONE**

## Current Phase
DONE — research deliverable complete; committed as [PROTO].

## Outcome
The mechanism exists and the required fallback ("not defined → default") is
already built into the omp harness — verified against source
(model-resolver.ts resolveAgentModelPatterns, task/index.ts #runSpawn).

Three assignment levers (precedence high→low):
1. task.agentModelOverrides (config.yml, keyed by agent name) — no code change
2. model: frontmatter on agent .md files (prefer pi/task alias)
3. inherit parent session active model (current behavior for all 8 agents)

Fallback chain (never hard-fails):
  agentModelOverrides[name] → frontmatter model: → parent active model
  → modelRoles.default → findInitialModel  (+ auth-fallback to parent model)

No implementation required to satisfy the stated requirement. Assigning
specific models per role is a config decision available on request.

## Pending Asks
(none)

## Notes
- Resolves IDEA-003 (marketplace.json agents[] is metadata-only; not
  load-bearing for model selection; no model/count field in schema).
- Report: .app/RESEARCH.md (14 primary sources, 0 unverified items).
