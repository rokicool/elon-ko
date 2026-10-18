# SPEC: Ship `logging-design` Skill via Plugin B (Option A)

**Phase:** SPEC · **Status:** Ready for DEVELOP · **Predecessors:** `.app/REQ.md` (user request), `.app/RESEARCH.md` (verified research, Option A approved)

All file:line evidence below was re-verified against the working tree on 2026-10-18 (current HEAD, v2.8.0 era). No research finding failed re-verification; notes on two cosmetic discrepancies are in §9.

---

## 1. Situation

The repo contains a mature reference skill at `.claude/skills/logging-design/` (single `SKILL.md`, 13,230 bytes, 281 lines) that no elon-ko installation path ships. omp's `claude` provider scans project-level `.claude/skills/` by default, so the skill resolves **only when cwd is inside a clone of this repo** — invisible to every other project. Goal: after installing elon-ko (Elon + Core plugins), omp in **any** project lists and dispatches this skill by default, with `.claude/` eliminated as a source of truth.

**Approved solution (Option A, per RESEARCH.md §4–5):** promote the skill into Plugin B (`elon-ko-agents`) `skills/` tree — the exact mechanism already shipping the 11 live skills. omp discovers plugin skills by placement alone (`<plugin-root>/skills/<name>/SKILL.md`); user-scoped installs are available in all projects and auto-listed in every session prompt (root + subagents). Zero new machinery: one move, one mirror, one deletion, metadata/docs edits.

## 2. Architecture Overview

```
repo (rokicool/elon-ko)                      installed machine (~/.omp)
─────────────────────────                    ─────────────────────────────────
.claude/skills/logging-design/  ── git mv ──▶ gone (deleted)
        │
        ▼
plugins/agents/skills/logging-design/        plugins/cache/plugins/
        │                                      elon-ko___elon-ko-agents___<ver>/
        │  marketplace publish                   skills/logging-design/SKILL.md
        │  (omp plugin marketplace add/update)     │
        │                                           ▼
        │                     omp plugin install elon-ko-agents@elon-ko --force
        │                                           │  (scope: user → all projects)
        │                                           ▼
        └─ byte-identical mirror               omp skills provider (priority 90)
           .agents/skills/logging-design/          │
           (dev-session visibility,                ▼
            agents provider, prio 70)        system-prompt listing (root +
                                              subagents) → read skill://logging-design
```

Two copies of truth after the change, matching the repo's existing convention for all 12 skills:
`plugins/agents/skills/<n>/` (distributed) and `.agents/skills/<n>/` (dev-session mirror). `.claude/` ceases to exist.

## 3. File Operations (exact, complete)

Ordered; steps 1–3 are filesystem, 4–11 are edits.

