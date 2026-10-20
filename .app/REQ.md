# Requirements Document — Wrapper CHANGELOG Gate (pre-PR/MR/release)

Status: COMPLETE (all decision branches resolved — PA-1…PA-5, 2026-10-20). Synthesized from
GRILL round 1 verified repo facts and final user decisions. No open questions.

## Overview

The `wrapper` agent (release engineering) must, before it opens/merges any PR/MR or creates any
tag/release, generate and commit a CHANGELOG entry for the release, formatted per the user's
"Generate CHANGELOG Entry from Git Diff" template (Appendix A) hybrid-nested into this repo's
existing Keep-a-Changelog version-section convention. The gate is implemented as skill prose in
the wrapper SKILL.md (+ its `.agents/` byte-identical mirror) only; no tool-policy, CI, or agent
frontmatter changes. At adoption, the full template prompt is embedded verbatim at the tail of
this repo's CHANGELOG.md. Engineer/ticket metadata rides the existing v2.8.2 release go/no-go
ask — the gate adds zero new consent prompts.

## Verified Baseline (repo facts, read-confirmed 2026-10-20)

| # | Fact | Evidence |
|---|------|----------|
| B1 | CHANGELOG.md (397 lines) uses `## [vX.Y.Z] - YYYY-MM-DD` sections with KaG `###` subsections (Added/Changed/Fixed/Security observed), newest first (v2.8.2 → … → v1.2.2); no `## [Unreleased]` section and no Unreleased→version rewrite step exists anywhere | `CHANGELOG.md:1-63`, repo-wide grep for `Unreleased` (only `.app/` notes) |
| B2 | Wrapper's only changelog hook is the step-4 parenthetical "(+ CHANGELOG if the project already maintains one)"; tool policy already scopes `write`/`edit` to "CHANGELOG *only if the project already maintains one*" | `plugins/agents/skills/wrapper/SKILL.md` `<tool_policy>` + step 4 |
| B3 | Wrapper is the pipeline's only PR/MR/release actor (steps 4–8: release branch/commit/push → CI → PR/MR+merge → tag+release → sync main); escalates on docs/CI/version ambiguity/major-merge; never edits docs (DocWorm's domain) | `plugins/agents/skills/wrapper/SKILL.md` `<protocol>` steps 0–8, E |
| B4 | Wrapper skill ships in two byte-identical copies: `plugins/agents/skills/wrapper/SKILL.md` ≡ `.agents/skills/wrapper/SKILL.md` (identical line numbering and step text confirmed) | grep hits at identical lines 27–31/79–84 in both |
| B5 | Agent definition ships in two byte-identical copies: `plugins/agents/agents/wrapper.md` ≡ `.omp/agents/wrapper.md`; it contains **no** changelog-related wording — nothing contradicts the gate; it defers the full protocol to `skill://wrapper` | both files read; frontmatter `tools: bash, read, write, edit, find, search` |
| B6 | v2.8.2 established the ask-first release go/no-go: a release (version bump + tag) requires a pending go/no-go ask recorded in `.app/PROJECT.md` at DONE | `CHANGELOG.md` v2.8.2 entry; `.app/PROJECT.md:15` |
| B7 | CI auto-publishes `pr-*` pre-releases on every non-main push — wrapper cannot gate those | `.app/PROJECT.md:14` (GRILL r1) |

## Surface Inventory

| Surface | Change | Notes |
|---------|--------|-------|
| `plugins/agents/skills/wrapper/SKILL.md` | EDIT (prose) | The gate: entry-generation duty, ordering constraint, metadata sourcing/fallback, format spec reference. Tool policy already permits CHANGELOG write/edit (B2) — no `tools:` change. |
| `.agents/skills/wrapper/SKILL.md` | EDIT (prose, byte-identical mirror of the above) | Must remain byte-identical to the plugin copy (NFR-2). |
| `CHANGELOG.md` (this repo) | EDIT (one-time adoption) | (a) Embed the full template prompt verbatim at file tail behind a separator + heading (FR-4). (b) Existing entries byte-preserved (NFR-4). The first gate-generated entry is produced by the release that ships this feature (see Adoption Path below). |
| `plugins/agents/agents/wrapper.md` + `.omp/agents/wrapper.md` | NO CHANGE | Verified: no wording contradicts the gate (B5); the defers-to-skill structure already carries it. |

**Adoption path (first exercise of the gate):** the commit that lands the gate + embedding is a
normal DEVELOP change; the release that ships it (next vX.Y.Z) generates its own CHANGELOG entry
under the new rules — that entry is the first gate-generated output. Writing/updating the
embedded prompt copy is trivial-change-exempt and never generates an entry or bullet by itself
(FR-4c).

## In Scope

