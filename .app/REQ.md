# Requirements Document — Hire `debugger` Agent into the elon-ko Distributed Team

- **Source:** Promoted from parked idea **IDEA-002** ("Add debug agent role to the team pipeline").
- **Status:** **GRILL COMPLETE** — every decision branch is resolved; no open blocker remains. Ready for the GRILL → SPEC gate.
- **Resolves inline:** **IDEA-003** (marketplace `agents[]` / `count` registration model) — see §RESEARCH Dependency for the one confirmation item handed to DrPe.
- **Author:** ReqGuru (seeded in REQUEST phase; finalized after GRILL).
- **Date:** 2026-07-09.
- **Supersedes:** the REQUEST-phase seed of this same document (recoverable from git history).

---

## Overview

Hire a dedicated **`debugger`** agent into the elon-ko distributed team (DEV-BASE context). Today the roster fields **8 agents** (`hr, docworm, drpe, leaddev, middev, reqguru, validator, wrapper`) — none owns a debugging *procedure*. This agent fills that gap: a **read-only, diagnose-only** root-cause analyst that takes a failure (CI/CD pipeline failure or a general codebase/runtime bug), reproduces/inspects it, and returns a **root-cause report with `file:line` evidence and a recommended fix**. It does **not** write code — a fixing agent (`leaddev`/`middev`) applies the fix. It is spawned **on demand by Elon** (not a new pipeline phase), runs **solo** (no `spawns`), and ships in **Plugin B** (`elon-ko-agents`).

The hire is a **full distributed hire** governed by the HR DEV-BASE procedure: source definition + skill, local mirrors, all mandatory registrations, plus the LeadDev/Wrapper/restart follow-ups.

---

## Confirmed Facts (verified in this repo, 2026-07-09)

Direct codebase evidence — no user input required.

- **F1. No debug agent exists.** Full-repo search for `gsd-debugger` returns **zero** matches in source/docs; the string appears only in Elon context (`.app/PROJECT.md`) and the assignment brief. Roster = 8 agents.
- **F2. Two agents already hold the `debug` tool** but own no procedure. `leaddev` and `middev` both list `debug` (+ `bash`, `lsp`, `ast_grep`, `ast_edit`) in enforced frontmatter (`plugins/agents/agents/{leaddev,middev}.md`). `validator` does **not** have `debug`. Harness capability exists; no agent *owns* debugging.
- **F3. Agent frontmatter shape** (`plugins/agents/agents/<name>.md`): `name`, `description`, `tools` (comma-separated, harness-enforced), optional `spawns`, `model` (`pi/slow` | `pi/task` | `pi/smol`).
- **F4. Enforced search/glob token names are `search` and `find` — NOT `grep`/`glob`.** **All 8 agent files use `search, find`** (`hr`, `docworm`, `drpe`, `leaddev`, `middev`, `reqguru`, `validator`, `wrapper`); none uses `grep` or `glob`. The gate source confirms the enforced token set: `src/enforce-orchestrator.ts:197` enumerates `find, search, lsp` as the blocked-for-Elon names. → **The assignment brief's `grep, glob` are generic oh-my-pi names; this repo's enforced convention is `search, find`. The frontmatter MUST use `search, find`** or the tools will not resolve.
- **F5. Model tier map** (`scaffold/models.example.yml:6-8`): `pi/slow` (drpe, leaddev — deep reasoning), `pi/task` (middev, reqguru, validator — doing/auditing), `pi/smol` (docworm, hr, wrapper — lightweight).
- **F6. marketplace registration surface** (`.omp-plugin/marketplace.json`): `plugins[0].agents` is an array of 8 names; `plugins[0].description` = `"8-agent orchestrator roster + 9 skills."` (embeds **two** counts: agents **and** skills); **no `count` field exists**. Top-level `metadata.description` has **no** count.
- **F7. Current skill count = 9.** `plugins/agents/skills/` has 9 dirs: `hr, wrapper, elon, docworm, validator, reqguru, drpe, middev, leaddev`. A full distributed hire adds `debugger/SKILL.md` → skills **9 → 10**. **The description string therefore carries BOTH numbers and both must be bumped** (agents 8→9, skills 9→10).
- **F8. `bash` sub-scoping is procedural, not token-level.** No frontmatter-level allowlist/restriction exists for `bash` in this repo. `validator` lists bare `bash` and constrains it in prose ("run existing tests only"); `wrapper` lists bare `bash` and constrains to `git/gh/glab`. → A diagnose-only `bash` envelope is **defined by the skill/role, enforced by procedure**, mirroring `validator`.
- **F9. `validate-plugins.sh` does NOT reject unknown JSON fields.** It checks JSON validity via `jq -e .` and reads only `.name`/`.source` per plugin (`scripts/validate-plugins.sh:38-59`). It performs **no JSON-schema validation** against the declared `$schema` URL. → Adding a `count` field is **CI-safe** for this script.
- **F10. IDEA-003 was already resolved by prior research in this same `.app/`.** `.app/RESEARCH-SCAFFOLD.md` (F7) and `.app/RESEARCH.md` (Dim 2 / item 5) both conclude: `marketplace.json` `agents[]` is **catalog metadata only, NOT load-bearing** — agents register by filesystem scan of `<installPath>/agents/*.md` (`task/discovery.ts:92-94`), and `count` is **not an omp field** (`marketplace/types.ts:65-95`), consumed by nothing. `SCAFFOLD-SPEC.md` encodes "no `count` added" for the *scaffold* effort — but that decision is **scoped to a different workflow** and does not override this hire's D6.
- **F11. HR DEV-BASE procedure is mandatory and non-conditional** (`plugins/agents/skills/hr/SKILL.md:78-113`): source + local mirrors (byte-identical); registrations = `marketplace.json` agents[] + count, an `scaffold/AGENTS.md` Agent Index row, and an `scaffold/PROTO.md` Agent-to-Phase Map row; plus LeadDev (allowlist wiring) + Wrapper (release) + full omp restart follow-ups.
- **F12. Elon's enforced spawn allowlist** (`scaffold/AGENTS.md:37`) = `reqguru, drpe, leaddev, validator, docworm, hr, wrapper`. A spawnable agent needs adding here **and** in `src/enforce-orchestrator.ts` `TEAM`.
- **F13. `mess-transport.ts` TEAM wiring is only required if the agent has `mess-send`/`mess-fail`.** (Per F11 follow-up notes.) Since this agent has **neither** (D-derived), **no `src/mess-transport.ts` change is required.**

