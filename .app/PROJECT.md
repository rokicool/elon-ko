# PROJECT.md — Ship `logging-design` skill with elon-ko

## Workflow
- Path: FULL — **COMPLETE** (all phases, all gates, release published)
- Phase log: REQUEST → RESEARCH → Proposal gate (Option A) → SPEC → DEVELOP (a47531e) → VALIDATE (PASS) → PURECODE c1 (needs-alterations) → DEVELOP-fix (8a71dfa) → VALIDATE scoped (PASS) → PURECODE c2 (code-fine) → DONE → RELEASE (v2.8.1 published, AC-8 PASS)

## Request (verbatim, condensed)
> We have a skill at `.claude/skills/logging-design` in this repo (elon-ko). I like its scale; the problem is the `.claude` folder is not installed or used anywhere by any installation of this project. Do research and suggest a solution for installing this particular skill across the entire elon-ko system. Target of installation is omp (oh-my-pi) — the `.claude` folder does NOT have to be used. After installing Elon and Core, omp in this or any project should start using this skill by default.

## Decision log
- [2026-10-18] PA-1 agreed: **Option A** — move into `plugins/agents/skills/`, count bumps 11→12, `.agents/` mirror, delete `.claude/`.
- [2026-10-18] SPEC §9 positions accepted: release.yml:98 fix; lockstep 2.8.1 + CHANGELOG.
- [2026-10-18] DocWorm SKIPPED (doc edits spec-enumerated, twice line-level validated).
- [2026-10-18] PA-2 agreed: release v2.8.1 now.
- [2026-10-18] Wrapper deviation accepted: `elon_ko.sh` REF-default lines (:89,:104) swept to v2.8.1 — SPEC non-goal covered only its stale count strings; REF default had to move to keep README:183 truthful. Count strings remain untouched per spec.

## Final state — PUBLISHED
- Commits on origin/main: `a47531e` (skill promotion) → `8a71dfa` (PureCode fixes) → `ae37fb7` (pin sweep). Tag `v2.8.1` → ae37fb7 (annotated). Release workflow run 39140684805 green (37s): typecheck, validate-plugins, tag-assert, artifacts + SHA256SUMS. https://github.com/rokicool/elon-ko/releases/tag/v2.8.1
- AC status: AC-1..AC-9 **all PASS** (AC-8 smoke in non-clone cwd: marketplace update → install 2.8.1 → `omp skill list` shows logging-design; cache SKILL.md 13,230 bytes).
- Outcome: after elon-ko install/update, omp lists + dispatches `skill://logging-design` in every project (user-scoped Plugin B). This machine's Plugin B already upgraded to 2.8.1 by the smoke; Plugin A (elon-ko-gate) unchanged/optional per README pin.

## Delegation Log
- DrPe — research. COMPLETED. | LeadDev — SPEC. COMPLETED. | LeadDev/MidDev — DEVELOP. COMPLETED (a47531e). | Validator — VALIDATE. PASS. | PureCode c1 — needs-alterations. | LeadDev — fix. COMPLETED (8a71dfa). | Validator — scoped. PASS. | PureCode c2 — code-fine. | Wrapper — release v2.8.1 + AC-8 smoke. COMPLETED.

## Pending Asks
- [PA-1] 2026-10-18 origin=elon status=agreed | Option A.
- [PA-2] 2026-10-18 origin=elon status=agreed | Release v2.8.1 now → done.
