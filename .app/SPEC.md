# SPEC — Wrapper CHANGELOG Gate (pre-PR/MR/release)

Status: COMPLETE. Source contract: `.app/REQ.md` (b06320a, 2026-10-20) — every requirement below
traces to an FR/NFR/AC there. Baseline commit: `b06320a` (HEAD, clean tree). No open questions.

Change shape: **3 prose edits to `plugins/agents/skills/wrapper/SKILL.md` + byte-identical mirror,
plus 1 append-only edit to `CHANGELOG.md`.** No refactors, no renumbering, no tool/frontmatter/CI
changes. One MidDev task, one commit.

## 1. Verified baseline (read-confirmed 2026-10-20, commit b06320a)

| File | sha256 | Key anchors |
|---|---|---|
| `plugins/agents/skills/wrapper/SKILL.md` | `59277d78b1f716349c11fea875a7f4b9cc787a132ad0a60e688aa2567a082c34` | input_contract items L55–57; `</output_contract>` L70; blank L71; `<protocol>` L72; step 4 L81; write/edit tool policy L28–29 already permits CHANGELOG |
| `.agents/skills/wrapper/SKILL.md` | `59277d78…` (identical — `diff` empty, verified) | identical line numbering (B4) |
| `plugins/agents/agents/wrapper.md` | `261bf848212ad037fe162998ace5f1a60023ad395480e5564feb2c20b31c6657` | NO-CHANGE surface; `tools: bash, read, write, edit, find, search` L4; no changelog wording anywhere (B5) |
| `.omp/agents/wrapper.md` | `261bf848…` (identical — `diff` empty, verified) | NO-CHANGE surface |
| `CHANGELOG.md` | `af99709dc8dc28adf94c8cfde6e9d698eec7d884c669391b1f0adb5a1fe7e38a` | 397 lines, 37 632 bytes, ends `  ``` + \n`; preamble L1–10 (`# Changelog`, KaG/SemVer declaration, Project-renamed note); first version section L12 `## [v2.8.2] - 2026-10-20`; tail L391–397 (v1.2.2 fenced bash block) |

External guard (not in surface, must not regress): the v2.8.2 ask-first go/no-go lives in
`plugins/agents/skills/elon/SKILL.md` L211 ≡ `.agents/skills/elon/SKILL.md` L211 (DONE phase).
Both are **untouched** by this change; NFR-1 holds because engineer/ticket ride the existing ask
(FR-3) and wrapper's `ask` tool remains forbidden (skill L35).

Exactly two wrapper SKILL.md copies exist in the repo (`find` verified); `scripts/validate-plugins.sh`
Step I already enforces mirror byte-identity via `cmp` (L267–282) — the repo's built-in check covers NFR-2.

## 2. Design

Rationale in one line each:
- **New `<changelog_gate>` block, not a new protocol step:** steps 0–8 + E are referenced by
  number in REQ/PROJECT.md/changelog history; inserting or renumbering steps is a refactor. A
  sibling section next to `<protocol>` + a pointer from step 4 keeps FR-1 load-bearing at the
  action site with zero renumbering.
- **Entry rides the step-4 commit** (FR-1): step 4 already precedes steps 6–7, so ordering is
  enforced by the existing flow — no new ordering machinery.
- **Step 3 interaction:** step 3 (VERIFY DOCS) already reads CHANGELOG; doc *content* fixes
  remain DocWorm's domain. Only the version entry itself is wrapper's to write (tool policy L28–29).
- **Append-only CHANGELOG adoption:** NFR-4 satisfied by construction (pure tail append).

### 2.1 Edit W1 — insert `<changelog_gate>` block (both SKILL.md copies)

Insert between `</output_contract>` (L70, blank L71) and `<protocol>` (L72) — i.e. after L71.
Full text to insert verbatim (entities `&lt;…&gt;` are intentional; MidDev must NOT "fix" them):

