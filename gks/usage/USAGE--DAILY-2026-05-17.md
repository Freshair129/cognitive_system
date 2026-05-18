---
id: USAGE--DAILY-2026-05-17
phase: 6
type: usage
status: stable
tier: process
source_type: learned
vault_id: default
title: USAGE — Daily cost bucket 2026-05-17
aliases: &a1
  - USAGE
cluster: memory
role: Usage metrics rollup
tags: &a2
  - agents
  - usage
  - cost
  - daily
created_at: 2026-05-17T02:10:17.957Z
attributes:
  id: USAGE--DAILY-2026-05-17
  phase: 6
  type: usage
  status: stable
  tier: process
  source_type: learned
  vault_id: default
  title: USAGE — Daily cost bucket 2026-05-17
  aliases: *a1
  cluster: memory
  role: Usage metrics rollup
  tags: *a2
  created_at: 2026-05-17T02:10:17.957Z
  domain: usage
  language: markdown
  is_test: false
  is_entrypoint: false
  has_secret: false
  leak_risk: low
  encryption_level: none
---
# USAGE — Daily cost bucket 2026-05-17

Daily aggregate of dispatcher cost telemetry. See `SPEC--USAGE-ATOM` for the contract.

## Summary

<!-- USAGE-SUMMARY-START -->
```json
{
  "total_cost_usd": 0.0018613500000000001,
  "call_count": 10,
  "by_tier": {
    "T1": {
      "count": 0,
      "cost_usd": 0
    },
    "T2": {
      "count": 9,
      "cost_usd": 0.00076935
    },
    "T3": {
      "count": 1,
      "cost_usd": 0.001092
    }
  },
  "top_episodes": [],
  "updated_at": "2026-05-17T02:38:01.307Z"
}
```
<!-- USAGE-SUMMARY-END -->