| # | Op | Path | Detail |
|---|---|---|---|
| 1 | **Move** | `.claude/skills/logging-design/` → `plugins/agents/skills/logging-design/` | `git mv .claude/skills/logging-design plugins/agents/skills/logging-design`. Content byte-unchanged; history-preserving rename. |
| 2 | **Delete** | `.claude/` (entire tree) | After step 1, `.claude/` holds only empty dirs (verified: its sole tracked file is the moved SKILL.md). `rmdir .claude/skills .claude` — `rmdir` fails safely if anything unexpected remains. Do NOT `git rm` anything else. |
| 3 | **Mirror (copy)** | create `.agents/skills/logging-design/SKILL.md` | `mkdir -p .agents/skills/logging-design && cp plugins/agents/skills/logging-design/SKILL.md $_/`. **Copy, not symlink** — the repo's convention is byte-identical copies (validator Step I uses `cmp -s`, `scripts/validate-plugins.sh:276-283`; `.DEVREADME.md:164`: "mirrors every distributed agent + skill byte-identically … this repo uses mirrors", explicitly rejecting the `omp plugin link` alternative). Existing mirror tree confirms: same 11 dirs, same file sizes. |
| 4 | **Edit (MANDATORY)** | `.omp-plugin/marketplace.json:13` | `"10-agent orchestrator roster + 11 skills."` → `"10-agent orchestrator roster + 12 skills."` `agents[]` and `count: 10` unchanged (no agent added). Enforced by validator Step E (`:219` counts skill dirs dynamically → 12; `:225` requires the description to embed `10-agent` and `12 skills`; CI fails otherwise). |
| 5 | **Edit** | `README.md:20` | `**10 specialist agents** + **11 skills**` → `**10 specialist agents** + **12 skills**` (agent enumeration line unchanged). |
| 6 | **Edit** | `.DEVREADME.md:15` | `10 agent definitions + 11 skills` → `10 agent definitions + 12 skills`. |
| 7 | **Edit** | `.DEVREADME.md:35` | `plugins/agents/skills/*/SKILL.md  # 11 skills (Plugin B, co-located)` → `# 12 skills (Plugin B, co-located)`. |
| 8 | **Edit** | `.DEVREADME.md` § "Extending: add or change a skill" (~:172) | Keep "The roster ships 11: …" (true — roster entities unchanged); append one sentence, e.g.: "`logging-design` is additionally shipped as a non-roster reference skill — placement and the `.agents/skills/` mirror follow the same rules, but no PROTO.md roster row, agent definition, or `<allowed>`/`<forbidden>` block applies to it." |
| 9 | **Edit** | `.github/workflows/release.yml:98` | `(9 agents + 10 skills; markdown only)` → `(10 agents + 12 skills; markdown only)`. Pre-existing staleness discovered in re-verification; fixed here because release notes would otherwise ship a doubly-wrong count. Not part of the installer (see Non-Goals). |
| 10 | **Edit (×3, lockstep)** | `package.json#version`, `.omp-plugin/marketplace.json` `metadata.version` + `plugins[0].version` | `2.8.0` → `2.8.1` (patch: additive content). Lockstep is a repo mandate (`.DEVREADME.md:252-256`). Also gives `omp plugin upgrade` a metadata delta for existing installs (see §6). |
| 11 | **Edit** | `CHANGELOG.md` (top, after the rename note) | New `## [v2.8.1] - <release-date>` → `### Added` entry: promote `logging-design` skill from `.claude/skills/` into Plugin B (`skill://logging-design`, now 12 skills); `.claude/` removed; note propagation via reinstall/upgrade. Keep-a-Changelog format per existing entries. Date/coordination with Wrapper (release job). Historical entries untouched. |

**Files explicitly NOT touched:** `elon_ko.sh` (installer — user-excluded; its "9 agents + 10 skills" strings at `:7,561,564,696,723` remain stale exactly as before), `scaffold/*`, `src/*`, `rules/*`, `plugins/agents/agents/*`, all existing 11 skill dirs, `CHANGELOG.md` historical entries, `.gitignore`.

## 4. Discovery & Frontmatter Contract (Interface Contracts)

**No frontmatter changes are required.** Verified against both consumers:

- **omp contract** (`omp://skills.md`, corroborated by the live 11-skill install): plugin skills need `name` + `description` frontmatter (`requireDescription: true` for omp-plugins-family providers) and directory layout `skills/<name>/SKILL.md` (non-recursive, one level). `SKILL.md:1-10` has `name: logging-design` (matches dir name) and a multi-line `description: >`. Placement in `plugins/agents/skills/` completes registration — no manifest entry, no registration file (`.DEVREADME.md:174-177` documents this; the live install proves it).
- **Validator contract** (`scripts/validate-plugins.sh`, all 296 lines reviewed):
  - Skill-dir scan `:119-128` — every dir under `plugins/agents/skills/*/` must contain `SKILL.md` → passes.
  - Step E `:219,225` — dynamic dir count (→ 12) must appear in the marketplace description → satisfied by op 4.
  - Steps B–D, F–H — roster-driven (parsed from `scaffold/PROTO.md` block); `logging-design` is not a roster entity → never iterated.
  - Step G `:239-253` — `<allowed>`/`<forbidden>` checked only for **roster** skills → `logging-design` needs neither block.
  - Step I `:276-283` — byte-identity mirrors enforced only for **roster** skills → the `.agents/` mirror of `logging-design` is convention-only, not validator-enforced. Acceptable: identical to how the repo treats it (stated practice covers "every distributed skill", enforcement is roster-scoped by design).

**Content decision:** `SKILL.md` body and frontmatter move byte-identical. The description's Claude-Code-style dispatch prose ("Available to drpe, leaddev, … Triggers on: …") is retained — verified harmless in omp (whole `description` drives listing/matching; RESEARCH.md §5 implementation note). Zero content edits keep all copies trivially byte-identical and the diff minimal.

**Collision behavior:** after promotion the plugin copy (priority 90) would outrank any foreign-provider copy; the repo's own `.claude` copy is deleted and `~/.agents/skills/` (user pack) verifiably lacks `logging-design`, so the bare name resolves cleanly.

