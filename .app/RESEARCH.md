# RESEARCH — Idea/Suggestion Storage Extension: Technical Substrate

> **⚠ NOTE ON SUPERSESSION.** The previous contents of this file were a frozen
> historical snapshot of the *concluded* **Cross-Instance File Transport + Dot
> Agreement Token** epic (researched 2026-06). That epic shipped. Elon's current
> project is the **Idea/Suggestion Storage Extension** (`.app/PROJECT.md`),
> which DrPe was spawned to research. This document replaces the prior snapshot
> wholesale as the active RESEARCH artifact. Where the prior snapshot's facts
> (the omp event catalog, the lock pattern, zero-deps constraint) are reused
> here, they were **re-verified against current `node_modules` source** — not
> trusted from the old memo.

**Phase:** RESEARCH (DrPe, read-only) — feeds LeadDev SPEC. Does NOT re-derive
requirements (locked in `.app/REQ.md`, summarized as A–E in `.app/PROJECT.md`).
**Status:** VERIFIED — every finding cites live source (file:line or URL).
**Scope:** The omp extension/plugin substrate the new idea-storage extension must
integrate with: (1) registration & file shape, (2) the hook system and the exact
text-injection mechanism, (3) `.app/` conventions incl. the proposed `IDEAS.md`,
(4) the config/flag surface for an opt-out, (5) agent `write` boundaries and how
DocWorm gets `.app/IDEAS.md` write ownership. No design/spec/code is produced.

---

## Source inventory (the substrate IS local editable source)

This repo (`~/github/elon-ko`) is the SOURCE of both omp plugins, so every
"fact" below is verifiable live source, not an immutable external binary:
- **Plugin A — `elon-ko-gate`** (npm key; the **extension** plugin): TypeScript
  ESM (`"type":"module"`, `package.json:6`). Extension source under `src/`:
  `enforce-orchestrator.ts`, `dot-agreement.ts`, `mess-transport.ts`,
  `subagent-panel.ts`, `append-system.default.md`. Registered via
  `package.json#omp.extensions` (`package.json:17-19`). Runtime types from
  `@oh-my-pi/pi-coding-agent` (`devDependencies`, `package.json:13-16`).
- **Plugin B — `elon-ko-agents`** (marketplace plugin; the **agent roster**):
  rooted at `plugins/agents/` (`marketplace.json:8,11-19`). Agent definitions at
  `plugins/agents/agents/*.md` (frontmatter `tools:`/`spawns:`); skills at
  `plugins/agents/skills/<name>/SKILL.md`. There is **no `elon.md` agent
  definition** — Elon is the root interactive session, not a spawned agent.
- The omp SDK types live at `node_modules/@oh-my-pi/pi-coding-agent/src/...`
  (**installed** — re-read for this memo).

---

## Findings

### Dimension 1 — Extension / plugin registration & file shape

**F1.1 — Extensions register via `package.json#omp.extensions`.**
- `package.json:17-19`: `"omp": { "extensions": ["./src/enforce-orchestrator.ts", "./src/mess-transport.ts", "./src/dot-agreement.ts", "./src/subagent-panel.ts"] }`. An array of paths to `.ts` modules.
- `node_modules/@oh-my-pi/pi-coding-agent/src/extensibility/extensions/types.ts:1240-1241`: `export type ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>;`
- `src/enforce-orchestrator.ts:121`: `export default function enforceOrchestrator(pi: ExtensionAPI): void {`. The **default export** is the factory; omp calls it with the `ExtensionAPI`.
- **Confidence: High** (verified in live source).

