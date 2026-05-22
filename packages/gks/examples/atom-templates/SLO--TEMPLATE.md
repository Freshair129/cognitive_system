---
id: SLO--TEMPLATE
phase: 1
type: slo
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Service-level objective>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for SLO atoms — Service-level objective"
tags: [slo]
aliases:
  - SLO
  - ops
  - Service-level objective
cluster: ops
role: Service-level objective
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

# SLO — <Title>

## Indicator (SLI)

What is measured.

```
metric:    <e.g. http_requests_total successful / http_requests_total all>
window:    <e.g. rolling 30 days>
exclusion: <maintenance windows / known degradations>
```

## Target

```
objective: <e.g. 99.9% successful requests / month>
threshold: <e.g. error budget = 0.1% × monthly request volume>
```

## Alert thresholds

| Burn rate | Alert | Recipient |
|---|---|---|
| 14× (2h budget exhaustion) | page | on-call |
| 6× (24h) | page | on-call |
| 1× (30d) | ticket | team channel |

## Error budget policy

What happens when budget is exhausted:

- freeze non-critical deploys
- prioritise reliability work
- review at next retro

## Review cadence

- weekly: trend check
- quarterly: re-evaluate target

## See also

- <NFR-- this implements>
- <RUNBOOK-- triggered on breach>
