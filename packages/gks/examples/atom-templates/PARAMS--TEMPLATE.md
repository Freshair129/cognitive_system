---
id: PARAMS--TEMPLATE
phase: 2
type: params
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Constants / business config>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for PARAMS atoms — Constants / business config"
tags: [params]
aliases:
  - PARAMS
  - implementation_flow
  - Constants / business config
cluster: implementation_flow
role: Constants / business config
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

# PARAMS — <Title>

## Purpose

Describe the business rules or configuration context. Why do these parameters exist?
(e.g., "Tier limits for SaaS pricing plans", "Default timeout values for third-party integrations")

## Values / Thresholds

Use a table to define business-meaningful numbers, threshold lists, or configuration properties.

| Parameter Name | Value / Threshold | Description | Override Logic |
|---|---|---|---|
| `MAX_FREE_USERS` | 5 | Limit of free users per organization | Can be overridden per tenant in DB |
| `DEFAULT_TIMEOUT_MS` | 5000 | Baseline timeout for external APIs | Environment variable `API_TIMEOUT` |

## Data Shape / Schema (Optional)

If these parameters are passed as a structured object, define the JSON schema or TypeScript interface here.

```typescript
interface PricingParams {
  maxFreeUsers: number;
  defaultTimeoutMs: number;
}
```

## Update Policy

Who can change these parameters? Do they require a redeploy, or are they hot-reloaded from a database?

- **Storage:** Hardcoded / Database / Remote Config / Env Vars
- **Update Frequency:** Rarely / Monthly / Runtime
