---
id: ENDPOINT--TEMPLATE
phase: 2
type: endpoint
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <One API path / method>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for ENDPOINT atoms — One API path / method"
tags: [endpoint]
aliases:
  - ENDPOINT
  - implementation_flow
  - One API path / method
cluster: implementation_flow
role: One API path / method
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

# ENDPOINT — <Title>

## Contract

Provide a brief summary of what this API endpoint does, who consumes it, and its access rules.

## Request

Detail the request shape (query params, headers, request body schema).

```json
{
  "type": "object",
  "properties": {
    "username": { "type": "string" }
  },
  "required": ["username"]
}
```

## Response

Detail the success response shape (HTTP status, headers, body schema).

```json
{
  "status": 200,
  "body": {
    "id": "usr_123"
  }
}
```

## Errors

Detail the error responses (HTTP status, error codes, body schema).

## Source

- <Link to the OpenAPI spec, implementing controller file, or routing table>
