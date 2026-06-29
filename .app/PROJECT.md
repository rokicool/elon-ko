# PROJECT — Release the `wrapper` agent hire

## Status: DONE ✅ — All phases complete. v2.2.0 + v2.2.1 shipped & verified; F1 (installed-gate permanence) + F2 (publish wrapper) both done. One optional follow-up noted (stale elon-ko-agents install — does not affect wrapper).

## Request
Dogfood the newly-hired `wrapper` release-engineering agent to commit, push, and
cut a release of the current changes (the `wrapper` agent hire + its registration fix).

## Classification
FULL (release-engineering close-out) → terminal agent: `wrapper`.

## Outcome — COMPLETE
### v2.2.0 (`wrapper-release`) — the core release
`[FEAT]` wrapper def+skill `2d88e59` + `[FIX]` allowlist registration `28b009e`; pushed
`74abbba..28b009e`; 2.1.2→2.2.0 (MINOR); PR #18 squash-merged → `740f645`; tag v2.2.0; release
published. The orchestrator allowlist fix is canonical on GitHub.
### v2.2.1 (`wrapper-promote-release`) — F2: publish wrapper in elon-ko-agents
Added `plugins/agents/agents/wrapper.md` + `plugins/agents/skills/wrapper/SKILL.md`; registered
in marketplace.json (8 agents / 9 skills); **validate-plugins.sh GREEN, exit 0** (8 declared
agents); 2.2.0→2.2.1 (PATCH); PR #19 squash-merged → `db656f5`; tag v2.2.1; release
https://github.com/rokicool/elon-ko/releases/tag/v2.2.1 (assets incl. elon-ko-agents-2.2.1.tar.gz
with wrapper). Local main synced (db656f5).
### F1 (`WorkingRoadrunner`/leaddev) — installed-gate permanence
`~/.omp/plugins/package.json` pin bumped `#74abbba` → **`#v2.2.1`** (line 5; re-read confirmed).
Live reinstall deferred by design (zero durability upside; partial-replace risk). Current session
needs NO reload (hand-patch still in memory); a future reinstall fetches v2.2.1 → source has the
fix → no silent re-break. **Durable.**

## Verification basis
Elon did NOT take sparse/summary yields at face value. Every release step was confirmed from the
agents' full transcripts / JSON reports: commit SHAs, push ranges, CI check statuses,
validate-plugins.sh output (quoted), merge commits, tag→commit identity, release.yml run success,
asset lists, local-main sync. F1 pin before→after quoted from re-read evidence.

## Optional follow-up (NOT actioned — outside scope; surface only)
The installed `elon-ko-agents` plugin is stale (v2.1.2 vs released v2.2.1 with published wrapper).
It does NOT affect `wrapper` spawnability (that depends on the gate's `TEAM`, which is fixed and
durable). It would only matter if the user wants their *installed* agents plugin (used by other
projects) to carry `wrapper`. Fixing it is a marketplace-style reinstall / coordinated manifest
edit (not a one-line pin) — flagged by leaddev, deferred.

## Decision Log (condensed; full history in prior revisions)
- 2026-06-28 — wrapper hired by HR; BLOCKER #1/#2 (gate rejected wrapper; HR edited source TEAM).
- 2026-06-29 — BLOCKER #3 (rejected post-restart). leaddev root cause: runtime loads INSTALLED
  plugin pinned to `#74abbba`; HR's edit was local+uncommitted. leaddev hand-patched installed copy.
- 2026-06-29 — PA-4 activate via reload/restart → 5th spawn ADMITTED (TEAM=7). BLOCKER #3 RESOLVED.
- 2026-06-29 — `wrapper-release`: v2.2.0 shipped & verified.
- 2026-06-29 — PA-5 RESOLVED: user chose F1 (fix install) + F2 (promote to published).
- 2026-06-29 — `wrapper-promote-release`: v2.2.1 shipped & verified (wrapper now published).
- 2026-06-29 — F1 (`WorkingRoadrunner`/leaddev): installed-gate pin `#74abbba`→`#v2.2.1`; durable.
- 2026-06-29 — RELEASE WORKFLOW COMPLETE. DONE.

## Pending Asks
- [PA-1..PA-5] all resolved/agreed. No pending asks. Workflow DONE.
