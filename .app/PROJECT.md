# PROJECT — Fix A (gate hardening) + B (roster unification / PROTO.md source of truth)

## Goal
Address Theme A findings (enforcement-gate bypass holes) and Theme B findings (agent roster has no single source of truth). Make `scaffold/PROTO.md` the canonical source of truth for the agent roster, updated with full info about every agent. Fold in C1/C3 (tool-agreement enforcement) as the durability arm of B.

## Confirmed decisions (GRILL resolved)
- **Q1 = Docs authority + validator enforcement**: PROTO.md is the canonical roster; `validate-plugins.sh` enforces that gate TEAM constant, `mess-transport` ADDRESSABLE, `skill://elon` registry, and every skill `<allowed>`/frontmatter `tools:` all match PROTO.md.
- **Q2 = git read/commit of `.app/`, no metacharacters**: bash gate allows `git add/commit/status/diff/log` with `.app/`-scoped path args; reject shell metacharacters (`; & | $ \` > < newline`).

## Scope
- **A** — `src/enforce-orchestrator.ts`: A1 bash-gate bypass, A2 write-scope leak, C-013 dead redundant operand.
- **B** — roster unification + PROTO.md authority: B1 (skill://elon omits wrapper/debugger/todo), B3 (DEVREADME stale TEAM=6), B4 (skill omits todo), B5 (README/models omit debugger tier), B6 (mirror consistency), C-003 (shared TEAM source across gate + mess-transport).
- **C1/C3** (folded into B) — `validate-plugins.sh` roster + tool-agreement check; fix 7 skills' `<allowed>` to include `mess-send`/`mess-fail`; fix drpe CONTRICT typo (C2).

## Non-goals (this cycle)
- Themes D (CI/test gaps incl. D1), E (robustness/optimization), F (doc overclaim) — out of scope unless directly required by A/B/C.

## Path
FULL: GRILL ✅ → SPEC (LeadDev, in progress) → DEVELOP (LeadDev) ⇄ VALIDATE (Validator, 3-cycle cap) → DONE.

## Status
- SPEC: LeadDev producing `.app/SPEC.md`.

## Pending Asks
- [PA-1] 2026-07-09T10:00:00Z origin=elon status=agreed | "Accept recommended defaults: Q1=A, Q2=A."
