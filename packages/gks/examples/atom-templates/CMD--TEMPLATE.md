---
id: CMD--TEMPLATE
phase: 2
type: cmd
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Executable system command>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for CMD atoms — Executable system command"
tags: [cmd]
aliases:
  - CMD
  - agent_governance
  - Executable system command
cluster: agent_governance
role: Executable system command
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

# CMD — <Title>

## Execution

- **Command:** `npm run <script-name>` | `<binary-name> <args>`
- **Runtime:** <e.g. Node.js 22 | Python 3.12 | Shell>

## Arguments & Flags

| Flag | Type | Required | Description |
|---|---|---|---|
| `--help` | boolean | No | Show usage |
| `-v` | boolean | No | Verbose mode |
| `[input]` | string | Yes | Input file/path |

## Environment Variables

- `GEMINI_API_KEY`: <Description>
- `DEBUG`: <Description>

## Expected Outcome

- **Success:** <What happens on success (e.g. index generated)>
- **Failure:** <Common error codes and their meaning>

## Security & Access

- **Write Permission:** <Does it modify the filesystem?>
- **Network Access:** <Does it make external calls?>

## Usage Example

```bash
npm run msp:index -- --root ./gks
```