- Wrapper skill prose (both mirrors): the changelog gate — duty, ordering, entry format, metadata sourcing, baseline rules, embedding maintenance rule.
- One-time adoption edit to this repo's CHANGELOG.md (embedded prompt at tail; existing entries untouched).
- Gate binds wrapper's release PR/MR and `vX.Y.Z` tag/release in **this repo** (CHANGELOG maintained — B1).
- Non-release PR path (other projects / hypothetical): template's branch-vs-`main` diff input (FR-5b).

## Out of Scope

- Any tool-policy / agent frontmatter / gate-source (`src/enforce-orchestrator.ts`) change.
- Any CI workflow change or CI enforcement of changelog presence.
- CI `pr-*` auto-published pre-releases (un-gateable, B7).
- Creating CHANGELOG.md in other projects except on explicit request (Q3: only-if-maintained).
- DocWorm's general changelog behavior (`.agents/skills/docworm/SKILL.md` has its own lighter changelog step — untouched).
- Any Unreleased-section staging or rewrite step (explicitly rejected, Q1).

## Functional Requirements

### FR-1 — Gate ordering (the gate)
Wrapper MUST NOT open a PR/MR, merge a PR/MR, create a `vX.Y.Z` tag, or create a platform
release unless the CHANGELOG entry for that exact version is already written and committed on
the release branch. In the existing protocol this means entry generation happens at/before
step 4 (RELEASE BRANCH), so the entry rides the existing "+ CHANGELOG if the project already
maintains one" commit — which already precedes steps 6 (PR/MR + merge) and 7 (tag + release)
(B2, B3). Falsifiable: any wrapper release action observable without a prior changelog-entry
commit for that version = violation. If wrapper cannot produce a conforming entry, it MUST
ESCALATE (Elon-decides) per its existing step-E behavior — never skip the gate, never proceed
tag/PR-less.

### FR-2 — Entry format (hybrid nest, Q1/PA-1)
Each gate-generated entry is a new version section placed as the **first version section** in
the file — i.e., above the current newest `## [vX.Y.Z]` section, **after** the standing file
preamble (`# Changelog` title, KaG/SemVer declaration, Project-renamed note), because PA-1
preserves the KaG declaration and tag↔section linkage at the top of the file. Existing entries
MUST NOT be modified (template rule; NFR-4). Layout:

```markdown
## [vX.Y.Z] - YYYY-MM-DD

**Engineer:** <name> <email>
**Ticket:** <ticket or N/A>

### <KaG category>            <!-- one or more of: Added / Changed / Deprecated /
                               Removed / Fixed / Security — only categories with content -->
- <formal, concise, past-tense bullet naming affected files/components; no trivial changes>

#### Details
<prose: the "Details" block from the template — what/why, formal register, no emoji>

#### Affected Files
<all non-trivial files grouped by top-level directory/component, per FR-5c>
```

Mapping from the template (Appendix A): the template's `### <YYYY-MM-DD>` heading is realized
as the repo's `## [vX.Y.Z] - YYYY-MM-DD` version header (date folded in); Engineer/Ticket
lines follow verbatim; the template's `#### Changed` block generalizes to the repo's KaG `###`
category subsections carrying the template's bullet style (formal, concise, past tense,
affected files/components named, no trivial changes); `#### Details` and `#### Affected Files`
appear exactly once per entry, as `####` siblings closing the entry after the category
subsections.

### FR-3 — Metadata sourcing (Q2/PA-2)
- Engineer name + email and Jira ticket/story come from the **existing** release go/no-go ask
  (v2.8.2 ask-first, B6) — bundled into that single ask; the gate adds **no new consent
  prompt** (NFR-1).
- Fallback when the ask lacks them: engineer = git author (name + email) of the release
  commit; ticket = `N/A`.
- Both fields are always present in every entry — never omitted, never left as placeholders.

### FR-4 — Embedded prompt (Q4/PA-4)
- (a) The full template prompt (Appendix A, verbatim) is embedded at the tail of this repo's
  CHANGELOG.md, preceded by a separator (`---`) and a heading identifying it.
- (b) Written once at adoption; re-edited only when the template itself changes.
- (c) Trivial-change-exempt: maintaining the embedded copy never self-triggers a changelog
  entry or bullet (NFR-3).

