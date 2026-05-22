---
id: MCP--TEMPLATE
phase: 2
type: mcp
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Model Context Protocol tool>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for MCP atoms — Model Context Protocol tool"
tags: [mcp]
aliases:
  - MCP
  - agent_governance
  - Model Context Protocol tool
cluster: agent_governance
role: Model Context Protocol tool
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

# MCP — <Tool Name>

## Tool Specification

- **Name:** `<snake_case_name>` (Must match MCP client expectations)
- **Description:** <Prompt-friendly description for the Agent>

## Arguments (JSON Schema)

```json
{
  "type": "object",
  "properties": {
    "arg1": { "type": "string", "description": "..." },
    "arg2": { "type": "number", "description": "..." }
  },
  "required": ["arg1"]
}
```

## Response Shape

- **Mime-type:** `application/json` | `text/plain`
- **Data:** <Description of the returned content>

## Security & Constraints

- **Auth Required:** <Yes/No>
- **Rate Limit:** <e.g. 60 requests/min>
- **Side-effects:** <Read-only | Mutates filesystem | External network>

## Example Interaction

> **Call:** `{"name": "...", "arguments": {"arg1": "value"}}`
> **Response:** `{"content": [{"type": "text", "text": "..."}]}`
