# PROJECT.md — Formalize `wrapper` as an elon-ko team agent

## Workflow
- Path: FULL — IN PROGRESS
- Phase log: REQUEST (cb93cdb) → GRILL (Q1–Q4 answered, REQ.md pending) → SPEC → DEVELOP ⇄ VALIDATE → DONE
- Origin: IDEA-001 "Hire an additional team agent role" (parked → promoted by this request)

## Request (verbatim)
> I need you to include wrapper as part of the team.

## Context (verified by reqguru, GRILL round)
- Premise corrected: wrapper is ALREADY in the gate `TEAM` allowlist (src/enforce-orchestrator.ts:61-71, since v2.2.0), agent registration + mirrors, marketplace.json (count:10), wrapper skill, elon SKILL.md routing (:149,:211,:246), PROTO.md roster + Agent-to-Phase Map + Phase 6 §Wrapper, AGENTS.md, README/DEVREADME.
- Actual gap: `src/append-system.default.md` (bundled seat framing injected every session) and `scaffold/APPEND_SYSTEM.md` (byte-identical stale copy) name only 6 agents and a release-less pipeline. This framing is what made the seat report a 6-agent team.
- By-design non-gaps (must NOT be "fixed"): mess-transport.ts:48 wrapper exclusion (roster mess=no); no test pins framing content; no .omp/APPEND_SYSTEM.md override in repo.
- Resolved canonically: failure policy = CI-red → escalate to Elon → LeadDev, never fixes code, never force-pushes/rewrites tags; Wrapper runs strictly post-PASS in DONE, consumes no DEVELOP⇄VALIDATE budget; release-triggered code fixes re-enter DEVELOP as a new change.

## Decision log
- [2026-10-20] IDEA-001 promoted via this request. IDEAS.md status update deferred to DocWorm at DONE.
- [2026-10-20] PA-1 agreed: Q1 scope = sync full 9-agent roster (wrapper + purecode + debugger) in the framing files.
- [2026-10-20] PA-2 agreed: Q2 = keep Wrapper-in-DONE, no new RELEASE phase; framing gains wrapper bullet only.
- [2026-10-20] PA-3 agreed: Q3 = ask-first go/no-go — pending ask to user before any Wrapper spawn at DONE (delta vs current elon SKILL.md:211 auto-spawn wording; SPEC must touch it).
- [2026-10-20] PA-4 agreed: Q4 = ratify Wrapper authority as-is (push, auto-merge patch/minor on green CI, tag+publish, sync; escalate MAJOR/CI-red/stale-docs/ambiguous-version). No extra user gate.

## Delegation Log
- ReqGuru — GRILL. COMPLETED (4m50s): corrected premise, isolated 2-file gap, closed failure-policy + 3-cycle questions canonically, surfaced Q1–Q4. Now authoring .app/REQ.md (round 2).

## Pending Asks
- (none — PA-1..PA-4 answered synchronously this session)
