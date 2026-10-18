# Research Report: Distributing the `logging-design` Skill Across the elon-ko System

## Scope

Researched how the skill at `.claude/skills/logging-design/` (currently orphaned from any
installation path) can be shipped so that **after installing elon-ko, omp starts using it by
default in any project**. Constraints: target is omp (not Claude Code); `.claude/` must not be
required at runtime; no per-project copying.

Sources: direct reads of every load-bearing file in this repo (skill, manifests, installer,
validator, scaffold docs, changelog); the omp harness's bundled documentation (`omp://skills.md`,
`omp://marketplace.md`, `omp://skills/authoring-marketplaces.md`, `omp://tools/manage_skill.md`);
and the **live installed state on this machine** (`~/.omp/marketplaces.json`,
`~/.omp/plugins/installed_plugins.json`, `~/.omp/plugins/omp-plugins.lock.json`, the plugin cache
trees, and the current session's own skill listing). No shell access; all verification is by
reading primary sources.

---

## 1. Skill inventory

**Contents.** `.claude/skills/` contains exactly one skill directory (`logging-design/`), which
contains exactly one file: `SKILL.md` (12.9 KB, 280 lines). No bundled scripts/references.

**Frontmatter** (`.claude/skills/logging-design/SKILL.md:1-10`):

- `name: logging-design`
- `description: >` — *"Methodology for designing and implementing structured logging support in
  any project. Use when working on logging, log entries, logger design, or structured logging —
  covers canonical line format, type taxonomy, secret redaction, timestamps, correlation IDs, PII
  handling, never-throws semantics, and clarity principles. Available to drpe, leaddev, middev,
  validator, docworm. Triggers on: logging, log, log entry, logger, structured logging."*

The body is language-agnostic reference material: canonical log-line format, ERR/WRN/MSG/VRB
taxonomy, secret-redaction denylist, PII handling, never-throws rule, review checklist. It is a
**reference skill** (read on demand), not an agent protocol.

**It is unreferenced by any packaging/install path.** Evidence (exhaustive over every file that
governs packaging, install, and validation):

| Consumer | Evidence | `logging-design` / `.claude` referenced? |
|---|---|---|
| Marketplace catalog | `.omp-plugin/marketplace.json:13` — "10-agent orchestrator roster + **11 skills**"; no `skills[]` field exists | No |
| Plugin A npm packaging | `package.json:7-11` — `files: ["src", "rules", …]` | No |
| Structural validator | `scripts/validate-plugins.sh:119-128` (scans only `plugins/agents/skills/*/`), `:219` (counts only `plugins/agents/skills`) | No |
| One-line installer | `elon_ko.sh:220-261` (`deploy_scaffold` writes only `AGENTS.md`, `PROTO.md`, `.omp/config.example.yml`); no other file-deployment code in all 750 lines | No |
| Docs | `README.md:20` and `.DEVREADME.md:172-173` enumerate the 11 shipped skills — `logging-design` absent | No |
| Changelog | `CHANGELOG.md:12-143` (v2.2.0–v2.8.0, the era the file dates from, ~2 months ago) | No |
| Gitignore | `.gitignore:1-6` does **not** ignore `.claude/` — so it *is* committed and present in the marketplace clone | (context) |

**One premise correction (important nuance).** The user's statement "the `.claude` folder is not
installed or used anywhere" is true of *elon-ko's installation*, but **omp itself does read it
when cwd is inside this repo**: omp's `claude` skill provider loads project-level
`.claude/skills/` by default (`omp://skills.md`, §Source toggles: "Foreign user-level providers
are opt-in through `enabledProviders`; their **project roots still load by default**"). Proof by
elimination on this machine: the current session's system-prompt skill list **does** contain
`logging-design`, while every other possible source was checked and lacks it — the installed
plugin cache (11 skills, no `logging-design`), `~/.agents/skills/` (the user's 45-skill pack —
no `logging-design`), `~/.omp/agent/` (no `skills/`, no `managed-skills/`, no `skills.lock.json`),
and the repo (no `.omp/skills/`, no `.github/skills/`). The one-line description shown in the
prompt list ("Use for logging, logger design, or structured logging work only.") differs
textually from the frontmatter — [INFERENCE] omp condenses descriptions for the prompt listing
(there is a `skill-descriptions.db` under `~/.omp/agent/`); the *source* is confirmed regardless.

So today the skill works **only in clones of elon-ko itself** and only by omp's courtesy scan of
a foreign layout — invisible to every other project, which is exactly the user's complaint.

---

## 2. Installation map — how elon-ko ships today

Two plugins from one tree (`README.md:15-24`, `.DEVREADME.md:10-19`):

| Plugin | Mechanism | Manifest | Payload |
|---|---|---|---|
| **A: `elon-ko-gate`** | extension-package (npm-style) | `package.json:21-29` (`omp.extensions`) | TS extensions + `rules/` |
| **B: `elon-ko-agents`** | marketplace | `.omp-plugin/marketplace.json` (`pluginRoot: "./plugins"`, source `"./agents"`) | 10 agent defs + 11 skills, pure markdown |

**Install flow** (`elon_ko.sh`, verified against live state):

1. `omp plugin marketplace remove/add rokicool/elon-ko` + `update` — `elon_ko.sh:651-665`
   → registry `~/.omp/marketplaces.json:12-19`, clone at
   `~/.omp/plugins/cache/marketplaces/elon-ko/` (full repo clone, including `.claude/` — but
   nothing reads it there).
2. `omp plugin install github:rokicool/elon-ko#v2.8.0 --force` (Plugin A, tag-pinned) —
   `elon_ko.sh:674-677` → `~/.omp/plugins/package.json:4-6` + `omp-plugins.lock.json:8-12`.
3. `omp plugin install elon-ko-agents@elon-ko --force` (Plugin B, tracks latest) —
   `elon_ko.sh:680-682` → `~/.omp/plugins/installed_plugins.json:4-12`: **`scope: "user"`**,
   `installPath: ~/.omp/plugins/cache/plugins/elon-ko___elon-ko-agents___2.8.0`.
   The installed tree contains **only** `agents/*.md` (10) + `skills/<name>/SKILL.md` (11) —
   the `plugins/agents` subtree copied verbatim (verified by directory listing). `.claude/` does
   not make it into the installed plugin.
4. `deploy_scaffold` writes `AGENTS.md` + `PROTO.md` (+ optional `config.example.yml`) into
   `<cwd>` — `elon_ko.sh:220-261`. This is the only file-copying the installer ever does.

**Key distribution facts:** marketplace `agents[]`/`count` are display metadata only — runtime
discovery is a filesystem scan of the installed plugin tree (resolved previously in IDEA-003,
`.app/IDEAS.md:53`; reconfirmed by `omp://marketplace.md` §Plugin entry fields: "Agent metadata;
preserved but **not consumed**"). User scope = "available in all projects"
(`omp://marketplace.md` §Scopes). Update path: catalog refresh (`marketplace.autoUpdate`,
default `notify`, 24 h) + `omp plugin upgrade` / re-running `elon_ko.sh` (force-reinstalls
Plugin B at latest).

---

## 3. Omp skill-loading mechanism (verified)

How a skill becomes callable via `skill://<name>` by default in any project
(`omp://skills.md`, corroborated by live state):

1. **Layout convention.** Skills are discovered as **one level under a `skills/` root**:
   `<root>/skills/<skill-name>/SKILL.md` (non-recursive). A marketplace plugin directory "ships
   its content in conventional locations … `skills/<name>/SKILL.md` ← skills"
   (`omp://skills/authoring-marketplaces.md` §Plugin structure). **No registration beyond
   placing the directory** — confirmed independently by `.DEVREADME.md:172-177` ("loaded by
   omp's skills provider from the plugin's `skills/` tree and resolved as `skill://<name>`. No
   registration beyond placing the directory is needed") and by the live install (no
   per-skill manifest entries anywhere; the 11 skills resolve purely from the tree).
2. **Frontmatter contract.** `name` + `description` required for omp plugin skills
   (`omp://skills.md` §SKILL.md frontmatter: `requireDescription: true` for omp-plugins-family
   providers). `logging-design` already satisfies this; `name` matches the directory name.
3. **User-scoped install → every project.** "user (default) — available in all projects"
   (`omp://marketplace.md` §Scopes) — verified live: `installed_plugins.json` shows
   `scope: "user"`, and the elon-ko skills are listed in this session from the plugin cache.
4. **System-prompt auto-listing.** At startup omp discovers all skills and puts
   *name + description* metadata into the system prompt whenever a `readsSkillUris` tool is
   active (`read` is the compatibility fallback) — i.e., effectively every session
   (`omp://skills.md` §System prompt exposure). **Subagents get the same list**: "Task tool
   subagents receive the session's discovered/provided skills list via normal session creation."
   Content loads on demand via `read skill://<name>` (or `/skill:<name>`).
5. **Precedence/collisions.** Provider priority: native `.omp` (100) > skillshare (95) >
   omp-plugins/installed plugins (90) > claude (80) > agents (70) > … On a same-name collision
   the higher-precedence skill keeps the bare name; identical bodies collapse silently,
   differing bodies get namespaced (`omp://skills.md` §Collision handling). A plugin-bundled
   `logging-design` therefore wins the bare name over any project `.claude/` copy.
6. **Not gated.** Skill discovery is session-level, unrelated to the orchestrator opt-in
   (`.omp/elon.json`) — a shipped skill is listed in every omp session on the machine, gated or
   not. That matches the goal "omp in this or any project should start using this skill by
   default."

**"Used by default" therefore means**: auto-listed with its description in every session's
system prompt (root and subagents), where description-based triggering makes agents read
`skill://logging-design` when a task concerns logging — the same dispatch omp already applies to
the 11 existing skills (observed live: `logging-design` is being dispatched on in this very
session from the `.claude` copy). No stronger "always loaded" mechanism is needed or idiomatic
(`alwaysApply` exists as frontmatter metadata but "globs and alwaysApply are metadata here, not
automatic skill-invocation controls").

---

## 4. Solution options

### Option A — Promote into Plugin B's skills tree (repo convention; recommended)

**Changes:**
1. Move `.claude/skills/logging-design/SKILL.md` → `plugins/agents/skills/logging-design/SKILL.md`.
2. `.omp-plugin/marketplace.json:13`: description "…+ 11 skills." → "…+ **12** skills." —
   **mandatory**: `validate-plugins.sh:219,225` counts skill dirs dynamically and requires the
   description to embed the exact count; CI fails otherwise.
3. Mirror byte-identically into `.agents/skills/logging-design/SKILL.md` (dev-session mirror
   convention, `.DEVREADME.md:164`; validator Step I `:276-283` enforces mirrors only for
   roster skills, but consistency is the repo's stated practice).
4. Delete `.claude/skills/` (git history preserves it). Keeping it creates a divergent duplicate
   in this repo only — omp would collapse identical copies but warn/drift once they differ.
5. Release: CHANGELOG entry + lockstep version bumps per `.DEVREADME.md:250-256` (Wrapper's
   job, out of research scope).

**What is *not* needed** (verified against `validate-plugins.sh` Steps B–I, all roster-driven
from `scaffold/PROTO.md:18-31`): no agent `.md`, no roster line, no `<allowed>`/`<forbidden>`
block (Step G `:239-253` only checks skills of roster agents), no gate/mess `TEAM` change, no
installer change.

**Blast radius:** Plugin B tree + its one-line catalog description. Nothing else.

**Distribution:** rides the existing marketplace flow — catalog `notify`/update → `omp plugin
upgrade elon-ko-agents@elon-ko`, or re-running the one-liner (force-reinstalls latest,
`elon_ko.sh:680-682`). Pre-release pinning works unchanged (tag tarball flow).

**Downsides:** existing installs see it only after update/upgrade/reinstall (standard for every
skill this repo has ever shipped, e.g. the `purecode` hire, `CHANGELOG.md:16`); the
count-in-description invariant is brittle (validator catches drift — by design); the installer's
own summary strings say "10 skills" already (`elon_ko.sh:7,561,564,696,723` — pre-existing
staleness, optional cleanup opportunity).

### Option B — Ship as a Plugin A (extension-package) bundled skill

Add `skills/logging-design/SKILL.md` at the repo root next to `package.json`, and add `"skills"`
to `package.json#files` (`:7-11`). The `omp-plugins` provider loads "skills/ bundled next to
extension packages … or installed plugins under `~/.omp/plugins/node_modules`"
(`omp://skills.md` §providers, priority 90).

- **Blast radius:** Plugin A manifest + npm packaging; Plugin A would ship markdown content for
  the first time.
- **Downsides:** breaks the repo's explicit convention (`.DEVREADME.md:288-289`: "agents/skills
  → Plugin B"); **slower distribution** — Plugin A installs are pinned to an exact release tag
  (`elon_ko.sh:403,676`), so users get the skill only by reinstalling a *new* tag, vs Plugin B
  tracking latest; requires `files` sync discipline. Dominated by Option A on every axis.

### Option C — Installer copies it to omp's user-global skills root (native provider)

`elon_ko.sh` would `mkdir -p ~/.omp/agent/skills && cp -r …` (global mode) with a LOCAL-mode
equivalent under the relocated home; omp's `native` provider (priority 100) lists it everywhere,
even with plugins disabled.

- **Blast radius:** largest — new installer machinery in both modes, plus uninstall
  (`elon_ko.sh:310-360`) must learn to remove it, and updates diverge from the marketplace
  lifecycle (a plugin upgrade would no longer refresh the copied skill).
- **Downsides:** invents a third content channel the repo has never used; the skill escapes
  plugin enable/disable/uninstall semantics entirely. Contrary to "prefer existing repo
  conventions." Listed for completeness because the user asked about user-global vs
  plugin-bundled.

**User-global vs plugin-bundled.** omp supports both; **plugin-bundled fits "install once via
elon-ko, available everywhere" better**: user-scoped plugin install is already "available in all
projects" (verified), while the plugin lifecycle (upgrade/uninstall/enable/disable,
`omp-plugins.lock.json`) manages the skill atomically with the rest of the distribution — a
user-global copy would survive `elon_ko.sh uninstall` and drift from the shipped version.

---

## 5. Recommendation

**Option A.** Justification, all evidence-based:

1. **It is the repo's existing, proven mechanism** — the 11 live skills ship exactly this way
   and are resolvable in this session from the installed cache; `.DEVREADME.md:170-177`
   documents placement as the only registration step.
2. **Zero new machinery** — no gate, no roster, no installer, no TS changes; one file move, one
   description-count edit, one mirror, one deletion.
3. **Satisfies every constraint** — omp-native (no `.claude/` at runtime), user-scoped so it
   works in any project after install, auto-listed for root sessions and subagents alike, and
   precedence-protected against name collisions (priority 90 beats foreign 80/70 providers).
4. **Validator-enforced consistency** — Step E catches the count drift that is this option's
   only real risk.

Implementation note for SPEC: the frontmatter's "Available to drpe, leaddev, middev, validator,
docworm. Triggers on: …" is Claude-Code-style dispatch prose; in omp the whole `description`
drives listing/matching, so it can be kept as-is (harmless, informative) or trimmed — either
works, no functional difference verified.

## Alternative interpretations

- **"Ship it as a rule (`rules/`) or APPEND_SYSTEM injection"** — considered and rejected: the
  skill is 12.9 KB of on-demand reference material; `alwaysApply` rules are re-attached every
  turn (`.DEVREADME.md:85-87`) and would burn context in *every* session regardless of topic —
  exactly what skills' lazy `skill://` loading exists to avoid.
- **"Wait — doesn't omp already load `.claude/skills`?"** — yes, at *project* scope only
  (§1 premise correction). That explains why the skill seems to work in this repo while being
  uninstallable elsewhere; it does not change the solution.

## Impact Assessment

- **Verdict:** CLEAR
- **Explanation:** One well-supported distribution path (Option A) verified end-to-end from
  repo manifests, validator logic, the installer, omp's own docs, and the live installed state.
  One premise correction: `.claude/` is not read by elon-ko's install, but omp's claude provider
  does auto-load project `.claude/skills` — the skill currently works only inside clones of this
  repo. No open questions block SPEC; the only judgment call (keep vs delete `.claude/`) is
  resolved by the drift-avoidance argument and is trivially reversible via git.
- **Recommendation:** PROCEED to SPEC with Option A.

## Sources Consulted

- `.claude/skills/logging-design/SKILL.md` (read in full, 280 lines) — skill content + frontmatter.
- `.omp-plugin/marketplace.json`; `package.json`; `scripts/validate-plugins.sh` (all 296 lines);
  `elon_ko.sh` (all 750 lines); `scaffold/PROTO.md:1-143` (roster block :18-31);
  `scaffold/AGENTS.md:1-90`; `README.md` (all 389 lines); `.DEVREADME.md` (all 320 lines);
  `CHANGELOG.md:1-143`; `.gitignore`; `.app/IDEAS.md` (IDEA-003 resolution :53).
- Directory listings: `plugins/agents/{skills,agents}`, `.agents/skills`, `.omp/agents`,
  `.claude/skills`.
- Live installed state: `~/.omp/marketplaces.json`, `~/.omp/plugins/installed_plugins.json`,
  `~/.omp/plugins/omp-plugins.lock.json`, `~/.omp/plugins/package.json`,
  `~/.omp/elon-ko.install.json`, `~/.omp/plugins/cache/plugins/elon-ko___elon-ko-agents___2.8.0/`,
  `~/.omp/plugins/cache/marketplaces/elon-ko/`, `~/.omp/agent/`, `~/.agents/skills/` (absence
  checks for alternate skill sources).
- `omp://skills.md` (discovery pipeline, providers/precedence, layout, system-prompt exposure,
  collision handling, `skill://` protocol) — primary mechanism doc.
- `omp://marketplace.md` (scopes, on-disk layout, plugin content kinds, update/upgrade flow);
  `omp://skills/authoring-marketplaces.md` (plugin structure convention, install commands);
  `omp://tools/manage_skill.md` (managed-skills root — ruled out as a channel).
