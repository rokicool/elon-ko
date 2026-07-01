# RESEARCH — Where must AGENTS.md / APPEND_SYSTEM.md / PROTO.md / RULES.md live to be load-bearing?

> **Type:** Mechanism / placement-model study (NEW research question, separate from the
> PI_CONFIG_DIR install-mode study in `.app/RESEARCH.md`). Written to
> `.app/RESEARCH-SCAFFOLD.md` to avoid clobbering the install-mode research SPEC depends on.
> **Investigator:** DrPe · **Date:** 2026-07-01.
> **Upstream omp source:** `@oh-my-pi/pi-coding-agent@16.0.5`, vendored at
> `node_modules/@oh-my-pi/pi-coding-agent/` (repo `can1357/oh-my-pi`, the exact source the
> `omp` binary is built from). **All file:line cites below are from this vendored source
> unless tagged `[repo]` (= the elon-ko repo itself) or `[link]`.**
> **Access date for every upstream source: 2026-07-01.**
> **Method note / honesty caveat:** I read the *runtime source itself* (stronger than docs:
> it is the code the binary executes). I did **not** perform a live `strace`/`dtruss`
> trace — that requires `bash`, which is outside DrPe's tool policy. Every load-path claim
> below is therefore source-grounded (the exact resolver the binary runs), not
> empirically-observed-at-runtime. Flagged `[INFERENCE]` where a claim rests on inference
> rather than a directly-read resolver.

---

## Scope

Definitively answer, for each of `AGENTS.md`, `APPEND_SYSTEM.md`, `PROTO.md`, `RULES.md`:
(1) whether omp auto-loads that **file type** from a plugin dir and its canonical location;
(2) whether omp loads plugin content from `cache/` vs an `installed/`/`node_modules` location;
(3) whether the marketplace.json `agents[]` field is load-bearing (IDEA-003); (4) the exact
physical path for GLOBAL mode and LOCAL mode (given the finalized PI_CONFIG_DIR+XDG_DATA_HOME
dual-knob); (5) root cause; (6) the concrete distribution-system fix per file; plus a
GO/NO-GO on whether `elon_ko.sh` can achieve load-bearing placement for all four.

Sources consulted (read in full, not snippet-cited): omp `system-prompt.ts`,
`workspace-tree.ts`, `discovery/agents-md.ts`, `discovery/agents.ts`, `discovery/omp-plugins.ts`,
`discovery/omp-extension-roots.ts`, `discovery/plugin-dir-roots.ts`, `discovery/helpers.ts`,
`discovery/index.ts`, `task/discovery.ts`, `extensibility/plugins/loader.ts`,
`extensibility/plugins/installer.ts`, `extensibility/plugins/marketplace/{registry,types,
manager,cache}.ts`; plus the in-repo `.omp-plugin/marketplace.json` `[repo]`,
`package.json` `[repo]`, `src/enforce-orchestrator.ts` `[repo]`, `scaffold/*` `[repo]`,
`.app/RESEARCH.md` (prior install-mode study), `.app/SPEC.md`, `.app/IDEAS.md` (IDEA-003).

---

## TL;DR — the placement model in one screen

| File | omp auto-loads it? | Canonical location omp reads | Loadable from a PLUGIN dir? | Status today |
|---|---|---|---|---|
| **AGENTS.md** | **YES** (ContextFile) | `<project>/AGENTS.md` walked up from cwd; also `<ancestor>/.agent[s]/AGENTS.md` | **NO** — omp never scans plugin dirs for it | **Broken** — only in `cache/…/scaffold/`; never at `<cwd>/` |
| **APPEND_SYSTEM.md** | **NO** omp built-in — loaded **only by Plugin A's extension** | override `<cwd>/.omp/APPEND_SYSTEM.md`; else bundled default shipped inside Plugin A | NO (it is *Plugin A's* mechanism, not a generic plugin file) | **Already load-bearing** via Plugin A's bundled default |
| **PROTO.md** | **NO** auto-load of any kind | none — it is a read-on-demand project doc (referenced "see PROTO.md") | NO | N/A — never omp-loaded; copy only so refs resolve |
| **RULES.md** | **NO** for a root-level `RULES.md`. omp loads *rules* only from `<root>/rules/*.md` or `.agent[s]/rules/*.md` | (none for a bare root file) | NO (a `rules/` **dir** yes; a root `RULES.md` file no) | **Dead file** — no placement makes it load-bearing |

