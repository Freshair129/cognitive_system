---
id: SKILL--TEMPLATE
phase: 2
type: skill
status: draft
vault_id: default
tier: process
source_type: axiomatic
title: <Agent capability>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: low
summary: "Template for SKILL atoms — Agent capability"
tags: [skill]
aliases:
  - SKILL
  - agent_governance
  - Agent capability
cluster: agent_governance
role: Agent capability
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

# SKILL — <Title>

## When to invoke

Describe the trigger — agent should reach for this skill when context
matches X. Be precise enough that the agent's policy can decide reliably
without ambiguity.

## Required tools

- `<tool-name-1>` — <why this skill needs it>
- `<tool-name-2>`

## Behaviour

1. <step 1>
2. <step 2>
3. <step 3>

## Guardrails referenced

- GUARDRAIL--<name> — <why this skill is bound by it>

## Output contract

What this skill returns / writes. Be specific so callers can parse.

## See also

- <related SKILL-- / FEAT-->
