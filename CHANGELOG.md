# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **New `subagent-panel` extension: a live, always-on view of running subagents.** A compact panel above the editor streams per-subagent stats (status, agent, task, tool count, requests, context %, cost, resolved model) plus a work tail and an aggregate header; `Alt+S` opens a full scrollable table of every agent. Driven by the live `task:subagent:*` event bus (a 1 s tick only refreshes durations/sweeps finished rows); purely additive — complements the built-in HUD/status line/Agent Hub. Configurable via the `OMP_SUBAGENT_PANEL_*` env knobs. Unlike the gate, it is **not** gated by the orchestrator opt-in: it loads wherever Plugin A is installed and activates in any interactive TUI session (`ctx.hasUI`); no-op in headless/RPC/subagent/print.

## [v1.7.0] - 2026-06-26

### Added

- **Pre-release test pipeline.** Every push to a non-`main` branch now publishes a
  GitHub **pre-release** tagged `pr-<branch>-<short-sha>` (new
  `.github/workflows/prerelease.yml`; idempotent — re-pushing a commit updates the
  same release; `pr-*` never triggers `release.yml`'s `v*` production release).
  `elon_ko.sh` gains a positional tag argument that pins **both** plugins to that
  ref — `bash elon_ko.sh pr-dev-abc1234`, or
  `curl … | bash -s -- pr-dev-abc1234` for the piped one-liner — so unreleased work
  can be installed and tested before it ships.

  - **Plugin A** pins via the existing `github:<repo>#<tag>` mechanism.
  - **Plugin B** is fetched as the tag's source tarball and registered as a **local**
    marketplace under `$OMP_PRERELEASE_DIR` (default `~/.omp-prerelease`), because omp
    marketplaces track the default branch and **cannot** be ref-pinned. The directory
    is kept (omp references a local marketplace in place).

  This differs from `OMP_AGENT_REF=<tag>`, which pins **only** Plugin A while Plugin B
  still tracks latest. Re-running `elon_ko.sh` with no argument returns to the latest
  stable release. Both modes work on a clean machine, in a docker container, and over a
  prior install (stable or pre-release): the marketplace is removed and re-registered
  each run, and Plugin A is uninstalled before the pinned install to avoid a
  `DependencyLoop`.

### Changed

- `elon_ko.sh` default Plugin A pin bumped `v1.4.0` → `v1.6.0` (the release-tag default
  had drifted behind `package.json#version`).
- README Quick-install and Manual-install examples updated from the stale `v1.4.0` to `v1.6.0`.

## [v1.6.0] - 2026-06-26

### Removed

- **`subagent-tabs` extension removed** — the live per-agent tabs feature, its documentation,
  and the dangling `package.json#omp.extensions` registration that referenced the already-deleted
  `src/subagent-tabs.ts` and broke `scripts/validate-plugins.sh`/CI. The `OMP_SUBAGENT_TABS*`
  environment knobs no longer exist. (The feature's released history is preserved verbatim under
  `[v1.3.0]`.)

### Changed

- **Version bumped Minor: `1.5.0` → `1.6.0`** in `package.json#version`. The two
  `.omp-plugin/marketplace.json` version fields (`metadata.version`, `plugins[].version`) are
  bumped in lockstep `1.4.0` → `1.6.0` (they had drifted to `1.4.0`); the repo's lockstep
  invariant is restored.

## [v1.4.0] - 2026-06-26

### Added

- **New `dot-agreement` extension: a `.` agreement token for the root orchestrator.** Elon accepts a lone `.` as explicit agreement with the most-recent **pending ask** recorded in `.app/PROJECT.md`. The token fires only when the trimmed reply is exactly `.` — whitespace-padded forms (`. `, ` .`) count, while embedded/repeated dots (`v1.2`, `ok.`, `3.14`, `..`) are literal text and affirmatives (`yes`, `ok`, `y`) are ordinary input, **not** the token. On agreement the ask is marked `status=agreed`; if none is pending, Elon asks what you are agreeing to. Like the gate, it is dormant unless the project opts in.

- **New `mess-transport` extension: cross-instance messaging for agents running in separate `omp` processes.** When team agents run in separate `omp` processes that share the same `.app/` directory on disk, messages addressed to a remote agent are written to `.app/mess/` and picked up by the receiver (turn-start scan + idle poll); co-located agents keep using normal in-app delivery. Exposes `mess-send` and `mess-fail` tools on team agents. Configurable via `OMP_MESS_POLL_MS`, `OMP_MESS_CLAIM_STALE_MS`, `OMP_INSTANCE_ID`, and `.app/instances.json`. Dormant unless opted in.

### Changed

- Registered both extensions in `package.json#omp.extensions` and documented them across the orchestrator skills, the team-agent tool frontmatter (`mess-send`/`mess-fail`), and the user/developer guides.

### Validation

- `tsc --noEmit` clean; **63/63** unit tests pass; `scripts/validate-plugins.sh` reports ALL CHECKS PASSED.

## [v1.3.1] - 2026-06-25

### Changed

- **Opt-in marker renamed: `.omp/orchestrator.json` → `.omp/elon.json`.** The
  per-project gate is now enabled with:

  ```bash
  echo '{"enabled": true}' > .omp/elon.json
  ```

  This aligns the marker filename with the orchestrator's "Elon" identity. The
  env opt-in (`OMP_ENABLE_ORCHESTRATOR=1`) and escape hatch
  (`OMP_BYPASS_ORCHESTRATOR=1`) are unchanged. **Migration:** existing opted-in
  projects must rename their marker
  (`mv .omp/orchestrator.json .omp/elon.json`); otherwise the gate reverts to
  dormant (the safe, unrestricted default).

### Fixed

- **Plugin B marketplace version no longer reports `1.2.1`.** Both
  `metadata.version` and `plugins[].version` in `.omp-plugin/marketplace.json`
  are now kept in lockstep with `package.json#version` (now `1.3.1`). The stale
  `1.2.1` — shown as `Installed orchestrator-agents … (1.2.1)` during install —
  was drift left over from the `v1.3.0` release.

## [v1.3.0] - 2026-06-25

### Added

- **New `subagent-tabs` omp extension: per-agent live activity in supaterm.**
  When a subagent starts, a supaterm tab opens labeled `<agentId> · <role>` and
  streams live, colored activity — tool calls (✓/✗), notices, and irc messages.
  Tabs survive the subagent's end for review (they never auto-close); a canceled
  subagent shows `[ABORTED]`. If the supaterm socket is unreachable, the
  extension falls back to a tmux bridge automatically.

- **Configurable via environment knobs.** `OMP_SUBAGENT_TABS` toggles the
  feature (default on); `OMP_SUBAGENT_TABS_RENDER` selects `rich` (default,
  ANSI-colored) or `plain` rendering; `OMP_SUBAGENT_TABS_QUIET_MS` and
  `OMP_SUBAGENT_TABS_HOLDER` tune idle/quiet behavior and the holder display.

- **How to use:** restart your omp session (on by default) and spawn subagents
  with supaterm open.

### Validation

- 8/8 unit tests pass (`npm test`), `tsc --noEmit` is clean; registry
  invariants and the corrected omp API are verified. The live supaterm socket
  path and tmux fallback were exercised end-to-end. (AC1/AC2/AC4 require a live
  omp subagent session.)

### Known non-blocking gaps

- No mid-session socket→tmux failover (fallback is chosen at startup); no
  `isolated` label (omp API gap); no `job cancel` hint in the tab label;
  `rewind()` is built and tested but not yet wired into the controller.

## [v1.2.2] - 2026-06-24

### Fixed

- **The one-line installer no longer fails with a `DependencyLoop` on machines that
  already had `omp-agent-gate` installed.** Running
  `curl .../elon_ko.sh | bash` aborted with a `bun` `DependencyLoop` whenever a
  different version or ref of `omp-agent-gate` was already locked into
  `~/.omp/plugins/` — a prior release, a floating ref, or `main` HEAD instead of
  the pinned tag. `omp` resolves this dependency under its package name, so once a
  mismatched ref is locked in, a plain re-install (even with `--force`) cannot
  clear it and `bun install` bails out. This was drift-only: a machine with no
  previous install was never affected.

  `elon_ko.sh` now uninstalls `omp-agent-gate` before the pinned install. On a
  clean machine the uninstall is a harmless no-op; on a drifted install it removes
  the stale resolution so the pinned ref resolves cleanly on every run and
  upgrade.

- **Installer-only change; plugin code is unchanged.** This release fixes only the
  installer (`elon_ko.sh`) and its documented install steps. Plugin A's gate and
  rule code are unchanged, and Plugin B (`orchestrator-agents`) is entirely
  unaffected — no behavior, configuration, or skill changes.

- If you previously installed `omp-agent-gate` from a bare or manually pinned ref
  and hit `DependencyLoop`, reinstall pinned and uninstall first:

  ```bash
  omp plugin uninstall omp-agent-gate \
    && omp plugin install github:<owner>/omp-agent-template#v1.2.2
  ```
