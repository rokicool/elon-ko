---
name: logging-design
description: >
  Methodology for designing and implementing structured logging support in any project.
  Use when working on logging, log entries, logger design, or structured logging —
  covers canonical line format, type taxonomy, secret redaction, timestamps, correlation
  IDs, PII handling, never-throws semantics, and clarity principles. Available to
  drpe, leaddev, middev, validator, docworm. Triggers on: logging, log, log entry,
  logger, structured logging.
---

<overview>
Language-agnostic methodology for logging design. Defines ONE canonical human-readable
line format with a machine-parseable structured-field mapping, a four-type severity
taxonomy, mandatory secret redaction, and operational rules. Agents adapt idioms to the
project's language; the canonical format is the contract every adaptation must satisfy.

This skill is reference material — read it when designing, implementing, reviewing, or
documenting logging. It does not prescribe a specific library; it prescribes the shape
every log entry must have regardless of library.
</overview>

<canonical_line_format>

The canonical log line is a single human-readable string with fields in **fixed order**.
Every implementation produces lines that parse unambiguously into this structure.

**Field order (positional, left to right):**

| # | Field | Required | Description |
|---|-------|----------|-------------|
| 1 | `ts` | Always | UTC ISO-8601 timestamp, millisecond precision (`YYYY-MM-DDTHH:mm:ss.sssZ`). |
| 2 | `type` | Always | One of `ERR`, `WRN`, `MSG`, `VRB` (see `<type_taxonomy>`). |
| 3 | `source.module` | Always | Module / package / component name. |
| 4 | `source.function` | Always | Function or script name emitting the entry. |
| 5 | `trace_id` | Always | Correlation / request / trace ID joining a flow. |
| 6 | `goal` | Boundary + ERR/WRN | The operation's goal verb-phrase. |
| 7 | `msg` | Always | Human-readable message — unambiguous, self-contained. |
| 8 | `params` | Boundary + ERR/WRN | Space-delimited `key="value"` pairs (see `<params>`). |

**`goal` and `params` rules (R4):**
- Operation-boundary lines (start AND end of an operation) MUST carry `goal` + full `params`.
- Any `ERR` or `WRN` entry MUST carry `goal` + full `params`.
- Intermediate `MSG` / `VRB` progress lines MAY omit `params`.

**Human-readable example:**

```
2026-08-10T14:30:00.123Z ERR auth login authenticate_user req-7f3a Login failed user="alice" ip="10.0.0.1" reason="invalid_password"
```

**Structured-fields mapping (machine-parseable JSON):**

```json
{
  "ts": "2026-08-10T14:30:00.123Z",
  "type": "ERR",
  "source": { "module": "auth", "function": "login" },
  "trace_id": "req-7f3a",
  "goal": "authenticate_user",
  "msg": "Login failed",
  "params": {
    "user": "alice",
    "ip": "10.0.0.1",
    "reason": "invalid_password"
  }
}
```

The JSON mapping is the authoritative structure. The human-readable line is a
deterministic projection of it. Field order in the JSON object MUST match the table
above — parsers may rely on positional or key-based extraction, but the key set and
order are part of the spec.

</canonical_line_format>

<type_taxonomy>

Four base types form the severity taxonomy. Types are extensible — projects MAY add
codes, but MUST reuse the base four and document additions in a project-level addendum.

| Type | Meaning | Mandatory fields |
|------|---------|-------------------|
| `ERR` | Fault or error condition — something failed. | `goal`, `params` |
| `WRN` | Warning, risk, or degraded operation — not fatal but needs attention. | `goal`, `params` |
| `MSG` | Normal progress or informational milestone. | (params optional) |
| `VRB` | Verbose, detail, or diagnostic — high-volume tracing. | (params optional) |

**Extending the taxonomy:**
- New codes MUST be uppercase, 3-4 chars, and documented with their semantics.
- Extensions MUST NOT reuse an existing code's abbreviation.
- Extensions MUST declare which mandatory-field rules apply (at minimum `goal`+`params` for error-like types).

Example extension: `DBG` = debug breakpoint / developer diagnostic, mandatory `source.function` only.

</type_taxonomy>

<source_field>

Every entry carries `source = { module, function }`.

