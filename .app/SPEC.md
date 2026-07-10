# Technical Specification — Enforcement-Gate Hardening + Roster Unification (Themes A/B/C)

- **Source:** `.app/REQ.md` (the locked requirements) + Elon's confirmed design decisions (#1 Docs authority + validator enforcement; #2 bash gate = `git add/commit/status/diff/log` under `.app/`, no metacharacters). Every fix below is traceable to a finding ID (A1, A2, C-013, C-003, B1, B3, B4, B5, B6, C1, C2, C3).
- **Phase:** SPEC (LeadDev). Ready for the SPEC → DEVELOP gate.
- **Author:** LeadDev.
- **Date:** 2026-07-09.
- **Scope:** close the enforcement-gate holes (Theme A), unify the agent roster behind a canonical `PROTO.md` source-of-truth (Theme B), and make `scripts/validate-plugins.sh` enforce both roster and tool agreement in CI (Theme C). **No code is implemented in this phase.**

> **Conventions.** Line numbers are *current* (pre-DEVELOP) line numbers, captured during SPEC authoring on 2026-07-09. Because DEVELOP renumbers files, MidDev MUST re-locate each target by its **anchor string** (quoted verbatim in backticks), not by line number. The line number is a finding aid only.

---

## 0. Situation

The elon-ko distribution ships two plugins: **Plugin A** (`elon-ko-gate`, `package.json#omp.extensions`) enforcing the Elon orchestrator contract at the root session, and **Plugin B** (`elon-ko-agents`, `.omp-plugin/marketplace.json`) shipping the agent roster + skills. A read-only analysis found two classes of defect:

1. **Gate holes (Theme A)** — the root gate's `bash` and `write` handlers are too permissive: `bash` allows *any* `git …` including chained (`git status; rm …`) and destructive (`git reset --hard`, `git push --force`) commands; `write` admits any path ending `.app/PROJECT.md` (e.g. `leak.app/PROJECT.md`).
2. **Roster drift (Theme B/C)** — the roster is hardcoded in three places (gate `TEAM`, `mess-transport` `ADDRESSABLE`, `skill://elon` registry) plus every agent's frontmatter `tools:` and skill `<allowed>`. They disagree, and nothing enforces agreement. `skill://elon` does not even know `wrapper`/`debugger` exist.

