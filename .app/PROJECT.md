# PROJECT — Per-Agent Model Assignment (omp harness)

## Request
Bake per-agent model support into the elon-ko DISTRIBUTION so a one-liner
install gets it (research-only phase changed no distributed files — that was the gap).

## Classification
FULL — DONE. Shipped as v2.5.0.

## Workflow
REQUEST → GRILL → [RESEARCH] → [SPEC] → [DEVELOP] ⇄ [VALIDATE] → **DONE**

## Outcome — v2.5.0 released
- **8 agents** carry tiered model role aliases:
  - pi/slow  → drpe, leaddev
  - pi/task  → middev, reqguru, validator
  - pi/smol  → docworm, hr, wrapper
- **Config template** `scaffold/models.example.yml` ships in the distribution;
  installer deploys it to `.omp/config.example.yml` (inert, opt-in, overridable).
- **OOTB**: aliases resolve via built-in role priority chain, zero config needed,
  non-failing fallback (verified against omp source).
- **Installer REF default** `elon_ko.sh:104` → v2.5.0, so the plain one-liner
  fetches the tag that carries the template.

## Release artifacts
- Tag v2.5.0 (annotated, pushed); Release auto-published w/ artifacts + SHA256SUMS.
- CI green: plugin validation, one-liner installer smoke, release gate (tag==version).
- Commits: 7c6ca30 (feat), c2e1418 (release), 6e64b18 ([DOCS] pins), 9a5484e (help-text fix).
- main pushed + in sync; working tree clean.

## Validator verdict
PASS-WITH-NOTES → resolved. No code defects. Blocking item (template not on tag)
fixed by the release. Non-blocking notes (OOTB divergence needs multiple
authenticated models; optional priority-chain docs) tracked below.

## Optional follow-ups (non-blocking)
- Document exact built-in slow/task/smol priority chains (drpe) for verifiability.
- Next release folds in the [DOCS] + help-text commits already on main.

## Pending Asks
(none)