---

## Resolved Decisions

| ID | Decision | Resolution (locked) |
|----|----------|---------------------|
| **D1** | Scope | **BOTH.** CI/CD pipeline failures (test/build/lint/deploy failures surfaced by CI) **and** general codebase/runtime bugs (crashes, logic errors, wrong output, flaky tests). |
| **D2** | Capability | **DIAGNOSE ONLY.** Read-only root-cause report with `file:line` evidence + recommended fix. Does **not** write code. A fixing agent (`leaddev`/`middev`) applies the fix. No edit/write tools. |
| **D3** | Model tier | **`pi/task`** (Tier 2 — strong general, like `middev`/`validator`). |
| **D4** | Name | **`debugger`** (single-word, unique, valid `task(agent=...)` id). |
| **D5** | Pipeline integration | **On demand by Elon.** NOT a new pipeline phase. No new phase subsection in `PROTO.md`; no `PROTO.md` workflow-gate change. |
| **D6** | Registration | Add to `marketplace.json` `agents[]` **and** add a dedicated `count` field (per user). Resolves IDEA-003 inline. |
| **D7** *(derived)* | Tool surface | **`read, bash, search, find, lsp, debug`.** No `edit`/`write`/`ast_edit`/`ast_grep` (diagnose-only). `bash` = diagnostic (run tests, read logs, `gh`/`glab` CI logs, build runs) — `gh`/`glab` access YES (CI scope). No `mess-send`/`mess-fail` (on-demand, returns result directly to Elon). **Note:** assignment brief wrote `grep, glob`; corrected to repo-enforced `search, find` (F4). |
| **D8** *(derived)* | Spawning | **Solo.** No `spawns` field. Spawned directly by Elon on demand. |
| **D9** *(derived)* | Invocation trigger | Elon decides when to invoke (pipeline failure, validation failure, user request, any debugging need). No automatic CI-red hook. |
| **D10** *(derived)* | Failure types in scope | test failures, runtime crashes, CI pipeline failures, flaky tests, logic errors. **Performance regressions = stretch** (may need profiling tools absent from the allowlist). |
| **D11** *(derived)* | Hire type | **Full distributed hire** — ships in Plugin B, available to all installs. |

**Documented implications / tensions (surfaced, not buried):**

