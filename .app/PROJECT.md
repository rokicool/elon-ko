# PROJECT.md — Idea/Suggestion Storage Extension

## Brief
Analyze the agent-communication protocol (`skill://elon`) and design an extension
for **ideas/suggestions storage** under `.app/`: capture worthwhile-but-out-of-
scope work, persist it, let Elon remind the user about relevant stored ideas, and
allow promotion of an idea into the FULL workflow.

## Classification
**FULL** — new orchestrator-protocol extension (Plugin A code + advisory prose).

## Workflow Path
FULL: REQUEST → GRILL → RESEARCH → SPEC → DEVELOP ⇄ VALIDATE → DONE

## Current Phase
**VALIDATE** — Validator auditing the implementation against `.app/SPEC.md` +
AC1–AC14. (DEVELOP complete: 5 files across commits 990794e/508b2bd/66fe5c1/789382e;
typecheck + 96/96 tests pass; R-U4 + R-U8 resolved with evidence.)

## DEVELOP — landed changes
- `src/idea-storage.ts` (NEW, 990794e + customType fix 508b2bd): hook + commands + pure fns; `import {optedIn}`; `node:fs` read-only; zero deps.
- `src/idea-storage.test.ts` (NEW, 990794e + 4 cmd tests 508b2bd): 41 cases.
- `package.json` (990794e): 5th `omp.extensions` entry; 0 deps.
- `plugins/agents/skills/elon/SKILL.md` (66fe5c1): `<idea_storage>` block.
- `src/append-system.default.md` (789382e): companion paragraph.
- `.app/IDEAS.md`: deliberately absent (runtime-only, DocWorm-created).
- Verification: `tsc --noEmit` PASS (strict); `node --test` 41/41 new, 96/96 full (no regressions).
- R-U4: omp `write` NON-atomic (direct `Bun.write`, no temp+rename); fail-safe parser is the operative guarantee (tested corrupt→[]→no-injection). No contract change.
- R-U8: CONFIRMED — `sendMessage({triggerTurn:true})` schedules a continuation turn; no fallback applied.
- Spec defects resolved (tolerant/additive): §5.1/§5.4 H1/H2 → tolerant ATX heading; §7.3 tag-tokenization no-op → tags tokenize identically (prose intent).

## Residual concerns for VALIDATE
1. Two spec-defect fixes are judgment calls (tolerant supersets) — confirm they honor SPEC intent (NFR3, R3.2).
2. R-U4 torn-read: confirm hook never injects on a torn read.
3. End-to-end command→Elon delivery confirmed by source inspection, not a live-process test; pure builders + wiring are unit-tested.
4. Lifecycle/listing uses a generic `elon-ko-gate:idea-steer` discriminator; SPEC pins only capture/reminder customTypes — opine if distinct per-op customTypes preferred (wire-filtering detail).

## Phase Log
- 2026-06-27 REQUEST → GRILL r1 → GRILL gate (dc2fbb5) → RESEARCH gate (c27854b) → PA-1 (39724f9) → SPEC gate (9e4b0e1).
- 2026-06-27 DEVELOP — LeadDev→MidDev implemented (990794e, 508b2bd, 66fe5c1, 789382e); typecheck + tests pass.
- 2026-06-27 VALIDATE — Validator delegated against SPEC + AC1–AC14.

## Pending Asks
- [PA-1] 2026-06-27 origin=elon status=agreed | "Accept §6 assumptions + proceed to SPEC." (accepted)
