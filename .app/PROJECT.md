# PROJECT — Per-Agent Model Assignment (omp harness)

## Request
Bake per-agent model support into the elon-ko DISTRIBUTION so a one-liner
install gets it (research-only phase changed no distributed files — that was the gap).

## Classification
FULL — now in DEVELOP (research done; SPEC decisions resolved).

## Workflow
REQUEST → GRILL → [RESEARCH] → [SPEC] → **DEVELOP** ⇄ VALIDATE → DONE

## Decisions (from user)
- **Strategy:** Role aliases + default config.
  - Agent frontmatter uses `pi/<role>` aliases (no hardcoded provider/modelId).
  - Plugin ships a default `modelRoles` config mapping aliases to concrete models.
  - Portable: each machine's own config overrides; fallback chain covers gaps.
- **Tiering:** Reasoning-heavy split.
  - Tier 1 (strongest reasoning): drpe, leaddev
  - Tier 2 (strong general): middev, reqguru, validator
  - Tier 3 (small/fast): docworm, hr, wrapper

## Proposed alias mapping (leaddev to verify role support + refine)
- drpe, leaddev        → `pi/slow`  (most capable)
- middev, reqguru, validator → `pi/task` (strong general)
- docworm, hr, wrapper → `pi/smol`  (small/fast)

## Deliverables (leaddev → middev)
1. Add `model:` frontmatter to all 8 `plugins/agents/agents/*.md` per the tier map.
2. Ship a default `modelRoles` config (slow/task/smol) so aliases resolve OOTB.
3. Verify the one-liner install actually deploys BOTH the agent files and the config.
4. Confirm the fallback path: unconfigured/unavailable role → parent default, no hard-fail.

## Pending Asks
(none — decisions resolved)
