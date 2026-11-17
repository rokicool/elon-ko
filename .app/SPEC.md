# Technical Specification — Workflow 3: Remove Plugins & Subagent Management

Repo: `rokicool/elon-ko`. Baseline: `main` @ `07b331e` (tree identical to v2.9.1 `860d761`).
Date: 2026-11-17. Author: LeadDev. Status: SPEC — awaiting Elon sign-off.

Authority: `.app/REQ.md` (GRILL-complete). This spec implements REQ decisions; it does
not re-open them.

---

## 1. Situation

elon-ko v2.9.1 ships as a two-plugin omp distribution: an enforcement-gate
extension package (Plugin A: 5 TS extensions, rules, TS toolchain, npm/bun) plus an
agent-roster marketplace plugin (Plugin B: `plugins/` tree + `.omp-plugin/marketplace.json`),
an installer (`elon_ko.sh`), and artifact-building release workflows. omp now solves
enforcement and agent/skill loading natively, so all packaging, installer, and runtime
machinery is dead weight. The repo becomes a **pure content library** — 11 agent
definitions + 13 skills kept byte-identical, consumed natively by omp — shipped as
breaking release **v3.0.0** with migration notes.

## 2. Verified ground truth (evidence baseline, captured at `07b331e`)

- **Mirror parity (AC2 precondition, proven NOW):** `diff -r plugins/agents/agents .omp/agents`
  → empty; `diff -r plugins/agents/skills .agents/skills` → empty. Counts: 11 files in
  `.omp/agents/`, 13 `SKILL.md` under `.agents/skills/`. The canonical mirrors are already
  exact copies; **promotion = deletion of `plugins/` only, zero content edits.**
- **Agent frontmatter (all 11):** `name`, `description`, `tools`, `model` present;
  `spawns` present only on `leaddev`. (FR11/E5: CI must require `name/description/tools`
  only; `model`/`spawns` are variance, not requirements.)
- **Skill frontmatter (13):** `name`, `description` present.
- **Live `2.9.1` version sites:** `package.json:3`, `.omp-plugin/marketplace.json:7,16`,
  `elon_ko.sh:89,104`, `.DEVREADME.md:21,247,250,256,312`, `README.md:59,159,183,191`
  — every site is in a file deleted or rewritten by this spec. Remaining mentions:
  `CHANGELOG.md` (history, exempt) and `.app/REQ.md`/`.app/PROJECT.md` (protocol records
  of the baseline; see §13 flag F2).
- **Local untracked artifacts present:** `node_modules/`, `.next/`, `.omp/elon.json` (all
  three exist in the working tree — FR12 local cleanup is real work, not a no-op).
- **Kept-verbatim content carries stale machinery refs** (`.omp/agents/hr.md:14`,
  `.agents/skills/hr/SKILL.md:79-119`, `.agents/skills/elon/SKILL.md:242-251` —
  `plugins/...` paths, marketplace/TEAM wiring instructions). FR3/Q3 mandate verbatim
  keep; AC6 scope is README + PROTO.md only. See §13 flag F3.
- **DrPe research landed** (`.app/RESEARCH.md`, 2026-11-17, verdict **CLEAR / PROCEED**):
  omp natively discovers project agents at `.omp/agents/*.md` (user scope:
  `~/.omp/agent/agents/*.md` — note singular `agent`) and skills at
  `.agents/skills/<name>/SKILL.md` (one level, non-recursive; user scope:
  `~/.agents/skills/`), both on by default, **zero config — placing the files IS the
  registration**. Precedence: project > user > extension packages > Claude plugins >
  bundled, first-wins by exact name. README wording in §6.3 is taken from RESEARCH
  §Recommendations (verified basis, not assumption).

## 3. End-state architecture (pure content library)

