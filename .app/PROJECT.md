# PROJECT — elon-ko `opt-s` binding fix

## Summary
`opt-s` (Option+S / Alt+S — toggles the subagent-panel overlay) fails on ghostty 1.3.1.
Install is correct: `elon-ko-gate@2.1.2` is installed and its `ß`-fix is present. Root cause
(High): ghostty 1.3.0 #9406 ("modifyOtherKeys state 2 no longer encodes option as alt",
unreverted in 1.3.1) — Option+S no longer arrives as the literal `ß` the v2.1.2 fix matches, nor
as `Alt+S` omp's `registerShortcut` recognizes. Diagnosis: `.app/RESEARCH.md`. Design: `.app/SPEC.md`.

## Workflow
- REQUEST: done
- RESEARCH: done (`.app/RESEARCH.md`) — verdict EXPAND; no GRILL
- SPEC: done (approved 2026-06-28) — `.app/SPEC.md`
- DEVELOP ⇄ VALIDATE: **cycle 1 in progress**
  - DEVELOP c1: **done** — commit `74abbba` (pushed origin/main). Matcher `matchesOptionToggle`
    (F1 ß / F2 codepoint-223 structured / F3 ESC+s / F4 codepoint-115+alt); fallback swapped;
    §5.4 OMITTED (TC-6 proved global listener fires first via `pi-tui/src/tui.ts #handleInput`).
    Gate: `tsc --noEmit` clean; `bun test` 8/0. OQ-1 ✓ (TC-2e); OQ-2 ✓ (TC-6).
  - VALIDATE c1: **in progress** (validator)
  - 3-cycle limit enforced (1/3)
- DONE: pending

## Scope (user-selected)
1. **Permanent plugin fix** — in VALIDATE.
2. **Clean up stale legacy plugins** (`omp-agent-gate@1.6.0`, `orchestrator-agents@1.7.0`) —
   sequenced into DONE/integration (SPEC §9.3): remove ONLY after confirming the live session is
   gated by `elon-ko-gate`, then restart omp. SPEC §2.3: stale gate registers NO Alt+S (hygiene only).

## Verified facts (SPEC §2)
- omp runtime 16.2.2; `ctx.ui.onTerminalInput` EXISTS → refutes DrPe #2.
- Dual install confirmed in `omp-plugins.lock.json`.
- `subagent-panel.test.ts:44-50` pins `parseKey("ß")===null` (root cause).

## DONE checklist (pending)
- [ ] validator PASS
- [ ] confirm live session gated by `elon-ko-gate` (not stale gate)
- [ ] remove stale `omp-agent-gate@1.6.0` + `orchestrator-agents@1.7.0`; restart omp
- [ ] real-key confirm: user presses Option+S on ghostty 1.3.1 → overlay toggles

## Workaround (relayed to user)
`macos-option-as-alt = true` in `~/.config/ghostty/config` → reload.
