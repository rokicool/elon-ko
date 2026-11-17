# Requirements Document — Workflow 3: Remove Plugins & Subagent Management

Repo: `rokicool/elon-ko` @ v2.9.1 (`860d761`). Date: 2026-11-17. Status: GRILL COMPLETE.

## Overview

Strip the repo down from a two-plugin distribution (enforcement gate + agent-roster
marketplace plugin, installer, release artifacts) to a **pure content library**: the 11
agent definitions and 13 skills kept verbatim, consumed natively by oh-my-pi (omp), with no
runtime enforcement machinery, no plugin packaging, no installer, and a minimal CI. Shipped
as breaking release **v3.0.0** with migration notes. Rationale (user, verbatim): "the omp
has it much better solution and this is not necessary anymore in this setup. (However, the
descriptions and skills of agents are still relevant)".

## Resolved Decisions (GRILL, user answers final)

| # | Branch | Answer |
|---|--------|--------|
| Q1 | Plugin A (elon-ko-gate) scope | **Full delete** — all 5 TS extensions, rules/, TS toolchain; **nothing replaces** runtime enforcement |
| Q2 | Subagent-management boundary | Machinery dies; **keep `scaffold/PROTO.md` as plain reference** (see ambiguity resolution) |
| Q3 | Kept content set | **All verbatim** — 11 agent defs + 13 SKILL.md, zero content edits (incl. `elon`, `middev`, `logging-design`) |
| Q4 | Canonical layout | **Promote the tracked mirrors** `.omp/agents/` + `.agents/skills/`; delete `plugins/`; frontmatter untouched |
| Q5 | Distribution/release infra | **Strip** — marketplace.json, `elon_ko.sh`, release artifacts, prerelease.yml, validate-plugins.sh, version lockstep |
| Q6 | CI end-state | **Minimal** — frontmatter/markdown sanity check only; no TS, no omp plugin-install smoke |
| Q7 | Version/migration | **v3.0.0** breaking; CHANGELOG + migration notes; one final tag; source-only release, no binary artifacts |

### Q2 ambiguity resolution (explicit, per orchestrator instruction)

"Keep scaffold/PROTO.md" = keep **only** `scaffold/PROTO.md`; delete the rest of `scaffold/`:

- `scaffold/AGENTS.md` — documents the deleted two-plugin enforcement architecture
  (Plugin A gate, Plugin B registry; `scaffold/AGENTS.md:1-15`). Factually dead post-removal → **delete**.
