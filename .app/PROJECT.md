# PROJECT — elon-ko `opt-s` binding fix

## Summary
`opt-s` (Option+S / Alt+S — toggles the subagent-panel overlay) fails on ghostty 1.3.1. Root cause
(High): ghostty 1.3.0 #9406 (modifyOtherKeys no longer encodes option as alt, unreverted in 1.3.1)
defeats the v2.1.2 `data==='ß'` fallback. Fix: encoding-agnostic `matchesOptionToggle` matcher.
Diagnosis: `.app/RESEARCH.md`. Design: `.app/SPEC.md`. Impl: commit `74abbba`.

## Workflow
- REQUEST: done
- RESEARCH: done (`.app/RESEARCH.md`)
- SPEC: done (approved) — `.app/SPEC.md`
- DEVELOP ⇄ VALIDATE: **cycle 1 PASSED** ✅ (1/3 used)
  - DEVELOP c1: `74abbba` — matcher + fallback swap; §5.4 omitted (TC-6, omp-source-verified).
  - VALIDATE c1: PASS — all §5 sections conformant (file:line); gate re-run clean (tsc 0, bun 8/0).
  - Non-blocking nit: vacuous TC-6 dispatch assertion (soundness proven independently; definitive
    proof = real-key probe in DONE).
- **DONE: in progress** (leaddev — deploy + cleanup; user — restart + confirm)

## Scope (user-selected)
1. **Permanent plugin fix** — validated; deploying in DONE.
2. **Clean up stale legacy plugins** — DONE step (guarded).

## DONE checklist
- [x] validator PASS
- [ ] determine build/install mechanism for omp plugins (verify, don't guess)
- [ ] confirm which plugin gates the LIVE session (elon-ko-gate vs stale omp-agent-gate)
- [ ] install fixed build (74abbba) into `~/.omp/plugins/` replacing elon-ko-gate@2.1.2
- [ ] remove stale `omp-agent-gate@1.6.0` + `orchestrator-agents@1.7.0`
- [ ] restart omp (user action)
- [ ] real-key confirm: user presses Option+S on ghostty 1.3.1 → overlay toggles (definitive)
- [ ] optional: tighten TC-6 assertion (validator nit)
Safety rule: if installing/removing plugins risks the live session gate, defer to a user runbook.

## Verified facts
- omp runtime 16.2.2; `ctx.ui.onTerminalInput` EXISTS → refutes DrPe #2.
- Dual install confirmed (`omp-plugins.lock.json`): elon-ko-gate/agents@2.1.2 + stale gate/agents.
- Stale `omp-agent-gate@1.6.0` registers NO Alt+S (hygiene/load-risk, not the functional cause).

## Workaround (relayed)
`macos-option-as-alt = true` in `~/.config/ghostty/config` → reload.