## 5. Data Model (marketplace.json delta)

```json
// plugins[0] — before                          // after
{                                               {
  "name": "elon-ko-agents",                       "name": "elon-ko-agents",
  "description": "10-agent orchestrator           "description": "10-agent orchestrator
                 roster + 11 skills.",                              roster + 12 skills.",
  "source": "./agents",                           "source": "./agents",
  "category": "development",                      "category": "development",
  "version": "2.8.0",                             "version": "2.8.1",
  "agents": [ …10 unchanged… ],                   "agents": [ …10 unchanged… ],
  "count": 10,                                    "count": 10,
  "homepage": "…"                                 "homepage": "…"
}                                               }
// metadata.version: "2.8.0" → "2.8.1";  everything else unchanged
```

No `skills[]` field exists or is added — runtime discovery is a filesystem scan of the installed plugin tree; `agents[]`/`count` are display metadata only (RESEARCH.md §2, omp docs).

## 6. Update Flow (propagation to installed users)

- **New installs:** unchanged one-liner flow — marketplace clone carries `plugins/agents/skills/logging-design/`; `omp plugin install elon-ko-agents@elon-ko --force` copies the subtree verbatim into the user-scoped cache (`scope: "user"` → all projects). Verified today for the 11 skills; the 12th rides identically.
- **Existing installs (verified paths):** re-run `elon_ko.sh` (force-reinstalls Plugin B at latest, `elon_ko.sh:680-682`) or `omp plugin marketplace update elon-ko` + `omp plugin install elon-ko-agents@elon-ko --force`. Catalog auto-refresh default is `notify` (24 h).
- **Version-pin behavior:** Plugin A installs remain tag-pinned and unaffected (no Plugin A changes). The 2.8.1 lockstep bump (op 10) is expected to let `omp plugin upgrade` detect the delta for Plugin B — [INFERENCE: not directly verified; the `--force` paths above are verified and are the acceptance-relevant channel]. Tagging `v2.8.1` at release keeps the tag-pinned flow coherent.
- **This repo (dev sessions), immediately post-merge:** the `.agents/skills/logging-design/` mirror (omp `agents` provider, project scope) keeps `skill://logging-design` resolvable in-repo even before any reinstall — precisely what the mirror convention exists for.

## 7. Acceptance Criteria

| AC | Statement (testable) |
|---|---|
| AC-1 | `plugins/agents/skills/logging-design/SKILL.md` exists, 13,230 bytes; `git log --follow` reaches the pre-move history; `git show HEAD~1:.claude/skills/logging-design/SKILL.md` (pre-change ref) and the new path have identical content. |
| AC-2 | `.claude/` absent: `[ ! -e .claude ]` and `git ls-files .claude` returns nothing. |
| AC-3 | `cmp -s plugins/agents/skills/logging-design/SKILL.md .agents/skills/logging-design/SKILL.md` → exit 0. |
| AC-4 | `jq -r '.plugins[0].description' .omp-plugin/marketplace.json` = `10-agent orchestrator roster + 12 skills.`; `.plugins[0].agents | length` = 10; `.plugins[0].count` = 10. |
| AC-5 | `bash scripts/validate-plugins.sh` exits 0 printing `ALL CHECKS PASSED`, including `plugin 'elon-ko-agents': 12 skill(s)` and `skill 'logging-design' -> …SKILL.md`; zero errors. |
| AC-6 | Repo-wide count consistency: `grep -rnE '\b11 skills\b' --exclude-dir=node_modules .` matches only CHANGELOG historical entries (`.app/*` protocol artifacts excluded); README.md:20 / .DEVREADME.md:15 / .DEVREADME.md:35 all read 12; release.yml:98 reads `10 agents + 12 skills`. |
| AC-7 | Version lockstep: `package.json#version` = `marketplace.json .metadata.version` = `.plugins[0].version` = `2.8.1`; CHANGELOG has a `## [v2.8.1]` `### Added` entry mentioning `logging-design`. |
| AC-8 | (Smoke, post-release or pre-release flow) In a cwd outside any elon-ko clone, after `omp plugin install elon-ko-agents@elon-ko --force` (or pre-release tag equivalent): a fresh omp session lists `logging-design` in its skill list and `read skill://logging-design` returns the skill body. |
| AC-9 | Blast-radius floor: `git diff --stat HEAD~1..HEAD` touches only the files in §3 — no `elon_ko.sh`, `src/`, `scaffold/`, `rules/`, `plugins/agents/agents/`, or pre-existing skill changes. |

