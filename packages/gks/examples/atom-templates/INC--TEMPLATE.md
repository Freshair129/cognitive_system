---
id: INC--TEMPLATE
phase: 6
type: inc
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Incident post-mortem>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for INC atoms — Incident post-mortem"
tags: [inc]
aliases:
  - INC
  - ops
  - Incident post-mortem
cluster: ops
role: Incident post-mortem
crosslinks:
  references: []
linked_symbols: []
granularity: general
salience_anchor:
  summary: ""
  anchor_phrase: ""
relationship_type: parent
conflicts_with: []
epistemic_status:
  confidence: 1.0
  source_type: axiom
  contradictions: []
attributes:
  domain: general
---

# INC — <Incident summary>

## Timeline

| Time | Event |
|---|---|
| HH:MM | <detection> |
| HH:MM | <escalation> |
| HH:MM | <mitigation> |
| HH:MM | <full recovery> |

## Impact

- users affected: <count / %>
- duration: <min>
- data loss: <yes/no — explain>
- SLA breach: <yes/no — which SLO-->

## Root cause

What actually caused it. Be precise — "config drift" is not a root cause,
"the deploy script overwrote `MAX_POOL_SIZE` from 200 to 20" is.

## Resolution

What was done to mitigate (immediate) + remediate (durable).

- **immediate:** <what stopped the bleeding>
- **durable:** ADR--<chosen approach>

## Lessons

- what worked: ...
- what didn't: ...
- what we'd do differently: ...

## Action items

- [ ] <ACTION 1> — owner, due date
- [ ] <ACTION 2>
- [ ] add GUARDRAIL--<name> to prevent recurrence (if applicable)