- **T1 — D5 vs the mandatory PROTO row.** D5 says "no PROTO.md change," but the HR DEV-BASE procedure (`hr/SKILL.md:6c-c`) mandates appending an **Agent-to-Phase Map row** for *every* distributed agent (adding a *phase subsection* is the only conditional part). **Interpretation locked:** D5 means *no new phase / no phase subsection / no workflow-gate change* — **the registration row is still added**, with its phase column reading "on-demand / cross-phase" (not a phase owner). SPEC and HR must treat "no PROTO.md change" in this narrowed sense.
- **T2 — `debugger` ≠ external `gsd-debugger`.** The external DevOps workflow references the exact string `gsd-debugger` (F1). D4 chose `debugger`, so **that external reference remains unsatisfied by this hire**. It is **out of scope** here (the workflow is external and may live outside this repo); if/when integration is needed, a name alias or a workflow update is a separate effort. **Flagged for Elon** — not a blocker for this hire.

---

## Exact Tool Allowlist (agent frontmatter)

```
read, bash, search, find, lsp, debug
```

| Tool | Purpose | Justification |
|------|---------|---------------|
| `read` | read source, logs, configs, specs | core diagnostic read |
| `bash` | run tests/builds, read logs, `gh`/`glab` CI logs | reproduce failures (D1, D10); envelope is procedural per F8 |
| `search` | regex search across files | repo-enforced token (F4); locate failure sites |
| `find` | glob/locate files by pattern | repo-enforced token (F4); map structure |
| `lsp` | go-to-def / references / hover | root-cause across call sites |
| `debug` | attach / step / breakpoints | live process inspection (read-only observation) |

**Explicitly excluded** (diagnose-only, D2): `edit`, `write`, `ast_edit`, `ast_grep`, `task`, `mess-send`, `mess-fail`, `web_search`, `browser`, `ask`, `irc`, `resolve`. Absence of `mess-send`/`mess-fail` means **no `src/mess-transport.ts` change** (F13). Absence of `task` means **no `spawns`** (D8).

> **Naming caveat (load-bearing):** the frontmatter MUST list `search`/`find`, not `grep`/`glob`. Writing `grep, glob` would name tools omp does not enforce under this repo's tokens, crippling the agent. (F4)

---

## Agent Definition Sketch (frontmatter — no implementation detail)

```yaml
---
name: debugger
description: Root-cause analyst. Diagnoses CI/CD pipeline failures and codebase/runtime bugs; returns a read-only report with file:line evidence and a recommended fix. Does not write code.
tools: read, bash, search, find, lsp, debug
model: pi/task
---
```

- **No `spawns` field** (solo — D8).
- The **body** (role framing, skill pointer, output contract) and the **skill file** (`plugins/agents/skills/debugger/SKILL.md` — the diagnose procedure, report format, evidence standard) are **SPEC + HR work, out of scope for this document.** This sketch fixes only the enforced frontmatter.

---

## Registration Requirements

### marketplace.json (`.omp-plugin/marketplace.json`)
1. Append `"debugger"` to `plugins[0].agents` → 9-entry array.
2. Add a dedicated `count` field to `plugins[0]` (D6). **Value = 9.** (Non-load-bearing per F10 — documentation/metadata only — but added per user decision and consistent with the `hr/SKILL.md:79,110` mandate.)
3. Bump `plugins[0].description`: `"8-agent orchestrator roster + 9 skills."` → `"9-agent orchestrator roster + 10 skills."` (agents **and** skills both bump — F6, F7).

### Index / phase-map registrations (hr DEV-BASE mandatory)
4. `scaffold/AGENTS.md` — append a **debugger row** to the Agent Index table (exact column format of rows at `:37-45`); append `debugger` to Elon's **Enforced spawns** cell (`:37`).
5. `scaffold/PROTO.md` — append a row to the **Agent-to-Phase Map** with phase = "on-demand / cross-phase"; **do NOT** add a phase subsection (D5, T1).

### Code allowlist wiring (LeadDev follow-up, DEVELOP)
6. `src/enforce-orchestrator.ts` — add `debugger` to the `TEAM` const so Elon can spawn it (F12).
7. **No** `src/mess-transport.ts` change (F13).

### Source + mirrors (byte-identical, hr DEV-BASE)
8. SOURCE: `plugins/agents/agents/debugger.md` + `plugins/agents/skills/debugger/SKILL.md`.
9. LOCAL MIRRORS: `.omp/agents/debugger.md` + `.agents/skills/debugger/SKILL.md` (byte-identical).

### Release / activation (Wrapper + ops)
10. Version bump + tag/release (Wrapper); **full omp restart** required before `task(agent="debugger")` is recognized.

---

## RESEARCH Dependency (DrPe) — the only open item

