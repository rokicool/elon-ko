# Ideas

Stored ideas/suggestions for the Elon protocol. One block per idea, newest
appended at the end. Human-editable; lifecycle governed by the `status` field
on each block. Writes are owned by DocWorm (Elon commits via `[PROTO]`).

Status values:
- `parked` — captured, awaiting decision. Surfaced by reminder matching on related turns.
- `promoted` — promoted into a fresh `.app/REQ.md` to launch the FULL workflow. Block is kept for audit (`promoted_to`, `promoted_at`).
- `rejected` — decided not to pursue. Block is kept; may be re-opened later by setting `status: parked`.
- `superseded` — replaced by another idea; points to the replacement via `superseded_by`.

```idea
id: IDEA-001
created: 2026-06-28T00:00:00Z
source: /idea
title: Hire an additional team agent role
tags: agents, team, hiring, expansion
status: parked

hire another agent
```

```idea
id: IDEA-002
created: 2026-06-28T00:00:00Z
source: /idea
title: Add debug agent role to the team pipeline
tags: agents, debugging, tooling, team-expansion
status: promoted
promoted_to: .app/REQ.md
promoted_at: 2026-07-09T18:10:00Z

hire debug agent
```

```idea
id: IDEA-003
created: 2026-06-30T00:00:00Z
source: wrap-up
title: Is marketplace.json agents[] load-bearing? (+ missing count field)
tags: agents, marketplace.json, registration, omp-internals
status: parked

`.omp-plugin/marketplace.json` L17 `agents[]` already lists all 8 agents (hr, docworm, drpe, leaddev, middev, reqguru, validator, wrapper); L13 description "8-agent orchestrator roster + 9 skills." matches — NOT empty. However `hr SKILL.md` L79 mandates an `agents[] + count` registration and no `count` field exists anywhere in marketplace.json.

Open questions: (1) is `agents[]` actually read by omp at runtime (load-bearing) or vestigial? (2) should the missing `count` be added, and does anything consume it?

Resolve before the first real hire under the new HR DEV-BASE procedure (`scaffold/PROTO.md` Agent-to-Phase Map; `hr SKILL.md` §DEV-BASE) — that hire would otherwise be the first test case.
```
