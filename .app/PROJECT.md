# PROJECT.md — Wrapper CHANGELOG gate (pre-PR/MR/release)

## Workflow
- Path: FULL — IN PROGRESS
- Phase log: REQUEST (this entry) → GRILL → [RESEARCH] → SPEC → DEVELOP ⇄ VALIDATE → DONE
- Prior workflow (wrapper team formalization, v2.8.2) — COMPLETE, see git history ad99d2b/2537aa2.

## Request (verbatim, condensed)
> I need you to extend the wrapper functionality to support CHANGELOG file. Before doing any PR, MR or Release — it must update the CHANGELOG file.
(Full prompt template supplied by user: "Generate CHANGELOG Entry from Git Diff" — Keep a Changelog categories; entry format = `### <YYYY-MM-DD>` + Engineer name/email + Ticket, sections `#### Changed` / `#### Details` / `#### Affected Files`; new entries prepended; never modify existing entries; the prompt itself appended/updated at end of CHANGELOG.md; past tense; no trivial changes; inputs = diff vs main + engineer name + Jira ticket.)

## Known tensions (to resolve in GRILL)
- Current repo convention: Keep a Changelog versioned sections (`## [Unreleased]` → `## [2.8.2]`), wrapper's release step rewrites Unreleased → version. User template: date-headed entries with Engineer/Ticket metadata, prepended at file top. Coexistence/migration rule needed.
- Template requires Engineer name + Jira ticket — repo has no Jira; per-release sourcing needed (ask user / default /omit?).
- Scope: rule lives in wrapper SKILL.md only, or also elon protocol DONE/RELEASE wording; do non-release PRs by other agents (LeadDev/MidDev) get the gate too?
- "Add this prompt to the end of CHANGELOG.md" — embed full prompt text in the shipped file (also mirror implications).

## Decision log
- (none yet)

## Delegation Log
- (none yet)

## Pending Asks
- (none yet)
