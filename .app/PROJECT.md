# PROJECT.md — Ship `logging-design` skill with elon-ko

## Workflow
- Path: FULL
- Current phase: Proposal gate (awaiting user decision on installation approach)
- Phase log: REQUEST → RESEARCH (done, committed) → **Proposal gate (active)** → SPEC → DEVELOP → VALIDATE → DONE

## Request (verbatim, condensed)
> We have a skill at `.claude/skills/logging-design` in this repo (elon-ko). I like its scale; the problem is the `.claude` folder is not installed or used anywhere by any installation of this project. Do research and suggest a solution for installing this particular skill across the entire elon-ko system. Target of installation is omp (oh-my-pi) — the `.claude` folder does NOT have to be used. After installing elon-ko (Elon and Core), omp in this or any project should start using this skill by default.

## Constraints
- Target runtime: omp (oh-my-pi) skill system (`skill://` scheme).
- Skill must become available by default in ANY project after elon-ko is installed — no per-project copy in `.claude/`.
- Implementation only after user approval (proposal gate).

## Research outcome (DrPe, .app/RESEARCH.md)
- `logging-design` = single SKILL.md (280 lines), orphaned from all packaging (marketplace, installer, validator, docs).
- omp loads skills by filesystem placement: `<plugin-root>/skills/<name>/SKILL.md`; user-scoped plugin installs are available in ALL projects and auto-listed in every session prompt (root + subagents).
- Options: (A) move into `plugins/agents/skills/` [recommended, zero new machinery]; (B) bundle into Plugin A (`elon-ko-gate`) via package.json#files; (C) installer copies to omp user-global skills root.
- Impact assessment: CLEAR → proceed to SPEC after user picks an option.

## Delegation Log
- [2026-10-18] DrPe — research omp skill loading + elon-ko packaging. Status: COMPLETED (.app/RESEARCH.md, 280 lines).

## Pending Asks
- [PA-1] 2026-10-18 origin=elon status=pending | "Which installation approach to take to SPEC: Option A (move into plugins/agents/skills/, recommended), B, or C?"
