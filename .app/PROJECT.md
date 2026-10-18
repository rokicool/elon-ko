# PROJECT.md — Ship `logging-design` skill with elon-ko

## Workflow
- Path: FULL
- Current phase: PURECODE (post-VALIDATE cleanliness gate on commit a47531e)
- Phase log: REQUEST → RESEARCH (done) → Proposal gate (done — Option A) → SPEC (done) → DEVELOP (done, a47531e) → VALIDATE (done — PASS) → **PURECODE (active)** → DONE

## Request (verbatim, condensed)
> We have a skill at `.claude/skills/logging-design` in this repo (elon-ko). I like its scale; the problem is the `.claude` folder is not installed or used anywhere by any installation of this project. Do research and suggest a solution for installing this particular skill across the entire elon-ko system. Target of installation is omp (oh-my-pi) — the `.claude` folder does NOT have to be used. After installing Elon and Core, omp in this or any project should start using this skill by default.

## Decision log
- [2026-10-18] PA-1 agreed: **Option A** — move into `plugins/agents/skills/`, count bumps 11→12, `.agents/` mirror, delete `.claude/`. No installer/agent/gate changes.
- [2026-10-18] Elon accepted SPEC §9 positions: release.yml:98 fix INCLUDED; lockstep 2.8.1 + CHANGELOG INCLUDED.

## Implementation state (commit a47531e, VALIDATED)
- Validator verdict: **PASS** — AC-1..AC-7, AC-9 PASS with command-level evidence; AC-8 DEFERRED (needs released ref; SPEC §7 note). Zero issues; non-goals clean (8-path diff, all §3).
- validate-plugins.sh ALL CHECKS PASSED (12 skill(s)); mirror byte-identical (blob 89ed56c2 across all 3 refs); `.claude/` gone; triple 2.8.1; CHANGELOG [v2.8.1] 2026-10-18.
- Rename-detection ambiguity confirmed benign (unscoped --summary pairing; path-scoped diff = pure R100).
- Local only: not pushed, not tagged. AC-8 smoke pending a released/pre-release ref.

## Delegation Log
- [2026-10-18] DrPe — research. COMPLETED.
- [2026-10-18] LeadDev — SPEC. COMPLETED (.app/SPEC.md).
- [2026-10-18] LeadDev/MidDev — DEVELOP. COMPLETED (a47531e).
- [2026-10-18] Validator — VALIDATE. COMPLETED: PASS, 0 issues.
- [2026-10-18] PureCode — cleanliness/verbosity assessment of a47531e. Status: in flight.

## Pending Asks
- [PA-1] 2026-10-18 origin=elon status=agreed | "Which installation approach to take to SPEC?" → Option A.
