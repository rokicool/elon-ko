# PROJECT — Release the `wrapper` agent hire

## Status: DONE ✅ (incl. PA-6 installer bug). All releases shipped; F1 durable; installer fix merged to `main`. User's broken machine fixable via 2-command workaround. No outstanding work.

## Request (original — DONE)
Dogfood `wrapper` to release the wrapper hire + registration fix.

## Outcome — COMPLETE
- **v2.2.0** (`wrapper-release`): wrapper hire + gate allowlist fix. PR #18→`740f645`; tag v2.2.0.
- **v2.2.1** (`wrapper-promote-release`/F2): wrapper published in elon-ko-agents; validate-plugins.sh
  GREEN (8 agents). PR #19→`db656f5`; tag v2.2.1.
- **F1** (`WorkingRoadrunner`/leaddev): installed-gate pin `#74abbba`→`#v2.2.1` (durable).
- **PA-6 installer fix** (`AboveRoadrunner`/wrapper): PR #20 MERGED→`11f09fc` on `origin/main`;
  CI green (validate-plugins + installer smoke). No release (main-HEAD-fetched; v2.2.1 artifacts
  already correct). [PROTO] `0111dc3` confirmed local-only.

## PA-6 — installer bug (DIAGNOSED + FIXED)
- **Root cause** (`elon_ko.sh:117-118`): stable-mode `marketplace remove`+`add` reuses omp's stale
  cached GitHub clone → catalog frozen at first-added version (v2.1.2, no wrapper). Gate (Plugin A)
  git-pinned `#v2.2.1` admits wrapper → wrapper allowed-but-undefined → "not available."
  (Prime suspect — build excludes wrapper — RULED OUT: v2.2.1 artifacts verifiably contain wrapper;
  `release.yml:67-70` is a directory tar.)
- **Fix**: force `omp plugin marketplace update` in stable mode after `marketplace add` (pre-release
  path unchanged). leaddev `4948c9e` (local) → wrapper cherry-picked to clean branch from
  `origin/main`, PR #20, CI green, squash-merged as `11f09fc`.
- **User workaround (broken machine, NOW):** `omp plugin marketplace update elon-ko && omp plugin
  install elon-ko-agents@elon-ko --force`

## Decision Log (condensed)
- 2026-06-28 — wrapper hired; BLOCKER #1/#2/#3 (gate rejected wrapper; root cause = stale installed
  plugin copy pinned `#74abbba`; leaddev hand-patched installed copy).
- 2026-06-29 — PA-4 activate via restart → 5th spawn admitted. BLOCKER #3 RESOLVED.
- 2026-06-29 — `wrapper-release` v2.2.0 shipped & verified.
- 2026-06-29 — PA-5 (F1 fix-install + F2 promote). `wrapper-promote-release` v2.2.1 shipped & verified.
- 2026-06-29 — F1 (`WorkingRoadrunner`): gate pin `#74abbba`→`#v2.2.1` (durable).
- 2026-06-29 — PA-6: wrapper missing on fresh install. leaddev (`OrthodoxTakin`) diagnosed installer
  bug (stale marketplace cache); fix `4948c9e`. wrapper (`AboveRoadrunner`) shipped via PR #20→`11f09fc`.
- 2026-06-29 — ALL WORK COMPLETE. DONE.

## Optional housekeeping (NOT done — local-only, benign)
Local `main` has diverged from `origin/main` (carries local-only [PROTO] `0111dc3` + pre-squash
`4948c9e`, vs origin's squash `11f09fc`). Benign — not pushed. A `git reset`/sync to origin/main
would tidy it but risks the [PROTO] commit; left as-is per wrapper's correct out-of-scope call.

## Pending Asks
- [PA-1..PA-6] all resolved. No pending asks. DONE.
