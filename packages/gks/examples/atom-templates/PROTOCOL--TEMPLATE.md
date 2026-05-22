---
id: PROTOCOL--TEMPLATE
phase: 2
type: protocol
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Interaction contract>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: high
summary: "Template for PROTOCOL atoms — Interaction contract"
tags: [protocol]
aliases:
  - PROTOCOL
  - agent_governance
  - Interaction contract
cluster: agent_governance
role: Interaction contract
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

# PROTOCOL — <Title>

## Interaction surface

Define the sequence and participants involved in this interaction. Who sends what to whom, and in what order?

```
1. <Participant A> ──→ <Participant B>:  <action / request>
2. <Participant B> ──→ <Participant A>:  <reply / response>
```

## Message shape

Detail the schema and wire format of the messages exchanged in this protocol (e.g. JSON schema, protobuf, or raw string format).

## Error semantics

Describe the error codes, messages, and behaviors when a step in the protocol fails (e.g. timeout, invalid signature, payload mismatch).

## Source

- <Link to the requirements, ADR, or conversation that established this protocol>