```
elon-ko/
├── README.md                     # REWRITTEN — library description + copy instructions + migration
├── CHANGELOG.md                  # EDITED — new v3.0.0 entry on top of preserved history
├── LICENSE                       # KEPT (untouched)
├── .gitignore                    # TRIMMED — only .app/* + !.app/*.md
├── .omp/agents/                  # KEPT VERBATIM — 11 agent definitions (canonical)
├── .agents/skills/               # KEPT VERBATIM — 13 skills (canonical)
├── scaffold/
│   └── PROTO.md                  # EDITED — reference-fix pass only (§5)
├── .github/workflows/
│   ├── ci.yml                    # REWRITTEN — frontmatter sanity only (§7)
│   └── release.yml               # REWRITTEN — notes-only release (§8)
└── .app/*.md                     # KEPT — protocol artifacts (REQ/RESEARCH/SPEC/PROJECT/history)
```

No build step, no runtime dependencies, no node/bun, no `omp.extensions`, no installer,
no plugin packaging. Version identity = git tag + CHANGELOG header only (FR13).

## 4. File-by-file map (complete inventory vs `git ls-files` at `07b331e`)

### 4.1 DELETE (76 tracked files + 2 dirs)

| Path | Count | FR |
|---|---|---|
| `package.json`, `package-lock.json`, `tsconfig.json` | 3 | FR1 |
| `src/` (5 extensions `.ts` + 5 `.test.ts` + `append-system.default.md`) | 11 | FR1 |
| `rules/` (`ro-orchestrator-invariant.md`, `ro-definition-of-done.md`) | 2 | FR1 |
| `plugins/` (whole tree: `agents/agents/` ×11 + `agents/skills/` ×13) | 24 | FR2 |
| `.omp-plugin/` (`marketplace.json`; dir empty after) | 1 | FR2 |
| `scaffold/AGENTS.md`, `scaffold/APPEND_SYSTEM.md`, `scaffold/models.example.yml` | 3 | FR4 |
| `elon_ko.sh`, `scripts/validate-plugins.sh` (`scripts/` empty after → removed) | 2 | FR6 |
| `.github/workflows/prerelease.yml` | 1 | FR6 |
| `.DEVREADME.md` | 1 | FR9 |

Repo declares no `omp.extensions` anywhere post-delete (only carrier was `package.json`,
deleted). AC1 is exactly this table.

### 4.2 KEEP VERBATIM (zero edits, byte-identical to baseline)

- `.omp/agents/*.md` — 11 files (FR3) — including stale-ref carriers `hr.md` (flag F3).
- `.agents/skills/*/SKILL.md` — 13 files (FR3) — including stale-ref carriers
  `elon/SKILL.md`, `hr/SKILL.md` (flag F3).