**Cache vs installed:** omp loads plugin **content** from (a) `getPluginsDir()/node_modules/<name>/`
(npm/git installs — Plugin A) and (b) the **plugin cache** `getPluginsDir()/cache/plugins/<mkt>___<name>___<ver>/`
recorded as `installPath` in `installed_plugins.json` (marketplace installs — Plugin B). The
**marketplace cache** `getPluginsDir()/cache/marketplaces/<mkt>/` (where `scaffold/` actually
sits) is **download staging**: omp reads **only `marketplace.json`** from it and **never**
loads `scaffold/` (or any non-catalog file) at runtime.

**Root cause:** (b) installer gap + (d) omp design. `elon_ko.sh` installs the *plugins*
(correctly — all hard enforcement + agents are already load-bearing) but never deploys the
*project-context* steering files to the consuming project's `<cwd>`. And omp **by design**
does not auto-load AGENTS.md/APPEND_SYSTEM/PROTO/RULES.md from a plugin dir — they are
project-author files. Nothing in `scaffold/` can become load-bearing by sitting in a cache.

**IDEA-003:** `agents[]` is catalog **metadata only** — not load-bearing. `count` is **not
an omp field at all**. Agents register by filesystem presence (`<installPath>/agents/*.md`),
not by a manifest field.