- **`module`**: the logical component, package, or service name. Stable across runs.
- **`function`**: the function, method, or script name emitting the entry. Must be specific enough to locate the call site without ambiguity.

If the project has no explicit module structure, use the file path relative to project root or a top-level namespace. The goal is traceability: a reader seeing `source: { module: "payment", function: "charge_card" }` must be able to find the code.

</source_field>

<params>

Parameters appear as space-delimited `key="value"` pairs in the human-readable line and
as a JSON object under the `params` key in the structured mapping.

**Rules:**
- Values MUST be quoted in the human-readable form (`key="value"`).
- All parameter values MUST pass through secret redaction (see `<secret_redaction>`) and PII handling (see `<pii_handling>`) before emission.
- Param names SHOULD be concise but unambiguous (`user`, `order_id`, `latency_ms`).
- Param values MUST be the actual runtime values — never placeholders or redacted-to-meaningless. If a value is redacted, the redacted form still conveys type and length.

</params>

<secret_redaction>

**Mandatory denylist (R5).** Any parameter whose NAME (case-insensitive) contains one of
these substrings MUST be redacted:

`password`, `pwd`, `token`, `secret`, `key`, `credential`, `apikey`, `api_key`, `auth`, `cookie`

**Redacted form:** first 3 characters of the value + `(length)`.

| Original value | Redacted output | Notes |
|----------------|-----------------|-------|
| `"s3cr3t_p@ssw0rd!"` (18 chars) | `sec(18)` | Standard case. |
| `"ab"` (2 chars) | `**(2)` | Value shorter than 3 chars — do not reveal the full value. Use `**` prefix + length. |
| `""` (0 chars) | `(0)` | Empty string. |
| `12345` (number) | `[redacted:number(5)]` | Non-string: type tag + length of string representation. |
| `{ "nested": "value" }` (object) | `[redacted:object]` | Non-string: type tag only. |
| `null` | `[redacted:null]` | Null value. |

**Nested redaction:** when a param value is a structured object (JSON), recursively
apply the denylist to every key at every depth. Redact the VALUE of any matching key;
leave non-matching keys visible.

```json
// Before redaction:
{ "headers": { "authorization": "Bearer abc123", "content_type": "application/json" } }

// After redaction:
{ "headers": { "authorization": "Bea(15)", "content_type": "application/json" } }
```

**Edge-case decisions (to be confirmed per project if they arise):**
- Binary values: redact as `[redacted:binary(length)]`.
- Very long strings (>10 000 chars): truncate the redacted form to first 3 chars + `(length)` — the standard form already handles this.

</secret_redaction>

<pii_handling>

Non-secret sensitive data (data that is not a credential but should not appear in logs)
gets redaction guidance beyond the secret denylist.

**Categories:**

| Category | Pattern | Redacted form |
|----------|---------|---------------|
| Email | matches `user@domain` | `fir###@domain.tld` — first 3 chars of local part, domain visible for debugging routing. |
| Phone | E.164 or national format | `[pii:phone(XX)]` where XX is last 2 digits. |
| National ID / SSN | government ID numbers | `[pii:id]` — full redaction. |
| Credit card | PAN (12-19 digits) | `[pii:cc(XXXX)]` — last 4 digits only. |

**Projects MUST declare which PII categories apply.** If a project handles no PII
beyond secrets, state that explicitly. If it does, list the categories and any
project-specific identifiers (e.g., patient IDs, account numbers).

**Principle:** when in doubt, redact. A false positive (over-redacted field) costs a
debugger a minute of confusion; a false negative (leaked PII) costs the organization
a breach notification.

</pii_handling>

<operational_rules>

**Timestamps (R7):**
- Every entry carries a UTC ISO-8601 timestamp with millisecond precision.
- Format: `YYYY-MM-DDTHH:mm:ss.sssZ` (the `Z` suffix is mandatory — always UTC, never local time).
- The timestamp is the wall-clock time at emission, not the event time. If event time differs (e.g., queued logs), add an optional `event_ts` param.

