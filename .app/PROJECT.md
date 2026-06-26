# PROJECT — Elon Protocol Modification

## Objective
Two changes to the orchestrator plugin suite shipped from THIS repo (`omp-agent-gate` = Plugin A; `orchestrator-agents` = Plugin B):

1. **C1 — Dot agreement token.** A lone `.` reply = agree with the most-recent pending proposal (any origin) and proceed.
2. **C2 — File-based inter-agent messaging, as cross-instance IPC.** In-app (`irc`) primary when co-located; file transport in `.app/mess/` (→ `arc/`) only when the receiver runs in a different omp instance.

## Workflow Path: FULL
| Phase | Status | Owner | Artifact / Commits |
|---|---|---|---|
| REQUEST | ✅ | Elon | `.app/PROJECT.md` |
| GRILL | ✅ `2034c6f` | ReqGuru | `.app/REQ.md` |
| RESEARCH | ✅ | DrPe | `.app/RESEARCH.md` |
| SPEC | ✅ `a2ef82e` | LeadDev | `.app/SPEC.md` |
| DEVELOP | ✅ build CLEAN, 63/63 tests pass | LeadDev→MidDev | `99fcef3` `47b2f6c` `6c3cbf1` `f357888` `b346eab` |
| **VALIDATE** | ⏳ in progress | Validator | — |
| DONE | pending | — | — |

## DEVELOP deviations + Elon resolutions (authoritative)
- **I1/D2 (`. ` trim contradiction):** BEHAVIOR = trim-based (`trim(reply)==="."` → agreement; ` . `/`. ` ARE agreement). Code correct per adopted default + user intent. REQ R1.4 AC example & SPEC §10 note are DOC inconsistencies → clean up.
- **D1 (`resolveAgentId` async):** ACCEPTED — dynamic import is async; verify correct `await` usage.
- **I3 (no standalone `mess-done`):** ACCEPTED — completion via `mess-send`+`inReplyTo` (§7); PROCESSED transition (R2.6) via reply path.
- **I2 (import type + lazy dynamic import):** ACCEPTED — node_modules `.ts` limitation workaround.
- **I5 (PROJECT.md / package-lock.json / scaffold/* untouched):** CORRECT — out of SPEC scope.

## Key Facts (verified)
- Repo IS source of both plugins — gate, `APPEND_SYSTEM`, agent frontmatter, `skill://elon` all editable here.
- Detection built via turn-scan + 2s idle-poll + `session_stop`; `mkdir`-claim (time-based staleness); same-volume `fs.rename` atomic; no runtime deps.
- Fallback trigger = `irc` `{outcome:"failed",...}`; instance id SUPPLIED (env▸manifest▸uuid); `IrcBus.send` id-exact → `resolveAgentId`.
- **P2 RESOLVED (user): same machine / shared local filesystem.**

## Accepted SPEC-phase decisions
Q7.1 read-only agents gain *constrained* `.app/mess/` writes; P4 2000ms poll / 300000ms claim-stale; C1 = advisory text + best-effort `before_agent_start` hook.
