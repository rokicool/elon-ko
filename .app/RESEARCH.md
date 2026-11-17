# Research Report — Workflow 3: omp-Native Agent & Skill Discovery (NFR2 / E2)

## Scope

Verified how oh-my-pi (omp) natively discovers **task agents** and **skills** in a consumer
repo (not this repo), to close REQ.md flag **NFR2** ("consumption relies on omp's native
agent/skill discovery of `.omp/agents/` + `.agents/skills/` … must be confirmed in RESEARCH")
and error case **E2** ("if omp does not natively read these paths in consumer repos, FR8
instructions would be wrong"). Questions covered: exact paths and precedence, frontmatter
contract (`name`/`description`/`tools`/`spawns`/`model`), config/registration steps required,
`skill://` resolution for local skills, and transition behavior while the old plugin is still
installed. Closes with recommended README copy-instruction wording.

Sources: the locally installed omp's bundled harness docs (read via `omp://` internal URLs —
`task-agent-discovery.md`, `skills.md`, `config-usage.md`, `context-files.md`, `settings.md`,
`cli-reference.md`), cross-checked against the public upstream docs at
`github.com/can1357/oh-my-pi` (fetched 2026-11-17; the public `docs/task-agent-discovery.md`
matches the installed copy verbatim on every claim cited below). No web-claim below rests on
a search snippet alone.

---

## Findings

### Dimension 1: Agent discovery — `.omp/agents/*.md` is native, no registration

- **Finding: omp reads project agents from `.omp/agents/*.md` and user agents from
  `~/.omp/agent/agents/*.md` natively.** Verbatim: "OMP discovers user agents from
  `~/.omp/agent/agents/*.md` and project agents from `.omp/agents/*.md`."
  (`omp://task-agent-discovery.md` §Role-backed custom agents; identical text at
  https://github.com/can1357/oh-my-pi/blob/main/docs/task-agent-discovery.md).
  Note the user-scope path is `~/.omp/agent/` (singular), not `~/.omp/`.
  **Confidence: High** (installed docs + public docs, verbatim match).

- **Finding: precedence is project > user > extension packages > Claude plugins > bundled,
  first-wins by exact name.** Discovery order (`§Filesystem and plugin discovery`):
  1. nearest project `.omp/agents` from `findAllNearestProjectConfigDirs("agents", cwd)`
     (first `.omp` hit walking up from cwd only), 2. user `~/.omp/agent/agents`,
  3. `<extension-root>/agents` of enabled extension packages (the OLD elon-ko-agents plugin
  route), 4. Claude marketplace plugin roots, 5. bundled agents. Dedup: "first-wins dedup by
  exact `agent.name` … Project `.omp` overrides user `.omp`. … Non-bundled agents override
  bundled agents with the same name." Name matching is case-sensitive; files load in
  lexicographic filename order within a directory. **Confidence: High**.

- **Finding: the frontmatter contract is exactly the repo's — `name` + `description` required,
  `tools`/`spawns`/`model` optional.** `§Agent definition shape`: required `name`,
  `description` (the markdown body becomes `systemPrompt`); optional `tools` (CSV or array;
  omitted/YAML-null = default built-in toolset; `tools: []` = no built-ins), `spawns`
  (`*`, CSV, or array; legacy fallback: missing `spawns` + `tools` containing `task` ⇒ `*`),
  `model` (one selector, CSV, or array — prioritized list, tried in order after role-alias
  expansion), plus `thinking-level`, `output`, `blocking`, `structured`, `autoloadSkills`,
  `read-summarize`, `prewalk`, `advisor`. Reserved names: `main`, `sub` (none of the 11
  elon-ko agents use them). One invalid file logs a warning and is skipped — it does not
  abort discovery of the other files. **Confidence: High**.

- **Finding: no config or registration step exists — only opt-outs.** Placing the `.md` file
  in the directory IS the registration. Agent files added mid-session resolve without
  restart: "Task/eval preflight reloads the current global, project, and explicit overlay
  settings before rediscovering agents" (`§Role-backed custom agents`). Opt-outs:
  `task.disabledAgents`, parent spawn policy, `--no-extensions`. Optional (not required):
  `model:` role aliases like `@smol` resolve through `modelRoles` in
  `~/.omp/agent/config.yml` or `<repo>/.omp/config.yml`. **Confidence: High**.

- **Finding: cross-harness agent roots are intentionally NOT read.** "Direct cross-harness
  roots such as `.claude/agents`, `.codex/agents`, and `.gemini/agents` are intentionally
  skipped — their frontmatter schema is not the OMP task-agent contract." `.omp/agents` is
  the only filesystem agent path omp consumes. **Confidence: High**.

### Dimension 2: Skill discovery — `.agents/skills/<name>/SKILL.md` is on by default

- **Finding: the `agents` provider discovers `.agent[s]/skills` at priority 70.** Registered
  skill providers (`omp://skills.md` §Built-in skill providers): `native` (100, `.omp`),
  `skillshare` (95), `omp-plugins` (90, installed plugins), `claude` (80), `agent-plugins`
  (75), then priority-70 group including **`agents`** (`.agent[s]/skills`), `codex`,
  `claude-plugins`; then `opencode` (55), `github` (30), `omp-managed` (5). Layout is
  strictly one level: `<skills-root>/<skill-name>/SKILL.md`, **non-recursive** —
  `.agents/skills/<name>/SKILL.md` matches exactly; nested `skills/<group>/<name>/` would
  NOT be found. **Confidence: High**.

- **Finding: `.agents` loads by default at BOTH project and user scope — no
  `enabledProviders` entry, no config.** Three independent statements:
  1. `omp://context-files.md`: "Foreign **user-level** sources (`claude`, `codex`, `gemini`,
     `opencode`, `github` …) are opt-in through `enabledProviders`; their project-level files
     remain enabled by default. **Native and `.agent` / `.agents` user sources are enabled by
     default.**"
  2. `omp://settings.md` §Provider and source disabling: "Project roots remain enabled.
     Native OMP and `.agents` roots—including native marketplace plugins—are not foreign and
     do not require an entry."
  3. `omp://skills.md`: the `agents` provider "has its own `enableAgentsUser`/
     `enableAgentsProject` toggles — disabling Claude/Codex/Pi does **not** turn it off."
  User-scope root: `~/.agents/skills/` (provider user bases `~/.agent/` and `~/.agents/`,
  `context-files.md` provider table). Project-scope root: `<repo>/.agents/skills/`.
  **Confidence: High** (three corroborating doc sections).

- **Finding: `description` is not required by the `agents` provider.** "the
  claude/codex/agents/opencode/claude-plugins providers can load skills without description"
  (`omp://skills.md` §SKILL.md frontmatter; `requireDescription: true` applies to native
  `.omp`, omp-plugins, github, and custom dirs). All 13 elon-ko skills carry `name` +
  `description`, so they satisfy even the stricter providers. **Confidence: High**.

- **Finding: collision behavior — identical copies collapse silently; differing copies get
  namespaced.** "drops a later same-named skill silently when its body is identical and its
  parsed frontmatter is deeply equal to a loaded one (the same skill installed twice …)";
  differing same-name skills: higher-precedence skill keeps the bare name, others become
  `<namespace>/<name>` (`omp://skills.md` §Collision and duplicate handling).
  **Transition consequence (E1/E2-relevant):** while the old `elon-ko-agents` plugin is still
  installed AND a consumer has copied the byte-identical `.agents/skills/` tree, the
  omp-plugins copy (90) holds the bare names and the identical `.agents` copies (70) collapse
  without warnings; after `omp plugin uninstall elon-ko-agents`, the `.agents` copies serve
  the same bare names — `skill://<name>` resolution is uninterrupted. **Confidence: High**
  for the collapse rule (documented); the transition sequencing is direct application.

- **Minor nuance (flagged, low impact):** whether the `agents` provider walks ANCESTOR
  directories for project skills (the way its context files do, and the way native
  `.omp/skills` does: "`<ancestor>/.omp/skills` for each ancestor from the current working
  directory up to the repo root/home boundary", `omp://config-usage.md` §Native provider) is
  not explicitly documented for skills under `.agents/skills`. Copying at the repo root
  works regardless. **Confidence: Medium** (absence of explicit doc statement).

### Dimension 3: `skill://` resolution for local skills

- **Finding: `skill://<name>` resolves a locally discovered skill to its SKILL.md;
  `skill://<name>/<relative-path>` resolves inside the skill directory.** Exact-name match;
  guards reject absolute paths, `..` traversal, and any resolution escaping the skill's
  baseDir; directories return listings (`omp://skills.md` §`skill://` URL behavior,
  implemented in `src/internal-urls/skill-protocol.ts`). **Confidence: High**.

- **Finding: skills added after session start still resolve.** "a name no loaded skill owns
  rediscovers the main session's skills before failing, so a skill created or installed
  after the session started resolves (and joins the session's skill list and system prompt);
  such misses start at most one rediscovery every 2 seconds" (subagents' inherited lists gain
  no new skills). Hidden skills (`hide: true` / `skills.manualSkills`) stay reachable via
  `skill://` and `/skill:<name>`. **Confidence: High**.

- **Finding: system-prompt listing is automatic.** Discovered skills' name + description go
  into the system prompt whenever a `readsSkillUris` tool is active (`read` is the
  compatibility fallback); task subagents receive the session's skill list via normal session
  creation. Content loads on demand — no eager context cost. **Confidence: High**.

- **Finding (NFR3 dogfood continuity):** today this repo's sessions resolve `skill://…`
  through the installed plugin cache
  (`~/.omp/plugins/cache/plugins/elon-ko___elon-ko-agents___2.9.0/skills/<name>/SKILL.md`,
  omp-plugins provider). Post-v3, after uninstalling the plugin, the same names resolve from
  the repo's `.agents/skills/<name>/SKILL.md` via the `agents` provider — byte-identical
  content (REQ AC2 parity), so no path break in `skill://` addressing. The agent roster
  shifts likewise: `<plugin-root>/agents` → project `.omp/agents/`. **Confidence: High**
  (mechanism documented; parity is REQ AC2's to enforce).

### Dimension 4: Config / registration requirements (direct answer)

**None required for either path in a consumer repo.** Drop files into place and start omp:

| Content | Project scope (one repo) | User scope (all repos) | Config needed |
|---|---|---|---|
| Agents | `<repo>/.omp/agents/*.md` | `~/.omp/agent/agents/*.md` | none (opt: `modelRoles` for `model:` aliases) |
| Skills | `<repo>/.agents/skills/<name>/SKILL.md` | `~/.agents/skills/<name>/SKILL.md` | none |

Only opt-outs exist: `disabledProviders: [agents]` or `[native]`, `skills.enabled: false` /
`--no-skills`, `skills.ignoredSkills`, `task.disabledAgents`. Verification commands: `omp read
skill://<name>` from the shell ("Show what the read tool will return for a path, URL, or
internal URI", `omp://cli-reference.md` subcommand table); in-session `/agents` hub / Agent
Hub (`Alt+A`) lists agents; `omp skill list --json` reports discovered skills with `hide`
status (`omp://skills.md` §Manual-only skills). **Confidence: High**.

---

## Recommendations (README copy-instructions wording, for FR8)

1. **Word the copy instructions exactly around the two canonical path pairs, project scope
   first.** Suggested copy:
   - *Agents:* "Copy the files from `.omp/agents/` into `<your-repo>/.omp/agents/` (this repo
     only) or `~/.omp/agent/agents/` (every repo)."
   - *Skills:* "Copy the directories from `.agents/skills/` into `<your-repo>/.agents/skills/`
     or `~/.agents/skills/`."
   - "No configuration, marketplace, or plugin installation is needed — omp discovers both
     locations automatically at startup."
   Rationale: Findings 1.1, 2.2, 4. The paths are verbatim omp contract paths; note the
   asymmetric user-scope dirs (`~/.omp/agent/agents/` vs `~/.agents/skills/`) — a README that
   hand-waves "copy to `~/.omp/`" would send users to a wrong path omp never reads.
2. **Add a one-line verification step.** "Run `omp read skill://elon` in the target repo (or
   open the `/agents` hub in a session) to confirm discovery." Rationale: Finding 4 — gives
   consumers a falsifiable check tied to documented commands.
3. **State the layout constraints in one sentence.** "Keep each skill exactly one level under
   `skills/` (`.agents/skills/<name>/SKILL.md`); deeper nesting is not discovered, and agent
   names must be unique (project overrides user; first match wins)." Rationale: Findings 2.1,
   1.2.
4. **In the migration section, sequence copy-before-uninstall as the safe path.** "Copy the
   directories first, then run `omp plugin uninstall elon-ko-gate elon-ko-agents` — identical
   copies are collapsed silently, so skills stay continuously available under the same
   `skill://` names." Rationale: Finding 2.4 — turns E1's "old plugins persist locally" from a
   footgun into a no-op transition.
5. **Do not advertise `.omp/skills/` as the copy target.** It also works (native provider,
   priority 100, requires `description` — all 13 pass), but the repo ships the `.agents/skills/`
   layout; two advertised targets double the support surface for zero benefit. Rationale:
   Findings 2.1, 2.3 (Boring-design: one canonical instruction).

## Impact Assessment

- **Verdict: CLEAR**
- **Affected Requirements:** NFR2 and E2 are **resolved affirmatively** — omp natively
  discovers `.omp/agents/*.md` (project, nearest `.omp` walking up) and
  `.agents/skills/<name>/SKILL.md` (agents provider, on by default at both scopes), with the
  exact frontmatter contract the repo already uses. FR8's "copy-based consumption
  instructions (what a consumer copies where, per omp native discovery — verified in
  RESEARCH)" now has its verified basis; the E2 fallback (documenting copy targets per omp
  docs) is not needed as a fallback — it IS the happy path. FR11's frontmatter checks
  (`name`/`description`/`tools`) align with omp's contract (name+description required; tools
  optional but present in all 11 files). No requirement is contradicted or materially
  expanded.
