# PROJECT — Fix A (gate hardening) + B (roster unification / PROTO.md source of truth)

## Goal
Address Theme A (gate bypass holes) + Theme B (roster source of truth). PROTO.md = canonical roster; validator enforces per-slice agreement. C1/C2/C3 folded as durability arm.

## Confirmed decisions
- Q1 = Docs authority + validator enforcement (per-slice, NOT forced equality).
- Q2 = bash gate {add,commit,status,diff,log} of `.app/`; metachars rejected globally+first; mass-stage flags rejected; path-scoped.

## Result: DONE ✅ — VALIDATE PASS (14/14 ACs), DocWorm clean.
Commits: SPEC fc1d94b · DEVELOP ba5eac7..2789121 (9) · RESOLVE c4664a3 · DocWorm (no change).

## Verification (independent, re-run by Validator)
- Gate tests: 39/39 pass (8 ALLOW + 15 BLOCK bash; 5 ALLOW + 3 BLOCK write). Covers `git status; x`, `git reset --hard`, `git push -f`, `-A/-a`, path escapes, `leak.app/PROJECT.md`.
- `validate-plugins.sh`: ALL CHECKS PASSED (Steps A–I). Per-slice: Step B gate TEAM=8 (spawner∋elon), Step C mess=7, Step D registry=8, Step E marketplace=9.
- `npm run typecheck`: EXIT 0. Mirrors: 9 agents + 10 skills byte-identical.

## Key correction (caught at VALIDATE cycle 1, fixed at RESOLVE)
AC-4 modeling error: MidDev had been added to skill://elon's `<agent_registry>` (9) to satisfy a buggy validator Step D. Fix: removed MidDev (→8, matches routing table); Step D now filters by spawner∋elon (8) with its own var; Step E marketplace decoupled at 9. MidDev stays LeadDev-spawned, present everywhere except Elon's registry.

## Status
- COMPLETE. All themes A/B + folded C1/C2/C3 delivered and validated.

## Out of scope (noted, not done)
- Themes D/E/F. F-011 (DEVREADME extensions example omits idea-storage.ts). INFO: `-p` rejection blocks read-only `git log -p`/`git diff -p` (per-spec §2.1 step 5).
- Migration note: new bash gate blocks `&`/`;`, so `git add … && git commit` is rejected — use two separate calls. (Active after plugin reload.)

## Pending Asks
(none)