**F1.2 — The factory shape & loading model.**
- The factory receives ONLY `pi: ExtensionAPI` (no config object is injected — see F4.1). It registers hooks via `pi.on(...)` and optional tools/commands/flags via `pi.registerTool/registerCommand/registerFlag`.
- Loading: provided through the package's own `extensions:` entry; discovered by omp's `omp-plugins` provider on `npm`/git install or `omp plugin link` (`enforce-orchestrator.ts:45-47`).
- **Runtime quirk (verified, load-bearing for impl):** the SDK's `import` export condition points at raw `./src/*.ts`, and Node v26 cannot strip types from `.ts` under `node_modules`. So SDK **types** are imported with top-level `import type` (erased at runtime), while any SDK **runtime value** must come from a **lazy `await import()`** inside an impure function (`mess-transport.ts:19-25,784-785`). `node --test` would otherwise fail to load the module (`mess-transport.ts:19-25`). LeadDev MUST follow this split.
- **Confidence: High.**

**F1.3 — Two-plugin split (extensions vs agents) is structural.**
- Plugin A holds extension *code* (`package.json#omp.extensions`); Plugin B holds *agent definitions + skills* (`marketplace.json:11-19`, `"agents":["hr","docworm","drpe","leaddev","middev","reqguru","validator"]`). The new reminder-injection extension is **Plugin A code** (a new `src/*.ts` + new `omp.extensions` entry); any *agent-definition* change (e.g. widening DocWorm) is **Plugin B** (`plugins/agents/agents/*.md`). They are independently versioned in `marketplace.json:7,16`.
- **Confidence: High.**

**F1.4 — Opt-in parity: extensions ship DORMANT.**
- All three behavior-changing extensions (`enforce-orchestrator`, `dot-agreement`, `mess-transport`) early-return unless the project opts in. `optedIn(cwd)` is the shared gate, exported from `enforce-orchestrator.ts:105-119` and **imported** by both companions: `dot-agreement.ts:26` (`import { optedIn } from "./enforce-orchestrator.ts";`) and `mess-transport.ts:41`. Precedence (`enforce-orchestrator.ts:28-34`): `OMP_BYPASS_ORCHESTRATOR=1` (fully off) ▸ `OMP_ENABLE_ORCHESTRATOR=1` (on) ▸ `<cwd>/.omp/elon.json {"enabled":true}` (on) ▸ dormant. The new extension MUST follow this same pattern (import `optedIn`).
- **Confidence: High.**

---

### Dimension 2 — The hook system & the text-injection mechanism

**F2.1 — The full extension event catalog (verified in current SDK).**
- `types.ts:805-837` (`ExtensionEvent` union) and the typed `on()` overloads `types.ts:961-1014`. Turn/injection-relevant events (with result shapes):
  - `before_agent_start` — event `BeforeAgentStartEvent { type; prompt: string; images?; systemPrompt: string[] }` (`types.ts:522-528`); result `BeforeAgentStartEventResult { message?: Pick<CustomMessage,"customType"|"content"|"display"|"details"|"attribution">; systemPrompt?: string[] }` (`types.ts:875-879`).
  - `input` — `{ type; text; images?; source: "interactive"|"rpc"|"extension" }` (`types.ts:637-643`); result can replace/consume input (`InputEventResult { handled?; text?; images? }`, `types.ts:851-859`).
  - `context` — fired before each LLM call; `messages[]` modifiable (`ContextEventResult { messages? }`, `types.ts:843-845`).
  - `turn_start` / `agent_start` — no `prompt` field; used by mess-transport for detection (`mess-transport.ts:863-881`).
  - `session_stop` — `SessionStopEventResult { continue?; additionalContext?; … }`; can request ONE continuation turn with model-visible context (`mess-transport.ts:894-909`).
  - `session_start` — used by `enforce-orchestrator` for the once-per-session APPEND_SYSTEM inject (`enforce-orchestrator.ts:132-150`).
- **Confidence: High.**