- `scaffold/APPEND_SYSTEM.md` — session-framing enforcement artifact (mirror of
  `src/append-system.default.md`; footer names elon-ko-gate's hard enforcement, line 53) → **delete**.
- `scaffold/models.example.yml` — optional model-pinning template for the deleted
  init-time scaffold-copy flow; its own header states aliases resolve WITHOUT it via omp's
  built-in model-role chain (lines 11-13) → **delete**. (Cheap flip: restore one file if
  the user later wants model-pinning docs.)

## Functional Requirements

Content deletion/retention (all falsifiable against `git ls-files` + `diff`):

- **FR1** Delete Plugin A entirely: `package.json`, `package-lock.json`, `tsconfig.json`,
  `src/` (5 extensions + 5 test files + `append-system.default.md`), `rules/`
  (`ro-orchestrator-invariant.md`, `ro-definition-of-done.md`). Repo declares no
  `omp.extensions`; no node/bun toolchain remains.
- **FR2** Delete Plugin B packaging: whole `plugins/` tree; `.omp-plugin/marketplace.json`
  (and `.omp-plugin/` if empty).
- **FR3** Keep agent content **verbatim**: `.omp/agents/<name>.md` (11 files) and
  `.agents/skills/<name>/SKILL.md` (13 files) byte-identical to the current
  `plugins/agents/**` copies; `tools:`/`spawns:`/`model:` frontmatter unchanged. Parity is
  captured before `plugins/` deletion (see AC2).
- **FR4** `scaffold/`: keep ONLY `scaffold/PROTO.md`; delete `AGENTS.md`,
  `APPEND_SYSTEM.md`, `models.example.yml` (rationale above).
- **FR5** PROTO.md reference fix: mentions of deleted machinery (`elon-ko-gate`,
  `enforce-orchestrator`, `plugins/agents/...` paths, `validate-plugins.sh`, Plugin A/B,
  the roster table at `scaffold/PROTO.md:20-30`) are corrected to the new layout
  (`.omp/agents/`, `.agents/skills/`). Protocol substance — phases, routing, limits — unchanged.
- **FR6** Delete distribution machinery: `elon_ko.sh`, `scripts/validate-plugins.sh`
  (and `scripts/` if empty), `.github/workflows/prerelease.yml`.
- **FR7** Release path reworked: tag push publishes a GitHub release with notes ONLY —
  no `npm pack`, no `.tgz`/`.tar.gz`, no SHA256SUMS. (Mechanism choice is SPEC's.)
- **FR8** README rewritten: states the repo is an agent-definitions + skills library for
  omp; contents map (`.omp/agents/`, `.agents/skills/`, `scaffold/PROTO.md`, CHANGELOG);
  copy-based consumption instructions (what a consumer copies where, per omp native
  discovery — verified in RESEARCH); migration section with the uninstall sequence
  (`omp plugin uninstall elon-ko-gate elon-ko-agents`, marketplace `@elon-ko`
  deregistration, removal of previously scaffolded files).
- **FR9** Delete `.DEVREADME.md` (documents the removed build/release machinery).
- **FR10** CHANGELOG gains a v3.0.0 entry: breaking-change list (feature loss: gate,
  `.`-agreement, `/idea`//`ideas` + reminders, cross-instance mess-transport, subagent
  panel, framing re-injection) and the migration steps from FR8.
- **FR11** Minimal CI: exactly one workflow validating kept-content sanity — each
  `.omp/agents/*.md` has `name`/`description`/`tools` frontmatter; each
  `.agents/skills/*/` has a `SKILL.md` with frontmatter. No TS/node/bun steps, no omp
  plugin install. Must NOT require skills↔agents 1:1 mapping (`elon`, `logging-design`
  have skills but no agent def; `middev` has both).
- **FR12** Cleanup: `.gitignore` trimmed of stale entries (`node_modules/`, `*.tgz`,
  `.next/`, `.omp/elon.json`). Local untracked artifacts (`node_modules/`, `.next/`,
  `.omp/elon.json` — the now-meaningless gate opt-out) removed from the working tree as
  local cleanup, not commit content. `LICENSE`, `.app/`, `.omp/agents/`, `.agents/skills/` stay.
- **FR13** Version identity: `v3.0.0` exists as tag + CHANGELOG header; no other
  version-bearing files remain in the tree.

## Non-Functional Requirements

- **NFR1 Pure-markdown repo**: no build step, no runtime dependencies, no bun/node requirement.
- **NFR2 omp-native compatibility**: consumption relies on omp's native agent/skill
  discovery of `.omp/agents/` + `.agents/skills/`. Exact discovery rules (and whether
  consumer-side paths differ) must be confirmed in RESEARCH; README instructions must
  match verified omp behavior, not assumptions.
- **NFR3 Dogfood continuity**: this repo's own sessions (skill:// resolution, agent
  roster) keep working off the canonical dirs — no path break.
- **NFR4 History preserved**: no git history rewrite; v2.x tags and CHANGELOG remain
  available as the migration baseline.

## Input/Output Contract

- **Input**: tree at v2.9.1 (two-plugin shape per `.DEVREADME.md:14`, `package.json:2,21-29`,
  `.omp-plugin/marketplace.json:10-21`).
- **Output**: pure-content tree = `README.md`, `CHANGELOG.md`, `LICENSE`,
  `.gitignore`, `.omp/agents/` (11), `.agents/skills/` (13), `scaffold/PROTO.md`,
  `.app/*.md`, one minimal CI workflow, one source-only release workflow; tag `v3.0.0`
  with notes-only GitHub release.

## Error Cases

- **E1 Existing consumer installs**: old plugins persist locally until uninstalled —
  handled by migration notes only; no auto-migration tooling (out of scope).
- **E2 omp discovery mismatch**: if omp does not natively read these paths in consumer
  repos, FR8 instructions would be wrong — RESEARCH must verify before SPEC freezes the
  README wording; fallback = document copy targets per current omp docs.
- **E3 Stale references**:残留 mentions of deleted machinery in PROTO.md/README →
  caught by AC6 grep.
- **E4 Content loss on deletion**: `plugins/` removed before parity proof → AC2 requires
  pre-deletion parity capture.
- **E5 Minimal-CI false positives**: checks must accept skills without agent defs and
  agent-specific frontmatter variance (`spawns:` only on some) → FR11 scoping.

## Acceptance Criteria

- **AC1** `git ls-files` returns none of: `plugins/`, `.omp-plugin/`, `elon_ko.sh`,
  `src/`, `rules/`, `package.json`, `package-lock.json`, `tsconfig.json`,
  `scripts/`, `.DEVREADME.md`, `scaffold/AGENTS.md`, `scaffold/APPEND_SYSTEM.md`,
  `scaffold/models.example.yml`, `.github/workflows/prerelease.yml`.
- **AC2** Pre-deletion parity proof recorded (diff of `plugins/agents/agents` ↔
  `.omp/agents` and `plugins/agents/skills` ↔ `.agents/skills` is empty); post-change:
  11 files in `.omp/agents/`, 13 `SKILL.md` under `.agents/skills/`, frontmatter keys unchanged.
- **AC3** `scaffold/` contains exactly `PROTO.md`.
- **AC4** README contains copy-based consumption instructions + migration section with
  the uninstall commands from FR8.
- **AC5** CHANGELOG has a v3.0.0 entry with breaking-change list + migration steps.
- **AC6** Shipped docs (README, PROTO.md) contain zero references to `elon-ko-gate` /
  `elon-ko-agents` as installable plugins, `enforce-orchestrator`, `elon_ko.sh`, or
  `plugins/` paths (CHANGELOG history exempt).
- **AC7** Minimal CI green on the final tree; workflow contains no node/bun setup and no
  `omp plugin` invocations.
- **AC8** Tag `v3.0.0` push produces a GitHub release whose asset list is empty (notes only).
- **AC9** No live (non-historical) file carries version `2.9.1`; version strings exist
  only in CHANGELOG history.

## Open Questions

None blocking. NICE-TO-HAVE (recorded, not blocking): retain
`scaffold/models.example.yml` as omp-native model-pinning documentation — decided
**delete** (FR4); flip = restore one file, no other changes.
