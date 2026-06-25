# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
