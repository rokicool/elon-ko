# Research Report — Per-Agent Model Assignment in the oh-my-pi (omp) Harness

## Scope

This report answers **how the oh-my-pi (omp) harness lets you assign a specific
model to a specific agent/subagent**, within a single coding session where
different subagents may run on different models.

Dimensions covered, all verified against primary sources:
1. Exact syntax for specifying a model per agent (frontmatter? config key? call-time arg?).
2. Where the model declaration lives (agent definition file format, registry/marketplace schema, runtime overrides).
3. Fallback behavior when no model is defined (default-resolution order).
4. Per-invocation overrides via `task(...)` and precedence.
5. Model identifier format with real examples.
6. Validated examples — an agent definition WITH a model field, and one WITHOUT (fallback path).

**Sources consulted** (all cited inline and listed in §Sources Consulted):
- Bundled omp harness docs (`omp://` scheme): `models.md`, `task-agent-discovery.md`, `tools/task.md`, `marketplace.md`, `settings.md`, `config-usage.md`, `environment-variables.md`.
- omp harness **source code** on GitHub (`can1357/oh-my-pi`, `main`): `packages/coding-agent/src/task/executor.ts`, `packages/coding-agent/src/config/model-resolver.ts`, `packages/coding-agent/src/task/index.ts`.
- GitHub issue [#1544](https://github.com/can1357/oh-my-pi/issues/1544) (maintainer comment corroborating frontmatter shape).
- The elon-ko plugin's own agent definition files (`plugins/agents/agents/*.md`) and `.omp-plugin/marketplace.json`.

> Note on `.app/REQ.md`: a `REQ.md` exists in this repo but is a **leftover artifact
> of a prior "scaffold" workflow** (see sibling `RESEARCH-SCAFFOLD.md` /
> `SCAFFOLD-SPEC.md`). It is unrelated to this model-assignment research, so this
> report is anchored to the delegation brief itself, not to that stale REQ.

---

## Findings

### Dimension 1 — Exact syntax for specifying a model per agent

There are **two** mechanisms. A per-invocation argument on `task(...)` is **NOT**
one of them (see Dimension 4).

#### (a) `model:` frontmatter field on the agent definition markdown file

An agent is a markdown file with YAML frontmatter. The normalized
`AgentDefinition` type carries an optional `model` field, parsed from
frontmatter by `parseAgentFields()` (`src/discovery/helpers.ts`).

> Source: `omp://task-agent-discovery.md` — *"Task agents normalize into
> `AgentDefinition` (`src/task/types.ts`): `name`, `description`, `systemPrompt`
> (required) … optional `tools`, `spawns`, **`model`**, `thinkingLevel`,
> `output`, `blocking`, `autoloadSkills`, `readSummarize` … Parsing comes from
> frontmatter via `parseAgentFields()`."*

Corroborated by the maintainer comment on GitHub issue #1544:

> *"Custom subagents — drop a markdown file (with YAML frontmatter: `name`,
> `description`, `tools`, **model**, etc.) into `.omp/agents/*.md` (project) or
> `~/.omp/agent/agents/*.md` (user). They're discovered by `discoverAgents` in
> `packages/coding-agent/src/task/discovery.ts` and become valid `agent` values
> for the `task` tool."*
> — https://github.com/can1357/oh-my-pi/issues/1544

Concrete shape (frontmatter only):

```markdown
---
name: drpe
description: Super researcher...
tools: web_search, read, browser, edit, write
model: anthropic/claude-sonnet-4-5
---
```

`model` accepts a **string or a CSV/array of patterns** (the resolver normalizes
both via `normalizeModelPatterns` / `normalizeModelPatternList`). A companion
`thinkingLevel:` frontmatter field sets the reasoning depth
(`minimal|low|medium|high|xhigh|auto`), and a model pattern may also carry a
trailing `:level` thinking suffix (e.g. `anthropic/claude-opus-4-5:high`).

#### (b) `task.agentModelOverrides` — a per-agent-name settings map

This is the **highest-priority** per-agent override and it lives in settings
(`~/.omp/agent/config.yml` or `<repo>/.omp/config.yml`), **not** in the agent
file. It is keyed by agent name. It was not named in the bundled settings
catalog prose (which only says "`task.*` (subagent concurrency, isolation,
model overrides)") but is **verified from source** in `#runSpawn`
(`packages/coding-agent/src/task/index.ts`):

