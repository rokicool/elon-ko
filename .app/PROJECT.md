# PROJECT.md — Wrapper CHANGELOG gate (pre-PR/MR/release)

## Workflow
- Path: FULL — VALIDATE PASS; DONE complete; RELEASE (Wrapper) in flight per PA-6 — first gate dogfood
- Phase log: REQUEST (add5c09) → GRILL (b06320a) → SPEC (23e1c63) → DEVELOP (f158004) → VALIDATE (PASS 8/8, cycle 1/3) → DONE (638b9dd) → RELEASE (v2.8.3, gate exercise)

## Request (verbatim, condensed)
> Extend the wrapper functionality to support CHANGELOG file. Before doing any PR, MR or Release — it must update the CHANGELOG file. (Full template in REQ Appendix A; embedded at CHANGELOG tail L398–409.)

## Outcome (validated)
- Wrapper skill (both mirrors `f2fdf9db…`): `<changelog_gate>` L73–106 byte-verbatim; FR-1 ordering, FR-2 hybrid nest, FR-3 metadata, FR-5 tag-to-tag; 5 error cases; ask forbidden; validate-plugins ALL CHECKS PASSED.
- CHANGELOG.md tail: template verbatim, append-only. Guards held; deviation ruled cosmetic. Docs 4/4 accurate, zero edits.

## Decision log
- [2026-10-20] PA-1..PA-5 agreed (hybrid nest / bundled metadata / wrapper-only / embed verbatim / tag-to-tag).
- [2026-10-20] Validator: deviation acceptable. DocWorm: no edits.
- [2026-10-20] PA-6 agreed: Release now; Engineer = git author (default), Ticket = N/A (default).

## Delegation Log
- ReqGuru — GRILL + REQ.md. COMPLETED ×2. | LeadDev — SPEC. COMPLETED.
- LeadDev/MidDev — DEVELOP. COMPLETED (f158004). | Validator — VALIDATE. PASS.
- DocWorm — DONE docs. COMPLETED (4/4 accurate).
- Wrapper — RELEASE v2.8.3 under new gate. IN FLIGHT (first dogfood entry: v2.8.2..v2.8.3, hybrid nest, Engineer=git author, Ticket=N/A; then branch/PR/tag/publish/sync; NEXT-RELEASE ACs exercised live).

## Pending Asks
- [PA-6] 2026-10-20 origin=elon status=agreed | Release now → Wrapper in flight with FR-3 defaults.
