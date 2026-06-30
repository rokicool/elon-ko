# PROJECT — elon-ko.sh local/global install modes

## Request (verbatim)
local = local to current project/folder, nothing global. global = opposite. default = global; switch to local via -local.

NOTE: actual repo file is elon_ko.sh (underscore).

## Classification
FULL — two distinct install modes via CLI flag.

## Workflow Path
FULL -> REQUEST -> GRILL -> RESEARCH -> SPEC -> DEVELOP -> VALIDATE(FAIL D1) -> RESOLVE c1 (user=d) -> SPEC-rev+FIX -> re-VALIDATE (PASS) -> DocWorm (in_progress) -> DONE

## Phase Status
- REQUEST..DEVELOP: done.
- VALIDATE-1: FAIL (D1). RESOLVE c1: user=(d); LeadDev fixed (d7eb160 SPEC, d3ca4dc impl).
- re-VALIDATE: **PASS — 12/12 ACs, 0 deviations, 0 new issues.** HEAD=d3ca4dc.
- DocWorm: in_progress (conditional — new user-facing CLI mode + activation + caveats).
- DONE: pending.

## Final feature (validated)
- Two modes: GLOBAL (default, current behavior preserved) + LOCAL (`-local`/`--local`).
- LOCAL: everything under ./.elon-ko/{bin, omp/natives/<ver>/, omp/plugins/, marketplaces.json, env.sh, .install.json}. Nothing under $HOME.
- Dual-knob: LOCAL exports PI_CONFIG_DIR (configRoot) + XDG_DATA_HOME=$OMP_LOCAL_HOME (omp data), pre-mkdir ./.elon-ko/omp (XDG gate).
- Activation: `source ./.elon-ko/env.sh` (exports PI_CONFIG_DIR + XDG_DATA_HOME + PATH + BUN_INSTALL + PI_INSTALL_DIR).
- Mode-scoped uninstall: `-local uninstall` (only ./.elon-ko/) / `uninstall` (global).
- Coexistence: LOCAL+GLOBAL allowed; cross-mode one-line notice.
- Latent global pre-release bug fixed (TAG unbound under set -u) — behavior-neutral for stable.

## Residual risks (documented, accepted)
- R-C: LOCAL omp has separate agent.db -> separate AUTH/sessions; re-auth or copy credentials.
- R-F (LOCAL-only): env.sh exports XDG_DATA_HOME -> redirects data category of XDG-aware tools in that shell. GLOBAL unaffected.
- R-E: env.sh bakes install-time paths; moving project dir needs re-run.
- O1 (LOW): macOS symlinked $PWD/$HOME spurious R-B warning (conformant to SPEC §5.2, cosmetic).

## Commits
- Protocol: [PROTO] GRILL(d8c180a), RESEARCH(909c0c3), SPEC(f0d4bf9).
- Impl: 8ca3d44, 3d0643f (initial), d7eb160 (SPEC-rev), d3ca4dc (D1 fix). HEAD=d3ca4dc.

## Pending Asks
- [PA-1] status=agreed | D1 -> (d) dual-knob (user-selected).
