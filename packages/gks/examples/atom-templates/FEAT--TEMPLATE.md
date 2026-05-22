---
id: FEAT--TEMPLATE
phase: 2
type: feat
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Feature spec>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: high
summary: "Template for FEAT atoms — Feature spec"
tags: [feat]
aliases:
  - FEAT
  - implementation_flow
  - Feature spec
cluster: implementation_flow
role: Feature spec
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

# FEAT — <Title>

## User-facing behaviour

Describe how the feature behaves from the user's perspective. Explain what happens under different states in plain language.

```ts
// Provide a small TypeScript / JS API example of how this feature is invoked if applicable
```

## Verification

### Acceptance criteria

- [ ] <observable behaviour 1>
- [ ] <observable behaviour 2>
- [ ] error case: <what happens on failure>

## Out of scope

- <related-but-deferred concerns>

## Source

- <Link to the requirements, CONCEPT, or issue that drove this feature spec>