**Context:** prior research in this `.app/` already answered most of IDEA-003 (F10). The questions below are therefore **confirmations/extensions**, not a from-scratch investigation.

**DrPe must confirm:**

1. **(Confirmation — low effort.)** Re-verify against the **current** omp version that `marketplace.json` `agents[]` remains **metadata-only / non-load-bearing** (prior finding: registration is by filesystem scan of `<installPath>/agents/*.md`, `task/discovery.ts:92-94`). *Expected: still metadata-only.*
2. **(The genuine open question.)** The marketplace file declares `"$schema": "https://anthropic.com/claude-code/marketplace.schema.json"`. Does **omp at install time** (or any CI step) validate `marketplace.json` against that schema with `additionalProperties:false`, such that a new `count` field would be **rejected**?
   - Already verified: `scripts/validate-plugins.sh` (the repo CI gate) does **NOT** reject unknown fields (F9).
   - Prior finding: omp's own `marketplace/types.ts:65-95` has no `count` and does not consume it (F10).
   - **Residual unknown:** the external Anthropic-hosted `$schema` document's `additionalProperties` policy, and whether omp enforces it at `plugin marketplace add`.
3. **(Recommendation request.)** If (2) shows any rejection risk, what is the safe shape for the `count` field — top-level, under `metadata`, or under `plugins[0]` — that survives both `validate-plugins.sh` and omp's schema handling?

> **Blocker status:** LOW. Even in the worst case (schema rejects `count`), the functional hire is unaffected — agents register by file presence (F10), and `agents[]` + description bump are the load-bearing human-readable registrations. A `count`-field schema conflict would only block the *cosmetic* D6 addition, resolved by relocating or omitting `count`. **DrPe's answer gates only the `count` field shape, not the hire itself.**

---

## Functional Requirements (each falsifiable)

- **FR-1.** A registered distributed agent named `debugger` exists: `plugins/agents/agents/debugger.md` + `plugins/agents/skills/debugger/SKILL.md`, with byte-identical mirrors under `.omp/agents/` and `.agents/skills/`.
- **FR-2.** The agent is **diagnose-only**: its enforced `tools:` frontmatter contains **no** mutation tools (`edit`, `write`, `ast_edit`, `ast_grep`). (Falsifiable: grep the file.)
- **FR-3.** The enforced `tools:` frontmatter equals **exactly** `read, bash, search, find, lsp, debug` — set-equal, no more, no less.
- **FR-4.** `model:` equals `pi/task`.
- **FR-5.** There is **no `spawns:` field** (solo agent).
- **FR-6.** The agent's sole deliverable is a **read-only root-cause report** containing: the failure, the root cause, `file:line` evidence, reproduction/observation notes, and a **recommended fix** (applied by another agent). It produces no code edits. (Falsifiable via the skill's output contract + Validator audit.)
- **FR-7.** The agent is **spawnable by Elon**: present in `src/enforce-orchestrator.ts` `TEAM` and `scaffold/AGENTS.md` enforced-spawns.
- **FR-8.** Scope covers **both** CI/CD pipeline failures and general codebase/runtime bugs (D1, D10).
- **FR-9.** `bash` is used only for **diagnostic** commands (run tests/builds, read logs, `gh`/`glab` CI logs); the diagnostic-only envelope is defined in the skill (procedural per F8).
- **FR-10.** Registration: `debugger` in `marketplace.json` `agents[]`; a `count` field added (value 9); description bumped to `9-agent … 10 skills`; `AGENTS.md` row + `PROTO.md` row added.
- **FR-11.** The agent ships in **Plugin B** (`elon-ko-agents`), available to all installs (D11).
- **FR-12.** No new pipeline phase is introduced; invocation is **on demand by Elon** (D5, D9).

## Non-Functional Requirements

- **NFR-1.** Defense-in-depth read-only posture: file-mutation impossible at the tool level (no edit/write tokens), even though the skill already forbids writes.
- **NFR-2.** Name is a single token, valid as a `task(agent="…")` identifier, unique in the roster, consistent with the terse convention (`hr`, `drpe`, `wrapper`, …).
- **NFR-3.** No new model or credential dependency — reuses the existing `pi/task` tier.
- **NFR-4.** Changes pass `bash scripts/validate-plugins.sh` (exit 0) and repo typecheck.
- **NFR-5.** All count-bearing docs are internally consistent (single source of truth: 9 agents, 10 skills) after the hire.

---

## Acceptance Criteria (for the Validator)

