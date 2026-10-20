# PROJECT.md — Wrapper CHANGELOG gate (pre-PR/MR/release)

## Workflow
- Path: FULL — IN PROGRESS
- Phase log: REQUEST (add5c09) → GRILL (Q1–Q5 answered, REQ.md pending) → SPEC → DEVELOP ⇄ VALIDATE → DONE
- Prior workflow (wrapper team formalization, v2.8.2) — COMPLETE.

## Request (verbatim, condensed)
> I need you to extend the wrapper functionality to support CHANGELOG file. Before doing any PR, MR or Release — it must update the CHANGELOG file.
(Full user template: "Generate CHANGELOG Entry from Git Diff" — KaG categories; `### YYYY-MM-DD` + Engineer/Ticket; `#### Changed`/`#### Details`/`#### Affected Files`; prepend entries; never touch existing entries; prompt appended at file end; past tense; no trivial changes; inputs = diff vs main + engineer + ticket.)

## Verified context (reqguru, GRILL round 1 — supersedes REQUEST's "known tensions")
- No `## [Unreleased]` section and no Unreleased→version rewrite step exists; live convention = `## [vX.Y.Z] - YYYY-MM-DD` sections, KaG subsections, newest first. Wrapper's only changelog hook: step 4 parenthetical "(+ CHANGELOG if the project already maintains one)".
- Wrapper is the pipeline's ONLY PR/MR/release actor (elon routing + steps 4–8; LeadDev/MidDev commit, never publish). CI auto-publishes `pr-*` pre-releases on every non-main push — wrapper cannot gate those.
- Constraint: v2.8.2 ask-first go/no-go at DONE must not regress; changelog gate adds NO new consent prompt.

## Decision log
- [2026-10-20] PA-1 (Q1): hybrid nest — template content verbatim under `## [vX.Y.Z] - date` version header (Engineer/Ticket → #### Changed/Details/Affected Files); KaG declaration + tag↔section linkage preserved; no Unreleased staging.
- [2026-10-20] PA-2 (Q2): engineer/ticket bundled into existing release go/no-go ask (zero added prompts); fallback defaults engineer=git author, ticket=N/A. Fields always present.
- [2026-10-20] PA-3 (Q3): wrapper-only scope, skill-prose only — gate binds wrapper's release PR + tag/release; CI pr-* pre-releases exempt (un-gateable); other projects: touch CHANGELOG only if maintained, create on explicit request; no CI enforcement.
- [2026-10-20] PA-4 (Q4): embed template verbatim at CHANGELOG.md tail (separator + heading), written once at adoption, updated only on template change; maintenance is trivial-change-exempt (never self-triggers).
- [2026-10-20] PA-5 (Q5): release entries document prevTag..newTag; branch-vs-main only for hypothetical non-release PRs; Affected Files = all non-trivial files grouped by top-level dir/component, no cap.

## Delegation Log
- ReqGuru — GRILL r1. COMPLETED (premise corrected; 5 branches surfaced; recommendations all accepted).

## Pending Asks
- (none — PA-1..PA-5 answered synchronously)
