---
id: FLOW--TEMPLATE
phase: 2
type: flow
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Data / UI flow>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for FLOW atoms — Data / UI flow"
tags: [flow]
aliases:
  - FLOW
  - implementation_flow
  - Data / UI flow
cluster: implementation_flow
role: Data / UI flow
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

# FLOW — <Title>

## Trigger

What initiates this flow? (user action, scheduled job, upstream event)

## Sequence

```
Actor A ──→ Actor B: <message / data>
Actor B ──→ Actor C: <message / data>
                   ←──── <response>
Actor C ──→ Storage: <write>
```

## Failure modes

- if step N fails: <recovery / rollback>
- timeout: <handling>

## See also

- (Obsidian Canvas alternative: `FLOW--<name>.canvas` for visual layout)
