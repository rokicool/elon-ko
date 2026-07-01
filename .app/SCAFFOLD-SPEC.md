# Technical Specification — Scaffold-file load-bearing placement (`SCAFFOLD-SPEC.md`)

| | |
|---|---|
| **Phase** | SPEC (design only — no code changes in this phase) |
| **Status** | DRAFT (SPEC phase only; DEVELOP implements after Elon routes it) |
| **Date** | 2026-07-01 |
| **Author** | LeadDev (SPEC phase) |
| **Anchored to** | `.app/RESEARCH-SCAFFOLD.md` (DrPe source-grounded placement model, omp `@oh-my-pi/pi-coding-agent@16.0.5`, access 2026-07-01), `.app/SPEC.md` (the LOCAL/GLOBAL install-mode spec — built upon, NOT clobbered), user-approved decisions **D-S1..D-S4 + IDEA-003** (see §0.2). |
| **Primary files changed (DEVELOP)** | `elon_ko.sh` (new deploy step, both modes); Plugin A package (`rules/ro-orchestrator-invariant.md` NEW, `scaffold/RULES.md` REMOVED, `scaffold/AGENTS.md` coherence edits). |
| **Downstream consumers** | DEVELOP (MidDev implements from this spec), VALIDATE (Validator audits against §6). |

> **Reading order for implementers:** §2 (the placement model, do not re-litigate) → §3.1 (the
> AGENTS.md/PROTO.md **source** decision) → §3.2 (deploy step + timing) → §4 (RULES.md → Plugin A
> rule move) → §7 (file:line change map). For validators: jump to §6.

---

## 0. Authority & what this spec locks

### 0.1 Scope of THIS spec

This spec governs the **second, orthogonal deploy surface** identified by DrPe
(`RESEARCH-SCAFFOLD.md` "Impact Assessment"): **project-context steering files** that omp
discovers relative to **`<cwd>`**, independent of the omp home (and therefore **identical in
GLOBAL and LOCAL install mode**). It also resolves the **RULES.md packaging decision** (D-S4),
which is a Plugin A change, not an installer copy.

It does **not** re-specify the omp-home install mechanics — those are locked in `.app/SPEC.md`
(§3.2 artifact table, §4 flows, §5 dual-knob, §14 AC-1..AC-12). Where this spec touches
SPEC.md's contracts, it states the interaction as an explicit amendment (§5, §6 AC-S6) rather
than editing SPEC.md.

### 0.2 Locked inputs — NOT re-openable by DEVELOP or VALIDATE

**User-approved scaffold decisions (this ticket):**

| ID | Decision (encoded verbatim, not re-litigated) |
|---|---|
| **D-S1** | `AGENTS.md`: `elon_ko.sh` copies → `<cwd>/AGENTS.md`, **OVERWRITE ALWAYS** (both modes). cwd-relative. |
| **D-S2** | `APPEND_SYSTEM.md`: **NO installer copy.** Document the optional `<cwd>/.omp/APPEND_SYSTEM.md` override (installer output + README). |
| **D-S3** | `PROTO.md`: `elon_ko.sh` copies → `<cwd>/PROTO.md` (doc-only; aids ref-resolution; never omp-loaded). Include. |
| **D-S4** | `RULES.md`: **MOVE into Plugin A `rules/`** as an always-apply omp rule (`alwaysApply:true`). Packaging change to Plugin A, NOT an installer copy. Remove the misleading inert root/scaffold copy. |
| **IDEA-003** | `marketplace.json` `agents[]` **stays as catalog metadata** (docs); drop any `count` mandate. No functional change. |

**Confirmed omp behavior (from RESEARCH — encode, do NOT re-litigate):** see §2.

**Locked from SPEC.md (NOT re-openable):** GRILL D1–D5, RESEARCH R1–R6, NFR-1..NFR-5, FR-1..FR-15,
AC-1..AC-12, the finalized PI_CONFIG_DIR + XDG_DATA_HOME dual-knob (SPEC.md §5.4).

---

## 1. Glossary (load-bearing terms, disambiguated)

| Term | Means |
|---|---|
| **omp-home surface** | Artifacts that move with the omp config root: plugins, marketplace registry, binaries, natives. Relocated by `PI_CONFIG_DIR`/`XDG_DATA_HOME`. Governed by `.app/SPEC.md`. |
| **cwd-deploy surface** (NEW, this spec) | Project-context files omp discovers relative to **`<cwd>`**: `AGENTS.md` (auto-loaded), `PROTO.md` (doc), optional `<cwd>/.omp/APPEND_SYSTEM.md` (override). **Identical path in GLOBAL and LOCAL** — omp home is irrelevant to them (`RESEARCH-SCAFFOLD.md` F8 asymmetry). |
| **load-bearing** | omp injects the file into a prompt / enforces it at runtime via a directly-read resolver. |
| **doc-only** | Never omp-auto-loaded; consumed via the `read` tool on demand (e.g. a "see PROTO.md" cross-ref). |

---

## 2. Confirmed omp placement model (encode, do not re-litigate)

Source: `.app/RESEARCH-SCAFFOLD.md` (every cell below is source-grounded in the vendored omp
runtime `@oh-my-pi/pi-coding-agent@16.0.5`; access 2026-07-01).