**F2.2 — THE injection mechanism: returning `{message}` from `before_agent_start`.**
- `dot-agreement.ts:136-148` is the canonical pattern. The handler receives `(event, ctx)`, computes a payload, and `return { message: msg }` where `msg = { customType, content, display: false, attribution: "user" }` (`buildDotInjection`, `dot-agreement.ts:96-126`). That `message` becomes a **model-visible `CustomMessage` for the CURRENT turn** — i.e. the agent sees it as context on exactly the turn the user's prompt triggered the hook. This is the hardest-feasible turn-start text injection.
- The injected `attribution` is **`"user"`** (the only runtime option — `MessageAttribution` is `"user" | "agent"`; no system-attributed block exists; `getSystemPrompt()` is read-only; `appendEntry` is NOT sent to the LLM — `enforce-orchestrator.ts:37-43`, `types.ts:1270`). `display:false` keeps it out of the editable pending-queue UI.
- **This is precisely the mechanism `dot-agreement` and the APPEND_SYSTEM path use**, and the one REQ-D ("mirror the layered dot-agreement model") calls for.
- **Confidence: High** (verified end-to-end in live source).

**F2.3 — Second injection mechanism: `pi.sendMessage(..., {deliverAs:"nextTurn"})`.**
- `types.ts:1083-1086` (`SendMessageHandler`): `sendMessage(message, { triggerTurn?, deliverAs?: "steer"|"followUp"|"nextTurn" })`. `deliverAs:"nextTurn"` queues **hidden** custom context for the **NEXT** turn; `triggerTurn:true` schedules an internal continuation (`types.ts:1272-1277`). Used by `enforce-orchestrator.ts:138-146` for the APPEND_SYSTEM framing (queued once per session from a `session_start` handler).
- This is the **deferred** path (next turn), vs. `before_agent_start`'s **synchronous current-turn** path. For a reminder keyed on the user's *current* prompt, `before_agent_start` (F2.2) is strictly better — it has `event.prompt` in hand and injects immediately.
- **Confidence: High.**

**F2.4 — `before_agent_start` is the correct reminder hook (corroborated).**
- It fires **after the user submits a prompt, before the agent loop** (`types.ts:522`), exactly **once per prompt** (lowest latency, no double-fire across internal continuation turns the way `turn_start`/`context` can). It carries `event.prompt` (the user text) — required for the "keyword/tag-overlap" matching in REQ-C. `dot-agreement` already uses it to inject current-turn context keyed on the prompt (`dot-agreement.ts:136-148`). `turn_start`/`agent_start` have **no prompt field** and are used by mess-transport only for stateless scanning (`mess-transport.ts:863-881`), so they cannot drive prompt-keyed reminders.
- **Confidence: High.**

---

### Dimension 3 — `.app/` conventions (incl. the proposed `IDEAS.md`)