```js
// Apply per-agent model override from settings (highest priority)
const agentModelOverrides = this.session.settings.get("task.agentModelOverrides");
const settingsModelOverride = agentModelOverrides[agentName];
```

It feeds `resolveAgentModelPatterns({ settingsOverride: settingsModelOverride, … })`
first, ahead of the agent's own frontmatter `model` (see Dimension 3).

**Confidence: High** — primary docs + source + maintainer issue comment.

---

### Dimension 2 — Where the model declaration lives

#### Agent definition files (frontmatter) — the primary location

Discovery roots, in first-wins order by exact `agent.name`
(`omp://task-agent-discovery.md`, §"Filesystem and plugin discovery" +
§"Actual source order"):

| Priority | Root | Example path |
|---|---|---|
| 1 (highest) | project `.omp` agents dir | `<cwd>/.omp/agents/<name>.md` |
| 2 | user `.omp` agents dir | `~/.omp/agent/agents/<name>.md` |
| 3 | Claude/OMP **plugin** `agents/` dirs (project-scope then user-scope) | `<plugin>/agents/<name>.md` |
| 4 (lowest) | bundled agents | `explore`, `plan`, `designer`, `reviewer`, `librarian`, `oracle`, `task`, `sonic` |

Cross-harness roots (`.claude/agents`, `.codex/agents`, `.gemini/agents`) are
**intentionally skipped** — their frontmatter schema is not the OMP task-agent
contract (`TASK_AGENT_CONFIG_SOURCE = ".omp"`).

The elon-ko team's 8 agents ship as **plugin** agents at
`plugins/agents/agents/*.md` (`hr`, `docworm`, `drpe`, `leaddev`, `middev`,
`reqguru`, `validator`, `wrapper`), registered by
`.omp-plugin/marketplace.json` (plugin `elon-ko-agents`, `source: "./agents"`).

#### `.omp-plugin/marketplace.json` — informational only, NOT load-bearing for models

The marketplace catalog's per-plugin `agents` array
(`.omp-plugin/marketplace.json` L17) only **lists** agent names as metadata
(`omp://marketplace.md`, §"Plugin entry fields": `agents` → *"Agents provided"*,
optional). The actual agent definitions — including any `model:` field — are
discovered from the plugin's `agents/*.md` files at runtime, not from
`marketplace.json`. **No model field exists in the marketplace schema**, and
there is no `count` field either (this also resolves elon-ko IDEA-003's
open question: `agents[]` is display metadata, not a registration mechanism
the runtime depends on for model selection).

#### Runtime/settings overrides

`task.agentModelOverrides` (see Dimension 1b) lives in `config.yml` and is the
runtime per-agent override layer. The settings precedence model is
(`omp://settings.md`, §"Precedence"):

```
built-in defaults  <-  global config  <-  project config  <-  CLI overlays  <-  runtime overrides
```

**Confidence: High** — `omp://task-agent-discovery.md` + `omp://marketplace.md`
+ local elon-ko files + source.

---

### Dimension 3 — Fallback behavior when NO model is defined

This is the most important dimension and it is **fully verified from source**.
The behavior is **not** a hard-fail: an agent with no model inherits the
session's effective default model through a multi-step chain.

The resolution happens in `TaskTool.#runSpawn`
(`packages/coding-agent/src/task/index.ts`), which calls
`resolveAgentModelPatterns(...)` and passes the result to `runSubprocess` as
`modelOverride`. `resolveAgentModelPatterns`
(`packages/coding-agent/src/config/model-resolver.ts`) implements this order
(highest → lowest):

| # | Source | What it is | How it's obtained |
|---|---|---|---|
| 1 | `task.agentModelOverrides[<agentName>]` | per-agent-name settings override | `this.session.settings.get("task.agentModelOverrides")[agentName]` |
| 2 | agent frontmatter `model:` | the agent's declared model (concrete id, or the `pi/task` role alias) | `effectiveAgent.model` |
| 3 | **parent session's active model** | whatever the parent (orchestrator) is currently running on | `this.session.getActiveModelString()` → `activeModelPattern` |
| 4 | `fallbackModelPattern` | session model string fallback | `this.session.getModelString()` |
| 5 | `modelRoles.default` | the `default` model role from settings | `settings.getModelRole("default")` |

The exact fallback line in `resolveAgentModelPatterns`:

```js
const fallback =
    activeModelPattern?.trim() || fallbackModelPattern?.trim()
    || settings?.getModelRole("default")?.trim() || "";
return resolveConfiguredModelPatterns(fallback, settings);
```