AC-8 requires a released/published ref; until then Developer verifies AC-1–7, AC-9, and the pre-release channel (`.github/workflows/prerelease.yml`, `.DEVREADME.md:258+`) may substitute for the published marketplace in smoke testing.

## 8. Verification Plan

**Developer (after implementation, before commit):**
1. `bash scripts/validate-plugins.sh` → expect `ALL CHECKS PASSED`, exit 0, `12 skill(s)` note (AC-5).
2. `cmp plugins/agents/skills/logging-design/SKILL.md .agents/skills/logging-design/SKILL.md && echo IDENTICAL` (AC-3).
3. `test ! -e .claude && test -z "$(git ls-files .claude)" && echo GONE` (AC-2).
4. `jq -r '.plugins[0].description, .plugins[0].count, (.plugins[0].agents|length), .metadata.version' .omp-plugin/marketplace.json` and `jq -r .version package.json` (AC-4, AC-7).
5. `grep -rnE '\b11 skills\b' --exclude-dir=node_modules --exclude-dir=.app .` → only CHANGELOG history (AC-6).
6. `git status --porcelain` → only intended paths; `git diff --stat` matches §3 list (AC-9).

**Validator (independent):**
1. Re-run 1–6 above from a clean checkout of the branch.
2. `git log --follow --oneline plugins/agents/skills/logging-design/SKILL.md | head` → history predates the change (AC-1); `git diff HEAD~1 HEAD -- .claude plugins/agents/skills/logging-design` shows a pure rename (R100) plus nothing else inside those paths.
3. Confirm non-goals by diff: no changes in `elon_ko.sh`, `src/`, `scaffold/`, `rules/`, `plugins/agents/agents/`, existing skills (AC-9).
4. Optional (if pre-release or released ref available): AC-8 smoke in `/tmp` project cwd.

**Typecheck:** unaffected (no TS changes); `npm run typecheck` remains green trivially — CI runs it regardless (`.github/workflows/ci.yml`).

## 9. Re-verification Notes (SPEC-phase diligence)

- All load-bearing research claims re-verified directly: frontmatter (`SKILL.md:1-10`), marketplace line 13, validator lines 110–296 (incl. Step E `:219,225`, Step G `:239-253`, Step I `:276-283`), mirror convention (`.DEVREADME.md:164` + identical 11-dir listings on both sides), count surfaces (repo-wide grep), installer strings, `.gitignore` (does not ignore `.claude/`; sole tracked file confirmed via `git ls-files`), plugin tree layout (`plugins/agents/{agents,skills}` only).
- Discrepancy 1 (cosmetic): RESEARCH.md calls the file "280 lines"; it is 281 lines / 13,230 bytes (12.9 KiB ✓). Non-load-bearing — byte identity, not line count, is the invariant.
- Discrepancy 2 (refinement): research's "verify no other count references" — grep found two *stale* count surfaces beyond the "11 skills" set: `elon_ko.sh` (excluded by user Non-Goal) and `release.yml:98` (included as op 9). Decision flagged below.

**Open decisions for Elon sign-off (non-blocking; spec takes these positions):**
1. **release.yml:98 fix included** — stale "9 agents + 10 skills" release-notes boilerplate corrected to "10 agents + 12 skills". Remove op 9 if out of scope.
2. **Version bump to 2.8.1 + CHANGELOG entry included** as release-gate items (lockstep mandate). If Wrapper prefers to batch with the next feature release, drop ops 10–11 — propagation still works via the verified `--force` reinstall paths.

## 10. Non-Goals

- **No new plugin, no Plugin A changes** — no `package.json#omp.extensions`/`files` edits (Option B rejected: slower tag-pinned distribution, breaks the "agents/skills → Plugin B" convention).
- **No installer changes** — `elon_ko.sh` untouched, including its pre-existing stale count strings.
- **No agent-roster/gate/extension changes** — no PROTO.md row, no agent `.md`, no `<allowed>`/`<forbidden>` block, no `TEAM`/`ADDRESSABLE` edits; `logging-design` is a reference skill, not a roster entity.
- **No user-global skill copies** — nothing written to `~/.omp/agent/skills` (Option C rejected: escapes plugin lifecycle, survives uninstall, drifts).
- **No SKILL.md content rewrite** — byte-identical move only (description prose retained).
- **No CHANGELOG history edits**, no doc rewrites beyond the enumerated count/clarification lines.
