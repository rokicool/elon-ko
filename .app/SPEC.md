# SPEC — Workflow 5 (rev 2, post sign-off): omp-native install layout — `.omp/RULES.md` auto-load

## Requirements

Verbatim user request (input of record; no REQ.md):

> "The next breaking change is to adopt the workflow to support omp harness by default. Remove AGENTS.md from the root and put them to .omp/RULES.md file. And move PROTO.md to .omp/ folder as well. So, by default Elon and Ko set of personas would not conflict with any other harness."

User sign-off revisions (IRC via Main, 2026-11-17):
- **F1 revised**: the rules must be **AUTO-LOADED** when elon-ko content is installed into a client repo. In this dev repo they may live under `scaffold/`.
- **F2 approved**: content resurrected from `v2.9.1:scaffold/AGENTS.md`.
- **F3 approved**: FR3 freeze lifted for path-literal substitutions only.

## Verified ground truth (2026-11-17, HEAD `41340c8`, v3.1.0)

- No root `AGENTS.md` at HEAD; `scaffold/AGENTS.md` deleted in v3.0.0; only `scaffold/PROTO.md` remains. Historical source: `git show v2.9.1:scaffold/AGENTS.md`.
- **omp rules auto-load path (the load-bearing finding, citation:** `omp://context-files.md` §"Native `.omp` files", read 2026-11-17, High confidence, recorded in `.app/RESEARCH.md` Addendum**)**:
  - `<nearest-non-empty-ancestor>/.omp/RULES.md` (Project) — loaded as a **sticky always-apply rule** ("Project sticky content…"), i.e. carried on every request, visible to task subagents (subagents drop `AGENTS.md` context but still get `RULES.md`).
  - User scope: `~/.omp/agent/RULES.md`.
  - Walk semantics: from cwd up to repo root; first **non-empty** `.omp/` wins; `RULES.md` read only from that directory.
  - This supersedes the older "a bare root RULES.md is a dead file" finding — that covered root-level files; the native `.omp/RULES.md` slot is distinct and load-bearing.
- **No provider reads `PROTO.md`** under any name/path — doc-only wherever it lives (`.omp/PROTO.md` included). omp's auto-loaded filenames are only `AGENTS.md`/`SYSTEM.md`/`RULES.md` (native slots).
- `.omp/` in this dev repo holds only `agents/` (non-empty → owns native walk; no RULES.md/AGENTS.md there → contributes nothing). Intentional: dev repo does not self-install sticky rules.
- CI (`.github/workflows/{ci,release}.yml`): zero references to `scaffold/`, `AGENTS.md`, `PROTO.md`. Unaffected.
- CHANGELOG historical entries are an immutable record — untouched.

## Design decisions

### D1. Dev-repo layout — `scaffold/` is the source of installable content
- **`scaffold/RULES.md`** (new file, single file — NOT a `rules/` directory): omp's consumer-side contract is **one file** at `<repo>/.omp/RULES.md`; a multi-file `rules/` split would not map onto it. Content lineage: `v2.9.1:scaffold/AGENTS.md` ("Agent Registry & Enforcement Protocol"), adapted to v3 pure-content reality (see D3).
- **`scaffold/PROTO.md` stays in `scaffold/`** (the earlier `git mv scaffold/PROTO.md .omp/PROTO.md` is superseded). omp does not auto-consume any PROTO path, so a dev-repo `.omp/` placement buys nothing; the user's "move PROTO.md to .omp/" is satisfied **consumer-side**: the documented install copies it to `<client-repo>/.omp/PROTO.md` (namespaced, doc-only, zero cross-harness conflict).
- `scaffold/` therefore remains a live directory (rules + proto). No root `AGENTS.md` is created or documented, ever.

### D2. Consumer-side install contract (the point of the release)
Copy `scaffold/RULES.md` → `<client-repo>/.omp/RULES.md`:
- **Auto-loaded** as a sticky always-apply rule by omp's native provider — no config, no plugin.
- Sticky across compaction; **reaches task subagents** (unlike `AGENTS.md` context) — the Elon/Ko persona protocol binds helpers too.
- Namespaced: no root `AGENTS.md` is written, so other harnesses (Claude Code, Codex, Cursor, …) that consume root `AGENTS.md`/`CLAUDE.md` never see the personas — the conflict the user asked to remove.
Optionally copy `scaffold/PROTO.md` → `<client-repo>/.omp/PROTO.md` (doc-only phase reference, read on demand).

### D3. `scaffold/RULES.md` content requirements
Source `git show v2.9.1:scaffold/AGENTS.md`, rewritten:
- Retitle `# RULES.md — Elon/Ko Agent Registry & Protocol`.
- Keep: roster table (11 agents + 2 definition-less skills), invocation shape `task(agent="<name>", context="skill://<name>", assignment="…")`, phase-map pointer to `PROTO.md`, role boundaries summary.
- Rewrite v2.x plugin/enforcement machinery prose → v3 copy-to-install reality; explicitly state the sticky-rule load path (`.omp/RULES.md`, always-apply, subagent-visible) and the anti-conflict rationale.
- **Style constraint (per omp docs guidance)**: RULES.md is carried on every request — keep it a compact contract (roster, invocation, boundaries, pointer to PROTO.md for the full protocol), not a prose dump; the v2.9.1 long-form architecture sections get compressed into PROTO.md-referenced summaries.