| File | omp auto-loads it? | Canonical location omp reads | Loadable from a PLUGIN dir? | Status today | Decision |
|---|---|---|---|---|---|
| **AGENTS.md** | **YES** (ContextFile) | `<cwd>/AGENTS.md` walked UP from cwd (`discovery/agents-md.ts:21-59`); also `<ancestor>/.agent[s]/AGENTS.md` (`agents.ts:181-198`) | **NO** — omp never scans plugin dirs for it (`agents-md.ts:26-56`, `workspace-tree.ts:12-16`) | **Broken** — only in `cache/…/scaffold/`; never at `<cwd>/` | **D-S1**: installer copy → `<cwd>/AGENTS.md` (overwrite-always) |
| **APPEND_SYSTEM.md** | **NO** omp built-in — loaded **only by Plugin A's `enforce-orchestrator`** | bundled default inside Plugin A (`src/append-system.default.md`); override `<cwd>/.omp/APPEND_SYSTEM.md` (`enforce-orchestrator.ts:87-94,133-151`, override at `:136`) | NO (it is Plugin A's own mechanism) | **Already load-bearing** via Plugin A's bundled default | **D-S2**: no copy; document override |
| **PROTO.md** | **NO** auto-load of any kind | none — read-on-demand project doc (`agents.ts` loads only `AGENTS.md`/`SYSTEM.md`) | NO | N/A — never omp-loaded | **D-S3**: copy for ref-resolution only |
| **RULES.md** (a bare root file) | **NO**. omp loads *rules* only from a `rules/` **dir**: `<ext-root>/rules/*.md` (`omp-plugins.ts:92-107`) or `.agent[s]/rules/*.md` (`agents.ts:88-106`) | (none for a bare root file) | NO (a `rules/` dir yes; a root `RULES.md` no) | **Dead file** — no placement makes it load-bearing | **D-S4**: move into Plugin A `rules/` |

**Cache vs installed (why the marketplace cache is NOT a usable source):** omp loads plugin
content from (a) `getPluginsDir()/node_modules/<name>/` (npm/git — Plugin A) and (b) the plugin
cache `installPath` (marketplace — Plugin B). The **marketplace cache**
`getPluginsDir()/cache/marketplaces/<mkt>/` (where `scaffold/` physically sits) is **download
staging**: omp reads **only `marketplace.json`** from it and **never** loads `scaffold/` (or any
non-catalog file) at runtime (`RESEARCH-SCAFFOLD.md` F5(c), lines 232-244; `marketplace/manager.ts:83-106,200-218`).

**IDEA-003 (encode):** `marketplace.json` `agents[]` is **catalog metadata only** — install copies
the whole `source` dir (`manager.ts:281-329`); runtime registers agents by filesystem scan of
`<installPath>/agents/*.md` (`task/discovery.ts:92-94`), independent of the manifest. `count` is
**not an omp field** (`marketplace/types.ts:65-95`). → `agents[]` stays for human/CLI readability;
**no `count`** is added; no functional change. (The `hr` SKILL.md mandate correction is a DocWorm/hr
follow-up, not an installer change — out of scope here.)

---

## 3. The deploy step in `elon_ko.sh` (both modes)

### 3.1 SOURCE of the files to copy — the binding decision

**Decision: the installer fetches `AGENTS.md` and `PROTO.md` from raw GitHub, keyed off `$REF`
(the exact git-ref Plugin A is pinned to), at deploy time.**

```sh
DEPLOY_REF="$REF"     # REF == Plugin A pin in BOTH modes (elon_ko.sh:104 default v2.3.1;
                      #               :123 sets REF=TAG in pre-release). Uniform — no mode branch.
curl -fsSL "https://raw.githubusercontent.com/${REPO}/${DEPLOY_REF}/scaffold/AGENTS.md"
curl -fsSL "https://raw.githubusercontent.com/${REPO}/${DEPLOY_REF}/scaffold/PROTO.md"
# REPO="rokicool/elon-ko" (elon_ko.sh:58). Standard raw.githubusercontent.com tag/commit/branch URL.
```

**Justification (why this source, and why the alternatives are rejected):**

