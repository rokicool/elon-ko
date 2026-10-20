# PROJECT.md — Formalize `wrapper` as an elon-ko team agent

## Workflow
- Path: FULL — VALIDATE PASS; DONE complete; RELEASE (Wrapper) in flight per PA-5
- Phase log: REQUEST (cb93cdb) → GRILL (9612d21) → SPEC (3537710) → DEVELOP (2dbe63b, 9aaf96e) → VALIDATE (PASS 7/7, cycle 1/3) → DONE (docs synced, PA-5 agreed) → RELEASE (first live ask-first consent)
- Origin: IDEA-001 "Hire an additional team agent role" — status=promoted (promoted_to .app/REQ.md, 2026-10-20)

## Request (verbatim)
> I need you to include wrapper as part of the team.

## Outcome (validated)
- Seat framing (`src/append-system.default.md` ≡ `scaffold/APPEND_SYSTEM.md`): 9-agent roster in gate-TEAM order (wrapper + purecode + debugger added), Wrapper-in-DONE bullet, no new phase.
- elon SKILL.md (both byte-identical copies): DONE-phase trigger clause now ask-first — pending go/no-go ask → consent-gated spawn; stale auto-spawn phrasing eradicated (repo-wide grep zero). Anchor discrepancy noted: SPEC/validator cite :211, DocWorm reads :213; content byte-verified by both — cosmetic, unadjudicated.
- AC-1..AC-7 PASS (validator, SCOPED-FULL, independently reproduced). AC-6 npm-test failure adjudicated pre-existing (identical at BASE, isolated worktree; parked as IDEA-004).
- Docs: CHANGELOG Unreleased entry (uncommitted in worktree — Elon's git gate is .app/-only; Wrapper folds it into the release commit); README/DEVREADME verified accurate, untouched.

## Decision log
- [2026-10-20] PA-1: sync full 9-agent roster. PA-2: Wrapper-in-DONE. PA-3: ask-first trigger. PA-4: authority as-is.
- [2026-10-20] Validator findings (non-blocking): cosmetic SPEC §11↔§5.2 token inconsistency; pre-existing toolchain failure → IDEA-004.
- [2026-10-20] PA-5 agreed: Release now — Wrapper spawns with consent (first live use of the new trigger).

## Delegation Log
- ReqGuru — GRILL. COMPLETED (premise corrected; 2-file gap isolated; Q1–Q4 closed).
- ReqGuru — REQ.md. COMPLETED (13 sections, 0 open questions).
- LeadDev — SPEC.md. COMPLETED (202 lines; scaffold drift disclosed + absorbed).
- LeadDev/MidDev — DEVELOP. COMPLETED (2dbe63b + 9aaf96e).
- Validator — VALIDATE. PASS (7/7).
- DocWorm — DONE docs. COMPLETED (IDEAS lifecycle, IDEA-004, CHANGELOG; README/DEVREADME accurate).
- Wrapper — RELEASE. IN FLIGHT (patch bump incl. CHANGELOG.md, tag, publish, sync origin).

## Pending Asks
- [PA-5] 2026-10-20 origin=elon status=agreed | Release now → Wrapper in flight.
