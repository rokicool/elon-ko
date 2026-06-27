# Requirements Document — Elon Protocol Extension: Idea Storage

**Status:** Draft for SPEC (round-2 synthesis)
**Author:** ReqGuru (delegated by Elon)
**Date:** 2026-06-27
**Extends:** `skill://elon` (orchestrator protocol), interoperating with the `enforce-orchestrator`, `dot-agreement`, `mess-transport`, and `orchestrator-agents` extensions.

---

## 1. Overview

This extension adds a lightweight **idea/suggestion storage** layer to the Elon orchestrator protocol. When the user or an agent identifies something worth implementing but it is out of scope for the current workflow, the protocol captures it as a structured, human-editable, git-committable record in `.app/IDEAS.md`. Elon can later **remind** the user about stored ideas when a new request relates to them, and any idea can be **promoted** into a fresh Requirements Document to launch the FULL workflow. The design mirrors the layered enforcement model already used by `dot-agreement` (advisory protocol prose in `skill://elon` + a hard turn-start hook), and respects the existing write-ownership boundaries (Elon writes only `PROJECT.md`; DocWorm owns documentation/artifact writes).

## 2. Background

The user's original request (verbatim):

> "Analyze the protocol of the agents communications and suggest an extension that would support ideas/suggestions storage. So, if something worth implementing, but right now we are working on something else, the protocol should STORE the idea in .app folder for the future implementations. and Elon can remind user about previously created ideas."

Round-1 grill resolved five decision forks (A–E). Those resolutions are **LOCKED requirements** (§4) and are not re-opened by this document. The remaining spec-level detail deferred in round 1 is synthesized here as **flagged assumptions** (§6) for user override before SPEC.

## 3. Goals

1. **Capture** worthwhile tangents without derailing the active workflow — from both the user (natural language or `/idea`) and autonomous agents (guarded).
2. **Persist** ideas in a single, human-editable, git-committable file under `.app/`, with one structured block per idea.
3. **Remind** the user about relevant stored ideas, proactively (turn-start) and on-demand (`/ideas`), using boring/debuggable matching.
4. **Promote** an idea into the FULL workflow when its time comes, while preserving the original record for audit.
5. **Enforce** the behavior through the same layered model as `dot-agreement`: advisory prose in `skill://elon` plus a hard turn-start hook.
6. **Preserve** all existing protocol invariants: Elon's `write` scope stays `PROJECT.md`-only; DocWorm remains the sole writer of documentation/artifact files; single-spawner (Elon) and single-writer-per-file invariants are not violated.

## 4. Locked Requirements (forks A–E — non-negotiable)