```xml
<changelog_gate>
  <duty>
    Before opening or merging any PR/MR and before creating any <code>vX.Y.Z</code> tag or platform release, wrapper MUST have already written and committed the CHANGELOG entry for that exact version. Entry generation happens at/before step 4 (RELEASE BRANCH) and rides that step's version-bump commit, which already precedes steps 6 (PR/MR + merge) and 7 (tag + release). A wrapper release action observable without a prior changelog-entry commit for that version is a gate violation. If wrapper cannot produce a conforming entry, ESCALATE (Elon-decides) per step E — never skip the gate, never proceed tag/PR-less, never write a vacuous entry.
  </duty>
  <scope>
    The gate binds wrapper's release actions in any project that already maintains a CHANGELOG. CI auto-published <code>pr-*</code> pre-releases are not wrapper actions and are exempt. If the project maintains no CHANGELOG, do not create one — the write tool policy already limits CHANGELOG writes to projects that maintain one. Create one only on explicit request; a CHANGELOG created on explicit request includes the embedded template (see <code>&lt;embedded_prompt&gt;</code>) at its tail from the start.
  </scope>
  <entry_format>
    Each entry is a new version section placed as the FIRST version section in the file — above the current newest <code>## [vX.Y.Z]</code> section, BELOW the standing file preamble (<code># Changelog</code> title, the Keep-a-Changelog/SemVer declaration, and the Project-renamed note). The template's "new entries at file beginning" is realized as exactly this position. Existing entries are never modified: on every prepend, all pre-existing bytes below the insertion point are preserved verbatim. Layout — the template's date heading folded into the version header; only KaG categories with content appear (Added / Changed / Deprecated / Removed / Fixed / Security); <code>#### Details</code> and <code>#### Affected Files</code> appear exactly once per entry as <code>####</code> siblings closing the entry after the category subsections:

    ## [vX.Y.Z] - YYYY-MM-DD

    **Engineer:** &lt;name&gt; &lt;email&gt;
    **Ticket:** &lt;ticket or N/A&gt;

    ### &lt;KaG category&gt;
    - &lt;formal, concise, past-tense bullet naming affected files/components; no trivial changes&gt;

    #### Details
    &lt;what and why; formal register, no emoji&gt;

    #### Affected Files
    &lt;all non-trivial files grouped by top-level directory/component&gt;
  </entry_format>
  <metadata>
    Engineer name + email and ticket/story come from Elon's delegation when the v2.8.2 release go/no-go ask supplied them — the gate adds no new consent prompt. Fallback when they were not supplied: engineer = git author (name + email) of the release commit; ticket = <code>N/A</code>. Both fields are always present in every entry — never omitted, never left as placeholders.
  </metadata>
  <baseline>
    Release entries (this flow) document the diff/changed-files over <code>prevTag..newTag</code>. If no prior tag exists, ESCALATE (Elon-decides), consistent with step 1 — never invent a baseline. Non-release PRs (other projects / hypothetical in this repo) compare the current branch vs <code>main</code>. Affected Files lists ALL non-trivial changed files, grouped by top-level directory/component — no count cap, no truncation.
  </baseline>
  <embedded_prompt>
    This repo's CHANGELOG.md embeds the full entry-generation template verbatim at its tail, behind a <code>---</code> separator and an identifying heading. The embedded copy is written once at adoption and re-edited only when the template itself changes; maintaining it is trivial-change-exempt — it never self-triggers a changelog entry or bullet, and CHANGELOG.md's own prompt-maintenance edits are excluded from bullets and Affected Files as trivial.
  </embedded_prompt>
</changelog_gate>
```

FR coverage: `duty`=FR-1, `scope`=PA-3/err-3, `entry_format`=FR-2+NFR-4+NFR-5, `metadata`=FR-3+NFR-1,
`baseline`=FR-5+err-2, `embedded_prompt`=FR-4+NFR-3+AC-6 mechanism.

### 2.2 Edit W2 — step-4 pointer (both SKILL.md copies)

Replace L81 (original numbering) — before:

```
  <step n="4" severity="MUST" label="RELEASE BRANCH">Create <code>release/vX.Y.Z</code>, commit ONLY the version bump (+ CHANGELOG if the project already maintains one), and push to origin. Do not bundle unrelated changes.</step>
```

