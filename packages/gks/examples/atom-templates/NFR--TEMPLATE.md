---
id: NFR--TEMPLATE
phase: 1
type: nfr
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Non-functional requirement>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: high
summary: "Template for NFR atoms — Non-functional requirement"
tags: [nfr]
aliases:
  - NFR
  - requirements
  - Non-functional requirement
cluster: requirements
role: Non-functional requirement
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

# NFR — <Title>

## Quality attribute

Describe the non-functional requirement statement. System **shall** maintain <metric> <comparator> <threshold> under <load / condition>.

## Verification

Explain how this non-functional requirement is verified (e.g. k6 load test, chaos test, security pen test).

## Source

- <Link to the REQ-- or CONCEPT-- that originated this requirement>