**F3.1 — `.app/` is FLAT for named protocol artifacts; git auto-tracks `*.md`.**
- `.gitignore:4-5`: `.app/*` then `!.app/*.md`. Net effect: **everything under `.app/` is gitignored EXCEPT top-level `*.md` files**. Existing tracked artifacts: `REQ.md`, `RESEARCH.md`, `SPEC.md`, `PROJECT.md`, `subagent-panel-contract.md`. Gitignored runtime state: the `.app/mess/` subtree and `.app/instances.json` (the transport's non-md state).
- **Therefore `.app/IDEAS.md` is automatically git-tracked by the existing rule — no `.gitignore` edit is required.** A non-`.md` name (e.g. `.app/ideas.json`) would NOT be tracked without a new `!.app/…` exception.
- **Confidence: High** (verified in `.gitignore`).

**F3.2 — Elon owns `.app/` artifact commits via `[PROTO]`.**
- The Elon protocol commits `.app/REQ.md`, `.app/RESEARCH.md`, `.app/SPEC.md`, `.app/PROJECT.md` at phase gates with `[PROTO]` (`skill://elon` commit_convention; reaffirmed in `.app/PROJECT.md:44` and `.app/REQ.md`). `IDEAS.md` is a new protocol artifact → it joins the `[PROTO]`-committable set. Elon's `bash` tool is gated to `git ...` only (`enforce-orchestrator.ts:186-192`), so `git add .app/IDEAS.md && git commit -m "[PROTO] add idea"` is within Elon's scope.
- **Confidence: High.**

**F3.3 — There is an existing `.app/` reader/parser pattern to mirror.**
- `mostRecentPendingAsk(projectMdPath)` (`dot-agreement.ts:57-86`): a **tolerant, never-throws** line parser of `.app/PROJECT.md`'s `## Pending Asks` section. It locates the section header (`SECTION_HEADER_RE`, `dot-agreement.ts:47`), walks lines, matches a record regex (`PENDING_ASK_RE`, `dot-agreement.ts:43-44`), and returns the LAST `status=pending` entry. Missing/unreadable file → `null`, never an exception. **This is the exact pattern an IDEAS.md parser should follow** (locate `## Ideas` section, match one-idea-per-block regex, never throw). `mess-transport.ts` parses `.app/mess/*.md` + `.app/instances.json` the same tolerant way.
- **There is NO existing IDEAS.md parser** — the new extension builds its own (parallel to `mostRecentPendingAsk`). REQ-B's "append-style, one structured block per idea" matches the per-line/per-block parse model already proven here.
- **Confidence: High.**

---

### Dimension 4 — Config / flags surface (where the opt-out lives)

**F4.1 — No config object is injected into extensions.**
- `ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>` (`types.ts:1241`) — only `pi`. `ExtensionContext` (`types.ts:325-356`) has `ui, cwd, hasUI, sessionManager, modelRegistry, model, models, isIdle(), hasPendingMessages(), getSystemPrompt(), memory?` — and **no `config` field**. So config is NOT handed to the extension; it must be read from disk/env.
- **Confidence: High.**

**F4.2 — Existing config is read from `.omp/elon.json` + env vars.**
- `optedIn(cwd)` (`enforce-orchestrator.ts:105-119`) reads `<cwd>/.omp/elon.json`, `JSON.parse`s it, and checks `parsed.enabled === true` (tolerant: malformed/absent → dormant). The live file is `{ "enabled": true }` (`.omp/elon.json:1`). Env levers in use: `OMP_BYPASS_ORCHESTRATOR`, `OMP_ENABLE_ORCHESTRATOR` (`enforce-orchestrator.ts:57-58`); `OMP_INSTANCE_ID`, `OMP_MESS_POLL_MS`, `OMP_MESS_CLAIM_STALE_MS` (`mess-transport.ts:57-59,103`).
- **This is the established config channel.** An opt-out for proactive reminders most naturally extends `.omp/elon.json` (e.g. `{ "enabled": true, "ideas": { "reminders": false } }`) read by the new extension's own tolerant JSON parse (mirroring `optedIn`), with an env override (e.g. `OMP_IDEA_REMINDERS=0`) for escape-hatch parity.
- **Confidence: High.**

**F4.3 — A CLI-flag surface also exists (`registerFlag`/`getFlag`).**
- `pi.registerFlag(name, { type: "boolean" | "string"; default? })` and `pi.getFlag(name)` (`types.ts:1046-1060`). This is a **session-scoped** CLI flag (e.g. a `--no-idea-reminders` toggle for the current session). `mess-transport` registers **tools** (`mess-send`, `mess-fail`) but no flags; `dot-agreement` registers neither. So flags are an available-but-unused channel in this plugin family.
- **Confidence: High.**

---

### Dimension 5 — Agent `write` boundaries & DocWorm's IDEAS.md access

**F5.1 — Agent capabilities are declared in frontmatter `tools:`/`spawns:` (harness-enforced).**
- `plugins/agents/agents/docworm.md:4`: `tools: read, write, edit, search, find, mess-send, mess-fail` (no `bash`, no `task`). `leaddev.md:4-5`: `tools: read, write, edit, bash, search, find, ast_grep, ast_edit, lsp, debug, task, mess-send, mess-fail` + `spawns: middev, hr`. `middev.md:4`: full impl toolset, **no `task`**. These are "enforced by the harness — a hard runtime restriction" (each agent body, e.g. `docworm.md:9`).

**F5.2 — DocWorm's `write` has NO path restriction → DocWorm CAN write `.app/IDEAS.md` as-is.**
- Frontmatter `tools: …, write, …` grants the `write` tool with **no per-path allowlist** (contrast Elon's runtime gate, F5.3). So DocWorm writing `.app/IDEAS.md` is already permitted by its current frontmatter — **no agent-definition change is required** to give DocWorm IDEAS.md access.
- **Confidence: High.**

**F5.3 — Elon's `write` restriction is a root-session runtime gate, NOT a subagent rule.**
- `enforce-orchestrator.ts:152-184`: the `tool_call` gate early-returns `if (!ctx.hasUI) return;` (line 155) and only then enforces that `write` targets `.app/PROJECT.md` (lines 174-184). **Subagents are headless (`hasUI === false`)**, so this gate **never fires** for DocWorm — DocWorm is bound only by its own frontmatter (F5.1). Elon himself **cannot** `write` `.app/IDEAS.md` (the gate would block with `…may only write .app/PROJECT.md…`, `enforce-orchestrator.ts:180-183`), so IDEAS.md writes **must** be delegated.
- **Confidence: High.**

**F5.4 — Elon can delegate the IDEAS.md write to DocWorm.**
- `docworm` is a registered team agent: in the `TEAM` allowlist of both gates (`enforce-orchestrator.ts:66`, `mess-transport.ts:48`) and in Plugin B's `agents` array (`marketplace.json:17`). Elon's `task` tool permits `agent ∈ TEAM` (`enforce-orchestrator.ts:164-172`); routing table maps "write/update documentation" → DocWorm (`skill://elon` routing_table). So Elon owns IDEAS.md **commits** (`[PROTO]`, F3.2) but **delegates the content `write`** to DocWorm. This satisfies REQ-B's "Writes OWNED BY DOCWORM (Elon's enforced write scope stays PROJECT.md-only)" cleanly.
- **Confidence: High.**

**F5.5 — The reminder extension reads IDEAS.md via `node:fs`, NOT the `write` tool.**
- The extension's `before_agent_start` handler reads `.app/IDEAS.md` with Node `fs` built-ins inside hook code (exactly as `mostRecentPendingAsk` reads `.app/PROJECT.md` via `readFileSync`, `dot-agreement.ts:61`). Hook code is **not** a tool call and is **not** subject to any agent tool gate. So the extension is **read-only on IDEAS.md**; it never needs `write`. The write/write-ownership boundary (DocWorm writes; extension reads; Elon commits) is exactly preserved by the substrate.
- **Confidence: High.**

---

## Recommendations (integration options for LeadDev's SPEC)

> Ranked by fit to the verified substrate + locked requirements (A–E in
> `.app/PROJECT.md`). Each cites its supporting findings.

**R1 (RECOMMENDED) — Register the new extension as a new `src/*.ts` in Plugin A.**
- Add `"./src/idea-reminders.ts"` (name TBD) to `package.json#omp.extensions` (`package.json:17-19`); default-export `ExtensionFactory` (`types.ts:1241`); `import { optedIn } from "./enforce-orchestrator.ts"` for dormancy parity (F1.4, F4.2). Pure parse/match functions unit-tested in isolation like `mostRecentPendingAsk`; impure hook shell follows the `import type` + lazy-`await import()` split (F1.2).
- *Supporting:* F1.1, F1.2, F1.4, F3.3.

**R2 (RECOMMENDED) — Use `before_agent_start` + `{message}` return for the proactive turn-start reminder.**
- Mirror `dot-agreement.ts:136-148`: `pi.on("before_agent_start", (event, ctx) => { …; return { message: { customType:"elon-ko-gate:idea-reminder", content, display:false, attribution:"user" } } })`. It has `event.prompt` for keyword/tag matching (REQ-C), injects the **current** turn (F2.2/F2.4), and is the exact hook REQ-D names. Do **not** use `pi.sendMessage(nextTurn)` for the reminder (that defers to the next turn and lacks current-prompt context — F2.3). Reserve `registerMessageRenderer` (`types.ts:1066-1067`) if a visible reminder chip is later wanted.
- *Supporting:* F2.2, F2.3, F2.4.

**R3 (RECOMMENDED) — Store ideas at flat `.app/IDEAS.md`; auto-tracked, `[PROTO]`-committed.**
- No `.gitignore` change (F3.1). Elon commits it at phase gates (F3.2). Parser mirrors `mostRecentPendingAsk` (tolerant, never-throws, section + block regex) (F3.3). Human-editable + append-style per REQ-B.
- *Supporting:* F3.1, F3.2, F3.3.

**R4 (RECOMMENDED) — Opt-out flag lives in `.omp/elon.json` (mirror `optedIn`), with an env escape hatch.**
- Extend the existing marker file, e.g. `{ "enabled": true, "ideas": { "reminders": false } }`, read by the new extension's own tolerant JSON parse (fail-safe default = reminders ON when enabled, matching REQ-C's default-on opt-out semantics). Optional env `OMP_IDEA_REMINDERS=0` for escape parity. Avoid `registerFlag` unless a session-scoped CLI toggle is explicitly wanted (F4.3) — file/env config is the established channel (F4.2).
- *Supporting:* F1.4, F4.1, F4.2, F4.3.

