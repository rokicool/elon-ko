# elon-ko

A **pure content library** of agent definitions, skills, and protocol references for [oh-my-pi](https://omp.sh) (`omp`): 11 specialist agent definitions, 13 skills, a persona-protocol sticky rule (`scaffold/RULES.md`), and a phased development protocol reference (`scaffold/PROTO.md`). The repo ships no plugins, no installer, and no enforcement machinery; see the [CHANGELOG](CHANGELOG.md) for details and migration steps.

## What's here

| Path | Contents |
|---|---|
| `.omp/agents/` | 11 agent definitions: `reqguru`, `drpe`, `leaddev`, `middev`, `validator`, `purecode`, `docworm`, `hr`, `wrapper`, `debugger`, `testwriter` |
| `.agents/skills/` | 13 skills — the 11 agents' skills plus `elon` and `logging-design`, which have no agent definition |
| `scaffold/RULES.md` | The persona protocol as a sticky-rule source — copy to `<repo>/.omp/RULES.md` (auto-loaded by omp) |
| `scaffold/PROTO.md` | The phased development protocol (doc-only reference; optionally copy to `<repo>/.omp/PROTO.md`) |
| `CHANGELOG.md` | Release history |
| `LICENSE` | MIT |
| `.github/workflows/` | Content-sanity CI + notes-only release |

## Installing the personas

Copy the content into your repo — omp's native discovery does the rest.

- **Agents:** Copy the files from `.omp/agents/` into `<your-repo>/.omp/agents/` (this repo only) or `~/.omp/agent/agents/` (every repo).
- **Skills:** Copy the directories from `.agents/skills/` into `<your-repo>/.agents/skills/` or `~/.agents/skills/`.
- **Rules:** Copy `scaffold/RULES.md` to `<your-repo>/.omp/RULES.md`. omp auto-loads it as a **sticky always-apply rule** — carried on every request, survives compaction, and reaches task subagents (they drop `AGENTS.md` context files but keep `RULES.md`). User-wide alternative: `~/.omp/agent/RULES.md`.
- **Protocol reference (optional):** Copy `scaffold/PROTO.md` to `<your-repo>/.omp/PROTO.md` (doc-only; no provider auto-loads it).

No configuration, marketplace, or plugin installation is needed — omp discovers all of it at startup.

**Why everything lives under `.omp/` and `.agents/`:** a root-level `AGENTS.md` is a cross-harness convention consumed by many agent tools. elon-ko never writes or instructs you to create one, so installing the Elon/Ko personas cannot conflict with any other harness in the same repo by default.

Keep each skill exactly one level under `skills/` (`.agents/skills/<name>/SKILL.md`); deeper nesting is not discovered, and agent names must be unique (project overrides user; first match wins).

To verify, run `omp read skill://elon` in the target repo (or open the `/agents` hub in a session) to confirm discovery.

## Per-agent models

Each definition pins a `model:` role alias: `pi/slow` for `drpe`, `leaddev`, and `purecode`; `pi/task` for `middev`, `reqguru`, `validator`, `debugger`, and `testwriter`; `pi/smol` for `docworm`, `hr`, and `wrapper`. The aliases resolve via omp's built-in model-role chain with zero configuration. To override them, merge a `modelRoles` block into `<your-repo>/.omp/config.yml` or `~/.omp/agent/config.yml`:

```yaml
modelRoles:
  slow: <your-strongest-model>
  task: <your-general-model>
  smol: <your-cheapest-model>
```

…or use `/models` interactively in a session.

## Migrating from v2.x

Copy first, then remove the old machinery:

1. Copy the content into your repo per the [Installing the personas](#installing-the-personas) instructions above — **including** `scaffold/RULES.md` → `<repo>/.omp/RULES.md` (v4.0.0: the persona protocol now ships as a sticky rule).
2. `omp plugin uninstall elon-ko-gate elon-ko-agents` (very old installs may know them as `omp-agent-gate`/`orchestrator-agents`).
3. `omp plugin marketplace remove elon-ko` (legacy id `@omp-agent-template` if upgrading from very old installs).
4. Delete previously scaffolded files from consuming projects: `<cwd>/AGENTS.md`, `<cwd>/PROTO.md`, `<cwd>/.omp/config.example.yml`, `<cwd>/.omp/elon.json`. A root `AGENTS.md` is what other harnesses consume — removing it is exactly the conflict v4.0.0's `.omp/`-only layout eliminates.
5. Remove install residue: `rm -rf ./.elon-ko` (local installs) and `~/.omp-prerelease` (pre-release cache).
6. Verify with `omp read skill://elon` in the target repo.

The ordering matters: identical copies collapse silently during any overlap, so `skill://` names stay continuously available — copying first makes the transition a no-op.

## What was removed in v3.0.0

- The root-session enforcement gate.
- The `.` agreement token.
- The `/idea`/`/ideas` commands and idea reminders.
- Cross-instance `mess-send`/`mess-fail` message transport.
- The subagent observability panel.
- APPEND_SYSTEM framing re-injection.

omp's own native facilities replace these at the consumer's side. See the [CHANGELOG](CHANGELOG.md) for the full list and migration steps.
