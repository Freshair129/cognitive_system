---
id: RUNBOOK--TEMPLATE
phase: 6
type: runbook
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Operational response guide>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for RUNBOOK atoms — Operational response guide"
tags: [runbook]
aliases:
  - RUNBOOK
  - ops
  - Operational response guide
cluster: ops
role: Operational response guide
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

# RUNBOOK — <Scenario>

## When to invoke

Trigger condition (alert text, SLO breach, dashboard signal). Be
specific enough that whoever's on-call knows in 5 seconds whether this
runbook applies.

## Severity

- **page:** yes/no
- **escalation:** <after N minutes if X>

## Diagnosis

1. <check command 1>
2. <check command 2>
3. interpret result: ...

## Mitigation steps

1. ⚠ **first**: <stop-the-bleeding action>
2. ...
3. verify: <how to confirm mitigation worked>

## Communication

- status page: <update template>
- internal: <Slack channel>
- customer: <when to notify>

## Post-incident

- log INC--<id> within 24h
- update this runbook if steps differed from reality

## See also

- <SLO-- this runbook responds to>
- <related RUNBOOK-->
