---
id: GUARD--TEMPLATE
phase: 2
type: guard
status: draft
vault_id: default
tier: safety
source_type: axiomatic
title: <Structural / behavioural guardrail>
created_at: 2026-05-22T22:36:00.000+07:00
created_by: Rwang
last_modify: 2026-05-22T22:36:00.000+07:00
modify_by: Rwang
assign_to: ""
version: "0.1.0"
priority: medium
query_counter: 0
level: high
summary: "Template for GUARD atoms — Structural / behavioural guardrail"
tags: [guard, safety]
aliases:
  - GUARD
  - agent_governance
  - Structural / behavioural guardrail
cluster: agent_governance
role: Structural / behavioural guardrail
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

# GUARD — <Title>

## Constraint

State the rule precisely. "Agent must NEVER do X when Y."

## Rationale

Why this constraint exists. Reference the ADR / incident / regulation
that prompted it.

## Detection

How the violation is detected at runtime:

- input check: ...
- post-action audit: ...

## Enforcement

What happens on violation:

- block the action / rollback
- log to audit
- alert on-call
- agent is informed and cannot retry

## Examples

**Triggered:** `<concrete example that hits the rule>`
**Allowed:** `<concrete example that passes>`

## Bypass policy

Who can override (if anyone) and how. If no bypass, state explicitly.
