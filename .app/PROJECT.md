# PROJECT — elon-ko scaffold files load-bearing placement

## Request (verbatim)
AGENTS.md, APPEND_SYSTEM.md, PROTO.md, RULES.md only land in .omp/plugins/cache/marketplace/elon-ko/scaffold (download staging), never load-bearing. Research + redesign elon_ko.sh (+ packaging) to place them load-bearing.

## Classification
FULL — omp-internals research (done) + redesign of elon_ko.sh + Plugin A packaging.

## Workflow Path
REQUEST -> RESEARCH(done) -> SPEC(done) -> DEVELOP(in_progress) -> VALIDATE -> DONE

## Phase Status
- REQUEST: done
- RESEARCH: done -> .app/RESEARCH-SCAFFOLD.md
- SPEC: done -> .app/SCAFFOLD-SPEC.md (37KB, AC-S1..S10)
- DEVELOP: in_progress (LeadDev — elon_ko.sh + Plugin A packaging)
- VALIDATE/DONE: pending

## Design (locked)
- AGENTS.md: elon_ko.sh fetches from raw GitHub (keyed to $REF=Plugin A pin) -> <cwd>/AGENTS.md, OVERWRITE ALWAYS, fatal on fetch failure. Both modes.
- PROTO.md: same fetch -> <cwd>/PROTO.md, overwrite-always, NON-fatal on fetch failure (doc-only).
- APPEND_SYSTEM.md: NO deploy (already load-bearing via Plugin A bundled default); document <cwd>/.omp/APPEND_SYSTEM.md override.
- RULES.md: MOVE scaffold/RULES.md -> Plugin A rules/ro-orchestrator-invariant.md (alwaysApply:true); delete scaffold/RULES.md. NO functional dup with DoD rule (4-layer reinforcement).
- scaffold/AGENTS.md coherence edits (AC-S7): drop RULES.md from advisory list; add 2nd Sticky rule ref.
- Uninstall: leave <cwd>/AGENTS.md + PROTO.md in place (non-destructive); add 'left in place' notice.
- Scope: BOTH modes (cwd-relative, identical). No regression to prior 12 ACs (AC-S6 amends AC-1 modulo set).

## Residual risks (documented, accepted)
R-S1 MEDIUM stable scaffold pinned to $REF lags Plugin B 'always latest' (cosmetic; agent defs load-bearing via frontmatter). R-S2 LOW raw-GitHub net dep for AGENTS (mitigated: fatal-on-fail). R-S3 LOW AGENTS coherence edits (AC-S7). R-S4 LOW APPEND_SYSTEM disposition deferred to DocWorm. R-S5 LOW 2 always-apply rules, negligible prompt cost.

## Build-on (prior task FINAL)
LOCAL/GLOBAL install modes shipped (12/12 ACs). Dual-knob PI_CONFIG_DIR+XDG_DATA_HOME. HEAD now advancing from scaffold work.

## Pending Asks
(none — decisions resolved: D-S1..D-S4 user-approved)
