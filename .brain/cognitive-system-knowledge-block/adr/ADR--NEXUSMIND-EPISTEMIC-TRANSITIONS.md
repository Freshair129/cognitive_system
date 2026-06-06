---
id: ADR--NEXUSMIND-EPISTEMIC-TRANSITIONS
phase: 2
type: adr
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: "ADR — Nexusmind Epistemic State Transition Policy"
tags:
  - governance
  - epistemology
  - nexusmind
  - k-impact
crosslinks:
  references:
    - ADR--AGENT-WRITE-BOUNDARIES
    - CONCEPT--NEXUSMIND-THINKING-LEVELS
created_at: 2026-06-04T12:05:00+07:00
aliases:
  - ADR
cluster: implementation_flow
role: Architecture decision record
attributes:
  domain: knowledge-engine
---

# ADR — Nexusmind Epistemic State Transition Policy

## Context
Nexusmind N5 mode evaluates K-Impact to suggest promoting or downgrading the `status` of an atom. Directly modifying canonical files violates the human-review-gate principle.

## Decision
**Agents MUST NOT directly mutate atom `status` on disk.**

1.  **Inbound Proposals:** When a state shift is triggered (e.g., K-Impact suggests `draft` -> `stable`), the agent generates a `proposeInbound` request.
2.  **Review Queue:** The shift enters the MSP review queue for human validation.
3.  **Shadow State:** The cognitive layer may use the suggested state for the current session's reasoning, but must mark it as "candidate state".

## Consequences
- **Positive:** Prevents autonomous "fact-flipping" without oversight; maintains the audit trail.
- **Negative:** Increased latency for "learning" to be reflected in the canon.
