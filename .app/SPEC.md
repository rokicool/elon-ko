# Technical Specification — Formalize `wrapper` in the Elon Seat Framing

**Source of truth:** `.app/REQ.md` (all decisions closed: PA-1 9-agent roster sync, PA-2 Wrapper-in-DONE, PA-3 ask-first go/no-go, PA-4 authority ratified as-is). This Spec is implementable as-is; every excerpt below was read from the working tree this session.

**Nature of change:** documentation/markdown wording edits + one mirror resync. Zero TypeScript changes. Zero runtime-behavior changes.

---

## 1. Situation

The elon-ko gate ships a bundled advisory seat-framing (`src/append-system.default.md`, injected once per session by `src/enforce-orchestrator.ts:89-95,186-201`) that still describes a 6-agent, release-less team, while the real gate `TEAM` allowlist (`src/enforce-orchestrator.ts:61-71`) has 9 spawnable agents incl. `wrapper` since v2.2.0. Separately, the canonical elon skill's DONE phase (`plugins/agents/skills/elon/SKILL.md:211`) auto-spawns Wrapper when a release is indicated; PA-3 requires ask-first user consent. This change syncs the framing (Q1+Q2) and flips the trigger clause (Q3), touching exactly four paths.

## 2. Verified Baseline (evidence, this session)

| Path | sha256 (first 8) | Size | State |
|---|---|---|---|
| `src/append-system.default.md` | `00b0459a` | 5229 B, 52 lines | stale framing: 6-agent list (lines 9–14), release-less pipeline (line 16) |
| `scaffold/APPEND_SYSTEM.md` | `0c57dc37` | 4642 B, 43 lines | **stale AND non-identical** — see Drift Note |
| `plugins/agents/skills/elon/SKILL.md` | `74674d44` | 266 lines | line 211 = DONE phase, auto-spawn trigger |
| `.agents/skills/elon/SKILL.md` | `74674d44` | 266 lines | byte-identical to plugins copy (pair intact) |

- Working tree clean (`git status --porcelain` empty) at spec time.
- `npm run typecheck` = `tsc --noEmit`; `npm test` = `node --test src/*.test.ts`.
- No test pins framing or scaffold text (grep over `src/*.test.ts`: zero hits).
- No non-test code references `scaffold/`; `scaffold/` is NOT in `package.json files:["src","rules"]` — it is a template, not shipped runtime code.