So **when an agent declares no `model:` and there is no
`task.agentModelOverrides` entry, the subagent runs on the parent session's
active model** (i.e. the orchestrator's current model), falling back to
`modelRoles.default` if the parent has no active model string.

#### Auth-aware fallback to the parent model (defense in depth)

After `resolveAgentModelPatterns` produces patterns, `runSubprocess`
(`packages/coding-agent/src/task/executor.ts`) resolves them to a concrete
`Model` via `resolveModelOverrideWithAuthFallback(modelPatterns,
parentActiveModelPattern, modelRegistry, settings)`. If the chosen model
**resolves but has no working credentials**, it transparently falls back to the
**parent session's active model** (only if that one is authenticated). This is
documented inline:

> *"If the resolved subagent model has no working credentials (provider has no
> usable auth), and the parent's active model resolves with working auth, use
> the parent's model instead."* — `model-resolver.ts`, `resolveModelOverrideWithAuthFallback`

Keyless local providers (`ollama`, `llama.cpp`, `lm-studio`) advertise a
`kNoAuth` sentinel and are treated as authenticated, so an explicitly
configured local model is never silently rerouted.

#### Terminal fallback inside the child session

If the patterns resolve to **no model at all** (e.g. nothing available),
`runSubprocess` passes `model: undefined, modelPattern: undefined` to
`createAgentSession`, which then runs its own initial-model selection
(`findInitialModel`, per `omp://models.md` §"Initial model selection priority"):

```
explicit CLI provider+model → first scoped model → saved default provider/model
  → known provider defaults → first available model
```

The child also receives an **isolated snapshot of the parent's settings**
(`createSubagentSettings` in `executor.ts`), so `modelRoles`, `enabledModels`,
`modelProviderOrder`, etc. are inherited. The child's service tier defaults to
**`inherit`** (`tier.subagent: inherit`) — i.e. it tracks the parent's
per-family tier unless overridden (`omp://settings.md`, §"Sampling").

#### The `task` model role (`modelRoles.task` / `pi/task`)

