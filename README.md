# elon-ko

A **pure content library** of agent definitions, skills, and protocol references for [oh-my-pi](https://omp.sh) (`omp`): 11 specialist agent definitions, 13 skills, a persona-protocol sticky rule (`scaffold/RULES.md`), and a phased development protocol reference (`scaffold/PROTO.md`). The repo ships no plugins and no enforcement machinery — installation is a pure local copy via `install.sh`; see the [CHANGELOG](CHANGELOG.md) for details and migration steps.

## What's here

| Path | Contents |
|---|---|
| `.omp/agents/` | 11 agent definitions: `reqguru`, `drpe`, `leaddev`, `middev`, `validator`, `purecode`, `docworm`, `hr`, `wrapper`, `debugger`, `testwriter` |
| `.agents/skills/` | 13 skills — the 11 agents' skills plus `elon` and `logging-design`, which have no agent definition |
| `scaffold/RULES.md` | The persona protocol as a sticky-rule source — copy to `<repo>/.omp/RULES.md` (auto-loaded by omp) |
| `scaffold/PROTO.md` | The phased development protocol (always installed to `<repo>/.omp/PROTO.md`) |
| `CHANGELOG.md` | Release history |
| `LICENSE` | MIT |
| `.github/workflows/` | Content-sanity CI + notes-only release |
| `install.sh` | Installer — fetches a release from GitHub (bash + coreutils + curl) |

## Installing the personas

Run the installer (bash + coreutils + curl; it downloads the release itself — no clone needed):

```bash
curl -fsSL https://raw.githubusercontent.com/rokicool/elon-ko/main/install.sh | bash -s -- /path/to/your-repo
```

It resolves the **latest stable release** via the GitHub API (`/releases/latest`) and unpacks that tag's source tarball (codeload — no API rate limits on the download itself). If the API call fails (e.g. unauthenticated rate limit), the installer exits with a clear error; pin an exact tag instead:

```bash
curl -fsSL https://raw.githubusercontent.com/rokicool/elon-ko/main/install.sh | bash -s -- /path/to/your-repo --version v4.1.1
```

The target path defaults to the current directory; flags (`--dry-run`, `--version`) work in any order. `--dry-run` still fetches (read-only) so the plan lists real files, but writes nothing.

It copies `.omp/agents/*.md` → `<repo>/.omp/agents/`, `.agents/skills/*` → `<repo>/.agents/skills/`, `scaffold/RULES.md` → `<repo>/.omp/RULES.md`, and `scaffold/PROTO.md` → `<repo>/.omp/PROTO.md` (always installed — mandatory). It is idempotent — same-name files are overwritten, your own extra files are never touched — and `--dry-run` prints the actions without writing. `.omp/RULES.md` auto-loads as a **sticky always-apply rule** — carried on every request, survives compaction, and reaches task subagents (they drop `AGENTS.md` context files but keep `RULES.md`). User-wide alternative: copy to `~/.omp/agent/RULES.md`. Verify afterwards with `omp read skill://elon` run in the target repo.

**No-curl alternative:** `git clone --depth 1 --branch v4.1.1 https://github.com/rokicool/elon-ko`, then copy from the clone: `.omp/agents/*.md` → `<repo>/.omp/agents/`, `.agents/skills/*` → `<repo>/.agents/skills/`, `scaffold/RULES.md` → `<repo>/.omp/RULES.md`, `scaffold/PROTO.md` → `<repo>/.omp/PROTO.md` (mandatory).

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
