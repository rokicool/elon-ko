# PROJECT — Hire "wrapper" release-engineering agent

## Status: DONE — agent defined and registered

## Request
Hire `wrapper`, a recurring release-engineering agent that finishes the development cycle
(version bump, doc-version verification, release branch + push + CI, PR/MR, tag + release,
local-main sync), escalating to Elon for anything owned by another agent's domain.

## Classification
FULL — new recurring team role. Route: HR (full hire). ✓ COMPLETED.

## Decision Log
- 2026-06-28 — Name "wrapper" accepted (user-specified).
- 2026-06-28 — PA-1 RESOLVED: platform = both / auto-detect via `git remote` (gh + glab).
- 2026-06-28 — PA-2 RESOLVED: merge = auto-merge patch/minor; PAUSE + escalate on MAJOR.
- 2026-06-28 — PA-3 RESOLVED: version = Conventional Commits → semver.
- 2026-06-28 — HR delivered full hire. Deliverables written (uncommitted — outside Elon's
  git scope of .app/ protocol artifacts).

## Deliverable (HR)
- Definition: `.omp/agents/wrapper.md`
- Skill:      `.agents/skills/wrapper/SKILL.md` (106 lines, all 7 sections present)
- AGENTS.md:  SKIPPED — only `scaffold/AGENTS.md` (shipped consumer template) exists;
  no project-local AGENTS.md to append to. Correct decision.
- Tools:      `bash, read, write, edit, find, search` (HR corrected conceptual glob/grep →
  real harness names `find`/`search`; definition `tools` and skill `<allowed>` agree exactly).
- Spawns:     none — wrapper returns to Elon, who re-dispatches.
- Self-check: definitionToolsMatchSkillAllowed=true, noSpawnsKey=true, pluginFilesEdited=false.

## Pending Asks
(none)