1. **`$REF` is the right ref.** Plugin A is installed from `github:${REPO}#${REF}`
   (`elon_ko.sh:350`, `GH_A`); `REF` defaults to `v2.3.1` (`elon_ko.sh:104`) and equals the
   pre-release tag in pre-release mode (`elon_ko.sh:123`). Deploying the scaffold off the **same
   ref** keeps the deployed `AGENTS.md` (which documents the gate's enforcement architecture) and
   `PROTO.md` (the orchestrator protocol) consistent with the **deployed gate**. In pre-release
   mode this is exact: gate, agents, and scaffold are all pinned to `TAG`. (Stable-mode cosmetic
   caveat: Plugin B is "always latest" while the scaffold is pinned to `REF` — see residual risk
   R-S1; agent *definitions* remain load-bearing via frontmatter regardless of the doc.)
2. **The repo is the single source of truth.** No duplicate copy of `AGENTS.md`/`PROTO.md` is
   bundled into `elon_ko.sh`, so there is no drift hazard between `scaffold/` and a heredoc.
3. **The mechanism reuses an existing, proven idiom.** The installer already fetches via
   `curl -fsSL https://github.com/${REPO}/archive/${TAG}.tar.gz` for the pre-release tarball
   (`elon_ko.sh:430,569`) and `omp.sh`/`bun.sh` over the network (`elon_ko.sh:376,389,539,554`). A
   `raw.githubusercontent.com` fetch adds **no new dependency class** — the installer is already
   network-bound.
4. **It is identical in GLOBAL and LOCAL.** Source and target are both `<cwd>`-/ref-relative;
   the omp home is irrelevant (§1, §2). One code path serves both modes.

**Rejected alternatives (file:line evidence):**

| Alternative | Why rejected | Evidence |
|---|---|---|
| Read from installed Plugin A `node_modules/elon-ko-gate/scaffold/` | **scaffold/ is not shipped.** Plugin A's `files` allowlist is `["src","rules","!src/**/*.test.ts"]` — `scaffold/` is excluded, so it is absent from the installed package. | `package.json:7` |
| Read from the marketplace cache `cache/marketplaces/elon-ko/scaffold/` | **Staging-only and undocumented.** omp reads only `marketplace.json` from it; the path is an internal omp resolver output that **varies by omp home** (GLOBAL `~/.omp/…` vs LOCAL `$OMP_LOCAL_HOME/omp/…`, `RESEARCH-SCAFFOLD.md` F8). Fragile + not a stable contract. | `RESEARCH-SCAFFOLD.md:232-244` (F5c); `marketplace/manager.ts:83-106,200-218` |
| Bundle the file contents into `elon_ko.sh` (heredoc) | **Drift hazard.** Creates a second copy of `AGENTS.md`/`PROTO.md` that must be hand-synced with `scaffold/` on every edit; undermines "single source of truth". D-S1 (overwrite-always) already makes the installer the *deploy* authority — but the *content* authority must remain the repo. | — |
| Read from the pre-release extracted tarball `$MKT_SOURCE/scaffold/` | **Mode-dependent.** Only present in pre-release mode (`elon_ko.sh:429-437,568-576`); absent in stable (`MKT_SOURCE="${REPO}"`, a GitHub owner/repo string). Cannot be the sole mechanism. (OPTIONAL DEVELOP optimization: in pre-release, the already-downloaded tarball copy MAY be preferred to avoid a redundant fetch — but the uniform raw-fetch is the mandated baseline.) | `elon_ko.sh:429-437,442,568-581` |
| Read from `$0`/script-dir `./scaffold/` | **Unavailable in the supported install path.** The installer runs via `curl … \| bash` (`elon_ko.sh:13`), so no `scaffold/` exists beside it. | `elon_ko.sh:13-14` |

> **Reliability note for VALIDATE:** a `raw.githubusercontent.com` fetch of a **tag** (`v2.3.1`) or
> a short ref is deterministic and cache-immune (unlike the marketplace clone). `REPO` is a
> constant (`elon_ko.sh:58`). Failure modes are conventional HTTP failures (offline, unknown ref),
> handled per §3.3.

### 3.2 Timing — when in the install flow (both modes)

The deploy step runs **after Plugin B is installed** (so a failed plugin install does not litter
`<cwd>` with docs for a non-functional install) and **before the summary** (so the summary can
report what was deployed). It is implemented as a shared helper invoked once per mode branch.

**New helper** (define alongside `write_marker`, i.e. after `elon_ko.sh:212`, before the uninstall
branch at `:219`):

```sh
# §3 — scaffold deploy (both modes). Deploys <cwd>-relative project-context files that omp
# discovers by cwd-walk, NOT from the omp home (so identical in GLOBAL and LOCAL).
# AGENTS.md is the ONLY omp-auto-loaded scaffold file (agents-md.ts:21-59) — fetch failure is
# fatal. PROTO.md is doc-only — fetch failure is non-fatal. APPEND_SYSTEM.md is NOT deployed
# (D-S2): already load-bearing via Plugin A's bundled default; override is documented, not copied.
deploy_scaffold() {                       # arg 1 = deploy ref ($REF)
  local ref="$1" dest tmp
  say "Deploying project-context files to the current directory ($PWD)"
  # AGENTS.md — load-bearing; OVERWRITE ALWAYS (D-S1). Atomic write: tmp + mv.
  tmp="$PWD/.AGENTS.md.tmp.$$"
  if curl -fsSL "https://raw.githubusercontent.com/${REPO}/${ref}/scaffold/AGENTS.md" -o "$tmp"; then
    mv -f "$tmp" "$PWD/AGENTS.md"
    ok "AGENTS.md deployed → $PWD/AGENTS.md (overwrite-always; omp auto-loads it via walk-up from cwd)"
  else
    rm -f "$tmp" 2>/dev/null || true
    die "failed to fetch AGENTS.md from ${REPO}@${ref}. This is the one omp-auto-loaded steering \
file (discovery/agents-md.ts:21-59) — without it the orchestrator context is missing from this \
project. Check the ref/tag and your network, then re-run."
  fi
  # PROTO.md — doc-only (no omp auto-load); OVERWRITE ALWAYS (§3.3) for ref-resolution.
  tmp="$PWD/.PROTO.md.tmp.$$"
  if curl -fsSL "https://raw.githubusercontent.com/${REPO}/${ref}/scaffold/PROTO.md" -o "$tmp"; then
    mv -f "$tmp" "$PWD/PROTO.md"
    ok "PROTO.md deployed → $PWD/PROTO.md (doc-only; read on demand; never omp-auto-loaded)"
  else
    rm -f "$tmp" 2>/dev/null || true
    warn "PROTO.md could not be fetched from ${REPO}@${ref} — 'see PROTO.md' cross-refs will not resolve. Non-fatal (PROTO.md is doc-only)."
  fi
}
```

**Call sites (both after Plugin B install, before the summary):**

| Mode | Insert call | Anchor (pre-change `elon_ko.sh`) |
|---|---|---|
| LOCAL | `deploy_scaffold "$REF"` | after L9 Plugin B (`elon_ko.sh:467`), before L10 `env.sh` (`:471`) |
| GLOBAL | `deploy_scaffold "$REF"` | after Plugin B install (`elon_ko.sh:619`), before the summary (`:622`) |

`$REF` is the uniform deploy ref (§3.1). `REPO` is the existing constant (`elon_ko.sh:58`).

### 3.3 Overwrite semantics

| File | Semantics | Rationale |
|---|---|---|
| **AGENTS.md** | **OVERWRITE ALWAYS** (D-S1, binding) | omp auto-loads the `<cwd>` copy; a stale/mismatched copy would serve the wrong orchestrator context. The installer is the deploy authority for this file. Atomic `tmp + mv` so a crash never leaves a partial file. Fetch failure is **fatal** (§3.2) — a missing `AGENTS.md` is the actual defect this feature fixes (`RESEARCH-SCAFFOLD.md` R1, F9). |
| **PROTO.md** | **OVERWRITE ALWAYS** (SPEC's decision; D-S3 left this to SPEC) | PROTO.md is elon-ko-protocol documentation — the consuming project is opting INTO elon-ko's protocol by installing. A two-owner ambiguity (skip-if-exists) would freeze a stale copy on re-run and break "see PROTO.md" cross-refs against the current protocol. Overwrite keeps the deployed doc consistent with the deployed gate (same `$REF`). **Rejected alternative:** skip-if-exists — rejected for single-owner clarity and ref-consistency. Fetch failure is **non-fatal** (doc-only; §3.2). |
| **APPEND_SYSTEM.md** | **NO DEPLOY** (D-S2, binding) | Already load-bearing via Plugin A's bundled default (`enforce-orchestrator.ts:87-94,133-151`); auto-copying risks clobbering an intentional project customization and diverging from the bundled default on every plugin upgrade (`RESEARCH-SCAFFOLD.md` R2). The override `<cwd>/.omp/APPEND_SYSTEM.md` is **documented** (installer output §3.4 + README, via DocWorm), never written by the installer. |

### 3.4 Output messaging (both modes)

The `deploy_scaffold` helper emits the `say`/`ok`/`warn` lines in §3.2. In addition, each
summary block gains a **deploy notice** (additive stdout — see §5 amendment to SPEC.md §4.1).

**Stable GLOBAL summary** (`elon_ko.sh:644-659`) — insert after the plugins list, before
"The gate is dormant":

```
  Project-context files deployed to the current directory:
    • AGENTS.md   — omp auto-loads this (walks up from your cwd). Overwritten on every install.
    • PROTO.md    — the orchestrator protocol doc (read on demand; never auto-loaded).
  APPEND_SYSTEM.md is already active (bundled with elon-ko-gate). To customize Elon's framing,
  create .omp/APPEND_SYSTEM.md in this project (it replaces the default).
```

**LOCAL summary** (`elon_ko.sh:495-526`) — insert the same block after the Plugin B line
(`:507`), before "Activate this install".

**Pre-release summaries** (GLOBAL `:622-642`, LOCAL `:503-505`) — same block; the deploy is
ref-pinned to `TAG` in pre-release (consistent with the pinned plugins).

**Wording is implementer-adjustable** but MUST name: (a) `AGENTS.md` is omp-auto-loaded and
overwrite-on-install; (b) `PROTO.md` is doc-only; (c) `APPEND_SYSTEM.md` is already active via
Plugin A and how to override (`<cwd>/.omp/APPEND_SYSTEM.md`).

### 3.5 Uninstall policy for `<cwd>` files — the binding rule

**Decision: uninstall does NOT remove `<cwd>/AGENTS.md` or `<cwd>/PROTO.md`, in either mode.**

**Justification:**

1. **Non-destructive / no-surprise.** `AGENTS.md` is a recognized open convention (agents.md /
   Claude Code). Once deployed, a consuming project may have adopted it (git-committed it, wired
   other tools to it). Removing a visible project-tree file as a side-effect of
   "uninstall elon-ko" is surprising and potentially destructive.
2. **Consistent with existing discipline.** The current uninstall already leaves per-project
   opt-in markers (`.omp/elon.json`) and user data untouched — it scrubs the **omp home**
   (`~/.omp` globals / `$OMP_LOCAL_HOME`), never the project tree
   (`elon_ko.sh:255,300,671`; SPEC.md §9). `<cwd>/AGENTS.md` + `<cwd>/PROTO.md` are
   **project-tree** files → same discipline: leave them.
3. **"Installer owns AGENTS.md" is an INSTALL-time contract, not an uninstall-time mandate.**
   D-S1 (overwrite-always) means re-running the *installer* refreshes `AGENTS.md`; it does not
   authorize the *uninstaller* to delete a file whose post-deploy ownership is ambiguous.
4. **Mechanically already true for LOCAL.** LOCAL uninstall is `rm -rf "$OMP_LOCAL_HOME"`
   (`elon_ko.sh:243`) — `$OMP_LOCAL_HOME` is `$PWD/.elon-ko`, so `$PWD/AGENTS.md` (outside it) is
   untouched by construction. GLOBAL uninstall never references `<cwd>` either.

**Required change (both modes): add one line to each uninstall summary** stating the files are
left in place:

- LOCAL uninstall summary (`elon_ko.sh:244-257`) — add:
  `Project-context files (AGENTS.md, PROTO.md) in the current directory are left in place — remove them manually if desired.`
- GLOBAL uninstall summary (`elon_ko.sh:286-301`) — add the same line.

No `rm` of `<cwd>` files is added in either uninstall path. (Considered alternative — remove
`AGENTS.md` only if it byte-matches the bundled content — rejected: it adds a network fetch to
the uninstall path and still surprises users who committed the file. Leave-alone is simpler and
safer.)

---

## 4. Plugin A packaging change — RULES.md → always-apply rule (D-S4)

### 4.1 Target file + frontmatter

**New file:** `rules/ro-orchestrator-invariant.md` (sibling of the existing
`rules/ro-definition-of-done.md`; follows the `ro-<kebab-name>.md` convention — and exactly the
name DrPe proposed in `RESEARCH-SCAFFOLD.md` R4 option 2, lines 407-410).

**Frontmatter (exact):**

```yaml
---
alwaysApply: true
description: Elon orchestrator invariant — the root session IS Elon and must delegate to a team agent; it never implements directly. The harness enforces the tool set at runtime; this rule reinforces the role contract.
---
```

- `alwaysApply: true` — required so omp attaches it every turn and survives compaction (same
  mechanism as the DoD rule, `rules/ro-definition-of-done.md:1-3`). Loaded by the
  `omp-plugins` provider's `<ext-root>/rules/*.md` scan (`omp-plugins.ts:92-107`,
  `RESEARCH-SCAFFOLD.md` F4/F5).
- `description` — added (the DoD rule omits it); aids omp's rule picker UI and disambiguates this
  rule from the DoD rule. omp rule frontmatter accepts `description` alongside `alwaysApply`.

**Ships automatically:** Plugin A's `files` already includes `"rules"` (`package.json:7`), so the
new rule is published with no `package.json` change. It loads in **both** GLOBAL and LOCAL —
Plugin A's `<ext-root>/rules/` is scanned in both (`omp-extension-roots.ts:180-189` surfaces
node_modules roots; `RESEARCH-SCAFFOLD.md` F5).

