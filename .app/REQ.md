# Requirements Document — Formalize `wrapper` in the Elon Seat Framing

## Overview

`wrapper` has been a fully registered elon-ko team agent since v2.2.0 (gate allowlist, agent definition + mirrors, marketplace roster, skill, elon routing, PROTO/AGENTS/README/DEVREADME rows — all verified below). The one surface that still describes a **6-agent, release-less team** is the **bundled Elon seat framing** injected into every session: `src/append-system.default.md` (shipped via `package.json files:["src","rules"]`, loaded at `src/enforce-orchestrator.ts:89-95`, injected at `:189-201` whenever no `<cwd>/.omp/APPEND_SYSTEM.md` override exists — none does in this repo) and its byte-identical scaffold copy `scaffold/APPEND_SYSTEM.md`. This change syncs that framing to the real 9-agent roster (Q1), adds a wrapper bullet inside DONE — no new RELEASE phase (Q2), and flips the elon skill's DONE-phase Wrapper trigger from auto-spawn to **ask-first go/no-go** (Q3). Wrapper's release authority is ratified as-is (Q4). All decisions closed (PA-1…PA-4, decision log in `.app/PROJECT.md`).

## Verified Surface Inventory

### A. Already included — no-op guards, MUST NOT be touched

| # | Surface | Verified state |
|---|---------|----------------|
| A1 | Gate spawn allowlist `src/enforce-orchestrator.ts:61-71` | `TEAM` contains all 9: `reqguru, drpe, leaddev, validator, purecode, docworm, hr, wrapper, debugger` (`wrapper` since v2.2.0, CHANGELOG.md:148) |
| A2 | Agent definition + mirror | `plugins/agents/agents/wrapper.md` ≡ `.omp/agents/wrapper.md` (identical: tools `bash, read, write, edit, find, search`, `model: pi/smol`) |
| A3 | Marketplace roster `.omp-plugin/marketplace.json:17-18` | `agents[]` includes `wrapper`; `count: 10` |
| A4 | Wrapper skill | `plugins/agents/skills/wrapper/SKILL.md` + `.agents/skills/wrapper/SKILL.md` mirror |
| A5 | Elon routing `plugins/agents/skills/elon/SKILL.md:149,:246` (+ `.agents/` mirrors) | Routing-table entry "Ship a release …" → Wrapper; agent-registry entry "On demand in DONE" |
| A6 | `scaffold/PROTO.md:27` roster row (`mess=no`), `:254-262` Phase 6 §Wrapper conditional, `:311` Agent-to-Phase Map | Wrapper documented, DONE-positioned, escalation contract described |
| A7 | `scaffold/AGENTS.md:37,:46` | Elon's spawn list and Wrapper's Agent-Index row present |
| A8 | `README.md:20,:233,:264` (+:283) | 10-agent roster text, seat spawn list, `pi/smol` tier map |
| A9 | `.DEVREADME.md:55,:69,:78` (+:173) | Gate allowlist doc, tool/spawn matrix, roster count |
| A10 | **By-design exclusions** | `src/mess-transport.ts:48` mess-roster `TEAM` excludes `wrapper` (wrapper's tools lack `mess-send`/`mess-fail`; PROTO.md:27 `mess=no`) — correct, not a gap. No test pins framing text. No `.omp/APPEND_SYSTEM.md` override exists (read: not found), so the bundled default is always injected here. |

### B. Actual gap — the entire code change

| # | Surface | Verified gap |
|---|---------|--------------|
| B1 | `src/append-system.default.md` | §"What you do" item 2 lists only 6 agents (`reqguru, drpe, leaddev, validator, docworm, hr`); item 4 pipeline is `REQUEST → GRILL → [RESEARCH] → SPEC → DEVELOP ⇄ VALIDATE → DONE` — no `wrapper`, no `purecode`, no `debugger`, no release notion |
| B2 | `scaffold/APPEND_SYSTEM.md` | Byte-identical stale copy of B1 |
| B3 | `plugins/agents/skills/elon/SKILL.md:211` (+ `.agents/skills/elon/SKILL.md:211` mirror) | DONE-phase trigger clause reads "…if the change is being released (needs a version bump + tag), **spawn Wrapper** to cut and publish the release; otherwise skip with a noted reason" — auto-spawn. Q3 requires ask-first (see Delta below). The only in-scope edit to this file. |

## Scope

**In scope (complete list of edits):**
1. `src/append-system.default.md` — team list gains `wrapper` + `purecode` + `debugger` (Q1: full 9-agent spawnable roster, matching gate `TEAM`); workflow description gains a **wrapper bullet only** (Q2): Wrapper is a conditional, post-PASS release step inside DONE. No new RELEASE phase; DONE remains terminal; no changes to phase names, ordering, or budgets as described.
2. `scaffold/APPEND_SYSTEM.md` — updated to remain byte-identical to B1.
3. `plugins/agents/skills/elon/SKILL.md:211` — trigger clause only: ask-first go/no-go (Delta below). All other content on that line (phase placement, Debugger note, "Present final deliverable") and every other line of the file unchanged.
4. `.agents/skills/elon/SKILL.md:211` — byte-identical mirror of edit 3 (drift rule, `scaffold/PROTO.md:334`: source + local mirrors are written together, byte-identical).

**Out of scope (no-op guards — must remain untouched):** every surface in Inventory A: `src/enforce-orchestrator.ts`, `src/mess-transport.ts`, `.omp-plugin/marketplace.json`, both `wrapper` agent definitions, wrapper skill + mirror, elon SKILL.md `:149` and `:246` (and any line other than `:211`'s trigger clause) + their wording elsewhere, `scaffold/PROTO.md`, `scaffold/AGENTS.md`, `README.md`, `.DEVREADME.md`. Also explicitly out of scope: no new tests pinning framing text, no `.omp/APPEND_SYSTEM.md` creation, no new RELEASE phase or phase-structure change, no change to DEVELOP⇄VALIDATE (3-cycle) or PURECODE (2-cycle) budgets, no edits to Wrapper's own skill/authority (ratified as-is).

## Trigger Model (Q2 + Q3, resolved)

- **Position:** Wrapper runs strictly post-PASS, inside DONE, after the conditional DocWorm evaluation. It never runs inside DEVELOP⇄VALIDATE, consumes neither the 3-cycle correctness budget nor the 2-cycle PURECODE budget. Canonical phase structure stands: `plugins/agents/skills/elon/SKILL.md:211` and `scaffold/PROTO.md:254-262` (Phase 6 §Wrapper).
- **Ask-first go/no-go:** at DONE, Elon **always considers** Wrapper. If the change is being released (needs a version bump + tag), Elon puts a **pending ask to the user** before spawning — no release without explicit consent. If the user declines, or the change is internal-only, Wrapper is skipped with a noted reason.
- **Division of truth:** the framing (advisory seat text) gains a wrapper bullet naming the role and its DONE position; the ask-first trigger semantics live in the canonical protocol (`skill://elon`, SKILL.md:211), to which the framing already defers ("complete protocol is bundled at skill://elon"). The framing must not contradict the skill.
- **Ask mechanics:** the go/no-go ask is a pending ask under `.app/PROJECT.md` per the dot-agreement protocol; a trimmed `.` reply expresses consent.

## Authority Boundary (Q4 — ratified as-is, from `plugins/agents/skills/wrapper/SKILL.md` steps 4–8, boundaries)

**Wrapper may (autonomously):** derive the bump from Conventional Commits (`feat`→minor, `fix`→patch, `!`/`BREAKING CHANGE`→major; uses Elon-supplied type if given); bump the version manifest; create `release/vX.Y.Z`, commit only the bump (+ CHANGELOG if the project maintains one), push to origin; **auto-merge patch/minor PRs itself once CI is green and required approvals are satisfied**; after merge create annotated tag `vX.Y.Z` + platform release with conventional-commit notes; sync local `main` (`checkout main && pull origin main`); return a release-completion report.

**Wrapper escalates to Elon (never powers through):** MAJOR-bump merge (opens PR, pauses for human approval — never merges major autonomously); CI failure (→ LeadDev); stale/misleading/missing docs (→ DocWorm — wrapper must not edit docs, including doc-version mismatches it finds in step 3); ambiguous or missing version source/bump type; dirty tree or wrong base at preconditions.

**Wrapper never:** implements code, writes/fixes docs, validates, designs, spawns subagents, interacts with the user, runs builds/tests/lint (`bash` = `git`/`gh`/`glab` only), force-pushes or rewrites published tags/releases, or guesses a version.

No additional user gate beyond Q3's go/no-go is introduced.

## Failure Policy (resolved canonically, GRILL round 1)

- CI-red during release → Wrapper escalates to Elon with an escalation report → Elon routes to **LeadDev**; the release-triggered code fix **re-enters DEVELOP as a new change** (does not burn the current cycle's budget).
- Wrapper never fixes code itself and never force-pushes or rewrites published tags/releases.
- Escalation report shape is fixed by the skill's output contract: what happened, blocking evidence (command output / file:line / remote URL), suggested next agent.

## Functional Requirements

- **FR-1** `src/append-system.default.md`'s delegation/team list enumerates all 9 spawnable agents — `reqguru, drpe, leaddev, validator, purecode, docworm, hr, wrapper, debugger` — consistent with gate `TEAM` (A1). Falsifiable: a list missing any of the 9, or naming a non-spawnable agent, fails.
- **FR-2** The same file's workflow/pipeline description mentions Wrapper as a conditional release step **inside DONE, post-PASS** (wrapper bullet only). Falsifiable: any new phase named after DONE, any release step placed before/inside VALIDATE, or a pipeline string still ending at a DONE that lacks the wrapper notion, fails.
- **FR-3** `scaffold/APPEND_SYSTEM.md` is byte-identical to `src/append-system.default.md`. Falsifiable: `diff` non-empty.
- **FR-4** `plugins/agents/skills/elon/SKILL.md:211`'s trigger clause requires Elon to put a pending go/no-go ask to the user before any Wrapper spawn, and forbids release without consent; everything else on line 211 and every other line of the file is unchanged. Falsifiable: wording still auto-spawning, or a second line changed, fails.
- **FR-5** `.agents/skills/elon/SKILL.md` receives the identical `:211` edit. Falsifiable: `diff` between the two skill copies non-empty.
- **FR-6** The framing text remains advisory in its claims (it describes enforcement but asserts none of itself; hard enforcement stays attributed to the gate + agent frontmatter, as the existing framing footer already does). Falsifiable: any sentence claiming the framing itself enforces behavior.
- **FR-7** No file outside the four in-scope paths changes. Falsifiable: `git diff --name-only` against the pre-change baseline lists anything else.

## Non-Functional Requirements

- **NFR-1 Mirror integrity:** all byte-identical copy pairs (scaffold↔src framing; `.agents/`↔`plugins/` elon skill) stay byte-identical after the change (drift rule, `scaffold/PROTO.md:334`).
- **NFR-2 Zero runtime-behavior change:** no TypeScript source changes; `npm run typecheck` and `npm test` pass unchanged; the gate, mess transport, and dot-agreement extensions behave identically.
- **NFR-3 Advisory-envelope honesty:** the framing's wrapper/pipeline additions must not imply hard guarantees the advisory injection cannot deliver (the framing footer's caveat about advisory re-injection stands as the pattern).
- **NFR-4 Self-application:** this change's own release (if any) goes through the same Q3 ask-first gate at this workflow's DONE.

## Input/Output Contract

**Inputs:** the three logical files (four paths): `src/append-system.default.md`, `scaffold/APPEND_SYSTEM.md`, `plugins/agents/skills/elon/SKILL.md` + `.agents/skills/elon/SKILL.md`.

**Outputs:** edited files satisfying FR-1…FR-7; no other artifacts. The framing's team list and DONE description must not contradict `skill://elon` (post-edit), `scaffold/PROTO.md` Phase 6 §Wrapper, or the gate `TEAM`.

## Error Cases

| Case | Expected behavior |
|------|-------------------|
| User declines the go/no-go ask | Wrapper not spawned; skip recorded with noted reason |
| Change is internal-only (no version bump/tag needed) | No ask is strictly required to *skip*; Wrapper skipped with noted reason (an ask may still be made; declining is always honored) |
| CI red during release | Wrapper escalation report → Elon → LeadDev; fix re-enters DEVELOP as a new change |
| MAJOR bump reaches merge step | PR opened, merge paused, escalated for human approval via Elon |
| Docs stale vs. new version | Wrapper escalates (→ DocWorm); never edits docs itself |
| Version source/bump ambiguous; or dirty tree / wrong base | Wrapper escalates (Elon-decides); never guesses |
| Any escalation | Exactly one escalation report per the skill's output contract — never free-form narrative, never power-through |

## Acceptance Criteria

- **AC-1 (B1):** inspection of `src/append-system.default.md` shows a 9-agent team list incl. `wrapper`, `purecode`, `debugger`, and a wrapper bullet tying release to DONE/post-PASS; no new phase after DONE; pipeline still terminates at DONE.
- **AC-2 (B2):** `diff scaffold/APPEND_SYSTEM.md src/append-system.default.md` → empty output.
- **AC-3 (B3):** `plugins/agents/skills/elon/SKILL.md:211` states the ask-first gate (pending ask before spawn; no release without consent); diff vs. baseline shows only that line's trigger clause changed; `:149` and `:246` byte-unchanged.
- **AC-4 (B3 mirror):** `diff .agents/skills/elon/SKILL.md plugins/agents/skills/elon/SKILL.md` → empty output.
- **AC-5 (guards):** `git diff --name-only` shows exactly the four in-scope paths; `src/enforce-orchestrator.ts`, `src/mess-transport.ts`, `.omp-plugin/marketplace.json`, wrapper defs/skills, `scaffold/PROTO.md`, `scaffold/AGENTS.md`, `README.md`, `.DEVREADME.md` untouched.
- **AC-6 (no regression):** `npm run typecheck` exits 0; `npm test` exits 0 (no code touched, so both must pass unchanged).
- **AC-7 (consistency):** framing's roster and Wrapper description contain nothing contradicting the post-edit `skill://elon` DONE phase, `scaffold/PROTO.md` §Wrapper, or gate `TEAM`.

## Q3 Delta Callout (the only behavioral-text change beyond roster sync)

- **Current (verified, `plugins/agents/skills/elon/SKILL.md:211`):** "Evaluate whether Wrapper is needed: if the change is being released (needs a version bump + tag), spawn Wrapper to cut and publish the release; otherwise skip with a noted reason." → auto-spawn-if-released.
- **Required:** Elon always considers Wrapper at DONE and, when a release is indicated, puts a **pending ask to the user before spawning** — no release without consent. Decline or internal-only → skip with noted reason.
- **Scope fence:** only this line's trigger clause changes. Phase structure (Wrapper in DONE, post-PASS, no DEVELOP⇄VALIDATE budget consumption) per SKILL.md:211 and `scaffold/PROTO.md:254-262` is untouched. The mirror `.agents/skills/elon/SKILL.md:211` receives the identical edit (NFR-1).
- **Mechanics note:** the ask is recorded as the most-recent pending ask under `.app/PROJECT.md` `## Pending Asks`; the `.` agreement token applies.

## Open Questions

None. Grill complete — all branches closed: Q1 (PA-1, full 9-agent roster sync), Q2 (PA-2, Wrapper-in-DONE, no RELEASE phase), Q3 (PA-3, ask-first go/no-go), Q4 (PA-4, authority ratified as-is). Next phase: SPEC (LeadDev).