- `LICENSE` (FR12).
- `.app/IDEAS.md`, `.app/PROJECT.md` (Elon's, evolves by protocol), `.app/REQ.md`,
  `.app/RESEARCH.md`, `.app/RESEARCH-SCAFFOLD.md`, `.app/SCAFFOLD-SPEC.md`,
  `.app/SPEC.md` (this file), `.app/subagent-panel-contract.md` — none are in any REQ
  deletion list; not shipped docs; left alone by DEVELOP.

### 4.3 EDIT

| Path | Change | FR |
|---|---|---|
| `scaffold/PROTO.md` | Reference-fix pass only — §5 | FR5 |
| `README.md` | Full rewrite as library README + copy instructions + migration — §6 | FR8 |
| `CHANGELOG.md` | Prepend v3.0.0 entry — §9 | FR10, FR13 |
| `.gitignore` | Trim to `.app/*` + `!.app/*.md` — §10 | FR12 |
| `.github/workflows/ci.yml` | Rewrite to single frontmatter-sanity job — §7 | FR11 |
| `.github/workflows/release.yml` | Rewrite to notes-only release — §8 | FR7 |

### 4.4 LOCAL-ONLY cleanup (never commit content; FR12)

`rm -rf node_modules .next .omp/elon.json` — all three verified present. See §11 step
S11 for ordering constraint (gate opt-out side effect, flag F5).

## 5. PROTO.md fix spec (FR5 — references only; protocol substance unchanged)

Constraint: the diff on `scaffold/PROTO.md` may touch ONLY the sites below. Phases,
routing tables, cycle limits, commit convention, artifact table, agent-to-phase map
content, roster attributes (names/models/spawners/spawns/tools/mess) are unchanged.
The roster table keeps its ```elon-ko-roster fenced-block format.

| # | Site (line @ baseline) | Now says | Must say after |
|---|---|---|---|
| P1 | L5 (Overview) | "enforced at the harness level (see [AGENTS.md](AGENTS.md) §Enforcement layers). Team agents ship from **Plugin B (`elon-ko-agents`)** as definitions under `plugins/agents/agents/<name>.md` … their behavioral protocol lives in their skill at `plugins/agents/skills/<name>/SKILL.md`." | "Each agent operates strictly within its role, declared in its definition. Team agents are defined at `.omp/agents/<name>.md` with `tools:` / `spawns:` frontmatter; their behavioral protocol lives in their skill at `.agents/skills/<name>/SKILL.md`." (rest of the sentence — task mechanics, "The root session **is** Elon" — unchanged) |
| P2 | L7 (Enforcement note) | root gate via `enforce-orchestrator` / Plugin A / `src/enforce-orchestrator.ts`, Plugin B frontmatter paths, AGENTS.md link, `OMP_BYPASS_ORCHESTRATOR=1` escape hatch | "**Enforcement note:** each team agent's tool boundary is declared in its definition frontmatter (`.omp/agents/<name>.md` `tools:` / `spawns:`). This repo ships definitions and protocol only — no runtime enforcement machinery; enforcement is the consumer runtime's concern. For agent definitions and tool policies, see each definition and skill." (no escape hatch, no Plugin A/B, no src paths, no AGENTS.md link) |
| P3 | L13-16 (roster intro) | consumers = gate `TEAM` (`src/enforce-orchestrator.ts`), `mess-transport.ts` `ADDRESSABLE`, `skill://elon` `<agent_registry>`, frontmatter, `<allowed>`; "`scripts/validate-plugins.sh` enforces it; drift is a CI failure." | consumers = omp's native agent discovery, each agent's `tools:`/`spawns:` frontmatter, `skill://elon` `<agent_registry>`, each skill's `<allowed>` block — "MUST agree with the attributes declared here" kept. Drop the validate-plugins.sh sentence entirely (its machinery is deleted; §7 CI checks presence, not roster agreement). |
| P4 | L20-31 (roster table, 12 rows) | skill column = `plugins/agents/skills/<name>/SKILL.md` | `.agents/skills/<name>/SKILL.md` — mechanical prefix substitution, every row otherwise identical (this is the roster-table fix REQ calls out at `scaffold/PROTO.md:20-30`; elon row L31 included) |
| P5 | L338 + L342-353 (Hiring intro + registration-surface table) | intro: "HR creates … LeadDev wires the code allowlists; Wrapper ships the release."; table rows for `plugins/agents/agents/`, `plugins/agents/skills/`, local mirror, `.omp-plugin/marketplace.json`, `scaffold/AGENTS.md` Agent Index, `src/enforce-orchestrator.ts` TEAM, `src/mess-transport.ts` ADDRESSABLE, `package.json` + `marketplace.json` + tag | intro: "HR creates the definition + skill and registers the docs; the roster table above and the Agent-to-Phase Map are updated together." Table reduces to: Agent definition `.omp/agents/<name>.md` (HR), Skill `.agents/skills/<name>/SKILL.md` (HR), Phase Map `scaffold/PROTO.md` (HR, mandatory), Runtime registration `omp restart` (user). Delete the marketplace / Agent Index / TEAM / ADDRESSABLE / version-lockstep rows. |
| P6 | L355 (Drift rule) | hire writes `plugins/` source AND `.omp/`+`.agents/` mirror byte-identical; `omp plugin link` alternative | "Each definition and skill has exactly one canonical copy (`.omp/agents/`, `.agents/skills/`); updates are made in place — there is no mirror to keep in sync." |
| P7 | L380-382 (Harness Precedence) | AGENTS.md link, `enforce-orchestrator` extension, `RULES.md`, `APPEND_SYSTEM.md` | "Each agent's `tools:` / `spawns:` frontmatter (`.omp/agents/<name>.md`) declares its tool boundary. Prompt-level layers (this file, the skills) are advisory and reinforce the declared boundaries." |

Verification: `grep -nE 'AGENTS\.md|plugins/|enforce|validate-plugins|marketplace|package\.json|mess-transport|src/|Plugin A|Plugin B|elon-ko-gate|elon-ko-agents|RULES|APPEND_SYSTEM|omp plugin link|OMP_BYPASS' scaffold/PROTO.md`
returns **zero hits** (baseline: 27 lines hit). `git diff scaffold/PROTO.md` shows only
P1-P7 hunks.

## 6. README.md rewrite spec (FR8)

Full replace. Required sections, in order:

1. **Title + one-paragraph intro** — elon-ko is a **content library** of agent
   definitions and skills for [oh-my-pi](https://omp.sh) (`omp`): 11 specialist agent
   definitions + 13 skills, protocol reference in `scaffold/PROTO.md`. State plainly:
   no plugins, no installer, no enforcement machinery ship here anymore (v3.0.0).
2. **Contents map** — table: `.omp/agents/` (11 definitions — list all 11 names),
   `.agents/skills/` (13 skills — list all 13, noting `elon` and `logging-design`
   are skills without agent definitions), `scaffold/PROTO.md` (phased protocol
   reference), `CHANGELOG.md`, `LICENSE`, `.github/workflows/` (CI sanity + notes-only
   release).
3. **Using the agents & skills (copy instructions)** — final wording, verified basis =
   RESEARCH §Recommendations 1-3, 5 (no placeholder — research landed before SPEC freeze):
   - *Agents:* "Copy the files from `.omp/agents/` into `<your-repo>/.omp/agents/`
     (this repo only) or `~/.omp/agent/agents/` (every repo)."
   - *Skills:* "Copy the directories from `.agents/skills/` into
     `<your-repo>/.agents/skills/` or `~/.agents/skills/`."
   - "No configuration, marketplace, or plugin installation is needed — omp discovers
     both locations automatically at startup."
   - Layout constraint (one sentence): "Keep each skill exactly one level under
     `skills/` (`.agents/skills/<name>/SKILL.md`); deeper nesting is not discovered,
     and agent names must be unique (project overrides user; first match wins)."
   - Verification step: "Run `omp read skill://elon` in the target repo (or open the
     `/agents` hub in a session) to confirm discovery."
   Hard constraints: user-scope dirs stated **verbatim** — `~/.omp/agent/agents/`
   (singular) vs `~/.agents/skills/`; a hand-waved "~/.omp/" would point at a path omp
   never reads. Do NOT advertise `.omp/skills/` as a copy target (it also works via the
   native provider, but two advertised targets double the support surface — Rec.5).
4. **Per-agent models** — short note (may reuse verified baseline text): each definition
   pins a `model:` role alias (`pi/slow|task|smol`); aliases resolve via omp's built-in
   model-role chain; pin overrides via `<cwd>/.omp/config.yml` or `~/.omp/agent/config.yml`
   `modelRoles`, or `/models` interactively. (Note: `scaffold/models.example.yml` no
   longer ships — its content is one `modelRoles` block, shown inline in a 4-line yaml
   example. This is documentation of kept `model:` frontmatter, not machinery.)
5. **Migrating from v2.x** — **copy-first** sequence (RESEARCH Rec.4 ordering: identical
   copies collapse silently, so `skill://` names stay continuously available through the
   transition; uninstall-first would work too but leaves a window with no skills):
   1. **Copy first** — adopt the v3 content via the copy instructions in §3 above;
   2. `omp plugin uninstall elon-ko-gate elon-ko-agents` (both names; mention the
      legacy pre-v2.0.0 names `omp-agent-gate`/`orchestrator-agents` may need the same
      if upgrading from very old installs);
   3. `omp plugin marketplace remove elon-ko` (marketplace `@elon-ko` deregistration;
      legacy id `@omp-agent-template` if old);
   4. delete previously scaffolded files from consuming projects: `<cwd>/AGENTS.md`,
      `<cwd>/PROTO.md`, `<cwd>/.omp/config.example.yml`, `<cwd>/.omp/elon.json`;
   5. remove install-mode residue: `rm -rf ./.elon-ko` (local installs) and
      `~/.omp-prerelease` (pre-release cache);
   6. verify discovery: `omp read skill://elon` in the target repo.
6. **What was removed in v3.0.0** — bullet summary of the feature loss (gate,
   `.`-agreement, `/idea`//`ideas` + reminders, cross-instance mess-transport,
   subagent panel, framing re-injection) with pointer to CHANGELOG for detail.

Hard constraints: zero install instructions for the old plugins (uninstall/migration
naming only — see flag F1); no `enforce-orchestrator`, `elon_ko.sh`, `plugins/`,
`.omp-plugin/`, `bun`/`node` prerequisites anywhere; no version pin strings.

## 7. CI end-state spec (FR11) — `.github/workflows/ci.yml`, full replace

```yaml
name: CI
on:
  push:
    branches: [main, dev]
  pull_request:
permissions:
  contents: read
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  content-sanity:
    name: Content sanity (frontmatter)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Agent definitions frontmatter (.omp/agents)
        run: <CHECK-A>
      - name: Skills frontmatter (.agents/skills)
        run: <CHECK-B>
```

**CHECK-A contract** — for every `.omp/agents/*.md`: (a) file starts with a `---`
frontmatter fence and a closing `---` exists; (b) keys `name:`, `description:`,
`tools:` exist inside the block. Any failure prints `file: missing <key>` and exits 1.
Pure bash+awk/grep (reference: `awk` split on first two `---` lines, `grep -E "^key:"`
per key). Must NOT require `model:`/`spawns:` (variance per §2).

**CHECK-B contract** — for every `.agents/skills/*/SKILL.md`: file exists at that exact
path (glob over dirs), same frontmatter fence check, keys `name:` and `description:`
required (NOT `tools:` — skills don't carry it). Same failure reporting.

**Explicit non-checks (E5 guard):** no skills↔agents 1:1 mapping assertion (`elon`,
`logging-design` have no agent def; `middev` has both); no count assertions; no
node/bun/omp setup steps; no `omp plugin` invocations; single job, single workflow.
AC7's grep: workflow contains none of `setup-node`, `setup-bun`, `npm `, `bun `, `omp `.

## 8. Release end-state spec (FR7) — `.github/workflows/release.yml`, full replace

Mechanism (SPEC's choice): notes-only `softprops/action-gh-release@v2` on `v*` tag push.

```yaml
name: Release
on:
  push:
    tags: ['v*']
permissions:
  contents: write
jobs:
  release:
    name: Publish release notes
    runs-on: ubuntu-latest
    steps:
      - name: Create GitHub Release (notes only)
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          name: ${{ github.ref_name }}
          generate_release_notes: true
          body: |
            elon-ko <tag> — pure content library: 11 agent definitions (.omp/agents/)
            + 13 skills (.agents/skills/) for oh-my-pi. See README.md for copy-based
            consumption and migration from v2.x plugins.
```

No `files:` key (→ empty asset list, AC8), no checkout (action works via API), no
node/bun, no typecheck/validate (TS toolchain gone; tags are cut by Wrapper from a
CI-green `main` — CI already gated the content). No tag↔manifest assertion: version
source of truth is the tag + CHANGELOG header (FR13); there is no manifest left.

## 9. CHANGELOG + v3.0.0 spec (FR10, FR13)

Insert immediately after the `## Project renamed` block (before `## [v2.9.1]`), house
format (`## [v3.0.0] - <date>`, `**Engineer:** Roman Kiprin <rokicool@gmail.com>`,
`**Ticket:** N/A`). Sections:

- **### Removed** (breaking): Plugin A `elon-ko-gate` entirely — 5 TS extensions
  (`enforce-orchestrator` root gate, `mess-transport`, `dot-agreement`, `subagent-panel`,
  `idea-storage`), `rules/`, TS/npm/bun toolchain, `omp.extensions` registration;
  Plugin B packaging (`plugins/` tree, `.omp-plugin/marketplace.json`); installer
  `elon_ko.sh`; release artifacts (`.tgz`/`.tar.gz`/SHA256SUMS) + `prerelease.yml`;
  `scripts/validate-plugins.sh`; `.DEVREADME.md`; `scaffold/{AGENTS,APPEND_SYSTEM}.md`
  + `scaffold/models.example.yml`. Canonical content survives at `.omp/agents/` +
  `.agents/skills/`, byte-identical.
- **### Breaking (feature loss for v2.x consumers):** root-session gate;
  `.`-agreement token; `/idea`/`/ideas` + idea reminders; cross-instance
  `mess-send`/`mess-fail` transport; subagent observability panel; APPEND_SYSTEM
  framing re-injection. omp's native facilities replace them at the consumer's side.
- **### Migration (v2.x → v3.0.0):** the §6.5 copy-first migration sequence verbatim +
  pointer to README copy instructions.
- **### Changed:** repo is a pure-markdown content library; CI reduced to frontmatter
  sanity; release = notes-only GitHub release; version identity = tag + this CHANGELOG
  (no manifest files).
- **#### Affected Files:** summary of §4 map.

No other entry altered (NFR4). After this entry, no live file carries a version number
(FR13): manifests deleted, README has no pins.

## 10. `.gitignore` spec (FR12) — full replace

```
.app/*
!.app/*.md
```

Removed: `node_modules/`, `*.tgz`, `.next/`, `.omp/elon.json`. The `.app/*` +
`!.app/*.md` pair stays (keeps `.app/mess/`, state files untracked; keeps `.md`
protocol artifacts tracked).

## 11. Ordered implementation steps (DEVELOP phase plan)

| # | Step | FR/AC | Owner |
|---|---|---|---|
| S0 | Parity proof capture: run both `diff -r` commands; record empty output + counts in the S1-S5 deletion commit message body | AC2, E4 | LeadDev |
| S1 | `git rm` Plugin A + toolchain: `package.json`, `package-lock.json`, `tsconfig.json`, `src/`, `rules/` | FR1 | MidDev T1 |
| S2 | `git rm -r plugins/ .omp-plugin/` | FR2 | MidDev T1 |
| S3 | `git rm scaffold/AGENTS.md scaffold/APPEND_SYSTEM.md scaffold/models.example.yml` | FR4 | MidDev T1 |
| S4 | `git rm elon_ko.sh scripts/validate-plugins.sh .github/workflows/prerelease.yml` (scripts/ dir disappears with last file) | FR6 | MidDev T1 |
| S5 | `git rm .DEVREADME.md` | FR9 | MidDev T1 |
| S6 | Rewrite `.github/workflows/ci.yml` per §7 | FR11 | MidDev T2 |
| S7 | Rewrite `.github/workflows/release.yml` per §8 | FR7 | MidDev T2 |
| S8 | PROTO.md reference fix per §5 (P1-P7 only) | FR5 | MidDev T3 |
| S9 | README rewrite per §6 (final RESEARCH-based wording — no placeholder) | FR8 | MidDev T4 |
| S10 | CHANGELOG v3.0.0 entry per §9 | FR10, FR13 | MidDev T4 |
| S11 | `.gitignore` trim per §10 + LOCAL cleanup `rm -rf node_modules .next .omp/elon.json` (never committed; flag F5 ordering) | FR12 | MidDev T4 |
| S12 | Full AC sweep §12 + fix fallout | AC1-9 | LeadDev |

**MidDev decomposition (disjoint files, parallelizable in one batch):** T1 = S1-S5
(pure deletions, mechanical, includes S0 evidence collection commands), T2 = S6-S7
(workflows), T3 = S8 (PROTO surgical edit), T4 = S9-S11 (docs + gitignore + local
cleanup). No cross-task file overlap. LeadDev integrates, reviews, commits per step
group (`[SPEC §N] …`), runs the AC sweep.

**Sequencing note (flag F5):** S11's local `rm .omp/elon.json` removes THIS repo's
gate opt-out marker — the running orchestrator session's enforcement goes dormant
mid-workflow (harness seat discipline continues by protocol). Execute S11's local
cleanup LAST (after S12 sweep), or Elon exports `OMP_ENABLE_ORCHESTRATOR=1` first.
Committed `.gitignore` trim may happen earlier.

## 12. Acceptance criteria ↔ FR map + verification commands

| AC | FRs | Verification (run on final tree) |
|---|---|---|
| AC1 | FR1,2,4,6,9 | `git ls-files \|\| grep -E '^(plugins/\|\.omp-plugin/\|elon_ko.sh\|src/\|rules/\|package\|\|tsconfig\|scripts/\|\.DEVREADME\|scaffold/AGENTS\|scaffold/APPEND_SYSTEM\|scaffold/models')` → empty. Equivalent: `git ls-files` contains none of §4.1's paths. |
| AC2 | FR3 | S0 evidence in commit message (pre-deletion diffs empty, 11+13 counts); post-change: `ls .omp/agents/*.md \| wc -l` → 11; `find .agents/skills -name SKILL.md \| wc -l` → 13; `git diff v2.9.1 -- .omp/agents .agents/skills` → **empty** (byte-identical to released content, the strongest possible parity proof) |
| AC3 | FR4 | `ls scaffold/` → exactly `PROTO.md` |
| AC4 | FR8 | README contains the §6.2 contents map, the §6.3 copy-instruction block (project + user scope paths verbatim, incl. `~/.omp/agent/agents/` and `~/.agents/skills/`; layout-constraint sentence; `omp read skill://` verification step), and the §6.5 migration commands incl. `omp plugin uninstall elon-ko-gate elon-ko-agents` and `omp plugin marketplace remove elon-ko`, in copy-first order |
| AC5 | FR10 | `head CHANGELOG.md` shows `## [v3.0.0]` with Removed/Breaking/Migration sections |
| AC6 | FR5,8 | `grep -nE 'enforce-orchestrator\|elon_ko\.sh\|plugins/\|\.omp-plugin' README.md scaffold/PROTO.md` → zero hits; `grep -nE 'omp plugin (install\|marketplace add)' README.md scaffold/PROTO.md` → zero hits. Bare `elon-ko-gate`/`elon-ko-agents` allowed ONLY inside uninstall/migration commands (flag F1 — FR8 mandates them). CHANGELOG exempt. |
| AC7 | FR11 | Workflow file matches §7: no `setup-node`/`setup-bun`/`npm`/`bun`/`omp ` strings; CI green on final tree (post-push check; pre-push: local run of CHECK-A/CHECK-B scripts) |
| AC8 | FR7 | Tag `v3.0.0` push → GitHub release with empty asset list (no `files:` key in workflow). Post-cut check via release page; mechanism verified by workflow review pre-push |
| AC9 | FR13 | `git grep -n '2\.9\.1' -- . ':(exclude)CHANGELOG.md' ':(exclude).app'` → zero hits. (`.app` protocol artifacts excluded — they record the baseline historically; flag F2.) Also: no `package.json`/manifest remains to carry a version |

**NFR checks:** NFR1 — `git ls-files` contains no `package.json`/`tsconfig.json`/lockfile; no build scripts remain. NFR2 — resolved affirmatively by RESEARCH (verdict CLEAR); README §6.3 wording is the verified basis, VALIDATE cross-checks README against RESEARCH §Recommendations. NFR3 — AC2's `git diff v2.9.1` empty = dogfood continuity (`.omp/agents/` + `.agents/skills/` untouched; RESEARCH D3 confirms `skill://` names keep resolving post-uninstall via the `agents` provider). NFR4 — `git log`/tags untouched; only additive commit on top; CHANGELOG history intact.

## 13. Interpretations & flags for Elon sign-off

- **F1 — AC6 vs FR8 uninstall naming:** FR8 *requires* README migration text naming
  `elon-ko-gate`/`elon-ko-agents` in uninstall commands; AC6 bans references to them
  "as installable plugins". Spec resolution: AC6 grep is scoped to install-command
  shapes (`omp plugin install …`, `omp plugin marketplace add …`) + machinery tokens;
  uninstall/migration naming is compliant. Validator instructed accordingly.
- **F2 — AC9 scope:** `.app/REQ.md:3` and `.app/PROJECT.md` mention `v2.9.1` as the
  recorded baseline — historical protocol records, same class as CHANGELOG history.
  AC9 grep excludes `.app/`. If Elon wants literal zero-hit including `.app`, that is
  unsatisfiable without editing frozen REQ.md — recommend accepting this scope.
- **F3 — verbatim content carries stale refs:** `hr` agent/skill + `elon` skill
  reference deleted `plugins/`/marketplace/TEAM wiring. FR3/Q3 (verbatim, zero content
  edits) wins; AC6 scope (README + PROTO.md only) already excludes them. Consequence:
  HR's "dev-repo detection" can never match post-v3 (paths gone) — HR falls through to
  its project-local path. Accepted per REQ; revisit only via a future content workflow.
- **F4 — release gate:** release.yml does not re-run content checks (no manifests to
  assert; Wrapper cuts tags from CI-green main). If Elon wants the §7 checks re-run
  inside the release job, it is a +2-line reuse — say so at sign-off.
- **F5 — `.omp/elon.json` removal timing:** local removal deactivates this session's
  gate opt-out mid-workflow (§11 sequencing note). Execution detail, flagged so it
  surprises no one.
- **F6 — RESOLVED (was: README discovery placeholder):** DrPe's `.app/RESEARCH.md`
  landed before SPEC freeze; verified wording is incorporated at §6.3 and the
  migration ordering flipped to copy-first (§6.5). VALIDATE checks README against
  RESEARCH §Recommendations 1-5.
- **F7 — `dev` branch CI trigger:** kept (`push: branches: [main, dev]`, matches
  baseline triggers); branch exists. No action needed.

## 14. Non-goals (boundaries for DEVELOP)

- No edits to `.omp/agents/` or `.agents/skills/` content (FR3) — not even the stale
  refs of F3.
- No git history rewrite, no tag deletion/modification (NFR4); v3.0.0 is a new tag cut
  by Wrapper at DONE (this workflow's DEVELOP stops before tagging).
- No replacement enforcement mechanism, no new tooling, no new content (Q1; no scope
  creep beyond §4).
- No changes to `.app/` artifacts other than this SPEC (REQ/RESEARCH/PROJECT are
  other seats' property).
- No touching `LICENSE`.
