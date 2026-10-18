# PROJECT.md — Ship `logging-design` skill with elon-ko

## Workflow
- Path: FULL
- Current phase: DEVELOP (LeadDev implementing per .app/SPEC.md)
- Phase log: REQUEST → RESEARCH (done) → Proposal gate (done — Option A) → SPEC (done) → **DEVELOP (active)** → VALIDATE → PURECODE → DONE

## Request (verbatim, condensed)
> We have a skill at `.claude/skills/logging-design` in this repo (elon-ko). I like its scale; the problem is the `.claude` folder is not installed or used anywhere by any installation of this project. Do research and suggest a solution for installing this particular skill across the entire elon-ko system. Target of installation is omp (oh-my-pi) — the `.claude` folder does NOT have to be used. After installing Elon and Core, omp in this or any project should start using this skill by default.

## Decision log
- [2026-10-18] PA-1 agreed: **Option A** — move `logging-design` into `plugins/agents/skills/`, bump skill-count surfaces 11→12, mirror to `.agents/skills/`, delete `.claude/`. No installer/agent/gate changes.
- [2026-10-18] Elon accepted SPEC §9 positions (non-blocking): (1) keep op 9 `release.yml:98` stale-count fix; (2) keep ops 10–11 version lockstep bump 2.8.0→2.8.1 + CHANGELOG `[v2.8.1]` entry (repo mandate; propagation also verified via `--force` reinstall independent of the bump).

## Constraints
- omp-native distribution; skill available by default in ANY project after elon-ko install; `.claude/` eliminated (no dual source of truth); byte-identical move (no SKILL.md content edits).

## Artifacts
- `.app/RESEARCH.md` — skill inventory, install map, omp skill mechanism, options A/B/C (committed).
- `.app/SPEC.md` — 11 file ops, interface contracts, AC-1..9, Developer/Validator verification plans (committed this gate).

## Delegation Log
- [2026-10-18] DrPe — research. COMPLETED (.app/RESEARCH.md).
- [2026-10-18] LeadDev — SPEC. COMPLETED (.app/SPEC.md); all research claims held up on re-verification.
- [2026-10-18] LeadDev — DEVELOP: implement SPEC §3 ops 1–11, run §8 Developer checks. Status: in flight.

## Pending Asks
- [PA-1] 2026-10-18 origin=elon status=agreed | "Which installation approach to take to SPEC: Option A, B, or C?" → answered: Option A.
