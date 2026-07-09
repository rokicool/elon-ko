# PROJECT — Per-Agent Model Assignment (omp harness)

## Request
Bake per-agent model support into the elon-ko DISTRIBUTION so a one-liner
install gets it (research-only phase changed no distributed files — that was the gap).

## Classification
FULL — VALIDATE passed (PASS-WITH-NOTES); now RELEASING.

## Workflow
REQUEST → GRILL → [RESEARCH] → [SPEC] → [DEVELOP] ⇄ [VALIDATE] → DONE

## Status
- DEVELOP done (leaddev): 8 agents gained `model: pi/<role>`; config template +
  install wiring shipped; fallback non-failing (source-verified).
- VALIDATE (validator): PASS-WITH-NOTES. No code defects. Blocking item = release
  step itself (commit untracked template + cut tag + bump installer REF).
- RELEASING (wrapper): commit changes, bump version v2.4.0→v2.5.0, update
  elon_ko.sh:104 REF default, cut + push tag.

## Alias map (shipped)
- drpe, leaddev        → pi/slow
- middev, reqguru, validator → pi/task
- docworm, hr, wrapper → pi/smol

## Validator notes (non-blocking)
- README +39 lines (Per-agent models section) — additive docs, accurate.
- OOTB per-tier divergence requires authenticating multiple distinct models;
  single-model auth collapses all tiers (inherent, not a defect).
- Optional: document exact built-in slow/task/smol priority chains (drpe, later).

## Pending Asks
(none)