- **Explanation:** All load-bearing claims are corroborated by the installed omp's own docs
  plus the public upstream repo (verbatim match on the agent-discovery doc). The only
  Medium-confidence nuance (ancestor walk-up for `.agents` project skills) does not affect
  the README instructions, which target the repo root.
- **Recommendation: PROCEED to SPEC.** Feed Recommendations 1–5 into the README (FR8) and
  migration (FR8/FR10) wording.

## Sources Consulted

- `omp://task-agent-discovery.md` (installed omp harness docs) — agent definition shape,
  frontmatter contract, discovery roots and precedence, merge/collision rules, invalid-file
  behavior, mid-session re-discovery, cross-harness root exclusion. Public mirror verified
  identical: https://github.com/can1357/oh-my-pi/blob/main/docs/task-agent-discovery.md
  (fetched 2026-11-17).
- `omp://skills.md` — skill provider registry and priorities, `.agent[s]/skills` provider,
  one-level layout, frontmatter requirements per provider, source toggles, collision/dedup
  rules, `skill://` protocol, rediscovery-on-miss, system-prompt exposure, manualSkills.
  Public: https://github.com/can1357/oh-my-pi/blob/main/docs/skills.md ; rendered site
  https://omp.sh/docs/skills
- `omp://config-usage.md` — canonical roots (`.omp` first), user agent dir, native provider
  scope-specific loading (`<ancestor>/.omp/skills` walk, `~/.omp/agent/skills`), provider
  priority table, capability dedup keys.
- `omp://context-files.md` — provider table incl. `agents` (`.agent/`, `.agents/`, user bases
  `~/.agent/` + `~/.agents/`), "Native and `.agent` / `.agents` user sources are enabled by
  default".
- `omp://settings.md` — "Native OMP and `.agents` roots … are not foreign and do not require
  an entry"; opt-out switches; `skills.*` group.
- `omp://cli-reference.md` — `omp read` (internal-URI verification), `omp agents`, `omp skill`
  subcommands; `--no-skills` flag.
- Web search corroboration: omp.sh / github.com/can1357/oh-my-pi doc locations (no claim
  rests on snippets; each cited doc was read in full or in the cited section).