**R5 (RECOMMENDED) — IDEAS.md writes stay DocWorm's; the extension is read-only.**
- No agent-definition edit needed: DocWorm's `write` already covers `.app/IDEAS.md` (F5.2). Elon delegates via `task(agent="docworm")` (F5.4) and owns the `[PROTO]` commit (F3.2). The extension reads IDEAS.md via `fs` only (F5.5). This cleanly enforces REQ-B's ownership split with zero frontmatter change.
- *Supporting:* F5.2, F5.3, F5.4, F5.5.

**R6 (OPTIONAL) — `/idea` and `/ideas` commands via `registerCommand`.**
- REQ-A (capture via `/idea`) and REQ-C (on-demand `/ideas`) map to `pi.registerCommand(name, { handler })` (`types.ts:1027-1035`, `RegisteredCommand` `types.ts:919-927`). The `/idea` handler would route capture to DocWorm (write) via Elon's delegation; `/ideas` would surface a formatted list. Alternatively `/idea` can be natural-language (REQ-A allows BOTH) handled in advisory protocol prose with DocWorm parsing — LeadDev's choice.
- *Supporting:* F1.2 (`registerCommand`), F5.4.

---

## Risks / unknowns LeadDev MUST resolve in SPEC

- **U1 (blocker for tests) — IDEAS.md block grammar is unmodeled.** No existing parser to reuse (F3.3). SPEC must define the one-idea-per-block format + a tolerant regex (mirror `PENDING_ASK_RE`, `dot-agreement.ts:43-44`), including the `status=promoted` lifecycle (REQ-E) and `tags`/`keywords` fields needed for REQ-C matching.
- **U2 — Opt-out key precedence is a design choice, not a substrate fact.** `optedIn` only reads top-level `enabled` (`enforce-orchestrator.ts:105-119`); there is no precedent for nested keys (`ideas.reminders`). SPEC must specify tolerant parsing + fail-safe default + env precedence (R4). `[INFERENCE]` the parse should reuse `optedIn`'s JSON-shape guard, but the nested schema is new.
- **U3 — Keyword/tag matching is fully new code (no substrate util).** REQ-C demands "boring/debuggable, NOT semantic vectors." `package.json` has **zero runtime dependencies** (`devDependencies` only, `package.json:12-16`); the frozen memo corroborates ("Use Node `fs` built-ins only; do not add dependencies"). SPEC must specify a deterministic, dependency-free matcher (token/substring/tag overlap) and the 1–2 cap.
- **U4 — Concurrent write/read race.** DocWorm may be mid-write (`write` tool) when the extension's hook reads `.app/IDEAS.md` via `fs`. `readFileSync` could observe a partial file. Same-volume **atomic write** (temp + `fs.rename`) is the established mitigation (POSIX `rename(2)` atomic on local volume). SPEC must mandate it for IDEAS.md writes (DocWorm's tool path or a writer helper).
- **U5 — Reminder cadence during multi-phase workflows.** `before_agent_start` fires **every** user prompt (F2.4), so during an active GRILL/DEVELOP session reminders could fire repeatedly. SPEC should decide whether to suppress reminders while a project is mid-flight (e.g. read `.app/PROJECT.md` `## Current Phase` and stay quiet during DEVELOP⇄VALIDATE). The substrate supports reading PROJECT.md (dot-agreement already does, F3.3). `[INFERENCE]` this is a UX policy, not a substrate limit.
- **U6 — customType naming.** Existing wire-protocol customTypes are namespaced `elon-ko-gate:<feature>` (`enforce-orchestrator.ts:140`, `dot-agreement.ts:29`; REQ.md §2 rows 6–7). The new reminder customType should follow suit (e.g. `elon-ko-gate:idea-reminder`). SPEC confirms the exact string.
- **U7 — Attribution cannot be `"system"`.** Any injected reminder is `attribution:"user"` (F2.2). If REQ-D's "advisory" layer implies system-attributed framing, that is **not** reachable via any ExtensionAPI call (`getSystemPrompt()` is read-only, `appendEntry` is not LLM-sent — F2.2). The advisory layer therefore lives in protocol *prose* (`skill://elon` + `append-system.default.md`), exactly as `dot-agreement`/APPEND_SYSTEM already do — NOT in a system-prompt injection.
- **U8 — `/idea` capture write path.** If `/idea` runs as a command handler in the extension (R6), the handler runs in the root session's process; writing IDEAS.md from hook/command code is possible via `fs`, but that would bypass the DocWorm-owns-writes ownership rule (REQ-B). SPEC must route `/idea` capture through Elon→DocWorm delegation, not direct fs write from the command handler. `[INFERENCE]` this preserves the ownership invariant but adds a round-trip; alternatively the command only stages a pending idea in PROJECT.md for DocWorm to persist.
- **U9 — No new runtime deps (hard constraint).** All extension code uses Node built-ins + the SDK types only (F1.2, U3). Confirm in SPEC.