### 4.2 Body mapping (`scaffold/RULES.md` → `rules/ro-orchestrator-invariant.md`)

The body is the verbatim content of `scaffold/RULES.md` (`RULES.md:1-9`), unchanged in meaning:

| `scaffold/RULES.md` line | Maps to |
|---|---|
| `:1` `# Orchestrator Invariant (Sticky)` | Rule H1 (kept verbatim) |
| `:3` "This session IS Elon…" | Body prose |
| `:5` delegate-to-team-agent list | Body prose |
| `:6` tool-set enforcement (Elon's blocked tools) | Body prose |
| `:7` only-Elon-calls-`ask` | Body prose |
| `:8` classify TRIVIAL/FULL; "See `PROTO.md`" | Body prose (cross-ref still resolves — `PROTO.md` is deployed by §3) |
| `:9` escape hatch `OMP_BYPASS_ORCHESTRATOR=1` | Body prose |

DEVELOP copies the body verbatim (frontmatter prepended); no rewrite. The move is mechanical.

### 4.3 Duplication analysis (task item 2) — flag for Elon

**No functional duplication.** The two always-apply rules govern **distinct concerns:**

| Rule | Concern | Source |
|---|---|---|
| `rules/ro-definition-of-done.md` | **Epistemic discipline** — Landmark reasoning process, verification/claims, anti-sycophancy, multi-model awareness, process integrity | `ro-definition-of-done.md:5-161` |
| `rules/ro-orchestrator-invariant.md` (NEW) | **Role/routing discipline** — the root session is Elon, must delegate, never implements; tool set is harness-enforced; escape hatch | `scaffold/RULES.md:1-9` |

**Partial overlap (intentional, not a defect):** the "Elon must delegate / never implement"
message now appears in four places — the `enforce-orchestrator` gate (HARD block),
`src/append-system.default.md` (framing), `scaffold/AGENTS.md` (advisory), and this rule
(Sticky). This is **by-design multi-layer reinforcement**: `scaffold/AGENTS.md:80` states
"Prompt-level layers (RULES.md, APPEND_SYSTEM.md, AGENTS.md, PROTO.md) remain advisory and
reinforce the enforced invariants", and `RESEARCH-SCAFFOLD.md` F9 confirms the enforcement is NOT
broken — the prompt layers *reinforce* the harness-enforced invariants. The user chose **MOVE**
(D-S4) → DEVELOP implements the move. **Action for Elon:** no change required; the only
maintainer duty is to keep the four wordings from *contradicting* each other (they currently
agree). Two short always-apply rules add negligible prompt cost.

### 4.4 Required coherence edits to `scaffold/AGENTS.md` (consequent on D-S4)

Because `RULES.md` ceases to exist as a file (its content became an enforced rule), and because a
second always-apply rule now ships, the deployed `AGENTS.md` (fetched per §3.1) must be
self-consistent. DEVELOP edits **`scaffold/AGENTS.md` in the repo** (the deployed copy then
reflects it via the §3 fetch):

| `scaffold/AGENTS.md` location | Current | Required edit |
|---|---|---|
| `:7` (Architecture ¶1) | names only the DoD rule | add the orchestrator-invariant rule (`rules/ro-orchestrator-invariant.md`, `alwaysApply`) |
| `:21-30` (Enforcement layers table) | one "Sticky" row for the DoD rule | add a second "Sticky" row for `rules/ro-orchestrator-invariant.md` (always-apply, re-attached every turn) |
| `:80` (Harness Precedence ¶) | lists "**RULES.md**" among the prompt-level advisory files | **remove `RULES.md`** from that list — it no longer exists as a bare file; its content is now an enforced always-apply rule (Sticky layer), not a prompt-level advisory |

These are tracked as AC-S7. (Tracked here, not in SPEC.md, to avoid clobbering it.)

### 4.5 Removal of the inert copy

`scaffold/RULES.md` is **deleted** (D-S4: "Remove the misleading inert root/scaffold copy"). There
is **no root-level `RULES.md`** in the repo (confirmed: only `scaffold/RULES.md` exists —
`rules/` holds only `ro-definition-of-done.md`), so no second removal is needed. After the move,
`rules/` contains two always-apply rules; `scaffold/` contains `AGENTS.md`, `PROTO.md`,
`APPEND_SYSTEM.md` (the override template — see R-S4).

---

## 5. Artifact-table update — the cwd-deploy surface (orthogonal to the omp home)

This spec **amends SPEC.md §3.2**: the cwd-deploy surface is a NEW artifact class, identical in
both modes. (Recorded here as an amendment; SPEC.md is not edited.)

| Artifact | GLOBAL | LOCAL | omp loads it? |
|---|---|---|---|
| **AGENTS.md** (deployed) | `$PWD/AGENTS.md` | `$PWD/AGENTS.md` | **YES** — `agents-md.ts:21-59` walk-up from cwd |
| **PROTO.md** (deployed) | `$PWD/PROTO.md` | `$PWD/PROTO.md` | NO — doc-only (read on demand) |
| **APPEND_SYSTEM.md** override (user-authored, optional) | `$PWD/.omp/APPEND_SYSTEM.md` | `$PWD/.omp/APPEND_SYSTEM.md` | **YES** (if present) via Plugin A `enforce-orchestrator.ts:136`; else the Plugin A bundled default is used |
| **RULES.md-derived rule** (Plugin A packaging, D-S4) | inside `~/.omp/plugins/node_modules/elon-ko-gate/rules/ro-orchestrator-invariant.md` | inside `$OMP_LOCAL_HOME/omp/plugins/node_modules/elon-ko-gate/rules/ro-orchestrator-invariant.md` | **YES** — `omp-plugins.ts:92-107` `rules/` scan |

**Key invariant (load-bearing):** the three `<cwd>`-relative targets are **mode-agnostic** — omp
discovers them relative to cwd, so LOCAL changes nothing about their paths
(`RESEARCH-SCAFFOLD.md` F8 asymmetry: plugin paths move with the omp home; cwd files do not). The
Plugin A rule is omp-home-relative and therefore DOES move GLOBAL→LOCAL, like all Plugin A content.

**Amendment to SPEC.md §4.1 (GLOBAL no-regression contract):** the GLOBAL "byte-identical modulo"
set gains a **third** additive item — the scaffold-deploy stdout (`say`/`ok`/`warn` lines, §3.2)
and the deploy notice in the summary (§3.4). These are **additive stdout** plus **two `<cwd>`
writes** (`$PWD/AGENTS.md`, `$PWD/PROTO.md`). They are **NOT new global paths/dirs**, so
SPEC.md NFR-1/AC-1 ("no new global paths") still holds. VALIDATE must treat the deploy output +
the two cwd writes as **conformant**, not as an AC-1 regression. (The existing two GLOBAL
deviations — the `~/.omp/elon-ko.install.json` marker and the coexistence notice, SPEC.md §4.1 —
are unchanged.)

---

## 6. Acceptance criteria (mapped to spec sections; "how Validator verifies")

These are **additive** to SPEC.md AC-1..AC-12 (which still apply — see AC-S6). `S` = scaffold.

| AC | Decision ref | Satisfied by | How Validator verifies |
|---|---|---|---|
| **AC-S1** (AGENTS.md deployed + overwrite-always, both modes) | D-S1 | §3.1, §3.2 | Run `bash elon_ko.sh` (GLOBAL) and `bash elon_ko.sh -local` (LOCAL) in a clean test project. After each: `test -f "$PWD/AGENTS.md"` and `cmp "$PWD/AGENTS.md" <(curl -fsSL https://raw.githubusercontent.com/rokicool/elon-ko/v2.3.1/scaffold/AGENTS.md)`. **Overwrite-always proof:** pre-seed `$PWD/AGENTS.md` with sentinel `__MARKER__`; run install; assert the file no longer contains `__MARKER__` and equals the fetched source. Atomic-write proof: no `.AGENTS.md.tmp.*` left behind. |
| **AC-S2** (PROTO.md deployed, both modes) | D-S3 | §3.1, §3.2 | After each mode: `test -f "$PWD/PROTO.md"` and it equals the fetched source at the deployed ref. Overwrite-always (same sentinel test). |
| **AC-S3** (AGENTS.md is load-bearing via omp walk-up) | D-S1 | §2, §3.1 | **Source-grounded proof (primary):** `discovery/agents-md.ts:21-59` walks up from `ctx.cwd` and reads `path.join(current,"AGENTS.md")`; AC-S1 proves the file exists at `$PWD/AGENTS.md` ⇒ omp discovers it. **Optional live proof:** start an omp session in `$PWD` after install and confirm `AGENTS.md` appears in the resolved context (ContextFile). |
| **AC-S4** (APPEND_SYSTEM stays load-bearing; NOT deployed) | D-S2 | §2, §3.3 | After each mode (clean project, no pre-existing override): assert `$PWD/.omp/APPEND_SYSTEM.md` was **NOT created** by the installer. Confirm Plugin A's bundled default injects it (`src/enforce-orchestrator.ts:87-94,133-151`; override path `:136`). Confirm installer output + README document the `<cwd>/.omp/APPEND_SYSTEM.md` override. |
| **AC-S5** (RULES.md moved into Plugin A; load-bearing) | D-S4 | §4 | In the published Plugin A package: `rules/ro-orchestrator-invariant.md` exists with frontmatter `alwaysApply: true` (+ `description`); its body equals the former `scaffold/RULES.md` content. `scaffold/RULES.md` is **gone**; no root `RULES.md` exists. **Load-bearing proof:** `omp-plugins.ts:92-107` scans `<ext-root>/rules/*.md`; `package.json:7` `files` includes `"rules"` ⇒ it ships and loads in both modes (Plugin A node_modules root surfaced by `omp-extension-roots.ts:180-189`). |
| **AC-S6** (no regression to the 12 install-mode ACs) | — | §5 | Re-run SPEC.md §14 AC-1..AC-12. All pass. **Specifically AC-1:** a no-flag GLOBAL install on a clean machine produces output identical to the pre-change script **modulo** (i) the `~/.omp/elon-ko.install.json` marker, (ii) the coexistence notice, and **(iii) NEW — the scaffold-deploy stdout + the deploy summary notice + the two `<cwd>` writes** (`$PWD/AGENTS.md`, `$PWD/PROTO.md`). No new **global** paths/dirs are introduced. **AC-2:** LOCAL still writes nothing under the enumerated global footprint (the cwd writes are inside the project tree, excluded from the AC-2 assertion per SPEC.md §11). |
| **AC-S7** (AGENTS.md coherence post-D-S4) | D-S4 | §4.4 | `scaffold/AGENTS.md:80` no longer lists `RULES.md` among prompt-level advisory files; the Enforcement-layers table (`:21-30`) and Architecture ¶1 (`:7`) name `rules/ro-orchestrator-invariant.md` as a second Sticky/always-apply rule. (Validated on the repo source; the deployed copy reflects it via §3.1.) |
| **AC-S8** (failure semantics) | D-S1/D-S3 | §3.2, §3.3 | Simulate AGENTS.md fetch failure (bad ref / offline): installer **dies** with the §3.2 message in both modes and leaves **no** `$PWD/AGENTS.md` (and no `.tmp` file). Simulate PROTO.md fetch failure (AGENTS.md succeeds): installer **warns and continues** (exit 0), `$PWD/AGENTS.md` present, `$PWD/PROTO.md` untouched. |
| **AC-S9** (re-run idempotency) | D-S1/D-S3 | §3.3, §10.1 | Run either mode twice: second run re-fetches and overwrites `$PWD/AGENTS.md` + `$PWD/PROTO.md` to the current ref's version (overwrite-always, no error on existing files); no `.tmp` artifacts; no duplicate deploys. |
| **AC-S10** (uninstall leaves `<cwd>` files) | §3.5 | §3.5 | Snapshot `$PWD/AGENTS.md` + `$PWD/PROTO.md`; run `bash elon_ko.sh uninstall` and `bash elon_ko.sh -local uninstall`; assert both files **byte-identical** pre/post; assert each uninstall summary contains the one-line "left in place" note. |

---

## 7. Behavioral change map — file:line (for DEVELOP)

| File / region | Current | Change in this spec | Driven by |
|---|---|---|---|
| `elon_ko.sh` (new helper, after `:212`) | — | **ADD** `deploy_scaffold()` (§3.2) | D-S1/D-S3 |
| `elon_ko.sh:467` (LOCAL, after Plugin B) | — | **ADD** `deploy_scaffold "$REF"` call (§3.2) | D-S1/D-S3 |
| `elon_ko.sh:619` (GLOBAL, after Plugin B) | — | **ADD** `deploy_scaffold "$REF"` call (§3.2) | D-S1/D-S3 |
| `elon_ko.sh:644-659` (GLOBAL stable summary) | plugins list → gate-dormant | **ADD** deploy notice block (§3.4) | D-S1/D-S2/D-S3 |
| `elon_ko.sh:495-526` (LOCAL summary) | plugins list → activate | **ADD** deploy notice block (§3.4) | D-S1/D-S2/D-S3 |
| `elon_ko.sh:244-257` (LOCAL uninstall summary) | lists what was removed | **ADD** "AGENTS.md/PROTO.md left in place" line (§3.5) | §3.5 |
| `elon_ko.sh:286-301` (GLOBAL uninstall summary) | lists what was removed | **ADD** "AGENTS.md/PROTO.md left in place" line (§3.5) | §3.5 |
| `rules/ro-orchestrator-invariant.md` (NEW) | does not exist | **ADD** (frontmatter + body from `scaffold/RULES.md`, §4.1/§4.2) | D-S4 |
| `scaffold/RULES.md` | exists (inert) | **DELETE** (§4.5) | D-S4 |
| `scaffold/AGENTS.md:7,21-30,80` | references only DoD rule; lists `RULES.md` as advisory | **EDIT** per §4.4 (add 2nd Sticky rule; drop `RULES.md` from advisory list) | D-S4 |
| `package.json:7` | `files:["src","rules",...]` | **Unchanged** (already includes `rules`) | D-S4 |
| `.omp-plugin/marketplace.json:17` | `agents:[…]` present | **Unchanged** (stays as catalog metadata; no `count`) | IDEA-003 |

**No change** to: the omp-home install flow (SPEC.md), the dual-knob, `enforce-orchestrator.ts`,
`src/append-system.default.md`, Plugin B (`plugins/agents/`), the gate opt-in marker
`.omp/elon.json`, or the omp/bun external installers.

---

## 8. Non-functional requirements

- **NFR-S1 (mode-agnostic).** The cwd-deploy surface (AGENTS.md, PROTO.md, optional APPEND_SYSTEM
  override) is **identical** in GLOBAL and LOCAL: same source (`raw.githubusercontent.com/${REPO}/${REF}`),
  same target (`$PWD/…`), same overwrite semantics. LOCAL adds no special handling (§1, §5).
- **NFR-S2 (single source of truth).** No bundled duplicate of `AGENTS.md`/`PROTO.md` in
  `elon_ko.sh`; the repo `scaffold/` is the sole content source (§3.1).
- **NFR-S3 (non-destructive uninstall).** Uninstall never removes project-tree files
  (`<cwd>/AGENTS.md`, `<cwd>/PROTO.md`) in either mode (§3.5).
- **NFR-S4 (no new global writes).** The deploy writes only to `$PWD` (cwd), never under the
  SPEC.md NFR-4 enumerated global footprint — preserves SPEC.md AC-2/AC-1 (§5).
- **NFR-S5 (failure semantics).** AGENTS.md (load-bearing) fetch failure is **fatal** (die, no
  partial file); PROTO.md (doc) fetch failure is **non-fatal** (warn + continue) (§3.2, §3.3).
- **NFR-S6 (portability).** The deploy uses only POSIX `curl`/`mv`/`rm`/`printf` (already required
  by the installer); no GNU-only tools. `set -euo pipefail` semantics preserved (fetch failures are
  caught explicitly, not relied upon to abort).

---

## 9. Out of scope (SPEC phase)

- **No code changes** — this is the SPEC phase; DEVELOP implements (`elon_ko.sh` + Plugin A
  `rules/` + `scaffold/`).
- **No re-opening** of D-S1..D-S4, IDEA-003, or any SPEC.md decision (D1–D5, R1–R6, NFR-1..5,
  FR-1..15, AC-1..12, the dual-knob).
- **No user-facing docs** — DocWorm phase, conditional on Elon routing it (the README override
  documentation referenced in §3.4 is a DocWorm deliverable, not this spec).
- **No reconciliation of `scaffold/APPEND_SYSTEM.md` vs `src/append-system.default.md`** — whether
  the `scaffold/APPEND_SYSTEM.md` override template should remain or be removed is a cleanup
  question (R-S4); the installer does not deploy it either way (D-S2).
- **No changes to agent definitions** (Plugin B `plugins/agents/`), `marketplace.json` (IDEA-003:
  `agents[]` stays as metadata; **no `count`**), the gate, or the bundled APPEND_SYSTEM content.
- **No AGENTS.md content rewrite** beyond the D-S4 coherence edits (§4.4); the deploy fetches the
  repo `scaffold/AGENTS.md` as-is.
- **No change to the omp/bun external installers** or the dual-knob natives relocation.

---

## 10. Residual risks (for Elon, before DEVELOP)

- **R-S1 (MEDIUM) — stable-mode scaffold ref lags Plugin B's "always latest".** In stable mode the
  deployed `AGENTS.md`/`PROTO.md` are pinned to `$REF` (Plugin A's pin, `v2.3.1`), while Plugin B
  is "always latest" (`elon_ko.sh:442,581`). The `AGENTS.md` Agent Index could therefore lag
  Plugin B's actual roster by a release cycle. **Cosmetic only** — agent *definitions* are
  load-bearing via `tools:`/`spawns:` frontmatter (`<installPath>/agents/*.md`,
  `RESEARCH-SCAFFOLD.md` F6) regardless of what the advisory `AGENTS.md` says. **Mitigation chosen:
  pin to `$REF`** for gate-behavior consistency (AGENTS.md primarily documents the gate's
  enforcement architecture, which IS pinned to `$REF`). Alternative (key off `main` for
  agent-index freshness) rejected: it would decouple the deployed doc from the deployed gate.
- **R-S2 (LOW) — raw-GitHub fetch adds a network dependency for AGENTS.md deploy.** Mitigated: the
  installer is already network-bound (omp/bun/plugins); same host and `curl -fsSL` idiom as the
  tarball fetch (`elon_ko.sh:430,569`); AC-S8 makes AGENTS.md fetch failure fatal so no silent
  broken state.
- **R-S3 (LOW) — scaffold/AGENTS.md coherence edits must land in the repo.** The §4.4 edits
  (drop `RULES.md` from the advisory list; add the 2nd Sticky rule) must be committed for the
  deployed `AGENTS.md` to be self-consistent post-D-S4. Tracked as AC-S7.
- **R-S4 (LOW) — `scaffold/APPEND_SYSTEM.md` disposition unresolved.** With D-S2 (no deploy), the
  `scaffold/APPEND_SYSTEM.md` override template is no longer referenced by the installer. Whether
  it remains as the documented override example (DocWorm) or is removed is deferred — out of scope
  here; flagged for Elon.
- **R-S5 (LOW) — two always-apply rules ship.** `rules/ro-definition-of-done.md` +
  `rules/ro-orchestrator-invariant.md` both re-attach every turn. Both are short; combined prompt
  cost is negligible. No action beyond §4.3's "keep wordings non-contradictory".
