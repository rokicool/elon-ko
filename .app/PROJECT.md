# PROJECT — elon-ko scaffold files load-bearing placement

## Request (verbatim)
AGENTS.md, APPEND_SYSTEM.md, PROTO.md, RULES.md only land in .omp/plugins/cache/marketplace/elon-ko/scaffold (download staging), never load-bearing. Research + redesign to place them load-bearing.

## Classification
FULL — research (done) + redesign elon_ko.sh + Plugin A packaging.

## Workflow Path
REQUEST -> RESEARCH(done) -> SPEC(done) -> DEVELOP(done) -> VALIDATE(PASS) -> DocWorm(in_progress) -> DONE

## Phase Status
- RESEARCH: done. SPEC: done (SCAFFOLD-SPEC, AC-S1..S10).
- DEVELOP: done (e1d9c2a RULES move + AGENTS coherence; ba92344 elon_ko.sh deploy step).
- VALIDATE: **PASS 10/10 ACs, 0 failed checks.** AC-S3 LIVE-proven (omp loaded <cwd>/AGENTS.md sentinel token).
- DocWorm: in_progress (user-facing deploy behavior + APPEND_SYSTEM override -> README).
- DONE: pending.

## Validated result
- AGENTS.md: installer deploys -> <cwd>/AGENTS.md (overwrite-always, both modes); omp LOADS it (live proof). THE core defect fixed.
- PROTO.md: -> <cwd>/PROTO.md (doc-only).
- APPEND_SYSTEM.md: already load-bearing via Plugin A; override at <cwd>/.omp/APPEND_SYSTEM.md (documented, not copied).
- RULES.md: moved into Plugin A rules/ro-orchestrator-invariant.md (alwaysApply:true); scaffold/RULES.md deleted; AGENTS.md coherence edits.
- Uninstall leaves <cwd>/AGENTS.md + PROTO.md in place.
- No regression to prior 12 install-mode ACs (AC-S6).

## Release-timing gap (OBS-2 — surface to user, offer release)
- New rule + AGENTS coherence exist ONLY in working tree. Published v2.3.1 tag lacks them; HEAD not pushed; elon_ko.sh $REF default still v2.3.1.
- Stable consumers (github#v2.3.1) get OLD Plugin A (no new rule) + OLD AGENTS.md (still refs RULES.md). Pre-release/tag installs DO get the fix.
- Release actions (wrapper): bump package.json version, cut+push new tag, bump elon_ko.sh:104 $REF default.

## Minor (OBS-1, informational)
SCAFFOLD-SPEC §3.1 rejected-source justification slightly inaccurate (omp github-install clones whole repo, so scaffold/ IS in node_modules). Decision (raw-github) still correct. No code impact.

## Pending Asks
(none yet — may offer release cut to user)