> **Drift Note (verified deviation from REQ's premise):** REQ B2 calls the scaffold copy "byte-identical stale". In fact `diff src/append-system.default.md scaffold/APPEND_SYSTEM.md` is non-empty today: scaffold is missing the source's "## Idea/suggestion storage" section (source lines 39–47, 587 bytes). FR-3/AC-2 require post-change byte-identity, so the mirror sync MUST be a wholesale copy, which additionally closes this pre-existing drift. This is in-scope (scaffold is one of the four paths, FR-7 intact) but the scaffold's git diff will show the IDEAS section appearing alongside the wrapper edits. Disclosed here so validation is not surprised; REQ is not edited.

## 3. Architecture Overview

```
                     ┌──────────────────────────────────────────────┐
   session_start ───▶│ src/enforce-orchestrator.ts (GATE — NO-OP)   │
                     │  reads src/append-system.default.md          │
   <cwd>/.omp/APPEND_SYSTEM.md override ── (absent in this repo)    │
                     └──────────────┬───────────────────────────────┘
                                    │ injects as advisory message
                                    ▼
              src/append-system.default.md ──cp──▶ scaffold/APPEND_SYSTEM.md
              (EDIT A: roster + DONE bullet)      (mirror, byte-identical)

              plugins/agents/skills/elon/SKILL.md:211 ──cp──▶ .agents/skills/elon/SKILL.md:211
              (EDIT B: ask-first trigger clause)             (mirror, byte-identical)

   GUARD RING (untouched): gate TEAM · mess-transport.ts · marketplace.json ·
   wrapper defs/skills · skill :149/:246 · PROTO.md · AGENTS.md · README · DEVREADME
```

Two independent edit units (A: framing pair, B: skill pair), each with a mirror relationship inside the unit. No cross-unit dependencies → reviewable and committable separately.

## 4. Non-goals / Guard Ring (MUST NOT change)

Everything in REQ Inventory A: `src/enforce-orchestrator.ts`, `src/mess-transport.ts`, `.omp-plugin/marketplace.json`, `plugins/agents/agents/wrapper.md`, `.omp/agents/wrapper.md`, wrapper skill + `.agents` mirror, elon SKILL.md lines other than 211's trigger clause (esp. `:149`, `:246`), `scaffold/PROTO.md`, `scaffold/AGENTS.md`, `README.md`, `.DEVREADME.md`. Also: no new tests, no `.omp/APPEND_SYSTEM.md` creation, no RELEASE phase or phase-structure change, no budget changes (3-cycle DEVELOP⇄VALIDATE, 2-cycle PURECODE), no edits to `.app/REQ.md`.

## 5. Edit A — `src/append-system.default.md` (+ mirror `scaffold/APPEND_SYSTEM.md`)

### 5.1 Team list 6 → 9 (item 2 of "What you do")

**Before** (current lines 8–14):
```markdown
2. **Delegate** to exactly one team agent per turn unless the work is provably independent and parallel-safe. Every delegation uses `task(agent="<name>", context="skill://<name>", assignment="...")`:
   - `reqguru` — clarify/refine requirements (GRILL).
   - `drpe` — research technology, APIs, libraries; answer factual technical questions.
   - `leaddev` — design specs, implement, review, integrate, fix validation issues. LeadDev further delegates implementation to `middev`.
   - `validator` — audit an implementation against its spec.
   - `docworm` — write/update documentation.
   - `hr` — define and register a new agent role.
```

**After** (insert `purecode` after `validator`; append `wrapper`, `debugger` after `hr` — gate `TEAM` order `reqguru, drpe, leaddev, validator, purecode, docworm, hr, wrapper, debugger`):
```markdown
2. **Delegate** to exactly one team agent per turn unless the work is provably independent and parallel-safe. Every delegation uses `task(agent="<name>", context="skill://<name>", assignment="...")`:
   - `reqguru` — clarify/refine requirements (GRILL).
   - `drpe` — research technology, APIs, libraries; answer factual technical questions.
   - `leaddev` — design specs, implement, review, integrate, fix validation issues. LeadDev further delegates implementation to `middev`.
   - `validator` — audit an implementation against its spec.
   - `purecode` — post-validation code-cleanliness review; recommends refactors.
   - `docworm` — write/update documentation.
   - `hr` — define and register a new agent role.
   - `wrapper` — cut and publish releases; conditional DONE step (see item 4).
   - `debugger` — root-cause CI/runtime failures on demand; read-only report.
```

Fulfills FR-1. The leaddev/drpe/reqguru/validator/docworm/hr glosses are byte-unchanged.

### 5.2 Wrapper bullet under item 4 (pipeline line)

**Before** (current line 16, unchanged first sentence):
```markdown
4. **Chain** phases per the workflow protocol in `skill://elon` (FULL: REQUEST → GRILL → [RESEARCH] → SPEC → DEVELOP ⇄ VALIDATE → DONE). Enforce the 3-cycle limit on DEVELOP ⇄ VALIDATE.
```
**After** (item 4 line byte-unchanged; one sub-bullet appended directly beneath it):
```markdown
4. **Chain** phases per the workflow protocol in `skill://elon` (FULL: REQUEST → GRILL → [RESEARCH] → SPEC → DEVELOP ⇄ VALIDATE → DONE). Enforce the 3-cycle limit on DEVELOP ⇄ VALIDATE.
   - Wrapper is a conditional release step **inside DONE, post-PASS** — no new RELEASE phase; DONE stays terminal. If the change is being released (needs a version bump + tag), put a go/no-go ask to the user before spawning Wrapper (no release without consent); otherwise skip Wrapper with a noted reason.
```

Fulfills FR-2: pipeline arrow string untouched and still terminal at DONE; the wrapper notion lives in the sub-bullet; post-PASS positioning matches `skill://elon` and `scaffold/PROTO.md:254-262`. Wording is advisory (describes protocol behavior, asserts no enforcement of its own — FR-6/NFR-3).

### 5.3 Everything else in the file byte-unchanged

Lines 1–7, 15, 17–52 (headings, "What you never do", protocol paragraph, dot-agreement token, IDEAS section, advisory footer) untouched.

## 6. Edit B — `plugins/agents/skills/elon/SKILL.md:211` (+ mirror `.agents/skills/elon/SKILL.md:211`)

### 6.1 Trigger-clause rewrite (clause-only, single line)

**Before** — full current line 211:
```xml
  <phase name="DONE">Validator returned PASS and PureCode returned code-fine (FULL path). Evaluate whether DocWorm is needed (conditional). Evaluate whether Wrapper is needed: if the change is being released (needs a version bump + tag), spawn Wrapper to cut and publish the release; otherwise skip with a noted reason. (Debugger is on-demand/cross-phase and needs no DONE block.) Present final deliverable.</phase>
```

**After** — full replacement line 211 (prefix and suffix sentences byte-identical; only the bolded middle clause is new; bold is annotation, not file content):
```xml
  <phase name="DONE">Validator returned PASS and PureCode returned code-fine (FULL path). Evaluate whether DocWorm is needed (conditional). **Always consider whether Wrapper is needed: if the change is being released (needs a version bump + tag), first put a pending go/no-go ask to the user (a status=pending entry under ## Pending Asks in .app/PROJECT.md — a trimmed "." reply expresses consent) and spawn Wrapper only if the user consents — never publish a release without explicit consent; if the user declines, or the change is internal-only, skip Wrapper with a noted reason.** (Debugger is on-demand/cross-phase and needs no DONE block.) Present final deliverable.</phase>
```

Semantics delivered (PA-3 / FR-4): always-consider ✓ · pending ask BEFORE spawn ✓ · no release without consent ✓ · decline/internal-only → skip with noted reason ✓ · dot-agreement mechanics anchored (`.app/PROJECT.md` `## Pending Asks`, `.` token) ✓. No backticks introduced (phase elements in this file use plain text). Phase placement, Debugger note, DocWorm clause, and "Present final deliverable" untouched. No other line of either skill copy changes.

### 6.2 Unchanged guards in the same file (for reviewer orientation)

- `:149` routing-table Wrapper row — byte-unchanged.
- `:246` agent-registry Wrapper row ("On demand in DONE.") — byte-unchanged.

## 7. Mirror Sync & Byte-Identity Procedure

Mechanism: **edit the source, then `cp` over the mirror** (never parallel-edit a pair; drift is the failure mode this procedure exists to kill).

```bash
# 1. Edit source files (§5.1, §5.2 → framing; §6.1 → skill)
# 2. Mirror by wholesale copy:
cp src/append-system.default.md scaffold/APPEND_SYSTEM.md
cp plugins/agents/skills/elon/SKILL.md .agents/skills/elon/SKILL.md
# 3. Verify byte-identity (all three must hold):
diff scaffold/APPEND_SYSTEM.md src/append-system.default.md      # → no output, exit 0
diff .agents/skills/elon/SKILL.md plugins/agents/skills/elon/SKILL.md  # → no output, exit 0
shasum -a 256 src/append-system.default.md scaffold/APPEND_SYSTEM.md plugins/agents/skills/elon/SKILL.md .agents/skills/elon/SKILL.md
#    → exactly two distinct hashes, each appearing twice (pair-matched)
```

Note: step 2's framing `cp` intentionally also delivers the IDEAS section (source lines 39–47) to the scaffold, closing the pre-existing drift documented in §2 — this is what makes AC-2's empty diff achievable.

## 8. Interface Contracts (text contracts)

| Contract | Content | Enforced where |
|---|---|---|
| Roster enumeration | Framing team list enumerates exactly the 9 gate-`TEAM` agents, no more, no less | FR-1; consistency with `src/enforce-orchestrator.ts:61-71` |
| Trigger semantics | Wrapper spawn requires a prior user go/no-go pending ask; release never happens without consent; decline/internal-only → skip with noted reason | FR-4; canonical at SKILL.md:211, framed advisorially at framing bullet |
| Division of truth | Framing names role + DONE position; canonical semantics live in `skill://elon` (framing already defers); framing must not contradict skill/PROTO/gate | FR-2, AC-7 |
| Advisory envelope | Framing asserts no enforcement of its own; hard-enforcement attribution stays with the gate + frontmatter (existing footer pattern) | FR-6, NFR-3 |
| Mirror invariants | Two byte-identical pairs post-change (drift rule, `scaffold/PROTO.md:334`) | FR-3, FR-5, NFR-1 |
| Blast radius | Exactly four paths in the implementation diff | FR-7 |

## 9. Data Models

No structured data. The relevant "model" is file identity:

- Pair 1: `src/append-system.default.md` ≡ `scaffold/APPEND_SYSTEM.md` (single sha256).
- Pair 2: `plugins/agents/skills/elon/SKILL.md` ≡ `.agents/skills/elon/SKILL.md` (single sha256).
- Consumed as raw UTF-8 string by `enforce-orchestrator.ts` `readFileSync(...,"utf8")` — no parsing, no line-number coupling; content-only change is safe.

## 10. Build & Delegation Sequencing (DEVELOP phase)

Single MidDev delegation (the four paths share two mirror invariants; splitting invites drift, and each file's change is <20 lines). LeadDev reviews, verifies, commits.

**MidDev assignment shape** (`task(agent="middev", context="skill://middev")`):
- Target: the four paths; exact before/after excerpts from §5–§6 verbatim.
- Change: apply §5.1+§5.2 to the framing source; apply §6.1 to the plugins skill; run the two `cp` commands from §7.
- Acceptance: §7 byte-identity commands green; no other file touched.
- Non-Goals: guard ring (§4); no rewording beyond the quoted excerpts; no trailing-whitespace or reflow drive-bys.

**LeadDev integration sequence after MidDev returns:**
1. `git status --porcelain` → only the four paths (+ any Elon-owned `.app/` artifacts, ignored).
2. `git diff -U0` each path; confirm framing hunks only at items 2/4 and skill hunk only at line 211.
3. Run the §7 identity checks + full validation matrix (§11).
4. `npm run typecheck && npm test` (AC-6).
5. Commit as two logical units:
   - `[SPEC §5] Sync seat framing to 9-agent roster + Wrapper-in-DONE bullet; resync scaffold mirror`
   - `[SPEC §6] Ask-first go/no-go for Wrapper at DONE (skill + .agents mirror)`
6. Report changed files, verification output, commit SHAs to Elon → VALIDATE.

If MidDev returns CLARIFICATION: answer from this Spec; escalate to Elon only if a user decision emerges (none expected — REQ has zero open questions).

## 11. Validation Matrix (AC-1…AC-7 → concrete checks)

Baseline anchor: `BASE=$(git rev-parse HEAD)` recorded before any edit.

| AC | Concrete check | Pass signal |
|---|---|---|
| AC-1 | `sed -n '8,17p' src/append-system.default.md` — inspect item 2 (9 agent bullets); `sed -n '19,20p'` — inspect item 4 + wrapper sub-bullet; `grep -n 'REQUEST → GRILL' src/append-system.default.md` | Item 2 lists all 9 names in gate-TEAM order (`reqguru drpe leaddev validator purecode docworm hr wrapper debugger`); wrapper bullet says inside DONE/post-PASS/ask-first; item 4's pipeline string still ends `VALIDATE → DONE)`; no "RELEASE" phase token anywhere |
| AC-2 | `diff scaffold/APPEND_SYSTEM.md src/append-system.default.md; echo $?` | Empty output, exit 0 (§3 hash pair-match corroborates) |
| AC-3 | `git diff -U0 -- plugins/agents/skills/elon/SKILL.md` | Exactly one hunk `@@ -211 +211 @@`; new line contains "pending go/no-go ask", "before"/"first" ordering, and "never publish a release without explicit consent"; old auto-spawn string absent; `git diff -- plugins/agents/skills/elon/SKILL.md \| grep -E '^[-+]...' \| grep -cE ':149\|Ship a release'` = 0 (guards intact) |
| AC-4 | `diff .agents/skills/elon/SKILL.md plugins/agents/skills/elon/SKILL.md; echo $?` | Empty output, exit 0 |
| AC-5 | **Tripwire:** `git diff --name-only "$BASE" \| grep -v '^\.app/'` → exactly the four paths; negative probe: `git diff --name-only "$BASE" -- src/enforce-orchestrator.ts src/mess-transport.ts .omp-plugin/marketplace.json scaffold/PROTO.md scaffold/AGENTS.md README.md .DEVREADME.md plugins/agents/agents/wrapper.md .omp/agents/wrapper.md` | Tripwire lists exactly: `src/append-system.default.md`, `scaffold/APPEND_SYSTEM.md`, `plugins/agents/skills/elon/SKILL.md`, `.agents/skills/elon/SKILL.md`; negative probe empty; per-commit `git show --name-only --format= <sha>` likewise scoped |
| AC-6 | `npm run typecheck && npm test` | Both exit 0, output unchanged from baseline (no TS touched) |
| AC-7 | Cross-read (Validator inspection): framing roster set vs gate `TEAM` (`src/enforce-orchestrator.ts:61-71`); framing bullet + skill:211 vs `scaffold/PROTO.md:254-262` | No contradiction on: roster membership, DONE-terminal position, post-PASS timing, ask-first consent, budget non-consumption |

Additional negative probe (auto-spawn eradication): `grep -rn "spawn Wrapper to cut and publish" plugins/ .agents/ src/` → zero matches.

## 12. Rollback

`git revert` of the two implementation commits restores both mirror pairs to the pre-change state (the scaffold `cp` reverts with Edit A's commit; the pre-existing IDEAS drift re-appears — acceptable, it is the historical state). No data, config, or runtime migration involved.
