---
id: CONCEPT--IDENTITY-EVOLUTION
phase: 1
type: concept
status: stable
tier: process
source_type: axiomatic
vault_id: default
title: Identity Evolution — the feedback loop between distilled beliefs and
  agent persona
aliases:
  - soul evolution
  - persona feedback loop
cluster: memory
role: Strategic intent / PRD
tags:
  - msp
  - memory
  - identity
  - persona
  - evolution
crosslinks:
  references:
    - CONCEPT--TIERED-MEMORY-DISTILLATION
    - CONCEPT--BELIEF-REVISION
    - SPEC--888-TIERED-MEMORY-DISTILLATION
created_at: 2026-05-20T11:00:00+07:00
---

# CONCEPT — Identity Evolution

## Intent

To close the cognitive loop between **observation** and **behavior**. Identity Evolution ensures that distilled long-term beliefs (Tier 3) actively inform the agent's persona and decision-making heuristics in future sessions, allowing the system to grow more aligned with its specific project context and user relationship over time.

## North Star

As the system processes more interaction cycles, the agent's "voice" and "choices" become increasingly personalized. It no longer starts every project from a generic blank slate but carries the "scars and wisdom" of its history into every new turn.

## The Evolution Loop

1. **Synthesize:** The distiller creates new Identity beliefs from narratives.
2. **Infect:** High-confidence beliefs are injected into the agent's system prompt (Preamble).
3. **Act:** The agent uses these beliefs to guide its reasoning.
4. **Observe:** The resulting behavior creates new session logs.
5. **Revise:** Subsequent distillation confirms or contests the effectiveness of these beliefs.

## Guiding Principles

1. **Preamble Dominance:** Identity beliefs carry higher priority in the context window than ephemeral session details.
2. **Slow Evolution:** Identity changes occur at the Core/Sphere cycle (every 8–64 sessions), preventing erratic persona shifts.
3. **Safety Anchors:** Core safety beliefs are "fixed" and provide a stable foundation that evolution cannot override.

## Expected Outcomes

- **Improved Alignment:** Agent better understands project-specific coding styles and governance rules.
- **Consistent Persona:** Agent maintains a stable "working relationship" across multiple days of interaction.
- **Reduced Hallucination:** Beliefs provide a "reality check" against speculative reasoning.

## Connections

- `[[CONCEPT--TIERED-MEMORY-DISTILLATION]]` — the source of evolution data.
- `[[CONCEPT--BELIEF-REVISION]]` — the mechanism that prevents "bad" evolution.
- `[[SPEC--888-TIERED-MEMORY-DISTILLATION]]` — the technical protocol.