### FR-5 — Baseline / diff inputs (Q5/PA-5)
- (a) **Release entries** (this repo's wrapper flow): the documented scope is
  `prevTag..newTag` — the diff/changed-files between the previous semver tag and the release
  being made.
- (b) **Non-release PRs** (template's literal input; other projects / hypothetical in this
  repo): compare current branch vs `main`.
- (c) **Affected Files** = all non-trivial changed files, grouped by top-level
  directory/component; no count cap, no truncation.

## Non-Functional Requirements

- **NFR-1 No consent-prompt regression:** the v2.8.2 ask-first go/no-go remains exactly one
  pending ask; engineer/ticket ride it (FR-3). Zero added user prompts.
- **NFR-2 Mirror byte-identity:** `plugins/agents/skills/wrapper/SKILL.md` and
  `.agents/skills/wrapper/SKILL.md` remain byte-identical after the edit; agent-def mirrors
  remain byte-identical and unmodified (B4, B5).
- **NFR-3 No self-trigger:** embedding maintenance is trivial-change-exempt (FR-4c); the
  changelog gate never generates an entry about its own prompt-maintenance edits.
- **NFR-4 Existing entries immutable:** on every prepend, all pre-existing CHANGELOG.md bytes
  below the insertion point are preserved verbatim (template rule "never modify existing
  entries").
- **NFR-5 Register:** entries read as a precise formal technical writer — no emoji, no casual
  tone, past tense, non-trivial content only (template role; enforceable by review).
- **NFR-6 No new enforcement surface:** the gate lives in skill prose only; no CI check, no
  source-code gate change (Q3).

## Input/Output Contract

**Inputs (per release):**
- Diff/changed-file list over baseline `prevTag..newTag` (release) or branch-vs-`main`
  (non-release PR) — FR-5.
- Engineer name + email and ticket: from the go/no-go ask, else git-author / `N/A` fallbacks — FR-3.
- Version `vX.Y.Z` and release date `YYYY-MM-DD`: from wrapper's bump derivation and entry-write date.

**Output:** exactly one new top-of-history version section in `CHANGELOG.md` per FR-2 layout,
committed on `release/vX.Y.Z` before any PR/MR/tag/release action (FR-1). No other file
changes attributable to the gate.

## Error Cases

| Case | Expected behavior |
|------|-------------------|
| Go/no-go ask lacks engineer and/or ticket | Fallbacks apply (engineer = git author, ticket = `N/A`); fields still present (FR-3). Not an error; no escalation. |
| No prior tag exists (baseline undefined for FR-5a) | ESCALATE (Elon-decides) — consistent with existing step-1 "no prior tag → escalate, do not guess" (B3). The gate never invents a baseline. |
| CHANGELOG.md absent (other projects) | Do not create it; gate limited to "only if the project already maintains one" (B2 tool policy, Q3). Create only on explicit request; a CHANGELOG created on explicit request includes the embedded prompt at tail from the start. |
| Entry cannot be made conforming (e.g., nothing non-trivial to document) | ESCALATE rather than proceed tag/PR-less or write a vacuous entry (FR-1). In practice every release documents at least its lockstep version-bump surfaces (see B1 convention), so this is not expected. |
| Template itself changes later | Update the embedded copy (FR-4b); the update is trivial-change-exempt (FR-4c). |

## Acceptance Criteria

**Per surface:**
1. `plugins/agents/skills/wrapper/SKILL.md` (+ mirror): prose exists stating (i) the FR-1
   ordering duty, (ii) FR-2 format, (iii) FR-3 sourcing/fallbacks, (iv) FR-5 baselines; mirrors
   byte-identical (`diff` empty); `tools:` frontmatter of both agent-def mirrors unchanged.
2. `CHANGELOG.md`: template prompt embedded verbatim at tail behind separator + heading; all
   pre-existing entries byte-identical to before adoption; next release's entry matches the
   FR-2 layout and carries Engineer/Ticket.
3. Agent defs (`plugins/agents/agents/wrapper.md`, `.omp/agents/wrapper.md`): byte-identical
   to pre-adoption state (unchanged).

**End-to-end (first gate exercise):**
4. The release shipping this feature produces its CHANGELOG entry via the gate: entry commit
   precedes PR/MR open and tag/release creation in the observable sequence.
5. Exactly one user-facing ask occurs for that release (the go/no-go), now carrying
   engineer/ticket — no additional prompt.
6. The embedding edit itself appears in no changelog entry or bullet (self-trigger absent).

## Open Questions

None. All branches resolved (PA-1…PA-5, `.app/PROJECT.md` decision log, 2026-10-20).

---

## Appendix A — User's Template (verbatim; the feature's contract)

> "Generate CHANGELOG Entry from Git Diff": Role = precise formal technical writer, no emoji.
> Compare current branch vs `main`. Entry format: `### <YYYY-MM-DD>` → `**Engineer:** <name>
> <email>` → `**Ticket:** <ticket/story>` → `#### Changed` (formal concise bullets, past
> tense, affected files/components named, no trivial changes) → `#### Details` → `####
> Affected Files`. New entries at file beginning; never modify existing entries; add/update
> this prompt at file end. KaG categories: Added/Changed/Deprecated/Removed/Fixed/Security.
> Inputs: diff/changed-files vs main, engineer name, Jira ticket.