**Correlation / Trace ID (R7):**
- Every entry carries a `trace_id` that joins all entries in a single request, operation, or flow.
- The ID MUST be propagated through the call chain (middleware, context, thread-local, equivalent).
- If no trace ID exists (e.g., startup, cron, background job), generate one at the entry point and propagate it. Never emit an empty or `null` trace_id — use a generated ID.
- Format is project-defined (UUID, ULID, opaque hex). Uniqueness within the system is the only requirement.

**Never-throws (R7):**
- Logging is a side-effect. It MUST NEVER raise an exception or interrupt the calling operation.
- Implementations MUST wrap log emission in a try/catch (or language equivalent). On failure, silently drop the entry — do not propagate the error.
- This is non-negotiable: a logging failure that crashes the application is strictly worse than a dropped log line.

</operational_rules>

<clarity_principles>

**R9 — Concrete guidance for log message quality:**

1. **Unambiguous messages.** A reader who sees only the log line (no source code) must understand what happened. ❌ `"failed"` ✅ `"database connection refused on port 5432"`.

2. **No redundant fields.** Do not repeat information already carried by `type`, `source`, or `goal`. ❌ `msg="error in auth module"` when `type=ERR source.module=auth` already says that.

3. **Context sufficient to diagnose.** Every `ERR` and `WRN` entry must contain enough information for an on-call engineer to begin diagnosis without reading source code. This is why `goal` + `params` are mandatory on those types — they carry the operation context.

4. **One line, one event.** Each log entry describes exactly one event or state transition. Do not batch multiple events into a single line.

5. **Stable vocabulary.** Use consistent terminology for the same concept across the codebase. If the codebase calls it `"user_id"`, never log it as `"uid"` or `"account"`.

6. **Actionable severity.** Reserve `ERR` for things that need intervention. Reserve `WRN` for things that might need intervention. `MSG` and `VRB` are informational. Do not cry wolf — an `ERR` that no one acts on trains operators to ignore errors.

</clarity_principles>

<implementation_guidance>

**Adapting to your language:**
The canonical format is language-agnostic. Each project implements a logger (or wraps
an existing library) that produces lines matching the canonical format. The
implementation detail (how `ts` is obtained, how `trace_id` is propagated, how
redaction is applied) varies by language; the OUTPUT does not.

**Minimal logger contract (any language):**

```
log(type, msg, opts?) where:
  type  ∈ {ERR, WRN, MSG, VRB, <project extensions>}
  msg   = human-readable string
  opts  = {
    goal?:   string           # required for ERR, WRN, and boundary lines
    params?: object           # required for ERR, WRN, and boundary lines; redacted before emission
    module?: string           # defaults to caller's module
    function?: string         # defaults to caller's function name
  }
```

The logger automatically:
- Generates the `ts` timestamp at call time.
- Retrieves `trace_id` from context (or generates one if missing).
- Applies secret redaction and PII handling to all `params`.
- Serializes to the canonical human-readable format.
- Catches all internal errors (never-throws).

**Operation boundary pattern:**

```
log("MSG", "starting charge", { goal: "charge_card", params: { order_id, amount, currency } })
  ... operation body ...
log("MSG", "completed charge", { goal: "charge_card", params: { order_id, amount, currency, txn_id } })

// On failure:
log("ERR", "charge failed", { goal: "charge_card", params: { order_id, amount, currency, error: err.message } })
```

Both boundary lines carry `goal` + full `params`. Intermediate progress lines within
the operation body MAY omit params.

</implementation_guidance>

<review_checklist>

When reviewing logging design or implementation, verify:

- [ ] Every log line matches the canonical field order (ts, type, source.module, source.function, trace_id, goal, msg, params).
- [ ] Timestamps are UTC ISO-8601 with millisecond precision and `Z` suffix.
- [ ] Every entry has a non-empty `trace_id`.
- [ ] ERR and WRN entries carry `goal` and full `params`.
- [ ] Operation-boundary lines (start AND end) carry `goal` and full `params`.
- [ ] All params pass through secret redaction before emission.
- [ ] PII categories declared and handled.
- [ ] Logging never raises — wrapped in error suppression.
- [ ] Messages are unambiguous without reading source code.
- [ ] No redundant fields (information already in type/source/goal is not repeated in msg).
- [ ] Type taxonomy extensions are documented and follow the base-four pattern.

</review_checklist>
