# PROJECT.md — Ship `logging-design` skill with elon-ko

## Workflow
- Path: FULL — COMPLETE (pending release decision PA-2)
- Phase log: REQUEST → RESEARCH → Proposal gate (Option A) → SPEC → DEVELOP (a47531e) → VALIDATE (PASS) → PURECODE c1 (needs-alterations) → DEVELOP-fix (8a71dfa) → VALIDATE scoped (PASS) → PURECODE c2 (code-fine) → **DONE (release gate)**

## Request (verbatim, condensed)
> We have a skill at `.claude/skills/logging-design` in this repo (elon-ko). I like its scale; the problem is the `.claude` folder is not installed or used anywhere by any installation of this project. Do research and suggest a solution for installing this particular skill across the entire elon-ko system. Target of installation is omp (oh-my-pi) — the `.claude` folder does NOT have to be used. After installing Elon and Core, omp in this or any project should start using this skill by default.

## Decision log
- [2026-10-18] PA-1 agreed: **Option A** — move into `plugins/agents/skills/`, count bumps 11→12, `.agents/` mirror, delete `.claude/`. No installer/agent/gate changes.
- [2026-10-18] Elon accepted SPEC §9 positions: release.yml:98 fix INCLUDED; lockstep 2.8.1 + CHANGELOG INCLUDED.
- [2026-10-18] DocWorm SKIPPED (DONE evaluation): doc modifications (README/DEVREADME counts, CHANGELOG v2.8.1 entry with propagation instructions) were spec-enumerated ops, implemented in-commit, and line-level validated by Validator (full + scoped) and PureCode (c1/c2). No public API/CLI/config surface changed; no new doc surface exists to write. A DocWorm pass would re-review already-audited lines.

## Final state (local branch main, NOT pushed, NOT tagged)
- `a47531e` `[SPEC §3]` — skill promoted to `plugins/agents/skills/logging-design/` (byte-identical, R100, history preserved), `.claude/` deleted, `.agents/skills/` mirror, marketplace/README/DEVREADME/release.yml counts 12, lockstep 2.8.1 ×3, CHANGELOG [v2.8.1] 2026-10-18. VALIDATE: PASS (AC-1..7, AC-9; AC-8 deferred).
- `8a71dfa` `[FIX]` — PureCode c1 fixes: .DEVREADME.md:21 + package-lock.json root → 2.8.1. Scoped re-VALIDATE: PASS. PureCode c2: code-fine.
- `validate-plugins.sh` ALL CHECKS PASSED (12 skill(s), logging-design listed).
- Deferred to Wrapper at tag time: example pins README.md:59,159,183,191 + .DEVREADME.md:246,249,255,311 (must NOT be bumped before v2.8.1 exists).
- Remaining verification: AC-8 (fresh non-clone project: reinstall → `skill://logging-design` resolves) — requires released/tagged ref.

## Delegation Log
- DrPe — research. COMPLETED. | LeadDev — SPEC. COMPLETED. | LeadDev/MidDev — DEVELOP. COMPLETED (a47531e). | Validator — VALIDATE. PASS. | PureCode c1 — needs-alterations. | LeadDev — fix. COMPLETED (8a71dfa). | Validator — scoped. PASS. | PureCode c2 — code-fine.

## Pending Asks
- [PA-1] 2026-10-18 origin=elon status=agreed | "Which installation approach to take to SPEC?" → Option A.
- [PA-2] 2026-10-18 origin=elon status=pending | "Cut release v2.8.1 now via Wrapper (example-pin sweep + push + tag, then AC-8 smoke), or keep local?"
