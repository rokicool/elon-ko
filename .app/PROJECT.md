# PROJECT.md — Idea/Suggestion Storage Extension

## Brief
Analyze the agent-communication protocol (`skill://elon`) and design an extension
for **ideas/suggestions storage** under `.app/`: capture worthwhile-but-out-of-
scope work, persist it, let Elon remind the user about relevant stored ideas, and
allow promotion of an idea into the FULL workflow.

## Classification
**FULL** — new orchestrator-protocol extension (Plugin A code + advisory prose).

## Workflow Path
FULL: REQUEST → GRILL → RESEARCH → SPEC → DEVELOP ⇄ VALIDATE → DONE (+ RELEASE)

## Current Phase
**DONE + RELEASED.** Extension shipped, Validator PASS (14/14 ACs), and
**v2.1.0 released — CI green, GitHub Release published.**

## Release v2.1.0 (semver minor — new feature)
- Version bump lockstep `2.0.0 → 2.1.0`: `package.json`, `package-lock.json`,
  `.omp-plugin/marketplace.json` (catalog + Plugin B), `elon_ko.sh` (installer pin),
  `README.md`, `.DEVREADME.md`, new `CHANGELOG.md` section. Dep constraints &
  historical entries left untouched.
- Commit `8a6b5e4` (`chore(release): v2.1.0`), annotated tag `v2.1.0`, pushed main +
  tag (RC=0). `.omp/` runtime state correctly excluded.
- Pre-tag gate: `npm test` 97/97, `tsc --noEmit` exit 0.
- CI: `ci.yml` GREEN (typecheck + validate-plugins + omp-install smoke;
  `elon-ko-gate@2.1.0` asserted); `release.yml` GREEN (tag==version assertion,
  built artifacts, created the Release).
- GitHub Release (automated by `release.yml` on `v*` tag push):
  https://github.com/rokicool/elon-ko/releases/tag/v2.1.0 — assets
  `elon-ko-gate-2.1.0.tgz`, `elon-ko-agents-2.1.0.tar.gz`, `SHA256SUMS`.
- Only non-fatal Node-20 deprecation warnings on `actions/*@v4` (advisory).

## Phase Log
- 2026-06-27 REQUEST → GRILL (dc2fbb5) → RESEARCH (c27854b) → PA-1 (39724f9) → SPEC (9e4b0e1).
- 2026-06-27 DEVELOP — implemented (990794e, 508b2bd, 66fe5c1, 789382e).
- 2026-06-27 VALIDATE c1 FAIL (FAIL-1) → RESOLVE c1 (c748b6b) → VALIDATE c2 PASS (624ac50).
- 2026-06-27 RELEASE v2.1.0 — bump + commit (8a6b5e4) + tag + push + CI green + GH Release.

## Pending Asks
- [PA-1] 2026-06-27 origin=elon status=agreed | "Accept §6 assumptions + proceed to SPEC." (accepted)
