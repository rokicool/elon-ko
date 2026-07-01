# PROJECT — elon-ko scaffold files load-bearing placement — DONE (+ released)

## Request (verbatim)
AGENTS.md, APPEND_SYSTEM.md, PROTO.md, RULES.md only land in .omp/plugins/cache/marketplace/elon-ko/scaffold (download staging), never load-bearing. Research + redesign to place them load-bearing.

## Classification
FULL — research + redesign + release.

## Workflow Path (COMPLETE)
REQUEST -> RESEARCH -> SPEC -> DEVELOP -> VALIDATE(PASS) -> DocWorm -> DONE -> RELEASE v2.4.0 (shipped) -> doc-refresh (pushed)

## Phase Status — ALL COMPLETE
- Feature: researched, specced, implemented, validated (10/10 ACs; AC-S3 LIVE-proven).
- Release v2.4.0: tag pushed, CI green, GitHub Release published, $REF bumped, artifacts verified at tag (all 200).
- Post-release doc refresh: committed + pushed (cafdd28, origin/main).

## Final result (validated + shipped)
- AGENTS.md -> <cwd>/AGENTS.md (overwrite-always, both modes); omp LOADS it (live sentinel proof). CORE DEFECT FIXED.
- PROTO.md -> <cwd>/PROTO.md (doc-only).
- APPEND_SYSTEM.md: already load-bearing via Plugin A; override <cwd>/.omp/APPEND_SYSTEM.md.
- RULES.md -> Plugin A rules/ro-orchestrator-invariant.md (alwaysApply:true); scaffold/RULES.md deleted; AGENTS.md coherence.
- No regression to prior 12 install-mode ACs. IDEA-003 answered (agents[] metadata-only).

## Release v2.4.0 (MINOR from 2.3.1)
- Tag v2.4.0 -> 3cb3f7a; main HEAD cafdd28. GitHub Release: https://github.com/rokicool/elon-ko/releases/tag/v2.4.0
- CI green (typecheck + validate-plugins + tag-match). Assets: elon-ko-gate-2.4.0.tgz, elon-ko-agents-2.4.0.tar.gz, SHA256SUMS.
- elon_ko.sh $REF (L104) v2.3.1 -> v2.4.0 (+ L89 usage text).
- Verified at tag: scaffold/AGENTS.md=200, scaffold/PROTO.md=200, rules/ro-orchestrator-invariant.md=200; scaffold/RULES.md absent.
- Manifests bumped lockstep (Plugin A + Plugin B). CHANGELOG promoted. Docs pins refreshed.

## For the user's other machine
Reinstall (installer now defaults to v2.4.0) -> AGENTS.md deploys to <cwd>/ + the RULES rule ships in Plugin A.

## Commit chain (scaffold task + release)
[IMPL] e1d9c2a, ba92344. [DOCS] 8bf4872. [PROTO] c8f4fc3, d24856e, c345209, 4d91497, e534089.
[RELEASE] 3cb3f7a (v2.4.0), 2342089 ($REF bump). [DOCS] cafdd28 (pins refresh). HEAD=cafdd28.

## Pending Asks
(none — complete)