### D4. Reference-fix policy (F3 approved)
Minimal **path-literal substitutions only** in shipped content: `scaffold/AGENTS.md` → `scaffold/RULES.md`. `scaffold/PROTO.md` references unchanged (file stays put). Generic consumer-project `AGENTS.md` mentions (docworm L78/94, hr's conditional-append semantics) describe consumer state — unchanged. No rewording, no structural edits.

### D5. Version: **v4.0.0** (MAJOR)
Breaking for consumers: new required install step (rules copy) changes what "installed" means; persona protocol becomes load-bearing sticky content instead of optional prose; README install instructions change. Layout/packaging break matches the repo's own v3.0.0 MAJOR precedent.

## File operations

| # | Op | Detail |
|---|---|---|
| 1 | create | `scaffold/RULES.md` — per D3 |
| 2 | edit | `scaffold/PROTO.md` — add RULES.md pointer where it referenced AGENTS.md (if any; verified current file has no AGENTS.md ref — only add a one-line "Registry: see RULES.md" pointer in the header area) |
| 3 | edit | `README.md` — per map below |
| 4 | edit | `.omp/agents/hr.md` L14 — `scaffold/AGENTS.md` → `scaffold/RULES.md` (path literal only) |
| 5 | edit | `.agents/skills/hr/SKILL.md` L81, 82, 101, 113, 173 — same substitution (L114 `scaffold/PROTO.md` unchanged) |
| 6 | edit | `CHANGELOG.md` — new v4.0.0 entry at top; history untouched |

## Reference-fix map

- **README.md**
  - L3 + What's-here table: add `scaffold/RULES.md` row (persona protocol, sticky-rule source); keep `scaffold/PROTO.md` row (phase protocol, doc-only).
  - "Using the agents & skills" → retitle/extend to install instructions: agents, skills, **and rules** — copy `scaffold/RULES.md` → `<your-repo>/.omp/RULES.md` (auto-loaded sticky rule, subagent-visible; cite omp native discovery); optional `scaffold/PROTO.md` → `<your-repo>/.omp/PROTO.md`.
  - Add the conflict rationale: root `AGENTS.md` is consumed by other harnesses; elon-ko never writes root files — everything installs under omp-namespaced `.omp/` (+ `.agents/` skills), so personas can't collide with another harness by default.
  - Migration §: add "install rules" step; keep step 4's delete-old-scaffold guidance.
- **`scaffold/PROTO.md`**: optional one-line registry pointer to `RULES.md`; `scaffold/PROTO.md` self-references (L345) unchanged.
- **hr agent/skill**: per D4.
- **docworm/elon skills**: no change.

## CHANGELOG entry sketch (v4.0.0)

Breaking: omp-native install layout. New `scaffold/RULES.md` — the Elon/Ko persona protocol as a sticky-rule source (lineage: v2.x `scaffold/AGENTS.md`, deleted v3.0.0); consumers copy it to `<repo>/.omp/RULES.md` where omp's native provider auto-loads it as an always-apply rule that also reaches task subagents. `scaffold/PROTO.md` retained as the doc-only phase protocol; optional consumer copy to `<repo>/.omp/PROTO.md`. Root-level `AGENTS.md` is never written or documented — installing the personas cannot conflict with other harnesses. README install instructions extended (rules copy step + rationale); hr agent/skill path literals swept. Migration: add the `.omp/RULES.md` copy; delete any legacy root `AGENTS.md`/`PROTO.md` previously scaffolded.

## CI impact

None (verified: no workflow references scaffold/AGENTS/PROTO; frontmatter checks target `.omp/agents/`).

## Acceptance criteria (runnable)

1. `test -f scaffold/RULES.md && test -f scaffold/PROTO.md && test ! -e AGENTS.md && test ! -e .omp/RULES.md && test ! -e .omp/PROTO.md` → exit 0 (dev repo keeps scaffold sources; nothing at root; dev `.omp/` untouched).
2. `git status --porcelain` shows only: new `scaffold/RULES.md`, edits to README/CHANGELOG/PROTO/hr files — nothing else.
3. `grep -rn "scaffold/AGENTS" README.md scaffold .omp .agents/skills/hr .agents/skills/elon .agents/skills/docworm` → zero hits (CHANGELOG history excluded).
4. `head -1 scaffold/RULES.md` → retitled heading per D3; `grep -c "task(agent=" scaffold/RULES.md` ≥ 1 (invocation contract present).
5. Sticky-suitability check: `wc -l scaffold/RULES.md` ≤ ~150 lines (compact contract, not prose dump — exact bound reviewed at VALIDATE).
6. README contains: `.omp/RULES.md` copy instruction, the auto-loaded/sticky/subagent-visible claim, and the no-root-AGENTS.md conflict rationale — `grep -n "\.omp/RULES.md" README.md` ≥ 2 hits; `grep -in "conflict" README.md` ≥ 1 hit.
7. CHANGELOG top entry is v4.0.0 with Breaking banner + migration notes.
8. CI green on the release commit.

## Open flags

- **F4 (new, minor)**: AC5's line bound (~150) is a review guideline, not a hard contract — validator judges compactness against the omp docs guidance that RULES.md rides every request.
- No other blockers. `.app/RESEARCH.md` Addendum records the verified rules path with citation.

## Non-goals
No implementation, no commits (Elon owns protocol artifacts), CHANGELOG history untouched, no changes to `.omp/agents/` frontmatter, no installer/tooling.