after:

```
  <step n="4" severity="MUST" label="RELEASE BRANCH">Create <code>release/vX.Y.Z</code>, commit ONLY the version bump (+ the CHANGELOG entry generated per <code>&lt;changelog_gate&gt;</code> if the project already maintains one), and push to origin. Do not bundle unrelated changes.</step>
```

Only the parenthetical changes; everything else on the line is byte-identical.

### 2.3 Edit W3 — input-contract item (both SKILL.md copies)

Insert one `<item>` after L56 (original numbering), before the `NO specs…` item:

```
  <item>optionally, engineer name + email and ticket/story from the release go/no-go ask — consumed by <code>&lt;changelog_gate&gt;</code>; absent fields fall back per that section.</item>
```

This is the only wiring FR-3 needs: the ask is Elon's (elon skill L211, untouched); the item makes
the relayed fields part of wrapper's declared input. No new prompt anywhere.

### 2.4 Edit C1 — CHANGELOG.md adoption (append-only)

Append after L397 (file currently ends `  ``` + \n`). Exact new lines 398–409:

```

---

## Generate CHANGELOG Entry from Git Diff

"Generate CHANGELOG Entry from Git Diff": Role = precise formal technical writer, no emoji.
Compare current branch vs `main`. Entry format: `### <YYYY-MM-DD>` → `**Engineer:** <name>
<email>` → `**Ticket:** <ticket/story>` → `#### Changed` (formal concise bullets, past
tense, affected files/components named, no trivial changes) → `#### Details` → `####
Affected Files`. New entries at file beginning; never modify existing entries; add/update
this prompt at file end. KaG categories: Added/Changed/Deprecated/Removed/Fixed/Security.
Inputs: diff/changed-files vs main, engineer name, Jira ticket.
```

(Line 398 is blank; lines 403–409 are REQ Appendix A lines 195–201 with the `> ` blockquote
markers stripped — verbatim including line wrapping; note the template's literal
"file beginning" wording is preserved here while the hybrid-nest interpretation lives in the
skill's `<entry_format>`.) Nothing else in the file changes.

### 2.5 Explicit non-changes (guards)

- `.app/REQ.md` — untouched.
- `plugins/agents/agents/wrapper.md` + `.omp/agents/wrapper.md` — untouched; post-check sha256
  = `261bf848…` both; `tools:` frontmatter unchanged (AC-1c/AC-3).
- elon SKILL.md (both mirrors, L211 go/no-go) — untouched; exactly one ask remains (NFR-1).
- No CI/workflow, `src/`, `scripts/`, or any `tools:` frontmatter change (NFR-6).
- DocWorm skill's own changelog step — untouched (Out of Scope).

## 3. Mirror byte-identity procedure + verification

1. Apply W1–W3 **only** to `plugins/agents/skills/wrapper/SKILL.md` (edit tool, one snapshot;
   original line anchors above; re-read if the snapshot tag goes stale).
2. Copy: `cp plugins/agents/skills/wrapper/SKILL.md .agents/skills/wrapper/SKILL.md`
   (edits applied once then copied — structurally immune to drift; both copies were
   byte-identical pre-edit, verified §1).
3. Verify:
   - `diff plugins/agents/skills/wrapper/SKILL.md .agents/skills/wrapper/SKILL.md` → empty;
   - `shasum -a 256` both copies → identical, and ≠ baseline `59277d78…`;
   - `bash scripts/validate-plugins.sh` → Step I mirror checks all `ok` (repo's own enforcement).

## 4. Sequencing — one MidDev task

Single task, ordered steps (no parallelism; three small edits + one copy):
1. Read `plugins/agents/skills/wrapper/SKILL.md` (fresh snapshot).
2. W3 (insert after L56) → W1 (insert after L71) → W2 (replace L81) — original numbering per §2.
3. §3 steps 2–3 (copy + mirror verification).
4. Read `CHANGELOG.md` tail; apply C1 exactly per §2.4; verify per §5 AC-2 checks.
5. Report: hashes of all 5 files + the four check outputs below. MidDev runs no builds/tests
   beyond these file-level checks (repo convention: VALIDATE runs the suites).

## 5. AC → check validation matrix

| REQ AC | Check (command → expected signal) | Phase |
|---|---|---|
| AC-1 prose | `grep -c changelog_gate` both SKILL copies → ≥2 (block + step-4 pointer); `grep -c "prevTag..newTag\|git author\|FIRST version section"` both → ≥1 each (FR-1/2/3/5 present) | NOW |
| AC-1 mirrors | §3.3: `diff` empty; shasum equal; `validate-plugins.sh` Step I `ok` | NOW |
| AC-1c frontmatter | `shasum` agent defs = `261bf848…` ×2; `git status --porcelain` shows no change to either path | NOW |
| AC-2a embedded verbatim | `diff <(sed -n '195,201p' .app/REQ.md | sed 's/^> //') <(sed -n '403,409p' CHANGELOG.md)` → empty | NOW |
| AC-2b entries immutable | `git diff -U0 -- CHANGELOG.md` → single hunk `397a398,…`, zero `-` lines; `head -397 CHANGELOG.md \| shasum -a 256` = sha of `git show HEAD:CHANGELOG.md \| head -397` | NOW |
| AC-2c next entry format | Next release's section matches §2.1 layout incl. Engineer/Ticket | NEXT-RELEASE |
| AC-3 agent defs | hash compare per AC-1c row | NOW |
| AC-4 ordering | At next release: entry commit precedes PR open + tag/release in observable history | NEXT-RELEASE |
| AC-5 single ask | At next release: one go/no-go ask carrying engineer/ticket; `grep` confirms no new ask-mechanism text in wrapper skill (ask still forbidden, L35) | NOW (mechanism) / NEXT-RELEASE (exercise) |
| AC-6 no self-trigger | §2.1 `embedded_prompt` trivial-exempt prose present (NOW); next release's entry contains no bullet/Affected-Files line about the embedding (NEXT-RELEASE) | both |

Validator scope for this DEVELOP cycle = every NOW row. NEXT-RELEASE rows are observational at
the first gate exercise (the release shipping this feature, per REQ Adoption Path).

## 6. Error-case coverage (REQ §Error Cases → spec location)

| REQ case | Covered by |
|---|---|
| Ask lacks engineer/ticket | §2.1 `metadata` fallbacks; fields always present (FR-3) |
| No prior tag | §2.1 `baseline` → ESCALATE (aligns step 1) |
| CHANGELOG absent (other projects) | §2.1 `scope` → only-if-maintained; create on explicit request incl. embedded tail |
| Entry cannot conform | §2.1 `duty` → ESCALATE, never vacuous/tag-less |
| Template changes later | §2.1 `embedded_prompt` → update copy, trivial-exempt |

## 7. Commit plan

One commit, by LeadDev at integration (after review + NOW-row checks pass), on `main`
(repo convention — linear history, DEVELOP commits land directly):

```
git add plugins/agents/skills/wrapper/SKILL.md .agents/skills/wrapper/SKILL.md CHANGELOG.md
git commit -m "[DEVELOP] wrapper CHANGELOG gate: skill prose (both mirrors) + template embedded at CHANGELOG tail"
```

Excluded from the commit (and asserted unchanged): `.app/REQ.md`, both agent-def mirrors,
elon skills, `scripts/`, `src/`, `.github/`. Elon then records SPEC/phase artifacts as [PROTO]
per protocol. The release shipping this change generates the first gate entry (Adoption Path,
REQ §Surface Inventory) — that release's `prevTag..newTag` diff will contain this commit; per
§2.1 `embedded_prompt`, the CHANGELOG-tail embedding itself is excluded from that entry's bullets
and Affected Files as trivial (AC-6), while the gate prose (skill files) is documented normally.

## 8. Non-goals

No implementation in this phase beyond the four edits above; no Unreleased-section staging (Q1
rejected); no CI enforcement (Q3); no gate-source (`src/enforce-orchestrator.ts`) change; no
edits outside surfaced paths.