---

## Impact Assessment

- **Verdict: CLEAR.** Findings confirm the locked requirements (A–E in `.app/PROJECT.md`) are substrate-feasible; none is contradicted. Minor **additive** substrate facts (a new `customType`, a new `.app/IDEAS.md` artifact, a new nested `.omp/elon.json` config key, a new tolerant parser) are *implementation details for SPEC*, not requirement changes — they expand the *surface inventory*, not the *requirements*.
  - **A (capture: `/idea` + natural language, acks immediately):** `registerCommand` (R6) + advisory prose + DocWorm write — feasible.
  - **B (single `.app/IDEAS.md`, append-style, DocWorm-owned, `[PROTO]`-committable):** auto-tracked by gitignore (F3.1); DocWorm frontmatter already allows `write` (F5.2); Elon delegates + commits (F5.4, F3.2) — feasible, **no agent-definition edit**.
  - **C (proactive 1-line pointer on keyword overlap, capped 1–2, + `/ideas`, opt-out, boring matcher):** `before_agent_start` injection (R2) + `registerCommand` (R6) + `.omp/elon.json` opt-out (R4) — feasible.
  - **D (advisory prose + hard turn-start hook, mirror dot-agreement):** `before_agent_start` `{message}` return IS the dot-agreement mechanism (F2.2) — feasible.
  - **E (distinct from Pending Asks; can promote to a fresh REQ.md; keep for audit):** separate file `.app/IDEAS.md`, separate parser/customType, no read-collision with dot-agreement's `.app/PROJECT.md` parse (F3.3) — feasible.