### R1. Capture model — BOTH paths (fork A)
- **R1.1** The user may store an idea via a natural-language phrase OR an explicit `/idea <text>` slash command.
- **R1.2** Autonomous agents (LeadDev, MidDev, DrPe, Validator, DocWorm) MAY proactively park a clearly-worthwhile tangent they encounter while working. This is **guarded**, not unconditional — agents must apply a judgment rubric, not park every passing thought.
- **R1.3** Every successful capture **acks immediately** to the originator (the user for user-initiated; surfaced in Elon's next reply for agent-initiated).

### R2. Storage layout + write ownership (fork B)
- **R2.1** Storage is a **single file**: `.app/IDEAS.md`.
- **R2.2** It is **append-style**: one structured block per idea, newest appended at the end.
- **R2.3** It is **human-editable** and **git-committable** via the `[PROTO]` convention (same as other `.app/` artifacts).
- **R2.4** **Writes are owned by DocWorm.** Elon's enforced `write` scope remains `PROJECT.md`-only; Elon does NOT write `.app/IDEAS.md` directly. (See §5 for the delegation flow that makes this feasible.)

### R3. Reminder behavior (fork C)
- **R3.1** **Proactive reminders:** when a new user request relates to a stored idea, Elon emits a **one-line pointer** (capped at **1–2** reminders per turn).
- **R3.2** **Matching is boring/debuggable:** keyword/tag-overlap (set intersection), **NOT** semantic vectors.
- **R3.3** **On-demand listing:** `/ideas` surfaces stored ideas on request.
- **R3.4** **Opt-out flag** exists; when set, no proactive reminders are emitted.

### R4. Enforcement model — BOTH layers (fork D)
- **R4.1** **Advisory layer:** an `idea_storage` block is added to `skill://elon` documenting the capture/remind/promote behavior in prose.
- **R4.2** **Hard layer:** a turn-start hook (mirroring `dot-agreement`'s `before_agent_start` injection) injects related ideas into Elon's context and/or surfaces reminders. This is the load-bearing enforcement; the prose alone is insufficient.
- **R4.3** The two layers are complementary, exactly as `dot-agreement` pairs advisory prose with the `dot-agreement` hook.

### R5. Lifecycle — distinct from Pending Asks; promotion preserves audit (fork E)
- **R5.1** Ideas are **DISTINCT** from Pending Asks. Pending Asks (the `.` token mechanism) are deferred *current* decisions; Ideas are *future* work. The two MUST NOT be merged.
- **R5.2** An idea can **PROMOTE** into a fresh `.app/REQ.md`, launching the FULL workflow (REQUEST → GRILL → …).
- **R5.3** On promotion, the idea's `status` is set to `promoted` and the idea block is **KEPT** in `.app/IDEAS.md` for audit (not deleted, not moved).

## 5. Core Interaction: Capture → DocWorm Write Delegation (B × A × D)

Because `.app/IDEAS.md` writes are owned by DocWorm (R2.4) and Elon's `write` scope is `PROJECT.md`-only, every capture is a **delegation through Elon as funnel, DocWorm as sole writer**. This preserves both the single-spawner invariant (only Elon spawns DocWorm) and the single-writer-per-file invariant (only DocWorm writes IDEAS.md). Subagents cannot write IDEAS.md directly; they funnel suggestions through their returned output.

### 5.1 User-initiated capture (R1.1)

1. **Detect.** On a user turn, Elon detects capture intent via either (a) the literal `/idea <text>` slash command, or (b) a small documented set of natural-language trigger phrases (ASSUMPTION, see §6.1).
2. **Immediate ack.** Elon acks the user **in the same reply, before delegation**: a single line confirming capture is in progress (satisfies R1.3 from the user's POV — the ack is synchronous).
3. **Delegate append.** Elon spawns DocWorm via `task` with: the idea text, a proposed short title, proposed tags, `source=user`, and the instruction to **APPEND** a new structured block to `.app/IDEAS.md` (creating the file if absent), assigning the next sequential `IDEA-NNN` id and `status=parked`.
4. **Confirm.** DocWorm returns the assigned `IDEA-NNN`. Elon includes the id and title in his final reply: e.g., "📌 Parked as IDEA-007: <title>."

### 5.2 Agent-initiated (autonomous) capture (R1.2)

Subagents cannot write IDEAS.md. They surface tangents via their **returned output** to Elon, who is the funnel.

1. **Guarded identification.** While working, a subagent identifies a clearly-worthwhile tangent it should NOT pursue now. It applies a documented judgment rubric (ASSUMPTION, see §6.2) — guarded, not every thought.
2. **Structured signal in output.** The agent includes a fenced `idea-suggest` block in its deliverable to Elon, containing: `title`, `body`, `tags`, and `rationale` (why worth parking, not pursuing now). Format specified in §7.2.
3. **Elon-side veto.** Elon reviews the suggestion. If he judges it clearly worthwhile → acks and delegates the append to DocWorm (same flow as §5.1 step 3–4). If he judges it noise → **silently drops it** (no ack, no write). The agent-side rubric plus Elon-side veto form a **double guard** satisfying R1.2's "guarded, not every thought."
4. **User surfacing (ASSUMPTION, see §6.3).** Elon surfaces agent-initiated captures that he promoted to parked in his next reply to the user. Dropped suggestions are not surfaced (no noise).

### 5.3 Immediate-ack guarantee across the hop (R1.3)

- **User-initiated:** Elon's ack in §5.1 step 2 is in the same turn as the user's request → immediate from the user's POV.
- **Agent-initiated:** the agent has already "noted" the tangent in its own output (that note IS the ack to itself and to Elon). Elon's subsequent user-facing reply optionally surfaces the promoted park. The hop latency is bounded by one agent round-trip, which is the inherent cost of the delegation model.

### 5.4 Promotion flow (R5.2, R5.3)

1. **Trigger.** Promotion is requested by the user (`/idea promote IDEA-NNN` or natural language) or proactively suggested by Elon (e.g., when a reminder gets repeated positive uptake).
2. **Status update first (audit anchor).** Elon delegates to DocWorm to update the idea block: `status=promoted`, `promoted_to=.app/REQ.md`, `promoted_at=<ISO date>`. The block STAYS in IDEAS.md (R5.3).
3. **Seed REQ.md.** Elon delegates to ReqGuru with the idea block as seed context to produce the new `.app/REQ.md` for the FULL workflow. The idea's content is **copied** into REQ.md (REQ.md is the working doc; the IDEAS.md entry is the audit anchor).
4. **Conflict handling (ASSUMPTION, see §6.4).** If a FULL workflow with an existing REQ.md is already active, promotion is **queued**: Elon records a Pending Ask to confirm context-switch at the next natural breakpoint, rather than clobbering the active REQ.md.

## 6. Assumptions (deferred spec-level detail — flagged for user override)

Each assumption below is a sensible default grounded in the locked forks and the existing protocol. The user may override any of them before SPEC; otherwise SPEC takes them as input.

### 6.1 ASSUMPTION — Natural-language trigger phrases for user capture
The natural-language capture path (R1.1) is recognized via a small, documented set of lead phrases, e.g.:
- `idea: …`, `park this idea: …`, `we should … later`, `future idea: …`, `remember to …`
Elon is an LLM and detects these; the explicit `/idea` command is the unambiguous fallback. **Rationale:** R1.1 requires both paths; the phrases make the NL path debuggable without over-capturing. SPEC finalizes the exact phrase list.

### 6.2 ASSUMPTION — Agent autonomous-capture rubric
The guarded rubric an agent applies before emitting an `idea-suggest` block (R1.2):
- (a) Out of the current task's scope (would expand it), AND
- (b) Plausibly valuable (not a passing curiosity, not a question, not a nit), AND
- (c) Specific enough to act on later (not vague hand-waving).
All three required. Combined with Elon's veto (§5.2 step 3), this yields the "guarded, not every thought" behavior. SPEC may refine the rubric wording.

### 6.3 ASSUMPTION — Surfacing of agent-initiated captures
Elon surfaces agent-initiated captures **only when he promotes them to parked**. Dropped suggestions are not mentioned to the user (avoids noise). The user can always audit via `/ideas` or by reading `.app/IDEAS.md`.

### 6.4 ASSUMPTION — Promotion conflict with an active REQ.md
If a promotion is requested while another FULL workflow's REQ.md is active, Elon does NOT clobber it. He records a Pending Ask (using the existing `## Pending Asks` mechanism) to confirm context-switch at the next natural breakpoint. The user may agree with `.`.

### 6.5 ASSUMPTION — Status state-machine
Idea statuses and transitions:
```
                 ┌─────────── parked (initial, on capture) ───────────┐
                 │              │            │                          │
                 ▼              ▼            ▼                          │
            promoted      rejected    superseded                        │
           (terminal,    (terminal,   (terminal,                        │
            audit-kept)   re-openable)  points to newer)                │
                          └─► parked (re-open)                          │
```
- **`parked`** — entry status on every capture (R2.2 append).
- **`promoted`** — set on promotion (R5.2/R5.3). Terminal. `promoted_to` + `promoted_at` populated.
- **`rejected`** — user explicitly declines. Terminal, but **re-openable** → `parked`.
- **`superseded`** — merged into a newer idea. Terminal. `superseded_by=IDEA-NNN` populated.
No other transitions. SPEC defines field representation, not new states.

### 6.6 ASSUMPTION — Per-idea schema field set
Each structured block in `.app/IDEAS.md` carries these fields (REQ fixes the field set; SPEC fixes the byte-level encoding, which must remain human-editable per R2.3):

| Field | Required | Description |
|---|---|---|
| `id` | yes | `IDEA-NNN`, monotonic, zero-padded to 3 digits. |
| `created` | yes | ISO 8601 UTC timestamp at capture. |
| `source` | yes | One of `user`, `/idea`, or `<agent-name>` (the autonomous path). |
| `title` | yes | Short human label, ≤ 80 chars. |
| `body` | yes | The idea itself, markdown. |
| `tags` | yes | ≤ 5 lowercase kebab-case tokens; used by the matcher (R3.2). |
| `status` | yes | From the state-machine (§6.5). Defaults to `parked` on capture. |
| `promoted_to` | no | Set iff `status=promoted`: `.app/REQ.md` reference. |
| `promoted_at` | no | Set iff `status=promoted`: ISO 8601 date. |
| `superseded_by` | no | Set iff `status=superseded`: the newer `IDEA-NNN`. |
| `notes` | no | Append-only free-form dated remarks (see §6.7). |

### 6.7 ASSUMPTION — Notes / discussion
An idea may accrue follow-up remarks via the `notes` field, appended by DocWorm on request (e.g., `/idea note IDEA-007: <text>`). Append-only; no inline edits to prior notes. Keeps the file auditable.

### 6.8 ASSUMPTION — Reminder-config defaults
| Setting | Default | Notes |
|---|---|---|
| Matcher algorithm | Case-insensitive **token-set intersection** after stopword removal, between the new request's tokens and each `parked` idea's `title ∪ tags` tokens. | Boring/debuggable per R3.2. |
| Min overlap to qualify | **1 token.** | Any single shared token surfaces the idea. |
| Ranking | Overlap-count desc, then `created` asc (favor older parked ideas). | Older ideas get priority — they've waited longer. |
| Per-turn cap | **2 reminders** (within R3.1's 1–2 band). | Avoids noise. |
| Opt-out flag location | A single `idea_reminders=off` line in `.app/PROJECT.md` (Elon-owned, writable within his scope). | Toggle via user phrase ("stop reminding me about ideas" / "remind me about ideas"). |
| Hook behavior when opted out | **No-op** — injects nothing. | Clean disable. |
| Stopword list / tokenizer | **SPEC's choice.** REQ fixes only the algorithm class (set-intersection) and the cap. | |

### 6.9 ASSUMPTION — Turn-start hook relatedness input (D)
The hard hook (R4.2) sources its input as follows:
1. **Read** `.app/IDEAS.md`, parse each structured block, keep only `status=parked` entries.
2. **Tokenize** the incoming user request (the new turn's text).
3. **Match** via the §6.8 algorithm.
4. **Inject** the top ≤2 matches into Elon's context as **advisory framing** (mirrors `dot-agreement`'s `before_agent_start` injection).
5. **Surface** — Elon decides whether to emit the one-line pointer to the user (default: yes, if any matches and not opted out).
The hook fires **only on user turns** (when Elon decides what to work on), NOT on agent outputs (mid-workflow turns don't need idea reminders).

### 6.10 ASSUMPTION — `/ideas` listing semantics
- `/ideas` → one-line summary of every **non-terminal** idea (`status=parked`): `IDEA-NNN — <title> [<tags>]`.
- `/ideas all` → includes terminal statuses (`promoted`/`rejected`/`superseded`) for audit, with status badges.

## 7. Input/Output Contracts

### 7.1 User commands
| Command | Effect |
|---|---|
| `/idea <text>` | Explicit capture (R1.1). Elon acks → delegates append to DocWorm → confirms `IDEA-NNN`. |
| `/idea promote IDEA-NNN` | Promote to FULL workflow (§5.4). |
| `/idea note IDEA-NNN: <text>` | Append a dated note (§6.7). |
| `/idea reject IDEA-NNN` | Set `status=rejected`. |
| `/ideas` | List non-terminal ideas (§6.10). |
| `/ideas all` | List all ideas including terminal (audit). |
| "stop reminding me about ideas" / "remind me about ideas" | Toggle `idea_reminders` flag in PROJECT.md (§6.8). |

### 7.2 Agent `idea-suggest` block (autonomous capture signal)
Fenced block in a subagent's returned output to Elon:
```
```idea-suggest
title: <short label>
body: <the idea, markdown>
tags: <comma-separated, ≤5>
rationale: <why worth parking, not pursuing now>
source_agent: <agent-name>
```(end fence)
```
Elon parses this, applies veto (§5.2 step 3), and if accepted delegates the append to DocWorm with `source=<agent-name>`.

### 7.3 DocWorm write delegation (from Elon)
Elon's `task` delegation to DocWorm carries:
- **Operation:** `append` | `update_status` | `append_note`.
- **Payload:** the fields required by the operation (per §6.6).
- **Return contract:** DocWorm returns the affected `IDEA-NNN` and a one-line confirmation. Elon does not write IDEAS.md directly (R2.4).

## 8. Non-Functional Requirements

- **NFR1 — Write-ownership invariant.** Only DocWorm writes `.app/IDEAS.md`. Elon, ReqGuru, LeadDev, MidDev, DrPe, and Validator never write it. (Enforced by existing `tools:`/`spawns:` frontmatter; SPEC must verify DocWorm's tool policy permits the write and no other agent's does.)
- **NFR2 — Single-spawner invariant.** Only Elon spawns DocWorm. Agents do not spawn DocWorm to self-capture.
- **NFR3 — Human-editable.** `.app/IDEAS.md` remains readable and editable by a human with a text editor. Machine re-parse after a human edit MUST succeed (or fail loudly with a located error).
- **NFR4 — Git-friendly.** Append-only writes minimize merge conflicts. `[PROTO]` commits at capture/promotion gates.
- **NFR5 — Boring matching.** The reminder matcher uses no external services, no embeddings, no network. Pure local string/set operations. Debuggable by reading the code.
- **NFR6 — Performance.** Reminder matching runs at turn-start; for typical idea counts (<1000) it must complete in negligible time relative to agent round-trips. No latency budget concern at expected scale.
- **NFR7 — No new agent roles required.** The extension reuses DocWorm (writes), ReqGuru (promotions seed REQ.md), and Elon (funnel + reminders). No HR work needed.
- **NFR8 — Layered enforcement parity.** The hard hook (R4.2) is the load-bearing enforcement; the advisory prose (R4.1) is documented as insufficient alone, exactly as `dot-agreement` is.

## 9. Error Cases

| Case | Expected behavior |
|---|---|
| DocWorm delegation fails (write error, malformed block) | Elon retries once with clarified delegation (per existing error-recovery protocol). If still fails, reports to user; the idea is NOT lost if Elon still holds the text in his reply context. |
| Agent emits a malformed `idea-suggest` block | Elon treats it as noise and drops it silently (no ack, no write). Optionally Elon notes the drop in his reply. |
| `.app/IDEAS.md` is absent on first capture | DocWorm creates it with a minimal header, then appends the first block. |
| `.app/IDEAS.md` is corrupted / unparseable by the hook | Hook logs a located error and injects NO reminders (fail-safe: no false matches). Capture delegations still work (DocWorm appends to the raw file); reminder resumes once parsed. |
| Duplicate idea captured (same title/tags as existing `parked`) | Elon (or DocWorm on delegation) detects near-duplicate by title/normalized-tag-set match and surfaces a Pending Ask: link as `superseded`, or store as new. ASSUMPTION: near-duplicate = same normalized tag set AND >0.8 title token overlap. |
| Promotion requested for a non-existent or non-`parked` `IDEA-NNN` | Elon reports the error; no state change. |
| Promotion requested while REQ.md is active | Queued via Pending Ask (§6.4). No clobber. |
| User opts out of reminders, then asks `/ideas` | On-demand listing still works (R3.3 is independent of R3.4 opt-out). |
| `idea_reminders=off` flag malformed in PROJECT.md | Hook treats absent/malformed as opted-IN (fail-safe: reminders on by default). |

## 10. Non-Goals

- **NG1** Do NOT design the extension's implementation — no hook code, no file-format byte layout, no parser code. That is SPEC's job. REQ fixes only the field set (§6.6) and the algorithm class (§6.8).
- **NG2** Do NOT re-open forks A–E. They are locked.
- **NG3** Do NOT merge Ideas with Pending Asks (R5.1).
- **NG4** Do NOT introduce semantic/vector matching, embeddings, or external services for relatedness (R3.2).
- **NG5** Do NOT grant any new write scope to Elon or to non-DocWorm agents (NFR1, NFR2).
- **NG6** Do NOT add agent-to-DocWorm direct spawning (agents funnel through Elon, §5.2).
- **NG7** Do NOT auto-promote ideas. Promotion is always user-triggered or user-confirmed (Pending Ask).
- **NG8** Do NOT explore unrelated codebase areas; the extension touches only `.app/IDEAS.md` (new), `.app/PROJECT.md` (flag line), and `skill://elon` (advisory block).

## 11. Acceptance Criteria (for the eventual SPEC)

A SPEC derived from this REQ is acceptable iff ALL of the following are testable and pass:

- **AC1 (Capture — user, explicit):** `/idea <text>` results, within one Elon turn, in (a) an immediate ack line to the user, (b) a new `parked` block appended to `.app/IDEAS.md` by DocWorm, (c) a confirmation line with the assigned `IDEA-NNN`. Verified by: turn transcript + IDEAS.md content.
- **AC2 (Capture — user, natural language):** A documented trigger phrase (§6.1) yields the same outcome as AC1. Verified by: same evidence.
- **AC3 (Capture — agent autonomous):** A subagent emitting a well-formed `idea-suggest` block that passes Elon's veto yields an appended `parked` block with `source=<agent-name>` and is surfaced in Elon's next user reply. A block failing the veto yields NO write and NO surfacing. Verified by: agent output transcript + IDEAS.md diff.
- **AC4 (Write-ownership):** Across all capture scenarios, only DocWorm writes `.app/IDEAS.md`. No `write` to IDEAS.md from Elon, ReqGuru, LeadDev, MidDev, DrPe, or Validator appears in any transcript. Verified by: tool-call audit of all agents.
- **AC5 (Reminder — proactive):** Given a `parked` idea whose `title ∪ tags` shares ≥1 token with a new user request, and `idea_reminders != off`, Elon's turn-start context includes the idea and his reply contains a one-line pointer (≤2 such pointers). Verified by: hook injection log + reply text.
- **AC6 (Reminder — opt-out):** With `idea_reminders=off` in PROJECT.md, the hook injects nothing and no pointer appears, regardless of overlap. Verified by: hook log (no-op) + reply text.
- **AC7 (Reminder — on-demand):** `/ideas` lists non-terminal ideas with one-line summaries; `/ideas all` includes terminal statuses. Verified by: reply text.
- **AC8 (Promotion):** `/idea promote IDEA-NNN` sets the block's `status=promoted` with `promoted_to` and `promoted_at`, KEEPS the block in IDEAS.md, and seeds a new `.app/REQ.md`. Verified by: IDEAS.md block + REQ.md content + audit trail intact.
- **AC9 (Promotion conflict):** Promotion requested during an active FULL workflow produces a Pending Ask (no REQ.md clobber). Verified by: PROJECT.md `## Pending Asks` entry.
- **AC10 (Lifecycle separation):** No idea block appears in `## Pending Asks`, and no Pending Ask appears in `.app/IDEAS.md`. The two stores are disjoint. Verified by: grep across both files.
- **AC11 (State-machine validity):** No transition outside §6.5 occurs. Terminal states (`promoted`) are not mutated except by re-open via `rejected`→`parked` (and `promoted` is NOT re-openable). Verified by: state-transition audit on IDEAS.md history.
- **AC12 (Boring matcher):** The reminder matcher is pure local string/set operations — no network, no embeddings, no external process. Verified by: code review of the hook.
- **AC13 (Human-editable + re-parse):** After a manual edit to `.app/IDEAS.md` (e.g., a human adding a tag), the hook re-parses successfully on the next turn; if the edit breaks parsing, the hook emits a located error and injects nothing. Verified by: edit + next-turn behavior.
- **AC14 (Layered enforcement):** Removing the hard hook leaves only advisory prose; the protocol documents this as insufficient (mirroring `dot-agreement`'s documented limit). Verified by: spec text + hook presence.

## 12. Open Questions

None blocking. All deferred spec-level detail is resolved via flagged assumptions in §6 and is overridable by the user before SPEC. If the user accepts the assumptions as-is, SPEC may proceed directly.
