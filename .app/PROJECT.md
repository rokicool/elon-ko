# PROJECT — elon-ko scaffold files load-bearing placement

## Request (verbatim)
AGENTS.md, APPEND_SYSTEM.md, PROTO.md, RULES.md only land in .omp/plugins/cache/marketplace/elon-ko/scaffold (download staging), never load-bearing. Research where they must go + redesign elon_ko.sh to place them.

## Classification
FULL — omp-internals research (done) + redesign of elon_ko.sh + Plugin A packaging.

## Workflow Path
REQUEST -> RESEARCH(done) -> SPEC(in_progress) -> DEVELOP -> VALIDATE -> DONE

## Phase Status
- REQUEST: done
- RESEARCH: done -> .app/RESEARCH-SCAFFOLD.md (source-grounded in pi-coding-agent@16.0.5)
- SPEC: in_progress (LeadDev)
- DEVELOP/VALIDATE/DONE: pending

## Research findings (DrPe, source-grounded)
- AGENTS.md: omp loads ONLY via walk-up-from-cwd (discovery/agents-md.ts:21-59), NEVER from a plugin. GENUINE DEFECT.
- APPEND_SYSTEM.md: no omp built-in; loaded by Plugin A enforce-orchestrator (bundled default src/append-system.default.md; override <cwd>/.omp/APPEND_SYSTEM.md). ALREADY LOAD-BEARING.
- PROTO.md: NO omp auto-load of any kind. Doc-only.
- RULES.md: NO load path for a root file; omp loads rules only from <root>/rules/*.md (omp-plugins.ts:92-107) or .agent[s]/rules/*.md.
- cache/marketplace/.../scaffold/ = DOWNLOAD STAGING (omp reads only marketplace.json from it; manager.ts:103-106). Plugin B agents load from cache/plugins/<mkt>___<name>___<ver>/ (task/discovery.ts:92-94). Plugin A from node_modules/<name>/.
- Enforcement NOT broken: gate + DoD rule + agent frontmatter ship correctly in Plugin A src/+rules/ + Plugin B agents/.
- IDEA-003: agents[] = catalog metadata only, NOT load-bearing; count is not an omp field.

## Decisions (user-approved)
- D-S1 AGENTS.md: elon_ko.sh copies -> <cwd>/AGENTS.md, OVERWRITE ALWAYS (both modes; cwd-relative).
- D-S2 APPEND_SYSTEM.md: NO installer copy (already load-bearing via Plugin A). Document optional <cwd>/.omp/APPEND_SYSTEM.md override.
- D-S3 PROTO.md: elon_ko.sh copies -> <cwd>/PROTO.md (doc-only; aids ref-resolution; never omp-loaded). Include.
- D-S4 RULES.md: MOVE into Plugin A rules/ as always-apply omp rule (frontmatter alwaysApply:true). Packaging change to Plugin A, NOT an installer copy. Remove misleading inert root/scaffold copy.
- Scope: BOTH GLOBAL + LOCAL (cwd-relative, identical; no omp-home dependence).
- IDEA-003 action: keep agents[] as docs; drop count mandate.

## Two redesign surfaces
1. elon_ko.sh: scaffold-deploy step (copy AGENTS.md overwrite-always + PROTO.md to <cwd>/; document APPEND_SYSTEM override; no RULES.md copy). Determine source path (scaffold/ in marketplace cache, or bundled in plugin pkg).
2. Plugin A packaging: RULES.md -> rules/<name>.md (always-apply omp rule); remove inert copies.

## Pending Asks
(none — decisions resolved)
