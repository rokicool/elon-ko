# PROJECT — Logging Design & Development Skill

## Summary
Create a skill (`logging-design`, a SKILL.md knowledge artifact) that formalizes how logging
support is designed and developed in projects. Available to drpe, leaddev, middev, validator,
docworm via trigger keywords.

## Classification
FULL — new skill artifact, cross-cutting methodology.

## Workflow
- [x] REQUEST  — captured.
- [x] GRILL    — DONE. Elon front-loaded the requirements interview via `ask` (ReqGuru delegation
                 was blocked by the gate). User answered all questions below.
- [~] SPEC     — LeadDev produces Technical Specification. **ACTIVE (pending delegation)**
- [ ] DEVELOP  — LeadDev/MidDev implement the skill artifact.
- [ ] VALIDATE — Validator audits skill against spec.
- [ ] DONE     — present deliverable.
- RESEARCH skipped — no technical unknowns (methodology is self-contained; skill structure follows omp SKILL.md convention).

## RESOLVED REQUIREMENTS (GRILL, 2026-08-10)

**Deliverable**: skill `logging-design` at `.claude/skills/logging-design/SKILL.md`, scoped to
agents {drpe, leaddev, middev, validator, docworm} via frontmatter description + triggers on:
logging, log, log entry, logger, structured logging.

- **R1 Scope**: Language-agnostic methodology + ONE canonical reference line format; agents adapt
  idioms per project language. No mandatory per-language code.
- **R2 Type taxonomy**: Extensible from base canonical set:
  - ERR = fault / error condition
  - WRN = warning / risk / degraded
  - MSG = normal progress / informational milestone
  - VRB = verbose / detail / diagnostic
  - Projects MAY add codes; MUST reuse the base four and document additions.
- **R3 Source**: every entry carries source = module + function/script name.
- **R4 Goal + params granularity**: operation-boundary lines (start AND end of an operation) and
  any ERR/WRN entry MUST carry the operation goal + full parameter values. Intermediate
  VRB/MSG progress lines MAY omit params.
- **R5 Secret redaction**: param-NAME denylist triggers redaction — names containing: password,
  pwd, token, secret, key, credential, apikey/api_key, auth, cookie. Redacted form = first 3
  chars + "(length)", e.g. `AbC(30)`. Edge cases (value <3 chars, empty, non-string, nested)
  to be defined in SPEC by LeadDev.
- **R6 Representation**: human-readable single-line canonical format WITH a defined
  structured-fields mapping (field spec) for machine parsing. Fixed field order (part of the
  format spec).
- **R7 Additional enforced rules** (user-selected):
  - Timestamps: every entry carries UTC ISO-8601, fixed precision.
  - Correlation/trace ID: every entry carries a request/trace id to join a flow.
  - PII handling: redaction guidance for non-secret sensitive data (emails, personal IDs).
  - Never-throws: logging is side-effect-free and never raises.
- **R8 NOT selected** (do not add as standalone rules): separate LEVEL vs TYPE distinction;
  deterministic field order as a distinct rule (covered by R6 format spec).
- **R9 Clarity (principle 1)**: concrete guidance — unambiguous messages, no redundant fields,
  context sufficient to diagnose without re-reading source.

## BLOCKER log
- `elon-ko-gate` rejects every team-agent spawn with `agent=(none)` (gate reads top-level
  `agent`; harness `task` schema is omp batch form `{context,i,tasks}` and cannot carry it).
  `hub` also gated; `write` gated to this file; `bash` = single git commit only.
  Confirmed across ~13 attempts. Commit `515058b` holds prior state.
- User chose "fix the gate, then retry." GRILL front-loaded via `ask` to avoid losing the round.
  SPEC delegation being retried now (user is engaged; gate may now be fixed).

## Decision Log
- 2026-08-10 — Classified FULL.
- 2026-08-10 — Delegation blocked by gate/tool-schema mismatch. Escalated; user chose fix-gate.
- 2026-08-10 — Front-loaded GRILL via `ask`. Requirements R1–R9 resolved.
- 2026-08-10 — Skipping RESEARCH (no unknowns). Routing SPEC to LeadDev.

## Pending Asks
(none — requirements resolved; awaiting SPEC delegation result)