**GO/NO-GO:** GO for AGENTS.md (installer copy → `<cwd>/`); APPEND_SYSTEM.md already
load-bearing (override optional); PROTO.md doc-only (copy for ref-resolution); **NO-GO for
RULES.md via installer placement alone** — it needs a packaging decision (delete, or fold
into Plugin A's `rules/` as an always-apply rule).

---

## Findings

### F1. omp's discovery model — three registries, none of them "scan a plugin for AGENTS.md"

omp assembles context/agents/rules/skills via a **capability-provider** registry
(`discovery/index.ts:7-39`). The providers relevant here:

| Provider (`discovery/*`) | What it loads | Where it scans |
|---|---|---|
| `agents-md` (`agents-md.ts`) | standalone `AGENTS.md` (ContextFile) | **walks UP from `ctx.cwd`** to repo-root/home (`agents-md.ts:26-56`) |
| `agents` ("standard", `agents.ts`) | skills/rules/prompts/commands/context/system-prompt | `.agent/` & `.agents/` dirs, user home + project walk-up (`agents.ts:29,46-61`) |
| `omp-plugins` (`omp-plugins.ts`) | skills/hooks/tools/commands/**rules**/prompts/.mcp.json "inside extension packages" | extension-package roots (CLI, settings, **installed plugins**) — see F5 |
| `claude-plugins` (`claude-plugins.ts`) | skills/slash-commands/hooks/tools/mcp | Claude/OMP plugin roots from `installed_plugins.json` |
| (subagent defs) `task/discovery.ts` | agent **definitions** (`tools:`/`spawns:` .md) | `.omp/agent/agents/`, `.omp/agents/`, `<installPath>/agents/` — see F6 |

- **Source:** `discovery/index.ts:22-39`; each provider file's `registerProvider` block.
- **Confidence: High** — read directly from the runtime source.

### F2. AGENTS.md — auto-loaded, but ONLY from the project tree (walk-up from cwd), never from a plugin

The `agents-md` provider is the canonical AGENTS.md loader:

```ts
// discovery/agents-md.ts:21-59
async function loadAgentsMd(ctx) {
  let current = ctx.cwd;
  while (true) {
    const candidate = path.join(current, "AGENTS.md");
    const content = await readFile(candidate);
    if (content !== null) {
      const baseName = parent.split(path.sep).pop() ?? "";
      if (!baseName.startsWith(".")) { items.push({ path: candidate, content, … }); } // skip dot-dirs
    }
    if (current === (ctx.repoRoot ?? ctx.home)) break;
    current = path.dirname(current); …
  }
}
```

A second surface (`agents` provider) also reads `<ancestor>/.agent/AGENTS.md` and
`<ancestor>/.agents/AGENTS.md` (+ `~/.agent|agents/AGENTS.md`) (`agents.ts:181-198`,
`getProjectPathCandidates` `agents.ts:46-61`, `AGENT_DIR_CANDIDATES=[".agent",".agents"]`
`agents.ts:29`).

**Implications:**
- AGENTS.md is discovered by walking **up from the user's working directory**. Its canonical
  home is `<project-root>/AGENTS.md` (or `<ancestor>/.agent[s]/AGENTS.md`).
- **omp NEVER scans a plugin package dir for AGENTS.md.** No provider's scan list includes a
  plugin's `AGENTS.md`. (AGENTS.md is also surfaced into the system prompt via the workspace
  tree native walk, capped at 200 files — `workspace-tree.ts:12-16`, `system-prompt.ts:26` —
  again a scan of **cwd's tree**, not plugins.)
- A `scaffold/AGENTS.md` sitting under `cache/…/scaffold/` is therefore invisible to omp at
  runtime. The consuming project needs `AGENTS.md` at its **own** root.
- **Source:** `discovery/agents-md.ts:21-59`; `discovery/agents.ts:29,46-61,181-198`;
  `workspace-tree.ts:12-16`; `system-prompt.ts:26`.
- **Confidence: High.**

### F3. APPEND_SYSTEM.md — NOT an omp built-in; loaded only by Plugin A's `enforce-orchestrator` extension

omp exposes **no** system-prompt-append API that yields a true system-attributed block
(`enforce-orchestrator.ts [repo]:40-43`: "no oh-my-pi ExtensionAPI call yields a true
system-attributed block; `getSystemPrompt()` is read-only; `appendEntry` is not sent to the
LLM"). APPEND_SYSTEM.md is injected entirely by **Plugin A's own code**:

```ts
// src/enforce-orchestrator.ts [repo]:87-94  (bundled default, read once at load)
const BUNDLED_APPEND_SYSTEM = readFileSync(join(MODULE_DIR, "append-system.default.md"), "utf8");

// src/enforce-orchestrator.ts [repo]:133-151  (session_start)
pi.on("session_start", async (_event, ctx) => {
  let text = BUNDLED_APPEND_SYSTEM;
  const overridePath = join(ctx.cwd, ".omp", "APPEND_SYSTEM.md");     // ← fixed, cwd-relative
  if (existsSync(overridePath)) text = readFileSync(overridePath, "utf8");
  pi.sendMessage({ customType: "elon-ko-gate:append-system", content: text, display:false, attribution:"user" },
                 { deliverAs: "nextTurn", triggerTurn:false });
});
```

**Implications:**
- The override path is **`<cwd>/.omp/APPEND_SYSTEM.md`** — **fixed relative to cwd**, not the
  omp home, so it is identical in GLOBAL and LOCAL mode.
- The **bundled default ships inside Plugin A** (`src/append-system.default.md`, in
  `package.json [repo]:7` `files:["src","rules"]`). It is injected even if no override file
  exists. **APPEND_SYSTEM is therefore already load-bearing with zero copying.**
- `scaffold/APPEND_SYSTEM.md` is just the **source** for an *optional project-local override*.
  Copying it is opt-in customization, not a fix for a defect.
- **Source:** `src/enforce-orchestrator.ts [repo]:36-43,87-94,130-151`; `package.json [repo]:7`.
- **Confidence: High.**

### F4. PROTO.md and root-level RULES.md — NO omp auto-load path

**PROTO.md:** No provider reads a file named `PROTO.md`. omp's auto-loaded project-context
filenames are `AGENTS.md` (F2) and `SYSTEM.md` (`agents.ts:208-230` system-prompt loader;
`system-prompt.ts:310-328` `loadSystemPromptFiles`). PROTO.md is referenced *prose-only*
("see PROTO.md" in AGENTS.md/APPEND_SYSTEM) and read on demand via the `read` tool. It is
never injected into any prompt by omp.

**RULES.md (a bare root file):** omp's **Rule** capability loads `.md`/`.mdc` files with
frontmatter (e.g. `alwaysApply`) ONLY from **directories** named `rules`:
- extension-package roots: `<ext-root>/rules/*.md` (`omp-plugins.ts:92-107`,
  `path.join(root.path, "rules")`)
- `.agent`/`.agents` config dirs: `.agent[s]/rules/*.md` (`agents.ts:88-106`)

A root-level `RULES.md` matches **neither** — it is not in a `rules/` dir and is not named
AGENTS.md/SYSTEM.md. It is a **dead file** as written. (The *actual* always-apply rule is
Plugin A's `rules/ro-definition-of-done.md` — `AGENTS.md [repo]:27` — which **is**
load-bearing via F5's `rules/` scan.)

- **Source:** `discovery/omp-plugins.ts:92-107`; `discovery/agents.ts:88-106`;
  `scaffold/RULES.md [repo]`; `scaffold/AGENTS.md [repo]:27`.
- **Confidence: High** that no provider loads a root `RULES.md` (exhaustive provider list in
  `discovery/index.ts:22-39`). [INFERENCE]: none — directly verified each provider's scan
  target.

### F5. Cache vs installed — two install stores; the marketplace cache is staging-only

omp resolves plugin content from **two** stores depending on install mechanism:

**(a) npm/git install → `node_modules/`** (this is how Plugin A `elon-ko-gate` is installed
via `github:rokicool/elon-ko#…`). `getEnabledPlugins` enumerates
`getPluginsDir()/node_modules/<name>/`:

```ts
// extensibility/plugins/loader.ts:65-140 (abridged)
const nodeModulesPath = getPluginsNodeModules(home);            // <plugins>/node_modules
for (const name of names) {
  const pluginPkg = await Bun.file(path.join(nodeModulesPath, name, "package.json")).json();
  const manifest = pluginPkg.omp || pluginPkg.pi;               // ← omp.extensions gate
  …
  plugins.push({ name, path: path.join(nodeModulesPath, name), manifest, … });  // ← install path
}
```

These paths are then surfaced as **extension roots** by `listInstalledPluginRoots`
(`omp-extension-roots.ts:180-189`), which `omp-plugins` scans for the conventional
sub-directories `skills/ hooks/ tools/ commands/ rules/ prompts/ .mcp.json`
(`omp-extension-roots.ts:6-8`; `omp-plugins.ts:36-37`). So **Plugin A's `rules/` dir IS
scanned** → `ro-definition-of-done.md` loads as an always-apply rule. ✅

**(b) marketplace install → plugin cache (`installPath`)** (this is how Plugin B
`elon-ko-agents@elon-ko` is installed). The manager copies **only the `source` dir**
(`./agents` → resolved against `pluginRoot:"./plugins"` → `plugins/agents/`) into the plugin
cache and records that path:

```ts
// extensibility/plugins/marketplace/manager.ts:281-329 (abridged)
const { dir: sourcePath } = await resolvePluginSource(pluginEntry, { marketplaceClonePath, … });
cachePath = await cachePlugin(sourcePath, this.#opts.pluginsCacheDir, marketplace, name, version);
…
const installedEntry = { scope, installPath: cachePath, version, … };   // ← installPath = plugin cache
```

`cachePlugin` copies `sourcePath` → `<pluginsCacheDir>/<mkt>___<name>___<ver>/`
(`marketplace/cache.ts:47-89`, `registry.ts:41-43`). Runtime discovery reads `installPath`
from `installed_plugins.json` (`helpers.ts:895-943`, the **OMP registry is authoritative**,
replacing Claude's) and scans its `agents/` subdir (F6).

**(c) The marketplace cache is staging-only.** `getMarketplacesCacheDir() =
<plugins>/cache/marketplaces` (`registry.ts:37-39`). `addMarketplace` clones the whole repo
there and persists **only** `marketplace.json` as `catalogPath`
(`manager.ts:83-106`). All later reads go through `#readCatalog(entry)` → `catalogPath`
(`manager.ts:200-218`). **No code reads any other file** (e.g. `scaffold/*`) from the
marketplace cache. This is exactly the "download staging area omp never reads at runtime"
for anything except the catalog.

**The user's reported path** `.omp/plugins/cache/marketplace/elon-ko/scaffold` is the
**marketplace cache** (`cache/marketplaces/elon-ko/scaffold/`; the user wrote the singular
`marketplace`, the code dir is plural `marketplaces` — `registry.ts:37-39`). The whole elon-ko
repo (incl. `scaffold/`, `plugins/`, `.omp-plugin/`) lives there because it was fetched as the
marketplace source. omp reads `marketplace.json` from it; it ignores `scaffold/`.

- **Source:** `loader.ts:65-140`; `omp-extension-roots.ts:117-189`; `omp-plugins.ts:36-37`;
  `marketplace/manager.ts:83-106,200-218,281-329`; `marketplace/cache.ts:47-89`;
  `marketplace/registry.ts:29-43`; `discovery/helpers.ts:851-943`.
- **Confidence: High** (every step read from the resolver the binary runs).

### F6. Where Plugin B's agent definitions actually load from (confirms team is NOT broken)

Subagent definitions (the `tools:`/`spawns:` `.md` files) load via `discoverAgents`, NOT via
the rule/skill providers:

```ts
// task/discovery.ts:4-11 (doc comment)
// Discovers agent definitions from OMP-native task-agent roots:
//   - ~/.omp/agent/agents/*.md (user-level)
//   - .omp/agents/*.md (project-level)
// Claude Code marketplace plugin agents are discovered separately via the claude-plugins provider.
```

```ts
// task/discovery.ts:84-95 (marketplace plugin agents)
const { roots: pluginRoots } = isProviderEnabled("claude-plugins")
  ? await listClaudePluginRoots(home, resolvedCwd) : { roots: [] };
for (const plugin of sortedPluginRoots) {
  const agentsDir = path.join(plugin.path, "agents");   // ← <installPath>/agents
  orderedDirs.push({ dir: agentsDir, source: … });
}
```

`plugin.path` here is `entry.installPath` from `installed_plugins.json`
(`helpers.ts:882-889,930-937`). So **Plugin B's 8 agents load from
`<installPath>/agents/*.md`** = `…/cache/plugins/elon-ko___elon-ko-agents___<ver>/agents/*.md`.
Because the `source:"./agents"` dir (`plugins/agents/agents/<name>.md`) was copied wholesale
into that cache, **the team agents ARE load-bearing today.** The scaffold bug does not touch
them.

- **Source:** `task/discovery.ts:1-11,61-115`; `discovery/helpers.ts:838-943`.
- **Confidence: High.**

### F7. IDEA-003 — marketplace.json `agents[]` is metadata-only; `count` is not an omp field

`MarketplacePluginEntry` does declare `agents?: string | string[]` (`marketplace/types.ts:91`),
but:

1. **Install never reads it.** `installPlugin` uses only `pluginEntry.name`, `pluginEntry.source`,
   and version (`manager.ts:245,281,291`). It copies the **whole `source` dir** via
   `cachePlugin`, not a filtered set named by `agents[]`. `agents[]` is not dereferenced
   anywhere in the install path.
2. **Runtime never reads it.** Agent registration is by filesystem scan of
   `<installPath>/agents/*.md` (`task/discovery.ts:92-94`), independent of the manifest.

→ **`agents[]` is catalog METADATA** (used for `omp` listing/display). It is **not
load-bearing** for registration; adding/removing entries changes nothing functionally. Safe to
keep for human/CLI readability.

`count` is **not a field** in `MarketplaceCatalog` (`types.ts:65-70`) or
`MarketplacePluginEntry` (`types.ts:77-95`); nothing in omp consumes it. The `hr SKILL.md`
mandate for `agents[] + count` rests on a misunderstanding of omp's registration model (agents
register by file presence, not by declaration/count).

- **Source:** `marketplace/types.ts:65-95`; `marketplace/manager.ts:245-329`;
  `task/discovery.ts:92-94`; `.app/IDEAS.md` (IDEA-003).
- **Confidence: High** that `agents[]` is unused by install+runtime (exhaustive read of both
  paths). [INFERENCE]: `agents[]` *might* be surfaced in a TUI list view (not load-bearing
  either way); I did not read the TUI listing code — but that does not affect the conclusion.

### F8. Exact physical paths — GLOBAL vs LOCAL

omp home resolution (`pi-utils/src/dirs.ts:19-23`, `APP_NAME="omp"`, `CONFIG_DIR_NAME=".omp"`):
`configRoot = path.join(os.homedir(), PI_CONFIG_DIR||".omp")`; the `data` category (plugins)
redirects to `$XDG_DATA_HOME/omp/` when that exists. Per the finalized SPEC §5.4, LOCAL mode
sets `PI_CONFIG_DIR` → configRoot `=$OMP_LOCAL_HOME` **and** `XDG_DATA_HOME=$OMP_LOCAL_HOME`
→ plugins at `$OMP_LOCAL_HOME/omp/plugins/`.

| Artifact | GLOBAL (omp home `~/.omp`) | LOCAL (omp home `$OMP_LOCAL_HOME`) |
|---|---|---|
| **Plugin A** `elon-ko-gate` (npm/git → node_modules; loads gate + `rules/`) | `~/.omp/plugins/node_modules/elon-ko-gate/` | `$OMP_LOCAL_HOME/omp/plugins/node_modules/elon-ko-gate/` |
| **Plugin B** installPath (marketplace; loads `agents/`+`skills/`) | `~/.omp/plugins/cache/plugins/elon-ko___elon-ko-agents___<ver>/` | `$OMP_LOCAL_HOME/omp/plugins/cache/plugins/elon-ko___elon-ko-agents___<ver>/` |
| `installed_plugins.json` (carries installPath) | `~/.omp/plugins/installed_plugins.json` | `$OMP_LOCAL_HOME/omp/plugins/installed_plugins.json` |
| `marketplaces.json` (catalog registry) | `~/.omp/marketplaces.json` | `$OMP_LOCAL_HOME/marketplaces.json` |
| marketplace cache (staging; holds scaffold/) | `~/.omp/plugins/cache/marketplaces/elon-ko/` | `$OMP_LOCAL_HOME/omp/plugins/cache/marketplaces/elon-ko/` |
| **AGENTS.md** (scaffold target) | **`<project-cwd>/AGENTS.md`** | **`<project-cwd>/AGENTS.md`** (cwd-relative, unchanged) |
| **APPEND_SYSTEM.md** override | **`<project-cwd>/.omp/APPEND_SYSTEM.md`** | **`<project-cwd>/.omp/APPEND_SYSTEM.md`** (cwd-relative, unchanged) |
| **PROTO.md** (doc, copy for refs) | `<project-cwd>/PROTO.md` | `<project-cwd>/PROTO.md` |
| **RULES.md** | **no load-bearing root path**; if wanted as a rule → inside Plugin A `rules/` | same |

Key asymmetry: **plugin** paths move with the omp home (GLOBAL→LOCAL), but the four
**scaffold/project-context** files are `<cwd>`-relative and therefore **identical in both
modes** — because omp discovers AGENTS.md by walking from cwd, and the APPEND_SYSTEM override
is hardcoded to `join(ctx.cwd,".omp","APPEND_SYSTEM.md")` (`enforce-orchestrator.ts [repo]:136`).

- **Source:** `pi-utils/src/dirs.ts:19-23`; `.app/RESEARCH.md` F1/F3/F5; `.app/SPEC.md` §3.2/§5.4;
  `enforce-orchestrator.ts [repo]:136`.
- **Confidence: High** for plugin/cache paths (resolvers read directly). **High** for the
  scaffold targets (F2/F3).

### F9. Root cause

The reported defect is **(b) an installer gap compounded by (d) an omp design boundary** —
NOT a packaging bug in the enforcement:

- **The enforcement is NOT broken.** Plugin A ships the gate (`src/enforce-orchestrator.ts`),
  the DoD rule (`rules/ro-definition-of-done.md`), and the bundled APPEND_SYSTEM
  (`src/append-system.default.md`) — all in `package.json [repo]:7` `files:["src","rules"]`,
  all correctly load-bearing via F5 (`rules/` scan) + F3 (bundled injection). Plugin B ships
  the 8 agents + 9 skills, load-bearing via F6 (`<installPath>/agents/`). The user's worry
  "to modify behaviour they must be installed somewhere else" is **half-right**: the *four
  scaffold files* are advisory project docs, not the enforcement.
- **The installer (`elon_ko.sh`) deploys plugins but not project-context files.** It runs
  `omp plugin install` for A and B (correct) but never copies `scaffold/*` into the consuming
  project's `<cwd>/`. So AGENTS.md — the one scaffold file that omp genuinely auto-loads — is
  absent from the project and never enters the context.
- **omp does not auto-load these from plugins by design.** AGENTS.md/APPEND_SYSTEM/PROTO/
  RULES.md are *project-author* files (AGENTS.md/SYSTEM.md live in the project tree;
  APPEND_SYSTEM override lives in `<cwd>/.omp/`). A plugin cache is the wrong place for them;
  no placement *inside a cache* can ever make them load-bearing.

- **Source:** F2–F6; `elon_ko.sh` (install steps install plugins only; no `scaffold` deploy);
  `scaffold/AGENTS.md [repo]:80` ("Prompt-level layers … remain advisory").
- **Confidence: High.**

---

## Recommendations

> Ranked. Each cites its supporting finding(s). "Mechanism" = the omp loader that makes the
> placement load-bearing.

### R1 — AGENTS.md: installer deploys it to `<cwd>/AGENTS.md` (the one real fix)
- **What:** Add an idempotent step to `elon_ko.sh` (both GLOBAL and LOCAL): if `<cwd>/AGENTS.md`
  does not already exist, copy `scaffold/AGENTS.md` → `<cwd>/AGENTS.md`; if it exists, skip
  (never clobber a project's own AGENTS.md).
- **Mechanism:** omp `agents-md` provider walks up from cwd and injects it as a ContextFile
  (F2).
- **Rationale:** AGENTS.md is the ONLY scaffold file omp auto-loads, and it is currently
  missing from every consuming project. This is the actual defect behind the report.
- **Supporting findings:** F2, F9.

### R2 — APPEND_SYSTEM.md: do NOT auto-copy; document the optional override
- **What:** Do **not** have the installer write `<cwd>/.omp/APPEND_SYSTEM.md`. Instead document
  that the bundled default (Plugin A) is already injected, and that a project may *optionally*
  create `<cwd>/.omp/APPEND_SYSTEM.md` to customize.
- **Mechanism:** `enforce-orchestrator.ts` reads the override at `<cwd>/.omp/APPEND_SYSTEM.md`,
  else uses the bundled default (F3).
- **Rationale:** It is already load-bearing; auto-copying risks clobbering a project's
  intentional customization and diverges from the bundled default on every plugin upgrade.
- **Supporting findings:** F3, F9.

### R3 — PROTO.md: copy to `<cwd>/PROTO.md` for reference resolution (doc-only)
- **What:** Copy `scaffold/PROTO.md` → `<cwd>/PROTO.md` (idempotent, skip if exists) so the
  "see PROTO.md" cross-references in AGENTS.md/APPEND_SYSTEM resolve. State clearly it is
  read-on-demand, never omp-auto-loaded.
- **Mechanism:** none (no auto-load); consumed via the `read` tool on demand (F4).
- **Rationale:** Keeps the documented protocol reachable; low cost. Alternative (cleaner):
  drop the prose cross-refs and bundle PROTO.md content where it is read via `skill://`.
- **Supporting findings:** F4.

### R4 — RULES.md: decide separately — delete, or fold into Plugin A's `rules/` (NOT an installer fix)
- **What:** A bare root `RULES.md` has **no** omp load path, so the installer cannot make it
  load-bearing. Two real options:
  1. **Delete** `scaffold/RULES.md` — it is redundant with the gate + the DoD rule
     (`AGENTS.md [repo]:27` already names `rules/ro-definition-of-done.md` as the sticky rule).
  2. If its "Orchestrator Invariant" content is wanted as a **second** always-apply rule,
     **move it into Plugin A** as `rules/ro-orchestrator-invariant.md` with `alwaysApply: true`
     frontmatter. Then it loads automatically via the `rules/` scan (F5) in both modes — no
     installer copy, no `<cwd>` write.
- **Mechanism (option 2):** omp-plugins `<ext-root>/rules/*.md` scan (F4/F5).
- **Rationale:** omp's rule loader only scans `rules/` **dirs**; a root file is dead weight.
  Option 2 is the only way to make this content load-bearing, and it rides the existing Plugin A
  packaging (`files:["src","rules"]`).
- **Supporting findings:** F4, F5, F9.

### R5 — IDEA-003: keep `agents[]` as documentation; do not add `count`
- **What:** No functional change needed. `agents[]` may stay (catalog metadata, harmless).
  Do **not** add a `count` field — it is not an omp concept and nothing consumes it. Correct
  the `hr SKILL.md` mandate accordingly (agents register by file presence, not declaration).
- **Rationale:** F7 — neither field is load-bearing.
- **Supporting findings:** F7.

---

## GO / NO-GO — can `elon_ko.sh` achieve load-bearing placement for all four?

- **AGENTS.md — GO.** Installer copy to `<cwd>/AGENTS.md` makes it load-bearing (R1).
- **APPEND_SYSTEM.md — GO (already done).** Load-bearing via Plugin A's bundled default with
  zero copying; override is optional (R2).
- **PROTO.md — CONDITIONAL GO (doc-only).** Copyable for reference resolution, but it is
  never omp-auto-loaded; "load-bearing" does not apply (R3).
- **RULES.md — NO-GO via installer placement alone.** No root path makes it load-bearing.
  Requires a **packaging** decision (delete, or move into Plugin A `rules/`) — R4.

**Overall:** `elon_ko.sh` can fully resolve the *actual defect* (AGENTS.md missing) and
document APPEND_SYSTEM; PROTO.md is a doc nicety; RULES.md needs a separate SPEC decision
(repackage/delete), not an installer step. So: **GO for 1 of 4 as a true omp-load fix, 1
already satisfied, 1 doc-only, 1 deferred to a packaging decision.**

---

## Impact Assessment

- **Verdict: EXPAND.**
- **Affected requirements / context:** This expands the scope of the LOCAL/GLOBAL install
  feature beyond "deploy plugins." It establishes that a **second, orthogonal** deploy surface
  exists — **project-context steering files** (`AGENTS.md` at `<cwd>/`, optional
  `<cwd>/.omp/APPEND_SYSTEM.md`) — which omp discovers relative to **cwd**, independent of the
  omp home (and therefore identical in GLOBAL and LOCAL mode). SPEC §3.2's artifact table
  currently lists only plugin/binary/cache artifacts; it does not account for cwd-relative
  steering files. Additionally, the report introduces a **deferred decision** (RULES.md:
  delete vs. repackage into Plugin A `rules/`) that SPEC must resolve, and corrects the
  `agents[]`/`count` registration model (IDEA-003) — affecting `hr SKILL.md`'s stated
  registration procedure.
- **Does it contradict the finalized LOCAL/GLOBAL install-mode decisions?** **No.** It builds
  on them: plugin paths relocate with the omp home exactly as RESEARCH.md/SPEC.md specify; the
  only addition is that AGENTS.md/APPEND_SYSTEM/PROTO live at **cwd**, not in the omp home, so
  LOCAL mode changes nothing about their target paths.
- **Recommendation: PROCEED to SPEC** (with the expanded scope). No re-GRILL needed — the
  questions are all answered from source. SPEC should add: (a) an idempotent
  `scaffold`→`<cwd>` deploy step (AGENTS.md mandatory; PROTO.md doc; APPEND_SYSTEM skip);
  (b) a resolved RULES.md decision; (c) a note that these targets are cwd-relative and thus
  mode-agnostic.

---

## Sources Consulted

All omp sources are the vendored `@oh-my-pi/pi-coding-agent@16.0.5`
(`node_modules/@oh-my-pi/pi-coding-agent/`, repo `can1357/oh-my-pi`), access date **2026-07-01**.

- `src/discovery/index.ts` — provider registry; confirms the exhaustive provider list (incl.
  `agents-md`, `agents`, `omp-plugins`, `claude-plugins`).
- `src/discovery/agents-md.ts:21-59` — AGENTS.md walk-up-from-cwd loader (F2).
- `src/discovery/agents.ts:29,46-61,88-230` — `.agent`/`.agents` loader for
  skills/rules/prompts/commands/context(AGENTS.md)/system(SYSTEM.md) (F2, F4).
- `src/discovery/omp-plugins.ts:36-37,88-132` — extension-package sub-discovery; `rules/` and
  `prompts/` scan from extension roots (F4, F5).
- `src/discovery/omp-extension-roots.ts:117-189` — the 4 extension-root sources (CLI,
  settings, **installed plugins under node_modules**); `listInstalledPluginRoots` (F5).
- `src/discovery/plugin-dir-roots.ts` — `--plugin-dir` synthetic root shape (context).
- `src/discovery/helpers.ts:24-82,838-1003` — SOURCE_PATHS; `listClaudePluginRoots` reads
  `installPath` from Claude + **OMP** + project registries; OMP authoritative (F5, F6).
- `src/workspace-tree.ts:12-16` — AGENTS_MD_LIMIT=200 native workspace walk (F2).
- `src/system-prompt.ts:26,310-328` — context/system-prompt assembly (F2, F4).
- `src/task/discovery.ts:1-11,61-115` — subagent definitions from `.omp/agent/agents`,
  `.omp/agents`, `<installPath>/agents` (F6).
- `src/extensibility/plugins/loader.ts:65-140` — `getEnabledPlugins`; `path=node_modules/<name>`;
  `omp`/`pi` manifest gate (F5).
- `src/extensibility/plugins/installer.ts:7,30,33-82` — npm/git install → `bun install` into
  `<plugins>/node_modules` (F5).
- `src/extensibility/plugins/marketplace/manager.ts:83-106,200-329` — marketplace add
  (catalogPath only), install (installPath=cachePath, source-driven) (F5, F7).
- `src/extensibility/plugins/marketplace/cache.ts:47-89` — `cachePlugin` copies `sourcePath`
  → plugin cache (F5).
- `src/extensibility/plugins/marketplace/registry.ts:29-43` — path helpers
  (`marketplaces.json` @ configRoot; `cache/marketplaces`; `cache/plugins`;
  `installed_plugins.json` @ pluginsDir) (F5, F8).
- `src/extensibility/plugins/marketplace/types.ts:65-95` — `MarketplaceCatalog`,
  `MarketplacePluginEntry` (incl. `agents?`, **no `count`**) (F7).
- `@oh-my-pi/pi-utils/src/dirs.ts:19-23` — `APP_NAME="omp"`, `CONFIG_DIR_NAME=".omp"`,
  PI_CONFIG_DIR/XDG semantics (F8; cross-refs `.app/RESEARCH.md` F1).
- `[repo] src/enforce-orchestrator.ts:36-43,87-94,130-151` — APPEND_SYSTEM bundled default +
  `<cwd>/.omp/APPEND_SYSTEM.md` override; advisory-only injection (F3).
- `[repo] package.json:7,17-19` — Plugin A `files:["src","rules"]`, `omp.extensions` (F3, F5).
- `[repo] .omp-plugin/marketplace.json:8,14,17` — `pluginRoot:"./plugins"`, `source:"./agents"`,
  `agents:[…]` (F5, F7).
- `[repo] scaffold/{AGENTS,APPEND_SYSTEM,PROTO,RULES}.md` — the four files under review
  (F2–F4, F9); `scaffold/AGENTS.md:27,80` enforcement-layer table.
- `.app/RESEARCH.md` F1/F3/F5 — prior omp path-resolution findings (basis for F8 plugin paths).
- `.app/SPEC.md` §3.2/§5.4 — finalized LOCAL layout & dual-knob (basis for F8 LOCAL column).
- `.app/IDEAS.md` IDEA-003 — the `agents[]`/`count` question (F7).

> **One-line recommendation for LeadDev's SPEC:** Add an idempotent scaffold-deploy step to
> `elon_ko.sh` (both modes) that copies `AGENTS.md`→`<cwd>/AGENTS.md` (the only genuine
> omp-load fix) and `PROTO.md`→`<cwd>/PROTO.md` (doc), skips auto-placing `APPEND_SYSTEM.md`
> (already load-bearing via Plugin A; document the optional `<cwd>/.omp/APPEND_SYSTEM.md`
> override), and defers `RULES.md` to a packaging decision (delete, or move into Plugin A
> `rules/` as an always-apply rule) — all four targets are `<cwd>`-relative and thus
> mode-agnostic, so LOCAL mode needs no special handling for them.
