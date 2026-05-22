---
id: ENTITY--TEMPLATE
phase: 2
type: entity
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Data schema>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for ENTITY atoms — Data schema"
tags: [entity]
aliases:
  - ENTITY
  - implementation_flow
  - Data schema
cluster: implementation_flow
role: Data schema
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

# ENTITY — <Name>

## Schema definition

Describe the data schema (fields, types, indexing) using YAML, JSON Schema, or SQL table definition.

```yaml
fields:
  id:
    type: string
    required: true
    description: Primary key UUID.
```

## Relations

Detail structural relationships (e.g. foreign keys, associations, cardinalities with other ENTITY-- atoms).

## Source

- <Link to the requirements, database migration, or PR that introduced this entity>
