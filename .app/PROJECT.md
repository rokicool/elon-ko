# PROJECT — Logging Design & Development Skill

## Summary
Create a skill (knowledge/methodology artifact) that formalizes how logging support is designed
and developed in projects. The skill must be available to drpe, leaddev, middev, validator, and
docworm so that every agent applies a consistent logging methodology.

## User-Supplied Principles (verbatim)
1. Logs must be clear.
2. Every log entry should include its **type** (WRN, MSG, ERR, VRB, …).
3. Every log entry should include its **source** (module, function, script name).
4. Every log entry should include the **goal of the operation** with full information about parameters.
5. If a parameter is a **secret**, represent it as first three characters + length — e.g. `AbC(30)`.
6. User explicitly invited additional rules: "Suggest more rules if you believe they are important."

## Classification
FULL — new skill artifact, cross-cutting methodology, design decisions required.

## Workflow
- [x] REQUEST  — captured here; scope ambiguous → GRILL.
- [~] GRILL    — ReqGuru interviews user. Was BLOCKED by delegation gate; user chose "fix gate, retry".
- [ ] RESEARCH — conditional.
- [ ] SPEC     — LeadDev Technical Specification.
- [ ] DEVELOP  — LeadDev/MidDev implement the skill artifact.
- [ ] VALIDATE — Validator audits skill against spec.
- [ ] DONE     — present deliverable.

## Open Ambiguities (for ReqGuru to resolve)
- Target scope: language-agnostic methodology vs. language-specific?
- Type taxonomy: closed set {WRN,MSG,ERR,VRB} vs. extensible? canonical list?
- Secret detection mechanism: name patterns / type-based / allowlist? nested/structured params?
- Granularity of "goal + full params": every line, or operation-boundary lines only?
- Representation: human-readable one-line, structured/JSON, or both?
- How is the skill scoped to exactly {drpe, leaddev, middev, validator, docworm}?

## Candidate Additional Rules (Elon suggestions, for ReqGuru to weigh)
- Timestamps (UTC ISO-8601, fixed precision).
- Correlation / request / trace IDs.
- Separate log LEVEL (severity) from log TYPE (semantic category).
- Stable structured fields + deterministic ordering.
- PII / sensitive (non-secret) data handling.
- Side-effect-free logging that never throws.

## BLOCKER log — orchestrator delegation gate (2026-08-10)
- `elon-ko-gate` rejected every team-agent spawn with `agent=(none)` across 8 attempts.
- Harness `task` schema = omp batch form `{context, i, tasks}` (additionalProperties:false);
  agent is per-item `tasks[].agent`; gate reads top-level `agent` → always (none).
- write also gated to `.app/PROJECT.md` only (could not file xd://report_issue).
- User decision: "Fix the gate, then I retry." Retrying delegation now.

## Decision Log
- 2026-08-10 — Classified FULL. Routed to ReqGuru for GRILL.
- 2026-08-10 — Delegation blocked by gate/tool-schema mismatch. Escalated to user.
- 2026-08-10 — User chose "Fix the gate, then retry." Retrying.

## Pending Asks
(none active — awaiting delegation retry result)