The fix architecture (Elon decision #1): make **`scaffold/PROTO.md` the single canonical source** via a machine-parseable roster block, and extend **`scripts/validate-plugins.sh`** to assert every consumer agrees with it. Drift becomes a CI failure rather than a silent prompt-level inconsistency.

### 0.1 Verified facts (ground truth, 2026-07-09)

- **Canonical roster = 9 distributed agents + 1 orchestrator.** `.omp-plugin/marketplace.json:17` `agents` = `["hr","docworm","drpe","leaddev","middev","reqguru","validator","wrapper","debugger"]`, `count: 9`, description `"9-agent orchestrator roster + 10 skills."` `plugins/agents/agents/` has exactly those 9 `.md` files; `plugins/agents/skills/` has **10** dirs (the 9 + `elon`).
- **Gate `TEAM`** (`src/enforce-orchestrator.ts:61-70`) = `reqguru, drpe, leaddev, validator, docworm, hr, wrapper, debugger` (8 — the Elon-spawnable set; correctly excludes `middev`).
- **`mess-transport` `ADDRESSABLE`** (`src/mess-transport.ts:48-51`) = `reqguru, drpe, leaddev, validator, docworm, hr, middev` ∪ `{main}`. This is **already correct** — it is exactly the 7 agents whose frontmatter grants `mess-send`/`mess-fail` (see table §1), plus `main` (Elon). It is *not* a defect; see §3.1.
- **`skill://elon` `<agent_registry>`** (`plugins/agents/skills/elon/SKILL.md:233-240`) lists only 6: LeadDev, ReqGuru, DrPe, Validator, DocWorm, HR. **Missing: Wrapper, Debugger.** The `<routing_table>` (lines 140-148) likewise lacks both, and the DONE phase (line 206) has no Wrapper conditional. **This is the real Theme-B defect.**
- **Mess-capable agents** (frontmatter grants `mess-send, mess-fail`): `leaddev, reqguru, drpe, validator, docworm, hr, middev` — 7. `wrapper` and `debugger` have **no** mess tools and correctly forbid them in-skill.
- **Model tiers** (from each agent's `model:` frontmatter): `pi/slow` = drpe, leaddev; `pi/task` = middev, reqguru, validator, **debugger**; `pi/smol` = docworm, hr, wrapper. `debugger` (`pi/task`) is omitted from both `README.md` model tables and `scaffold/models.example.yml`.

### 0.2 Corrections to the analysis brief (repo has shifted — bake these in)

- **C1 / drpe prose:** the brief says drpe "documents [messaging] nowhere." **False in the current repo.** `plugins/agents/skills/drpe/SKILL.md:137` already has a full `## Cross-instance messaging` section. The *only* remaining C1 defect is the `<allowed>` gap across all 7 mess-capable skills. **Do not** add a second messaging section to drpe.
- **B6 / mirrors:** sparser than stated. `.omp/agents/` contains **only** `debugger.md` (1 of 9); `.agents/skills/` contains **only** `debugger/` and `wrapper/` (2 of 10). Every other mirror is absent.
- **C-003 / "drift":** the three lists are **different by design** (gate `TEAM` = *who Elon may spawn*; `ADDRESSABLE` = *who can receive a message*; `<agent_registry>` = *who Elon knows how to route to*). The defect is the **absence of a single declared source + an enforcer**, not that the lists are unequal. The fix (§3, §4) derives each consumer from one canonical PROTO.md block and validates each against its own slice. `mess-transport` needs **no set change** — only to become validator-checked.
- **B3 / skill count:** actual = **10** (`9 agents + elon`), matching `marketplace.json` description `"+ 10 skills"`.

---

## 1. Roster of Truth (canonical — becomes the PROTO.md blueprint)

Single canonical set, verified from `marketplace.json` + every `plugins/agents/agents/*.md` frontmatter. This exact table (as the machine block in §3.1) is what `PROTO.md` will carry and what the validator will parse.

| Agent | Role (one-liner) | Model | Spawner | Frontmatter `tools:` | Skill path | Mess-addressable |
|-------|------------------|-------|---------|----------------------|------------|------------------|
| `reqguru` | Requirements analyst — grill interview | `pi/task` | elon | `read, write, search, find, mess-send, mess-fail` | `plugins/agents/skills/reqguru/SKILL.md` | **yes** |
| `drpe` | Super researcher — internet/API/deep analysis | `pi/slow` | elon | `web_search, read, browser, edit, write, mess-send, mess-fail` | `plugins/agents/skills/drpe/SKILL.md` | **yes** |
| `leaddev` | Lead developer — spec/review/integration/commits | `pi/slow` | elon | `read, write, edit, bash, search, find, ast_grep, ast_edit, lsp, debug, task, mess-send, mess-fail` | `plugins/agents/skills/leaddev/SKILL.md` | **yes** |
| `validator` | Compliance auditor (read-only) | `pi/task` | elon | `read, search, find, lsp, bash, mess-send, mess-fail` | `plugins/agents/skills/validator/SKILL.md` | **yes** |
| `docworm` | Documentation specialist | `pi/smol` | elon | `read, write, edit, search, find, mess-send, mess-fail` | `plugins/agents/skills/docworm/SKILL.md` | **yes** |
| `hr` | Agent definition / hiring | `pi/smol` | **elon, leaddev** | `read, write, edit, mess-send, mess-fail` | `plugins/agents/skills/hr/SKILL.md` | **yes** |
| `wrapper` | Release engineering — version/branch/CI/tag/main-sync | `pi/smol` | elon | `bash, read, write, edit, find, search` | `plugins/agents/skills/wrapper/SKILL.md` | **no** |
| `debugger` | Root-cause analyst — read-only diagnose-only report | `pi/task` | elon | `read, bash, search, find, lsp, debug` | `plugins/agents/skills/debugger/SKILL.md` | **no** |
| `middev` | Implementer — writes code to spec | `pi/task` | **leaddev** | `read, write, edit, bash, search, find, ast_grep, ast_edit, lsp, debug, mess-send, mess-fail` | `plugins/agents/skills/middev/SKILL.md` | **yes** |
| `elon` | Orchestrator (root session; never spawned) | — | self | `read, ask, todo, job, irc, write(.app/PROJECT.md), bash(git add/commit/status/diff/log), task` | `plugins/agents/skills/elon/SKILL.md` | **yes** (as `main`) |

**Counts:** 9 distributed agents + 1 orchestrator = **10** skill-bearing entities. **Elon-spawnable (gate `TEAM`) = 8**: reqguru, drpe, leaddev, validator, docworm, hr, wrapper, debugger. **LeadDev-spawned (`leaddev.spawns`) = 2**: middev, hr (hr is shared — spawnable by both). **Mess-addressable = 7 agents** (all except wrapper, debugger) **+ `main`**.

### 1.1 Should `wrapper`/`debugger` be mess-addressable? — Decision: **NO**

Keep both **non-addressable** (no `mess-send`/`mess-fail`). Justification: they are **synchronous, fire-and-forget, on-demand** agents. Wrapper runs a release to completion and returns an escalation-or-success report; Debugger returns a single read-only root-cause report. Neither holds a multi-turn, cross-instance conversation. The 7 mess-capable agents are the *phase-owning / conversational* agents that may need to coordinate across omp instances (delegations, deliverables, handoffs on the shared `.app/` disk). Adding mess tools to wrapper/debugger would be pure scope creep with no use case, and would *also* require new frontmatter + skill `<allowed>` entries (C1's expansion from 7→9). Therefore `ADDRESSABLE` stays `{7 mess-capable} ∪ {main}`, and the validator enforces `ADDRESSABLE \ {main} == {agents whose frontmatter grants mess tools}` — derived from PROTO.md.

---

## 2. Theme A — Enforcement-Gate Holes (`src/enforce-orchestrator.ts`)

All changes are inside the `pi.on("tool_call", …)` handler. Do **not** change opt-in logic, the advisory `session_start` re-inject, `ROOT_ALLOWED`, or the `task`/TEAM block.

### 2.1 A1 / C-001 (CRITICAL) — harden the `bash` gate (decision #2)

**Anchor:** the block beginning `if (tool === "bash") {` (currently lines 188-195), whose body is the single line `if (command === "git" || command.startsWith("git ")) return;`. Replace that permissive one-liner with the structured procedure below.

**The exact contract (decision #2):** allow *only* `git add | commit | status | diff | log` whose **path arguments resolve under `.app/`**, and **reject any shell metacharacter** anywhere in the command. Preserve Elon's ability to stage + commit `.app/{REQ,RESEARCH,SPEC,PROJECT}.md`.

**Algorithm (implement in this order; first failure ⇒ `block(...)`):**

1. **Trim** the command. Reject empty.
2. **Metacharacter rejection (global, on the whole command string).** Reject if it contains any character in the set **`{ ; & | $ ` ` > < newline \ }`** — i.e. the regex `/[;&|$`><\n\\]/`. This is the *first* check (before the prefix test), per decision #2. "Any" means *anywhere* — including inside what would be a commit message. (Rationale + the migration consequence are in §6.1.)
3. **Tokenize** on runs of whitespace (`split(/\s+/)`). (Safe: step 2 already removed every character that could form a quote/escape/chaining construct, so naive whitespace splitting cannot be subverted.)
4. **First-token + subcommand allowlist.** `argv[0]` MUST equal the literal `git`. `argv[1]` (the subcommand) MUST be one of **`add`, `commit`, `status`, `diff`, `log`**. Anything else (`push`, `reset`, `checkout`, `rm`, `clean`, …) ⇒ block.
5. **Mass-stage flag rejection.** Reject any flag token that would stage or commit files *beyond explicit path arguments*: the long forms `--all`, `--update`, `--patch` and any short flag whose character set intersects **`{ a A u p }`** (covers `-a`, `-A`, `-u`, `-p`, and combined forms like `-am`, `-Au`). Rationale: these are the path-equivalent of "." (everything) / tracked-modifications / arbitrary-hunk staging, none of which "resolves under `.app/`".
6. **Option-value skipping.** When iterating `argv[2..]`, the value immediately following a **value-taking option** is NOT a path and MUST be skipped. Value-taking options: **`-m`, `--message`, `-F`, `--file`, `-c`, `-C`, `--author`, `--date`, `--reedit-message`, `--reuse-message`, `-S`**, plus their `=`-attached forms (`-m=msg`, `--message=msg`, etc. — these carry the value inline and produce no separate token).
7. **Path scoping.** Every remaining non-flag token is a **path argument**. Normalize each: collapse repeated `/`, strip a trailing `/`, strip a leading `./`, then **reject if it contains a `..` segment** (prevents `.app/../etc/x`). A path is valid iff, after normalization, it **equals `.app`** or **starts with `.app/`**. Any path outside `.app/` ⇒ block.
8. **`add` minimum.** For subcommand `add`: require **≥ 1** valid `.app/` path argument (reject flag-only `git add` with no path). For `commit`/`status`/`diff`/`log`: zero paths is allowed (e.g. `git status`, `git commit -m "…"`).
9. If all checks pass ⇒ `return;` (allow).

**Mandatory test cases (pin behavior; add to `src/enforce-orchestrator.test.ts` — see §2.3):**

| Command | Expected | Reason |
|---------|----------|--------|
| `git status` | ALLOW | subcommand ok, no paths |
| `git log` | ALLOW | subcommand ok, no paths |
| `git diff` | ALLOW | subcommand ok, no paths |
| `git diff .app/SPEC.md` | ALLOW | path under `.app/` |
| `git add .app/PROJECT.md` | ALLOW | path under `.app/` |
| `git add .app/REQ.md .app/PROJECT.md` | ALLOW | multiple `.app/` paths |
| `git commit -m "[PROTO] Update SPEC.md"` | ALLOW | message value skipped; msg has no metachar |
| `git commit .app/PROJECT.md -m "[PROTO] x"` | ALLOW | explicit `.app/` path + skipped message |
| `git status; rm -rf /` | **BLOCK** | metachar `;` |
| `git log && npm run build` | **BLOCK** | metachar `&` |
| `git diff | cat` | **BLOCK** | metachar `|` |
| `git commit -m "$(whoami)"` | **BLOCK** | metachar `$` |
| `git status > out.txt` | **BLOCK** | metachar `>` |
| `` git status`whoami` `` | **BLOCK** | metachar backtick |
| `git reset --hard` | **BLOCK** | subcommand `reset` not allowed |
| `git push --force` | **BLOCK** | subcommand `push` not allowed |
| `git checkout main` | **BLOCK** | subcommand `checkout` not allowed |
| `npm run build` | **BLOCK** | first token ≠ `git` |
| `git add .` | **BLOCK** | path `.` not under `.app/` |
| `git add src/foo.ts` | **BLOCK** | path not under `.app/` |
| `git add -A` | **BLOCK** | mass-stage flag `-A` |
| `git commit -a -m x` | **BLOCK** | mass-stage flag `-a` |
| `git add .app/../etc/passwd` | **BLOCK** | `..` escapes `.app/` |

### 2.2 A2 / C-002 (HIGH) + C-013 (LOW) — tighten the `write` gate

**Anchor:** the `if (tool === "write") {` block (lines 176-186), condition at line 179: `if (path.endsWith(".app/PROJECT.md") || path.endsWith("/.app/PROJECT.md"))`.

**Defect A2:** the first operand `path.endsWith(".app/PROJECT.md")` admits any `X.app/PROJECT.md` (e.g. `leak.app/PROJECT.md`) because it never requires a path separator before `.app`. **Defect C-013:** the second operand `path.endsWith("/.app/PROJECT.md")` is a strict subset of the first (anything ending `/.app/PROJECT.md` also ends `.app/PROJECT.md`), so it is dead/redundant.

**Fix — replace the whole condition with one normalized, non-redundant test:**

```ts
if (tool === "write") {
  const raw = String(input.path ?? "");
  // Normalize: collapse repeated slashes, drop a trailing slash, strip a leading "./".
  const norm = raw.replace(/\/+/g, "/").replace(/\/$/, "").replace(/^\.\//, "");
  // Allow ONLY the protocol status artifact, where ".app" is a real directory
  // component (start-of-string, or preceded by "/"). Rejects "X.app/PROJECT.md".
  if (norm === ".app/PROJECT.md" || norm.endsWith("/.app/PROJECT.md")) return;
  return block(
    `The root orchestrator may only write .app/PROJECT.md (got "${raw}"). ` +
      `All other file creation belongs to a team agent — spawn one via task(agent="<name>").`,
  );
}
```

The two operands now cover distinct, non-overlapping cases (bare relative `.app/PROJECT.md` vs. slash-prefixed/absolute `…/.app/PROJECT.md`); the redundant second operand is gone (C-013), and the loose bare-suffix operand is replaced by an exact equality (A2).

**Path-scoping matrix (must hold):**

| `path` | Normalized | Expected |
|--------|-----------|----------|
| `.app/PROJECT.md` | `.app/PROJECT.md` | ALLOW |
| `./.app/PROJECT.md` | `.app/PROJECT.md` | ALLOW |
| `.app/PROJECT.md/` | `.app/PROJECT.md` | ALLOW |
| `/Users/x/elon-ko/.app/PROJECT.md` | (ends `/.app/PROJECT.md`) | ALLOW |
| `a/b/.app/PROJECT.md` | (ends `/.app/PROJECT.md`) | ALLOW |
| `leak.app/PROJECT.md` | `leak.app/PROJECT.md` | **BLOCK** (no separator before `.app`) |
| `foo.app/PROJECT.md` | `foo.app/PROJECT.md` | **BLOCK** |
| `.app/REQ.md` | `.app/REQ.md` | **BLOCK** (wrong artifact) |
| `src/.app/PROJECT.md`-as-distinct | (ends `/.app/PROJECT.md`) | ALLOW* |

\*`src/.app/PROJECT.md` matches the suffix rule; it is an accepted, non-threatening edge (Elon cannot create `src/.app/` without tools the gate already blocks, and the only effect is a file under the repo). The meaningful boundary — rejecting suffix-without-separator (`leak.app/…`) — is enforced. Do not over-engineer cwd-relative checking; it is out of scope.

### 2.3 Tests to add — `src/enforce-orchestrator.test.ts`

Add two `describe` blocks (or extend existing) covering §2.1's table and §2.2's matrix. Each case drives the gate's `tool_call` handler with the literal `input` and asserts allow (no `block`) vs. the block reason substring. Positive bash cases must exercise `git add`, `git commit -m`, `git status`, `git diff <path>`, `git log`; negative cases must cover one of each rejection class (metachar, bad subcommand, non-`git` first token, out-of-`.app/` path, mass-stage flag, `..` escape). These tests are the executable contract Validator will check.

---

## 3. Theme B — PROTO.md Canonical Roster + Validator Source-of-Truth

### 3.1 C3 (part 1) — `scaffold/PROTO.md`: add the canonical, machine-parseable roster block

`PROTO.md` already has a human "Agent-to-Phase Map" table (lines 254-265). **Add a new machine-parseable block** immediately before that table (or as a new `## Canonical Agent Roster` section right after the `## Overview`), formatted as a fenced code block with the infostring **`elon-ko-roster`**. This block is the single source the validator parses (§4). One data line per agent; fields pipe-delimited; `#`-prefixed lines are comments the validator skips:

````markdown
## Canonical Agent Roster (single source of truth)

> Every consumer — the gate `TEAM` (`src/enforce-orchestrator.ts`), `mess-transport.ts`
> `ADDRESSABLE`, `skill://elon` `<agent_registry>`, each agent's `tools:` frontmatter, and
> each skill's `<allowed>` — MUST agree with the attributes declared here.
> `scripts/validate-plugins.sh` enforces it; drift is a CI failure.

```elon-ko-roster
# name | model | spawner(csv) | spawns(csv or -) | tools(csv) | skill | mess(yes/no)
reqguru|pi/task|elon|-|read,write,search,find,mess-send,mess-fail|plugins/agents/skills/reqguru/SKILL.md|yes
drpe|pi/slow|elon|-|web_search,read,browser,edit,write,mess-send,mess-fail|plugins/agents/skills/drpe/SKILL.md|yes
leaddev|pi/slow|elon|middev,hr|read,write,edit,bash,search,find,ast_grep,ast_edit,lsp,debug,task,mess-send,mess-fail|plugins/agents/skills/leaddev/SKILL.md|yes
validator|pi/task|elon|-|read,search,find,lsp,bash,mess-send,mess-fail|plugins/agents/skills/validator/SKILL.md|yes
docworm|pi/smol|elon|-|read,write,edit,search,find,mess-send,mess-fail|plugins/agents/skills/docworm/SKILL.md|yes
hr|pi/smol|elon,leaddev|-|read,write,edit,mess-send,mess-fail|plugins/agents/skills/hr/SKILL.md|yes
wrapper|pi/smol|elon|-|bash,read,write,edit,find,search|plugins/agents/skills/wrapper/SKILL.md|no
debugger|pi/task|elon|-|read,bash,search,find,lsp,debug|plugins/agents/skills/debugger/SKILL.md|no
middev|pi/task|leaddev|-|read,write,edit,bash,search,find,ast_grep,ast_edit,lsp,debug,mess-send,mess-fail|plugins/agents/skills/middev/SKILL.md|yes
elon|-|self|-|read,ask,todo,job,irc,write,bash,task|plugins/agents/skills/elon/SKILL.md|main
```
````

**Why this format:** bash-native parsing (no `yq`/`yq`-like dependency) — the validator extracts lines inside the ```` ```elon-ko-roster ```` fence, skips `#` lines, splits each on `|`. Pipe-delimited fields avoid the comma ambiguity that would arise if `tools` (itself comma-csv) were a column delimiter. `spawner` is a csv so `hr` can declare `elon,leaddev` and the gate-derivation (`spawner` contains `elon`) and leaddev-derivation (`spawns` lists `hr`) both resolve consistently. `elon`'s `mess` value `main` flags the special `main` recipient.

### 3.2 C3 (part 2) — `scripts/validate-plugins.sh`: add roster + tool-agreement checks

Add a new section `== Plugin B: roster & tool-agreement (source-of-truth) ==` after the existing per-plugin loop (after line 130). It runs only bash + `jq` + `awk`/`grep` (already required). **Parse the roster first**, then assert each consumer. Failures append to `$ERRS` (existing convention).

**Step A — parse the canonical roster from PROTO.md.** Extract the fenced block:
```bash
ROSTER_FILE="scaffold/PROTO.md"
ROSTER="$(awk '/^```elon-ko-roster$/{f=1;next} /^```$/{if(f){f=0}} f' "$ROSTER_FILE" | grep -v '^#')"
```
If empty ⇒ `err "PROTO.md: no \`\`\`elon-ko-roster block found"`. For each non-comment line, split on `|` into `name|model|spawner|spawns|tools|skill|mess`. Build sorted sets per check below.

**Step B — gate `TEAM` agreement** (gate = agents Elon may spawn). Extract the array literal from `src/enforce-orchestrator.ts` (between `const TEAM = [` and `] as const;`), collect quoted names. Assert (sorted, set-equal) it equals `{ name : spawner ∋ elon }` from the roster ⇒ the 8 `reqguru, drpe, leaddev, validator, docworm, hr, wrapper, debugger`. Currently passes (gate is correct) — this check *locks* it.

**Step C — `mess-transport` `ADDRESSABLE` agreement.** Extract the `TEAM` array from `src/mess-transport.ts:48` and confirm `ADDRESSABLE` = that ∪ `{main}`. Assert the extracted set (sorted, set-equal) equals `{ name : mess == yes AND name != elon }` ⇒ the 7 `reqguru, drpe, leaddev, validator, docworm, hr, middev`. Assert `main` is also addressable. Currently passes (mess-transport is correct) — this check *locks* it and documents that the set intentionally differs from the gate.

**Step D — `skill://elon` registry completeness.** Extract every `<agent name="X" …/>` from the `<agent_registry>` block in `plugins/agents/skills/elon/SKILL.md`. Assert the set equals the 9 non-`elon` roster agents (reqguru…debugger). **Currently FAILS** (only 6) — this check is what forces the §3.3 fix.

**Step E — marketplace agreement.** Assert `jq '.plugins[0].agents'` (sorted) equals the 9 non-`elon` agents, and `.plugins[0].count == 9`, and the description embeds `9-agent` and `10 skills`.

**Step F — frontmatter `tools:` agreement (per agent).** For each of the 9 agent `.md` files, parse the `tools:` line from frontmatter (the validator already extracts frontmatter via `awk` at line 113 — reuse that helper). Assert (sorted, set-equal) the parsed tools equal the roster `tools` field for that agent. Catches a hire that adds a tool to the definition but forgets PROTO.md (or vice-versa).

**Step G — skill `<allowed>` agreement (per agent) — the C1 enforcement.** For each agent skill, `awk` the region between `<allowed>` and `</allowed>`, extract every `name="X"` from `<tool name="X">`. Assert (sorted, set-equal) `{<allowed> names}` == `{frontmatter tools}` (the same set as Step F). Additionally assert `{<forbidden> names} ∩ {frontmatter tools} == ∅` (a granted tool must never appear in `<forbidden>`). **Currently FAILS for the 7 mess-capable agents** (their `<allowed>` omits `mess-send`/`mess-fail`) — this check forces the §5.1 fix and locks the hr-skill rule ("definition tools and skill allowed/forbidden MUST agree exactly"). For `skill://elon`, parse its `<allowed>` and assert it equals the `elon` roster `tools` set (`read, ask, todo, job, irc, write, bash, task`); note write/bash are scope-qualified in prose but the base names must match.

**Step H — spawns agreement.** For agents whose roster `spawns != -` (currently only `leaddev` → `middev,hr`), assert the `spawns:` frontmatter line equals it.

**Pass/fail:** the script exits 1 if `$ERRS` is non-empty (existing convention, lines 134-141). Every check above appends a precise `err` message naming the file + the expected vs. found set on mismatch.

### 3.3 B1 / F-002 (HIGH) — `skill://elon`: add Wrapper + Debugger awareness

File: `plugins/agents/skills/elon/SKILL.md`.

1. **`<routing_table>` (lines 140-148):** add two routes before the "No suitable agent" fallback:
   - `<route task="Ship a release: version bump, branch/push, CI gate, PR/MR, tag/release, main sync" agent="Wrapper" skill="wrapper"/>`
   - `<route task="Diagnose a CI/CD pipeline failure or a codebase/runtime bug; root-cause report with file:line evidence" agent="Debugger" skill="debugger" note="On-demand, cross-phase. Debugger returns a read-only report; a fixing agent (leaddev/middev) applies the fix."/>`
2. **`<agent_registry>` (lines 233-240):** add two entries:
   - `<agent name="Wrapper" skill="wrapper" path="plugins/agents/skills/wrapper/SKILL.md">Release engineering — version bump, branch/push, CI gate, PR/MR, tag/release, main sync. On demand in DONE.</agent>`
   - `<agent name="Debugger" skill="debugger" path="plugins/agents/skills/debugger/SKILL.md">Root-cause analyst — read-only diagnose-only report with file:line evidence. On demand, cross-phase.</agent>`
3. **DONE phase (line 206):** add a Wrapper conditional mirroring `scaffold/PROTO.md` Phase 6 (lines 208-223). The current DONE line becomes: evaluate DocWorm (existing rule) **and** Wrapper — Wrapper runs iff the change is being released (needs version bump + tag); otherwise skip with a noted reason. (Debugger is on-demand/cross-phase and needs no DONE block.)

### 3.4 B4 / F-008 (MEDIUM) — `skill://elon`: add `todo` to `<allowed>`

The gate `ROOT_ALLOWED` (line 73) already grants `todo`; `AGENTS.md`/`.DEVREADME.md` grant it; only the skill `<allowed>` (lines 35-43) omits it, so the skill's own `<boundaries>` rule "Use any tool not explicitly listed in `<allowed>`" forbids what the runtime allows. Add:
`<tool name="todo">MUST use ONLY for workflow/phase status tracking (which phase is active, what is blocked). NEVER as a substitute for spawning agents or for implementation.</tool>`
Insert it among the other allowed tools (e.g. after `irc`). This also satisfies Step G of the validator for `skill://elon` (its `<allowed>` must equal the roster `tools` set, which includes `todo`).

---

## 4. Theme B — Documentation Reconciliation

### 4.1 B3 / F-003 (HIGH) — `.DEVREADME.md`

File: `.DEVREADME.md`. Four edits (re-anchor by string, not line):

1. **TEAM list (lines 54-55):** the inline `task → allowed only when agent ∈ TEAM (reqguru, drpe, leaddev, validator, docworm, hr)` → append `, wrapper, debugger` (8 total).
2. **Elon row `task` cell (line 69):** the cell `task | reqguru, drpe, leaddev, validator, docworm, hr` → append `, wrapper, debugger` (8). Also the table (lines 67-76) currently omits Wrapper and Debugger rows — **add two rows**:
   - `| **Wrapper** | bash, read, write, edit, find, search | — | Release engineering (git/gh/glab only) |`
   - `| **Debugger** | read, bash, search, find, lsp, debug | — | Root-cause analyst (read-only, diagnose-only) |`
3. **Skill count (lines 167-168):** `The roster ships 8: `elon`, `hr`, `middev`, `reqguru`, `validator`, `drpe`, `leaddev`, `docworm`.` → `The roster ships 10: `elon`, `hr`, `middev`, `reqguru`, `validator`, `drpe`, `leaddev`, `docworm`, `wrapper`, `debugger`.`
4. **(Mirror policy doc — B6, §4.4)** add the mirror/link policy sentence to the "Extending: add or change an agent" section.

> **Observation (NOT a spec deliverable — flag to Elon):** line 179's `package.json` extensions example lists 4 entries and omits `./src/idea-storage.ts` (actual = 5). This is a separate doc drift, not in the finding list; left for Elon to decide. Do not bundle unless Elon approves.

### 4.2 B5 / F-005/F-009 (MEDIUM) — `README.md`

File: `README.md`. Three edits:

1. **Spawn list (line 233):** ``(`reqguru`, `drpe`, `leaddev`, `validator`, `docworm`, `hr`, `wrapper`)`` → append `, `debugger`` (8 Elon-spawnable; `middev` stays out — it is LeadDev-spawned).
2. **Model table (lines 260-264):** the `pi/task` row ``| `pi/task` | `middev`, `reqguru`, `validator` | …`` → append `, `debugger``.
3. **Model YAML comments (lines 281-283):** `task: anthropic/claude-sonnet-4-5      # middev, reqguru, validator` → append `, debugger`.

### 4.3 B5 (cont.) — `scaffold/models.example.yml`

File: `scaffold/models.example.yml`. Three edits, all adding `debugger` to the **`pi/task` (Tier 2)** tier:

1. Header comment **line 7:** `#   Tier 2 (strong general):      middev, reqguru, validator -> model: pi/task` → append `, debugger`.
2. Inline comment **line 33:** `  # Tier 2 - strong general (middev, reqguru, validator).` → append `, debugger`.
3. (The `modelRoles` block has no per-agent list to edit beyond the comments; the alias values are tier-level. No value change needed.)

### 4.4 B6 / F-010 (LOW) — mirror policy

**Verified state:** `.omp/agents/` holds only `debugger.md`; `.agents/skills/` holds only `debugger/` and `wrapper/`. The installer (`elon_ko.sh`) uses `omp plugin install` (not `omp plugin link`), and `scaffold/PROTO.md:279-288` documents the mirror as the *default* dev-session convention with `link` as the drift-free alternative. The HR skill mirrors in the dev repo by procedure. The current state is therefore an **incomplete mirror**, not a link setup.

**Decision: MIRROR ALL** (complete the set), enforced by the validator. Aligns with the documented HR convention and the existing (partial) mirrors; contradicted by nothing in repo state. Concretely:

- **Policy:** every `plugins/agents/agents/<n>.md` is mirrored **byte-identical** to `.omp/agents/<n>.md`; every `plugins/agents/skills/<n>/SKILL.md` is mirrored byte-identical to `.agents/skills/<n>/SKILL.md`. This means adding the 8 missing agent mirrors (`reqguru, drpe, leaddev, validator, docworm, hr, wrapper, middev` — debugger already mirrored) and the 8 missing skill mirrors (`reqguru, drpe, leaddev, validator, docworm, hr, middev, elon` — debugger + wrapper already mirrored).
- **Validator check (add to §3.2, Step I):** for each of the 9 agents, `cmp -s plugins/agents/agents/<n>.md .omp/agents/<n>.md` (err if missing or differs); for each of the 10 skills, `cmp -s plugins/agents/skills/<n>/SKILL.md .agents/skills/<n>/SKILL.md`. Byte-identity = zero drift.
- **Document in `.DEVREADME.md`** (the "Extending: add or change an agent" section, ~lines 131-163): state the mirror-ALL policy explicitly — *"The dev session mirrors every distributed agent + skill byte-identically into `.omp/agents/` + `.agents/skills/`; `scripts/validate-plugins.sh` enforces byte-identity. The drift-free alternative is `omp plugin link` (then delete all mirrors); this repo uses mirrors."*
- **Side-effect fixed:** `plugins/agents/skills/wrapper/SKILL.md:50` references `.omp/agents/wrapper.md` as the enforced-tools source; under mirror-ALL that file will exist, so the reference becomes accurate (no text change needed beyond creating the mirror).

> The alternative (link + mirror NONE, deleting the 3 existing mirrors) is equally drift-free and lower-maintenance, and is noted in DEVREADME as the escape. Mirror-ALL is chosen because it matches the evidenced convention and needs no dev-environment action.

---

## 5. Theme C — Folded Consistency Fixes

### 5.1 C1 / F-001 (HIGH) — add `mess-send, mess-fail` to 7 skills' `<allowed>`

For each of the 7 mess-capable agent skills — `leaddev`, `reqguru`, `drpe`, `validator`, `docworm`, `hr`, `middev` — the frontmatter `tools:` grants `mess-send, mess-fail` and a prose `## Cross-instance messaging` section documents them, but the XML `<tool_policy><allowed>` block OMITS both. This violates the hr skill's own rule ("definition tools and skill allowed/forbidden MUST agree exactly") and will fail validator Step G (§3.2).

**Fix:** in each of the 7 skills, add to the `<allowed>` block:
```
    <tool name="mess-send">Deliver a message to an agent that may run in a different omp instance; co-located receivers are reached in-app, others via a file under `.app/mess/`. See "Cross-instance messaging" below.</tool>
    <tool name="mess-fail">Mark a received message failed (increments attempts; after 3 it is moved to `arc/`).</tool>
```
Insert adjacent to the other allowed tools (e.g. after the last existing `<tool>` in `<allowed>`). **Do not** duplicate the prose section — it already exists in all 7 (including drpe, per §0.2 correction). `wrapper` and `debugger` are **excluded** — they have no mess tools and correctly list them under `<forbidden>`.

### 5.2 C2 / F-007 (MEDIUM) — drpe verdict typo

File: `plugins/agents/agents/drpe.md`, **line 12** — the body sentence spells the verdict `CONTRICT`. The skill (`plugins/agents/skills/drpe/SKILL.md:95`) spells it `CONTRADICT`. **Fix: `CONTRICT` → `CONTRADICT`** (the definition file is wrong; the skill's `CLEAR/EXPAND/CONTRADICT/UNCLEAR` is the intended word — "findings contradict or invalidate requirements"). Single-character-word correction in the one sentence.

---

## 6. Acceptance Criteria (what Validator checks)

Numbered; each is observable/testable. REQ-traceability in brackets.

- **AC-1 [A1]** `src/enforce-orchestrator.test.ts` contains cases asserting every row of the §2.1 table passes (ALLOW for the green rows; BLOCK with the matching reason substring for the red rows). `npm test` is green.
- **AC-2 [A1]** No path through the new `bash` handler allows a command containing `; & | $ ` ` > < \` or newline, or a `git` subcommand outside `{add,commit,status,diff,log}`, or a path argument outside `.app/`.
- **AC-3 [A2]** The `write` handler BLOCKS `leak.app/PROJECT.md` and any `X.app/PROJECT.md` (no separator), and ALLOWS `.app/PROJECT.md`, `./.app/PROJECT.md`, and absolute `…/.app/PROJECT.md`. The redundant second OR operand is removed (C-013).
- **AC-4 [B1]** `plugins/agents/skills/elon/SKILL.md` `<agent_registry>` lists 8 agents (adds Wrapper, Debugger); `<routing_table>` has Wrapper + Debugger routes; the DONE phase has a Wrapper conditional.
- **AC-5 [B4]** `skill://elon` `<allowed>` includes `todo`.
- **AC-6 [B3]** `.DEVREADME.md` TEAM = 8 (adds wrapper, debugger); Elon `task` cell = 8; agent table has Wrapper + Debugger rows; skill count = 10 with all 10 listed.
- **AC-7 [B5]** `README.md` spawn list includes `debugger` (8); both model-tier locations (table + YAML comments) list `debugger` under `pi/task`.
- **AC-8 [B5]** `scaffold/models.example.yml` lists `debugger` under the `pi/task` tier (header + inline comments).
- **AC-9 [B6]** `.omp/agents/` mirrors all 9 agent definitions byte-identically; `.agents/skills/` mirrors all 10 skills byte-identically.
- **AC-10 [C1]** Each of the 7 mess-capable skills' `<allowed>` contains `mess-send` and `mess-fail` (set-equal to its frontmatter `tools:`).
- **AC-11 [C2]** `plugins/agents/agents/drpe.md` spells the verdict `CONTRADICT`.
- **AC-12 [C3]** `scaffold/PROTO.md` contains a ```` ```elon-ko-roster ```` block listing all 10 entities with the §3.1 fields.
- **AC-13 [C3]** `bash scripts/validate-plugins.sh` exits 0 against the post-DEVELOP tree, exercising Steps A–I (roster parse; gate TEAM; mess-transport ADDRESSABLE; skill://elon registry; marketplace; frontmatter tools; skill `<allowed>`; spawns; mirror byte-identity). Drift in any consumer ⇒ exit 1 with a named error.
- **AC-14 [non-regression]** `npm run typecheck` is green (the gate is TypeScript; the write/bash rewrite must type-check). No existing passing test is broken.

---

## 7. Risks & Migration Notes

### 7.1 Bash tightening changes Elon's commit habit (the flagged risk — YES, intentionally)

Today the gate allows *anything* starting with `git `, so Elon can (and the protocol examples imply he does) chain: `git add .app/REQ.md && git commit -m "[PROTO] …"`. **After A1, `&&` is a metachar ⇒ BLOCKED.** Migration: Elon must issue **two separate `bash` calls** — `git add .app/<file>` then `git commit -m "…"` — both still allowed. This preserves the ability to stage + commit `.app/{REQ,RESEARCH,SPEC,PROJECT}.md` (decision #2's explicit requirement) while removing chaining. **Document this in the completion report** so the user knows the new two-step flow.

Secondary consequence: because metachar rejection is global, **commit messages must not contain `; & | $ ` ` > < \ `** or newlines. Protocol labels (`[PROTO]`, `[SPEC §N]`, `[FIX]`, `[TRIVIAL]`) and ordinary prose contain none of these, so real impact is limited to messages with arrows (`->`) or ampersands — rewrite as plain text. Flagged, accepted.

### 7.2 Mass-stage flags (`-A`, `-a`) are now rejected

`git add -A` / `git commit -a` are blocked (§2.1 step 5) because they stage/commit beyond explicit `.app/` paths, violating "Elon commits only protocol artifacts." Elon must name `.app/` files explicitly. Low risk: the protocol already names them explicitly. (Residual, out of scope: a bare `git commit -m x` with no path commits whatever is *already staged* — but staging is now `.app/`-scoped, so this is safe.)

### 7.3 `mess-transport.ts` is intentionally NOT changed

C-003 reads as "the lists disagree → fix them," but `ADDRESSABLE` is already correct (the 7 mess-capable + main). The spec makes it **validator-checked** (Step C) rather than editing the set. MidDev must NOT add wrapper/debugger to `ADDRESSABLE` (that would be wrong — they have no mess tools; see §1.1) and must NOT remove `middev` (it IS mess-capable).

### 7.4 Adding `todo` to `skill://elon` is additive only

The runtime already grants `todo` (`ROOT_ALLOWED`); this spec only makes the skill's `<allowed>` honest about it. No behavioral change at runtime; removes a self-contradiction. The validator's Step G for `skill://elon` requires the roster `tools` set to include `todo` — keep them in sync.

### 7.5 Mirror-ALL adds files but no behavior change

Creating 8 agent mirrors + 8 skill mirrors is pure duplication for the dev session; end users are unaffected (they `omp plugin install`). Byte-identity is `cmp`-enforced. Risk: future edits to `plugins/` that forget the mirror ⇒ CI failure (which is the point). The HR skill already documents this two-write procedure.

### 7.6 Validator now fails-fast on drift

After §3.2, any future hire/edit that updates one touchpoint but not PROTO.md (or vice-versa) turns the build red. This is the intended enforcement; it converts today's silent drift into an explicit CI gate. The first run after DEVELOP must pass cleanly (all consumers reconciled by this spec).

### 7.7 PROTO.md roster block must stay hand-edited carefully

The ```` ```elon-ko-roster ```` block is the source. If a hire adds an agent, HR/LeadDev must add the row here FIRST, then the validator confirms every consumer matches. A malformed block (wrong field count, missing fence) ⇒ validator Step A fails with a clear message. Keep the field order/name stable (the validator indexes positionally).

---

## 8. Deliverable Checklist (for DEVELOP)

| ID | Finding | File(s) | Change |
|----|---------|---------|--------|
| D-A1 | A1/C-001 | `src/enforce-orchestrator.ts`, `src/enforce-orchestrator.test.ts` | Rewrite `bash` handler per §2.1; add §2.1 test table |
| D-A2 | A2/C-002 + C-013 | `src/enforce-orchestrator.ts` | Replace `write` condition per §2.2 |
| D-C3a | C3 | `scaffold/PROTO.md` | Add `## Canonical Agent Roster` + ```` ```elon-ko-roster ```` block (§3.1) |
| D-C3b | C3 | `scripts/validate-plugins.sh` | Add Steps A–I (§3.2) |
| D-B1 | B1/F-002 | `plugins/agents/skills/elon/SKILL.md` | Add Wrapper+Debugger routes/registry + DONE Wrapper block (§3.3) |
| D-B4 | B4/F-008 | `plugins/agents/skills/elon/SKILL.md` | Add `todo` to `<allowed>` (§3.4) |
| D-B3 | B3/F-003 | `.DEVREADME.md` | TEAM=8, table rows, skill count=10, mirror-policy sentence (§4.1, §4.4) |
| D-B5a | B5/F-005,009 | `README.md` | spawn list +debugger; model table + comments +debugger (§4.2) |
| D-B5b | B5 | `scaffold/models.example.yml` | debugger in `pi/task` tier comments (§4.3) |
| D-B6 | B6/F-010 | `.omp/agents/*.md`, `.agents/skills/*/SKILL.md` | Mirror all 9 agents + 10 skills byte-identical (§4.4) |
| D-C1 | C1/F-001 | 7 skill `SKILL.md` | Add `mess-send, mess-fail` to `<allowed>` (§5.1) |
| D-C2 | C2/F-007 | `plugins/agents/agents/drpe.md` | `CONTRICT` → `CONTRADICT` (§5.2) |

**Out of scope (do NOT touch):** Themes D/E/F (except C3's validator check, which IS in scope). No CI-workflow test additions (D1). No `mess-transport.ts` set change. No full test-suite/lint runs beyond the gate's own tests + typecheck (AC-1, AC-14).

---

**SPEC is complete enough that an independent Validator can audit the implementation against AC-1…AC-14, and an independent implementer (MidDev) can build it without further design input.** Hand off to DEVELOP.