- **AC-1.** `plugins/agents/agents/debugger.md` + `plugins/agents/skills/debugger/SKILL.md` exist with required frontmatter (`name`, `description`, `tools`, `model`); no `spawns` key.
- **AC-2.** Frontmatter `tools:` is set-equal to `{read, bash, search, find, lsp, debug}`; contains none of `{edit, write, ast_edit, ast_grep, task, mess-send, mess-fail}`.
- **AC-3.** Frontmatter `model:` == `pi/task`.
- **AC-4.** `.omp/agents/debugger.md` and `.agents/skills/debugger/SKILL.md` are byte-identical to their `plugins/` sources.
- **AC-5.** `.omp-plugin/marketplace.json`: `debugger` ∈ `plugins[0].agents`; a `count` field is present (= 9); `plugins[0].description` reads `9-agent … 10 skills`.
- **AC-6.** `src/enforce-orchestrator.ts` `TEAM` includes `debugger`.
- **AC-7.** `src/mess-transport.ts` is **unchanged** (no mess tools → no wiring) — verify no debugger-related edit was made.
- **AC-8.** `scaffold/AGENTS.md` Agent Index has a debugger row; Elon's enforced-spawns cell lists `debugger`.
- **AC-9.** `scaffold/PROTO.md` Agent-to-Phase Map has a debugger row marked on-demand; **no** new phase subsection was added.
- **AC-10.** Every count-bearing doc (see §Count-bearing docs below) shows **9 agents / 10 skills** (or 9-agent) consistently.
- **AC-11.** `bash scripts/validate-plugins.sh` exits 0 after all changes.
- **AC-12.** (Smoke, post-restart) `task(agent="debugger")` is recognized by omp and returns a diagnose-only report on a seeded failure.

### Count-bearing docs to update (8→9 agents, and 9→10 skills where both appear)
- `.omp-plugin/marketplace.json:13` — description (agents **and** skills) + add `debugger` to `agents[]` + add `count`.
- `README.md:20` — "8 specialist agents + 9 skills" → 9/10; add `debugger` to the enumerated list.
- `.DEVREADME.md:15` — "8 agent definitions + 9 skills" → 9/10.
- `.DEVREADME.md:34` — "8 agent definitions (Plugin B)" → 9.
- `scaffold/AGENTS.md:8` — "8 agent definitions" → 9 (+ debugger Index row + enforced-spawns).
- `elon_ko.sh` — 5 occurrences (`:7, :561, :564, :696, :723`) "8 agents + 9 skills" → 9/10.
- `.github/workflows/release.yml:98` — "(8 agents + 9 skills; markdown only)" → 9/10.
- `scaffold/PROTO.md` — Agent-to-Phase Map: append debugger row.
- `CHANGELOG.md` — new entry documenting the debugger hire.
- *(Optional / prior-workflow artifact)* `.app/SPEC.md:553` — "8 agents + 9 skills" belongs to a different effort; update only if consistency is desired, otherwise leave.
- *(No change)* `plugins/agents/skills/hr/SKILL.md:110` — its "8-agent → 9-agent" is generic procedure prose (the count mandate); remains illustrative.

---

## Out of Scope

- **Skill procedure content / body text** for the agent definition and `debugger/SKILL.md` — HR + SPEC.
- **Code allowlist wiring mechanics** (`enforce-orchestrator.ts` `TEAM`, absence of `mess-transport.ts` change) — LeadDev, DEVELOP.
- **Release cut** (version bump, tag, release notes) — Wrapper.
- **Resolving IDEA-003 as a standalone effort** — folded into this hire (D6) and the §RESEARCH confirmation.
- **Rewriting the external DevOps workflow** that references `gsd-debugger` — out of scope (T2); `debugger` ≠ `gsd-debugger` is a documented, accepted gap.
- **Automatic CI-red → spawn hook** — invocation is on demand by Elon (D9); no event-driven automation.
- **Performance-regression profiling** as a first-class capability — stretch only (D10); profiling tools are absent from the allowlist.

---

## Open Questions

None blocking. Two tracked non-blockers:

- **OQ-1 (NICE-TO-HAVE → DrPe):** does the external `$schema` (`additionalProperties`?) or omp install-time validation reject a `count` field? (F9 shows the repo gate does not.) DrPe's answer shapes the `count` field placement only — see §RESEARCH Dependency.
- **OQ-2 (resolved-by-interpretation):** D5 "no PROTO.md change" reconciled with the mandatory registration row (T1) — narrowed to "no new phase / no phase subsection"; the row is still added. Surfaced for HR/SPEC awareness.

**GRILL is COMPLETE.** Hand off to SPEC.
