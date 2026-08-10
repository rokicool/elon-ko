# PROJECT — Elon Orchestrator Status

## Active Workflow
- **Task**: Gate delegation defect — FIXED + deployed (2026-08-10).
- **Classification**: Direct fix — dev session with `OMP_BYPASS_ORCHESTRATOR=1` (full tools).
- **Phase**: DONE — delegation unblocked; regression tests guard the gate.

## RESOLVED — orchestrator delegation gate (fixed + deployed 2026-08-10)
- **Was**: Every `task` delegation from root was rejected with `agent="(none)"`, even with `tasks[].agent` set to an allowed team agent.
- **Root cause**: The *installed* plugin (`elon-ko-gate` from `github:rokicool/elon-ko#v2.7.0`) was stale — its `task` handler read only top-level `input.agent`, which the omp batch `task` schema never populates. The repo `main` already had the fix (commit `cdaaa1b`: read `input.tasks[].agent`), but the install pin pointed at the pre-fix `v2.7.0` tag, so the fix never reached the runtime.
- **What was done**:
  1. Verified the repo source fix is correct — added 15 `task`-handler regression tests (`enforce-orchestrator.test.ts` §2.3); full suite 54/54 pass with `OMP_BYPASS_ORCHESTRATOR` unset.
  2. Deployed the fixed source to the installed copy (`~/.omp/plugins/node_modules/elon-ko-gate/src/enforce-orchestrator.ts`), now byte-identical (SHA-256 `a9b8c10b…`) to the tested repo source.
  3. Repinned the local install (`~/.omp/plugins/package.json`) from the stale `#v2.7.0` tag to `#v2.7.1` so a plugin update no longer regresses.
- **Result**: A gated orchestrator session may now delegate via `task({ tasks: [{ agent: "<team>", ... }] })` to any of the 8 TEAM agents (`reqguru, drpe, leaddev, validator, docworm, hr, wrapper, debugger`). `middev` remains intentionally excluded from the orchestrator's spawn set (per `c4664a3`).
- **Released**: cut and pushed the `v2.7.1` tag (triggers `release.yml` → versioned GitHub release). All version pins bumped in lockstep (package.json, marketplace.json, package-lock.json root, `elon_ko.sh` `OMP_AGENT_REF`, README/.DEVREADME). CI gates pass locally: typecheck clean, validate-plugins `ALL CHECKS PASSED`, gate suite 54/54.

## Notes for the next orchestrator session
- The gate is active for the root seat when `.omp/elon.json` has `{"enabled": true}` (it does) and `OMP_BYPASS_ORCHESTRATOR` is unset.
- Delegate, do not implement: `task({ context, i, tasks: [{ agent: "validator", task: "..." }] })`.
- The gate blocks direct `edit`/`eval`/`grep`/etc. at the root — by design.

## Pending Asks
(none)
