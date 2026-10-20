# PROJECT.md — Wrapper CHANGELOG gate (pre-PR/MR/release)

## Workflow
- Path: FULL — VALIDATE PASS; DONE: docs verified, release go/no-go pending (PA-6)
- Phase log: REQUEST (add5c09) → GRILL (b06320a) → SPEC (23e1c63) → DEVELOP (f158004) → VALIDATE (PASS 8/8, cycle 1/3) → DONE (docs 4/4 accurate, zero edits; PA-6 pending)

## Request (verbatim, condensed)
> Extend the wrapper functionality to support CHANGELOG file. Before doing any PR, MR or Release — it must update the CHANGELOG file. (Full template in REQ Appendix A; embedded at CHANGELOG tail L398–409.)

## Outcome (validated)
- Wrapper skill (both mirrors, `f2fdf9db…`): `<changelog_gate>` L73–106 byte-verbatim, W2 step-4 pointer, W3 input item. FR-1 ordering, FR-2 hybrid nest, FR-3 metadata-via-ask, FR-5 tag-to-tag baseline, 5 error cases. Ask forbidden; step numbering intact; validate-plugins ALL CHECKS PASSED.
- CHANGELOG.md tail: template verbatim, append-only (hash-proven).
- Guards held; +1-blank-line deviation adjudicated acceptable.
- Docs: README/DEVREADME/AGENTS/PROTO 4/4 accurate (DocWorm, no edits — contributing line "Update CHANGELOG.md per release, following Keep a Changelog format" remains true under the gate).

## Decision log
- [2026-10-20] PA-1..PA-5 agreed (hybrid nest / bundled metadata / wrapper-only / embed verbatim / tag-to-tag).
- [2026-10-20] Validator: deviation acceptable. DocWorm: no doc edits.
- [2026-10-20] PA-6 asked: release go/no-go + FR-3 metadata fields (engineer/ticket, fallbacks git-author/N-A).

## Delegation Log
- ReqGuru — GRILL + REQ.md. COMPLETED ×2. | LeadDev — SPEC. COMPLETED.
- LeadDev/MidDev — DEVELOP. COMPLETED (f158004). | Validator — VALIDATE. PASS.
- DocWorm — DONE docs. COMPLETED (4/4 accurate, zero edits, no commit needed).

## Pending Asks
- [PA-6] 2026-10-20 origin=elon status=pending | Release go/no-go: spawn Wrapper to cut v2.8.3 under the new gate (first dogfood entry, prevTag v2.8.2..newTag, hybrid-nest format, metadata per answers) — or stop here (changes local on main)?
