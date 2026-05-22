---
id: AUDIT--TEMPLATE
phase: 6
type: audit
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Test results / quality report>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for AUDIT atoms — Test results / quality report"
tags: [audit]
aliases:
  - AUDIT
  - implementation_flow
  - Test results / quality report
cluster: implementation_flow
role: Test results / quality report
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

# AUDIT — <Subject>

## Scope

What was tested. Reference the blueprint's `verification_plan` items
covered.

## Results

| Check | Status | Notes |
|---|---|---|
| <test 1> | ✓ pass | ... |
| <test 2> | ✗ fail | ... |
| <test 3> | ⚠ warn | ... |

## Drift checks

- doc-to-code drift: ✓ / ✗  (see `gks lookup-by-symbol` output)
- schema validation: ✓ / ✗
- linked_symbols still valid: ✓ / ✗

## Sign-off

- [ ] all blocking failures triaged
- [ ] non-blocking warnings logged as `ISSUE--`
- [ ] ready to merge / deploy
