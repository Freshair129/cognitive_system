---
id: CONCEPT--EPISTEMIC-STATES
phase: 1
type: concept
status: stable
tier: process
source_type: axiomatic
vault_id: default
title: Epistemic States — tracking confidence as first-class data
aliases:
  - belief confidence
  - knowledge truthiness
cluster: memory
role: Strategic intent / PRD
tags:
  - msp
  - memory
  - epistemology
  - confidence
  - truth
crosslinks:
  references:
    - CONCEPT--TIERED-MEMORY-DISTILLATION
    - CONCEPT--TAXONOMY-V2-3
created_at: 2026-05-19T10:15:00+07:00
---

# CONCEPT — Epistemic States

## Intent

To provide a machine-readable mechanism for tracking the **confidence** and **reliability** of knowledge independently of its structural document lifecycle status. This allows the system to distinguish between unverified assumptions and confirmed long-term beliefs.

## Philosophy

Knowledge is not binary (True/False) but exists on a gradient of confirmation. As more evidence accumulates, knowledge should move through predictable epistemic states. Conversely, if new evidence contradicts old beliefs, the state must be able to regress.

## State Taxonomy

| State | Meaning | Confidence | Behavior |
|---|---|---|---|
| `hypothesis` | Observed once; unverified | 0.40 – 0.69 | Treat as speculative; seek confirmation. |
| `confirmed` | Seen across multiple independent sessions | 0.70 – 1.00 | Treat as authoritative fact. |
| `contested` | Previously confirmed, now contradicted | any | Flag for review; do not use for critical decisions. |
| `deprecated` | Disproven or superseded | any | Retain for historical audit only; do not retrieve. |

## Decoupling from `status`

We explicitly decouple **Epistemic State** (Confidence) from **Document Status** (Lifecycle):

- **`status`** (e.g., `draft`, `active`, `stable`): Tracks the authority of the *document* itself. Controlled by the gatekeeper/human. Monotonic (never regresses).
- **`epistemic_state`** (e.g., `confirmed`, `contested`): Tracks the confidence in the *fact* described by the document. Controlled by the distiller. Non-monotonic (regresses on conflict).

## Guiding Principles

1. **Evidence-Based Promotion:** Knowledge only advances through states when independent source artifacts provide supporting evidence.
2. **Contradiction Sensitivity:** A single strong negative signal is enough to move knowledge into a `contested` state.
3. **Probabilistic Reasoning:** The numeric confidence score allows agents to apply different weights to knowledge during RAG fusion.

## Connections

- `[[CONCEPT--TIERED-MEMORY-DISTILLATION]]` — the pipeline that updates these states.
- `[[CONCEPT--BELIEF-REVISION]]` — the protocol for handling State regressions.