- **Affected requirements:** none changed. Additive note for LeadDev: REQ-D's "advisory" sub-layer cannot be a true system-prompt injection (U7) — it must be protocol prose, consistent with how the existing `dot-agreement`/APPEND_SYSTEM advisory layers already work.
- **Recommendation: PROCEED to SPEC.** No GRILL loopback. LeadDev resolves U1–U9 (design choices within a confirmed-feasible substrate).

---

## Sources Consulted

Local live source (this repo = the substrate):
1. `package.json:6,13-19,17-19` — ESM module, devDeps, `omp.extensions` registration array. Plugin A manifest.
2. `.omp-plugin/marketplace.json:7-8,11-19` — Plugin B (`elon-ko-agents`) roster + skill/agent roots; two-plugin split.
3. `src/enforce-orchestrator.ts:28-34,45-47,57-58,105-119,121,132-150,152,155,174-184,186-192` — opt-in gate (`optedIn`), APPEND_SYSTEM inject (`session_start`+`sendMessage`), `tool_call` root-only gate, `write`/`bash` allowlists. The enforcement model.
4. `src/dot-agreement.ts:26,29,43-44,47,57-86,96-126,136-148` — `import optedIn`; `DOT_CUSTOM_TYPE`; `PENDING_ASK_RE`/`SECTION_HEADER_RE`; `mostRecentPendingAsk` parser; `buildDotInjection`; `before_agent_start` → `{message}` injection (THE reminder pattern).
5. `src/mess-transport.ts:19-25,41,48,57-59,103,755-845,863-909` — pure/impure split, lazy `await import`, `turn_start`/`agent_start`/`session_stop`/`session_start` hooks, `registerTool`, opt-in parity, env config.
6. `src/append-system.default.md:39-43` — bundled Elon framing; advisory-only re-injection; names both plugins.
7. `plugins/agents/agents/docworm.md:4,9` — DocWorm frontmatter `tools` (write, no path restriction) + harness-enforcement note.
8. `plugins/agents/agents/leaddev.md:4-5` and `middev.md:4` — comparison frontmatter (`spawns`, no `task`).
9. `.gitignore:4-5` — `.app/*` ignored except `!.app/*.md` → IDEAS.md auto-tracked.
10. `.omp/elon.json:1` — `{ "enabled": true }` opt-in/config marker.
11. `.app/PROJECT.md:1,18-20,40-44` — current project (idea storage), FULL path, resolved requirements A–E, known extension surface.
12. `.app/REQ.md` — (the rebrand REQ; read for context on customType naming §2 rows 6–7 and `[PROTO]` artifact set) — confirms the `elon-ko-gate:` customType namespace and that `.app/{REQ,RESEARCH,SPEC,PROJECT}.md` are `[PROTO]`-committed.
13. `skill://elon` — orchestrator protocol; routing table (→ DocWorm for docs), commit convention (`[PROTO]`), `.app/` artifact ownership.
14. `skill://drpe` — research protocol + output contract (this memo's structure).

omp SDK types (installed, current):
15. `node_modules/@oh-my-pi/pi-coding-agent/src/extensibility/extensions/types.ts:325-356` — `ExtensionContext` (no `config` field; `cwd`, `hasUI`, `isIdle()`, `getSystemPrompt()`).
16. `…/types.ts:522-528, 637-643, 805-837, 843-889` — `BeforeAgentStartEvent`, `InputEvent`, the `ExtensionEvent` catalog, result shapes incl. `BeforeAgentStartEventResult { message?, systemPrompt? }`.
17. `…/types.ts:919-960,1011-1014,1027-1060,1083-1095,1240-1241` — `ExtensionAPI`: `on()` overloads, `tool_call`/`tool_result`, `registerCommand`, `registerFlag`/`getFlag`, `sendMessage`/`appendEntry`, `ExtensionFactory`.

Prior (superseded) frozen memo consulted for cross-reference only (re-verified, not trusted):
18. Prior `.app/RESEARCH.md` (Cross-Instance Transport + Dot Agreement) — event-catalog survey + lock pattern + zero-deps claim; re-checked against current `node_modules` (F2.1, U4) before reuse.

No web sources were required: the entire extension substrate is present as local
editable source (`src/`) plus the installed omp SDK types (`node_modules/`),
so findings are grounded in primary local evidence rather than external docs.