`task` is a **built-in model role** (`omp://settings.md` §"Models":
*"Built-in roles: `default`, `smol`, `slow`, `vision`, `plan`, `designer`,
`commit`, `tiny`, `task`, `advisor`"*). It is configured via
`modelRoles.task` in `config.yml`. An agent **explicitly opts into it** by
declaring `model: pi/task` — this is special-cased in
`resolveAgentModelPatterns` to resolve through the `task` role's configured
patterns (or its built-in priority chain if unset), rather than falling through
to the parent active model:

```js
if (configuredAgentPatterns.length > 0) {
    if (!agentInheritsSessionModel) return configuredAgentPatterns;
    if (singleAgentPattern === "pi/task") return configuredAgentPatterns;  // pi/task is a real override
}
```

> **Important nuance:** `modelRoles.task` is **NOT auto-applied** to agents that
> declare no `model:`. A model-less agent inherits the **parent's active model**,
> not `modelRoles.task`. The `task` role only takes effect when an agent
> explicitly sets `model: pi/task` (or when something references the role).

**Confidence: High** — verified line-by-line in `task/index.ts` (`#runSpawn`),
`config/model-resolver.ts` (`resolveAgentModelPatterns`,
`resolveModelOverride`, `resolveModelOverrideWithAuthFallback`), and
`task/executor.ts` (`runSubprocess`, `createSubagentSettings`).

---

### Dimension 4 — Per-invocation overrides via `task(...)`

**There is NO per-call `model` parameter on the `task` tool.**

The `task` wire schema (`omp://tools/task.md`, §"Inputs") accepts only:
`agent`, `context`, `tasks`, `id`, `description`, `role`, `assignment`,
`isolated`. The doc is explicit that structured-output `schema` is rejected
("There is no per-call `schema` parameter"), and **`model` is similarly
absent** — confirmed in source: `#runSpawn` never reads a `params.model`; the
model comes exclusively from `task.agentModelOverrides` + the agent's
frontmatter `model` + the parent active model (Dimension 3).

#### Precedence (frontmatter-declared model vs. call-time model)

Because `task(...)` carries no model, the effective precedence among the
mechanisms that DO exist is:

```
task.agentModelOverrides[<agentName>]   (settings, per-agent-name)   HIGHEST
        ↓
agent frontmatter model:                (the agent .md file)
        ↓
parent session active model             (inheritance)
        ↓
modelRoles.default                      (global default role)
```

So a **settings override beats the agent's own frontmatter**. The reverse — a
call-time override beating frontmatter — is **not possible from `task(...)`**.

#### The one call-time model override path: the eval `agent()` bridge

The executor's `ExecutorOptions` does expose a `modelOverride?: string | string[]`
field, but it is populated by `resolveAgentModelPatterns` in the `task` path
(not by the caller). The only caller that supplies a true **ad-hoc call-time**
model is the **eval `agent(prompt, schema)` bridge**
(`omp://tools/task.md`: *"ad-hoc structured workflows go through the eval
bridge's `agent(prompt, schema)`"*). That is a programmatic JS bridge, not the
model-facing `task` tool the orchestrator uses.

**Confidence: High** — `omp://tools/task.md` + source (`#runSpawn` reads no
`params.model`; `ExecutorOptions.modelOverride` is fed by the resolver).

---

### Dimension 5 — Model identifier format

A valid model string is one of (`omp://models.md` §"Runtime model resolution" +
`model-resolver.ts` `parseModelString`/`parseModelPattern`):

| Form | Example | Notes |
|---|---|---|
| **`provider/modelId`** (exact concrete) | `anthropic/claude-sonnet-4-5`, `openai/gpt-4.1-mini` | bypasses canonical coalescing |
| **canonical model id** (bare) | `gpt-5.3-codex`, `claude-opus-4-6`, `claude-haiku-4-5` | resolves through the canonical index; provider inferred |
| **bare concrete id** | `claude-sonnet-4-5` | provider inferred from available models |
| **role alias** `pi/<role>` | `pi/task`, `pi/smol`, `pi/slow`, `pi/default` | expands through `settings.modelRoles`; `pi/task` → `modelRoles.task` |
| **with `:thinkingLevel` suffix** | `anthropic/claude-opus-4-5:high`, `gpt-5.3-codex:medium` | `off\|minimal\|low\|medium\|high\|xhigh`; also `:max` (→xhigh) and `:auto` aliases |
| **glob scope** | `openai/*`, `*sonnet*` | expands to all matching concrete models |
| **`@upstream` routing** | `openrouter/z-ai/glm-4.7@cerebras` | single-upstream routing on OpenRouter / Vercel AI Gateway |

CSV/array forms are accepted in frontmatter (`model: anthropic/claude-sonnet-4-5, openai/gpt-4.1-mini`),
resolved first-match.

**Confidence: High** — `omp://models.md` + `model-resolver.ts`.

---

### Dimension 6 — Validated examples

#### Example A — agent definition WITH a `model:` field (copy-pasteable)

This is a valid OMP agent file (frontmatter shape verified against
`AgentDefinition` and issue #1544). Drop it at `.omp/agents/researcher.md`
(project) or `~/.omp/agent/agents/researcher.md` (user):

```markdown
---
name: researcher
description: Deep-research specialist that runs on a strong reasoning model.
tools: web_search, read, browser, edit, write
model: anthropic/claude-opus-4-5:high
thinkingLevel: high
---

# Researcher

You are a researcher. Use the tools above to investigate and report.
```

Equivalent alternative pinning to the `task` model role instead of a concrete
model:

```markdown
---
name: researcher
description: Deep-research specialist.
tools: web_search, read, browser, edit, write
model: pi/task
---
```

With `model: pi/task`, the agent resolves through `modelRoles.task`; configure
that role once in `~/.omp/agent/config.yml`:

```yaml
modelRoles:
  default: anthropic/claude-sonnet-4-5
  task: anthropic/claude-opus-4-5:high
  smol: openai/gpt-4.1-mini
```

#### Example B — agent definition WITHOUT a model (the fallback path) — REAL, not synthetic

**All 8 elon-ko team agents ship with NO `model:` field.** Verified by reading
every file. Their frontmatter contains only `name`, `description`, `tools`
(and `spawns` on `leaddev`). Example — `plugins/agents/agents/drpe.md`
(actual file):

```markdown
---
name: drpe
description: Super researcher. Internet search, external API access, deep analysis...
tools: web_search, read, browser, edit, write
---
```

Because there is no `model:` and (by default) no `task.agentModelOverrides`
entry, each of these agents follows the Dimension-3 fallback: it **inherits the
parent (orchestrator) session's active model**, then `modelRoles.default`, then
`findInitialModel`. Concretely, if Elon is running on `zai/glm-5.2` (this
session's model), every team agent that omits `model:` will also run on
`zai/glm-5.2` unless overridden.

This is precisely **why "different subagents can run on different models within
one session"**: to diverge, an agent must either (a) declare its own `model:`
frontmatter, or (b) be given an entry in `task.agentModelOverrides`. A model-less
agent inherits the parent's model — it does **not** diverge.

#### How the orchestrator assigns each of the 8 team members a model

Given the elon-ko agents ship model-less, the orchestrator has three levers,
in precedence order:

1. **`task.agentModelOverrides`** in `config.yml` (highest, per-agent-name, no
   code change to the plugin):
   ```yaml
   task:
     agentModelOverrides:
       drpe: anthropic/claude-opus-4-5:high
       middev: anthropic/claude-sonnet-4-5
       validator: openai/gpt-5.3-codex
       reqguru: anthropic/claude-sonnet-4-5
       leaddev: anthropic/claude-opus-4-5
       docworm: openai/gpt-4.1-mini
       hr: openai/gpt-4.1-mini
       wrapper: openai/gpt-4.1-mini
   ```
2. **Add a `model:` field** to each agent's `.md` frontmatter in
   `plugins/agents/agents/*.md` (plugin source) — e.g. `model: pi/task` or a
   concrete `provider/modelId`.
3. **Do nothing** — the agent inherits the parent session's active model
   (current elon-ko behavior for all 8 agents).

**Confidence: High** — real elon-ko files read; resolution chain source-verified.

---

## Recommendations

| Rank | Recommendation | Rationale | Supporting findings |
|---|---|---|---|
| 1 | To assign per-agent models **without editing plugin source**, use `task.agentModelOverrides` in `config.yml` (global or project). It is the highest-precedence per-agent lever and requires no code change. | Verified as precedence #1 in `#runSpawn`; keyed by agent name. | Dim 1b, Dim 3 |
| 2 | To make a model assignment **portable with the agent itself**, add a `model:` frontmatter field to `plugins/agents/agents/*.md`. Prefer `pi/task` (role alias) over hardcoding a concrete id, so the model is configurable via `modelRoles.task` per environment. | Frontmatter `model` is precedence #2; `pi/task` is explicitly special-cased to resolve through the role. | Dim 1a, Dim 3, Dim 6 |
| 3 | Do **not** expect a per-call `model` on `task(agent=..., ...)` — it does not exist. If truly ad-hoc per-call model selection is needed, use the eval `agent()` bridge (programmatic), or rely on `task.agentModelOverrides` keyed by agent name. | `task` schema has no `model` param; only the eval bridge supplies call-time `modelOverride`. | Dim 4 |
| 4 | When debugging "why did my subagent run on model X?", check in order: `task.agentModelOverrides[name]` → agent `model:` frontmatter → parent active model (`/model` or `getActiveModelString`) → `modelRoles.default`. Also check `tier.subagent` (default `inherit`) for tier, not model, behavior. | This is the verified resolution chain; auth-fallback to the parent model can also silently change the model if credentials are missing. | Dim 3 |
| 5 | Treat `.omp-plugin/marketplace.json` `agents[]` as display metadata only. Do not add model info (or a `count` field) there — it is not read for model selection. (Resolves elon-ko IDEA-003.) | Marketplace schema has no model/count field; agents are discovered from `agents/*.md`. | Dim 2 |

---

## Impact Assessment

- **Verdict: EXPAND** (with one partial CONTRADICT on an assumption).
- **Affected assumptions in the brief:**
  - *"a `model:` field likely exists alongside `tools:`/`spawns:`"* — **CONFIRMED.** The `model:` frontmatter field exists exactly as suspected.
  - *"A per-invocation argument on `task(...)`?"* — **CONTRADICTED.** There is **no** per-call `model` on the `task` tool. The only call-time model override is the programmatic eval `agent()` bridge, which the orchestrator does not use.
  - The brief implied two possible mechanisms; the research found **three** distinct levers (`model:` frontmatter, `task.agentModelOverrides` settings, and the `pi/task` role alias), plus a defense-in-depth auth-fallback to the parent model.
- **Explanation:** The feature exists, is fully implemented, and is well-behaved
  (no hard-fail; clean inheritance chain). The only correction to the brief's
  mental model is the absence of a `task(...)` call-time `model` argument. This
  does not block any intended use: per-agent model assignment is achievable via
  frontmatter and/or `task.agentModelOverrides`, and the fallback (inherit
  parent active model → `modelRoles.default`) is the correct, expected behavior
  for model-less agents like the current elon-ko roster.
- **Recommendation: PROCEED.** No re-interview (GRILL) needed. The mechanism is
  fully understood and sufficient to assign each of the 8 team members a model
  (or let them inherit the orchestrator's model). If a future requirement
  demands **per-call** model selection from the orchestrator's `task()` syntax,
  that would require a harness-level change (new `task` schema field) and
  should be raised as a separate enhancement.

---

## Sources Consulted

| # | Source | URL / path | Contribution |
|---|---|---|---|
| 1 | omp docs — Models | `omp://models.md` | `models.yml`, model roles incl. `task`, model id formats, `findInitialModel` priority, canonical/coalesced resolution |
| 2 | omp docs — Task Agent Discovery | `omp://task-agent-discovery.md` | `AgentDefinition` shape incl. optional `model`/`thinkingLevel`; discovery roots + first-wins precedence; `effectiveAgent` drives model/thinking overrides |
| 3 | omp docs — task tool | `omp://tools/task.md` | `task` wire schema (no `model` param); `runSubprocess` creates isolated child settings snapshot; eval `agent()` bridge for ad-hoc model |
| 4 | omp docs — Marketplace | `omp://marketplace.md` | `marketplace.json` schema; `agents` plugin-entry field is optional metadata; no model/count field |
| 5 | omp docs — Settings | `omp://settings.md` | settings precedence; `modelRoles` (incl. `task` role); `tier.subagent: inherit`; "`task.*` model overrides" |
| 6 | omp docs — Config Usage | `omp://config-usage.md` | config roots, `.omp` source priority, settings resolution flow |
| 7 | omp docs — Environment Variables | `omp://environment-variables.md` | `PI_BLOCKED_AGENT`, no task-model env var (model roles via `modelRoles.*`, not env, except `--model/--smol/--slow/--plan`) |
| 8 | omp source — `task/executor.ts` | https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/task/executor.ts | `ExecutorOptions.modelOverride`/`parentActiveModelPattern`; `modelPatterns = normalizeModelPatterns(modelOverride ?? agent.model)`; `resolveModelOverrideWithAuthFallback(...)` call; `createSubagentSettings` (inherit parent settings); `createAgentSession({model, modelPattern})` |
| 9 | omp source — `config/model-resolver.ts` | https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/model-resolver.ts | `resolveAgentModelPatterns` (full fallback chain + `pi/task` special-case); `resolveModelOverride` (empty → undefined); `resolveModelOverrideWithAuthFallback` (auth fallback to parent model); role aliases `pi/<role>` |
| 10 | omp source — `task/index.ts` | https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/task/index.ts | `TaskTool.#runSpawn`: reads `task.agentModelOverrides[agentName]`, `getActiveModelString()`, calls `resolveAgentModelPatterns({settingsOverride, agentModel, activeModelPattern, fallbackModelPattern})`; confirms no `params.model` |
| 11 | GitHub issue #1544 | https://github.com/can1357/oh-my-pi/issues/1544 | Maintainer comment corroborating frontmatter `name, description, tools, model` on `.omp/agents/*.md` and plugin `agents/*.md` |
| 12 | elon-ko agent files | `plugins/agents/agents/{leaddev,middev,drpe,reqguru,validator,docworm,hr,wrapper}.md` | All 8 ship with NO `model:` field (frontmatter = name/description/tools[/spawns] only) — the real fallback-path example |
| 13 | elon-ko marketplace | `.omp-plugin/marketplace.json` | Plugin `elon-ko-agents` lists `agents[]` (metadata); `source: "./agents"` |
| 14 | elon-ko IDEAS | `.app/IDEAS.md` (IDEA-003) | Open question on whether `marketplace.json` `agents[]` + a missing `count` is load-bearing — resolved here (metadata only, no count field in schema) |

### Items marked `[UNVERIFIED]`

None. Every load-bearing claim is backed by at least one primary source (omp
docs or omp source on `main`). The one design-space observation that is an
inference rather than a direct quote — that `modelRoles.task` is **not**
auto-applied to model-less agents — is derived from the explicit control flow
of `resolveAgentModelPatterns` (a model-less agent reaches the
`activeModelPattern` fallback branch, never the `pi/task` branch), so it is
treated as verified, not inferred.
