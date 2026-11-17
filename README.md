# elon-ko

A **pure content library** of agent definitions and skills for [oh-my-pi](https://omp.sh) (`omp`): 11 specialist agent definitions, 13 skills, and a phased development protocol reference in `scaffold/PROTO.md`. As of **v3.0.0** the repo ships no plugins, no installer, and no enforcement machinery — a breaking change; see the [CHANGELOG](CHANGELOG.md) for details and migration steps.

## What's here

| Path | Contents |
|---|---|
| `.omp/agents/` | 11 agent definitions: `reqguru`, `drpe`, `leaddev`, `middev`, `validator`, `purecode`, `docworm`, `hr`, `wrapper`, `debugger`, `testwriter` |
| `.agents/skills/` | 13 skills — the 11 agents' skills plus `elon` and `logging-design`, which have no agent definition |
| `scaffold/PROTO.md` | The phased development protocol (doc-only reference) |
| `CHANGELOG.md` | Release history |
| `LICENSE` | MIT |
| `.github/workflows/` | Content-sanity CI + notes-only release |

## Using the agents & skills

Copy the content into your repo — omp's native discovery does the rest.

- **Agents:** Copy the files from `.omp/agents/` into `<your-repo>/.omp/agents/` (this repo only) or `~/.omp/agent/agents/` (every repo).
- **Skills:** Copy the directories from `.agents/skills/` into `<your-repo>/.agents/skills/` or `~/.agents/skills/`.

No configuration, marketplace, or plugin installation is needed — omp discovers both locations automatically at startup.

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

1. Copy the v3 content into your repo per the [Using the agents & skills](#using-the-agents--skills) instructions above.
2. `omp plugin uninstall elon-ko-gate elon-ko-agents` (very old installs may know them as `omp-agent-gate`/`orchestrator-agents`).
3. `omp plugin marketplace remove elon-ko` (legacy id `@omp-agent-template` if upgrading from very old installs).
4. Delete previously scaffolded files from consuming projects: `<cwd>/AGENTS.md`, `<cwd>/PROTO.md`, `<cwd>/.omp/config.example.yml`, `<cwd>/.omp/elon.json`.
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
